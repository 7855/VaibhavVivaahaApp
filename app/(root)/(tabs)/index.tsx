import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, StyleSheet, Text as TextNative, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NativeBaseProvider, Box, Stack, Heading, Text, HStack, Center, VStack, Skeleton } from 'native-base';
// import ProfileSwiper from '@/components/tindercard';
import icons from '@/constants/icons';
import { Card } from 'react-native-elements';
import SwiperProfile from '@/components/swiperprofile';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconMeterial from 'react-native-vector-icons/MaterialIcons';

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
    <Skeleton h={120} w={120} rounded="md" />
    <VStack p={2} space={1}>
      <Skeleton h={4} w="80%" rounded="sm" />
      <Skeleton h={3} w="60%" rounded="sm" />
      <HStack space={1} mt={1}>
        <Skeleton h={3} w={12} rounded="full" />
        <Skeleton h={3} w={12} rounded="full" />
      </HStack>
    </VStack>
  </View>
);

const StatsSkeleton = () => (
  <HStack space={4} justifyContent="center" my={4}>
    {[1, 2, 3].map((item) => (
      <Center key={item} h="120" w="20" bg="blueGray.100" rounded="xl" >
        <VStack alignItems="center" space={2}>
          <Skeleton size="10" rounded="full" />
          <Skeleton.Text lines={1} px="2" />
          <Skeleton h="6" w="40%" />
        </VStack>
      </Center>
    ))}
  </HStack>
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


import { router, useNavigation } from 'expo-router';
import { Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import Getstart from '../../getstart';
import userApi from '../api/userApi';
// import Getstart from '@/app/(root)/(main)';
import { ArrowRight, Award, Bell, Crown, Eye, Heart, Send, User, UserCheck } from 'lucide-react-native';
import HappyStoryCard from '@/components/HappyStoryCard';
import ProfileCompletionBar from '@/components/ProfileCompletionBar';
import { useFocusEffect } from 'expo-router';
import { usePushNotifications } from '@/usePushNotification';
import { LinearGradient } from 'expo-linear-gradient';
import { loadUserSubscription } from '../services/masterService';
import { useSubscription } from '../contexts/subscriptionContext';

// const router = router();

const Index = () => {
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigation = useNavigation();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [newConnection, setNewConnection] = useState<any[]>([]);
  const [nearYouProfile, setNearYouProfile] = useState<any[]>([]);
  const [userConnectionCount, setUserConnectionCount] = useState<any[]>([]);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [gender, setGender] = useState<string>('');
  const [userIdValue, setUserId] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [casteId, setCasteId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [happyStories, setHappyStories] = useState<any[]>([]);
  const [percentage, setPercentage] = useState<number>(0);
  const [userPaid, setUserPaid] = useState<any>(false);
  const [timeLeft, setTimeLeft] = useState('');
const { subscriptionData = {}, setSubscription } = useSubscription() || {};
  const [userTier, setUserTier] = useState<string | null>(null);


  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchUnreadCount = async () => {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;

        try {
          const unreadCount = await userApi.getUnreadNotificationCount(userId);
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
    }, []) // Empty dependency array means this runs once when the component mounts
  );


  useEffect(() => {
    const fetchHappyStories = async () => {
      try {
        const response = await userApi.getAllHappyStoriesByIsActive();
        // console.log('Happy Stories Data:', response.data.data);
        setHappyStories(response.data.data);
      } catch (error) {
        21
        console.error('Error fetching happy storgetPies:', error);
      }
    };
    fetchHappyStories();
  }, []);

  useEffect(() => {
    const fetchHappyStories = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const isUser = await AsyncStorage.getItem('isUser');

        setUserPaid(isUser == 'PU' ? true : false);
        const response = await userApi.getProfileCompletion(userId);
        console.log('Percentage Data ===========>:', response.data.data.data);
        if (response.data.data.data) {
          setPercentage(response.data.data.data.percentage);
        }
      } catch (error) {
        console.error('Error fetching happy stories:', error);
      }
    };

    const getUserPaidStatus = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const response = await userApi.getUserPaidStatus(userId);
        console.log('User Paid Status Data ===========>:', response.data.data);
        setUserPaid(response.data.data);
      } catch (error) {
        console.error('Error fetching user paid status:', error);
      }
    };
    fetchHappyStories();
    getUserPaidStatus();
  }, []);



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
    const checkUserStatus = async () => {
      setIsLoading(true);
      try {
        const userId = await AsyncStorage.getItem('userId');
        const started = await AsyncStorage.getItem('hasStarted');
        const firstName = await AsyncStorage.getItem('firstName');
        const lastName = await AsyncStorage.getItem('lastName');
        
        // Get user subscription status
        if (userId) {
          try {
            const decodedUserId = atob(userId);
            const subscription = await userApi.getActiveUserSubscriptionByUserId(decodedUserId);
            const wholeSubscriptionData = subscription;
            if(subscription.data.data){
              setUserTier(subscription.data.data.planCode);
            }
            // console.log("Tier ===>",subscription.data.data.planCode);
            
            // console.log('Subscription response:------------------->', subscription.data.data);
            if(subscription.data.data?.entitlements) {
              await AsyncStorage.setItem('subscription', JSON.stringify(subscription.data.data.entitlements));
              console.log('Subscription entitlements saved to AsyncStorage');
            }
            if(subscription.data.data.subscriptionId) {
              await AsyncStorage.setItem('subscriptionId', JSON.stringify(subscription.data.data.subscriptionId));
            }
          } catch (error) {
            console.error('Error fetching subscription:', error);
          }
        }
        const profileImage = await AsyncStorage.getItem('profileImage');  
        console.log('Profile Image Data ===========>:', profileImage);
        const location = await AsyncStorage.getItem('location');
        const storedGender = await AsyncStorage.getItem('gender');
        const casteId = await AsyncStorage.getItem('casteId');

        // Set state
        setUserId(userId || null);
        setCasteId(casteId || null);
        setLocation(location || null);
        setFirstName(firstName || '');
        setLastName(lastName || '');
        setProfileImage(profileImage || null);
        setGender(storedGender || '');

        // Use local variables instead of waiting for state update
        if (!userId || !casteId || !storedGender || !location) {
          // Use the correct path format for expo-router v3
          // @ts-ignore - expo-router types are not up to date
          router.push({
            pathname: '/(main)/LoginScreen',
            params: { from: 'home' }
          } as any);
          console.log('⛔ Required values missing, redirecting to sign in');
          console.log('Missing values:', { userId, casteId, storedGender, location });
          return;
        }

        setHasStarted(true);
        const casteIdValue = parseInt(casteId);
        console.log("🔥 Calling all APIs...");
        
        // Simulate loading for demo purposes
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);

        const [rec, conn, near, count] = await Promise.all([
          userApi.getDailyRecommendation(casteIdValue, storedGender),
          userApi.getNewConnections(casteIdValue, storedGender),
          userApi.getNearYouProfiles(casteIdValue, storedGender, location),
          userApi.userConnectionCount(userId),
        ]);

        // console.log("ec.data?.data?.slice(0, 7)=>",rec.data?.data?.slice(0, 7));
        
        setRecommendations(rec.data?.data?.slice(0, 7) || []);
        setNewConnection(conn.data?.data?.slice(0, 7) || []);
        setNearYouProfile(near.data?.data?.slice(0, 7) || []);
        setUserConnectionCount(count.data?.data);
        const unreadCount = await userApi.getUnreadNotificationCount(userId);
        setUnreadCount(unreadCount.data?.data);
      } catch (error) {
        console.error('Error checking user status:', error);
        setHasStarted(false);
      }
    };

    checkUserStatus();
  }, []);

useEffect(() => {
  const initSubscription = async () => {
    const raw = await AsyncStorage.getItem("userId");
    if (!raw) return;

    const userId = atob(raw);
    await loadUserSubscription(userId, setSubscription);
    console.log("subscriptionData==>",subscriptionData);
    
  };

  initSubscription();
}, []);


  // const onStart = async () => {
  //   await AsyncStorage.setItem("hasStarted", "true");
  //   setHasStarted(true);
  // };

  // const [followingList, setFollowingList] = useState([]);
  // const [followersList, setFollowersList] = useState([]);

  const handleFollowingPress = async () => {
    try {
      const response = await userApi.getFollowingList(userIdValue);
      const followingData = response.data.data || [];
      router.push({
        pathname: '/screens/FollowUserList',
        params: {
          title: 'Following',
          data: JSON.stringify(followingData)
        }
      });

    } catch (error) {
      console.error('Error fetching following list:', error);
    }
  };

  const handleFollowersPress = async () => {
    try {
      const response = await userApi.getFollowersList(userIdValue);
      const followersData = response.data.data || [];
      router.push({
        pathname: '/screens/FollowUserList',
        params: {
          title: 'Followers',
          data: JSON.stringify(followersData)
        }
      });
    } catch (error) {
      console.error('Error fetching followers list:', error);
    }
  };

  const { expoPushToken, notification } = usePushNotifications();

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
        textColor: '#FFD700',
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
    <NativeBaseProvider>
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
                  source={profileImage ? { uri: profileImage } :
                    gender === 'M' ? require('../../../assets/images/avatarMen.png') :
                      gender === 'F' ? require('../../../assets/images/avatarWomen.png') :
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
                    <TextNative style={[styles.greetingName, { color: '#fff' }]}>
                      {firstName} {lastName}
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
                          <ArrowRight size={14} color="#000" />
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
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>247</Text>
        <Text style={{ fontSize: 12, color: '#4B5563', textAlign: 'center', fontWeight: '500' }}>
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
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>32</Text>
        <Text style={{ fontSize: 12, color: '#4B5563', textAlign: 'center', fontWeight: '500' }}>
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
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>156</Text>
        <Text style={{ fontSize: 12, color: '#4B5563', textAlign: 'center', fontWeight: '500' }}>
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
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>18</Text>
        <Text style={{ fontSize: 12, color: '#4B5563', textAlign: 'center', fontWeight: '500' }}>
          Matches
        </Text>
      </View>
    </View>
  </LinearGradient>
    </View>

    <View style={{ paddingHorizontal: 5 ,  // 🔥 Box shadow
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
            color: '#111827',
            fontWeight: 'bold',
            fontSize: 10,
            textAlign: 'right',
          }}
        >
          100% Completed
        </Text>
      </View>
    </View>
  </LinearGradient>
</View>


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
                          <Text fontSize="md" fontWeight="semibold">
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
                          <Text fontSize="md" fontWeight="semibold">
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
                          <Text fontSize="md" fontWeight="semibold">
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
                          <Text fontSize="md" fontWeight="semibold">
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

                <Box
                  width="100%"
                  style={{
                    height: 200,
                    marginVertical: 10,
                    marginTop: 10,
                    padding: 5,
                    marginBottom: 20
                  }}
                >
                  <Image
                    source={require('../../../assets/images/homeBanner2.png')}
                    style={{
                      width: '100%',
                      height: '100%',
                      resizeMode: 'cover',
                      borderRadius: 10
                    }}
                  />
                </Box>

                <View style={styles.section}>
                  {/* Header */}
                  <View style={{ paddingHorizontal: 7, marginBottom: 15 }}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack>
                        {/* Title Row with Hearts */}
                        <HStack alignItems="center" space={2}>
                          <Heart size={20} color="#EF4444" />
                          <Text fontSize="lg" fontWeight="semibold" color="#1f2937">
                            Happy Stories
                          </Text>
                          <Heart size={20} color="#EF4444" fill="#EF4444" />
                          <Heart size={20} color="#EF4444" fill="#EF4444" />

                        </HStack>

                        {/* Countdown Row */}
                        <HStack alignItems="center" space={1} mt={1}>
                          <Text fontSize="xs" color="gray">Every love story is beautiful, but ours is our favorite.</Text>
                        </HStack>
                      </VStack>

                    </HStack>
                  </View>




                  {/* Horizontal Carousel */}
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

                </View>
              </Box>
            </Box>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* )} */}

    </NativeBaseProvider>
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
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
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
    color: 'white',
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
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  greetingName: {
    fontSize: 15,
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
    color: 'white',
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
  marginLeft:4
},
upgradeText: {
  color: '#000',
  fontSize: 11,
  fontWeight: '700',
  marginRight: 4,
},

});

export default Index;
