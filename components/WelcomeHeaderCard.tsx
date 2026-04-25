import React, { useEffect } from 'react';
import {
  View,
  Text as TextNative,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Crown,
  Award,
  User,
  BadgeCheck,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = Math.round(SCREEN_HEIGHT * 0.09);

const resolveTier = (tierName: string | undefined) => {
  const key = (tierName || '').toLowerCase();
  if (key.includes('platinum')) return { name: 'Platinum', gradient: ['#B8B8C8', '#6C6C7F'] as const, textColor: '#1A1A24', glow: 'rgba(130,130,160,0.4)', Icon: Crown };
  if (key.includes('gold')) return { name: 'Gold', gradient: ['#F5A425', '#E08D10'] as const, textColor: '#4A2E06', glow: 'rgba(245,164,37,0.45)', Icon: Crown };
  if (key.includes('silver')) return { name: 'Silver', gradient: ['#D5DAE0', '#9AA4B1'] as const, textColor: '#1E293B', glow: 'rgba(154,164,177,0.35)', Icon: Award };
  if (key.includes('starter') || key.includes('basic')) return { name: 'Starter', gradient: ['#A7D5F5', '#5AA7DF'] as const, textColor: '#0C3D66', glow: 'rgba(90,167,223,0.35)', Icon: Award };
  if (key.includes('classic') || key.includes('bronze')) return { name: 'Classic', gradient: ['#F5C77E', '#D4943A'] as const, textColor: '#5C3A10', glow: 'rgba(212,148,58,0.35)', Icon: Award };
  return { name: 'Free Member', gradient: ['#E2E8F0', '#CBD5E1'] as const, textColor: '#1E293B', glow: 'rgba(203,213,225,0.3)', Icon: User };
};

const RotatingRing = () => {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return (
    <Animated.View style={[styles.ring, animatedStyle]}>
      <LinearGradient colors={['#F5A425', '#1F7FE5', '#E85A7A', '#F5A425']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
    </Animated.View>
  );
};

const OnlineDot = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.8, { duration: 1200, easing: Easing.out(Easing.ease) }), withTiming(1, { duration: 0 })), -1, false);
    opacity.value = withRepeat(withSequence(withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }), withTiming(0.6, { duration: 0 })), -1, false);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <View style={styles.onlineWrap}>
      <Animated.View style={[styles.onlinePulse, pulseStyle]} />
      <View style={styles.onlineCore} />
    </View>
  );
};

interface WelcomeHeaderCardProps {
  userData: any;
  tierName?: string;
  unreadCount?: number;
  router: any;
  isVerified?: boolean;
}

const WelcomeHeaderCard: React.FC<WelcomeHeaderCardProps> = ({ userData, tierName, unreadCount = 0, router, isVerified = false }) => {
  const insets = useSafeAreaInsets();
  const tier = resolveTier(tierName);
  const TierIcon = tier.Icon;

  const avatarSource = userData.profileImage
    ? { uri: userData.profileImage }
    : userData.gender === 'M'
      ? require('../assets/images/avatarMen.png')
      : (userData.gender === 'F'
        ? require('../assets/images/avatarWomen.png')
        : require('../assets/images/defaultAvatar.png'));

  return (
    <View style={[styles.header, { height: HEADER_HEIGHT + insets.top + 8, paddingTop: insets.top + 6 }]}>
      <LinearGradient colors={['#ffffff', '#f0f4f8', '#e4ecf3', '#dce6ef']} locations={[0, 0.3, 0.7, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />
      {/* Gradient only — no bubble overlays */}

      <View style={styles.contentRow}>
        <View style={styles.avatarWrap}>
          <RotatingRing />
          <View style={styles.avatarInnerFrame}>
            <Image source={avatarSource} style={styles.avatarImage} />
          </View>
          <OnlineDot />
        </View>

        <View style={styles.textBlock}>
          <TextNative style={styles.greetingMuted}>Welcome back,</TextNative>
          <TextNative style={styles.greetingName} numberOfLines={1}>
            {userData.firstName}{' '}
            <TextNative style={styles.greetingNameLight}>{userData.lastName}</TextNative>
          </TextNative>
          <View style={styles.pillsRow}>
            <View style={[styles.pillShadowWrap, { shadowColor: tier.glow }]}>
              <LinearGradient colors={[...tier.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tierPill}>
                <TierIcon size={11} color={tier.textColor} />
                <TextNative style={[styles.tierPillText, { color: tier.textColor }]}>{tier.name}</TextNative>
              </LinearGradient>
            </View>
            {isVerified && (
              <View style={[styles.pillShadowWrap, { shadowColor: 'rgba(31,127,229,0.4)' }]}>
                <LinearGradient colors={['#1F7FE5', '#1862B8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.verifiedPill}>
                  <BadgeCheck size={11} color="#fff" />
                  <TextNative style={styles.verifiedPillText}>Verified</TextNative>
                </LinearGradient>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={() => router?.push('/screens/NotificationScreen')} style={styles.bellTouch}>
          <View style={styles.bellCircle}>
            <Bell size={20} color="#0f1724" strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <TextNative style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</TextNative>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AVATAR_SIZE = 56;
const RING_PAD = 2.5;
const BOTTOM_RADIUS = 36;

const styles = StyleSheet.create({
  header: { width: '100%', borderBottomLeftRadius: BOTTOM_RADIUS, borderBottomRightRadius: BOTTOM_RADIUS, overflow: 'hidden', position: 'relative', shadowColor: '#0f1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  // Glow styles removed — gradient only
  contentRow: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },
  avatarWrap: { width: AVATAR_SIZE + RING_PAD * 2, height: AVATAR_SIZE + RING_PAD * 2, position: 'relative', marginRight: 12 },
  ring: { position: 'absolute', top: 0, left: 0, width: AVATAR_SIZE + RING_PAD * 2, height: AVATAR_SIZE + RING_PAD * 2, borderRadius: 18, overflow: 'hidden' },
  avatarInnerFrame: { position: 'absolute', top: RING_PAD, left: RING_PAD, width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 15, overflow: 'hidden', backgroundColor: '#fff', padding: 1.5 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 13, resizeMode: 'cover' },
  onlineWrap: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  onlineCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2E9A5C', borderWidth: 2, borderColor: '#BCD0E3' },
  onlinePulse: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#2E9A5C' },
  textBlock: { flex: 1, minWidth: 0 },
  greetingMuted: { fontSize: 11, fontWeight: '500', color: '#475569', letterSpacing: -0.1, marginBottom: 1 },
  greetingName: { fontSize: 19, fontWeight: '800', color: '#0f1724', letterSpacing: -0.5, lineHeight: 23 },
  greetingNameLight: { fontWeight: '500', color: '#334155' },
  pillsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 6 },
  pillShadowWrap: { borderRadius: 100, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 3 },
  tierPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, gap: 4 },
  tierPillText: { fontSize: 11, fontWeight: '700', letterSpacing: -0.1 },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, gap: 4 },
  verifiedPillText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: -0.1 },
  bellTouch: { marginLeft: 8 },
  bellCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f1724', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, position: 'relative' },
  bellBadge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#F43F5E', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff' },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: -0.1 },
});

export default WelcomeHeaderCard;