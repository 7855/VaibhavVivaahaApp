import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { LogBox, Platform } from 'react-native';

// _layout.tsx already registers this same ignore pattern, but that call can lose the race:
// Babel's CommonJS transform hoists ALL `import` statements (and their full module evaluation)
// above other top-level statements in a file, so if anything upstream of _layout.tsx's own
// imports transitively pulls in this file before _layout.tsx's LogBox.ignoreLogs(...) line runs,
// the require() below fires — and expo-notifications logs this via a synchronous
// module-level console.error the instant it's required in Expo Go on Android SDK 53+ — before
// the ignore pattern is registered at all. Registering it again right here, immediately before
// the require it's guarding, removes any ordering ambiguity: same file, same synchronous
// execution, guaranteed to run first.
LogBox.ignoreLogs([
  'Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
]);

// expo-notifications crashes on Expo Go (Android) since SDK 53.
// Lazy-import so the rest of the app still loads in Expo Go.
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications not available (Expo Go Android). Push features disabled.');
}
import userApi from '../app/(root)/api/userApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generate a unique device ID
const getOrCreateDeviceId = (): string => {
  // Generate a simple unique ID using timestamp and random number
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `device-${timestamp}-${random}`;
};

export const saveDeviceInfo = async (userId: string) => {
  try {
    console.log('Saving device info for user:', userId);
    
    // expo-notifications unavailable in Expo Go Android — skip push registration
    if (!Notifications) {
      console.log('Notifications module not available, skipping device info save');
      return;
    }

    // Request notification permissions if not already granted
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted, skipping device info save');
      return;
    }

    // Get the push token (FCM token)
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.log('Project ID not found, skipping device info save');
      return;
    }

    // Get the push token — Expo's push API can be flaky (503), so retry silently
    const fetchExpoToken = async (attempts = 3, delayMs = 1500): Promise<string | null> => {
      for (let i = 0; i < attempts; i++) {
        try {
          const res = await Notifications.getExpoPushTokenAsync({ projectId });
          return res.data;
        } catch (err: any) {
          const msg = err?.message || '';
          const transient = msg.includes('503') || msg.includes('SERVICE_UNAVAILABLE') || msg.includes('temporarily unavailable');
          console.log(`Expo push token attempt ${i + 1}/${attempts} failed${transient ? ' (transient)' : ''}: ${msg}`);
          if (!transient || i === attempts - 1) return null;
          await new Promise((r) => setTimeout(r, delayMs * (i + 1))); // backoff
        }
      }
      return null;
    };

    const expoPushToken = await fetchExpoToken();
    if (!expoPushToken) {
      console.log('Skipping device info save — Expo push token unavailable (will retry on next launch)');
      return;
    }

    // Generate a device ID
    const deviceId = getOrCreateDeviceId();
    
    // Convert userId to base64
    const encodedUserId = atob(userId);
    
    // Prepare the device info object exactly as required
    const deviceInfo = {
      fcmToken: expoPushToken, // Using expo push token as FCM token
      userId: encodedUserId,   // User ID encoded in base64
      deviceId: deviceId,      // Generated unique device ID
      deviceType: Platform.OS === 'ios' ? 'ios' : 'android', // Ensure it's either 'ios' or 'android'
      deviceModel: Device.modelName || 'Unknown',
      osVersion: `${Platform.Version}`,
      appVersion: Constants.expoConfig?.version || '1.0.0'
    };
    
    console.log('Sending device info:', JSON.stringify(deviceInfo, null, 2));
   const response =  await userApi.saveDeviceInfo(deviceInfo);

   console.log("fcm response ------------------->", response);
   

   if(response.data.status == 200){
    AsyncStorage.setItem('fcmToken', response.data.data.fcmToken);
   }
    // Store deviceId for token refresh
    await AsyncStorage.setItem('deviceId', deviceId);
    console.log('Device info saved successfully');
  } catch (error) {
    console.error('Error saving device info:', error);
  }
};

/**
 * Update the FCM/Expo push token when it refreshes.
 * Call this when Expo detects a token change.
 */
export const updatePushToken = async (newToken: string) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    const deviceId = await AsyncStorage.getItem('deviceId');

    if (!userId || !deviceId) {
      console.log('No userId or deviceId found, skipping token refresh');
      return;
    }

    const encodedUserId = atob(userId);

    await userApi.updatePushToken({
      userId: encodedUserId,
      deviceId: deviceId,
      fcmToken: newToken,
    });

    await AsyncStorage.setItem('fcmToken', newToken);
    console.log('Push token refreshed successfully');
  } catch (error) {
    console.error('Error refreshing push token:', error);
  }
};
