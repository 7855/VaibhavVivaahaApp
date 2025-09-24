import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
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

    // Get the push token
    const expoPushToken = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

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
    console.log('Device info saved successfully');
  } catch (error) {
    console.error('Error saving device info:', error);
  }
};
