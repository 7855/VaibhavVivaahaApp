import React from 'react';
import { Tabs } from "expo-router";
import { View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
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

const ROUTE_NAMES = ['index', 'explore', 'myChatList', 'mailBox', 'profile'];

// Hoisted to module scope: as an inline closure this was a brand new component type on
// every TabsLayout render, forcing React Navigation to unmount/remount the whole tab bar
// (and its blur/gradient layers) mid-transition.
const VVMTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const routeName = state.routes[state.index]?.name || 'index';
  const activeTab = ROUTE_TO_TAB_KEY[routeName] || 'home';

  return (
    <VVMFooterNav
      activeTab={activeTab}
      onTabChange={(key) => {
        const idx = TAB_KEY_TO_ROUTE[key];
        if (idx !== undefined && ROUTE_NAMES[idx]) {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[idx]?.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            navigation.navigate(ROUTE_NAMES[idx]);
          }
        }
      }}
    />
  );
};

const renderTabBar = (props: BottomTabBarProps) => <VVMTabBar {...props} />;

const TabsLayout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tabs
        backBehavior="initialRoute"
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default tab bar — VVMFooterNav replaces it
          lazy: true,
          freezeOnBlur: true,
        }}
        tabBar={renderTabBar}
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
