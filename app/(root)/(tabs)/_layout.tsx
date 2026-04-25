import React, { useCallback, useState } from 'react';
import { Tabs, useFocusEffect } from "expo-router";
import { View } from 'react-native';
import { useUserData } from '../contexts/UserDataContext';
import VVMFooterNav from "../../../components/VVMFooterNav";

type TabKey = 'home' | 'explore' | 'matches' | 'requests' | 'profile';

// Map VVMFooterNav tab keys to Expo Router tab names
const TAB_KEY_TO_ROUTE: Record<TabKey, number> = {
  home: 0,
  explore: 1,
  matches: 2,    // myChatList (matches/chat)
  requests: 3,   // mailBox
  profile: 4,
};

const ROUTE_TO_TAB_KEY: Record<string, TabKey> = {
  index: 'home',
  explore: 'explore',
  myChatList: 'matches',
  mailBox: 'requests',
  profile: 'profile',
};

const TabsLayout = () => {
  const { userData } = useUserData();
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
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
          tabBarStyle: { display: 'none' }, // Hide default tab bar — VVMFooterNav replaces it
        }}
        tabBar={hasStarted ? (props) => {
          // Determine active tab from Expo Router state
          const routeName = props.state.routes[props.state.index]?.name || 'index';
          const activeTab = ROUTE_TO_TAB_KEY[routeName] || 'home';

          return (
            <VVMFooterNav
              activeTab={activeTab}
              onTabChange={(key) => {
                const routes = ['index', 'explore', 'myChatList', 'mailBox', 'profile'];
                const idx = TAB_KEY_TO_ROUTE[key];
                if (idx !== undefined && routes[idx]) {
                  const event = props.navigation.emit({
                    type: 'tabPress',
                    target: props.state.routes[idx]?.key,
                    canPreventDefault: true,
                  });
                  if (!event.defaultPrevented) {
                    props.navigation.navigate(routes[idx]);
                  }
                }
              }}
            />
          );
        } : undefined}
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