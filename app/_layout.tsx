import { LogBox, BackHandler } from 'react-native';
// NativeBase still calls the removed BackHandler.removeEventListener API.
// Polyfill it as a no-op so it doesn't crash navigation on RN 0.74+.
if (typeof (BackHandler as any).removeEventListener !== 'function') {
  (BackHandler as any).removeEventListener = () => ({ remove: () => {} });
}
LogBox.ignoreLogs([
  'BackHandler.removeEventListener',
  'SafeAreaView has been deprecated',
]);

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import { AuthProvider } from './(root)/contexts/AuthContext';
import { MasterProvider } from './(root)/contexts/MasterDataContext';
import { SubscriptionProvider } from './(root)/contexts/subscriptionContext';
import { UserDataProvider } from './(root)/contexts/UserDataContext';
import { PopupProvider } from './(root)/contexts/PopupContext';
import { NativeBaseProvider } from 'native-base';
// ... other imports
// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
    "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
    "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <UserDataProvider>
        <MasterProvider>
          <SubscriptionProvider>
            <AuthProvider>
              <NativeBaseProvider>
                <PopupProvider>
                  <AlertNotificationRoot>
                    <StatusBar style="auto" />
                    <Stack screenOptions={{ headerShown: false }} />
                  </AlertNotificationRoot>
                </PopupProvider>
              </NativeBaseProvider>
            </AuthProvider>
          </SubscriptionProvider>
        </MasterProvider>
      </UserDataProvider>
    </SafeAreaProvider>
  );
}