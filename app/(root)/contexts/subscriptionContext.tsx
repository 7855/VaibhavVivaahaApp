import React, { createContext, useReducer, useContext, useEffect, useCallback, useMemo, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Toast, ALERT_TYPE } from "react-native-alert-notification";
import userApi from "../api/userApi";
import { webSocketService } from "../services/webSocketService";
import { useUserData } from "./UserDataContext";
import { setSubscriptionRefreshHandler } from "../utils/subscriptionRefreshBus";

// The shape every "no active subscription" answer collapses to.
const FREE_PLAN = {
  planTitle: "Free",
  subscriptionId: null,
  startDate: null,
  endDate: null,
  entitlements: {},
};

// Signal-style triggers (foreground, reconnect, a 403) can arrive in bursts; one request per
// this window is plenty. A forced refresh (plan_changed, payment success) ignores it.
const MIN_REFRESH_GAP_MS = 3000;

const SubscriptionContext = createContext<any>(null);

const initialState = {
  entitlements: {},
  planTitle: null,
  subscriptionId: null,
  startDate: null,
  endDate: null
};

/**
 * True when a cached subscription has passed its endDate.
 *
 * The backend already expires subscriptions nightly (SubscriptionSchedulerService), but the app
 * restores this blob from AsyncStorage on every launch and used to trust it verbatim — so an
 * expired member kept their old plan's entitlements in the UI indefinitely, until some other
 * screen happened to refresh it. Compared on date only: a plan valid "until the 20th" should
 * still work all day on the 20th, not stop at the moment it was purchased.
 */
function isSubscriptionExpired(data: any): boolean {
  if (!data?.endDate) return false; // no endDate (e.g. Free/lifetime) never expires
  const end = new Date(data.endDate);
  if (isNaN(end.getTime())) return false; // unparseable — don't strip access on bad data
  const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  return endOfDay.getTime() < Date.now();
}

function subscriptionReducer(state: any, action: any) {
  switch (action.type) {
    case "SET_SUBSCRIPTION":
      return { 
        ...state, 
        ...action.payload,
        entitlements: action.payload.entitlements || {},
        planTitle: action.payload.planTitle || null,
        subscriptionId: action.payload.subscriptionId || null,
        startDate: action.payload.startDate || null,
        endDate: action.payload.endDate || null
      };
    case "CLEAR_SUBSCRIPTION":
      return initialState;
    default:
      return state || initialState; // Return initial state if state is undefined
  }
}

// ... existing imports

export const SubscriptionProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);

  // Load subscription data from storage on mount
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const stored = await AsyncStorage.getItem("subscriptionData");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (isSubscriptionExpired(parsed)) {
            // Drop the stale blob rather than restoring it, so gating falls back to Free until
            // a fresh refreshSubscription() confirms the real state with the server.
            await AsyncStorage.removeItem("subscriptionData");
            dispatch({ type: "CLEAR_SUBSCRIPTION" });
          } else {
            dispatch({ type: "SET_SUBSCRIPTION", payload: parsed });
          }
        }
      } catch (error) {
        console.error("Failed to load subscription data:", error);
      }
    };
    
    loadSubscription();
  }, []);

  // Save subscription data to storage when it changes
  const setSubscription = useCallback(async (payload: any) => {
    try {
      const data = JSON.stringify(payload);
      await AsyncStorage.setItem("subscriptionData", data);
      dispatch({ type: "SET_SUBSCRIPTION", payload });
    } catch (error) {
      console.error("Failed to save subscription data:", error);
    }
  }, []);

  const clearSubscription = useCallback(async () => {
    try {
      await AsyncStorage.removeItem("subscriptionData");
      dispatch({ type: "CLEAR_SUBSCRIPTION" });
    } catch (error) {
      console.error("Failed to clear subscription data:", error);
    }
  }, []);

  // ───────────────────────── refreshSubscription ─────────────────────────
  // THE way the app learns its plan (2026-09-20). Rule, same as chat sync: the server's REST
  // answer is the only source of truth; everything else — a socket event, a push, a 403, the
  // app coming back to the foreground — is merely a SIGNAL to ask again. So a missed or
  // repeated signal is harmless.
  //
  // Until this existed, only Home fetched the plan, once, when it loaded. A plan changed by
  // an admin or a payment was invisible until a restart or a fresh login rebuilt Home.
  const { userData } = useUserData();
  const decodedUserId = userData?.decodedUserId || null;

  const userIdRef = useRef<string | null>(null);
  const inFlightRef = useRef<Promise<any> | null>(null);
  const runAgainRef = useRef(false);
  const lastRunRef = useRef(0);
  const planTitleRef = useRef<string | null>(null);
  // Which member the plan currently in memory was FETCHED for. Null until the first fetch.
  const planOwnerRef = useRef<string | null>(null);

  useEffect(() => { userIdRef.current = decodedUserId; }, [decodedUserId]);
  useEffect(() => { planTitleRef.current = state?.planTitle || null; }, [state?.planTitle]);

  const fetchOnce = useCallback(async (uid: string) => {
    let res: any;
    try {
      res = await userApi.getActiveUserSubscriptionByUserId(uid);
    } catch {
      // ⚠️ A FAILED request must never downgrade anyone. Home used to write "Free" on any
      // error, so one network blip stripped a paying member's features until the next
      // successful load. Keep what we have and let the next signal try again.
      return null;
    }
    // The member logged out / switched account while this was in the air — drop the answer
    // rather than write the previous account's plan into the new session.
    if (userIdRef.current !== uid) return null;

    const code = res?.data?.code;
    let next: any = null;
    if (code === 200 && res.data?.data) next = res.data.data;
    else if (code === 404) next = FREE_PLAN; // a real "no active subscription" answer
    if (!next) return null; // 500 or an unexpected shape — same rule as a network failure

    const before = planTitleRef.current;
    const after = next.planTitle || null;
    // Only compare against a plan we fetched for THIS member in THIS run of the app. The
    // blob restored from storage on cold start, or left behind by a forced logout, may
    // belong to a different session — announcing "Your plan is now Free" to someone who
    // just signed in to a second account would be wrong and alarming.
    const sameOwner = planOwnerRef.current === uid;
    planOwnerRef.current = uid;
    await setSubscription(next);

    // Announce a change that happened while the member was signed in.
    // A Toast, not popup.*: a native Modal here could stack on whatever Modal the member
    // already has open — the freeze documented in CLAUDE.md section 17.
    if (sameOwner && before && after && before !== after) {
      try {
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: "Your plan is now " + after,
          textBody: after === "Free"
            ? "Your previous membership has ended."
            : "Your new features are ready to use.",
          autoClose: 3500,
        });
      } catch { /* a notice must never break a refresh */ }
    }
    return next;
  }, [setSubscription]);

  const refreshSubscription = useCallback((reason?: string, force = false): Promise<any> => {
    const uid = userIdRef.current;
    if (!uid) return Promise.resolve(null);

    // Already fetching: don't start a second request, but do run once more when this one
    // lands — the signal that just arrived may describe a change the in-flight request
    // was too early to see. The caller gets the promise that includes that re-run.
    if (inFlightRef.current) {
      runAgainRef.current = true;
      return inFlightRef.current;
    }
    if (!force && Date.now() - lastRunRef.current < MIN_REFRESH_GAP_MS) {
      return Promise.resolve(null);
    }

    const run = (async () => {
      let result: any = null;
      do {
        runAgainRef.current = false;
        lastRunRef.current = Date.now();
        result = await fetchOnce(uid);
      } while (runAgainRef.current && userIdRef.current === uid);
      return result;
    })().finally(() => { inFlightRef.current = null; });

    inFlightRef.current = run;
    return run;
  }, [fetchOnce]);

  // Non-React callers (axios interceptor, push handler) reach the function through the bus.
  useEffect(() => {
    setSubscriptionRefreshHandler(refreshSubscription);
    return () => setSubscriptionRefreshHandler(null);
  }, [refreshSubscription]);

  // Trigger: a member becomes known — app start with a stored session, or a fresh login.
  useEffect(() => {
    if (decodedUserId) refreshSubscription("user-known", true);
  }, [decodedUserId, refreshSubscription]);

  // Trigger: the app returns to the foreground. The plan may have been changed by an admin,
  // a payment in the browser, or the nightly expiry while the phone was asleep.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refreshSubscription("foreground");
    });
    return () => sub.remove();
  }, [refreshSubscription]);

  // Trigger: the server says the plan changed, and the socket (re)connecting — a
  // plan_changed sent while the socket was down is otherwise never seen.
  useEffect(() => {
    const offChanged = webSocketService.addListener("plan_changed", () => {
      refreshSubscription("plan_changed", true);
    });
    const offConnected = webSocketService.addListener("connected", () => {
      refreshSubscription("socket-connected");
    });
    return () => { offChanged?.(); offConnected?.(); };
  }, [refreshSubscription]);

  const checkUserSubscription = async () => {
  try {
    // First try to get from AsyncStorage for backward compatibility
    const subscriptionData = await AsyncStorage.getItem('subscriptionData');
    
    if (subscriptionData) {
      const { endDate, entitlements } = JSON.parse(subscriptionData);
      
      // Check if subscription is active based on end date
      const isActive = endDate ? new Date(endDate) > new Date() : false;
      
      // Additional check for entitlements if needed
      const hasPremiumEntitlement = entitlements && 
        Object.values(entitlements).some((e: any) => e.isActive);
      
      return { 
        isPremiumUser: isActive || hasPremiumEntitlement,
        endDate,
        entitlements
      };
    }
    
    return { isPremiumUser: false };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { isPremiumUser: false };
  }
};

  // Memoized so every plan-gated screen in the app only re-renders when the subscription
  // state itself changes, not on each provider render.
  const value = useMemo(
    () => ({
      subscriptionData: state,
      setSubscription,
      clearSubscription,
      refreshSubscription,
    }),
    [state, setSubscription, clearSubscription, refreshSubscription]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);

/**
 * Runs `onChange` when the member's plan changes WHILE the calling screen is mounted.
 *
 * Why it exists: lock flags derived from `subscriptionData` already follow a live plan
 * change, but DATA does not. The server masks by the viewer's plan at fetch time — a profile's
 * mobile/horoscope, a chat thread, the chat-list previews, the usage counters — so a screen
 * that loaded under the old plan keeps showing the old plan's answer, unlocked buttons over
 * null data, until it is left and re-entered. Screens holding such data call this and refetch.
 *
 * It fires on a CHANGE only, never for the value a screen first sees: at cold start the plan
 * goes empty → restored-from-storage → confirmed-by-server, and none of that is a plan change.
 * The key is subscriptionId + planTitle, so a renewal of the same tier (new row, counters
 * reset) counts as a change too.
 */
export const usePlanChangeEffect = (onChange: () => void) => {
  const ctx = useContext(SubscriptionContext);
  const data = ctx?.subscriptionData;
  const key = data?.planTitle ? `${data?.subscriptionId ?? ""}|${data.planTitle}` : "";
  const seenRef = useRef<string>("");
  const cbRef = useRef(onChange);
  useEffect(() => { cbRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!key) return;                 // plan not known yet
    const before = seenRef.current;
    seenRef.current = key;
    if (before && before !== key) cbRef.current();
  }, [key]);
};
