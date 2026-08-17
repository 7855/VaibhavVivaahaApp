import React, { createContext, useReducer, useContext, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    }),
    [state, setSubscription, clearSubscription]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
