import { LogBox, BackHandler } from 'react-native';
import { enableFreeze } from 'react-native-screens';
// NativeBase still calls the removed BackHandler.removeEventListener API.
// Polyfill it as a no-op so it doesn't crash navigation on RN 0.74+.
if (typeof (BackHandler as any).removeEventListener !== 'function') {
  (BackHandler as any).removeEventListener = () => ({ remove: () => {} });
}

// Expo Router's bottom tabs never unmount on navigation — pushing chatscreen.tsx on top of the
// "Chat" tab leaves the conversation list (60+ rows: gradients, gesture handlers, WS listeners,
// entrance animations) fully mounted and rendering in the background the whole time. That
// background work competes with the foreground screen's own touch handling, which is exactly
// why buttons on chatscreen.tsx (send, back arrow) needed several taps to register — nothing
// wrong with those buttons specifically, the UI thread was just busy with an off-screen tab.
// enableFreeze pauses non-focused screens' rendering/effects (via react-freeze) instead of
// leaving them fully live in the background.
enableFreeze(true);
LogBox.ignoreLogs([
  'BackHandler.removeEventListener',
  'SafeAreaView has been deprecated',
  // expo-notifications logs this via console.error the moment it's required in Expo
  // Go on Android SDK 53+ — remote push genuinely isn't supported there (Expo platform
  // limitation), and deviceInfo.ts already falls back gracefully. Non-fatal noise only.
  'Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
]);

import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';
import { AlertNotificationRoot, Toast, ALERT_TYPE } from 'react-native-alert-notification';
import { AuthProvider } from './(root)/contexts/AuthContext';
import { MasterProvider } from './(root)/contexts/MasterDataContext';
import { SubscriptionProvider } from './(root)/contexts/subscriptionContext';
import { UserDataProvider } from './(root)/contexts/UserDataContext';
import { PopupProvider } from './(root)/contexts/PopupContext';
import { NativeBaseProvider } from 'native-base';
import NoInternetOverlay from '../components/NoInternetOverlay';
import QuickAccessFAB from '../components/QuickAccessFAB';
import ForceUpdateGate from '../components/ForceUpdateGate';
import { initPlanCatalog } from './(root)/utils/upgradeNavigation';
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

  // Seeds the purchasable-plan catalog (memory + AsyncStorage) and refreshes it from
  // /subscriptionPlans/getAllActivePlans in the background, so deactivating a plan in the DB
  // (subscription_plans.isActive='N') propagates to every upgrade screen and upsell message
  // without an app release. Fire-and-forget — it never blocks render and never throws.
  useEffect(() => {
    initPlanCatalog().catch(() => { });
  }, []);

  // App-wide screenshot/screen-recording guard. Android: FLAG_SECURE blocks both
  // outright (screenshot capture fails silently, and the screen shows blank in the
  // recents/app-switcher preview and in any recording). iOS has no API to block
  // either — Apple only allows detecting that a screenshot was taken after the fact,
  // so addScreenshotListener is the only mitigation there (screen recording on iOS
  // can't be detected or blocked by a managed Expo app at all).
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    const subscription = ScreenCapture.addScreenshotListener(() => {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        title: 'Screenshot detected',
        textBody: 'Please respect other members’ privacy.',
      });
    });
    return () => {
      subscription.remove();
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    // Single app-wide GestureHandlerRootView. FAB components (QuickAccessFAB,
    // SupportFAB) must NOT wrap themselves in their own — a second, full-screen
    // GestureHandlerRootView doesn't reliably honor pointerEvents="box-none" on
    // Android and ends up swallowing every touch on screen except its own content.
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                      <QuickAccessFAB />
                      <NoInternetOverlay />
                      {/* Last child so its Modal sits above everything, including the FAB and
                          the offline overlay — a mandatory update must not be tappable around. */}
                      <ForceUpdateGate />
                    </AlertNotificationRoot>
                  </PopupProvider>
                </NativeBaseProvider>
              </AuthProvider>
            </SubscriptionProvider>
          </MasterProvider>
        </UserDataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}