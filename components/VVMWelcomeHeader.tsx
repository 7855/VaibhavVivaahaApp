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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell, Heart, Send, Eye, Sun, Moon, Crown, BadgeCheck,
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
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  return 'evening'; // covers 17:00 through 04:59 — no "Good Night" greeting
};


const resolveTier = (name = '') => {
  const k = name.toLowerCase();
  if (k.includes('platinum')) return { label: 'Platinum', colors: ['#6C63FF', '#4F46E5'] as const, glow: 'rgba(108,99,255,0.35)' };
  if (k.includes('gold')) return { label: 'Gold', colors: ['#C59A40', '#A67C28'] as const, glow: 'rgba(197,154,64,0.38)' };
  if (k.includes('silver')) return { label: 'Silver', colors: ['#7E909E', '#5F7385'] as const, glow: 'rgba(95,115,133,0.3)' };
  if (k.includes('starter')) return { label: 'Starter', colors: ['#4A9CD8', '#3280B8'] as const, glow: 'rgba(74,156,216,0.3)' };
  if (k.includes('classic')) return { label: 'Classic', colors: ['#C48550', '#A66D38'] as const, glow: 'rgba(196,133,80,0.3)' };
  return { label: 'Free', colors: ['#8899AA', '#6B7D8E'] as const, glow: 'transparent' };
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
      withTiming(1, { duration: 0 }),
    ), -1, false);
    op.value = withRepeat(withSequence(
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
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
  unreadCount = 0,
  activityCount = 0,
  stats = { likes: 0, proposals: 0, views: 0, matches: 0 },
  router,
  isVerified = false,
  memberId = '',
  onActivityPress,
  onStatRefresh,
  onStatsPress,
}) => {
  const tier = resolveTier(tierName);
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
    { key: 'likes', label: 'Likes', value: stats.likes, bg: '#8B3A3A', Icon: Heart, ic: '#ffffff', filled: false },
    { key: 'proposals', label: 'Proposals', value: stats.proposals, bg: '#8B3A3A', Icon: Send, ic: '#ffffff', filled: false },
    { key: 'views', label: 'Views', value: stats.views, bg: '#8B3A3A', Icon: Eye, ic: '#ffffff', filled: false },
    { key: 'matches', label: 'Matches', value: stats.matches, bg: '#8B3A3A', Icon: UserCheck, ic: '#ffffff', filled: false },
  ];

  return (
    <View>

      {/* ── HEADER ─────────────────────────── */}
      {/* No insets.top here — the Home screen's SafeAreaView now reserves the status-bar strip
          (edges includes 'top'), so adding it again would double-pad the header. */}
      <View style={S.headerShell}>
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
            {/* Variant B brand mark: rounded-SQUARE tile with a gold gradient border
                (mockup: 135° #F6B733→#C59A40, radius 12, 1.5px padding), our logo inside. */}
            <View style={S.logoRing}>
              <LinearGradient
                colors={['#F6B733', '#C59A40']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={S.logoGrad}
              />
              <View style={S.logoInner}>
                <Image source={require('../assets/images/vaibhavsplash.png')} style={S.brandLogo} />
              </View>
            </View>
            <View>
              <Text style={S.brandTitle}>Vaibhav Vivaaha</Text>
              {/* Plain letter-spaced gold caps — variant B has no accent lines beside it */}
              <Text style={S.brandSub}>MATRIMONY</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => router?.push('/screens/NotificationScreen')} activeOpacity={0.8}>
            <View style={S.bellBtn}>
              <Bell size={19} color="#33475c" strokeWidth={2} />
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

        {/* ROW 2 — name hero: greeting + big name + code/tier/verified on the LEFT,
            profile image alone on the RIGHT (bell lives on the brand row, top-right). */}
        <View style={S.row2}>
          <View style={S.nameCol}>
            <View style={S.greetRow}>
              {getGreetWord() === 'evening'
                ? <Moon size={12} color="#C59A40" strokeWidth={2.2} />
                : <Sun size={12} color="#C59A40" strokeWidth={2.2} />}
              <Text style={S.welcomeLbl}>Good {getGreetWord()},</Text>
            </View>
            <Text style={S.nameHero} numberOfLines={1}>
              {userData.firstName}{' '}
              <Text style={S.nameLast}>{userData.lastName}</Text>
            </Text>
            <View style={S.midRow}>
              <Text style={S.midTxt}>VVM · {memberId || 'MB00000'}</Text>
              <View style={[S.pillShadow, { shadowColor: tier.glow }]}>
                <LinearGradient
                  colors={[...tier.colors]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={S.tierPill}
                >
                  {tier.label !== 'FREE' && <Crown size={9} color="#FFFFFF" strokeWidth={2.5} />}
                  <Text style={S.tierPillTxt}>{tier.label}</Text>
                </LinearGradient>
              </View>
              {isVerified && (
                <View style={S.verPill}>
                  <BadgeCheck size={10} color="#1F7FE5" strokeWidth={2.4} />
                  <Text style={S.verPillTxt}>Verified</Text>
                </View>
              )}
            </View>
          </View>

          <View style={S.avWrap}>
            <RotatingRing />
            <View style={S.avFrame}>
              <Image source={avatarSource} style={S.avImg} />
            </View>
            <OnlineDot />
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
        {/* iOS-only: on Android expo-blur has no true backdrop blur — it falls back to a flat
            translucent overlay that does NOT clip to the parent's borderRadius, painting a
            hard-edged rectangle inside the rounded card. The opaque tint below covers the same
            frosted surface without the artifact. Same treatment as VVMFooterNav.tsx. */}
        {Platform.OS === 'ios' && (
          <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFillObject} />
        )}
        <View
          style={[S.statsCardTint, Platform.OS !== 'ios' && S.statsCardTintOpaque]}
          pointerEvents="none"
        />
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
const AV = 48; const RP = 2.5;

const S = StyleSheet.create({

  // Header
  // Flat bottom edge — the bottom-corner curves + drop shadow were removed so the header
  // gradient flows straight into the page content with no "floating panel" seam.
  headerShell: {
    overflow: 'hidden',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
  },

  // Row 1 — Instagram-style brand bar
  row1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingTop: 2 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoRing: { width: 39, height: 39, borderRadius: 12, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  logoGrad: { position: 'absolute', width: 39, height: 39, borderRadius: 12 },
  logoInner: { width: 36, height: 36, borderRadius: 11, overflow: 'hidden', backgroundColor: '#fff' },
  brandLogo: { width: '100%', height: '100%', borderRadius: 10 },
  brandTitle: { fontSize: 17, fontFamily: 'Rubik-ExtraBold', color: '#14202e', letterSpacing: -0.3, lineHeight: 21 },
  brandSub: { fontSize: 8, fontFamily: 'Rubik-Medium', color: '#C59A40', letterSpacing: 3.8, marginTop: 2 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    shadowColor: '#0f1724', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bellBadge: {
    position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  bellBadgeTxt: { fontSize: 9, fontFamily: 'Rubik-ExtraBold', color: '#FFFFFF', lineHeight: 11 },

  // Row 2 — User section
  row2: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avWrap: { width: AV + RP * 2, height: AV + RP * 2, position: 'relative', flexShrink: 0 },
  ring: { position: 'absolute', top: 0, left: 0, width: AV + RP * 2, height: AV + RP * 2, borderRadius: 17, overflow: 'hidden' },
  avFrame: { position: 'absolute', top: RP, left: RP, width: AV, height: AV, borderRadius: 15, overflow: 'hidden', backgroundColor: '#FFFFFF', padding: 1.5 },
  avImg: { width: '100%', height: '100%', borderRadius: 13, resizeMode: 'cover' },
  onlineWrap: { position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  onlineCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#34D399', borderWidth: 2, borderColor: '#E8EEF5' },
  onlinePulse: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#34D399' },

  nameCol: { flex: 1, minWidth: 0 },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  welcomeLbl: { fontSize: 12, fontFamily: 'Rubik-Regular', color: '#64748b', letterSpacing: 0.2 },
  nameFull: { fontSize: 17, fontFamily: 'Rubik-Bold', color: '#162336', letterSpacing: -0.3, lineHeight: 22 },
  // Variant E "name hero" — the member's name is the largest text in the header.
  nameHero: { fontSize: 19, fontFamily: 'Rubik-Bold', color: '#14202e', letterSpacing: -0.4, lineHeight: 24 },
  nameLast: { fontFamily: 'Rubik-Bold', color: '#14202e' },
  midRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3, flexWrap: 'wrap', rowGap: 4 },
  midDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#C59A40' },
  midTxt: { fontSize: 10.5, fontFamily: 'Rubik-Regular', color: '#7c8ba1', letterSpacing: 0.5 },

  tierCol: { flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  pillShadow: { borderRadius: 100, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 2 },
  tierPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, height: 19, borderRadius: 100 },
  tierPillTxt: { fontSize: 8.5, fontFamily: 'Rubik-Bold', color: '#FFFFFF', letterSpacing: 0.8 },
  verPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, height: 19, borderRadius: 100, backgroundColor: 'rgba(31,127,229,0.08)', borderWidth: 1, borderColor: 'rgba(31,127,229,0.14)' },
  verPillTxt: { fontSize: 8.5, fontFamily: 'Rubik-Medium', color: '#1F7FE5', letterSpacing: 0.3 },

  // Row 3
  actBar: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(31,127,229,0.055)', borderWidth: 1, borderColor: 'rgba(31,127,229,0.10)', borderRadius: 14 },
  actDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399', flexShrink: 0 },
  actTxt: { flex: 1, fontSize: 12, fontFamily: 'Rubik-Medium', color: '#3E5871', lineHeight: 17 },
  actBold: { fontFamily: 'Rubik-Bold', color: '#162336' },
  actCta: { fontSize: 11, fontFamily: 'Rubik-Bold', color: '#1F7FE5', flexShrink: 0 },

  // Stats card
  statsCard: {
    marginHorizontal: 14, marginTop: 10,
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    ...Platform.select({
      ios: { shadowColor: '#0f2346', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  statsCardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  // Android has no BlurView underneath, so the tint carries the whole surface — nudged
  // up to near-opaque so the card reads the same frosted white as it does on iOS.
  statsCardTintOpaque: {
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  statsAccent: { height: 3 },
  statsGrid: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 8 },
  statCell: { flex: 1, alignItems: 'center', gap: 6 },
  statBorder: { borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statCount: { fontSize: 20, fontFamily: 'Rubik-Bold', color: '#0f1724', letterSpacing: -0.8, lineHeight: 22 },
  statLbl: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#64748b' },
  statsFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 13, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  sfLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sfMetaTxt: { fontSize: 10, fontFamily: 'Rubik-Regular', color: '#94a3b8' },
  sfRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sfCtaTxt: { fontSize: 10, fontFamily: 'Rubik-Medium', color: '#1F7FE5' },
});

export default VVMWelcomeHeader;
