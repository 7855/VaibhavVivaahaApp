// ────────────��────────────────────────────────────────────────
//  VVMWelcomeHeader.tsx  —  Full welcome header + stats card
//  Pure Roboto · Pa (ப) shape · 3 rows inside header
//
//  Deps: expo-linear-gradient · react-native-reanimated
//        react-native-safe-area-context · lucide-react-native
// ────────���────────────────────────────────────────────────────

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Image,
  TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient }     from 'expo-linear-gradient';
import { useSafeAreaInsets }  from 'react-native-safe-area-context';
import {
  Bell, Heart, Send, Eye,
  UserCheck, RefreshCw, Clock,
} from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';

// ───��─────────────────────────────────────────
//  HELPERS
// ───────────��─────────────��───────────────────
const getGreetWord = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  return 'evening'; // covers 17:00 through 04:59 — no "Good Night" greeting
};


const resolveTier = (name = '') => {
  const k = name.toLowerCase();
  if (k.includes('platinum')) return { label: 'Platinum', colors: ['#6C63FF', '#4F46E5'] as const, glow: 'rgba(108,99,255,0.35)' };
  if (k.includes('gold'))     return { label: 'Gold',     colors: ['#C59A40', '#A67C28'] as const, glow: 'rgba(197,154,64,0.38)' };
  if (k.includes('silver'))   return { label: 'Silver',   colors: ['#7E909E', '#5F7385'] as const, glow: 'rgba(95,115,133,0.3)'  };
  if (k.includes('starter'))  return { label: 'Starter',  colors: ['#4A9CD8', '#3280B8'] as const, glow: 'rgba(74,156,216,0.3)'  };
  if (k.includes('classic'))  return { label: 'Classic',  colors: ['#C48550', '#A66D38'] as const, glow: 'rgba(196,133,80,0.3)'  };
  return                             { label: 'Free',     colors: ['#8899AA', '#6B7D8E'] as const, glow: 'transparent'            };
};

// ───��─────────────────────────────────────────
//  Rotating avatar ring
// ──────��─────────────────���────────────────────
const RotatingRing = () => {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false,
    );
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View style={[S.ring, s]}>
      <LinearGradient
        colors={['#B8926A', '#D4B896', '#8FA7BF', '#6A8CAB', '#B8926A']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
};

// ────���────────────────────────────────────────
//  Online pulse dot
// ─────────────────────────────────────────────
const OnlineDot = () => {
  const sc = useSharedValue(1);
  const op = useSharedValue(0.6);
  useEffect(() => {
    sc.value = withRepeat(withSequence(
      withTiming(1.9, { duration: 1200, easing: Easing.out(Easing.ease) }),
      withTiming(1,   { duration: 0 }),
    ), -1, false);
    op.value = withRepeat(withSequence(
      withTiming(0,   { duration: 1200, easing: Easing.out(Easing.ease) }),
      withTiming(0.6, { duration: 0 }),
    ), -1, false);
  }, []);
  const ps = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }], opacity: op.value,
  }));
  return (
    <View style={S.onlineWrap}>
      <Animated.View style={[S.onlinePulse, ps]} />
      <View style={S.onlineCore} />
    </View>
  );
};

// ─────────────────────────────────────────────
//  Props
// ─────────────────────���───────────────────────
interface Props {
  userData: any;
  tierName?: string;
  unreadCount?: number;
  activityCount?: number;
  stats?: { likes: number; proposals: number; views: number; matches: number };
  router: any;
  isVerified?: boolean;
  memberId?: string;
  onActivityPress?: () => void;
  onStatRefresh?: () => void;
  onStatsPress?: (key: string) => void;
}

// ────────────��────────────────────────────────
//  Component
// ─────────────────────────────────────────────
const VVMWelcomeHeader: React.FC<Props> = ({
  userData,
  tierName,
  unreadCount    = 0,
  activityCount  = 0,
  stats          = { likes: 0, proposals: 0, views: 0, matches: 0 },
  router,
  isVerified     = false,
  memberId       = '',
  onActivityPress,
  onStatRefresh,
  onStatsPress,
}) => {
  const insets = useSafeAreaInsets();
  const tier   = resolveTier(tierName);
  const [refreshing, setRefreshing] = useState(false);
  const refreshSpin = useSharedValue(0);
  const refreshAnimStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${refreshSpin.value}deg` }] }));

  const handleRefresh = useCallback(async () => {
    if (refreshing || !onStatRefresh) return;
    setRefreshing(true);
    refreshSpin.value = withRepeat(withTiming(360, { duration: 800, easing: Easing.linear }), -1, false);
    try {
      await onStatRefresh();
    } finally {
      refreshSpin.value = withTiming(0, { duration: 300 });
      setRefreshing(false);
    }
  }, [refreshing, onStatRefresh]);

  const avatarSource = userData.profileImage
    ? { uri: userData.profileImage }
    : userData.gender === 'M'
      ? require('../assets/images/avatarMen.png')
      : (userData.gender === 'F'
        ? require('../assets/images/avatarWomen.png')
        : require('../assets/images/defaultAvatar.png'));

  const STAT_CONFIG = [
    { key: 'likes',     label: 'Likes',     value: stats.likes,     bg: '#8B3A3A', Icon: Heart,     ic: '#ffffff', filled: false },
    { key: 'proposals', label: 'Proposals', value: stats.proposals, bg: '#8B3A3A', Icon: Send,      ic: '#ffffff', filled: false },
    { key: 'views',     label: 'Views',     value: stats.views,     bg: '#8B3A3A', Icon: Eye,       ic: '#ffffff', filled: false },
    { key: 'matches',   label: 'Matches',   value: stats.matches,   bg: '#8B3A3A', Icon: UserCheck, ic: '#ffffff', filled: false },
  ];

  return (
    <View>

      {/* ── HEADER ─────────────────────────── */}
      <View style={[S.headerShell, { paddingTop: insets.top + 8 }]}>
        <LinearGradient
          colors={['#d0dfeb', '#d8e5ef', '#E0EAF2', '#E8EEF5']}
          locations={[0, 0.35, 0.70, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Gradient only — no bubble overlays */}

        {/* ROW 1 — Premium brand bar */}
        <View style={S.row1}>
          <View style={S.brandRow}>
            <View style={S.logoRing}>
              <LinearGradient
                colors={['#D4AF6A', '#C59A40', '#B8860B', '#C59A40', '#D4AF6A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={S.logoGrad}
              />
              <View style={S.logoInner}>
                <Image source={require('../assets/images/LotusLogo.jpeg')} style={S.brandLogo} />
              </View>
            </View>
            <View>
              <Text style={S.brandTitle}>Vaibhav Vivaaha</Text>
              <View style={S.brandAccent}>
                <View style={S.accentLine} />
                <Text style={S.brandSub}>MATRIMONY</Text>
                <View style={S.accentLine} />
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={() => router?.push('/screens/NotificationScreen')} activeOpacity={0.8}>
            <View style={S.bellBtn}>
              <Bell size={19} color="#3D5A80" strokeWidth={2} />
              {unreadCount > 0 && (
                <View style={S.bellBadge}>
                  <Text style={S.bellBadgeTxt}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ROW 2 — avatar + greeting + name + tier */}
        <View style={S.row2}>
          <View style={S.avWrap}>
            <RotatingRing />
            <View style={S.avFrame}>
              <Image source={avatarSource} style={S.avImg} />
            </View>
            <OnlineDot />
          </View>

          <View style={S.nameCol}>
            <Text style={S.welcomeLbl}>Good {getGreetWord()},</Text>
            <Text style={S.nameFull} numberOfLines={1}>
              {userData.firstName}{' '}
              <Text style={S.nameLast}>{userData.lastName}</Text>
            </Text>
            <View style={S.midRow}>
              <View style={S.midDot} />
              <Text style={S.midTxt}>VVM · {memberId || 'MB00000'}</Text>
            </View>
          </View>

          <View style={S.tierCol}>
            <View style={[S.pillShadow, { shadowColor: tier.glow }]}>
              <LinearGradient
                colors={[...tier.colors]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={S.tierPill}
              >
                <Text style={S.tierPillTxt}>{tier.label}</Text>
              </LinearGradient>
            </View>
            {isVerified && (
              <View style={S.verPill}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#1F7FE5' }} />
                <Text style={S.verPillTxt}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* ROW 3 — activity bar */}
        {activityCount > 0 && (
          <TouchableOpacity onPress={onActivityPress} activeOpacity={0.85} style={S.actBar}>
            <View style={S.actDot} />
            <Text style={S.actTxt}>
              <Text style={S.actBold}>{activityCount} new profiles </Text>
              matched your preferences today
            </Text>
            <Text style={S.actCta}>View ›</Text>
          </TouchableOpacity>
        )}

      </View>

      {/* ── STATS CARD ─────────────────────── */}
      <View style={S.statsCard}>
        <LinearGradient
          colors={['#1F7FE5', '#8b6fd9', '#e85a7a']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={S.statsAccent}
        />
        <View style={S.statsGrid}>
          {STAT_CONFIG.map((st, i) => (
            <TouchableOpacity
              key={st.key}
              style={[S.statCell, i < STAT_CONFIG.length - 1 && S.statBorder]}
              onPress={() => onStatsPress?.(st.key)}
              activeOpacity={0.75}
            >
              <View style={[S.statIcon, { backgroundColor: st.bg }]}>
                <st.Icon
                  size={18} color={st.ic}
                  fill={st.filled ? st.ic : 'none'}
                  strokeWidth={2.5}
                />
              </View>
              <Text style={S.statCount}>{st.value}</Text>
              <Text style={S.statLbl}>{st.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={S.statsFoot}>
          <View style={S.sfLeft}>
            <Clock size={10} color="#94a3b8" strokeWidth={2} />
            <Text style={S.sfMetaTxt}>Updated just now</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={S.sfRight} disabled={refreshing}>
            <Animated.View style={refreshAnimStyle}>
              <RefreshCw size={10} color="#1F7FE5" strokeWidth={2.5} />
            </Animated.View>
            <Text style={S.sfCtaTxt}>{refreshing ? 'Refreshing...' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
};

// ─────────────────────────────��───────────────
//  Styles
// ──────────────────────���──────────────────────
const AV = 46; const RP = 2.5;

const S = StyleSheet.create({

  // Header
  headerShell: {
    borderBottomLeftRadius: 34, borderBottomRightRadius: 34,
    overflow: 'hidden',
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#3D5A80', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },

  // Row 1 — Instagram-style brand bar
  row1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingTop: 4 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoRing: { width: 42, height: 42, borderRadius: 21, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  logoGrad: { position: 'absolute', width: 42, height: 42, borderRadius: 21 },
  logoInner: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', backgroundColor: '#fff', padding: 1 },
  brandLogo: { width: '100%', height: '100%', borderRadius: 18 },
  brandTitle: { fontSize: 18, fontFamily: 'Rubik-ExtraBold', color: '#162336', letterSpacing: -0.2 },
  brandAccent: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  accentLine: { width: 14, height: 1, backgroundColor: '#C59A40' },
  brandSub: { fontSize: 8, fontFamily: 'Rubik-Medium', color: '#C59A40', letterSpacing: 2.5 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EDF1F7', borderWidth: 1, borderColor: '#DDE4ED',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  bellBadgeTxt: { fontSize: 9, fontFamily: 'Rubik-ExtraBold', color: '#FFFFFF', lineHeight: 11 },

  // Row 2 — User section
  row2: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avWrap: { width: AV + RP * 2, height: AV + RP * 2, position: 'relative', flexShrink: 0 },
  ring: { position: 'absolute', top: 0, left: 0, width: AV + RP * 2, height: AV + RP * 2, borderRadius: 16, overflow: 'hidden' },
  avFrame: { position: 'absolute', top: RP, left: RP, width: AV, height: AV, borderRadius: 14, overflow: 'hidden', backgroundColor: '#FFFFFF', padding: 1.5 },
  avImg: { width: '100%', height: '100%', borderRadius: 12, resizeMode: 'cover' },
  onlineWrap: { position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  onlineCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#34D399', borderWidth: 2, borderColor: '#E8EEF5' },
  onlinePulse: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#34D399' },

  nameCol: { flex: 1, minWidth: 0 },
  welcomeLbl: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#94A3B8', letterSpacing: 0.4, marginBottom: 1 },
  nameFull: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#162336', letterSpacing: -0.3, lineHeight: 20 },
  nameLast: { fontFamily: 'Rubik-Medium', color: '#3E5871' },
  midRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  midDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#C59A40' },
  midTxt: { fontSize: 9, fontFamily: 'Rubik-Medium', color: '#A0ADB8', letterSpacing: 1 },

  tierCol: { flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  pillShadow: { borderRadius: 100, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 2 },
  tierPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  tierPillTxt: { fontSize: 10, fontFamily: 'Rubik-Bold', color: '#FFFFFF', letterSpacing: 0.3 },
  verPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: 'rgba(31,127,229,0.08)', borderWidth: 1, borderColor: 'rgba(31,127,229,0.12)' },
  verPillTxt: { fontSize: 9, fontFamily: 'Rubik-Medium', color: '#1F7FE5', letterSpacing: 0.2 },

  // Row 3
  actBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 8, paddingHorizontal: 12, backgroundColor: 'rgba(31,127,229,0.055)', borderWidth: 1, borderColor: 'rgba(31,127,229,0.10)', borderRadius: 12 },
  actDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399', flexShrink: 0 },
  actTxt: { flex: 1, fontSize: 12, fontFamily: 'Rubik-Medium', color: '#3E5871', lineHeight: 17 },
  actBold: { fontFamily: 'Rubik-Bold', color: '#162336' },
  actCta: { fontSize: 11, fontFamily: 'Rubik-Bold', color: '#1F7FE5', flexShrink: 0 },

  // Stats card
  statsCard: {
    marginHorizontal: 14, marginTop: 10,
    backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0f2346', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  statsAccent: { height: 3 },
  statsGrid: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 8 },
  statCell: { flex: 1, alignItems: 'center', gap: 6 },
  statBorder: { borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statCount: { fontSize: 20, fontFamily: 'Rubik-Bold', color: '#0f1724', letterSpacing: -0.8, lineHeight: 22 },
  statLbl: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#64748b' },
  statsFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 13, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  sfLeft:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sfMetaTxt: { fontSize: 10, fontFamily: 'Rubik-Regular', color: '#94a3b8' },
  sfRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sfCtaTxt: { fontSize: 10, fontFamily: 'Rubik-Medium', color: '#1F7FE5' },
});

export default VVMWelcomeHeader;
