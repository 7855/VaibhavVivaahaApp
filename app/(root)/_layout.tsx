
import { Stack } from 'expo-router';


export default function RootLayoutNav() {

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(main)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="screens" />
    </Stack>
  );
}