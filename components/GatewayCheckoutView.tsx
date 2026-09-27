import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { startCashfreeCheckout, useCashfreeCallback, PAYMENT_RETURN_DEEP_LINK } from '../app/(root)/utils/cashfreeCheckout';
import { ArrowLeft, Shield, Lock, CheckCircle, CreditCard } from 'lucide-react-native';

/**
 * PAYMENT_MODE = 'GATEWAY': self-serve online checkout through Cashfree.
 *
 * TWO ways to pay, chosen at tap time (2026-09-21):
 *
 * 1. NATIVE — the Cashfree React Native SDK's Drop checkout, restricted to UPI. A native
 *    page lists the UPI apps on the phone (GPay, PhonePe, Paytm…), cards, net banking, wallets.
 *    No browser, no website page in the middle, no deep link to come back through — three
 *    moving parts that each broke at least once while this was being built.
 * 2. BROWSER — the original flow: the website's /pay/:orderId page in an in-app browser
 *    tab, returning through the vaibhavvivaaha:// deep link. Kept as the FALLBACK for a
 *    build that does not contain the SDK's native half (an older dev client), and for any
 *    case where the SDK refuses to start.
 *
 * Either way the server is identical — createOrder prices the order from the plan id and
 * restricts it to UPI (order_meta.payment_methods) — and either way the outcome is decided
 * by PaymentReturn ASKING THE SERVER. The SDK's onVerify means "the attempt finished", not
 * "the money arrived"; Cashfree's own docs say the same.
 *
 * Rendered by PaymentScreen (plans) and AddOnPaymentScreen (Profile Boost).
 */
// Re-exported: PaymentReturn.tsx imports the deep link from here.
export { PAYMENT_RETURN_DEEP_LINK };

interface Props {
  title: string;
  priceLabel: string;      // already formatted, e.g. "₹4,999"
  periodLabel: string;     // e.g. "180 days" / "one-time"
  planId: string | null;   // null for add-ons
  purpose: 'SUBSCRIPTION' | 'BOOST_PURCHASE';
  encodedUserId: string | null;
  description?: string;
  onBack: () => void;
  popupError: (title: string, msg: string) => void;
}

const GatewayCheckoutView: React.FC<Props> = ({
  title, priceLabel, periodLabel, planId, purpose, encodedUserId, description, onBack, popupError,
}) => {
  const [busy, setBusy] = useState(false);
  // Cashfree's React Native guide: setCallback on mount, removeCallback on unmount.
  useCashfreeCallback('replace');

  const handlePay = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      // All of the checkout lives in utils/cashfreeCheckout — shared with the plan swiper.
      await startCashfreeCheckout({ encodedUserId, planId, purpose, onError: popupError });
    } finally {
      setBusy(false);
    }
  }, [busy, encodedUserId, planId, purpose, popupError]);

  return (
    <View style={s.container}>
      <SafeAreaView edges={['top']} style={s.headerSafe}>
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backButton} disabled={busy}>
            <ArrowLeft size={22} color="#475569" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Secure Payment</Text>
            <Text style={s.headerSubtitle}>PAY ONLINE · UPI, CARDS, NET BANKING</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.planCard}>
          <Text style={s.planLabel}>YOU ARE BUYING</Text>
          <Text style={s.planTitle}>{title}</Text>
          <View style={s.priceRow}>
            <Text style={s.price}>{priceLabel}</Text>
            {periodLabel ? <Text style={s.period}> / {periodLabel}</Text> : null}
          </View>
          {description ? <Text style={s.desc}>{description}</Text> : null}
        </View>

        <View style={s.infoCard}>
          {[
            'You will be taken to a secure Cashfree payment page.',
            'Pay with any UPI app, debit / credit card, net banking or wallet.',
            'Your membership activates automatically the moment payment succeeds.',
          ].map((line) => (
            <View key={line} style={s.infoRow}>
              <CheckCircle size={16} color="#16a34a" />
              <Text style={s.infoText}>{line}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[s.payBtn, busy && s.payBtnBusy]} onPress={handlePay} disabled={busy} activeOpacity={0.85}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CreditCard size={18} color="#fff" />
              <Text style={s.payBtnText}>Pay {priceLabel} securely</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={s.trustRow}>
          <Shield size={14} color="#64748b" />
          <Text style={s.trustText}>Payments processed by Cashfree Payments</Text>
          <Lock size={14} color="#64748b" />
        </View>
        <Text style={s.fineprint}>
          We never see your card number or UPI PIN. If the app doesn't return automatically after
          paying, come back here — your plan is activated on our servers, not on this screen.
        </Text>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerSafe: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  headerTitle: { fontSize: 18, fontFamily: 'Rubik-Bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 10, fontFamily: 'Rubik-Medium', color: '#64748b', letterSpacing: 1, marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 40 },
  planCard: { backgroundColor: '#420001', borderRadius: 18, padding: 22, marginBottom: 16 },
  planLabel: { color: '#F6B733', fontSize: 10, fontFamily: 'Rubik-Bold', letterSpacing: 1.5 },
  planTitle: { color: '#fff', fontSize: 24, fontFamily: 'Rubik-ExtraBold', marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
  price: { color: '#fff', fontSize: 30, fontFamily: 'Rubik-ExtraBold' },
  period: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'Rubik-Medium' },
  desc: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: 'Rubik-Regular', marginTop: 10, lineHeight: 19 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  infoText: { flex: 1, color: '#334155', fontSize: 13.5, fontFamily: 'Rubik-Regular', lineHeight: 20 },
  payBtn: { backgroundColor: '#420001', borderRadius: 28, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  payBtnBusy: { opacity: 0.75 },
  payBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Rubik-Bold' },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  trustText: { color: '#64748b', fontSize: 12, fontFamily: 'Rubik-Medium' },
  fineprint: { color: '#94a3b8', fontSize: 11.5, fontFamily: 'Rubik-Regular', textAlign: 'center', marginTop: 12, lineHeight: 17 },
});

export default GatewayCheckoutView;
