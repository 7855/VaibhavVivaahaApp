import React, { useEffect, useState } from 'react';
import { Tabs } from "expo-router";
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomNavBar from "../../../components/CustomNav";

const TabsLayout = () => {
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStarted = async () => {
      try {
        const started = await AsyncStorage.getItem('hasStarted');
        setHasStarted(started === 'true');
      } catch (error) {
        console.error('Error checking hasStarted:', error);
        setHasStarted(false);
      }
    };

    checkStarted();
    const interval = setInterval(checkStarted, 1000);
    return () => clearInterval(interval);
  }, []);

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