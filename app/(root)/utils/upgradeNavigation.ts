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
}

// Real DB-verified pricing (see CLAUDE.md section 7) — kept here rather than fetched, since this
// screen is a lightweight "pick one, raise a request" picker, not the full plan-comparison list.
export const ALL_UPGRADE_PLANS: UpgradePlanOption[] = [
  { title: 'Starter', price: '₹499', period: '30 days', tagline: 'முதல் அடி எடுங்கள்' },
  { title: 'Classic', price: '₹999', period: '90 days', tagline: 'தெளிவான தேர்வு' },
  { title: 'Silver', price: '₹2,499', period: '90 days', tagline: 'இதயம் திறக்கும் நேரம்' },
  { title: 'Gold', price: '₹4,999', period: '180 days', tagline: 'தங்க வாழ்க்கை தொடர்புகள்' },
  { title: 'Platinum', price: '₹9,999', period: 'Until marriage', tagline: 'திருமணம் வரை நம்மோட உதவி' },
];

const PAYMENT_MODE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes — same key/TTL as PaymentScreen.tsx

// Same cache key PaymentScreen.tsx already reads/writes, so both stay in sync — whichever one
// hits the network first "primes" it for the other.
async function resolvePaymentMode(): Promise<'QR' | 'CONTACT'> {
  try {
    const cached = await AsyncStorage.getItem('paymentModeCache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.expiresAt && Date.now() < parsed.expiresAt && parsed.mode) {
        return parsed.mode;
      }
    }
  } catch {}

  try {
    const modeRes = await userApi.getPaymentMode();
    let mode: 'QR' | 'CONTACT' = 'CONTACT'; // Play Store-safe fallback
    if (modeRes?.data?.data?.valueColumn) {
      try {
        const parsed = JSON.parse(modeRes.data.data.valueColumn);
        if (parsed?.mode === 'QR' || parsed?.mode === 'CONTACT') mode = parsed.mode;
      } catch {}
    }
    await AsyncStorage.setItem('paymentModeCache', JSON.stringify({
      mode, expiresAt: Date.now() + PAYMENT_MODE_CACHE_TTL,
    }));
    return mode;
  } catch {
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
