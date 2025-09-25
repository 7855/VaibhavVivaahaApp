import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, StyleSheet, Text as TextNative, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NativeBaseProvider, Box, Stack, Heading, Text, HStack, Center, VStack } from 'native-base';
// import ProfileSwiper from '@/components/tindercard';
import icons from '@/constants/icons';
import { Card } from 'react-native-elements';
import SwiperProfile from '@/components/swiperprofile';
import { MaterialIcons } from '@expo/vector-icons'; // Make sure to import icons from a library
import Icon from 'react-native-vector-icons/FontAwesome';
import IconMeterial from 'react-native-vector-icons/MaterialIcons';


import { router, useNavigation } from 'expo-router';
import { Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import Getstart from '../../getstart';
import userApi from '../api/userApi';
// import Getstart from '@/app/(root)/(main)';
import { Bell, Heart } from 'lucide-react-native';
import HappyStoryCard from '@/components/HappyStoryCard';
import ProfileCompletionBar from '@/components/ProfileCompletionBar';
import { useFocusEffect } from 'expo-router';
import { usePushNotifications } from '@/usePushNotification';

// const router = router();

const Index = () => {
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);
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
      } catch (error) {21
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
        if(response.data.data.data){
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
      try {
        const userId = await AsyncStorage.getItem('userId');
        const started = await AsyncStorage.getItem('hasStarted');
        const firstName = await AsyncStorage.getItem('firstName');
        const lastName = await AsyncStorage.getItem('lastName');
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

        const [rec, conn, near, count] = await Promise.all([
          userApi.getDailyRecommendation(casteIdValue, storedGender),
          userApi.getNewConnections(casteIdValue, storedGender),
          userApi.getNearYouProfiles(casteIdValue, storedGender, location),
          userApi.userConnectionCount(userId),
        ]);

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

  // API CALLS Starts----------------------------------------------------------------------------------------------------------------
  // Call API on page load:
  // useEffect(() => {
  //   if (!userIdValue) return;

  //   const fetchRecommendation = async () => {
  //     console.log("Calling recommendation API...");
  //     try {
  //       const response = await userApi.getDailyRecommendation(userIdValue);
  //       const data = response?.data?.data;
  //       setRecommendations(Array.isArray(data) ? data.slice(0, 7) : []);
  //     } catch (error: any) {
  //       console.error('Error fetching recommendations:', error);
  //     }
  //   };

  //   const fetchNewConnection = async () => {
  //     console.log("Calling recommendation API...");
  //     if (!userIdValue) {
  //       console.log('No userId available');
  //       return;
  //     }
  //     try {
  //       const response = await userApi.getNewConnections(userIdValue);
  //       const data = response?.data?.data;
  //       setNewConnection(Array.isArray(data) ? data.slice(0, 7) : []);
  //     } catch (error: any) {
  //       console.error('API call error:', error);
  //       setNewConnection([]);
  //     }
  //   };

  //   const fetchNearProfiles = async () => {
  //     console.log("Calling recommendation API...");
  //     if (!userIdValue || !location) {
  //       console.log('No userId or location available');
  //       return;
  //     }
  //     try {
  //       const response = await userApi.getNearYouProfiles(userIdValue, location);
  //       const data = response?.data?.data;
  //       setNearYouProfile(Array.isArray(data) ? data.slice(0, 7) : []);
  //     } catch (error: any) {
  //       console.error('API call error:', error);
  //       setNearYouProfile([]);
  //     }
  //   };

  //   const getUserConnectionCount = async () => {
  //     console.log("Calling recommendation API...");
  //     if (!userIdValue && !location) {
  //       console.log('No userId available');
  //       return;
  //     }
  //     try {
  //       const response = await userApi.userConnectionCount(userIdValue);
  //       setUserConnectionCount(response.data?.data);
  //     } catch (error: any) {
  //       console.error('Error fetching connection count:', error);
  //     }
  //   };

  //   fetchRecommendation();
  //   fetchNewConnection();
  //   fetchNearProfiles();
  //   getUserConnectionCount();
  // }, [userIdValue,location]);

  // useEffect(() => {
  //   if (!userIdValue || !casteId) return; // Wait until userId is available

  // const fetchRecommendation = async () => {
  //   console.log("Calling recommendation API...");
  //   try {
  //     const casteIdValue = parseInt(casteId);
  //     const response = await userApi.getDailyRecommendation(casteIdValue,gender);
  //     const data = response?.data?.data;
  //     setRecommendations(Array.isArray(data) ? data.slice(0, 7) : []);
  //   } catch (error: any) {
  //     console.error('Error fetching recommendations:', error);
  //   }
  // };

  // const fetchNewConnection = async () => {
  //   console.log("Calling recommendation API...");
  //   try {
  //     const casteIdValue = parseInt(casteId);
  //     const response = await userApi.getNewConnections(casteIdValue,gender);
  //     const data = response?.data?.data;
  //     setNewConnection(Array.isArray(data) ? data.slice(0, 7) : []);
  //   } catch (error: any) {
  //     console.error('API call error:', error);
  //     setNewConnection([]);
  //   }
  // };

  // const fetchNearProfiles = async () => {
  //   if (!location) {
  //     console.log('No userId or location available');
  //     return;
  //   }
  //   console.log("Calling recommendation API...");
  //   try {
  //     const casteIdValue = parseInt(casteId);
  //     const response = await userApi.getNearYouProfiles(casteIdValue,gender, location);
  //     const data = response?.data?.data;
  //     setNearYouProfile(Array.isArray(data) ? data.slice(0, 7) : []);
  //   } catch (error: any) {
  //     console.error('API call error:', error);
  //     setNearYouProfile([]);
  //   }
  // };

  // const getUserConnectionCount = async () => {
  //   console.log("Calling recommendation API...");
  //   try {
  //     const response = await userApi.userConnectionCount(userIdValue);
  //     setUserConnectionCount(response.data?.data);
  //   } catch (error: any) {
  //     console.error('Error fetching connection count:', error);
  //   }
  // };

  // fetchRecommendation();
  // fetchNewConnection();
  // fetchNearProfiles();
  // getUserConnectionCount();

  // }, [userIdValue, location, casteId, gender]); // 👈 now waits until both are available


  // API CALLS Ends----------------------------------------------------------------------------------------------------------------
  const { expoPushToken, notification } = usePushNotifications();
  
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
      <SafeAreaView edges={['right', 'left', 'top']}  style={{ backgroundColor: 'rgba(30,64,175,1.00)'}}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={{ marginTop: 12 }}>
            {/* <View style={styles.container}>
                 <Text>Token: {expoPushToken?.data ?? ""}</Text>
                 <Text>Notification: {data}</Text>
               </View> */}
            {/* ----------------------index page content  */}

            <View style={{ height: 155 }}>
              {/* <View className=""> */}
                <View style={[styles.container, { borderRadius: 999, paddingStart: 12 }]}>
                  {/* <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: '/screens/settings', 
                        });
                      }}
                    > */}
                  <Image
                    source={profileImage ? { uri: profileImage } :
                      gender === 'M' ? require('../../../assets/images/avatarMen.png') :
                        gender === 'F' ? require('../../../assets/images/avatarWomen.png') :
                          require('../../../assets/images/defaultAvatar.png')}
                    style={styles.profileImage}
                  />
                  {/* </TouchableOpacity> */}
                  <TextNative style={{ flex: 1, color: 'white' }}>
                    <TextNative style={[styles.greeting, { color: 'white' }]}>
                      Welcome, {'\n'}
                    </TextNative>
                    <View>
                      <TextNative style={[styles.greetingName, { color: 'white', marginTop: 4 }]}>
                        {firstName} {lastName}
                      </TextNative>
                    </View>
                  </TextNative>
                  <TouchableOpacity onPress={() => router.push('/screens/NotificationScreen')}>
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

                <View style={{ marginBottom: 12, padding: 9 }}>
                  <ProfileCompletionBar percentage={percentage} isPremium={userPaid} />
                </View>
              {/* </View> */}
            </View>

            <Box alignItems="center">
              <Box
                overflow="hidden"
                borderColor="coolGray.200"
                width="100%"
                p={0}
                m={0}
                _dark={{
                  borderColor: 'coolGray.600',
                  backgroundColor: 'gray.700',
                }}
                _web={{
                  shadow: 2,
                  borderWidth: 0,
                }}
                _light={{
                  backgroundColor: 'gray.50',
                }}
                borderTopLeftRadius={20}
                borderTopRightRadius={20}
              >
                {/* Four Boxes Section */}
                <Box overflow="hidden" borderColor="coolGray.200" p={5} style={{ borderTopEndRadius: 20, borderTopStartRadius: 20 }}>
                  <HStack space={3} justifyContent="center">
                    {/* Box 1 */}
                    <TouchableOpacity onPress={handleFollowersPress}>
                      <Center h="120" w="20" bg="blueGray" rounded="xl" >
                        <VStack alignItems="center" space={2}>
                          <Icon name="heartbeat" size={35} color="#9C27B0" />
                          <TextNative style={{ fontSize: 14, textAlign: 'center', flexWrap: 'wrap', fontWeight: '500' }}>Your Connection</TextNative>
                          <Text color="" fontSize="xl" fontWeight="bold" style={{ fontSize: 18 }}>{userConnectionCount?.YourConnection}</Text>
                        </VStack>
                      </Center>
                    </TouchableOpacity>

                    {/* Box 2 */}
                    <TouchableOpacity onPress={handleFollowingPress}>
                      <Center h="120" w="20" bg="blueGray" rounded="xl" >
                        <VStack alignItems="center" space={2}>
                          <Icon name="heart" size={35} color="#9C27B0" />
                          <TextNative style={{ fontSize: 14, textAlign: 'center', flexWrap: 'wrap', fontWeight: '500' }}>Interest      Sent</TextNative>
                          <Text color="" fontSize="xl" fontWeight="bold" style={{ fontSize: 18 }}>{userConnectionCount?.InterestSent}</Text>
                        </VStack>
                      </Center>
                    </TouchableOpacity>

                    {/* Box 3 */}
                    <Center h="120" w="20" bg="blueGray" rounded="xl" >
                      <VStack alignItems="center" space={2}>
                        <Icon name="eye" size={35} color="#9C27B0" />
                        <TextNative style={{ fontSize: 14, textAlign: 'center', flexWrap: 'wrap', fontWeight: '500' }}>Viewed        You</TextNative>
                        <Text color="" fontSize="xl" fontWeight="bold" style={{ fontSize: 18 }}>{userConnectionCount?.viewCount}</Text>
                      </VStack>
                    </Center>

                    {/* Box 4 */}
                    <Center h="120" w="20" bg="blueGray" rounded="xl" >
                      <VStack alignItems="center" space={2}>
                        <Icon name="check-circle-o" size={35} color="#9C27B0" />
                        <TextNative style={{ fontSize: 14, textAlign: 'center', flexWrap: 'wrap', fontWeight: '500' }}>Interest Accepted</TextNative>
                        <Text color="" fontSize="xl" fontWeight="bold" style={{ fontSize: 18 }}>{userConnectionCount?.InterestAccepted}</Text>
                      </VStack>
                    </Center>
                  </HStack>
                </Box>

                {/*  New Connections Section */}
                <Box
                  overflow="hidden"
                  backgroundColor="blueGray.200"
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
                      <SwiperProfile users={newConnection} onUserPress={(userId: any) => {
                        router.push({
                          pathname: '/screens/ProfileDetail',
                          params: { userId: userId }
                        });
                      }} />
                    </Center>
                  </VStack>
                </Box>
                {/* </TouchableOpacity> */}

                {/* Daily Recommendation Section  */}
                <Box
                  overflow="hidden"
                  borderColor="black"
                  p={2}
                  borderRadius={20}
                >
                  <VStack space={3}>
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: '/screens/listProfile',
                          params: {
                            type: 'dailyRecommendations',
                            title: 'Daily Recommendations0'
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

                        <Text fontSize="sm" color={'blue'} fontWeight="normal">View All
                          {/* <Icon name="chevron-right" size={15} color="green" />                      */}
                        </Text>
                        {/* <Icon name="chevron-circle-right" size={35} color="green" /> */}
                      </HStack>
                    </TouchableOpacity>

                    <Center marginLeft={1} marginBottom={2}>
                      <SwiperProfile users={recommendations} onUserPress={(userId: any) => {
                        router.push({
                          pathname: '/screens/ProfileDetail',
                          params: { userId: userId }
                        });
                      }} />
                    </Center>
                  </VStack>
                </Box>

                {/* last convo section  */}
                <Box
                  overflow="hidden"
                  backgroundColor="blueGray.200"
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
                </Box>

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
  section: {
    marginTop: 20,
    paddingHorizontal: 12,
    marginBottom: 100,
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
    color: '#1F2937',
    marginLeft: 8,
  },
  viewAllText: {
    color: '#EF4444',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background for text
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
    color: 'rgba(30,64,175,1.00)'
  },
  sideLine: {
    height: 1,
    backgroundColor: 'rgba(30,64,175,1.00)',
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
    backgroundColor: 'rgba(30,64,175,1.00)',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
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
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    textAlign: 'center',
    fontSize: 23,
    marginBottom: 16,
    marginTop: 20,
    color: '#1E40AF',
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
});

export default Index;
