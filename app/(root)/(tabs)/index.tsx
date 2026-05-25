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
import VVMWelcomeHeader from '@/components/VVMWelcomeHeader';
import PromotionalPopup from '@/components/PromotionalPopup';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';
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
  const popup = usePopup();
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const dataLoadedRef = useRef(false);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [newConnection, setNewConnection] = useState<any[]>([]);
  const [nearYouProfile, setNearYouProfile] = useState<any[]>([]);
  const [interestMatches, setInterestMatches] = useState<any[]>([]);
  const [userConnectionCount, setUserConnectionCount] = useState<ConnectionCount>({});
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [happyStories, setHappyStories] = useState<any[]>([]);
  const [percentage, setPercentage] = useState<number>(0);
  const [memberId, setMemberId] = useState<string>('');

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

      // Re-fetch profile completion on every focus so updates (e.g. adding interests) reflect immediately
      const refreshProfileCompletion = async () => {
        if (!userData.userId) return;
        try {
          const response = await userApi.getProfileCompletion(userData.userId);
          if (isActive && response.data?.data?.data) {
            setPercentage(response.data.data.data.percentage);
          }
        } catch (_) {}
      };

      fetchUnreadCount();
      refreshProfileCompletion();

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
            if (subscription.data?.code === 200 && subscription.data?.data) {
              setUserTier(subscription.data.data.planCode);
              setSubscription(subscription.data.data);
            } else {
              // 404 / no active subscription → user is on Free plan
              setUserTier('FREE');
              setSubscription({
                planTitle: 'Free',
                subscriptionId: null,
                startDate: null,
                endDate: null,
                entitlements: {},
              });
            }
          } catch (error) {
            console.error('Error fetching subscription:', error);
            setUserTier('FREE');
            setSubscription({
              planTitle: 'Free',
              subscriptionId: null,
              startDate: null,
              endDate: null,
              entitlements: {},
            });
          }
        }

        setHasStarted(true);
        const casteIdValue = parseInt(userData.casteId!);

        const [rec, conn, near, count, intMatch] = await Promise.all([
          userApi.getDailyRecommendation(casteIdValue, userData.gender),
          userApi.getNewConnections(casteIdValue, userData.gender),
          userApi.getNearYouProfiles(casteIdValue, userData.gender, userData.location),
          userApi.userConnectionCount(userData.userId),
          userApi.getInterestMatchesByUser(
            casteIdValue,
            userData.gender === 'M' ? 'F' : 'M',
            userData.userId
          ).catch(() => ({ data: { data: [] } })),
        ]);

        setRecommendations(rec.data?.data?.slice(0, 7) || []);
        setNewConnection(conn.data?.data?.slice(0, 7) || []);
        setNearYouProfile(near.data?.data?.slice(0, 7) || []);
        setUserConnectionCount(count.data?.data || {});
        setInterestMatches(intMatch.data?.data?.slice(0, 7) || []);

        const [unreadRes, profileRes] = await Promise.all([
          userApi.getUnreadNotificationCount(userData.userId),
          userApi.getProfileDetails(userData.userId).catch(() => null),
        ]);
        setUnreadCount(unreadRes.data?.data);
        if (profileRes?.data?.data?.memberId) setMemberId(profileRes.data.data.memberId);

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
          icon: <Crown size={14} color="#fff" />,
          background: '#7c3aed',
          textColor: '#fff',
          gradient: ['#7c3aed', '#6d28d9'],
          borderColor: '#7c3aed',
          name: 'Platinum'
        };
      case 'GOLD':
        return {
          ...baseStyle,
          icon: <Award size={14} color="#4a2e06" />,
          background: '#F5A425',
          textColor: '#4a2e06',
          gradient: ['#F5A425', '#e08d10'],
          borderColor: '#F5A425',
          name: 'Gold'
        };
      case 'SILVER':
        return {
          ...baseStyle,
          icon: <Award size={14} color="#374151" />,
          background: '#d1d5db',
          textColor: '#374151',
          gradient: ['#d1d5db', '#9ca3af'],
          borderColor: '#d1d5db',
          name: 'Silver'
        };
      case 'STARTER':
        return {
          ...baseStyle,
          icon: <Award size={14} color="#fff" />,
          background: '#1F7FE5',
          textColor: '#fff',
          gradient: ['#1F7FE5', '#1862b8'],
          borderColor: '#1F7FE5',
          name: 'Starter'
        };
      case 'CLASSIC':
      case 'BRONZE':
        return {
          ...baseStyle,
          icon: <Award size={14} color="#fff" />,
          background: '#d97706',
          textColor: '#fff',
          gradient: ['#d97706', '#b45309'],
          borderColor: '#d97706',
          name: 'Classic'
        };
      default: // FREE
        return {
          ...baseStyle,
          icon: <User size={14} color="#fff" />,
          background: '#64748b',
          textColor: '#fff',
          gradient: ['#64748b', '#475569'],
          borderColor: '#64748b',
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
      <PromotionalPopup />
      {/* {!hasStarted || hasStarted == null ? ( */}
      {/* // <Getstart onStart={onStart} /> */}
      {/* ) : ( */}
      <SafeAreaView edges={['right', 'left']} style={{ flex: 1, backgroundColor: '#d0dfeb' }}>
        <LinearGradient
          colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
          locations={[0, 0.3, 0.6, 1.0]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>

          <View>
            <VVMWelcomeHeader
              userData={userData}
              tierName={tierStyle?.name}
              unreadCount={unreadCount}
              router={router}
              isVerified={false}
              memberId={memberId}
              stats={{
                likes: userConnectionCount.Hearts || 0,
                proposals: userConnectionCount.Proposals || 0,
                views: userConnectionCount.Admirers || 0,
                matches: userConnectionCount.Matches || 0,
              }}
              onStatRefresh={async () => {
                try {
                  const casteIdValue = parseInt(userData.casteId!);
                  const [count, rec, conn, near, intMatch, unreadRes] = await Promise.all([
                    userApi.userConnectionCount(userData.userId),
                    userApi.getDailyRecommendation(casteIdValue, userData.gender),
                    userApi.getNewConnections(casteIdValue, userData.gender),
                    userApi.getNearYouProfiles(casteIdValue, userData.gender, userData.location),
                    userApi.getInterestMatchesByUser(casteIdValue, userData.gender === 'M' ? 'F' : 'M', userData.userId).catch(() => ({ data: { data: [] } })),
                    userApi.getUnreadNotificationCount(userData.userId),
                  ]);
                  setUserConnectionCount(count.data?.data || {});
                  setRecommendations(rec.data?.data?.slice(0, 7) || []);
                  setNewConnection(conn.data?.data?.slice(0, 7) || []);
                  setNearYouProfile(near.data?.data?.slice(0, 7) || []);
                  setInterestMatches(intMatch.data?.data?.slice(0, 7) || []);
                  setUnreadCount(unreadRes.data?.data);
                  popup.success('Refreshed', 'All sections updated successfully.');
                } catch (e) {
                  console.error(e);
                  popup.error('Refresh failed', 'Please try again.');
                }
              }}
              onStatsPress={(key) => {
                if (key === 'likes' || key === 'matches') {
                  router.push({ pathname: '/screens/ListUser', params: { type: 'connection' } });
                } else if (key === 'proposals') {
                  router.push('/(tabs)/mailBox');
                } else if (key === 'views') {
                  router.push({ pathname: '/screens/ListUser', params: { type: 'viewed' } });
                }
              }}
            />

            <Box alignItems="center">
              <Box
                overflow="hidden"
                width="100%"
                height="100%"
                p={0}
                m={0}
                borderTopLeftRadius={30}
                borderTopRightRadius={30}
                borderWidth={0}
                _dark={{
                  borderColor: 'coolGray.600',
                  backgroundColor: 'gray.700',
                }}
                _web={{
                  shadow: 2,
                  borderWidth: 1,
                }}
                _light={{
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                }}
                style={{
                  borderWidth: 0,
                }}
              >

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
            backgroundColor: '#1F7FE5',
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
            colors={['#1F7FE5', '#1862b8']}
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
            color: '#0f1724',
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
                  backgroundColor="transparent"
                  px={2}
                  pt={2}
                  borderRadius={20}
                  mt={3}
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
                          <Text fontSize={15} fontFamily="Rubik-Bold" color="#162336">
                            New Connections
                          </Text>
                          <HStack alignItems="center" space={1}>
                            <Icon name="bullseye" size={13} color="#8B3A3A" />
                            <Text fontSize="xs" fontFamily="Rubik-Regular" color="#64748b">
                              Explore Profiles, Spark New Connections
                            </Text>
                          </HStack>
                        </VStack>
                        <Icon name="chevron-right" size={22} color="#94a3b8" />
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
                  backgroundColor="transparent"
                  px={2}
                  pt={2}
                  borderRadius={20}
                  mt={3}
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
                          <Text fontSize={15} fontFamily="Rubik-Bold" color="#162336">
                            Daily Recommendations
                          </Text>
                          <HStack alignItems="center" space={1}>
                            <Icon name="clock-o" size={13} color="#8B3A3A" />
                            <Text fontSize="xs" fontFamily="Rubik-Regular" color="#64748b">
                              {timeLeft || 'Calculating...'} left to view these profiles
                            </Text>
                          </HStack>
                        </VStack>
                        <Icon name="chevron-right" size={22} color="#94a3b8" />
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
                <Box
                  overflow="hidden"
                  backgroundColor="transparent"
                  px={2}
                  pt={2}
                  borderRadius={20}
                  mt={3}
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
                          <Text fontSize={15} fontFamily="Rubik-Bold" color="#162336">
                            Near You
                          </Text>
                          <HStack alignItems="center" space={1}>
                            <Icon name="map-marker" size={13} color="#8B3A3A" />
                            <Text fontSize="xs" fontFamily="Rubik-Regular" color="#64748b">
                              Discover profiles in your area
                            </Text>
                          </HStack>
                        </VStack>
                        <Icon name="chevron-right" size={22} color="#94a3b8" />
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

                {/* Interest-Based Matches shelf */}
                {interestMatches.length > 0 ? (
                  <Box
                    overflow="hidden"
                    backgroundColor="transparent"
                    px={2}
                    pt={2}
                    borderRadius={20}
                    mt={3}
                  >
                    <VStack space={3}>
                      <TouchableOpacity
                        onPress={() => {
                          router.push({
                            pathname: '/screens/listProfile',
                            params: {
                              type: 'interestMatches',
                              title: 'Matches Based on Interests'
                            }
                          });
                        }}
                      >
                        <HStack justifyContent="space-between" alignItems="center">
                          <VStack>
                            <Text fontSize={15} fontFamily="Rubik-Bold" color="#162336">
                              Matches Based on Interests
                            </Text>
                            <HStack alignItems="center" space={1}>
                              <Icon name="heart" size={13} color="#8B3A3A" />
                              <Text fontSize="xs" fontFamily="Rubik-Regular" color="#64748b">
                                Profiles who share your passions
                              </Text>
                            </HStack>
                          </VStack>
                          <Icon name="chevron-right" size={22} color="#94a3b8" />
                        </HStack>
                      </TouchableOpacity>
                      <Center marginLeft={1} marginBottom={2}>
                        <SwiperProfile users={interestMatches} onUserPress={(userId: any) => {
                          router.push({
                            pathname: '/screens/ProfileDetail',
                            params: { userId: userId }
                          });
                        }} />
                      </Center>
                    </VStack>
                  </Box>
                ) : null}

                {/* last convo section  */}
                {/* <Box
                  overflow="hidden"
                  backgroundColor="transparent"
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
                          <Text fontSize={15} fontFamily="Rubik-Bold" color="#162336">
                            Near You
                          </Text>
                          <HStack alignItems="center" space={1}>
                            <IconMeterial name="my-location" size={17} color="green" />
                            <Text fontSize="xs">Discover profiles near your location..</Text>
                          </HStack>
                        </VStack>
                        <Icon name="chevron-right" size={22} color="#94a3b8" />
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
        </LinearGradient>
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
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
    marginLeft: 8,
    letterSpacing: -0.3,
  },
  viewAllText: {
    color: '#E58E15',
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
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
    backgroundColor: 'rgba(15, 23, 36, 0.65)',
    paddingVertical: 5,
    alignItems: 'center',
    borderTopEndRadius: 10,
    borderTopStartRadius: 10

  },
  userText: {
    color: '#DADADA',
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
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
    marginTop: 10,
    marginBottom: 10,
    color: '#0f1724',
  },
  sideLine: {
    height: 1,
    backgroundColor: '#e2e8f0',
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40, // Add spacing at the bottom for better scrolling
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
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
    fontFamily: 'Rubik-Medium',
    fontStyle: 'italic',
  },
  greetingName: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
  },
  title: {
    textAlign: 'center',
    fontSize: 23,
    marginBottom: 16,
    marginTop: 20,
    color: '#E58E15',
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Medium',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Medium',
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
    color: '#0f1724',
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    marginRight: 4,
  },

});

export default Index;
