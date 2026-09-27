/**
 * Cashfree checkout — written to follow Cashfree's React Native guide step for step:
 * https://www.cashfree.com/docs/payments/online/mobile/react-native  ("UPI Intent Checkout")
 *
 *   Step 1  Create an order on the SERVER            → userApi.createCashfreeOrder
 *   Step 2  Open the payment page on the client      → startCashfreeCheckout()
 *             new CFSession(payment_session_id, order_id, environment)
 *             new CFThemeBuilder()…build()
 *             new CFPaymentComponentBuilder().add(CFPaymentModes.UPI).build()
 *             new CFDropCheckoutPayment(session, components, theme)
 *             CFPaymentGatewayService.doPayment(dropPayment)   ← full page: UPI apps, cards, net banking, wallets
 *           with the callback set when the screen MOUNTS and removed when it UNMOUNTS,
 *           exactly as the guide's sample component does           → useCashfreeCallback()
 *   Step 3  Confirm the payment from the SERVER      → the PaymentReturn screen
 *
 * Nothing else. No alternative flows, no settings, no browser fallback — the guide's flow only.
 * (The guide's sample imports from 'react-native-cashfree-pg-api'; the package its own install
 * command adds, and the one in package.json, is 'react-native-cashfree-pg-sdk'.)
 */
import { useEffect } from 'react';
import { NativeModules } from 'react-native';
import { router } from 'expo-router';
import {
  CFDropCheckoutPayment,
  CFEnvironment,
  CFPaymentComponentBuilder,
  CFPaymentModes,
  CFSession,
  CFThemeBuilder,
} from 'cashfree-pg-api-contract';
import userApi from '../api/userApi';
import { APP_SCHEME } from '../../../constants/data';

// Still exported: PaymentReturn's browser retry and the website's return page use it.
export const PAYMENT_RETURN_DEEP_LINK = `${APP_SCHEME}://screens/PaymentReturn`;

/**
 * The SDK is loaded LAZILY, and only when its native half is actually present.
 *
 * ⚠ NEVER import 'react-native-cashfree-pg-sdk' at the top of this file. On iOS the package
 * builds a NativeEventEmitter as it is imported, which THROWS when the native module is
 * missing — and a throw at import time takes down every screen that touches this module, not
 * just the payment button. That is what stopped the app opening in Expo Go: Expo Go carries a
 * fixed set of native modules and cannot contain this one.
 *
 * `NativeModules.CashfreePgApi` is the honest test for "was this app built with the SDK".
 * Present  → a dev build or a release APK: the real native checkout runs, unchanged.
 * Absent   → Expo Go: everything else in the app works and only paying is unavailable.
 *
 * The package stays in package.json and in both native projects. Nothing is removed.
 */
function getGateway(): any | null {
  if (!NativeModules.CashfreePgApi) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-cashfree-pg-sdk')?.CFPaymentGatewayService ?? null;
  } catch (e: any) {
    console.log('[checkout] SDK present natively but failed to load:', e?.message);
    return null;
  }
}

/** True in Expo Go, false in any build that carries the SDK. */
export function isNativeCheckoutAvailable(): boolean {
  return !!getGateway();
}

export interface CheckoutRequest {
  encodedUserId: string | null;
  planId: string | null;                 // null for add-ons
  purpose: 'SUBSCRIPTION' | 'BOOST_PURCHASE';
  onError: (title: string, message: string) => void;
}

/**
 * What the SDK's onError really means. Cashfree's documented error codes fall into three
 * groups, and only ONE of them is about a payment that was attempted:
 *
 *   cancelled    — the member backed out (action_cancelled). Nothing was tried.
 *   no_upi_app   — NO_UPI_APP_AVAILABLE: no UPI app on the phone. Nothing was tried; the
 *                  member can still pay by card, net banking or wallet.
 *   not_started  — every *_MISSING / INVALID_* / WRONG_CALLING_CONTEXT code. These are
 *                  INTEGRATION faults (bad session, missing object): the page never opened,
 *                  so there is no payment to wait for. The member sees a plain "could not
 *                  start" — the code itself goes to the log only, it means nothing to them.
 *   attempted    — anything else (a declined / failed / timed-out payment). The SERVER is
 *                  asked what happened, as for a success.
 *
 * Before 2026-09-21 only "cancel" was recognised, so a not_started error sent the member to
 * PaymentReturn to poll for forty seconds and then read "Still confirming — if money was
 * debited…" about a payment that had never begun.
 */
export type SdkOutcome = 'verify' | 'cancelled' | 'no_upi_app' | 'not_started' | 'attempted';

const SDK_NOT_STARTED_CODES = [
  'MISSING_CALLBACK', 'ORDER_ID_MISSING', 'SESSION_OBJECT_MISSING', 'PAYMENT_OBJECT_MISSING',
  'ENVIRONMENT_MISSING', 'ORDER_TOKEN_MISSING', 'CARD_EMI_TENURE_MISSING', 'INVALID_UPI_APP_ID_SENT',
  'INVALID_PAYMENT_OBJECT_SENT', 'WALLET_OBJECT_MISSING', 'NETBANKING_OBJECT_MISSING',
  'UPI_OBJECT_MISSING', 'CARD_OBJECT_MISSING', 'INVALID_WEB_DATA', 'CHANNEL_MISSING',
  'CARD_NUMBER_MISSING', 'CARD_EXPIRY_MONTH_MISSING', 'CARD_EXPIRY_YEAR_MISSING', 'CARD_CVV_MISSING',
  'UPI_ID_MISSING', 'WALLET_CHANNEL_MISSING', 'WALLET_PHONE_MISSING', 'NB_BANK_CODE_MISSING',
  'WRONG_CALLING_CONTEXT', 'NO_EMI_PLAN_AVAILABLE',
];

export function classifySdkError(error: any): SdkOutcome {
  let code = '', msg = '';
  try { code = String(error?.getCode?.() ?? error?.code ?? ''); } catch { /* not a CFErrorResponse */ }
  try { msg = String(error?.getMessage?.() ?? error?.message ?? ''); } catch { /* same */ }
  const c = code.toUpperCase();
  if (`${c} ${msg}`.toLowerCase().includes('cancel')) return 'cancelled';
  if (c === 'NO_UPI_APP_AVAILABLE') return 'no_upi_app';
  if (SDK_NOT_STARTED_CODES.includes(c)) return 'not_started';
  return 'attempted';
}

/**
 * Step 3 hand-off. The guide: "You must always verify payment status from your server."
 * So BOTH callbacks land on PaymentReturn, which asks our server; the callback itself is
 * never treated as proof of payment.
 */
function goToConfirm(how: 'push' | 'replace', orderId: string, outcome: SdkOutcome) {
  const target = {
    pathname: '/(root)/screens/PaymentReturn',
    params: {
      order_id: orderId,
      ...(outcome === 'cancelled' ? { cancelled: '1' } : {}),
      ...(outcome === 'no_upi_app' || outcome === 'not_started' ? { sdk_error: outcome } : {}),
    },
  } as any;
  if (how === 'push') router.push(target); else router.replace(target);
}

/**
 * The guide's componentDidMount / componentWillUnmount pair, as a hook:
 *
 *   componentDidMount()    { CFPaymentGatewayService.setCallback({ onVerify, onError }) }
 *   componentWillUnmount() { CFPaymentGatewayService.removeCallback() }
 *
 * Call it at the top of any screen that starts a payment. `navigate` is how that screen wants
 * to reach PaymentReturn: 'push' for a screen the member should come BACK to (the plan swiper,
 * so "Try again" returns to the plans), 'replace' for a throwaway checkout screen.
 */
export function useCashfreeCallback(navigate: 'push' | 'replace' = 'replace'): void {
  useEffect(() => {
    let settled = '';                     // onVerify and onError can both fire for one order
    const finish = (orderID: string, outcome: SdkOutcome) => {
      if (!orderID || settled === orderID) return;
      settled = orderID;
      goToConfirm(navigate, orderID, outcome);
    };
    const gateway = getGateway();
    if (!gateway) return;                 // Expo Go: nothing to listen to, and nothing to clean up
    try {
      gateway.setCallback({
        onVerify(orderID: string): void {
          finish(orderID, 'verify');
        },
        onError(error: any, orderID: string): void {
          // Backing out of the sheet arrives here with code `action_cancelled`. That is not a
          // failed payment, and PaymentReturn says "cancelled" instead of polling for it.
          const outcome = classifySdkError(error);
          // The raw code and message are for US. Members never see them.
          console.log('[checkout] onError', orderID, '|', outcome, '|', error?.getCode?.(), '|', error?.getMessage?.());
          finish(orderID, outcome);
        },
      });
    } catch (e: any) {
      // Only reachable on a build that lacks the SDK's native half (setCallback is a native call).
      console.log('[checkout] setCallback failed:', e?.message);
    }
    return () => {
      try { gateway.removeCallback(); } catch { /* nothing registered */ }
    };
  }, [navigate]);
}

/** Step 1 + Step 2 of the guide. The screen calling this must also call useCashfreeCallback(). */
export async function startCashfreeCheckout(req: CheckoutRequest): Promise<void> {
  // Checked BEFORE the order is created: an order made here could never be paid, and it would
  // sit ACTIVE until the nightly job expired it.
  if (!getGateway()) {
    console.log('[checkout] no native SDK in this build (Expo Go) — checkout not started');
    req.onError(
      'Not available here',
      'Payments need the installed app. Please use the app from the store, or a development build.'
    );
    return;
  }
  const { encodedUserId, planId, purpose, onError } = req;

  if (!encodedUserId) {
    onError('Login required', 'Please log in again to continue with the payment.');
    return;
  }

  // ── Step 1: create the order on our server (it holds the secret key and sets the price) ──
  let data: any;
  try {
    const res = await userApi.createCashfreeOrder(encodedUserId, {
      planId: purpose === 'SUBSCRIPTION' ? planId : null,
      purpose,
      // Tells the server to omit return_url. The SDK's in-app browser cannot open a custom
      // scheme, so a redirect leaves the member on "Webpage not available" AFTER a successful
      // payment. The SDK callback below is what navigates to PaymentReturn.
      channel: 'SDK',
    });
    const body = res?.data;
    data = body?.data;
    if (body?.code !== 200 || !data?.orderId || !data?.paymentSessionId) {
      const m: string = body?.message || '';
      if (m === 'PAYMENT_GATEWAY_DISABLED') {
        onError('Payment unavailable', 'Online payment is temporarily unavailable. Please try again in a little while.');
      } else if (m === 'PROFILE_NOT_APPROVED') {
        onError('Profile under review', 'You can upgrade once your profile has been approved.');
      } else if (m.startsWith('SUBSCRIPTION_PLAN_INACTIVE')) {
        onError('Plan unavailable', 'This plan is no longer offered. Please choose another plan.');
      } else {
        // Any other server answer is a Java-side message, not member copy. Log it, say this.
        console.log('[checkout] createOrder refused:', body?.code, m);
        onError('Could not start payment', 'Something went wrong on our side. Please try again in a moment.');
      }
      return;
    }
  } catch (e: any) {
    console.log('[checkout] createOrder failed:', e?.response?.status, e?.response?.data?.message || e?.message);
    onError('Network error', 'Please check your connection and try again.');
    return;
  }

  // ── Step 2: open the payment page — the guide's UPI Intent Checkout sample ──
  try {
    const session = new CFSession(
      data.paymentSessionId,
      data.orderId,
      String(data.env || '').toLowerCase() === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX
    );
    // Setting theme is optional
    const theme = new CFThemeBuilder()
      .setNavigationBarBackgroundColor('#1F7FE5') // ios
      .setNavigationBarTextColor('#FFFFFF') // ios
      .setButtonBackgroundColor('#1F7FE5') // ios
      .setButtonTextColor('#FFFFFF') // ios
      .setPrimaryTextColor('#0f1724')
      .setSecondaryTextColor('#64748b') // ios
      .build();

    // DROP checkout — Cashfree's full native payment PAGE: the UPI apps on the phone and
    // "Pay with UPI ID", then cards, net banking and wallets, in one screen. This is what the client
    // saw working first and asked to have back (2026-09-21). The guide's other sample,
    // doUPIPayment, opens only a bare "Select UPI Application" list — on the client's phone
    // that list came up EMPTY, with no UPI ID and no QR, i.e. not a payment page at all.
    // (CFDropCheckoutPayment / CFPaymentComponentBuilder / CFPaymentModes are the very
    // classes the guide's sample component imports; the RN bridge maps doPayment to
    // DropPaymentParser.getDropCheckoutPayment.)
    // ⚠️ "Pay with UPI ID" (UPI COLLECT) is on its way out and must not be relied on: NPCI has
    // mandated it be discontinued for merchant payments, and Cashfree has BLOCKED it on
    // Android and desktop since 2026-02-28 (iOS is temporarily exempt). It still shows on
    // SANDBOX, which is misleading — on production Android, Cashfree removes it from its own
    // pages. Our flow does not depend on it: the UPI app buttons are UPI INTENT, which is the
    // flow NPCI and Cashfree tell merchants to use on mobile. A member with no UPI app pays
    // by card, net banking or wallet instead — one reason those sections exist.
    // Sections shown on the page, in this order (client 2026-09-21): UPI first (cheapest and
    // what most members use), then cards, net banking and wallets (Amazon Pay, PhonePe wallet,
    // Paytm…). DELIBERATELY NOT added: EMI, PAY_LATER, PAYPAL. The server sends the matching
    // order_meta.payment_methods (upi,dc,cc,nb,app), and the ORDER is what really decides —
    // a section listed here that the order does not allow simply does not appear.
    const components = new CFPaymentComponentBuilder()
      .add(CFPaymentModes.UPI)
      .add(CFPaymentModes.CARD)
      .add(CFPaymentModes.NB)
      .add(CFPaymentModes.WALLET)
      .build();
    const dropPayment = new CFDropCheckoutPayment(session, components, theme);
    console.log('[checkout] doPayment (Drop: UPI, CARD, NB, WALLET) | order', data.orderId, '| env', String(data.env || 'sandbox'));
    getGateway().doPayment(dropPayment);
  } catch (e: any) {
    console.log('[checkout] doPayment failed:', e?.message);
    onError('Could not open payment', 'Please update the app to the latest version and try again.');
  }
}

export default {};
