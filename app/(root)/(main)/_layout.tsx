// app/(main)/_layout.tsx
import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // you can set true if some screens need headers
      }}
    />
  );
}
