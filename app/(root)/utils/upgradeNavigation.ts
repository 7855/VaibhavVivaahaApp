import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import userApi from '../api/userApi';

// Mirrors backend CLAUDE.md section 7.1 / subscription_plans row order — used to figure out
// which plans count as an "upgrade" from whatever the user currently holds.
export const PLAN_RANK: Record<string, number> = {
  Free: 1,
  Starter: 2,
  Classic: 3,
  Silver: 4,
  Gold: 5,
  Platinum: 6,
};

export interface UpgradePlanOption {
  title: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
}

// Real DB-verified pricing (see CLAUDE.md section 7) — kept here rather than fetched, since this
// screen is a lightweight "pick one, raise a request" picker, not the full plan-comparison list.
// `features` mirrors the same bullet copy used on PremiumTab.tsx's plan cards, so a user picking a
// plan through the assisted "talk to a Relationship Manager" flow (RelationshipManagerView.tsx)
// sees exactly what they're signing up for, not just a bare price.
export const ALL_UPGRADE_PLANS: UpgradePlanOption[] = [
  {
    title: 'Starter', price: '₹499', period: '30 days', tagline: 'முதல் அடி எடுங்கள்',
    features: ['Advanced filters — education, income & more', '15 interest requests', 'See who viewed you (last 5)', 'View all profile photos'],
  },
  {
    title: 'Classic', price: '₹999', period: '90 days', tagline: 'தெளிவான தேர்வு',
    features: ['50 interest requests', 'See full profile details & all photos', 'See phone & personal contact info', 'See who viewed you (last 20)'],
  },
  {
    title: 'Silver', price: '₹2,499', period: '90 days', tagline: 'இதயம் திறக்கும் நேரம்',
    features: ['Unlimited interest requests', 'Chat directly with families', 'Full profile & contact visibility', 'Appear higher in search results'],
  },
  {
    title: 'Gold', price: '₹4,999', period: '180 days', tagline: 'தங்க வாழ்க்கை தொடர்புகள்',
    features: ['Everything in Silver', 'Jathagam compatibility check', 'Verified badge on your profile', 'Priority search placement'],
  },
  {
    title: 'Platinum', price: '₹9,999', period: 'Until marriage', tagline: 'திருமணம் வரை நம்மோட உதவி',
    features: ['All Gold features', 'Family-to-family direct chat', 'Share profiles via WhatsApp', 'Active until your wedding day'],
  },
];

const PAYMENT_MODE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes — same key/TTL as PaymentScreen.tsx

// This decides which SCREEN a user lands on (self-serve QR checkout vs. the assisted "contact us"
// picker) — unlike PaymentScreen.tsx, there's no second chance to correct course once that
// navigation happens. It previously returned an up-to-5-minute-old cached value without ever
// re-checking the network, so flipping PAYMENT_MODE in the admin panel could leave users routed
// to the stale destination for up to 5 minutes after the change. Always fetch fresh now; the
// cache is only a fallback if the network call itself fails, and still gets written so
// PaymentScreen.tsx's own optimistic first-paint has something recent to show.
async function resolvePaymentMode(): Promise<'QR' | 'CONTACT'> {
  try {
    const modeRes = await userApi.getPaymentMode();
    let mode: 'QR' | 'CONTACT' = 'CONTACT'; // Play Store-safe fallback
    if (modeRes?.data?.data?.valueColumn) {
      try {
        const parsed = JSON.parse(modeRes.data.data.valueColumn);
        if (parsed?.mode === 'QR' || parsed?.mode === 'CONTACT') mode = parsed.mode;
        else console.warn('[upgradeNavigation] PAYMENT_MODE value has an unexpected shape:', modeRes.data.data.valueColumn);
      } catch (e) {
        console.warn('[upgradeNavigation] Failed to parse PAYMENT_MODE valueColumn:', modeRes.data.data.valueColumn, e);
      }
    } else {
      console.warn('[upgradeNavigation] No PAYMENT_MODE data in response, defaulting to CONTACT. Response:', JSON.stringify(modeRes?.data));
    }
    await AsyncStorage.setItem('paymentModeCache', JSON.stringify({
      mode, expiresAt: Date.now() + PAYMENT_MODE_CACHE_TTL,
    }));
    return mode;
  } catch (e) {
    console.warn('[upgradeNavigation] getPaymentMode failed, falling back to cache/CONTACT:', (e as any)?.message || e);
    // Network failure — fall back to the last known-good value rather than always forcing
    // CONTACT, so a brief connectivity blip doesn't wrongly bounce QR-mode users to the
    // assisted picker.
    try {
      const cached = await AsyncStorage.getItem('paymentModeCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.mode) return parsed.mode;
      }
    } catch {}
    return 'CONTACT';
  }
}

/**
 * Builds the `onUpgrade` callback for a `popup.premiumRequired(message, onUpgrade)` call.
 *
 * - Already-paid users (any plan above Free) have no self-serve "upgrade my existing plan"
 *   checkout anywhere in the app — the only purchase flow is a Free user's first buy. So for them
 *   we always go to the assisted "pick a plan, raise a request, admin follows up" screen,
 *   regardless of PAYMENT_MODE.
 * - Free users go to the real plan list (self-serve) when PAYMENT_MODE is QR, since PremiumTab →
 *   PaymentScreen already renders the QR/UPI checkout in that mode. When PAYMENT_MODE is CONTACT
 *   (Play Store-safe default), even a first-time Free purchase has no self-serve checkout, so they
 *   land on the same assisted picker instead of a plan list that dead-ends at a form anyway.
 */
export function buildUpgradeAction(opts: {
  planTitle?: string | null;
  featureName: string;
  minPlan?: string;
}) {
  const { planTitle, featureName, minPlan } = opts;
  return async () => {
    const isPaid = !!planTitle && planTitle !== 'Free';
    if (isPaid) {
      router.push({
        pathname: '/(root)/screens/UpgradePlanScreen',
        params: { featureName, minPlan: minPlan || '' },
      });
      return;
    }
    const mode = await resolvePaymentMode();
    if (mode === 'CONTACT') {
      router.push({
        pathname: '/(root)/screens/UpgradePlanScreen',
        params: { featureName, minPlan: minPlan || '', freeUser: '1' },
      });
    } else {
      router.push('/(root)/screens/PremiumTab' as any);
    }
  };
}
