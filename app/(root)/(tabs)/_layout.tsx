import React, { useCallback, useState } from 'react';
import { Tabs, useFocusEffect } from "expo-router";
import { View } from 'react-native';
import { useUserData } from '../contexts/UserDataContext';
import CustomNavBar from "../../../components/CustomNav";

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
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: hasStarted ? {} : { display: 'none' },
        }}
        tabBar={hasStarted ? (props) => <CustomNavBar {...props} /> : undefined}
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