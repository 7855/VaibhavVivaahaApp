import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import userApi from '../api/userApi';

// Mirrors backend CLAUDE.md section 7.1 / subscription_plans row order — used to figure out
// which plans count as an "upgrade" from whatever the user currently holds.
//
// IMPORTANT: this table must keep ALL six tiers forever, including any the client later
// deactivates (`subscription_plans.isActive = 'N'`). Existing Starter/Classic subscribers stay on
// their plan after deactivation, and every rank/tier/badge comparison in the app still has to
// place them correctly. Deactivation only affects which plans are *purchasable* (see
// getActivePlansSync/isPlanActive below), never which plans are *recognised*.
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

// Marketing bullet copy per tier. `subscription_plans` has no per-plan feature-bullet column, so
// this stays client-side and is joined onto whatever the backend returns by title. A title absent
// from this map (a brand-new tier the client adds in the DB) simply renders with no bullets —
// it still appears and is still purchasable, which is what keeps the DB the source of truth.
// Same copy as PremiumTab.tsx's plan cards, so the assisted "talk to a Relationship Manager"
// flow (RelationshipManagerView.tsx) shows the user exactly what they're signing up for.
const FEATURES_BY_TITLE: Record<string, string[]> = {
  Starter: ['Advanced filters — education, income & more', '15 interest requests', 'See who viewed you (last 5)', 'View all profile photos'],
  Classic: ['50 interest requests', 'See full profile details & all photos', 'See phone & personal contact info', 'See who viewed you (last 20)'],
  Silver: ['Unlimited interest requests', 'Chat directly with families', 'Full profile & contact visibility', 'Appear higher in search results'],
  Gold: ['Everything in Silver', 'Jathagam compatibility check', 'Verified badge on your profile', 'Priority search placement'],
  Platinum: ['All Gold features', 'Family-to-family direct chat', 'Share profiles via WhatsApp', 'Active until your wedding day'],
};

// Offline fallback ONLY — used when the live /subscriptionPlans/getAllActivePlans call fails AND
// the AsyncStorage cache is empty (e.g. very first launch with no connectivity). Real DB-verified
// pricing per CLAUDE.md section 7. The purchasable plan list is otherwise always driven by the
// backend, so deactivating a plan in the DB (isActive='N') removes it from the app with no code
// change and no release.
export const FALLBACK_UPGRADE_PLANS: UpgradePlanOption[] = [
  {
    title: 'Starter', price: '₹499', period: '30 days', tagline: 'முதல் அடி எடுங்கள்',
    features: FEATURES_BY_TITLE.Starter,
  },
  {
    title: 'Classic', price: '₹999', period: '90 days', tagline: 'தெளிவான தேர்வு',
    features: FEATURES_BY_TITLE.Classic,
  },
  {
    title: 'Silver', price: '₹2,499', period: '90 days', tagline: 'இதயம் திறக்கும் நேரம்',
    features: FEATURES_BY_TITLE.Silver,
  },
  {
    title: 'Gold', price: '₹4,999', period: '180 days', tagline: 'தங்க வாழ்க்கை தொடர்புகள்',
    features: FEATURES_BY_TITLE.Gold,
  },
  {
    title: 'Platinum', price: '₹9,999', period: 'Until marriage', tagline: 'திருமணம் வரை நம்மோட உதவி',
    features: FEATURES_BY_TITLE.Platinum,
  },
];

/* ------------------------------------------------------------------------------------------- *
 * Active-plan catalog
 *
 * The client toggles `subscription_plans.isActive` in MySQL to open/close a tier for sale. That
 * flip must be the ONLY action needed — everything the user sees (the upgrade picker, the RM
 * plan summary, every "Upgrade to X or above to …" message) resolves through this catalog, so it
 * follows the DB in both directions on the next refresh, with no app release.
 *
 * Caching mirrors the `paymentModeCache` pattern above and `quickAccessMenuCache` in
 * components/QuickAccessFAB.tsx: a module-level memory copy for synchronous reads during render,
 * backed by AsyncStorage so the very first paint after a cold start still has real data.
 * ------------------------------------------------------------------------------------------- */

const ACTIVE_PLANS_CACHE_KEY = 'activePlansCache';
const ACTIVE_PLANS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes — plan availability changes rarely.

// In-memory copy, read synchronously by getActivePlansSync() during render.
let memoryPlans: UpgradePlanOption[] | null = null;

/**
 * Indian-grouped currency formatting (₹2,499 / ₹1,25,000). Done by hand rather than via
 * `toLocaleString('en-IN')` because Hermes' Intl support for non-default locales isn't guaranteed
 * across all the Android/iOS builds this app ships to — a silent fallback to plain grouping would
 * show the wrong separator placement for lakh-scale numbers.
 */
function formatIndianCurrency(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const digits = String(rounded);
  let grouped: string;
  if (digits.length <= 3) {
    grouped = digits;
  } else {
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3);
    grouped = `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
  }
  return `₹${value < 0 ? '-' : ''}${grouped}`;
}

function mapRowToPlanOption(row: any): UpgradePlanOption {
  const title = String(row?.title ?? '').trim();
  const price = formatIndianCurrency(parseFloat(row?.price ?? '0') || 0);
  // `period` is the human label the admin set on the row (e.g. "/30 days"); strip a leading slash
  // since this list renders it as a standalone value, not appended to a price. Fall back to the
  // numeric duration when the label is blank.
  const rawPeriod = String(row?.period ?? '').trim().replace(/^\/+/, '');
  const durationDays = Number(row?.durationDays ?? row?.duration_days ?? 0);
  const period = rawPeriod || (durationDays > 0 ? `${durationDays} days` : '');
  return {
    title,
    price,
    period,
    tagline: String(row?.tagline ?? ''),
    // The backend has no per-plan marketing bullets, so they stay client-side. A plan title that
    // isn't in the map (i.e. a brand-new tier the client adds in the DB) still renders correctly —
    // it just shows no bullet list rather than breaking the screen.
    features: FEATURES_BY_TITLE[title] ?? [],
  };
}

/**
 * Fetches the live active-plan list, updates the memory + AsyncStorage caches, and returns it.
 * Never throws — on any failure it logs and returns whatever the caches/fallback can offer, so no
 * caller can crash on a plans-API outage.
 */
export async function refreshPlanCatalog(): Promise<UpgradePlanOption[]> {
  try {
    const res = await userApi.getAllActivePlans();
    // This backend returns HTTP 200 even on business failures (see CLAUDE.md section 17) — the
    // real status lives in the body's `code`, so axios resolving is not proof of success.
    if (res?.data?.code !== 200) {
      console.warn('[upgradeNavigation] getAllActivePlans returned a non-200 body code:', res?.data?.code, res?.data?.message);
      return getActivePlansSync();
    }
    const rows = res?.data?.data;
    if (!Array.isArray(rows) || rows.length === 0) {
      console.warn('[upgradeNavigation] getAllActivePlans returned no plan rows; keeping the previous catalog.');
      return getActivePlansSync();
    }
    const plans = rows.map(mapRowToPlanOption).filter((p) => !!p.title);
    if (plans.length === 0) {
      console.warn('[upgradeNavigation] getAllActivePlans rows had no usable titles; keeping the previous catalog.');
      return getActivePlansSync();
    }
    memoryPlans = plans;
    try {
      await AsyncStorage.setItem(ACTIVE_PLANS_CACHE_KEY, JSON.stringify({
        plans, expiresAt: Date.now() + ACTIVE_PLANS_CACHE_TTL,
      }));
    } catch (e) {
      console.warn('[upgradeNavigation] Failed to persist activePlansCache:', (e as any)?.message || e);
    }
    return plans;
  } catch (e) {
    console.warn('[upgradeNavigation] getAllActivePlans failed, falling back to cache/defaults:', (e as any)?.message || e);
    return getActivePlansSync();
  }
}

/**
 * Call once at app start (fire-and-forget). Seeds the memory cache from AsyncStorage so the first
 * synchronous read already has real data, then refreshes from the network in the background.
 */
export async function initPlanCatalog(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(ACTIVE_PLANS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // An expired entry is still better than the hardcoded fallback for first paint — the
      // background refresh below replaces it moments later either way.
      if (Array.isArray(parsed?.plans) && parsed.plans.length > 0 && !memoryPlans) {
        memoryPlans = parsed.plans as UpgradePlanOption[];
      }
    }
  } catch (e) {
    console.warn('[upgradeNavigation] Failed to read activePlansCache:', (e as any)?.message || e);
  }
  // Deliberately not awaited by callers — never block render on this.
  refreshPlanCatalog().catch(() => { });
}

/** Synchronous read for render paths: memory cache → AsyncStorage-seeded copy → hardcoded fallback. */
export function getActivePlansSync(): UpgradePlanOption[] {
  if (memoryPlans && memoryPlans.length > 0) return memoryPlans;
  return FALLBACK_UPGRADE_PLANS;
}

/** True when `title` is currently purchasable (present in the live active-plan catalog). */
export function isPlanActive(title: string): boolean {
  if (!title) return false;
  return getActivePlansSync().some((p) => p.title === title);
}

/**
 * Maps an entitlement floor onto a plan the user can actually buy today.
 *
 * Call sites pass the REAL floor from the backend planFeatures matrix (e.g. 'Starter' for
 * "view full profiles") and that argument must never change — it encodes the entitlement, not the
 * marketing. This resolves it to the lowest currently-active plan at or above that rank, so with
 * Starter + Classic deactivated a 'Starter' floor displays as "Silver", and re-activating Starter
 * in the DB puts it back to "Starter" on the next catalog refresh.
 */
export function resolveMinPlanTitle(minPlan?: string): string {
  const paid = getActivePlansSync()
    .map((p) => ({ title: p.title, rank: PLAN_RANK[p.title] ?? 99 }))
    .filter((p) => p.rank > PLAN_RANK.Free)
    .sort((a, b) => a.rank - b.rank);

  // Catalog unknown/empty (no active paid plan at all) — leave the caller's floor untouched
  // rather than inventing a tier name.
  if (paid.length === 0) return minPlan || 'Premium';

  const minRank = (minPlan && PLAN_RANK[minPlan]) || PLAN_RANK.Starter;
  const atOrAbove = paid.find((p) => p.rank >= minRank);
  // Nothing at or above the floor is on sale — point at the highest active paid plan, which is
  // the closest thing to the requested entitlement the user can actually buy.
  return (atOrAbove ?? paid[paid.length - 1]).title;
}

/** Standard upsell copy: `Upgrade to <lowest active qualifying plan> or above to <actionPhrase>.` */
export function upgradeMessage(actionPhrase: string, minPlan?: string): string {
  return `Upgrade to ${resolveMinPlanTitle(minPlan)} or above to ${actionPhrase}.`;
}

/** Hook for screens that render the plan list: seeds synchronously, then refreshes on mount. */
export function useActivePlans(): { plans: UpgradePlanOption[]; loading: boolean } {
  const [plans, setPlans] = useState<UpgradePlanOption[]>(() => getActivePlansSync());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    refreshPlanCatalog()
      .then((fresh) => {
        if (!cancelled) setPlans(fresh);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { plans, loading };
}

const PAYMENT_MODE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes — same key/TTL as PaymentScreen.tsx

// This decides which SCREEN a user lands on (self-serve QR checkout vs. the assisted "contact us"
// picker) — unlike PaymentScreen.tsx, there's no second chance to correct course once that
// navigation happens. It previously returned an up-to-5-minute-old cached value without ever
// re-checking the network, so flipping PAYMENT_MODE in the admin panel could leave users routed
// to the stale destination for up to 5 minutes after the change. Always fetch fresh now; the
// cache is only a fallback if the network call itself fails, and still gets written so
// PaymentScreen.tsx's own optimistic first-paint has something recent to show.
export async function resolvePaymentMode(): Promise<'QR' | 'CONTACT'> {
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
