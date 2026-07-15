import { Stack, useSegments, router } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import Ionicons from 'react-native-vector-icons/Feather';

export default function ScreensLayout() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1]; // Get current screen segment

  const showHeader = currentRoute !== "chatscreen" && currentRoute !== "PaymentScreen" && currentRoute !== "ProfileDetail" && currentRoute !== "NotificationScreen" && currentRoute !== "SettingPageChangePin" && currentRoute !== "StarMatch" && currentRoute !== "StarMatchResult" && currentRoute !== "BlockedUsersScreen" && currentRoute !== "UpgradePlanScreen";

  return (
    <Stack
      screenOptions={{
        headerShown: showHeader,
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
        headerLeft: () => (showHeader ? <CustomBackButton /> : null),
        // Update animation settings
        animation: 'slide_from_right',
        animationDuration: 300, // Standard duration
        // animationTypeForReplace: 'pop', // This ensures consistent back animation
      }}
    />
  );
}

function CustomBackButton() {
  return (
    <TouchableOpacity
      onPress={() => router.back()} 
      style={{
        paddingHorizontal: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
      }}
    >
      <Ionicons name="chevron-left" size={22} color="#1F7FE5" />
      <Text style={{ color: "#1F7FE5", fontSize: 16, fontFamily: 'Rubik-Medium' }}>Back</Text>
    </TouchableOpacity>
  );
}
