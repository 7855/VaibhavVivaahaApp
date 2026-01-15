import AsyncStorage from "@react-native-async-storage/async-storage";
import userApi from "../api/userApi";

export const loadMasterData = async (setMasterData: any) => {
  const res = await userApi.getAllKeyValues();
  const map: any = {};

  res.data.data.forEach((item: any) => {
    map[item.keyColumn] = JSON.parse(item.valueColumn);
  });

  AsyncStorage.setItem("masterData", JSON.stringify(map));
  setMasterData(map);
};

export const loadUserSubscription = async (userId: string, setSubscription: any) => {
  const res = await userApi.getActiveUserSubscriptionByUserId(userId);
  if (res.data?.data) {
    setSubscription(res.data.data);   // this already persists to AsyncStorage via context
  }
};

