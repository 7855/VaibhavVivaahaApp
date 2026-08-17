import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updatePushToken, saveDeviceInfo } from "./utils/deviceInfo";

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldShowAlert: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  async function registerForPushNotificationsAsync() {
    let token;
    console.log("🚀 Registering for push notifications...------------->",Device.isDevice);
    console.log("🚀 Registering for push notifications..Device.------------->",Device);

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification");
        return;
      }

      // easConfig is the fallback source in standalone builds where expoConfig can be absent.
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
      if (!projectId) {
        console.warn("Push: no EAS projectId available — cannot request a push token");
        return;
      }

      token = await Notifications.getExpoPushTokenAsync({ projectId });
    } else {
      alert("Must be using a physical device for Push notifications");
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      setExpoPushToken(token);

      // Self-heal: saveDeviceInfo only ever runs at login, and it bails silently on a denied
      // permission or a flaky Expo token fetch. Without this, that one miss is permanent —
      // updatePushToken can't recover it either, since it requires the deviceId that a
      // successful save is what writes. Re-register here whenever we hold a token but the
      // device was never registered.
      try {
        if (!token?.data) return;
        const [userId, deviceId] = await Promise.all([
          AsyncStorage.getItem("userId"),
          AsyncStorage.getItem("deviceId"),
        ]);
        if (userId && !deviceId) {
          console.log("Push: device not registered yet — registering now");
          await saveDeviceInfo(userId);
        }
      } catch (e) {
        console.warn("Push: device re-registration check failed", e);
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    // Listen for push token refresh and update backend.
    // NOTE: this listener yields a DevicePushToken — the RAW FCM token on Android, NOT an
    // ExponentPushToken. Sending that straight to the backend overwrites the good Expo token
    // with one our push path can't deliver to (isExpoPushToken() fails → the dead
    // FirebaseMessaging branch). Exchange it for the Expo token before persisting.
    // `devicePushToken` is passed explicitly so getExpoPushTokenAsync does NOT internally call
    // getDevicePushTokenAsync, which would re-trigger this listener in a loop.
    const tokenSubscription = Notifications.addPushTokenListener(async (tokenData) => {
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
        if (!projectId) {
          console.warn("Push: token rolled but no projectId — skipping update");
          return;
        }
        const refreshed = await Notifications.getExpoPushTokenAsync({
          projectId,
          devicePushToken: tokenData,
        });
        console.log("🔄 Push token refreshed:", refreshed.data);
        updatePushToken(refreshed.data);
      } catch (e) {
        console.warn("Push: failed to exchange refreshed device token", e);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      tokenSubscription.remove();
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};
