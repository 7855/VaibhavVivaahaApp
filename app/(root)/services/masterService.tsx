import AsyncStorage from "@react-native-async-storage/async-storage";
import userApi from "../api/userApi";

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

