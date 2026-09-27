import { Stack, router } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import Ionicons from 'react-native-vector-icons/Feather';

// Stable module-level references — recreating these per render (previously done inline,
// keyed off useSegments()) invalidated the header on every navigation and, worse, applied
// the *current* screen's headerShown to the whole Stack, so pushing a headerless screen
// stripped the header off the screen underneath it mid-transition.
const renderHeaderLeft = () => <CustomBackButton />;

const SCREEN_OPTIONS = {
  headerShown: true,
  // Sourced from the home page's own gradient (index.tsx: #d0dfeb → #f3f7fa) and its
  // real interactive accent (#1F7FE5, used for the active tab in VVMFooterNav) —
  // subtle light surface instead of a solid dark block, consistent with how the rest
  // of the app actually looks rather than the standalone brand maroon.
  headerStyle: {
    backgroundColor: "#F3F7FA",
  },
  headerTintColor: "#1F7FE5",
  headerTitleStyle: {
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
  },
  title: "",
  headerLeft: renderHeaderLeft,
  // Update animation settings
  animation: 'slide_from_right',
  // 300 read as sluggish on device — 220 keeps the slide visible but snappy.
  animationDuration: 220,
  // animationTypeForReplace: 'pop', // This ensures consistent back animation
} as const;

// Screens that render their own in-page header — opted out individually so they no longer
// affect any other screen in the stack.
const HEADERLESS = { headerShown: false } as const;

export default function ScreensLayout() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="chatscreen" options={HEADERLESS} />
      <Stack.Screen name="PaymentScreen" options={HEADERLESS} />
      <Stack.Screen name="PaymentReturn" options={HEADERLESS} />
      <Stack.Screen name="ProfileDetail" options={HEADERLESS} />
      <Stack.Screen name="NotificationScreen" options={HEADERLESS} />
      <Stack.Screen name="SettingPageChangePin" options={HEADERLESS} />
      <Stack.Screen name="StarMatch" options={HEADERLESS} />
      <Stack.Screen name="CompleteProfileScreen" options={HEADERLESS} />
      <Stack.Screen name="StarMatchResult" options={HEADERLESS} />
      <Stack.Screen name="BlockedUsersScreen" options={HEADERLESS} />
      <Stack.Screen name="UpgradePlanScreen" options={HEADERLESS} />
      {/* FAQPage draws its own header (back pill + heading), so the stack header would be a
          second one stacked above it. */}
      <Stack.Screen name="FAQPage" options={HEADERLESS} />
      {/* Headerless since 2026-09-05: the ONLY keyboard screen with a native
          header had its keyboard closing itself the instant it opened; every
          working keyboard screen (chat, sign-up, FAQ search) is headerless.
          It now draws its own in-page header like FAQPage. */}
      <Stack.Screen name="HelpSupportPage" options={HEADERLESS} />
      <Stack.Screen name="EditProfileSection" options={HEADERLESS} />
    </Stack>
  );
}

// ⚠️ No `width: '100%'` here. iOS 26's navigation bar measures custom bar items and
// folds any that do not fit into a "…" (More) overflow button — a full-width item
// never fits, so on iOS 26 every shared-header screen showed NO back control and no
// title, just that "…" at the right (reproduced on the iOS 26.2 simulator, 2026-09-26).
// A naturally-sized item sits in the bar like a normal back button.
function CustomBackButton() {
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{
        paddingRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Ionicons name="chevron-left" size={22} color="#1F7FE5" />
      <Text style={{ color: "#1F7FE5", fontSize: 16, fontFamily: 'Rubik-Medium' }}>Back</Text>
    </TouchableOpacity>
  );
}
