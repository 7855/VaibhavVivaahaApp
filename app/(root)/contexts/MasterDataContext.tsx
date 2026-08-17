import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useReducer, useContext, useEffect, useCallback, useMemo } from "react";
import userApi from "../api/userApi";

type MasterState = Record<string, any[]>;

const MasterContext = createContext<any>(null);

function reducer(state: MasterState, action: any) {
    switch (action.type) {
        case "SET_MASTER":
            return { ...state, ...action.payload };
        default:
            return state;
    }
}

export const MasterProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(reducer, {});

  // Castes/subcastes live in the same `masterData` cache as the keyValue lists, but they come
  // from /caste/* rather than the keyValue bag, so they're merged in (never written as a whole
  // new payload — setMasterData below OVERWRITES the stored blob, which would drop the keyValue
  // lists). An install whose cache predates this feature simply has no `castes`/`subcastes` key,
  // which is exactly the condition that triggers the fetch below.
  const mergeMasterData = useCallback(async (payload: MasterState) => {
    try {
      dispatch({ type: "SET_MASTER", payload });
      const stored = await AsyncStorage.getItem("masterData");
      const existing = stored ? JSON.parse(stored) : {};
      await AsyncStorage.setItem("masterData", JSON.stringify({ ...existing, ...payload }));
    } catch (error) {
      console.error("Failed to merge master data:", error);
    }
  }, []);

  useEffect(() => {
    const loadMasterData = async () => {
      let cached: any = null;
      try {
        const stored = await AsyncStorage.getItem("masterData");
        if (stored) {
          cached = JSON.parse(stored);
          dispatch({ type: "SET_MASTER", payload: cached });
        }
      } catch (error) {
        console.error("Failed to load master data:", error);
      }

      // Backend returns HTTP 200 even on business failures — check res.data.code explicitly.
      // Both endpoints are in the permitAll bucket (same as /caste/getAllActiveCaste, already
      // called pre-login by sign-up), so this is safe to run before authentication.
      if (!Array.isArray(cached?.castes)) {
        try {
          const res = await userApi.getAllCaste();
          if (res?.data?.code === 200 && Array.isArray(res.data.data)) {
            await mergeMasterData({ castes: res.data.data });
          }
        } catch (e) {
          console.warn("Failed to load caste master list:", e);
        }
      }

      if (!Array.isArray(cached?.subcastes)) {
        try {
          const res = await userApi.getAllActiveSubcastes();
          if (res?.data?.code === 200 && Array.isArray(res.data.data)) {
            await mergeMasterData({ subcastes: res.data.data });
          }
        } catch (e) {
          // Empty/unavailable subcaste list is an expected state — every subcaste-driven
          // control degrades to hidden when the list is empty.
          console.warn("Failed to load subcaste master list:", e);
        }
      }
    };

    loadMasterData();
  }, [mergeMasterData]);

  // MERGES rather than overwrites. It used to replace the whole stored blob, which raced with
  // mergeMasterData above: the provider reads `existing`, then a caller here writes the full
  // keyValue map, then the provider's write lands with its pre-read copy — leaving AsyncStorage
  // as just {castes, subcastes} and permanently dropping education/districts/employingIn from
  // the cache. Both writers merge now, so neither can clobber the other's keys.
  const setMasterData = useCallback(async (payload: MasterState) => {
    try {
      dispatch({ type: "SET_MASTER", payload });
      const stored = await AsyncStorage.getItem("masterData");
      const existing = stored ? JSON.parse(stored) : {};
      await AsyncStorage.setItem("masterData", JSON.stringify({ ...existing, ...payload }));
    } catch (error) {
      console.error("Failed to save master data:", error);
    }
  }, []);

  // Subcastes belong to exactly one caste. Returns [] for a missing caste, a caste with no
  // subcastes, or a list that hasn't loaded — callers use the empty array to hide their UI.
  const getSubcastesForCaste = useCallback((casteId: any) => {
    if (casteId === null || casteId === undefined || casteId === '') return [];
    const list = (state as any).subcastes;
    if (!Array.isArray(list)) return [];
    return list.filter(
      (sc: any) =>
        sc &&
        String(sc.casteId) === String(casteId) &&
        sc.isActive !== 'N' &&
        sc.isActive !== false
    );
  }, [state]);

  const getCasteName = useCallback((casteId: any) => {
    if (casteId === null || casteId === undefined || casteId === '') return '';
    const list = (state as any).castes;
    if (!Array.isArray(list)) return '';
    const match = list.find((c: any) => c && String(c.id) === String(casteId));
    return match?.casteName || '';
  }, [state]);

  const getSubcasteName = useCallback((subcasteId: any) => {
    if (subcasteId === null || subcasteId === undefined || subcasteId === '') return '';
    const list = (state as any).subcastes;
    if (!Array.isArray(list)) return '';
    const match = list.find((sc: any) => sc && String(sc.id) === String(subcasteId));
    return match?.subcasteName || '';
  }, [state]);

  // Memoized — master lists change at most once per session, so consumers (every dropdown
  // in the app) shouldn't re-render just because the provider re-rendered.
  const value = useMemo(
    () => ({ state, setMasterData, getSubcastesForCaste, getCasteName, getSubcasteName }),
    [state, setMasterData, getSubcastesForCaste, getCasteName, getSubcasteName]
  );

  return (
    <MasterContext.Provider value={value}>
      {children}
    </MasterContext.Provider>
  );
};


export const useMasterData = () => useContext(MasterContext);
