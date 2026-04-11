import React, { useCallback, useState } from 'react';
import { Tabs, useFocusEffect } from "expo-router";
import { View } from 'react-native';
import { useUserData } from '../contexts/UserDataContext';
import CustomNavBar from "../../../components/CustomNav";
import PremiumNavBar from "../../../components/PremiumNavBar";

const TabsLayout = () => {
  const { userData } = useUserData();
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Use userData.hasStarted from context
      setHasStarted(userData.hasStarted === 'true');
    }, [userData.hasStarted])
  );

  if (hasStarted === null) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: hasStarted
            ? {
                backgroundColor: 'transparent',
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
              }
            : { display: 'none' },
        }}
        tabBar={hasStarted ? (props) => <PremiumNavBar {...props} /> : undefined}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="explore" options={{ title: "Explore" }} />
        <Tabs.Screen name="myChatList" options={{ title: "Chat" }} />
        <Tabs.Screen name="mailBox" options={{ title: "Request" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
};

export default TabsLayout;