import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ImageBackground, useWindowDimensions, Modal, TouchableWithoutFeedback, ActivityIndicator, FlatList, Dimensions } from 'react-native'
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react'
import { Box, Button, Center, Divider, FormControl, HStack, Input, NativeBaseProvider, Stack, Text as TextBase } from 'native-base';
import { router, useLocalSearchParams } from 'expo-router';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import ProfileDetailTab from '@/components/ProfileDetailTab';
import FeatherIcon from '@expo/vector-icons/Feather'

import userApi from '@/app/(root)/api/userApi';
import { Briefcase, Calendar, DollarSign, Heart, MapPin, MessageCircle, Ruler } from 'lucide-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useUserData } from '../contexts/UserDataContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';




const ProfileDetail = () => {
  const { userData } = useUserData();
  const { subscriptionData } = useSubscription();
  const { userId } = useLocalSearchParams();
  const [userDetailId, setUserDetailId] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [permissionRequests, setPermissionRequests] = useState<{ [key: string]: boolean }>({ profileImage: false });
  const [personalDetail, setPersonalDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSender, setIsSender] = useState(false);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPremiumValue, setIsPremiumValue] = useState(false);
  const [hiddenFeildsValue, setHiddenFeildsValue] = useState<any>([]);
  const [subscriptionId, setSubscriptionId] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [interestStatus, setInterestStatus] = useState('NONE');

  useEffect(() => {
    const fetchViewedProfile = async () => {
      try {
        if (userData.userId && userId) {
          userApi.viewedProfile(userData.userId, userId).then((response: any) => {
          });
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };
    // fetchUserId();
    fetchViewedProfile();
  }, [userId]);


  useEffect(() => {
    if (userData.userId) {
      setCurrentUserId(userData.userId);
    }
  }, [userData.userId]);

  // Load existing permission requests when userId is available
  useEffect(() => {
    const loadExistingRequests = async () => {
      if (!currentUserId || !userId) return;

      try {
        const decodedUserId = atob(currentUserId);
        const response = await userApi.getRequestsTo(decodedUserId, userId);

        if (!response?.data?.data) {
          console.log('No existing requests found');
          return;
        }

        const requests = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        const existingRequests = requests
          .filter((request: any) => request && request.fieldType)
          .map((request: any) => request.fieldType);

        const updatedRequests = {
          ...permissionRequests,
          profileImage: existingRequests.includes('PROFILE_IMAGE')
        };
        setPermissionRequests(updatedRequests);
      } catch (error) {
        console.error('Error loading existing requests:', error);
      }
    };

    if (currentUserId && userId) {
      loadExistingRequests();
    }
  }, [currentUserId, userId]);

  const openImageModal = async () => {
    try {
      const encodeId = btoa(userDetailId);
      const res = await userApi.getUserGalleryImages(encodeId); // Use correct userId
      if (res?.data?.data?.length > 0) {
        const imageUrls = res.data.data.map((img: any) => img.userImage);
        setGalleryImages(imageUrls);
      } else if (userDetails?.profileImage) {
        setGalleryImages([userDetails.profileImage]);
      }
      setImageModalVisible(true);


    } catch (error) {
      console.error("Error fetching gallery images:", error);
      setGalleryImages([userDetails?.profileImage]); // fallback on error
    }
  };


  const formatUserDetails = (data: any) => {

    if (!data || !data.userDetail || data.userDetail.length === 0) return [];

    const detail = data.userDetail[0];
    console.log("detail==>", detail);


    // Parse nested JSON fields
    const basicInfo = JSON.parse(detail.basicInfo || '{}');
    const astronomicInfoArray = JSON.parse(detail.astronomicInfo || '[]');
    const familyInfoArray = JSON.parse(detail.familyInfo || '[]');
    const astro = astronomicInfoArray[0] || {};
    const family = familyInfoArray[0] || {};

    // Check if current user has already liked this profile

    const result = [
      {
        section: "PersonalDetail",
        data: {
          Name: `${data.firstName} ${data.lastName}`,
          Gender: data.gender == 'M' ? 'Male' : 'Female',
          "Date of Birth": data.dob,
          'Mobile Number': data.mobile,
          Height: detail.height + "f.t",
          Weight: detail.weight,
          "Physical Status": basicInfo.physical_status,
          "Marital Status": basicInfo.marital_status,
          "Mother Language": detail.languages || "Not specified",
        },
      },
      {
        section: "ReligiousDetail",
        data: {
          Religion: "Hindu", // Hardcoded or from another field if available
          Caste: "SC",
          Star: astro.star,
          Moonsign: astro.moon_sign,
          Dosham: astro.dosham,
          Horoscope: detail.horoscope
        },
      },
      {
        section: "EducationalDetail",
        data: {
          Education: detail.degree,
          Occupation: detail.occupation,
          "Employing In": detail.employedAt,
          "Annual Income": detail.annualIncome + "",
        },
      },
      {
        section: "FamilyDetail",
        data: {
          "Family Type": family.familyType,
          "Family Status": family.family_status,
          "Fathers Name": family.father,
          "Fathers Occupation": family.father_occupation,
          "Mothers Name": family.mother,
          "Mothers Occupation": family.mother_occupation,
          "No of Sibblings": parseInt(family.no_of_sister) + parseInt(family.no_of_brother) + "",
        },
      }
    ];

    return result;
  };

  useEffect(() => {
    if (userId) {
      setUserDetailId(userId);
      console.log("userId============================>", userId);
      fetchUserDetails(userId);
      fetchProfileDetail();

    }
  }, [userId]);

  const fetchUserDetails = async (userId: any) => {
    try {
      setLoading(true);
      const hiddenFeildsResp = await userApi.getHiddenFieldsByUserId(userId);
      const hiddenFeilds = hiddenFeildsResp.data.data;
      // console.log("Hidden Feilds Data ===========>", hiddenFeilds);

      if (hiddenFeilds?.length > 0) {
        const fieldNames = hiddenFeilds.map((item: any) => item.fieldName);
        setHiddenFeildsValue(fieldNames);
      }

    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileDetail = async () => {
    try {
      setLoading(true);
      const hiddenFeildsResp = await userApi.getHiddenFieldsByUserId(userId);
      const hiddenFeilds = hiddenFeildsResp.data.data;
      // console.log("Hidden Feilds Data ===========>", hiddenFeilds);

      if (hiddenFeilds?.length > 0) {
        const fieldNames = hiddenFeilds.map((item: any) => item.fieldName);
        setHiddenFeildsValue(fieldNames);

        // console.log("Hidden Feilds Data =valueeeeeeee==========>", hiddenFeildsValue); // log the actual value before setting state
      }
      const userIdValue = userData.userId;

      const response = await userApi.getProfileDetailWithIntractionStatus(userIdValue, userId);
      const { profile, interactionStatus } = response.data.data;
      // Update profile data
      setUserDetails(profile);
      const formattedData = formatUserDetails(profile);
      setPersonalDetail(formattedData);
      // setPersonalDetail(profile.userDetail?.[0] || {});
      setUserDetailId(profile.userId);

      // Update interaction statuses from the single API response
      if (interactionStatus) {
        setInterestStatus(interactionStatus.interest?.status || 'NONE');
        setIsLiked(interactionStatus.liked || false);
        setIsShortlisted(interactionStatus.shortlisted || false);

        // Update isSender based on who sent the interest
        setIsSender(interactionStatus.interest?.sentBy === 'VIEWER');
      }

      // Handle gallery images if needed
      if (profile.galleryImages) {
        setGalleryImages(profile.galleryImages);
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        console.log("subscriptionData", subscriptionData);

        // Use subscription context instead of AsyncStorage
        if (subscriptionData?.entitlements) {
          setSubscriptionId(subscriptionData.subscriptionId);

          if (subscriptionData.entitlements.viewPersonalInfo === true) {
            setIsPremiumValue(true);
          } else {
            setIsPremiumValue(false);
          }
        } else {
          // Fallback: fetch from API if context is empty
          try {
            if (userData.decodedUserId) {
              const subscription = await userApi.getActiveUserSubscriptionByUserId(userData.decodedUserId);
              if (subscription.data.data?.entitlements) {
                if (subscription.data.data?.entitlements.viewPersonalInfo === true) {
                  setIsPremiumValue(true);
                } else {
                  setIsPremiumValue(false);
                }
              }
            }
          } catch (error) {
            console.error('Error fetching subscription:', error);
          }
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      }
    };

    checkPremiumStatus();
  }, [subscriptionData, userData.decodedUserId]);

  const handleLike = async () => {
    // console.log("currentUserId===================================>", currentUserId);
    // console.log("userId===================================>", userId);

    if (!currentUserId || !userId) return;

    const parsedUserId = Array.isArray(userId) ? userId[0] : userId;

    if (isLiked) {
      // Show confirmation for reverting like
      Alert.alert(
        'Revert Like',
        'Are you sure you want to revert this like?',
        [
          {
            text: 'No',
            style: 'cancel'
          },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                const likeRequest = {
                  likedBy: currentUserId,
                  likedTo: parsedUserId
                };

                await userApi.deleteLike(currentUserId, parsedUserId);
                setIsLiked(false);
                console.log('Like reverted successfully');
              } catch (error) {
                console.error('Error reverting like:', error);
              }
            }
          }
        ]
      );
    } else {
      try {
        const likeRequest = {
          likedBy: currentUserId,
          likedTo: parsedUserId
        };

        await userApi.createUserLike(likeRequest);
        setIsLiked(true);
        console.log('Like sent successfully');
      } catch (error) {
        console.error('Error creating like:', error);
      }
    }
  };

  const handleSendInterest = async () => {
    if (!currentUserId || !userId) return;

    const parsedUserId = Array.isArray(userId) ? userId[0] : userId;

    try {
      console.log("interestStatus===================================>", interestStatus);

      if (isPremiumValue == true) {

        try {
          const userId = userData.userId;
          const subscriptionId = subscriptionData?.subscriptionId;
          if (userId && subscriptionId) {
            const decodedUserId = atob(userId);
            const entitlements = subscriptionData?.entitlements;

            // Check if user has unlimited requests (Silver/Gold/Platinum)
            if (entitlements?.reqUnlimited === true) {
              // Unlimited requests - send interest directly
              if (interestStatus === 'NONE' || interestStatus === '' || interestStatus === null) {
                await userApi.sendInterestRequest(currentUserId, parsedUserId);
                setInterestStatus('PENDING');
                setIsSender(true);
              }
            } else if (entitlements?.reqLimited) {
              // Limited requests (Bronze) - check usage limit with featureId 5 (REQ_LIMITED)
              const updateSendRequestCount = await userApi.updateSendRequestCount(decodedUserId, subscriptionId, 5);
              console.log("updateSendRequestCount===================================>", updateSendRequestCount.data);

              if (updateSendRequestCount.data.code == 200) {
                if (interestStatus === 'NONE' || interestStatus === '' || interestStatus === null) {
                  await userApi.sendInterestRequest(currentUserId, parsedUserId);
                  setInterestStatus('PENDING');
                  setIsSender(true);
                }
              } else if (updateSendRequestCount.data.code == 401) {
                Alert.alert(
                  'Request Limit Exceeded',
                  `You have used all ${entitlements.reqLimited.limit} requests for this plan. Please upgrade to send more.`,
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'Upgrade',
                      onPress: () => {
                        router.push('/(root)/screens/PremiumTab');
                      }
                    }
                  ]
                );
              } else {
                Alert.alert(
                  'Something Went Wrong',
                  'Please try again later',
                  [
                    {
                      text: 'OK',
                      style: 'cancel'
                    }
                  ]
                );
              }
            } else {
              // No send request entitlement at all
              Alert.alert(
                'Feature Not Available',
                'Your current plan does not support sending interest requests. Please upgrade.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Upgrade', onPress: () => router.push('/(root)/screens/PremiumTab') }
                ]
              );
            }

          }
        } catch (error) {
          console.error('Error updating send request count:', error);
        }
      } else {
        Alert.alert(
          'Premium Required',
          'You need to upgrade to premium to send interest',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Upgrade',
              onPress: () => {
                router.push('/(root)/screens/PremiumTab');
              }
            }
          ]
        );
      }



      // Allow sending request if status is NONE, empty string, or null

    } catch (error) {
      console.error('Error sending interest request:', error);
    }
  };

  if (loading) {
    return (
      <NativeBaseProvider>
        <Center flex={1}>
          <Text>Loading...</Text>
        </Center>
      </NativeBaseProvider>
    );
  }

  return (
    <NativeBaseProvider>
      <SafeAreaView edges={['right', 'left', 'top']} className="" style={{ backgroundColor: '#420001', marginBottom: 0, paddingBottom: 0, marginTop: 0 }}>


        <Modal visible={isImageModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            {/* Close button */}
            <TouchableOpacity
              onPress={() => setImageModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close-circle" size={42} color="white" />
            </TouchableOpacity>

            {/* Swipeable images */}
            <FlatList
              data={galleryImages?.length ? galleryImages : [userDetails?.profileImage]}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              )}
            />
          </View>
        </Modal>


        {/* <ScrollView contentContainerStyle={styles.scrollViewContent}> */}
        <View style={{ height: '100%', width: '100%' }}>
          <View style={{ paddingHorizontal: 0 }}>
            <View style={styles.rowContainer}>
              {/* Left Column - Image */}
              <View style={styles.leftColumn}>
                <View style={styles.card}>
                  {hiddenFeildsValue.includes('profileImage') ? (
                    <ImageBackground
                      source={userDetails?.profileImage ? { uri: userDetails?.profileImage } :
                        userDetails?.gender === 'M' ? require('../../../assets/images/avatarMen.png') :
                          userDetails?.gender === 'F' ? require('../../../assets/images/avatarWomen.png') :
                            require('../../../assets/images/defaultAvatar.png')}
                      style={[styles.image]}
                      imageStyle={{ borderRadius: 10 }}
                    >
                      <BlurView
                        intensity={40}
                        tint="dark"
                        style={styles.restrictedOverlay}
                      >
                        <View style={{ backgroundColor: '#fff', borderRadius: 999, padding: 5 }}>

                          <FeatherIcon name="eye-off" size={22} color="#b91c1c" />
                        </View>
                        <Text style={styles.restrictedText}>User restricted the profile image to view</Text>
                        <TouchableOpacity
                          style={styles.permissionButton}
                          onPress={() => {
                            if (!currentUserId) {
                              Alert.alert('Error', 'User ID not found');
                              return;
                            }
                            try {
                              if (permissionRequests.profileImage) {
                                // Cancel request
                                const decodedUserId = atob(currentUserId);
                                userApi.deleteRequest(decodedUserId, userId, 'PROFILE_IMAGE').then(() => {
                                  setPermissionRequests(prev => ({
                                    ...prev,
                                    profileImage: false
                                  }));
                                  Alert.alert('Success', 'Permission request cancelled successfully');
                                }).catch(error => {
                                  Alert.alert('Error', 'Failed to cancel permission request');
                                });
                              } else {
                                // Send request
                                setPermissionRequests(prev => ({
                                  ...prev,
                                  profileImage: true
                                }));
                                const decodedUserId = atob(currentUserId);

                                userApi.sendRestrictedFieldRequest(decodedUserId, userId, 'PROFILE_IMAGE');
                                Alert.alert('Success', 'Permission request sent successfully');
                              }
                            } catch (error) {
                              Alert.alert('Error', 'Failed to process permission request');
                            }
                          }}
                        >
                          <LinearGradient
                            colors={['#6c5ce7', '#a29bfe']}
                            style={styles.starMatchButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            <Text style={styles.permissionButtonText}>
                              {permissionRequests.profileImage ? 'Cancel Request' : 'Click to Ask Permission'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </BlurView>
                    </ImageBackground>
                  ) : (
                    <ImageBackground
                      source={userDetails?.profileImage ? { uri: userDetails?.profileImage } :
                        userDetails?.gender === 'M' ? require('../../../assets/images/avatarMen.png') :
                          userDetails?.gender === 'F' ? require('../../../assets/images/avatarWomen.png') :
                            require('../../../assets/images/defaultAvatar.png')}
                      style={styles.image}
                      imageStyle={styles.imageStyle}
                    >
                      <View style={styles.iconOverlay}>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={handleLike}
                        >
                          <FontAwesome
                            name={isLiked ? "thumbs-up" : "thumbs-o-up"}
                            size={20}
                            color={isLiked ? "red" : "gray"}
                          />
                        </TouchableOpacity>

                        {/* Expand Icon in the Center */}
                        <TouchableOpacity style={styles.iconButton} onPress={openImageModal}>
                          <Ionicons name="expand-outline" size={20} color="green" />
                        </TouchableOpacity>





                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={async () => {
                            const storedUserId = userData.userId;

                            if (!storedUserId) {
                              Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'User ID not found',
                                position: 'top',
                                visibilityTime: 2000,
                              });
                              return;
                            }

                            let decodedUserId = '';
                            try {
                              decodedUserId = atob(storedUserId);
                            } catch (decodeError) {
                              Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Invalid user ID format',
                                position: 'top',
                                visibilityTime: 2000,
                              });
                              return;
                            }

                            if (!isPremiumValue) {
                              // Show Premium Required alert for non-premium users
                              Alert.alert(
                                'Premium Required',
                                'Shortlisting requires premium membership',
                                [
                                  {
                                    text: 'Cancel',
                                    style: 'cancel'
                                  },
                                  {
                                    text: 'Upgrade',
                                    onPress: () => {
                                      router.push('/(root)/screens/PremiumTab');
                                    }
                                  }
                                ]
                              );
                              return;
                            }

                            // Only show confirmation alert for premium users
                            const alertTitle = isShortlisted ? 'Unshortlist Profile' : 'Shortlist Profile';
                            const alertMessage = isShortlisted
                              ? 'Do you want to unshortlist this profile?'
                              : 'Do you want to shortlist this profile?';

                            Alert.alert(
                              alertTitle,
                              alertMessage,
                              [
                                {
                                  text: 'Cancel',
                                  style: 'cancel'
                                },
                                {
                                  text: 'OK',
                                  onPress: async () => {
                                    try {
                                      if (isShortlisted) {
                                        const encodedId = btoa(decodedUserId);
                                        await userApi.deleteShortlistedProfileByUsers(encodedId, userId);

                                        Toast.show({
                                          type: 'success',
                                          text1: 'Profile Unshortlisted',
                                          text2: 'Profile has been removed from your shortlist',
                                          position: 'top',
                                          visibilityTime: 2000,
                                        });
                                        setIsShortlisted(false);
                                      } else {
                                        // Proceed with shortlisting for premium users
                                        const encodedId = btoa(decodedUserId);
                                        await userApi.insertShortlistedProfile({
                                          shortlistedBy: decodedUserId,
                                          shortlistedUserId: userId
                                        });

                                        Toast.show({
                                          type: 'success',
                                          text1: 'Profile Shortlisted',
                                          text2: 'Profile has been added to your shortlist',
                                          position: 'top',
                                          visibilityTime: 2000,
                                        });
                                        setIsShortlisted(true);
                                      }
                                    } catch (error) {
                                      console.error('Error in shortlist operation:', error);
                                      Toast.show({
                                        type: 'error',
                                        text1: 'Error',
                                        text2: 'Failed to process shortlist request',
                                        position: 'top',
                                        visibilityTime: 2000,
                                      });
                                    }
                                  }
                                }
                              ]
                            )
                          }}
                        >
                          <Ionicons
                            name={isShortlisted ? "bookmark" : "bookmark-outline"}
                            size={20}
                            color={isShortlisted ? "#1e40af" : "gray"}
                          />
                        </TouchableOpacity>


                      </View>

                    </ImageBackground>
                  )}
                </View>
              </View>

              <View style={styles.rightColumn}>
                {/* Top Section - Name and Location */}
                <View style={styles.infoGrid}>
                  <View style={{
                    borderRadius: 12,
                    // padding: 7,
                    backdropFilter: 'blur(4px)', // Use `expo-blur` or just skip
                    width: '100%',
                    marginBottom: 5
                  }}>
                    {/* Full Name */}
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#DADADA',
                        marginBottom: 5,
                      }}
                    >
                      {userDetails?.firstName} {userDetails?.lastName}
                    </Text>

                    {/* Location */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <MapPin size={16} color="#059669" style={{ marginRight: 4 }} />
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                          fontSize: 14,
                          color: 'gray',
                        }}
                      >
                        {userDetails?.location || 'Location not set'}
                      </Text>
                    </View>
                  </View>

                  {/* Age Card */}
                  <View style={styles.cardright}>
                    <View style={styles.cardRow}>
                      <Calendar size={16} color="#4F46E5" />
                      <View style={styles.cardTextBlock}>
                        <Text style={styles.cardLabel}>Age</Text>
                        <Text style={styles.cardValue}>{userDetails?.age} years</Text>
                      </View>
                    </View>
                  </View>



                  {/* Occupation */}
                  {userDetails?.userDetail?.[0]?.occupation && (
                    <View style={[styles.cardright, styles.cardFull]}>
                      <View style={styles.cardRow}>
                        <Briefcase size={16} color="#2563EB" />
                        <View style={styles.cardTextBlock}>
                          <Text style={styles.cardLabel}>Occupation</Text>
                          <Text
                            style={[styles.cardValue, { flexShrink: 1 }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {userDetails.userDetail[0].occupation}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
                {/* Star Match Button - Premium Only */}
                <View style={styles.cardright}>
                  <TouchableOpacity
                    style={styles.starMatchButton}
                    onPress={() => {
                      if (!isPremiumValue) {
                        Alert.alert(
                          'Unlock Star Match ⭐',
                          'Star Match is a premium feature! Upgrade your plan to discover your compatibility score and find your perfect match.',
                          [
                            { text: 'Maybe Later', style: 'cancel' },
                            { text: 'Upgrade Now', onPress: () => router.push('/(root)/screens/PremiumTab') }
                          ]
                        );
                        return;
                      }

                      // Extract viewed profile's star match data
                      const detail = userDetails?.userDetail?.[0];
                      let viewedStar = '';
                      let viewedRasi = '';
                      let viewedPlace = '';
                      let viewedDob = userDetails?.dob || '';

                      if (detail) {
                        try {
                          const astroArray = JSON.parse(detail.astronomicInfo || '[]');
                          const astro = astroArray[0] || {};
                          viewedStar = astro.star || '';
                          viewedRasi = astro.moon_sign || '';
                        } catch (e) { console.log('Error parsing astronomicInfo:', e); }

                        try {
                          const basicInfo = JSON.parse(detail.basicInfo || '{}');
                          viewedPlace = basicInfo.place_of_birth || '';
                        } catch (e) { console.log('Error parsing basicInfo:', e); }
                      }

                      const viewedProfileData = {
                        name: `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim(),
                        gender: userDetails?.gender || '',
                        dob: viewedDob,
                        star: viewedStar,
                        rasi: viewedRasi,
                        place: viewedPlace,
                      };

                      router.push({
                        pathname: '/(root)/screens/StarMatch',
                        params: {
                          viewedProfile: JSON.stringify(viewedProfileData),
                          viewedUserId: userId as string,
                        }
                      });
                    }}
                  >
                    <LinearGradient
                      colors={['#6c5ce7', '#a29bfe']}
                      style={styles.starMatchButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <MaterialIcons name="stars" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Check Star Match</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <View style={styles.buttonRow}>
                  {/* Interest Button */}
                  <TouchableOpacity
                    style={[
                      styles.sendInterestButton,
                      interestStatus === 'APPROVED' ? styles.sentButton : styles.activeButton
                    ]}
                    onPress={handleSendInterest}
                  >
                    {(() => {
                      switch (interestStatus) {
                        case 'PENDING':
                          return (
                            <MaterialIcons name="access-time" size={16} color="#fff" />
                          );
                        case 'APPROVED':
                          return (
                            <MaterialIcons name="check-circle" size={16} color="#fff" />
                          );
                        default:
                          return (
                            <Heart size={16} color="#fff" fill={interestStatus === 'APPROVED' ? '#fff' : 'none'} />
                          );
                      }
                    })()}
                    <Text style={[styles.buttonText, { color: '#DADADA' }]}>
                      {(() => {
                        switch (interestStatus) {
                          case 'PENDING':
                            return isSender ? 'Request Pending' : 'Accept the Request';
                          case 'APPROVED':
                            return 'Request Accepted';
                          default:
                            return 'Send Request';
                        }
                      })()}
                    </Text>
                  </TouchableOpacity>
                </View>


              </View>


            </View>
          </View>
          {personalDetail && (
            <View style={{ flex: 1, marginTop: 0, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 }}>
              <ProfileDetailTab
                personalDetail={personalDetail}
                isPremium={isPremiumValue}
                onImagePress={openImageModal}
                hiddenFields={hiddenFeildsValue}
                profileDetailId={userDetailId}
              />
            </View>
          )}
          {/* Action Buttons */}

        </View>



        {/* </ScrollView> */}
      </SafeAreaView>
    </NativeBaseProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,64,175,1.00)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  closeButton: {
    position: 'absolute',
    top: 80,
    right: 10,
    zIndex: 2,
  },

  name: {
    fontSize: 18
  },
  scrollViewContent: {
    flexGrow: 1,
    //   paddingBottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  card: {
    width: 175,
    height: 230, // Make sure this is set explicitly
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor: '',
    borderRadius: 16,
    padding: 10,
  },
  leftColumn: {
    width: 180,
    marginRight: 10,
  },

  // rightColumn: {
  //     flex: 1,
  //     justifyContent: 'space-around',
  // },

  detailText: {
    fontSize: 15,
    color: '#F5F5F5',
    marginBottom: 20,
    fontWeight: 'bold'

  },
  leftText: {
    color: '#DADADA',
    fontWeight: '500',
    textAlign: 'left',
    // fontSize: 16,
  },
  age: {
    fontSize: 14,
  },
  location: {
    fontSize: 14,
  },
  rightColumn: {
    flex: 1,
    // paddingHorizontal: 8,
    // marginTop: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardright: {
    // backgroundColor: 'rgba(255,255,255,0.7)',
    // borderRadius: 12,
    // padding: 7,
    backdropFilter: 'blur(4px)', // Use `expo-blur` or just skip
    width: '100%',
    marginBottom: 10,
  },
  cardFull: {
    width: '100%',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTextBlock: {
    flexShrink: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: '#059669',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DADADA',
  },
  buttonRow: {
    flexDirection: 'column',
    // marginBottom: 12,
  },

  sendInterestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#10B981', // green
  },

  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // sendInterestButton: {
  //   flex: 1,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   paddingVertical: 10,
  //   paddingHorizontal: 12,
  //   borderRadius: 14,
  // },
  activeButton: {
    backgroundColor: 'gray', // Indigo-600
  },
  sentButton: {
    backgroundColor: '#10B981', // Green-500
  },
  iconOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    // gap: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    display: 'flex',
    width: '90%'
  },

  iconButton: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 20,
  },
  restrictedOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  restrictedText: {
    color: '#DADADA',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  permissionButton: {
    backgroundColor: 'gray',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#DADADA',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // imageStyle: {
  //   width: 150,
  //   height: 150,
  //   borderRadius: 10,
  // },
  starMatchButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  starMatchButtonGradient: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starMatchButtonText: {
    color: '#DADADA',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  }
});

export default ProfileDetail