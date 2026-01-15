import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useReducer, useContext, useEffect } from "react";

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

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const stored = await AsyncStorage.getItem("masterData");
        if (stored) {
          dispatch({ type: "SET_MASTER", payload: JSON.parse(stored) });
        }
      } catch (error) {
        console.error("Failed to load master data:", error);
      }
    };
    
    loadMasterData();
  }, []);

  const setMasterData = async (payload: MasterState) => {
    try {
      await AsyncStorage.setItem("masterData", JSON.stringify(payload));
      dispatch({ type: "SET_MASTER", payload });
    } catch (error) {
      console.error("Failed to save master data:", error);
    }
  };

  return (
    <MasterContext.Provider value={{ state, setMasterData }}>
      {children}
    </MasterContext.Provider>
  );
};


export const useMasterData = () => useContext(MasterContext);

