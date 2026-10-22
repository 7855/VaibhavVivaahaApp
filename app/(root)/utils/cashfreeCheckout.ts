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
 *             CFPaymentGatewayService.doPayment(dropPayment)   ← full page: UPI apps, cards, net banking
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
 *                  member can still pay by card or net banking.
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

/**
 * Which Cashfree page the app opens. 'WEB' = Cashfree's hosted web checkout inside the app
 * (doWebPayment) — chosen 2026-10-06 for its design. 'DROP' = the native Drop screens
 * (doPayment), the previous default. Everything else — order creation, the in-flight slot,
 * callbacks, PaymentReturn — is identical for both, so switching back is this one line.
 * ⚠️ Verify UPI app hand-off on a Play-installed build before relying on 'WEB'.
 */
const CHECKOUT_UI: 'WEB' | 'DROP' = 'WEB';

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
// ── ONE checkout at a time, app-wide ─────────────────────────────────────────────
// The slot is claimed the moment startCashfreeCheckout() begins (BEFORE the order is
// created, so two taps racing the network cannot both mint orders) and released only when
// the attempt is SETTLED: the SDK callback (onVerify/onError — the one true signal that the
// payment sheet is finished with), any failure before doPayment, or the backstop below.
//
// 🔴 Why "settled" and not "started": doPayment is fire-and-forget, so the old flow released
// the screen's guard the instant the Cashfree activity was LAUNCHING. On a slow phone that
// native transition is several hundred ms of tappable plan list — a second Continue → Proceed
// in that window started a second checkout. With server-side order reuse removed (client,
// 2026-09-28) that would have been two payable orders. Holding until the callback closes it.
//
// Backstop: the SDK always calls back when its activity finishes (cancel arrives as
// action_cancelled), so this only matters if the sheet vanished without one. While the sheet
// is UP the member cannot tap the app anyway, so firing early there is harmless — the later
// callback still navigates; settleInFlight() is idempotent.
const IN_FLIGHT_BACKSTOP_MS = 45_000;
let inFlight: { orderId: string | null; settle: () => void; timer: ReturnType<typeof setTimeout> } | null = null;

export function isCheckoutInFlight(): boolean {
  return inFlight !== null;
}

function claimInFlight(): { promise: Promise<void> } | null {
  if (inFlight) return null;
  let settle: () => void = () => {};
  const promise = new Promise<void>((resolve) => { settle = resolve; });
  const timer = setTimeout(() => {
    console.log('[checkout] in-flight backstop fired for', inFlight?.orderId);
    settleInFlight();
  }, IN_FLIGHT_BACKSTOP_MS);
  inFlight = { orderId: null, settle, timer };
  return { promise };
}

function settleInFlight(): void {
  if (!inFlight) return;
  clearTimeout(inFlight.timer);
  const { settle } = inFlight;
  inFlight = null;
  settle();
}

// ── Callback registration: a STACK of mounted screens, not one screen's lifetime ─────────
// CFPaymentGatewayService holds a single global callback. Registering on mount and removing
// on unmount (the guide's structure) is right for one screen, but PremiumTab can be mounted
// TWICE (the membership page's "Upgrade my plan" pushes a second one). Each mount overwrote
// the other's registration and either unmount REMOVED it — so the surviving screen had no
// callback, the result was dropped, and (now) the in-flight slot would sit until the
// backstop. The stack keeps the guide's mount/unmount shape while guaranteeing that whatever
// screen is left still owns a live registration. onVerify/onError can both fire for one
// order, and the closure is re-applied on every stack change, so the dedupe is module-level.
type NavigateHow = 'push' | 'replace';
const subscribers: Array<{ navigate: NavigateHow }> = [];
let lastSettledOrderId = '';

function applyTopSubscriber(): void {
  const gateway = getGateway();
  if (!gateway) return;                   // Expo Go: nothing to register on
  const top = subscribers[subscribers.length - 1];
  try {
    if (!top) { gateway.removeCallback(); return; }
    const finish = (orderID: string, outcome: SdkOutcome) => {
      if (!orderID || lastSettledOrderId === orderID) return;
      lastSettledOrderId = orderID;
      settleInFlight();                   // release the slot BEFORE navigating
      goToConfirm(top.navigate, orderID, outcome);
    };
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
}

export function useCashfreeCallback(navigate: NavigateHow = 'replace'): void {
  useEffect(() => {
    const me = { navigate };
    subscribers.push(me);
    applyTopSubscriber();
    return () => {
      const k = subscribers.indexOf(me);
      if (k >= 0) subscribers.splice(k, 1);
      applyTopSubscriber();               // re-arm for whichever screen remains, or clear
    };
  }, [navigate]);
}

/** Step 1 + Step 2 of the guide. The screen calling this must also call useCashfreeCallback(). */
/** The guide's Step 1 + Step 2. Returns true only once doPayment has been handed a session. */
async function openCheckout(req: CheckoutRequest): Promise<boolean> {
  // Checked BEFORE the order is created: an order made here could never be paid, and it would
  // sit ACTIVE until the nightly job expired it.
  if (!getGateway()) {
    console.log('[checkout] no native SDK in this build (Expo Go) — checkout not started');
    req.onError(
      'Not available here',
      'Payments need the installed app. Please use the app from the store, or a development build.'
    );
    return false;
  }
  const { encodedUserId, planId, purpose, onError } = req;

  if (!encodedUserId) {
    onError('Login required', 'Please log in again to continue with the payment.');
    return false;
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
      return false;
    }
  } catch (e: any) {
    console.log('[checkout] createOrder failed:', e?.response?.status, e?.response?.data?.message || e?.message);
    onError('Network error', 'Please check your connection and try again.');
    return false;
  }

  // ── Step 2: open the payment page — the guide's UPI Intent Checkout sample ──
  try {
    if (inFlight) inFlight.orderId = data.orderId;
    const session = new CFSession(
      data.paymentSessionId,
      data.orderId,
      String(data.env || '').toLowerCase() === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX
    );
    // Only colours can be themed — Cashfree owns the layout, fonts and tiles. Matched to the app:
    // the navy top bar is the auth screens' step-banner navy, the Pay button is the app's CTA
    // blue, text uses the app's ink/slate, and the page sits on the app's light surface.
    // Android passes the whole theme to Cashfree's native parser; the iOS bridge applies every
    // colour EXCEPT the background (its own source never reads it), so iOS keeps Cashfree's white.
    const theme = new CFThemeBuilder()
      .setNavigationBarBackgroundColor('#1c2b3f')
      .setNavigationBarTextColor('#FFFFFF')
      .setButtonBackgroundColor('#1F7FE5')
      .setButtonTextColor('#FFFFFF')
      .setPrimaryTextColor('#0f1724')
      .setSecondaryTextColor('#64748b')
      .setBackgroundColor('#F3F7FA')
      .build();

    // DROP checkout — Cashfree's full native payment PAGE: the UPI apps on the phone and
    // "Pay with UPI ID", then cards and net banking, in one screen. This is what the client
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
    // by card or net banking instead — one reason those sections exist.
    // Sections shown on the page, in this order (client 2026-09-21): UPI first (cheapest and
    // what most members use), then cards and net banking. DELIBERATELY NOT added: WALLET
    // (removed 2026-09-29 — little use at these prices, and the wallet page was the flakiest
    // in testing), EMI, PAY_LATER, PAYPAL. The server sends the matching
    // order_meta.payment_methods (upi,dc,cc,nb), and the ORDER is what really decides —
    // a section listed here that the order does not allow simply does not appear.
    const components = new CFPaymentComponentBuilder()
      .add(CFPaymentModes.UPI)
      .add(CFPaymentModes.CARD)
      .add(CFPaymentModes.NB)
      .build();
    if (CHECKOUT_UI === 'WEB') {
      // Cashfree's hosted WEB checkout, opened by the SDK inside the app. Same session, same
      // onVerify/onError callback, same server confirmation — only the page differs. The
      // client found the native Drop screens' design poor (2026-10-06); the web page is
      // Cashfree's maintained checkout and takes its branding from the Cashfree dashboard,
      // not from `theme`. Methods shown still come from the ORDER (payment_methods).
      console.log('[checkout] doWebPayment | order', data.orderId, '| env', String(data.env || 'sandbox'));
      getGateway().doWebPayment(session);
      return true;
    }
    const dropPayment = new CFDropCheckoutPayment(session, components, theme);
    console.log('[checkout] doPayment (Drop: UPI, CARD, NB) | order', data.orderId, '| env', String(data.env || 'sandbox'));
    getGateway().doPayment(dropPayment);
    return true;
  } catch (e: any) {
    console.log('[checkout] doPayment failed:', e?.message);
    onError('Could not open payment', 'Please update the app to the latest version and try again.');
    return false;
  }
}

/**
 * Start a checkout and hold the app-wide slot until the attempt is SETTLED. Resolves when the
 * SDK callback fires (or the backstop), so a caller's `finally` — the overlay, the button's
 * busy state — now spans the whole payment sheet, not just its launch. A second call while
 * one is in flight is a duplicate tap and is ignored silently: no order, no popup.
 */
export async function startCashfreeCheckout(req: CheckoutRequest): Promise<void> {
  const slot = claimInFlight();
  if (!slot) {
    console.log('[checkout] ignored: a checkout is already in flight');
    return;
  }
  let opened = false;
  try {
    opened = await openCheckout(req);
  } finally {
    if (!opened) settleInFlight();        // nothing to wait for — release immediately
  }
  if (opened) await slot.promise;         // settled by the SDK callback / backstop
}

export default {};
