import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';

import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { buildUpgradeAction } from '../utils/upgradeNavigation';

type BadgeStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_STARTED';

interface BadgeDef {
  key: 'email' | 'id' | 'education' | 'income';
  label: string;
  description: string;
  iconName: any;
  iconLib: 'mci';
  color: string;
  lockPlan?: 'Silver' | 'Gold';
  route?: string;
}

const BADGES: BadgeDef[] = [
  {
    key: 'email',
    label: 'Email',
    description: 'Confirmed at signup via OTP',
    iconName: 'email-check',
    iconLib: 'mci',
    color: '#10b981',
  },
  {
    key: 'id',
    label: 'Government ID',
    description: 'Aadhaar · PAN · DL · Passport',
    iconName: 'shield-check',
    iconLib: 'mci',
    color: '#3b82f6',
    lockPlan: 'Silver',
    route: '/(root)/screens/IdVerificationScreen',
  },
  {
    key: 'education',
    label: 'Education',
    description: 'Degree · diploma · professional cert',
    iconName: 'school',
    iconLib: 'mci',
    color: '#8b5cf6',
    lockPlan: 'Silver',
    route: '/(root)/screens/EducationVerificationScreen',
  },
  {
    key: 'income',
    label: 'Income',
    description: 'Salary slip · ITR · offer letter',
    iconName: 'briefcase-check',
    iconLib: 'mci',
    color: '#d4a017',
    lockPlan: 'Gold',
    route: '/(root)/screens/IncomeVerificationScreen',
  },
];

const STATUS_LABEL: Record<BadgeStatus, string> = {
  VERIFIED: 'Verified',
  PENDING: 'In review',
  REJECTED: 'Rejected',
  NOT_STARTED: 'Not started',
};

const STATUS_COLOR: Record<BadgeStatus, { bg: string; fg: string }> = {
  VERIFIED: { bg: '#d1fae5', fg: '#047857' },
  PENDING: { bg: '#fef3c7', fg: '#b45309' },
  REJECTED: { bg: '#fee2e2', fg: '#b91c1c' },
  NOT_STARTED: { bg: '#f3f4f6', fg: '#6b7280' },
};

// SVG circular progress ring
const ProgressRing: React.FC<{
  size: number;
  strokeWidth: number;
  percent: number;
  color: string;
  bgColor?: string;
}> = ({ size, strokeWidth, percent, color, bgColor = '#f1f5f9' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percent))) / 100;
  const center = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={bgColor}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
    </Svg>
  );
};

export default function TrustVerificationScreen() {
  const popup = usePopup();
  const { subscriptionData } = useSubscription() || {};
  const planTitle = subscriptionData?.planTitle;

  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<BadgeDef['key'], BadgeStatus>>({
    email: 'VERIFIED',
    id: 'NOT_STARTED',
    education: 'NOT_STARTED',
    income: 'NOT_STARTED',
  });

  const isSilverPlus = planTitle === 'Silver' || planTitle === 'Gold' || planTitle === 'Platinum';
  const isGoldPlus = planTitle === 'Gold' || planTitle === 'Platinum';

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (!id) { setLoading(false); return; }

        const [idRes, eduRes, incRes] = await Promise.allSettled([
          userApi.getIdVerificationStatus(id),
          userApi.getEducationVerificationStatus(id),
          userApi.getIncomeVerificationStatus(id),
        ]);
        if (!alive) return;

        const toStatus = (flag: boolean, latest: any): BadgeStatus => {
          if (flag) return 'VERIFIED';
          if (!latest) return 'NOT_STARTED';
          if (latest.status === 'PENDING') return 'PENDING';
          if (latest.status === 'REJECTED') return 'REJECTED';
          return 'NOT_STARTED';
        };

        const next: Record<BadgeDef['key'], BadgeStatus> = {
          email: 'VERIFIED',
          id: 'NOT_STARTED',
          education: 'NOT_STARTED',
          income: 'NOT_STARTED',
        };
        if (idRes.status === 'fulfilled' && idRes.value?.data?.code === 200) {
          const d = idRes.value.data.data;
          next.id = toStatus(d?.idVerified === true, d?.latestSubmission);
        }
        if (eduRes.status === 'fulfilled' && eduRes.value?.data?.code === 200) {
          const d = eduRes.value.data.data;
          next.education = toStatus(d?.educationVerified === true, d?.latestSubmission);
        }
        if (incRes.status === 'fulfilled' && incRes.value?.data?.code === 200) {
          const d = incRes.value.data.data;
          next.income = toStatus(d?.incomeVerified === true, d?.latestSubmission);
        }
        setStatuses(next);
      } catch (_) { }
      finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const verifiedCount = Object.values(statuses).filter((s) => s === 'VERIFIED').length;
  const pendingCount = Object.values(statuses).filter((s) => s === 'PENDING').length;
  const totalCount = 4;
  const progressPercent = (verifiedCount / totalCount) * 100;

  const taglineForCount = (c: number) => {
    if (c === 0) return 'Start building trust';
    if (c === 1) return 'Good start — keep going';
    if (c === 2) return 'Halfway there';
    if (c === 3) return 'One more to go';
    return 'Fully verified';
  };

  const isLocked = (badge: BadgeDef): boolean => {
    if (!badge.lockPlan) return false;
    if (badge.lockPlan === 'Silver') return !isSilverPlus;
    if (badge.lockPlan === 'Gold') return !isGoldPlus;
    return false;
  };

  const handleBadgePress = (badge: BadgeDef) => {
    if (!badge.route) return; // email has no upload flow
    if (isLocked(badge)) {
      const msg = badge.lockPlan === 'Gold'
        ? `Upgrade to Gold or Platinum to verify your ${badge.label.toLowerCase()}.`
        : `Upgrade to Silver or above to verify your ${badge.label.toLowerCase()}.`;
      popup.premiumRequired(msg, buildUpgradeAction({ planTitle, featureName: `${badge.label} Verification`, minPlan: badge.lockPlan }));
      return;
    }
    router.push(badge.route as any);
  };

  return (
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Trust & Verification' }} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ────── HERO CARD ────── */}
        <View style={s.heroCard}>
          <View style={s.heroRow}>
            {/* Circular progress ring with % inside */}
            <View style={s.ringWrap}>
              <ProgressRing size={96} strokeWidth={9} percent={progressPercent} color="#10b981" />
              <View style={s.ringCenter}>
                {loading ? (
                  <ActivityIndicator size="small" color="#10b981" />
                ) : (
                  <>
                    <Text style={s.ringPercent}>{Math.round(progressPercent)}%</Text>
                    <Text style={s.ringOf}>{verifiedCount}/{totalCount}</Text>
                  </>
                )}
              </View>
            </View>

            {/* Title + subtitle + mini stats */}
            <View style={s.heroInfo}>
              <Text style={s.heroEyebrow}>TRUST SCORE</Text>
              <Text style={s.heroTitle}>{taglineForCount(verifiedCount)}</Text>
              <Text style={s.heroSubtitle}>
                Complete all badges to unlock maximum profile trust
              </Text>
              <View style={s.statsRow}>
                <View style={s.statPill}>
                  <View style={[s.statDot, { backgroundColor: '#10b981' }]} />
                  <Text style={s.statText}>{verifiedCount} verified</Text>
                </View>
                {pendingCount > 0 ? (
                  <View style={s.statPill}>
                    <View style={[s.statDot, { backgroundColor: '#f59e0b' }]} />
                    <Text style={s.statText}>{pendingCount} in review</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Thin progress bar below hero row */}
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* ────── BENEFITS STRIP ────── */}
        <View style={s.benefitsRow}>
          <View style={s.benefitChip}>
            <Feather name="trending-up" size={13} color="#059669" />
            <Text style={s.benefitText}>5× more interest</Text>
          </View>
          <View style={s.benefitChip}>
            <Feather name="lock" size={13} color="#059669" />
            <Text style={s.benefitText}>Private & secure</Text>
          </View>
          <View style={s.benefitChip}>
            <Feather name="check-circle" size={13} color="#059669" />
            <Text style={s.benefitText}>24h review</Text>
          </View>
        </View>

        {/* ────── BADGES LIST ────── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionHeaderText}>Your Badges</Text>
          <Text style={s.sectionHeaderCount}>{verifiedCount} of {totalCount}</Text>
        </View>

        <View style={s.listCard}>
          {BADGES.map((badge, idx) => {
            const status = statuses[badge.key];
            const locked = isLocked(badge);
            const isVerified = status === 'VERIFIED';
            const effectiveStatus: BadgeStatus = locked && !isVerified ? 'NOT_STARTED' : status;
            const statusMeta = STATUS_COLOR[effectiveStatus];

            return (
              <TouchableOpacity
                key={badge.key}
                style={[
                  s.row,
                  idx !== BADGES.length - 1 && s.rowDivider,
                ]}
                activeOpacity={0.7}
                onPress={() => handleBadgePress(badge)}
              >
                {/* Left color stripe indicating verified state */}
                <View
                  style={[
                    s.stripe,
                    { backgroundColor: isVerified ? badge.color : '#e5e7eb' },
                  ]}
                />

                {/* Icon circle */}
                <View
                  style={[
                    s.iconCircle,
                    {
                      backgroundColor: isVerified ? badge.color : `${badge.color}15`,
                      opacity: locked && !isVerified ? 0.5 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={badge.iconName}
                    size={22}
                    color={isVerified ? '#fff' : badge.color}
                  />
                </View>

                {/* Middle: label + description + status pill */}
                <View style={s.rowMiddle}>
                  <View style={s.rowTitleRow}>
                    <Text style={s.rowTitle}>{badge.label}</Text>
                    {isVerified ? (
                      <MaterialCommunityIcons name="check-decagram" size={14} color={badge.color} />
                    ) : null}
                  </View>
                  <Text style={s.rowDesc} numberOfLines={1}>
                    {badge.description}
                  </Text>
                  <View style={s.rowStatusRow}>
                    <View style={[s.statusPill, { backgroundColor: statusMeta.bg }]}>
                      <Text style={[s.statusPillText, { color: statusMeta.fg }]}>
                        {STATUS_LABEL[effectiveStatus]}
                      </Text>
                    </View>
                    {locked && !isVerified ? (
                      <View style={[s.lockPill, { backgroundColor: '#f3e8ff' }]}>
                        <Ionicons name="lock-closed" size={9} color="#7c3aed" />
                        <Text style={s.lockPillText}>{badge.lockPlan}+</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Right chevron */}
                {badge.route ? (
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                ) : (
                  <View style={{ width: 18 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer note */}
        <View style={s.footNote}>
          <Ionicons name="shield-checkmark" size={12} color="#6b7280" />
          <Text style={s.footNoteText}>
            Your documents are encrypted and only visible to our verification team
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, paddingBottom: 32 },

  // ── HERO ──
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  ringWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: { fontSize: 22, fontFamily: 'Rubik-ExtraBold', color: '#111827', lineHeight: 24 },
  ringOf: { fontSize: 10, color: '#6b7280', fontFamily: 'Rubik-Medium' },

  heroInfo: { flex: 1, marginLeft: 16 },
  heroEyebrow: {
    fontSize: 10,
    fontFamily: 'Rubik-ExtraBold',
    letterSpacing: 1.2,
    color: '#9ca3af',
    marginBottom: 3,
  },
  heroTitle: {
    fontSize: 19,
    fontFamily: 'Rubik-ExtraBold',
    color: '#111827',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 15,
    marginBottom: 10,
  },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statText: { fontSize: 10, fontFamily: 'Rubik-Medium', color: '#374151' },

  barTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 14,
  },
  barFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },

  // ── BENEFIT CHIPS ──
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  benefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  benefitText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
    color: '#047857',
    marginLeft: 5,
  },

  // ── SECTION HEADER ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontFamily: 'Rubik-ExtraBold',
    letterSpacing: 1,
    color: '#6b7280',
  },
  sectionHeaderCount: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    color: '#10b981',
  },

  // ── BADGE LIST CARD ──
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  stripe: {
    width: 3,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowMiddle: { flex: 1 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowTitle: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#111827' },
  rowDesc: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  rowStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  lockPillText: {
    fontSize: 9,
    fontFamily: 'Rubik-Bold',
    color: '#7c3aed',
    marginLeft: 3,
  },

  // ── FOOT NOTE ──
  footNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  footNoteText: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 5,
    textAlign: 'center',
  },
});
