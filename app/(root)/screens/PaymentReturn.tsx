import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { CheckCircle, XCircle, Clock, AlertTriangle, Hourglass } from 'lucide-react-native';
import userApi from '../api/userApi';
import { useUserData } from '../contexts/UserDataContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { APP_WEB_ORIGIN } from '../../../constants/data';
import { PAYMENT_RETURN_DEEP_LINK } from '../../../components/GatewayCheckoutView';

/**
 * Landing screen after a Cashfree checkout. Reached two ways:
 *   - GatewayCheckoutView does router.replace here when the browser session ends, and
 *   - the website's /payment/return page deep-links to vaibhavvivaaha://screens/PaymentReturn.
 *
 * Route param: order_id. The screen only polls GET /payments/cashfree/order/{id}/status; the
 * backend (webhook or its Get-Order fast-path) is what actually activates the plan.
 */
type State = 'checking' | 'paid' | 'failed' | 'expired' | 'pending' | 'error' | 'cancelled' | 'notstarted';

const POLL_MS = 2500;
const MAX_POLLS = 16; // ~40 s

/**
 * Payment statuses that mean the attempt is REALLY over. Anything else — above all
 * PENDING — is still in flight.
 *
 * 🔴 This used to be "any status that is not SUCCESS", after two polls. UPI sits at
 * PENDING for a while by design: with a collect request the member has to open their
 * UPI app and approve it, which takes far longer than the five seconds two polls
 * allow. So a payment that was about to succeed was announced as "Payment not
 * completed" — the one message most likely to make somebody pay a second time.
 * It matters more now that UPI is the only method offered.
 */
const TERMINAL_FAILURES = ['FAILED', 'USER_DROPPED', 'CANCELLED', 'VOID'];

/**
 * Member-facing reason for a failed payment. `failureReason` on the order is Cashfree's
 * error_description passed through the bank ("Transaction failed at the remitter bank
 * U30|Z9…") — useful in the log, unreadable on a phone, and occasionally alarming. So it is
 * only ever used to PICK one of these sentences; the raw text is never rendered.
 */
function friendlyFailure(order: any): string {
  const status = String(order?.paymentStatus || '').toUpperCase();
  const raw = String(order?.failureReason || '').toLowerCase();
  const none = ' Nothing is charged for a failed attempt.';
  if (status === 'USER_DROPPED' || status === 'CANCELLED' || /cancel|dropped|abandon/.test(raw))
    return 'The payment was cancelled before it finished.' + none;
  if (/insufficient|balance|limit exceed|exceeds/.test(raw))
    return 'Your account did not have enough balance, or the amount is over your limit.' + none;
  if (/pin|otp|authenticat|3ds|incorrect|invalid (card|cvv|expiry|vpa|upi)/.test(raw))
    return 'The details or PIN/OTP entered were not accepted. Please check them and try again.' + none;
  if (/time|expire|no response|not respond/.test(raw))
    return 'The payment timed out before your bank confirmed it.' + none;
  if (/declin|reject|not permitted|blocked|risk|restricted/.test(raw))
    return 'Your bank declined this payment. Please try another payment method or contact your bank.' + none;
  if (/bank|issuer|remitter|beneficiary|npci|psp|down|unavailable|technical/.test(raw))
    return 'Your bank or UPI app is having trouble right now. Please try again in a little while or use another method.' + none;
  return 'The payment did not go through.' + none;
}

export default function PaymentReturn() {
  const params = useLocalSearchParams();
  const orderId = String(params.order_id || params.orderId || '');
  // Set by the native checkout when the member backed out of the payment sheet without
  // paying. It changes ONE thing: how long we look before believing them.
  const cancelledHint = String(params.cancelled || '') === '1';
  // Set when the SDK reported that the payment page never really started (see
  // classifySdkError). Like `cancelled`, it only shortens how long we look.
  const sdkError = String(params.sdk_error || '');
  const { userData } = useUserData();
  const [state, setState] = useState<State>('checking');
  const [order, setOrder] = useState<any>(null);
  const [message, setMessage] = useState('');
  const polls = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const { refreshSubscription } = useSubscription() || {};
  // 'paid' only says the MONEY arrived. `applying` covers the gap until the app itself is
  // holding the new plan, so the member never leaves this screen still gated as before.
  const [applying, setApplying] = useState(false);

  const check = useCallback(async () => {
    if (!alive.current) return;
    polls.current += 1;
    try {
      const res = await userApi.getCashfreeOrderStatus(orderId, userData?.userId || null);
      if (!alive.current) return;
      const body = res?.data;
      const d = body?.data;
      if (body?.code !== 200 || !d) {
        console.log('[payment-return] status refused:', body?.code, body?.message);
        setState('error');
        setMessage('We could not find this payment. If money was debited, your plan activates automatically — no action needed.');
        return;
      }
      setOrder(d);
      if (d.orderStatus === 'PAID' || d.fulfilled) { setState('paid'); return; }
      if (d.orderStatus === 'EXPIRED' || d.orderStatus === 'TERMINATED') { setState('expired'); return; }
      // `return` — this is terminal, exactly like PAID and EXPIRED above. Without it the
      // screen showed the failure but kept polling for the full 40s, and every poll made the
      // server call Cashfree: one failed payment produced ~29 Get Order calls and 59 log rows.
      if (d.paymentStatus && TERMINAL_FAILURES.includes(String(d.paymentStatus).toUpperCase())) {
        setState('failed');
        return;
      }
      // Backed out of the sheet: the server has been asked (above) and says nothing was
      // paid and nothing failed, so there was no attempt. Say "cancelled" now rather than
      // polling for forty seconds over an order nobody tried to pay. If they DID pay in the
      // UPI app and only then closed the sheet, the two branches above already caught it —
      // and the webhook plus the nightly check still settle anything slower than this.
      // A PENDING attempt is not a cancellation, so it keeps polling like any other.
      if (cancelledHint && !d.paymentStatus) { setState('cancelled'); return; }
      // Same reasoning for an SDK fault: the server confirms no attempt exists, so stop here.
      if (sdkError && !d.paymentStatus) { setState('notstarted'); return; }
      if (polls.current < MAX_POLLS) timer.current = setTimeout(check, POLL_MS);
      else setState((prev) => (prev === 'failed' ? prev : 'pending'));
    } catch (e: any) {
      if (!alive.current) return;
      if (polls.current < MAX_POLLS) timer.current = setTimeout(check, POLL_MS);
      else { setState('error'); setMessage('Network error while confirming your payment.'); }
    }
  }, [orderId, userData?.userId, cancelledHint, sdkError]);

  useEffect(() => {
    alive.current = true;
    polls.current = 0;
    if (!orderId) { setState('error'); setMessage('No order reference was provided.'); return; }
    check();
    return () => { alive.current = false; if (timer.current) clearTimeout(timer.current); };
  }, [orderId, check]);

  // Paid → pull the new plan into the app BEFORE offering a way out (2026-09-20). This screen
  // used to show "your plan is now active" and send the member to Home still holding the
  // old plan in memory; nothing refreshed it until an app restart.
  //
  // The order can read PAID a moment before the webhook has written the subscription row,
  // so ask a few times until the plan we hold matches the one that was bought. Bounded on
  // purpose: if it never matches, the member is released anyway — the plan_changed socket
  // event and the foreground refresh will still land it. Never trap someone who has paid.
  useEffect(() => {
    if (state === 'failed' && order?.failureReason) console.log('[payment-return] failure:', order.paymentStatus, '|', order.failureReason);
  }, [state, order?.failureReason, order?.paymentStatus]);

  useEffect(() => {
    if (state !== 'paid' || !refreshSubscription) return;
    let cancelled = false;
    const wanted = String(order?.planTitle || '').toLowerCase();
    const isBoostOrder = order?.purpose === 'BOOST_PURCHASE';
    (async () => {
      setApplying(true);
      for (let attempt = 0; attempt < 6 && !cancelled; attempt++) {
        const fresh = await refreshSubscription('payment-success', true).catch(() => null);
        const have = String(fresh?.planTitle || '').toLowerCase();
        // A boost changes credits, not the plan title — one successful refresh is enough.
        if (fresh && (isBoostOrder || !wanted || (have && (wanted.includes(have) || have.includes(wanted))))) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) setApplying(false);
    })();
    return () => { cancelled = true; };
  }, [state, order?.planTitle, order?.purpose, refreshSubscription]);

  const goHome = () => router.replace('/(root)/(tabs)' as any);
  const goProfile = () => router.replace('/(root)/(tabs)/profile' as any);
  const retry = async () => {
    setState('checking');
    polls.current = 0;
    await WebBrowser.openAuthSessionAsync(`${APP_WEB_ORIGIN}/pay/${encodeURIComponent(orderId)}`, PAYMENT_RETURN_DEEP_LINK, { showInRecents: true });
    check();
  };
  const checkAgain = () => { setState('checking'); polls.current = 0; check(); };

  const isBoost = order?.purpose === 'BOOST_PURCHASE';
  const title = order?.planTitle || 'your membership';

  return (
    <SafeAreaView style={s.container}>
      <View style={s.card}>
        {state === 'checking' && (
          <>
            <ActivityIndicator size="large" color="#420001" style={{ marginBottom: 16 }} />
            <Text style={s.h1}>Confirming your payment…</Text>
            <Text style={s.p}>This usually takes a few seconds.</Text>
          </>
        )}

        {state === 'paid' && (
          <>
            <CheckCircle size={56} color="#16a34a" style={{ marginBottom: 12 }} />
            <Text style={[s.h1, { color: '#166534' }]}>Payment successful</Text>
            <Text style={s.p}>
              {isBoost
                ? 'Your Profile Boost credit has been added. Head to your profile and boost now!'
                : `Your ${title} plan is now active. Enjoy your premium benefits!`}
            </Text>
            <TouchableOpacity
              style={[s.btn, applying && { opacity: 0.6 }]}
              disabled={applying}
              onPress={isBoost ? goProfile : goHome}
            >
              {applying ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  <Text style={s.btnText}>Unlocking your features…</Text>
                </View>
              ) : (
                <Text style={s.btnText}>{isBoost ? 'Go to my profile' : 'Start exploring'}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {state === 'cancelled' && (
          <>
            <XCircle size={56} color="#94a3b8" style={{ marginBottom: 12 }} />
            <Text style={s.h1}>Payment cancelled</Text>
            <Text style={s.p}>You left before paying, so nothing has been charged. You can try again whenever you like.</Text>
            <TouchableOpacity style={s.btn} onPress={goHome}><Text style={s.btnText}>Back to Home</Text></TouchableOpacity>
          </>
        )}

        {state === 'notstarted' && (
          <>
            <AlertTriangle size={56} color="#f59e0b" style={{ marginBottom: 12 }} />
            <Text style={s.h1}>{sdkError === 'no_upi_app' ? 'No UPI app found' : 'Payment could not start'}</Text>
            <Text style={s.p}>
              {sdkError === 'no_upi_app'
                ? 'There is no UPI app on this phone. You can pay by card instead, or install a UPI app and try again. Nothing has been charged.'
                : 'The payment page did not open, so nothing has been charged. Please try again. If it keeps happening, update the app to the latest version.'}
            </Text>
            <TouchableOpacity style={s.btn} onPress={goHome}><Text style={s.btnText}>Back to Home</Text></TouchableOpacity>
          </>
        )}

        {state === 'failed' && (
          <>
            <XCircle size={56} color="#dc2626" style={{ marginBottom: 12 }} />
            <Text style={[s.h1, { color: '#b91c1c' }]}>Payment not completed</Text>
            <Text style={s.p}>{friendlyFailure(order)}</Text>
            <TouchableOpacity style={s.btn} onPress={goHome}><Text style={s.btnText}>Back to Home</Text></TouchableOpacity>
          </>
        )}

        {state === 'expired' && (
          <>
            <Hourglass size={56} color="#f59e0b" style={{ marginBottom: 12 }} />
            <Text style={s.h1}>This payment has expired</Text>
            <Text style={s.p}>Please choose your plan again to start a fresh payment.</Text>
            <TouchableOpacity style={s.btn} onPress={() => router.back()}><Text style={s.btnText}>Choose plan</Text></TouchableOpacity>
          </>
        )}

        {state === 'pending' && (
          <>
            <Clock size={56} color="#f59e0b" style={{ marginBottom: 12 }} />
            <Text style={s.h1}>Still confirming</Text>
            <Text style={s.p}>
              Your bank hasn't confirmed yet. If money was debited, your plan activates automatically
              within a few minutes and we'll notify you — no action needed.
            </Text>
            <TouchableOpacity style={s.btn} onPress={checkAgain}><Text style={s.btnText}>Check again</Text></TouchableOpacity>
            <TouchableOpacity style={s.btnGhost} onPress={goHome}><Text style={s.btnGhostText}>Go to home</Text></TouchableOpacity>
          </>
        )}

        {state === 'error' && (
          <>
            <AlertTriangle size={56} color="#dc2626" style={{ marginBottom: 12 }} />
            <Text style={s.h1}>Something went wrong</Text>
            <Text style={s.p}>{message}</Text>
            <TouchableOpacity style={s.btn} onPress={goHome}><Text style={s.btnText}>Go to home</Text></TouchableOpacity>
          </>
        )}

        {orderId ? <Text style={s.ref}>Order {orderId}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 26, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  h1: { fontSize: 20, fontFamily: 'Rubik-Bold', color: '#0f172a', textAlign: 'center' },
  p: { fontSize: 14, fontFamily: 'Rubik-Regular', color: '#475569', textAlign: 'center', lineHeight: 21, marginTop: 8 },
  btn: { marginTop: 22, backgroundColor: '#420001', borderRadius: 28, paddingVertical: 14, paddingHorizontal: 28, alignSelf: 'stretch', alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: 'Rubik-Bold', fontSize: 15 },
  btnGhost: { marginTop: 10, borderRadius: 28, paddingVertical: 12, paddingHorizontal: 28, alignSelf: 'stretch', alignItems: 'center', borderWidth: 1.5, borderColor: '#420001' },
  btnGhostText: { color: '#420001', fontFamily: 'Rubik-Bold', fontSize: 15 },
  ref: { marginTop: 18, fontSize: 11, color: '#94a3b8', fontFamily: 'Rubik-Regular' },
});
