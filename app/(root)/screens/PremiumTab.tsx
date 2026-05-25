import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, MessageCircle, Eye, Heart, Star, Shield, Users, Gift, Check, Sparkles, HeartHandshake, BellRing as Rings, Clock, CheckCircle, CircleDot, Circle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import userApi from '../api/userApi';
import { router } from 'expo-router';
import { useUserData } from '../contexts/UserDataContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { usePopup } from '../contexts/PopupContext';
// import RazorpayCheckout from 'react-native-razorpay';
// Auth context removed as it's not used in this component

// Define Lucide icon component type
type LucideIcon = React.ComponentType<{ size?: number; color?: string }>;

interface PremiumFeature {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  isActive: boolean;
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
  features?: string[];
  tagline?: string;
  planDescription?: string;
}

// Mock API response simulating the exact structure to be expected from backend matching static JSON requests
const MOCK_API_RESPONSE = {
  status: "success",
  heroTitle: "Unlock Premium Matrimony 💕",
  heroSubtitle: "Find your soulmate faster with exclusive matrimony features ❤️",
  data: [
    {
      id: 1, created: "2025-12-29 12:29:05", createdBy: "system", active: "Y", durationDays: 0, durationMonths: 0, period: "/free", price: "0.00", originalPrice: "0.00", title: "Free", discount: "", savings: "Starter",
      tagline: "உங்கள் பயணம் தொடங்குகிறது",
      planDescription: "Browse profiles and send 3 free interests. Partnerஐ பார்க்க முடியும் — join பண்ணி start பண்ணுங்கள்!",
      features: ["Browse profiles by age, caste & location", "Save favourite profiles", "3 free interest requests"]
    },
    {
      id: 2, created: "2025-12-29 12:29:05", createdBy: "system", active: "Y", durationDays: 90, durationMonths: 3, period: "/3 months", price: "199.00", originalPrice: "499.00", title: "Starter", discount: "60% OFF", savings: "Entry",
      tagline: "முதல் அடி எடுங்கள்",
      planDescription: "15 interests, see who viewed you, and explore advanced filters. Serious match தேட ஒரு perfect entry plan.",
      features: ["Advanced filters — education, income & more", "15 interest requests", "See who viewed you (last 5)", "View all profile photos"]
    },
    {
      id: 3, created: "2025-12-29 12:29:05", createdBy: "system", active: "Y", durationDays: 90, durationMonths: 3, period: "/3 months", price: "999.00", originalPrice: "1499.00", title: "Classic", discount: "33% OFF", savings: "Value",
      tagline: "தெளிவான தேர்வு",
      planDescription: "50 interests, full profile details, contact info, and limited \"who viewed\" — நிறைய options பாருங்கள்!",
      features: ["50 interest requests", "See full profile details & all photos", "See phone & personal contact info", "See who viewed you (last 20)", "Save favourite profiles"]
    },
    {
      id: 4, created: "2025-12-29 12:29:05", createdBy: "system", active: "Y", durationDays: 180, durationMonths: 6, period: "/6 months", price: "1499.00", originalPrice: "2499.00", title: "Classic", discount: "40% OFF", savings: "Best Value",
      tagline: "தெளிவான தேர்வு",
      planDescription: "50 interests, full profile details, contact info, and limited \"who viewed\" — நிறைய options பாருங்கள்!",
      features: ["50 interest requests", "See full profile details & all photos", "See phone & personal contact info", "See who viewed you (last 20)", "Save favourite profiles"]
    },
    {
      id: 5, created: "2025-12-29 12:29:05", createdBy: "system", active: "Y", durationDays: 90, durationMonths: 3, period: "/3 months", price: "1999.00", originalPrice: "2999.00", title: "Silver", discount: "33% OFF", savings: "Popular",
      tagline: "இதயம் திறக்கும் நேரம்",
      planDescription: "Unlimited requests, direct messaging, and full profile visibility. Oru real connection கட்ட இது right time!",
      features: ["Unlimited interest requests", "Chat directly with families", "Full profile & contact visibility", "Appear higher in search results", "See who viewed your profile"]
    },
    {
      id: 6, created: "2025-12-29 12:29:05", createdBy: "system", active: "Y", durationDays: 180, durationMonths: 6, period: "/6 months", price: "2999.00", originalPrice: "3999.00", title: "Silver", discount: "25% OFF", savings: "Most Popular", isPopular: true,
      tagline: "இதயம் திறக்கும் நேரம்",
      planDescription: "Unlimited requests, direct messaging, and full profile visibility. Oru real connection கட்ட இது right time!",
      features: ["Unlimited interest requests", "Chat directly with families", "Full profile & contact visibility", "Appear higher in search results", "See who viewed your profile"]
    },
    {
      id: 7, created: "2025-12-29 12:29:05", createdBy: "system", active: "Y", durationDays: 365, durationMonths: 12, period: "/12 months", price: "4499.00", originalPrice: "5999.00", title: "Silver", discount: "25% OFF", savings: "Long Term",
      tagline: "இதயம் திறக்கும் நேரம்",
      planDescription: "Unlimited requests, direct messaging, and full profile visibility. Oru real connection கட்ட இது right time!",
      features: ["Unlimited interest requests", "Chat directly with families", "Full profile & contact visibility", "Appear higher in search results", "See who viewed your profile"]
    },
    {
      id: 8, created: "2025-12-29 12:29:05", createdBy: "system", active: "Y", durationDays: 180, durationMonths: 6, period: "/6 months", price: "4999.00", originalPrice: "6999.00", title: "Gold", discount: "28% OFF", savings: "Premium",
      tagline: "தங்க வாழ்க்கை தொடர்புகள்",
      planDescription: "Everything in Silver plus jathagam match, verification badge, and search boost. உங்கள் profile shine ஆகும்!",
      features: ["Everything in Silver", "Jathagam compatibility check", "Verified badge on your profile", "Priority search placement", "See who viewed your profile"]
    },
    {
      id: 9, created: "2025-12-29 12:29:05", createdBy: "system", active: "Y", durationDays: 365, durationMonths: 12, period: "/12 months", price: "7999.00", originalPrice: "10999.00", title: "Gold", discount: "27% OFF", savings: "Best Value",
      tagline: "தங்க வாழ்க்கை தொடர்புகள்",
      planDescription: "Everything in Silver plus jathagam match, verification badge, and search boost. உங்கள் profile shine ஆகும்!",
      features: ["Everything in Silver", "Jathagam compatibility check", "Verified badge on your profile", "Priority search placement", "See who viewed your profile"]
    },
    {
      id: 10, created: "2025-12-29 12:29:05", createdBy: "system", active: "Y", durationDays: 9999, durationMonths: 0, period: "/until marriage", price: "9999.00", originalPrice: "19999.00", title: "Platinum", discount: "50% OFF", savings: "Ultimate",
      tagline: "திருமணம் வரை நம்மோட உதவி",
      planDescription: "All features until your wedding day — family chat, WhatsApp sharing, priority support. நாங்கள் உங்களோடு இருக்கோம்!",
      features: ["All Gold features", "Family-to-family direct chat", "Share profiles via WhatsApp", "Priority customer support", "Active until your wedding day"]
    }
  ]
};

export default function PremiumTab() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(1);
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeature[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [heroTitle, setHeroTitle] = useState("Unlock Premium Matrimony 💕");
  const [heroSubtitle, setHeroSubtitle] = useState("Find your soulmate faster with exclusive matrimony features ❤️");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment status tracking
  const { userData } = useUserData();
  const { subscriptionData } = useSubscription() || {};
  const popup = usePopup();
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

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
      } catch (_) {}
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

      const [featuresResponse, plansResponse] = await Promise.all([
        userApi.getAllActivePremiumFeatures().catch(() => ({ data: null })),
        userApi.getAllActivePlans().catch(() => ({ data: null }))
      ]);

      // If both API calls failed, throw an error to trigger the fallback
      if (!featuresResponse?.data && !plansResponse?.data) {
        throw new Error('Failed to fetch premium data');
      }

      // Map API response to match the existing component structure
      const mappedFeatures: PremiumFeature[] = featuresResponse?.data?.data ? featuresResponse.data.data.map((feature: any) => {
        const IconComponent = getIconComponent(feature.iconName);
        return {
          id: feature.id || Math.floor(Math.random() * 1000),
          title: feature.title || 'Premium Feature',
          description: feature.description || 'Exclusive feature for premium members',
          icon: IconComponent,
          color: feature.color || '#ec4899',
          bgColor: feature.bgColor || '#fdf2f8',
          isActive: feature.isActive !== false
        };
      }) : [];

      // NOTE: Here you would ideally make your API call like `const plansResponse = await fetch(/your-api-url).then(res => res.json())`
      // For now, we are simulating the exact API network response with the MOCK_API_RESPONSE defined above
      const apiResponseData = MOCK_API_RESPONSE.data;
      const apiHeroTitle = MOCK_API_RESPONSE.heroTitle;
      const apiHeroSubtitle = MOCK_API_RESPONSE.heroSubtitle;

      if (!apiResponseData) {
        throw new Error('Failed to fetch premium data');
      }

      setHeroTitle(apiHeroTitle || "Unlock Premium Matrimony 💕");
      setHeroSubtitle(apiHeroSubtitle || "Find your soulmate faster with exclusive matrimony features ❤️");

      // We maintain the mapping identical so when the API connects, exactly this block takes over.
      const mappedPlans: Plan[] = apiResponseData.map((plan: any, index: number) => {
        let derivedPrice = parseFloat(plan.price || '0');
        let derivedOriginalPrice = parseFloat(plan.originalPrice || plan.price * 1.3 || '0');

        return {
          id: plan.id || index + 1,
          title: plan.durationMonths ? `${plan.title} (${plan.durationMonths} Months)` : plan.title,
          price: `₹${derivedPrice.toLocaleString('en-IN')}`,
          originalPrice: `₹${derivedOriginalPrice.toLocaleString('en-IN')}`,
          period: plan.period || `/${plan.durationMonths || 1} ${(plan.durationMonths || 1) > 1 ? 'months' : 'month'}`,
          discount: plan.discount || (() => {
            if (derivedOriginalPrice > 0) {
              const discountPercent = Math.round(((derivedOriginalPrice - derivedPrice) / derivedOriginalPrice) * 100);
              return discountPercent > 0 ? `${discountPercent}% OFF` : '';
            }
            return '';
          })(),
          savings: plan.savings || 'Value',
          isActive: plan.active === 'Y',
          isPopular: plan.isPopular || false,
          features: plan.features || [],
          tagline: plan.tagline || '',
          planDescription: plan.planDescription || '',
        };
      });

      setPlans(mappedPlans);

      const popularIndex = mappedPlans.findIndex(p => p.isPopular);
      setSelectedPlan(popularIndex !== -1 ? popularIndex : 0);
    } catch (err) {
      console.error('Error fetching premium data:', err);
      setError('Failed to load premium features and plans. Please try again later.');

      // Fallback to default data if API fails
      setPremiumFeatures(defaultPremiumFeatures);
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map icon names to components
  const getIconComponent = (iconName: string): LucideIcon => {
    const iconMap: { [key: string]: LucideIcon } = {
      'message-circle': MessageCircle as LucideIcon,
      'eye': Eye as LucideIcon,
      'heart': Heart as LucideIcon,
      'star': Star as LucideIcon,
      'shield': Shield as LucideIcon,
      'users': Users as LucideIcon,
      'gift': Gift as LucideIcon,
      'crown': Crown as LucideIcon
    };
    return iconMap[iconName] || Star; // Default to Star if icon not found
  };

  // Default data in case API fails
  const defaultPremiumFeatures: PremiumFeature[] = [
    {
      id: 1,
      icon: MessageCircle as LucideIcon,
      title: 'Unlimited Messaging',
      description: 'Connect with unlimited profiles without restrictions',
      color: '#ec4899',
      bgColor: '#fdf2f8',
      isActive: true
    },
    {
      id: 2,
      icon: Eye as LucideIcon,
      title: 'Profile Visitors',
      description: 'See who viewed your profile and when',
      color: '#8b5cf6',
      bgColor: '#f3e8ff',
      isActive: true
    },
    {
      id: 3,
      icon: Heart as LucideIcon,
      title: 'Priority Matching',
      description: 'Get matched with premium profiles first',
      color: '#ef4444',
      bgColor: '#fef2f2',
      isActive: true
    },
    {
      id: 4,
      icon: Star as LucideIcon,
      title: 'Advanced Filters',
      description: 'Filter by income, education, lifestyle preferences',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      isActive: true
    },
    {
      id: 5,
      icon: Shield as LucideIcon,
      title: 'Verified Badge',
      description: 'Stand out with a verified profile badge',
      color: '#10b981',
      bgColor: '#f0fdf4',
      isActive: true
    },
    {
      id: 6,
      icon: Users as LucideIcon,
      title: 'Premium Community',
      description: 'Access to verified premium members only',
      color: '#6366f1',
      bgColor: '#eef2ff',
      isActive: true
    },
    {
      id: 7,
      icon: Gift as LucideIcon,
      title: 'Express Interest',
      description: 'Send unlimited interest requests instantly',
      color: '#d946ef',
      bgColor: '#faf5ff',
      isActive: true
    }
  ];

  const defaultPlans: Plan[] = [
    {
      id: 1, title: 'Free', price: '₹0', originalPrice: '₹0', period: '/free', discount: '', savings: 'Starter', isActive: true, isPopular: false,
      tagline: 'உங்கள் பயணம் தொடங்குகிறது',
      planDescription: 'Browse profiles and send 3 free interests. Partnerஐ பார்க்க முடியும் — join பண்ணி start பண்ணுங்கள்!',
      features: ['Browse profiles by age, caste & location', 'Save favourite profiles', '3 free interest requests']
    },
    {
      id: 2, title: 'Starter (3 Months)', price: '₹199', originalPrice: '₹499', period: '/3 months', discount: '60% OFF', savings: 'Entry', isActive: true, isPopular: false,
      tagline: 'முதல் அடி எடுங்கள்',
      planDescription: '15 interests, see who viewed you, and explore advanced filters. Serious match தேட ஒரு perfect entry plan.',
      features: ['Advanced filters — education, income & more', '15 interest requests', 'See who viewed you (last 5)', 'View all profile photos']
    },
    {
      id: 3, title: 'Classic (3 Months)', price: '₹999', originalPrice: '₹1,499', period: '/3 months', discount: '33% OFF', savings: 'Value', isActive: true, isPopular: false,
      tagline: 'தெளிவான தேர்வு',
      planDescription: '50 interests, full profile details, contact info, and limited "who viewed" — நிறைய options பாருங்கள்!',
      features: ['50 interest requests', 'See full profile details & all photos', 'See phone & personal contact info', 'See who viewed you (last 20)', 'Save favourite profiles']
    },
    {
      id: 4, title: 'Classic (6 Months)', price: '₹1,499', originalPrice: '₹2,499', period: '/6 months', discount: '40% OFF', savings: 'Best Value', isActive: true, isPopular: false,
      tagline: 'தெளிவான தேர்வு',
      planDescription: '50 interests, full profile details, contact info, and limited "who viewed" — நிறைய options பாருங்கள்!',
      features: ['50 interest requests', 'See full profile details & all photos', 'See phone & personal contact info', 'See who viewed you (last 20)', 'Save favourite profiles']
    },
    {
      id: 5, title: 'Silver (3 Months)', price: '₹1,999', originalPrice: '₹2,999', period: '/3 months', discount: '33% OFF', savings: 'Popular', isActive: true, isPopular: false,
      tagline: 'இதயம் திறக்கும் நேரம்',
      planDescription: 'Unlimited requests, direct messaging, and full profile visibility. Oru real connection கட்ட இது right time!',
      features: ['Unlimited interest requests', 'Chat directly with families', 'Full profile & contact visibility', 'Appear higher in search results', 'See who viewed your profile']
    },
    {
      id: 6, title: 'Silver (6 Months)', price: '₹2,999', originalPrice: '₹3,999', period: '/6 months', discount: '25% OFF', savings: 'Most Popular', isActive: true, isPopular: true,
      tagline: 'இதயம் திறக்கும் நேரம்',
      planDescription: 'Unlimited requests, direct messaging, and full profile visibility. Oru real connection கட்ட இது right time!',
      features: ['Unlimited interest requests', 'Chat directly with families', 'Full profile & contact visibility', 'Appear higher in search results', 'See who viewed your profile']
    },
    {
      id: 7, title: 'Silver (12 Months)', price: '₹4,499', originalPrice: '₹5,999', period: '/12 months', discount: '25% OFF', savings: 'Long Term', isActive: true, isPopular: false,
      tagline: 'இதயம் திறக்கும் நேரம்',
      planDescription: 'Unlimited requests, direct messaging, and full profile visibility. Oru real connection கட்ட இது right time!',
      features: ['Unlimited interest requests', 'Chat directly with families', 'Full profile & contact visibility', 'Appear higher in search results', 'See who viewed your profile']
    },
    {
      id: 8, title: 'Gold (6 Months)', price: '₹4,999', originalPrice: '₹6,999', period: '/6 months', discount: '28% OFF', savings: 'Premium', isActive: true, isPopular: false,
      tagline: 'தங்க வாழ்க்கை தொடர்புகள்',
      planDescription: 'Everything in Silver plus jathagam match, verification badge, and search boost. உங்கள் profile shine ஆகும்!',
      features: ['Everything in Silver', 'Jathagam compatibility check', 'Verified badge on your profile', 'Priority search placement', 'See who viewed your profile']
    },
    {
      id: 9, title: 'Gold (12 Months)', price: '₹7,999', originalPrice: '₹10,999', period: '/12 months', discount: '27% OFF', savings: 'Best Value', isActive: true, isPopular: false,
      tagline: 'தங்க வாழ்க்கை தொடர்புகள்',
      planDescription: 'Everything in Silver plus jathagam match, verification badge, and search boost. உங்கள் profile shine ஆகும்!',
      features: ['Everything in Silver', 'Jathagam compatibility check', 'Verified badge on your profile', 'Priority search placement', 'See who viewed your profile']
    },
    {
      id: 10, title: 'Platinum', price: '₹9,999', originalPrice: '₹19,999', period: '/until marriage', discount: '50% OFF', savings: 'Ultimate', isActive: true, isPopular: false,
      tagline: 'திருமணம் வரை நம்மோட உதவி',
      planDescription: 'All features until your wedding day — family chat, WhatsApp sharing, priority support. நாங்கள் உங்களோடு இருக்கோம்!',
      features: ['All Gold features', 'Family-to-family direct chat', 'Share profiles via WhatsApp', 'Priority customer support', 'Active until your wedding day']
    }
  ];



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={styles.loadingText}>Loading premium features...</Text>
      </View>
    );
  }

  if (error && !paymentStatus) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // PENDING payment — show payment under review
  if (paymentStatus === 'PENDING') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#fdf2f8', '#fef7ff', '#fff1f2']} style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={[styles.crownContainer, { marginBottom: 16 }]}>
              <LinearGradient colors={['#f97316', '#ea580c']} style={styles.crownGradient}>
                <Clock size={32} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={[styles.heroTitle, { fontSize: 22 }]}>Payment Under Review</Text>
            <Text style={styles.heroSubtitle}>Your payment is being verified. You'll be notified once approved.</Text>
          </View>
        </LinearGradient>

        <View style={{ padding: 20 }}>
          {/* Payment Info Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Text style={{ fontSize: 16, fontFamily: 'Rubik-Bold', color: '#130001', marginBottom: 16 }}>Payment Details</Text>

            {paymentData?.createdAt && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ color: '#6b7280', fontSize: 14 }}>Submitted</Text>
                <Text style={{ color: '#130001', fontSize: 14, fontFamily: 'Rubik-Medium' }}>
                  {new Date(paymentData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            )}

            {paymentData?.utrNumber && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ color: '#6b7280', fontSize: 14 }}>UTR Number</Text>
                <Text style={{ color: '#130001', fontSize: 14, fontFamily: 'Rubik-Medium' }}>{paymentData.utrNumber}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#6b7280', fontSize: 14 }}>Status</Text>
              <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#d97706', fontSize: 12, fontFamily: 'Rubik-Bold' }}>PENDING</Text>
              </View>
            </View>
          </View>

          {/* Verification Steps */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Text style={{ fontSize: 16, fontFamily: 'Rubik-Bold', color: '#130001', marginBottom: 16 }}>Verification Progress</Text>

            {/* Step 1 - Done */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <CheckCircle size={24} color="#10b981" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Rubik-Medium', color: '#130001' }}>Screenshot Uploaded</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Payment proof received</Text>
              </View>
            </View>

            {/* Step 2 - In Progress */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <CircleDot size={24} color="#f97316" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Rubik-Medium', color: '#f97316' }}>Payment Verification</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Admin is reviewing your payment</Text>
              </View>
            </View>

            {/* Step 3 - Pending */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Circle size={24} color="#d1d5db" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Rubik-Medium', color: '#9ca3af' }}>Premium Activation</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Will activate after approval</Text>
              </View>
            </View>
          </View>

          {/* Support Message */}
          <View style={{
            backgroundColor: '#eff6ff',
            borderRadius: 12,
            padding: 16,
            marginBottom: 40,
            borderWidth: 1,
            borderColor: '#bfdbfe',
          }}>
            <Text style={{ fontSize: 13, color: '#1e40af', textAlign: 'center', lineHeight: 20 }}>
              Verification usually takes a few hours. If you have any concerns, please contact our support team.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // APPROVED subscription — show already premium
  if (paymentStatus === 'APPROVED' || (subscriptionData?.planTitle && subscriptionData.planTitle !== 'Free')) {
    const planName = subscriptionData?.planTitle || 'Premium';
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#fdf2f8', '#fef7ff', '#fff1f2']} style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={[styles.crownContainer, { marginBottom: 16 }]}>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.crownGradient}>
                <Crown size={32} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={[styles.heroTitle, { fontSize: 22 }]}>You're a {planName} Member!</Text>
            <Text style={styles.heroSubtitle}>Enjoy all your premium features and find your perfect match.</Text>
          </View>
        </LinearGradient>

        <View style={{ padding: 20 }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <CheckCircle size={24} color="#10b981" />
              <Text style={{ fontSize: 16, fontFamily: 'Rubik-Bold', color: '#130001', marginLeft: 10 }}>Active Subscription</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#6b7280', fontSize: 14 }}>Plan</Text>
              <Text style={{ color: '#130001', fontSize: 14, fontFamily: 'Rubik-Medium' }}>{planName}</Text>
            </View>

            {subscriptionData?.endDate && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6b7280', fontSize: 14 }}>Valid Until</Text>
                <Text style={{ color: '#130001', fontSize: 14, fontFamily: 'Rubik-Medium' }}>
                  {new Date(subscriptionData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#1F7FE5',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 40,
            }}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Rubik-Medium' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const handleUpgradePress = () => {
    if (selectedPlan === null || !plans[selectedPlan]) {
      popup.warning('Select a Plan', 'Please select a plan to continue.');
      return;
    }
    const plan = plans[selectedPlan];
    popup.confirm(
      'Confirm Upgrade',
      `Continue with ${plan.title} plan at ₹${plan.price}?`,
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
      'Continue to Payment',
      'Cancel'
    );
  };
  const upgradePlan = async () => {
    console.log("upgradePlan=============>");
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#fdf2f8', '#fef7ff', '#fff1f2']}
        style={styles.hero}>
        {/* Floating Hearts */}
        <View style={styles.floatingHearts}>
          <Heart size={16} color="#f472b6" fill="#f472b6" style={[styles.floatingHeart, styles.heart1]} />
          <Heart size={12} color="#ec4899" fill="#ec4899" style={[styles.floatingHeart, styles.heart2]} />
          <Heart size={14} color="#be185d" fill="#be185d" style={[styles.floatingHeart, styles.heart3]} />
          <Heart size={10} color="#f9a8d4" fill="#f9a8d4" style={[styles.floatingHeart, styles.heart4]} />
        </View>

        <View style={styles.heroContent}>
          <View style={styles.crownContainer}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.crownGradient}>
              <Crown size={32} color="#ffffff" />
            </LinearGradient>
            <View style={styles.heartAccent}>
              <Heart size={12} color="#ec4899" fill="#ec4899" />
            </View>
          </View>
          <Text style={styles.heroTitle}> {heroTitle}</Text>
          {/* <Text style={styles.heroTitle}>💕 Matrimony 💕</Text> */}

          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
        </View>
      </LinearGradient>

      {/* Premium Features Grid */}
      {/* <View style={styles.featuresSection}>
        <View style={styles.sectionHeader}>
          <HeartHandshake size={20} color="#d946ef" />
          <Text style={styles.sectionTitle}>Premium Matrimony Features</Text>
          <HeartHandshake size={20} color="#d946ef" />
        </View>

        <View style={styles.featuresGrid}>
          {premiumFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            const isEven = index % 2 === 0;

            return (
              <View key={index} style={[styles.featureCard, isEven ? styles.leftCard : styles.rightCard]}>
                <View style={[styles.featureIcon, { backgroundColor: feature.bgColor }]}>
                  <IconComponent size={20} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <View style={styles.premiumBadge}>
                  <Heart size={10} color="#ec4899" fill="#ec4899" />
                </View>
              </View>
            );
          })}
        </View>
      </View> */}

      {/* Pricing Plans */}
      <View style={styles.pricingSection}>
        {/* <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💍 Choose Your Matrimony Plan </Text>
        </View> */}
        {/* <Text style={styles.pricingSubtitle}>💕 Start your premium matrimony journey today 💕</Text> */}

        <View style={styles.plansContainer}>
          {plans.map((plan, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.planCard,
                selectedPlan === index ? styles.selectedPlan : null,
                plan.isPopular && { marginTop: 15 }
              ]}
              onPress={() => setSelectedPlan(index)}>
              {plan.title.toLowerCase() === 'free' && (
                <View style={[styles.popularBadge, { backgroundColor: '#f3f4f6', borderColor: '#d1d5db', shadowColor: 'transparent' }]}>
                  <Text style={[styles.popularText, { color: '#130001' }]}>CURRENT PLAN</Text>
                </View>
              )}
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  {plan.tagline ? (
                    <Text style={styles.planTagline}>{plan.tagline}</Text>
                  ) : null}
                </View>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{plan.discount}</Text>
                </View>
              </View>

              {selectedPlan === index && plan.planDescription ? (
                <Text style={styles.planDescription}>{plan.planDescription}</Text>
              ) : null}

              <View style={styles.priceSection}>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, plan.isPopular && styles.popularPrice]}>{plan.price}</Text>
                  <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                </View>
                <Text style={styles.period}>/ {plan.title}</Text>
              </View>

              <View style={styles.planFeatures}>
                {(plan.features || []).map((feature, fIndex) => (
                  <View key={fIndex} style={styles.featureRow}>
                    <Check size={14} color="#10b981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        {/* <View style={styles.urgencyBanner}>
          <LinearGradient
            colors={['#fef2f2', '#fdf2f8']}
            style={styles.urgencyGradient}>
            <Heart size={14} color="#ec4899" fill="#ec4899" />
            <Text style={styles.urgencyText}>💕 Join 1000+ couples who found love this month! 💕</Text>
            <Heart size={14} color="#ec4899" fill="#ec4899" />
          </LinearGradient>
        </View> */}

        {selectedPlan !== null && plans[selectedPlan]?.title.toLowerCase() === 'free' ? (
          <View style={[styles.upgradeButton, { opacity: 0.6 }]}>
            <LinearGradient
              colors={['#9ca3af', '#6b7280']}
              style={styles.upgradeGradient}>
              <Text style={styles.upgradeText}>Current Plan Selected</Text>
            </LinearGradient>
          </View>
        ) : (
          <TouchableOpacity style={styles.upgradeButton} onPress={() => handleUpgradePress()}>
            <LinearGradient
              colors={['#1F7FE5', '#8B0000']}
              style={styles.upgradeGradient}>
              <Text style={styles.upgradeText}>Start Premium Journey</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* <View style={styles.guaranteeSection}>
          <Heart size={16} color="#ec4899" fill="#ec4899" />
          <Text style={styles.guaranteeText}>💕 7-day money-back guarantee • Secure payment 💕</Text>
        </View> */}
      </View>

      {/* Success Stats */}
      {/* <View style={styles.statsSection}>
        <LinearGradient
          colors={['#fef7ff', '#fff1f2', '#ffffff']}
          style={styles.statsGradient}>
          <View style={styles.statsHeader}>
            <Heart size={16} color="#ec4899" fill="#ec4899" />
            <Text style={styles.statsTitle}>💕 Join Thousands of Happy Couples 💕</Text>
            <Heart size={16} color="#ec4899" fill="#ec4899" />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>💍 50K+</Text>
              <Text style={styles.statLabel}>Happy Marriages</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>💕 95%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>⭐ 4.8</Text>
              <Text style={styles.statLabel}>User Rating</Text>
            </View>
          </View>
        </LinearGradient>
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#DADADA',
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
  },
  selectedPlan: {
    borderColor: '#ec4899',
    transform: [{ scale: 1.02 }],
    shadowColor: '#ec4899',
    shadowOpacity: 0.15,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  hero: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  crownContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 16,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
  },
  crownGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartAccent: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  floatingHearts: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingHeart: {
    position: 'absolute',
    opacity: 0.6,
  },
  heart1: {
    top: 80,
    left: 30,
  },
  heart2: {
    top: 120,
    right: 40,
  },
  heart3: {
    top: 60,
    right: 80,
  },
  heart4: {
    top: 100,
    left: 60,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    color: '#130001',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
    paddingHorizontal: 10,

  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Medium',
    color: '#130001',
    textAlign: 'center',
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    position: 'relative',
  },
  leftCard: {
    marginRight: 40,
  },
  rightCard: {
    marginLeft: 40,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    color: '#130001',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  premiumBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  pricingSection: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fafafa',
  },
  pricingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  popularPlan: {
    borderColor: '#ec4899',
    transform: [{ scale: 1.02 }],
    shadowColor: '#ec4899',
    shadowOpacity: 0.15,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ec4899',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  popularBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    color: '#ec4899', // Primary active color
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Medium',
    color: '#130001',
  },
  planTagline: {
    fontSize: 11,
    color: '#9c4040',
    fontStyle: 'italic',
    marginTop: 2,
  },
  planDescription: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3e8e8',
  },
  discountBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
    color: '#16a34a',
  },
  priceSection: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontFamily: 'Rubik-Bold',
    color: '#130001',
  },
  popularPrice: {
    color: '#be185d',
  },
  originalPrice: {
    fontSize: 16,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  period: {
    fontSize: 14,
    color: '#6b7280',
  },
  planFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
  },
  ctaSection: {
    padding: 20,
    alignItems: 'center',
  },
  urgencyBanner: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  urgencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  urgencyText: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#be185d',
    textAlign: 'center',
  },
  upgradeButton: {
    width: '100%',
    marginBottom: 16,
    shadowColor: '#1F7FE5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  upgradeText: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    color: '#DADADA',
  },
  guaranteeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guaranteeText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  statsSection: {
    padding: 20,
    paddingTop: 0,
  },
  statsGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    color: '#130001',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: '#be185d',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Rubik-Medium',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
});