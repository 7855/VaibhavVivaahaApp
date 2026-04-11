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
    // Network error or API failure — still default to Free
    setSubscription({
      planTitle: 'Free',
      subscriptionId: null,
      startDate: null,
      endDate: null,
      entitlements: {},
    });
  }
};

