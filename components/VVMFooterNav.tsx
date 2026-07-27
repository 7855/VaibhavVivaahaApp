import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  User,
} from 'lucide-react-native';

type TabKey = 'home' | 'explore' | 'matches' | 'requests' | 'profile';

interface TabConfig {
  key: TabKey;
  label: string;
  Icon: any;
  badge?: number;
}

interface VVMFooterNavProps {
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
  requestsBadge?: number;
  homeBadge?: number;
}

const TABS: TabConfig[] = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'explore', label: 'Explore', Icon: Search },
  { key: 'requests', label: 'Requests', Icon: MessageCircle },
  { key: 'profile', label: 'Profile', Icon: User },
];

const COLORS = {
  brand: '#1F7FE5',
  brandDeep: '#1565C8',
  inactive: '#94a3b8',
  white: '#FFFFFF',
  badgeRed: '#F43F5E',
};

// ─── Tab Item (simple, no animation) ─────────
const SPRING_CONFIG = { damping: 15, stiffness: 150, mass: 0.8 };
const SPRING_BOUNCE = { damping: 12, stiffness: 180, mass: 0.6 };

const TabItem = ({ tab, active, onPress }: { tab: TabConfig; active: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={s.tabItem}>
    {active && <View style={s.activeBar} />}
    <View style={s.tabInner}>
      {tab.badge !== undefined && tab.badge > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{tab.badge > 9 ? '9+' : tab.badge}</Text>
        </View>
      )}
      <tab.Icon size={22} color={active ? COLORS.brand : COLORS.inactive} strokeWidth={active ? 2 : 1.8} />
      <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Chat FAB (centre raised, no animation) ──
const MatchesFAB = ({ active, onPress }: { active: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s.fabWrap}>
    <LinearGradient
      colors={active ? [COLORS.brandDeep, COLORS.brandDeep] : [COLORS.brand, COLORS.brandDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.fabCircle, active && s.fabCircleActive]}
    >
      <Heart size={24} color="#FFFFFF" strokeWidth={2} fill={active ? '#FFFFFF' : 'none'} />
    </LinearGradient>
    <Text style={[s.fabLabel, active && s.fabLabelActive]}>Chat</Text>
  </TouchableOpacity>
);

// ─── Main Component ──────────────────────────
const VVMFooterNav: React.FC<VVMFooterNavProps> = ({
  activeTab = 'home',
  onTabChange,
  requestsBadge,
  homeBadge,
}) => {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<TabKey>(activeTab);

  // useState(activeTab) only seeds the initial value — without this, `active` never
  // syncs again if the prop changes for reasons other than a tab tap (e.g. the parent
  // Tabs navigator remounting mid-navigation), leaving the footer permanently stuck
  // highlighting a stale tab while the actual screen content is correct.
  useEffect(() => {
    setActive(activeTab);
  }, [activeTab]);

  const handleTab = (key: TabKey) => {
    setActive(key);
    onTabChange?.(key);
  };

  const tabs = TABS.map((t) => ({
    ...t,
    badge: t.key === 'home' && homeBadge !== undefined ? homeBadge
      : t.key === 'requests' && requestsBadge !== undefined ? requestsBadge
      : t.badge,
  }));

  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  return (
    <View style={[s.navWrap, { paddingBottom: Math.max(insets.bottom, 14) + 4 }]}>
      <View style={s.navBarShadowWrap}>
        <View style={s.navBarGlass} pointerEvents="none">
          <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={s.navBarTint} />
        </View>
        <View style={s.navBar}>
          {leftTabs.map((tab) => (
            <TabItem key={tab.key} tab={tab} active={active === tab.key} onPress={() => handleTab(tab.key)} />
          ))}
          <MatchesFAB active={active === 'matches'} onPress={() => handleTab('matches')} />
          {rightTabs.map((tab) => (
            <TabItem key={tab.key} tab={tab} active={active === tab.key} onPress={() => handleTab(tab.key)} />
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────
const s = StyleSheet.create({
  navWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
  },
  navBarShadowWrap: {
    borderRadius: 22,
    ...Platform.select({
      ios: { shadowColor: '#0f1724', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 28 },
      android: { elevation: 10 },
    }),
  },
  // Separate, clipped background layer — the blur/tint must be clipped to the
  // pill's rounded corners, but the FAB (which pokes above the bar via a
  // negative marginTop) must NOT be clipped, so it lives in a sibling view.
  navBarGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  navBarTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  navBar: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 0, position: 'relative' },
  tabInner: { alignItems: 'center', justifyContent: 'center', paddingTop: 11, gap: 4 },
  activeBar: { position: 'absolute', top: 0, alignSelf: 'center', width: 26, height: 3, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: COLORS.brand },
  tabLabel: { fontSize: 10, fontFamily: 'Rubik-Regular', color: COLORS.inactive, letterSpacing: -0.1, lineHeight: 13 },
  tabLabelActive: { color: COLORS.brand, fontFamily: 'Rubik-Bold' },
  badge: { position: 'absolute', top: 8, right: -8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.badgeRed, borderWidth: 2, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, zIndex: 10 },
  badgeText: { fontSize: 8, fontFamily: 'Rubik-ExtraBold', color: COLORS.white, lineHeight: 10 },
  fabWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', marginTop: -22 },
  fabCircle: {
    width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.white,
    ...Platform.select({
      ios: { shadowColor: COLORS.brand, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  fabCircleActive: { ...Platform.select({ ios: { shadowOpacity: 0.6, shadowRadius: 18 } }) },
  fabLabel: { fontSize: 10, fontFamily: 'Rubik-Regular', color: COLORS.inactive, marginTop: 5, letterSpacing: -0.1, lineHeight: 13 },
  fabLabelActive: { color: COLORS.brand, fontFamily: 'Rubik-Bold' },
});

export default VVMFooterNav;
