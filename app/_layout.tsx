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
                <AlertNotificationRoot>
                  <StatusBar style="auto" />
                  <Stack screenOptions={{ headerShown: false }} />
                </AlertNotificationRoot>
              </NativeBaseProvider>
            </AuthProvider>
          </SubscriptionProvider>
        </MasterProvider>
      </UserDataProvider>
    </SafeAreaProvider>
  );
}