import AsyncStorage from "@react-native-async-storage/async-storage";
import userApi from "../api/userApi";

/**
 * How long a cached `masterData` blob is trusted.
 *
 * ⚠ Before this existed the cache NEVER expired. Home only called loadMasterData when
 * `HomepageBottomBanner` was absent, so once a member had the blob they kept that copy until
 * they logged out (logout wipes storage) or reinstalled. Editing a keyValue row therefore
 * reached new installs and nobody else — which defeats the point of keeping this content in
 * the database instead of the bundle.
 *
 * 6h is a deliberate middle: these lists (banners, districts, education, star, dosham, income,
 * interest tags) change rarely, and a stale banner for part of a day is cheaper than every
 * cold start re-fetching a list that has not moved.
 */
export const MASTER_DATA_TTL_MS = 6 * 60 * 60 * 1000;

/** Written beside the blob. A missing key means a cache from before the TTL existed. */
export const MASTER_DATA_FETCHED_AT = "masterDataFetchedAt";

/**
 * True when the cache is missing, older than the TTL, or from a build that never stamped it.
 * ⚠ A stamp in the FUTURE also counts as stale — a device whose clock was wrong when the
 * stamp was written would otherwise never refresh again.
 */
export const isMasterDataStale = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(MASTER_DATA_FETCHED_AT);
    const at = raw ? Number(raw) : 0;
    if (!Number.isFinite(at) || at <= 0) return true;
    const age = Date.now() - at;
    return age < 0 || age > MASTER_DATA_TTL_MS;
  } catch {
    return true;                       // unreadable storage: prefer a fetch over stale content
  }
};

export const loadMasterData = async (setMasterData: any) => {
  // Castes/subcastes are fetched alongside the keyValue lists because `setMasterData` replaces
  // the whole cached `masterData` blob — leaving them out here would silently drop whatever
  // MasterDataContext had already merged in.
  const [res, casteRes, subcasteRes] = await Promise.all([
    userApi.getAllKeyValues(),
    userApi.getAllCaste().catch(() => null),
    userApi.getAllActiveSubcastes().catch(() => null),
  ]);
  const map: any = {};

  res.data.data.forEach((item: any) => {
    map[item.keyColumn] = JSON.parse(item.valueColumn);
  });

  // Backend returns HTTP 200 even on business failures — check the body's `code` explicitly.
  if (casteRes?.data?.code === 200 && Array.isArray(casteRes.data.data)) {
    map.castes = casteRes.data.data;
  }
  if (subcasteRes?.data?.code === 200 && Array.isArray(subcasteRes.data.data)) {
    map.subcastes = subcasteRes.data.data;
  }

  AsyncStorage.setItem("masterData", JSON.stringify(map));
  // Stamped only after a SUCCESSFUL fetch — a failed one must not start the clock, or a
  // network blip would buy a stale cache another 6 hours.
  AsyncStorage.setItem(MASTER_DATA_FETCHED_AT, String(Date.now()));
  setMasterData(map);
};

/** @deprecated use useSubscription().refreshSubscription — see subscriptionContext.tsx */
export const loadUserSubscription = async (userId: string, setSubscription: any) => {
  try {
    const res = await userApi.getActiveUserSubscriptionByUserId(userId);
    if (res.data?.code === 200 && res.data?.data) {
      setSubscription(res.data.data);
    } else {
      // 404 / no active subscription → user is on Free plan
      setSubscription({
        planTitle: 'Free',
        subscriptionId: null,
        startDate: null,
        endDate: null,
        entitlements: {},
      });
    }
  } catch (e) {
    // A failed request must NOT downgrade the member to Free — keep whatever plan is held.
    // (No callers as of 2026-09-20: SubscriptionProvider.refreshSubscription owns this now.
    // Left in place, made safe, in case something re-wires it.)
  }
};

