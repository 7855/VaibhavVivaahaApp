import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, StyleSheet, Text as TextNative, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, HStack, Center, VStack, Skeleton } from 'native-base';
import SwiperProfile from '@/components/swiperprofile';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconMeterial from 'react-native-vector-icons/MaterialIcons';
import ProfileCompletionWidget from '@/components/ProfileCompletionBar';
import QuickAction from '@/components/QuickAction';
import { router, useFocusEffect } from 'expo-router';
// AsyncStorage import removed - subscription data now managed through SubscriptionContext
import userApi from '../api/userApi';
import { ArrowRight, Award, Bell, Crown, Eye, Heart, Send, User, UserCheck } from 'lucide-react-native';
import HappyStoryCard from '@/components/HappyStoryCard';
import { usePushNotifications } from '@/usePushNotification';
import { LinearGradient } from 'expo-linear-gradient';
import { loadUserSubscription, loadMasterData } from '../services/masterService';
import { useSubscription } from '../contexts/subscriptionContext';
import { useMasterData } from '../contexts/MasterDataContext';
import FooterMessage from '@/components/FooterMessage';
import { useUserData } from '../contexts/UserDataContext';
import * as WebBrowser from 'expo-web-browser';

interface ConnectionCount {
  Matches?: number;
  Hearts?: number;
  Admirers?: number;
  Proposals?: number;
}

// Get screen dimensions
const { width } = Dimensions.get('window');

// Skeleton Loader Components
const ProfileSkeleton = () => (
  <View style={styles.skeletonContainer}>
    <Skeleton h="40" rounded="md" />
    <Skeleton.Text px="4" mt="4" />
    <Skeleton h="6" w="70%" mt="2" alignSelf="center" />
  </View>
);

const CardSkeleton = () => (
  <View style={[styles.cardSkeleton, { width: width * 0.4 }]}>
    <Skeleton h="120" rounded="md" />
    <Skeleton.Text px="2" mt="2" />
  </View>
);

const ProfileCardSkeleton = () => (
  <View style={styles.profileCardSkeleton}>
    <Skeleton h={180} roundedTop="md" />
    <VStack p={3} space={2}>
      <Skeleton h={5} w="70%" rounded="sm" />
      <Skeleton h={4} w="50%" rounded="sm" />
      <HStack space={2} mt={2}>
        <Skeleton h={4} w={16} rounded="full" />
        <Skeleton h={4} w={16} rounded="full" />
      </HStack>
      <HStack mt={2} justifyContent="space-between">
        <Skeleton h={8} w={8} rounded="full" />
        <Skeleton h={8} w={8} rounded="full" />
      </HStack>
    </VStack>
  </View>
);

const ProfileCardSmallSkeleton = () => (
  <View style={styles.profileCardSmallSkeleton}>
    {/* Image placeholder - matches 125x150 card image */}
    <Skeleton h={150} w={125} rounded="lg" />
    {/* Text overlay at bottom - mimics the semi-transparent overlay */}
    <View style={styles.skeletonTextOverlay}>
      <Skeleton h={3} w="80%" rounded="sm" startColor="gray.400" endColor="gray.500" />
      <Skeleton h={2.5} w="60%" rounded="sm" mt={1} startColor="gray.400" endColor="gray.500" />
    </View>
  </View>
);

const StatsSkeleton = () => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 24,
    paddingVertical: 10,
    marginHorizontal: 8,
    backgroundColor: '#F5F5F5',
  }}>
    {[1, 2, 3, 4].map((item, index) => (
      <React.Fragment key={item}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Skeleton size="10" rounded="full" mb={2} />
          <Skeleton h={5} w={8} rounded="sm" mb={1} />
          <Skeleton h={3} w={12} rounded="sm" />
        </View>
        {index < 3 && (
          <View style={{ width: 1, height: 48, backgroundColor: '#E5E7EB' }} />
        )}
      </React.Fragment>
    ))}
  </View>
);

const SectionSkeleton = ({ title = true, small = false }) => (
  <Box mb={6} bg="white" p={4} borderRadius={12} mx={2}>
    {title && <Skeleton h={6} w="40%" mb={4} />}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 16 }}
    >
      {[1, 2, 3, 4].map((item) => (
        small ? <ProfileCardSmallSkeleton key={item} /> : <ProfileCardSkeleton key={item} />
      ))}
    </ScrollView>
  </Box>
);

const LoadingState = () => (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
    <ScrollView>
      {/* Header Skeleton */}
      <HStack p={4} justifyContent="space-between" alignItems="center" bg="white">
        <Skeleton h="8" w="40%" rounded="md" />
        <HStack space={4}>
          <Skeleton size="10" rounded="full" />
          <Box>
            <Skeleton size="10" rounded="full" />
          </Box>
        </HStack>
      </HStack>

      {/* Profile Section Skeleton */}
      <Box p={4} bg="white" mb={2}>
        <HStack space={4} alignItems="center">
          <Skeleton size="20" rounded="full" />
          <VStack space={2} flex={1}>
            <HStack alignItems="center" space={2}>
              <Skeleton h="5" w="60%" rounded="sm" />
              <Skeleton h="4" w="20%" rounded="full" />
            </HStack>
            <HStack space={2}>
              <Skeleton h="4" w="30%" rounded="sm" />
              <Skeleton h="4" w="30%" rounded="sm" />
            </HStack>
            <Skeleton h="4" w="50%" rounded="sm" />

            {/* Profile Completion Bar Skeleton */}
            <Box mt={2}>
              <HStack justifyContent="space-between" mb={1}>
                <Skeleton h="3" w="30%" rounded="sm" />
                <Skeleton h="3" w="15%" rounded="sm" />
              </HStack>
              <Skeleton h="2" w="100%" rounded="full" />
            </Box>
          </VStack>
        </HStack>
      </Box>

      {/* Stats Skeleton */}
      <Box bg="white" py={4} mb={2}>
        <StatsSkeleton />
      </Box>

      {/* Daily Recommendations Section */}
      <SectionSkeleton title={true} />

      {/* New Connections Section */}
      <SectionSkeleton title={true} small={true} />

      {/* Near You Section */}
      <SectionSkeleton title={true} small={true} />

      {/* Happy Stories Section */}
      <Box bg="white" mt={2} py={4}>
        <Box px={4} mb={3}>
          <Skeleton h="6" w="50%" rounded="sm" />
        </Box>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {[1, 2, 3].map((item) => (
            <Box key={item} style={styles.happyStorySkeleton}>
              <Skeleton h={120} w={200} rounded="md" />
              <VStack p={3} space={1}>
                <Skeleton h={4} w="70%" rounded="sm" />
                <Skeleton h={3} w="50%" rounded="sm" />
                <Skeleton h={3} w="60%" rounded="sm" mt={2} />
              </VStack>
            </Box>
          ))}
        </ScrollView>
      </Box>

      <Box h={20} /> {/* Bottom padding */}
    </ScrollView>
  </SafeAreaView>
);


const Index = () => {
  const { userData } = useUserData();
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const dataLoadedRef = useRef(false);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [newConnection, setNewConnection] = useState<any[]>([]);
  const [nearYouProfile, setNearYouProfile] = useState<any[]>([]);
  const [userConnectionCount, setUserConnectionCount] = useState<ConnectionCount>({});
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [happyStories, setHappyStories] = useState<any[]>([]);
  const [percentage, setPercentage] = useState<number>(0);

  const [timeLeft, setTimeLeft] = useState('');
  const { subscriptionData = {}, setSubscription } = useSubscription() || {};
  const [userTier, setUserTier] = useState<string | null>(null);
  const { state: masterData, setMasterData } = useMasterData();
  const [bannerData, setBannerData] = useState<any[]>([]);

  // Only refresh unread notification count on tab focus (lightweight)
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchUnreadCount = async () => {
        if (!userData.userId) return;

        try {
          const unreadCount = await userApi.getUnreadNotificationCount(userData.userId);
          if (isActive) {
            setUnreadCount(unreadCount.data?.data);
          }
        } catch (error) {
          console.error("Failed to fetch unread count", error);
        }
      };

      fetchUnreadCount();

      return () => {
        isActive = false;
      };
    }, [userData.userId])
  );


  useEffect(() => {
    const fetchHappyStories = async () => {
      try {
        const response = await userApi.getAllHappyStoriesByIsActive();
        setHappyStories(response.data.data);
      } catch (error) {
        console.error('Error fetching happy stories:', error);
      }
    };
    fetchHappyStories();
  }, []);

  // Load master data and extract banner
  useEffect(() => {
    if (!Object.keys(masterData || {}).length) {
      loadMasterData(setMasterData);
    }
  }, []);

  useEffect(() => {
    if (masterData?.HomepageBottomBanner) {
      setBannerData(masterData.HomepageBottomBanner);
    }
  }, [masterData]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await userApi.getProfileCompletion(userData.userId);
        if (response.data.data.data) {
          setPercentage(response.data.data.data.percentage);
        }
      } catch (error) {
        console.error('Error fetching profile completion:', error);
      }
    };

    if (userData.userId) {
      fetchProfileData();
    }
  }, [userData.userId]);



  // Function to update the countdown timer (countdown to midnight)
  const updateCountdown = useCallback(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Set to next midnight

    const diff = midnight.getTime() - now.getTime();

    // Calculate hours, minutes, seconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    // Update countdown every second
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [updateCountdown]);

  useEffect(() => {
    // Skip if data already loaded or missing required context
    if (dataLoadedRef.current || !userData.userId || !userData.casteId || !userData.gender || !userData.location) {
      if (!userData.userId && userData.userId !== null) {
        router.push({
          pathname: '/(main)/LoginScreen',
          params: { from: 'home' }
        } as any);
      }
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Get user subscription status
        if (userData.decodedUserId) {
          try {
            const subscription = await userApi.getActiveUserSubscriptionByUserId(userData.decodedUserId);
            if (subscription.data.data) {
              setUserTier(subscription.data.data.planCode);
              // Store in subscription context (which also persists to AsyncStorage)
              setSubscription(subscription.data.data);
            }
          } catch (error) {
            console.error('Error fetching subscription:', error);
          }
        }

        setHasStarted(true);
        const casteIdValue = parseInt(userData.casteId!);

        const [rec, conn, near, count] = await Promise.all([
          userApi.getDailyRecommendation(casteIdValue, userData.gender),
          userApi.getNewConnections(casteIdValue, userData.gender),
          userApi.getNearYouProfiles(casteIdValue, userData.gender, userData.location),
          userApi.userConnectionCount(userData.userId),
        ]);

        setRecommendations(rec.data?.data?.slice(0, 7) || []);
        setNewConnection(conn.data?.data?.slice(0, 7) || []);
        setNearYouProfile(near.data?.data?.slice(0, 7) || []);
        setUserConnectionCount(count.data?.data || {});

        const unreadRes = await userApi.getUnreadNotificationCount(userData.userId);
        setUnreadCount(unreadRes.data?.data);

        dataLoadedRef.current = true;
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading home data:', error);
        setHasStarted(false);
      }
    };

    loadData();
  }, [userData.userId, userData.casteId, userData.gender, userData.location]);

  useEffect(() => {
    if (!userData.decodedUserId) return;
    loadUserSubscription(userData.decodedUserId, setSubscription);
  }, [userData.decodedUserId]);


  const { expoPushToken, notification } = usePushNotifications();

  const handleBannerPress = async (banner: any) => {
    if (banner.openUrl === 'internal') {
      router.push(banner.actionUrl as any);
    } else {
      await WebBrowser.openBrowserAsync(banner.actionUrl);
    }
  };

  const getTierStyle = (tier: any) => {
    const baseStyle = {
      icon: null as React.ReactNode,
      background: '',
      textColor: '',
      gradient: [] as string[],
      borderColor: '',
    };

    const tierUpper = tier?.toUpperCase() || 'FREE';


    switch (tierUpper) {
      case 'PLATINUM':
        return {
          ...baseStyle,
          icon: <Crown size={16} color="#E5E4E2" />, // Platinum metallic color
          background: 'rgba(229, 228, 226, 0.2)', // Light platinum background
          textColor: '#E5E4E2', // Platinum text color
          gradient: ['#E5E4E2', '#C0C0C0'], // Platinum gradient
          borderColor: '#E5E4E2', // Platinum border
          name: 'Platinum'
        };
      case 'GOLD':
        return {
          ...baseStyle,
          icon: <Award size={16} color="#FFD700" />,
          background: 'rgba(255, 215, 0, 0.2)',
          textColor: 'userConnectionCount#FFD700',
          gradient: ['#FFD700', '#FFA500'],
          borderColor: '#FFD700',
          name: 'Gold'
        };
      case 'SILVER':
        return {
          ...baseStyle,
          icon: <Award size={16} color="#E0E0E0" />,
          background: 'rgba(224, 224, 224, 0.2)',
          textColor: '#E0E0E0',
          gradient: ['#E0E0E0', '#A0A0A0'],
          borderColor: '#E0E0E0',
          name: 'Silver'
        };
      case 'BRONZE':
        return {
          ...baseStyle,
          icon: <Award size={16} color="#CD7F32" />,
          background: 'rgba(205, 127, 50, 0.2)',
          textColor: '#CD7F32',
          gradient: ['#CD7F32', '#8B4513'],
          borderColor: '#CD7F32',
          name: 'Bronze'
        };
      default: // FREE
        return {
          ...baseStyle,
          icon: <User size={16} color="#4A90E2" />,
          background: 'rgba(74, 144, 226, 0.2)',
          textColor: '#2DD4BF',
          gradient: ['#4A90E2', '#1E3A8A'],
          borderColor: '#4A90E2',
          name: 'Free'
        };
    }
  };
  const tierStyle = getTierStyle(userTier);
  // Log token and notification data
  React.useEffect(() => {
    console.log('--- Push Notification Debug Info ---');
    console.log('Expo Push Token:', expoPushToken?.data || 'No token available');

    if (notification) {
      console.log('Notification received:', JSON.stringify({
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
        trigger: notification.request.trigger
      }, null, 2));
    } else {
      console.log('No notification data available');
    }
  }, [expoPushToken, notification]);

  const data = notification ? JSON.stringify({
    title: notification.request.content.title,
    body: notification.request.content.body,
    data: notification.request.content.data
  }, null, 2) : 'No notification data';
  return (
    <>
      {/* {!hasStarted || hasStarted == null ? ( */}
      {/* // <Getstart onStart={onStart} /> */}
      {/* ) : ( */}
      <SafeAreaView edges={['right', 'left', 'top']} style={{ backgroundColor: 'linear-gradient(0deg,rgba(254, 254, 254, 1) 18%, rgba(219, 177, 211, 1) 100%)' }}>

        <ScrollView contentContainerStyle={styles.scrollViewContent}>

          <View style={{ marginTop: 12 }}>
            {/* <View style={styles.container}>
                 <Text>Token: {expoPushToken?.data ?? ""}</Text>
                 <Text>Notification: {data}</Text>
               </View> */}
            {/* ----------------------index page content  */}

            <View style={{ height: 90, marginHorizontal: 5 }}>
              <View style={[styles.container, { borderRadius: 999, paddingStart: 12 }]}>
                <Image
                  source={userData.profileImage ? { uri: userData.profileImage } :
                    userData.gender === 'M' ? require('../../../assets/images/avatarMen.png') :
                      userData.gender === 'F' ? require('../../../assets/images/avatarWomen.png') :
                        require('../../../assets/images/defaultAvatar.png')}
                  style={{ ...styles.profileImage, borderWidth: 2 }}
                />

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <TextNative style={[styles.greeting, { color: '#FFD700' }]}>
                      Welcome,{' '}
                    </TextNative>

                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextNative style={[styles.greetingName, { color: '#DADADA' }]}>
                      {userData.firstName} {userData.lastName}
                    </TextNative>

                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <View style={[styles.tierDisplay, { backgroundColor: tierStyle.background, marginRight: 0 }]}>
                      <View style={[styles.tierIcon, { backgroundColor: '#2D3748' }]}>
                        {tierStyle.name === 'Platinum' ? (
                          <Crown size={16} strokeWidth={2.5} color={tierStyle.textColor} />
                        ) : tierStyle.name === 'Gold' ? (
                          <Award size={16} strokeWidth={2.5} color={tierStyle.textColor} />
                        ) : tierStyle.name === 'Silver' ? (
                          <Award size={16} strokeWidth={2.5} color={tierStyle.textColor} />
                        ) : tierStyle.name === 'Bronze' ? (
                          <Award size={16} strokeWidth={2.5} color={tierStyle.textColor} />
                        ) : (
                          <User size={16} strokeWidth={2.5} color={tierStyle.textColor} />
                        )}
                      </View>
                      <Text style={[styles.tierTitle, { color: tierStyle.textColor }]}>
                        {tierStyle.name} Member
                      </Text>
                      {tierStyle.name === 'Free' && (
                        <TouchableOpacity
                          onPress={() => router.push('/(root)/screens/PremiumTab')}
                          style={[styles.upgradeButton, { backgroundColor: '#FFD700' }]}
                        >
                          <Text style={styles.upgradeText}>Upgrade Plan</Text>
                          <ArrowRight size={14} color="#130001" />
                        </TouchableOpacity>
                      )}
                    </View>

                  </View>

                </View>

                <TouchableOpacity
                  onPress={() => router.push('/screens/NotificationScreen')}
                  style={{ marginLeft: 'auto' }}
                >
                  <View style={styles.bellWrapper}>
                    <Bell size={28} color="#F43F5E" />
                    {unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <Box alignItems="center">
              <Box
                overflow="hidden"
                width="100%"
                height="100%"
                p={0}
                m={0}
                borderTopLeftRadius={30}
                borderTopRightRadius={30}
                borderWidth={1}
                _dark={{
                  borderColor: 'coolGray.600',
                  backgroundColor: 'gray.700',
                }}
                _web={{
                  shadow: 2,
                  borderWidth: 1,
                }}
                _light={{
                  backgroundColor: '#F5F5F5',
                  borderColor: '#fff',
                }}
                style={{
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                }}
              >

                <View style={{ paddingHorizontal: 8, paddingVertical: 10 }}>

                  {/* Card */}
                  <LinearGradient
                    colors={['#F5F5F5', '#F9F3FC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 0.5 }}
                    style={{
                      borderRadius: 24,
                      paddingVertical: 10,
                      paddingHorizontal: 0,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 4,
                      borderWidth: 1,
                      borderColor: '#F3F4F6',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Hearts */}
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <LinearGradient
                          colors={['#420001', '#8B0000']}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 999,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                        >
                          <Heart stroke="#ffffff" width={20} height={20} />
                        </LinearGradient>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#130001' }}>{userConnectionCount.Hearts}</Text>
                        <Text style={{ fontSize: 12, color: '#130001', textAlign: 'center', fontWeight: '500' }}>
                          Hearts
                        </Text>
                      </View>

                      {/* Divider */}
                      <View style={{ width: 1, height: 48, backgroundColor: '#E5E7EB' }} />

                      {/* Proposals */}
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <LinearGradient
                          colors={['#420001', '#8B0000']}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 999,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                        >
                          <Send stroke="#ffffff" width={20} height={20} />
                        </LinearGradient>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#130001' }}>{userConnectionCount.Proposals}</Text>
                        <Text style={{ fontSize: 12, color: '#130001', textAlign: 'center', fontWeight: '500' }}>
                          Proposals
                        </Text>
                      </View>

                      <View style={{ width: 1, height: 48, backgroundColor: '#E5E7EB' }} />

                      {/* Admirers */}
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <LinearGradient
                          colors={['#420001', '#8B0000']}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 999,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                        >
                          <Eye stroke="#ffffff" width={20} height={20} />
                        </LinearGradient>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#130001' }}>{userConnectionCount.Admirers}</Text>
                        <Text style={{ fontSize: 12, color: '#130001', textAlign: 'center', fontWeight: '500' }}>
                          Admirers
                        </Text>
                      </View>

                      <View style={{ width: 1, height: 48, backgroundColor: '#E5E7EB' }} />

                      {/* Matches */}
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <LinearGradient
                          colors={['#420001', '#8B0000']}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 999,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                        >
                          <UserCheck stroke="#ffffff" width={20} height={20} />
                        </LinearGradient>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#130001' }}>{userConnectionCount.Matches}</Text>
                        <Text style={{ fontSize: 12, color: '#130001', textAlign: 'center', fontWeight: '500' }}>
                          Matches
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                <View>
                  <ProfileCompletionWidget />

                </View>
                {/* <View style={{ paddingHorizontal: 5 ,  
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 4, }}>
  <LinearGradient
    colors={['#FAF3E0', '#FAF3E0']}
    style={{
      paddingHorizontal: 5,
      paddingVertical: 5,
      borderRadius: 12,
      marginBottom: 10,
    }}
  >
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 2,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <Text style={{ color: '#181818', fontWeight: 'bold', fontSize: 15 }}>
          Profile Completion
        </Text>
        <View
          style={{
            backgroundColor: '#420001',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 8 }}>
            PREMIUM
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        ></View>

        <View
          style={{
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 999,
            height: 12,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['#420001', '#420001']}
            style={{ height: '100%', borderRadius: 999, position: 'relative' }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            />
          </LinearGradient>
        </View>
        <Text
          style={{
            color: '#130001',
            fontWeight: 'bold',
            fontSize: 10,
            textAlign: 'right',
          }}
        >
          100% Completed
        </Text>
      </View>
    </View>
  </LinearGradient> */}
                {/* </View> */}


                {/*  New Connections Section */}
                <Box
                  overflow="hidden"
                  backgroundColor="whitesmoke"
                  borderColor="black"
                  p={2}
                  borderRadius={20}
                  m={1}
                >
                  <VStack space={3}>
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: '/screens/listProfile',
                          params: {
                            type: 'newConnections',
                            title: 'New Connections'
                          }
                        });
                      }}
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                          <Text fontSize={14} fontWeight="bold" textTransform="uppercase" color="#130001">
                            New Connections
                          </Text>
                          <HStack alignItems="center" space={1}>
                            <Icon name="bullseye" size={17} color="green" />
                            <Text fontSize="xs">
                              Explore Profiles, Spark New Connections
                            </Text>
                          </HStack>
                        </VStack>
                        <Icon name="chevron-circle-right" size={30} color="green" />
                      </HStack>
                    </TouchableOpacity>

                    <Center ml={1} mb={2}>
                      {hasStarted === null || isLoading ? (
                        <Box flexDirection="row" px={4} py={2}>
                          {[1, 2, 3].map((item) => (
                            <ProfileCardSmallSkeleton key={item} />
                          ))}
                        </Box>
                      ) : (
                        <SwiperProfile users={newConnection} onUserPress={(userId: any) => {
                          router.push({
                            pathname: '/screens/ProfileDetail',
                            params: { userId: userId }
                          });
                        }} />
                      )}
                    </Center>
                  </VStack>
                </Box>

                {/* Daily Recommendations Section */}
                <Box
                  overflow="hidden"
                  backgroundColor="whitesmoke"
                  borderColor="black"
                  p={2}
                  borderRadius={20}
                  m={1}
                >
                  <VStack space={3}>
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: '/screens/listProfile',
                          params: {
                            type: 'dailyRecommendations',
                            title: 'Daily Recommendations'
                          }
                        });
                      }}
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                          <Text fontSize={14} fontWeight="bold" textTransform="uppercase" color="#130001">
                            Daily Recommendations
                          </Text>
                          <HStack alignItems="center" space={1}>
                            <Icon name="clock-o" size={15} color="green" />
                            <Text fontSize="xs">
                              {timeLeft || 'Calculating...'} left to view these profiles
                            </Text>
                          </HStack>
                        </VStack>
                        <Icon name="chevron-circle-right" size={30} color="green" />
                      </HStack>
                    </TouchableOpacity>

                    <Center marginLeft={1} marginBottom={2}>
                      {isLoading ? (
                        <Box flexDirection="row" px={4} py={2}>
                          {[1, 2, 3].map((item) => (
                            <ProfileCardSmallSkeleton key={item} />
                          ))}
                        </Box>
                      ) : (
                        <SwiperProfile users={recommendations} onUserPress={(userId: any) => {
                          router.push({
                            pathname: '/screens/ProfileDetail',
                            params: { userId: userId }
                          });
                        }} />
                      )}
                    </Center>
                  </VStack>
                </Box>

                {/* Near You Section */}
                {/* Near You Section */}
                <Box
                  overflow="hidden"
                  backgroundColor="whitesmoke"
                  borderColor="black"
                  p={2}
                  borderRadius={20}
                  m={1}
                >
                  <VStack space={3}>
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: '/screens/listProfile',
                          params: {
                            type: 'nearYou',
                            title: 'Profiles Near You'
                          }
                        });
                      }}
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                          <Text fontSize={14} fontWeight="bold" textTransform="uppercase" color="#130001">
                            Near You
                          </Text>
                          <HStack alignItems="center" space={1}>
                            <Icon name="map-marker" size={15} color="green" />
                            <Text fontSize="xs">
                              Discover profiles in your area
                            </Text>
                          </HStack>
                        </VStack>
                        <Icon name="chevron-circle-right" size={30} color="green" />
                      </HStack>
                    </TouchableOpacity>

                    <Center marginLeft={1} marginBottom={2}>
                      {isLoading ? (
                        <Box flexDirection="row" px={4} py={2}>
                          {[1, 2, 3].map((item) => (
                            <ProfileCardSmallSkeleton key={item} />
                          ))}
                        </Box>
                      ) : (
                        <SwiperProfile users={nearYouProfile} onUserPress={(userId: any) => {
                          router.push({
                            pathname: '/screens/ProfileDetail',
                            params: { userId: userId }
                          });
                        }} />
                      )}
                    </Center>
                  </VStack>
                </Box>

                {/* last convo section  */}
                {/* <Box
                  overflow="hidden"
                  backgroundColor="whitesmoke"
                  borderColor="black"
                  padding={2}
                  borderRadius={20}
                  margin={1}
                >
                  <VStack space={3} marginBottom={5}>
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: '/screens/listProfile',
                          params: {
                            type: 'nearYou',
                            title: 'Near Your Location'
                          }
                        });
                      }}
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                          <Text fontSize={14} fontWeight="bold" textTransform="uppercase" color="#130001">
                            Near You
                          </Text>
                          <HStack alignItems="center" space={1}>
                            <IconMeterial name="my-location" size={17} color="green" />
                            <Text fontSize="xs">Discover profiles near your location..</Text>
                          </HStack>
                        </VStack>
                        <Icon name="chevron-circle-right" size={30} color="green" />
                      </HStack>
                    </TouchableOpacity>

                    <Center marginLeft={1} marginBottom={2}>
                      <SwiperProfile users={nearYouProfile} onUserPress={(userId: any) => {
                        router.push({
                          pathname: '/screens/ProfileDetail',
                          params: { userId: userId }
                        });
                      }} />
                    </Center>
                  </VStack>
                </Box> */}

                <View>
                  <QuickAction />
                </View>

                {bannerData.length > 0 ? (
                  bannerData.map((banner: any) => (
                    <TouchableOpacity
                      key={banner.id}
                      onPress={() => handleBannerPress(banner)}
                      activeOpacity={0.8}
                      style={{
                        width: '100%',
                        height: 150,
                        marginVertical: 10,
                        marginTop: 10,
                        padding: 5,
                        marginBottom: 25,
                      }}
                    >
                      <Image
                        source={{ uri: banner.imageUrl }}
                        style={{
                          width: '100%',
                          height: '100%',
                          resizeMode: 'cover',
                          borderRadius: 10,
                        }}
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Box
                    width="100%"
                    style={{
                      height: 150,
                      marginVertical: 10,
                      marginTop: 10,
                      padding: 5,
                      marginBottom: 25,
                    }}
                  >
                    <Image
                      source={require('../../../assets/images/homebanner.webp')}
                      style={{
                        width: '100%',
                        height: '100%',
                        resizeMode: 'cover',
                        borderRadius: 10,
                      }}
                    />
                  </Box>
                )}


                {/* <View style={styles.section}>
                  <View style={{ paddingHorizontal: 7, marginBottom: 15 }}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack>
                        <HStack alignItems="center" space={2}>
                          <Heart size={20} color="#EF4444" />
                          <Text fontSize="lg" fontWeight="semibold" color="#130001">
                            Happy Stories
                          </Text>
                          <Heart size={20} color="#EF4444" fill="#EF4444" />
                          <Heart size={20} color="#EF4444" fill="#EF4444" />

                        </HStack>

                        <HStack alignItems="center" space={1} mt={1}>
                          <Text fontSize="xs" color="gray">Every love story is beautiful, but ours is our favorite.</Text>
                        </HStack>
                      </VStack>

                    </HStack>
                  </View>




                  <FlatList
                    data={happyStories}
                    keyExtractor={(item) => item.happystoryId}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselList}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          marginRight: 0,
                          transform: [{ translateY: 2 }],
                          shadowColor: 'rgba(30,64,175,1.00)',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.25,
                          shadowRadius: 5,
                          elevation: 20,
                        }}
                      >
                        <HappyStoryCard
                          coupleNames={item.coupleNames}
                          story={item.story}
                          marriageDate={item.marriageDate?.split('T')[0] || ''}
                          partner1Image={item.partner1Image}
                          partner2Image={item.partner2Image}
                        />
                      </View>
                    )}
                  />

                </View> */}
                <View style={{ flex: 1, marginBottom: 70 }}>
                  <FooterMessage />
                </View>
              </Box>
            </Box>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* )} */}

    </>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    width: width * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSkeleton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCardSkeleton: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  profileCardSmallSkeleton: {
    width: 125,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
    marginLeft: 5,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  skeletonTextOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center' as const,
  },
  happyStorySkeleton: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  section: {
    marginTop: 5,
    paddingHorizontal: 0,
    marginBottom: 80,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#420001',
    marginLeft: 8,
  },
  viewAllText: {
    color: '#E58E15',
    fontSize: 14,
    fontWeight: '500',
  },
  carouselList: {
    paddingVertical: 4,
  },
  card: {
    margin: 5,
    padding: 0,
    borderWidth: 0, // Optional: Remove card border
    shadowColor: 'transparent', // Optional: Remove shadow
  },
  user: {
    position: 'relative', // Allows text to overlay the image
  },
  // nearyouImage: {
  //   width: '100%',
  //   height: 200,
  // },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(66, 0, 1, 0.7)', // Semi-transparent primary color background for text
    paddingVertical: 5,
    alignItems: 'center',
    borderTopEndRadius: 10,
    borderTopStartRadius: 10

  },
  userText: {
    color: '#DADADA',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 4
  },
  nearyouContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // paddingVertical: 10,
    overflow: 'visible'

  },
  nearyouImage: {
    height: 150,
    width: 125,
    borderRadius: 10, // Optional: Rounded corners for the image
  },
  headerContainer: {
    flexDirection: 'row', // Aligns children horizontally
    justifyContent: 'space-between', // Pushes the items to the far left and right
    alignItems: 'center', // Vertically center the text and line
    gap: 10
  },
  headerText: {
    // fontSize: 24, // Equivalent to text-xl
    marginTop: 10,
    marginBottom: 10,
    color: '#420001',
  },
  sideLine: {
    height: 1,
    backgroundColor: '#420001',
    flex: 1, // Makes the line stretch to fill the available space
    // marginTop: 10,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40, // Add spacing at the bottom for better scrolling
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#420001',
    padding: 7
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 999,
    marginRight: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,

    // 3D Shadow for Android
    elevation: 8,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  greetingName: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    textAlign: 'center',
    fontSize: 23,
    marginBottom: 16,
    marginTop: 20,
    color: '#E58E15',
    fontWeight: 'bold',
  },
  bellWrapper: {
    marginRight: 12,
    position: 'relative',
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for iOS
    // 3D Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,

    // 3D Shadow for Android
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'green',
    borderRadius: 20,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#DADADA',
    fontSize: 10,
    fontWeight: '600',
  },
  tierContainer: {
    marginTop: 2,
  },
  tierDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(45, 55, 72, 0.5)', // Semi-transparent dark background
    alignSelf: 'flex-start',
    padding: 0,
    paddingRight: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tierGradient: {
    borderRadius: 16,
    padding: 1, // For border
  },
  tierContent: {
    backgroundColor: '#1E1E1E', // Dark background for gradient to show
    borderRadius: 15,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#2D3748', // A dark gray that works well with all colors
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tierTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginEnd: 5
  },
  freeTierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  freeTierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  freeTierText: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '600',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    marginLeft: 4
  },
  upgradeText: {
    color: '#130001',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },

});

export default Index;
