import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, MessageCircle, Eye, Heart, Star, Shield, Users, Gift, Check, Sparkles, HeartHandshake, BellRing as Rings } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import userApi from '../api/userApi';
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
}

export default function PremiumTab() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(1); // Default to middle plan (index 1)
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeature[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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

      const mappedPlans: Plan[] = plansResponse?.data?.data ? plansResponse.data.data.map((plan: any, index: number) => ({
        id: plan.id || index + 1,
        title: plan.title || `${plan.durationMonths || 1} Month${(plan.durationMonths || 1) > 1 ? 's' : ''}`,
        price: `₹${(plan.price || 0).toLocaleString('en-IN')}`,
        originalPrice: `₹${(plan.originalPrice || plan.price * 1.3 || 0).toLocaleString('en-IN')}`,
        period: `/${plan.durationMonths || 1} ${(plan.durationMonths || 1) > 1 ? 'months' : 'month'}`,
        discount: plan.discount ? `${plan.discount}% OFF` : (() => {
          const original = parseFloat(plan.originalPrice || plan.price * 1.3 || '0');
          const discounted = parseFloat(plan.price || '0');
          const discountPercent = Math.round(((original - discounted) / original) * 100);
          return `${discountPercent}% OFF`;
        })(),
        savings: index === 1 ? 'Most Popular' : 'Best Value',
        isActive: plan.isActive !== false,
        isPopular: index === 1
      })) : [];

      setPremiumFeatures(mappedFeatures);
      setPlans(mappedPlans);
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
    const iconMap: {[key: string]: LucideIcon} = {
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
      id: 1,
      title: '1 Month',
      price: '₹2,999',
      originalPrice: '₹3,999',
      period: '/month',
      discount: '25% OFF',
      savings: 'Best Value',
      isActive: true,
      isPopular: false
    },
    {
      id: 2,
      title: '3 Months',
      price: '₹6,999',
      originalPrice: '₹11,997',
      period: '/3 months',
      discount: '42% OFF',
      savings: 'Most Popular',
      isActive: true,
      isPopular: true
    },
    {
      id: 3,
      title: '6 Months',
      price: '₹11,999',
      originalPrice: '₹23,994',
      period: '/6 months',
      discount: '50% OFF',
      savings: 'Best Value',
      isActive: true,
      isPopular: false
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

  if (error) {
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

  const handleUpgradePress = () => {
    Alert.alert(
      'Confirm Upgrade',
      'Continue to the plan?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Pressed Cancel'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => upgradePlan(),
        },
      ],
      { cancelable: false }
    );
  }
  const upgradePlan = async() =>{
    console.log("upgradePlan=============>");

    // const orderResponse = await userApi.createOrder(500)
    // console.log("orderResponse=============>",orderResponse);
    // if(orderResponse?.data?.code == 200){
    //   const options = {
    //     description: 'Credits towards consultation',
    //   image: 'https://gallery.chennaisuperkings.com/PROD/NEWS_STORY/IMAGE/NEWS_STORY_1756715484410_9d97a2_1756715484410.png',
    //   currency: 'INR',
    //   key: 'rzp_test_RCElx42eadXCSx',
    //   amount: orderResponse?.data?.data?.amount,
    //   name: 'Selva Ganapathi',
    //   order_id: orderResponse?.data?.data?.id,
    //   prefill: {
    //     email: 'selvakrish820@gmail.com',
    //     contact: '+916379829750',
    //     name: 'Selva Ganapathi'
    //   },
    //   theme: {color: '#53a20e'}
    // }

    // RazorpayCheckout.open(options).then((data : any) => {
    //   // handle success
    //   Alert.alert('Success', 'Payment successful');
    // }).catch((error : any) => {
    //   // handle failure
    //   Alert.alert('Error', error.description);
    // });

  // }else{
  //   Alert.alert('Error', 'Something went wrong. Please try again.');

  // }
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
          <Text style={styles.heroTitle}> Unlock Premium Matrimony 💕</Text>
          {/* <Text style={styles.heroTitle}>💕 Matrimony 💕</Text> */}

          <Text style={styles.heroSubtitle}>Find your soulmate faster with exclusive matrimony features ❤️</Text>
        </View>
      </LinearGradient>

      {/* Premium Features Grid */}
      <View style={styles.featuresSection}>
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
      </View>

      {/* Pricing Plans */}
      <View style={styles.pricingSection}>
        <View style={styles.sectionHeader}>
          {/* <Rings size={20} color="#d946ef" /> */}
          <Text style={styles.sectionTitle}>💍 Choose Your Matrimony Plan </Text>
          {/* <Rings size={20} color="#d946ef" /> */}
        </View>
        <Text style={styles.pricingSubtitle}>💕 Start your premium matrimony journey today 💕</Text>
        
        <View style={styles.plansContainer}>
          {plans.map((plan, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.planCard,
                selectedPlan === index ? styles.selectedPlan : styles.planCard
              ]}
              onPress={() => setSelectedPlan(index)}>
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{plan.discount}</Text>
                </View>
              </View>
              
              <View style={styles.priceSection}>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, plan.isPopular && styles.popularPrice]}>{plan.price}</Text>
                  <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                </View>
                <Text style={styles.period}>/ {plan.title}</Text>
              </View>
              
              <View style={styles.planFeatures}>
                <View style={styles.featureRow}>
                  <Check size={14} color="#10b981" />
                  <Text style={styles.featureText}>💖 All Premium Features</Text>
                </View>
                <View style={styles.featureRow}>
                  <Check size={14} color="#10b981" />
                  <Text style={styles.featureText}>🤝 24/7 Matrimony Support</Text>
                </View>
                <View style={styles.featureRow}>
                  <Check size={14} color="#10b981" />
                  <Text style={styles.featureText}>⭐ Profile Highlight</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <View style={styles.urgencyBanner}>
          <LinearGradient
            colors={['#fef2f2', '#fdf2f8']}
            style={styles.urgencyGradient}>
            <Heart size={14} color="#ec4899" fill="#ec4899" />
            <Text style={styles.urgencyText}>💕 Join 1000+ couples who found love this month! 💕</Text>
            <Heart size={14} color="#ec4899" fill="#ec4899" />
          </LinearGradient>
        </View>
        
        <TouchableOpacity style={styles.upgradeButton} onPress={() => handleUpgradePress()}>
          <LinearGradient
            colors={['#ec4899', '#be185d']}
            style={styles.upgradeGradient}>
            <Heart size={18} color="#ffffff" fill="#ffffff" />
            <Text style={styles.upgradeText}>💖 Start Premium Journey 💖</Text>
            <Heart size={18} color="#ffffff" fill="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
        
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
    color: 'white',
    fontWeight: '600',
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
    fontWeight: '700',
    color: '#1f2937',
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
    fontWeight: '600',
    color: '#1f2937',
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
    fontWeight: '600',
    color: '#1f2937',
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
    top: -8,
    alignSelf: 'center',
    left: '50%',
    transform: [{ translateX: -40 }],
    borderRadius: 12,
  },
  popularBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  discountBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '600',
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
    fontWeight: '700',
    color: '#1f2937',
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
    fontWeight: '600',
    color: '#be185d',
    textAlign: 'center',
  },
  upgradeButton: {
    width: '100%',
    marginBottom: 16,
    shadowColor: '#ec4899',
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
    fontWeight: '600',
    color: '#ffffff',
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
    fontWeight: '600',
    color: '#1f2937',
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
    fontWeight: '700',
    color: '#be185d',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
});