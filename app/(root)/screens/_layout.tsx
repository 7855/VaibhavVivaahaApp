import { Stack, useSegments, router } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import Ionicons from 'react-native-vector-icons/Feather';

export default function ScreensLayout() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1]; // Get current screen segment

  const showHeader = currentRoute !== "chatscreen";

  return (
    <Stack
      screenOptions={{
        headerShown: showHeader,
        headerStyle: {
          backgroundColor: "#420001",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
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
      <Ionicons name="chevron-left" size={22} color="white" />
      <Text style={{ color: "#fff", fontSize: 16 }}>Back</Text>
    </TouchableOpacity>
  );
}
