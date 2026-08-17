import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Check, X, Clock, CheckCircle, CircleDot, Circle, Shield, Compass, Rocket, Award, Star, Gem } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeInDown,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import userApi from '../api/userApi';
import { useUserData } from '../contexts/UserDataContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { usePopup } from '../contexts/PopupContext';
import { getActivePlansSync } from '../utils/upgradeNavigation';
import { buildChecklistByPlan } from '../utils/planChecklist';

// Same soft blue backdrop used app-wide (explore.tsx / profile.tsx) instead of a standalone
// pink/rose theme, so this screen reads as part of the same app rather than a bolted-on paywall.
const BG_GRADIENT = ['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa'] as const;
const BG_LOCATIONS = [0, 0.3, 0.6, 1.0] as const;

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_MARGIN = 20;

interface ChecklistRow {
  label: string;
  included: boolean;
}

interface Plan {
  id: number;
  title: string;
  price: string;
  originalPrice: string;
  period: string;
  discount: string;
  savings: string;
  isActive: boolean;
  isPopular?: boolean;
  checklist: ChecklistRow[];
  tagline?: string;
  planDescription?: string;
  pricePerDay?: string;
}

// Real, derived value (price ÷ real duration) — not a fabricated stat. Only shown for plans with
// a genuine short/medium duration (a few days to a year); skipped for Free (₹0) and Platinum
// ("until marriage", durationDays=9999) where a per-day figure would be meaningless or misleading.
function computePricePerDay(price: number, durationDays: number): string {
  if (!durationDays || durationDays <= 0 || durationDays > 365 || price <= 0) return '';
  const perDay = price / durationDays;
  return `≈ ₹${perDay < 10 ? perDay.toFixed(1) : Math.round(perDay)}/day`;
}

// Same tier-color language used for plan badges on SearchResult.tsx / ProfileDetail.tsx, so a
// plan card here visually matches the badge a member sees on their own profile elsewhere in the app.
const TIER_ORDER = ['Free', 'Starter', 'Classic', 'Silver', 'Gold', 'Platinum'];
function getTierKey(title: string): string {
  return TIER_ORDER.find((t) => title.includes(t)) || 'Starter';
}
function getTierBadge(tier: string): { gradient: [string, string]; textColor: string } {
  switch (tier) {
    case 'Platinum': return { gradient: ['#eef2f7', '#c7d1db'], textColor: '#0f1724' };
    case 'Gold': return { gradient: ['#FFE067', '#F6B733'], textColor: '#5E4200' };
    case 'Silver': return { gradient: ['#f4f6f8', '#cbd5e1'], textColor: '#0f1724' };
    case 'Classic': return { gradient: ['#e2a76f', '#8B4513'], textColor: '#fff' };
    case 'Starter': return { gradient: ['#dfecfb', '#bcdcfa'], textColor: '#1F7FE5' };
    default: return { gradient: ['#f1f5f9', '#e2e8f0'], textColor: '#64748b' };
  }
}

// One distinct icon per tier for the card's medallion — gives each plan a memorable visual
// identity beyond its name/badge, instead of every card looking identical apart from the price.
type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
function getTierIcon(tier: string): LucideIcon {
  switch (tier) {
    case 'Starter': return Rocket;
    case 'Classic': return Award;
    case 'Silver': return Star;
    case 'Gold': return Crown;
    case 'Platinum': return Gem;
    default: return Compass; // Free — start of the journey
  }
}

const HERO_TITLE = "Pricing";
const HERO_SUBTITLE = "Swipe to compare — pick the plan that fits your journey";

// A short dash that grows/brightens as its page comes into focus — driven directly off the
// carousel's live scroll position instead of the discrete `selectedPlan` state, so it animates
// smoothly mid-swipe rather than snapping at the end.
function DashDot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SCREEN_W, index * SCREEN_W, (index + 1) * SCREEN_W];
    const width = interpolate(scrollX.value, inputRange, [6, 18, 6], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP);
    return { width, opacity };
  });
  return <Animated.View style={[styles.dash, style]} />;
}

interface PlanCardProps {
  plan: Plan;
  index: number;
  scrollX: SharedValue<number>;
  isCurrentPlan: boolean;
  onUpgrade: () => void;
}

// Extracted so each card can drive its own scroll-linked scale/opacity + popular-badge pulse via
// Reanimated hooks (which must live inside a real component, not an inline renderItem closure).
function PlanCard({ plan, index, scrollX, isCurrentPlan, onUpgrade }: PlanCardProps) {
  const tier = getTierKey(plan.title);
  const tierBadge = getTierBadge(tier);
  const TierIcon = getTierIcon(tier);
  const isPopularHighlight = !!plan.isPopular && !isCurrentPlan;

  // Carousel "focus" effect — the centered card sits at full scale/opacity, neighbors ease back.
  const cardStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SCREEN_W, index * SCREEN_W, (index + 1) * SCREEN_W];
    const scale = interpolate(scrollX.value, inputRange, [0.92, 1, 0.92], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.6, 1, 0.6], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  // Subtle looping pulse on the "POPULAR" corner badge only — draws the eye without being gaudy.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isPopularHighlight) {
      pulse.value = withRepeat(withSequence(withTiming(1.06, { duration: 700 }), withTiming(1, { duration: 700 })), -1, true);
    }
  }, [isPopularHighlight]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const cornerBadge = isCurrentPlan
    ? { label: 'ACTIVE', dot: '#10b981', bg: '#e8f7ef', text: '#0f7a48' }
    : plan.isPopular
      ? { label: 'POPULAR', dot: '#5E4200', bg: '#FFE067', text: '#5E4200' }
      : plan.discount
        ? { label: `SAVE ${plan.discount.replace(/\s*OFF/i, '')}`, dot: '#1F7FE5', bg: '#dfecfb', text: '#1F7FE5' }
        : null;

  return (
    <View style={styles.cardPage}>
      {/* No outer page scroll anymore — only the checklist below scrolls internally, so the price
          and "Continue" button are always visible without an extra scroll-then-tap step. */}
      <Animated.View style={[styles.planCard, isPopularHighlight && styles.planCardPopular, cardStyle]}>
        {cornerBadge && (
          <Animated.View style={[styles.cornerBadge, { backgroundColor: cornerBadge.bg }, pulseStyle]}>
            <Text style={[styles.cornerBadgeText, { color: cornerBadge.text }]}>{cornerBadge.label}</Text>
            <View style={[styles.cornerBadgeDot, { backgroundColor: cornerBadge.dot }]} />
          </Animated.View>
        )}

        {/* Identity: medallion + name + tagline — decoupled from the money block below */}
        <View style={styles.identityRow}>
          <LinearGradient colors={tierBadge.gradient} style={styles.tierMedallion} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <TierIcon size={24} color={tierBadge.textColor} strokeWidth={2.2} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.planTitle}>{plan.title}</Text>
            {plan.tagline ? <Text style={styles.planTagline}>{plan.tagline}</Text> : null}
          </View>
        </View>

        {/* Money block */}
        <View style={styles.priceBlock}>
          <View style={styles.priceRow}>
            {plan.originalPrice ? <Text style={styles.originalPrice}>{plan.originalPrice}</Text> : null}
            <Text style={styles.price}>{plan.price}</Text>
            {plan.period ? <Text style={styles.periodInline}>{plan.period}</Text> : null}
          </View>
          {plan.pricePerDay ? <Text style={styles.pricePerDay}>{plan.pricePerDay}</Text> : null}
        </View>

        {plan.planDescription ? <Text style={styles.planDescription}>{plan.planDescription}</Text> : null}

        {plan.checklist.length > 0 && (
          <ScrollView style={styles.checklistScroll} showsVerticalScrollIndicator={true} contentContainerStyle={styles.checklistScrollContent}>
            <View style={styles.checklistDivider} />
            <Text style={styles.checklistLabel}>WHAT'S INCLUDED</Text>
            <View style={styles.checklist}>
              {plan.checklist.map((row, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(i * 30).duration(240)} style={styles.checkRow}>
                  <View style={[styles.checkIconWrap, row.included ? styles.checkIconIncluded : styles.checkIconExcluded]}>
                    {row.included ? (
                      <Check size={10} color="#ffffff" strokeWidth={3.5} />
                    ) : (
                      <X size={10} color="#94a3b8" strokeWidth={3.5} />
                    )}
                  </View>
                  <Text style={[styles.checkLabel, !row.included && styles.checkLabelExcluded]}>{row.label}</Text>
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        )}

        {isCurrentPlan ? (
          <View style={styles.ghostButton}>
            <Text style={styles.ghostButtonText}>Your Current Plan</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade} activeOpacity={0.9}>
            <LinearGradient colors={['#1F7FE5', '#1862b8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeGradient}>
              <Text style={styles.upgradeText}>Continue with this plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.trustLine}>
          <Shield size={12} color="#94a3b8" strokeWidth={2} />
          <Text style={styles.trustLineText}>Secure payment · Cancel anytime</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export default function PremiumTab() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment status tracking
  const { userData } = useUserData();
  const { subscriptionData } = useSubscription() || {};
  const popup = usePopup();
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Must be called unconditionally, before any of this component's early returns below (loading/
  // error/PENDING/APPROVED all `return` ahead of where this used to live) — Rules of Hooks.
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const role = await AsyncStorage.getItem('userRole');
        if (role === 'PARENT') {
          // Parents cannot manage subscriptions/payments — bounce them back
          router.replace('/(root)/(tabs)' as any);
          return;
        }
      } catch (_) { }
      fetchPaymentStatus();
      fetchData();
    })();
  }, []);

  const fetchPaymentStatus = async () => {
    try {
      if (!userData?.userId) return;
      const response = await userApi.getPaymentRequestsByUser(userData.userId);
      if (response.data?.code === 200 && response.data?.data) {
        setPaymentStatus(response.data.data.status);
        setPaymentData(response.data.data);
      }
    } catch (err) {
      console.log('No payment request found or error:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansResponse, matrixResponse] = await Promise.all([
        userApi.getAllActivePlans(),
        userApi.getPlanFeaturesMatrix().catch(() => null),
      ]);
      const apiResponseData = plansResponse?.data?.data;

      if (!Array.isArray(apiResponseData) || apiResponseData.length === 0) {
        throw new Error('Failed to fetch premium data');
      }

      const checklistByPlan = matrixResponse?.data?.data
        ? buildChecklistByPlan(matrixResponse.data.data)
        : {};

      // subscription_plans has exactly one row per tier — no duration-variant suffixing needed.
      const mappedPlans: Plan[] = apiResponseData.map((plan: any, index: number) => {
        const derivedPrice = parseFloat(plan.price || '0');
        const derivedOriginalPrice = plan.originalPrice != null ? parseFloat(plan.originalPrice) : null;
        const hasRealDiscount = derivedOriginalPrice != null && derivedOriginalPrice > derivedPrice;

        return {
          id: plan.id ?? index + 1,
          title: plan.title,
          price: `₹${derivedPrice.toLocaleString('en-IN')}`,
          originalPrice: hasRealDiscount ? `₹${derivedOriginalPrice!.toLocaleString('en-IN')}` : '',
          period: plan.period || '',
          discount: plan.discount || (hasRealDiscount
            ? `${Math.round(((derivedOriginalPrice! - derivedPrice) / derivedOriginalPrice!) * 100)}% OFF`
            : ''),
          savings: plan.savings || '',
          isActive: true, // server already filters to isActive=Y rows
          isPopular: !!plan.isPopular,
          checklist: checklistByPlan[plan.title] || [],
          tagline: plan.tagline || '',
          planDescription: plan.planDescription || '',
          pricePerDay: computePricePerDay(derivedPrice, Number(plan.durationDays) || 0),
        };
      });

      setPlans(mappedPlans);

      const popularIndex = mappedPlans.findIndex(p => p.isPopular);
      setSelectedPlan(popularIndex !== -1 ? popularIndex : 0);
    } catch (err) {
      console.error('Error fetching premium plans:', err);
      setError('Failed to load membership plans. Please try again later.');
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  // Last-resort fallback if the live API call fails AND the shared plan catalog is empty (see
  // `defaultPlans` below) — mirrors the actual 6 subscription_plans rows (see CLAUDE.md section 7),
  // not fabricated duration variants. No checklist data available offline (that comes from the
  // live /planFeatures/matrix call), so it's left empty per plan — the card just omits the
  // "What's included" section in that rare failure case.
  const hardcodedDefaultPlans: Plan[] = [
    {
      id: 1, title: 'Free', price: '₹0', originalPrice: '', period: '/lifetime', discount: '', savings: '', isActive: true, isPopular: false,
      tagline: 'உங்கள் பயணம் தொடங்குகிறது',
      planDescription: 'Browse profiles and send 3 free interests. Partnerஐ பார்க்க முடியும் — join பண்ணி start பண்ணுங்கள்!',
      checklist: [],
    },
    {
      id: 2, title: 'Starter', price: '₹499', originalPrice: '', period: '/30 days', discount: '', savings: '', isActive: true, isPopular: false,
      tagline: 'முதல் அடி எடுங்கள்',
      planDescription: '15 interests, see who viewed you, and explore advanced filters. Serious match தேட ஒரு perfect entry plan.',
      checklist: [], pricePerDay: computePricePerDay(499, 30),
    },
    {
      id: 3, title: 'Classic', price: '₹999', originalPrice: '', period: '/3 months', discount: '', savings: '', isActive: true, isPopular: false,
      tagline: 'தெளிவான தேர்வு',
      planDescription: '50 interests, full profile details, contact info, and limited "who viewed" — நிறைய options பாருங்கள்!',
      checklist: [], pricePerDay: computePricePerDay(999, 90),
    },
    {
      id: 4, title: 'Silver', price: '₹2,499', originalPrice: '', period: '/3 months', discount: '', savings: '', isActive: true, isPopular: true,
      tagline: 'இதயம் திறக்கும் நேரம்',
      planDescription: 'Unlimited requests, direct messaging, and full profile visibility. Oru real connection கட்ட இது right time!',
      checklist: [], pricePerDay: computePricePerDay(2499, 90),
    },
    {
      id: 5, title: 'Gold', price: '₹4,999', originalPrice: '', period: '/6 months', discount: '', savings: '', isActive: true, isPopular: true,
      tagline: 'தங்க வாழ்க்கை தொடர்புகள்',
      planDescription: 'Everything in Silver plus jathagam match, verification badge, and search boost. உங்கள் profile shine ஆகும்!',
      checklist: [], pricePerDay: computePricePerDay(4999, 180),
    },
    {
      id: 6, title: 'Platinum', price: '₹9,999', originalPrice: '', period: '/until marriage', discount: '', savings: '', isActive: true, isPopular: true,
      tagline: 'திருமணம் வரை நம்மோட உதவி',
      planDescription: 'All features until your wedding day — family chat, WhatsApp sharing, priority support. நாங்கள் உங்களோடு இருக்கோம்!',
      checklist: [],
    },
  ];

  // Offline fallback, in preference order:
  //  1. the shared active-plan catalog (utils/upgradeNavigation.ts) — its own AsyncStorage cache
  //     was last written from /subscriptionPlans/getAllActivePlans, so it already reflects the
  //     client's isActive flags and won't resurrect a deactivated tier here;
  //  2. the hardcoded 6-row list above, only if that catalog has nothing at all.
  const catalogPlans = getActivePlansSync();
  const defaultPlans: Plan[] = catalogPlans.length > 0
    ? catalogPlans.map((p, i) => ({
      id: i + 1,
      title: p.title,
      price: p.price,
      originalPrice: '',
      period: p.period ? (p.period.startsWith('/') ? p.period : `/${p.period}`) : '',
      discount: '',
      savings: '',
      isActive: true,
      isPopular: false,
      // Checklist + description come from the live /planFeatures/matrix call, which is exactly
      // what failed if we're here — the card omits those sections rather than showing stale data.
      checklist: [],
      tagline: p.tagline,
      planDescription: '',
    }))
    : hardcodedDefaultPlans;

  if (loading) {
    return (
      <LinearGradient colors={BG_GRADIENT} locations={BG_LOCATIONS} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Membership Plans' }} />
        <ActivityIndicator size="large" color="#1F7FE5" />
        <Text style={styles.loadingText}>Loading plans…</Text>
      </LinearGradient>
    );
  }

  if (error && !paymentStatus) {
    return (
      <LinearGradient colors={BG_GRADIENT} locations={BG_LOCATIONS} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Membership Plans' }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // PENDING payment — show payment under review
  if (paymentStatus === 'PENDING') {
    return (
      <LinearGradient colors={BG_GRADIENT} locations={BG_LOCATIONS} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
        <Stack.Screen options={{ title: 'Payment Status' }} />
        <ScrollView contentContainerStyle={styles.statusScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statusIconCircle}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statusIconGradient}>
              <Clock size={28} color="#ffffff" />
            </LinearGradient>
          </View>
          <Text style={styles.statusTitle}>Payment Under Review</Text>
          <Text style={styles.statusSubtitle}>Your payment is being verified. You'll be notified once approved.</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Details</Text>

            {paymentData?.createdAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Submitted</Text>
                <Text style={styles.detailValue}>
                  {new Date(paymentData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            )}

            {paymentData?.utrNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>UTR Number</Text>
                <Text style={styles.detailValue}>{paymentData.utrNumber}</Text>
              </View>
            )}

            <View style={[styles.detailRow, { marginBottom: 0 }]}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>PENDING</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verification Progress</Text>

            <View style={styles.stepRow}>
              <CheckCircle size={22} color="#10b981" />
              <View style={styles.stepText}>
                <Text style={styles.stepTitleDone}>Screenshot Uploaded</Text>
                <Text style={styles.stepSubtitle}>Payment proof received</Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <CircleDot size={22} color="#1F7FE5" />
              <View style={styles.stepText}>
                <Text style={styles.stepTitleActive}>Payment Verification</Text>
                <Text style={styles.stepSubtitle}>Admin is reviewing your payment</Text>
              </View>
            </View>

            <View style={[styles.stepRow, { marginBottom: 0 }]}>
              <Circle size={22} color="#d1d5db" />
              <View style={styles.stepText}>
                <Text style={styles.stepTitlePending}>Premium Activation</Text>
                <Text style={styles.stepSubtitle}>Will activate after approval</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Verification usually takes a few hours. If you have any concerns, please contact our support team.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Reverted to cover ANY non-Free plan (was narrowed to Platinum-only for a stretch while
  // "Upgrade Now"/premiumRequired flows still routed paid users here with no way to reach a
  // higher plan). Those flows now go through buildUpgradeAction() (utils/upgradeNavigation.ts)
  // to UpgradePlanScreen instead — PremiumTab is only reached via settingsPage's "See Your Plan"
  // (any paid tier, correctly dead-ends showing the active subscription) and a Free user's
  // first-purchase flow in PAYMENT_MODE=QR (never hits this branch, since planTitle is Free).
  if (paymentStatus === 'APPROVED' || (subscriptionData?.planTitle && subscriptionData.planTitle !== 'Free')) {
    const planName = subscriptionData?.planTitle || 'Premium';
    return (
      <LinearGradient colors={BG_GRADIENT} locations={BG_LOCATIONS} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
        <Stack.Screen options={{ title: 'Your Membership' }} />
        <ScrollView contentContainerStyle={styles.statusScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statusIconCircle}>
            <LinearGradient colors={['#FFE067', '#F6B733']} style={styles.statusIconGradient}>
              <Crown size={28} color="#5E4200" />
            </LinearGradient>
          </View>
          <Text style={styles.statusTitle}>You're a {planName} Member</Text>
          <Text style={styles.statusSubtitle}>Enjoy every feature of your plan while you find your match.</Text>

          <View style={styles.card}>
            <View style={styles.activeHeaderRow}>
              <CheckCircle size={22} color="#10b981" />
              <Text style={styles.activeHeaderText}>Active Subscription</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plan</Text>
              <Text style={styles.detailValue}>{planName}</Text>
            </View>

            {subscriptionData?.endDate && (
              <View style={[styles.detailRow, { marginBottom: 0 }]}>
                <Text style={styles.detailLabel}>Valid Until</Text>
                <Text style={styles.detailValue}>
                  {new Date(subscriptionData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  const handleUpgradePress = (plan: Plan) => {
    popup.confirm(
      'Confirm Upgrade',
      `Continue with ${plan.title} plan at ${plan.price}?`,
      () => {
        router.push({
          pathname: '/screens/PaymentScreen',
          params: {
            planTitle: plan.title,
            planPrice: plan.price,
            planPeriod: plan.title,
            planId: plan.id.toString(),
          },
        });
      },
      'Continue',
      'Cancel'
    );
  };

  const currentPlanTitle = subscriptionData?.planTitle || 'Free';

  const onCarouselScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setSelectedPlan(idx);
  };

  return (
    <LinearGradient colors={BG_GRADIENT} locations={BG_LOCATIONS} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
      <Stack.Screen options={{ title: 'Membership Plans' }} />

      {/* Header: page title left, live scroll-linked dash indicator right (mirrors reference) */}
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>{HERO_TITLE}</Text>
        <View style={styles.dashRow}>
          {plans.map((_, i) => (
            <DashDot key={i} index={i} scrollX={scrollX} />
          ))}
        </View>
      </View>
      <Text style={styles.introSubtitle}>{HERO_SUBTITLE}</Text>

      <Animated.FlatList
        style={styles.carousel}
        data={plans}
        keyExtractor={(p: Plan) => String(p.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        initialScrollIndex={selectedPlan ?? 0}
        getItemLayout={(_: unknown, index: number) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onCarouselScrollEnd}
        renderItem={({ item, index }: { item: Plan; index: number }) => (
          <PlanCard
            plan={item}
            index={index}
            scrollX={scrollX}
            isCurrentPlan={item.title === currentPlanTitle}
            onUpgrade={() => handleUpgradePress(item)}
          />
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1F7FE5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
  },

  // Header — page title + live scroll-linked dash indicator, top-right (matches reference)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
  },
  introSubtitle: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    color: '#64748b',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 8,
  },

  // Dash indicator
  dashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dash: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1F7FE5',
  },

  // Swipeable card — flex-bounded (not a free-scrolling page) so only the checklist below scrolls
  // internally; price/description stay fixed at top and the CTA/trust line stay pinned at the
  // bottom, reachable without any scroll-then-tap step.
  carousel: {
    flex: 1,
  },
  cardPage: {
    width: SCREEN_W,
    paddingHorizontal: CARD_MARGIN,
    paddingBottom: 16,
    flex: 1,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    position: 'relative',
    shadowColor: 'rgba(15,35,70,0.12)',
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  // Popular-plan highlight ring — mirrors the reference's yellow border around its featured card.
  planCardPopular: {
    borderWidth: 2.5,
    borderColor: '#F6B733',
    shadowColor: '#F6B733',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  // Corner badge — anchored top-right, matching the reference's "Active •" / "Popular •" /
  // "Save X% •" pill-with-dot treatment that sits into the card's own corner.
  cornerBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    zIndex: 2,
  },
  cornerBadgeText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.4,
  },
  cornerBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  // Identity — medallion + name + tagline, decoupled from the corner badge (paddingRight clears it)
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingRight: 60,
  },
  tierMedallion: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: {
    fontSize: 19,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
  },
  planTagline: {
    fontSize: 11.5,
    fontFamily: 'Rubik-Regular',
    color: '#1F7FE5',
    fontStyle: 'italic',
    marginTop: 2,
  },
  planDescription: {
    fontSize: 12.5,
    fontFamily: 'Rubik-Regular',
    color: '#64748b',
    lineHeight: 18,
    marginTop: 10,
  },
  priceBlock: {
    marginTop: 0,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 32,
    fontFamily: 'Rubik-ExtraBold',
    color: '#0f1724',
  },
  pricePerDay: {
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
    color: '#1F7FE5',
    marginTop: 3,
  },
  originalPrice: {
    fontSize: 15,
    fontFamily: 'Rubik-Regular',
    color: '#cbd5e1',
    textDecorationLine: 'line-through',
  },
  periodInline: {
    fontSize: 12.5,
    fontFamily: 'Rubik-Regular',
    color: '#94a3b8',
  },

  // Checklist — the only internally-scrolling region in the card (flex:1 fills whatever space is
  // left between the fixed header/price/description above and the fixed CTA/trust line below).
  checklistScroll: {
    flex: 1,
  },
  checklistScrollContent: {
    paddingBottom: 4,
  },
  checklistDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: '#e2e8f0',
    marginTop: 14,
    marginBottom: 10,
  },
  checklistLabel: {
    fontSize: 10,
    fontFamily: 'Rubik-Medium',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 10,
  },
  checklist: {
    gap: 9,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconIncluded: {
    backgroundColor: '#16a34a',
  },
  checkIconExcluded: {
    backgroundColor: '#f1f5f9',
  },
  checkLabel: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'Rubik-Regular',
    color: '#334155',
  },
  checkLabelExcluded: {
    color: '#cbd5e1',
  },

  // CTA (inside card) — fixed area below the scrollable checklist, always visible/reachable
  upgradeButton: {
    width: '100%',
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#1F7FE5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  upgradeGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  upgradeText: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  // Ghost/outline button for the current-plan state — mirrors the reference's "Cancel" treatment
  // (border only, no fill) instead of a solid grey disabled button.
  ghostButton: {
    width: '100%',
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13.5,
  },
  ghostButtonText: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#94a3b8',
    letterSpacing: 0.2,
  },
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  trustLineText: {
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
    color: '#94a3b8',
  },

  // Shared status card layout (PENDING / APPROVED branches)
  statusScrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 50,
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statusIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 19,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
    textAlign: 'center',
    marginBottom: 6,
  },
  statusSubtitle: {
    fontSize: 13,
    fontFamily: 'Rubik-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: 'rgba(15,35,70,0.08)',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Rubik-Regular',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#0f1724',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    color: '#d97706',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepText: {
    marginLeft: 12,
    flex: 1,
  },
  stepTitleDone: {
    fontSize: 13.5,
    fontFamily: 'Rubik-Medium',
    color: '#0f1724',
  },
  stepTitleActive: {
    fontSize: 13.5,
    fontFamily: 'Rubik-Medium',
    color: '#1F7FE5',
  },
  stepTitlePending: {
    fontSize: 13.5,
    fontFamily: 'Rubik-Medium',
    color: '#94a3b8',
  },
  stepSubtitle: {
    fontSize: 11.5,
    fontFamily: 'Rubik-Regular',
    color: '#64748b',
    marginTop: 1,
  },
  infoBanner: {
    width: '100%',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoBannerText: {
    fontSize: 12.5,
    fontFamily: 'Rubik-Regular',
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 18,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  activeHeaderText: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
  },
  goBackButton: {
    width: '100%',
    backgroundColor: '#1F7FE5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  goBackButtonText: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#ffffff',
  },
});
