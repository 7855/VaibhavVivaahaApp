
import { Stack } from 'expo-router';


export default function RootLayoutNav() {

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(main)"  options={{ gestureEnabled: false }}/>
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      <Stack.Screen name="screens" options={{ gestureEnabled: true }} />
    </Stack>
  );
}