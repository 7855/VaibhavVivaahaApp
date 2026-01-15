import React, { createContext, useReducer, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SubscriptionContext = createContext<any>(null);

const initialState = {
  entitlements: {},
  planTitle: null,
  subscriptionId: null,
  startDate: null,
  endDate: null
};

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
          dispatch({ type: "SET_SUBSCRIPTION", payload: JSON.parse(stored) });
        }
      } catch (error) {
        console.error("Failed to load subscription data:", error);
      }
    };
    
    loadSubscription();
  }, []);

  // Save subscription data to storage when it changes
  const setSubscription = async (payload: any) => {
    try {
      const data = JSON.stringify(payload);
      await AsyncStorage.setItem("subscriptionData", data);
      dispatch({ type: "SET_SUBSCRIPTION", payload });
    } catch (error) {
      console.error("Failed to save subscription data:", error);
    }
  };

  const clearSubscription = async () => {
    try {
      await AsyncStorage.removeItem("subscriptionData");
      dispatch({ type: "CLEAR_SUBSCRIPTION" });
    } catch (error) {
      console.error("Failed to clear subscription data:", error);
    }
  };

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

  return (
    <SubscriptionContext.Provider value={{ 
      subscriptionData: state, 
      setSubscription, 
      clearSubscription 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
