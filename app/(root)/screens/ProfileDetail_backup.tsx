import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ImageBackground, useWindowDimensions, Modal, TouchableWithoutFeedback, ActivityIndicator, FlatList, Dimensions, Linking } from 'react-native'
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react'
import { Box, Button, Center, Divider, FormControl, HStack, Input, NativeBaseProvider, Stack, Text as TextBase } from 'native-base';
import { router, useLocalSearchParams } from 'expo-router';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import ProfileDetailTab from '@/components/ProfileDetailTab';
import VerifiedBadges, { VerifiedCollapsibleBlock } from '@/components/VerifiedBadges';
import InterestChipGrid from '@/components/InterestChipGrid';
import FeatherIcon from '@expo/vector-icons/Feather'

import userApi from '@/app/(root)/api/userApi';
import { Calendar, Heart, MapPin } from 'lucide-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';




const ProfileDetail = () => {
  const { userData } = useUserData();
  const popup = usePopup();
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
  // currentUserId derived directly at line 76 — no state needed
  const [isPremiumValue, setIsPremiumValue] = useState(false);
  const [hiddenFeildsValue, setHiddenFeildsValue] = useState<any>([]);
  const [subscriptionId, setSubscriptionId] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [interestStatus, setInterestStatus] = useState('NONE');
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    (async () => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const role = await AsyncStorage.getItem('userRole');
      setIsParent(role === 'PARENT');
    })();
  }, []);

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


  // Derive currentUserId directly — no state/effect waterfall needed
  const currentUserId = userData?.userId || null;

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
    // Photo view gate: Free plan users cannot access the full gallery
    const planTitle = subscriptionData?.planTitle;
    if (!planTitle || planTitle === 'Free') {
      popup.premiumRequired(
        'Upgrade to Starter or above to view all profile photos.',
        () => router.push('/(root)/screens/PremiumTab' as any)
      );
      return;
    }

    try {
      const encodeId = btoa(userDetailId);
      const res = await userApi.getUserGalleryImages(encodeId);
      if (res?.data?.data?.length > 0) {
        const imageUrls = res.data.data.map((img: any) => img.userImage);
        setGalleryImages(imageUrls);
      } else if (userDetails?.profileImage) {
        setGalleryImages([userDetails.profileImage]);
      }
      setImageModalVisible(true);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      setGalleryImages([userDetails?.profileImage]);
    }
  };


  const formatUserDetails = (data: any) => {

    if (!data || !data.userDetail || data.userDetail.length === 0) return [];

    const detail = data.userDetail[0];
    console.log("detail==>", detail);


    // Parse nested JSON fields
    const basicInfo = JSON.parse(detail.basicInfo || '{}');
    const astronomicInfoArray = JSON.parse(detail.astronomicInfo || '[]');
    // familyInfo may be stored as object OR array depending on how it was saved
    const familyInfoRaw = JSON.parse(detail.familyInfo || '{}');
    const astro = astronomicInfoArray[0] || {};
    const family = Array.isArray(familyInfoRaw) ? (familyInfoRaw[0] || {}) : (familyInfoRaw || {});

    // Check if current user has already liked this profile

    const result = [
      {
        section: "PersonalDetail",
        data: {
          Name: `${data.firstName} ${data.lastName}`,
          Gender: data.gender == 'M' ? 'Male' : 'Female',
          Occupation: detail.occupation,
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
          "Employing In": detail.employedAt,
          "Annual Income": detail.annualIncome + "",
        },
      },
      {
        section: "FamilyDetail",
        data: {
          "Family Type": family.family_type || family.familyType || "-",
          "Family Status": family.family_status || "-",
          "Fathers Name": family.father || "-",
          "Fathers Occupation": family.father_occupation || "-",
          "Mothers Name": family.mother || "-",
          "Mothers Occupation": family.mother_occupation || "-",
          "Number of Siblings": (() => {
            const sisters = parseInt(family.no_of_sister) || 0;
            const brothers = parseInt(family.no_of_brother) || 0;
            const total = sisters + brothers;
            return total > 0 ? String(total) : "-";
          })(),
          "Brothers": (() => {
            const brothers = parseInt(family.no_of_brother) || 0;
            return brothers > 0 ? String(brothers) : "-";
          })(),
          "Brothers Married": (() => {
            const brothersMarried = parseInt(family.brother_married) || 0;
            const brothers = parseInt(family.no_of_brother) || 0;
            if (brothers === 0) return "-";
            return `${brothersMarried} of ${brothers}`;
          })(),
          "Sisters": (() => {
            const sisters = parseInt(family.no_of_sister) || 0;
            return sisters > 0 ? String(sisters) : "-";
          })(),
          "Sisters Married": (() => {
            const sistersMarried = parseInt(family.sister_married) || 0;
            const sisters = parseInt(family.no_of_sister) || 0;
            if (sisters === 0) return "-";
            return `${sistersMarried} of ${sisters}`;
          })(),
        },
      },
      {
        section: "InterestsDetail",
        data: (() => {
          try {
            const hobbiesRaw = detail?.hobbies;
            const hobbies = typeof hobbiesRaw === 'string'
              ? JSON.parse(hobbiesRaw)
              : Array.isArray(hobbiesRaw) ? hobbiesRaw : [];
            return { _hobbies: hobbies };
          } catch { return { _hobbies: [] }; }
        })(),
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

      // Handle plan-gated responses (profile view limit, blurred, etc.)
      if (response.data?.code === 403) {
        const msg = response.data?.message;
        if (msg === 'PROFILE_VIEW_LIMIT_EXCEEDED') {
          popup.premiumRequired(
            'You\'ve reached your profile view limit. Upgrade to Classic or above for more views.',
            () => router.push('/(root)/screens/PremiumTab' as any)
          );
        } else if (msg === 'PROFILE_VIEW_BLURRED') {
          popup.premiumRequired(
            'Upgrade to Starter or above to view full profiles.',
            () => router.push('/(root)/screens/PremiumTab' as any)
          );
        } else {
          popup.premiumRequired(
            'Upgrade your plan to view this profile.',
            () => router.push('/(root)/screens/PremiumTab' as any)
          );
        }
        router.back();
        return;
      }

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

          // viewPersonalInfo can be true (Silver+), object {limit:40} (Classic), or false (Free/Starter)
          if (subscriptionData.entitlements.viewPersonalInfo) {
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
                if (subscription.data.data?.entitlements.viewPersonalInfo) {
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
      popup.confirm(
        'Revert Like',
        'Are you sure you want to revert this like?',
        async () => {
          try {
            await userApi.deleteLike(currentUserId, parsedUserId);
            setIsLiked(false);
          } catch (error) {
            console.error('Error reverting like:', error);
          }
        },
        'Yes',
        'No'
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

      try {
        const uid = userData.userId;
        const subscriptionId = subscriptionData?.subscriptionId;
        const entitlements = subscriptionData?.entitlements;

        if (!uid) return;

        const canSend = interestStatus === 'NONE' || interestStatus === '' || interestStatus === null;
        if (!canSend) return;

        // Step 1: Check quota from backend (handles all plan types)
        const quotaRes = await userApi.getRequestQuota(uid);
        const quota = quotaRes.data?.data;

        if (quota?.unlimited) {
          // Silver/Gold/Platinum — unlimited, just send
          await userApi.sendInterestRequest(currentUserId, parsedUserId);
          setInterestStatus('PENDING');
          setIsSender(true);
        } else if (quota?.remaining > 0) {
          // Has remaining quota — get subscriptionId from context or API
          let subId = subscriptionId;
          if (!subId) {
            const decodedUserId = atob(uid);
            const subRes = await userApi.getActiveUserSubscriptionByUserId(decodedUserId);
            subId = subRes.data?.data?.subscriptionId || subRes.data?.data?.id;
          }

          if (subId) {
            const decodedUserId = atob(uid);
            const updateRes = await userApi.updateSendRequestCount(decodedUserId, subId, 4);
            console.log('📩 updateSendRequestCount response:', updateRes.data);
            if (updateRes.data.code == 200) {
              await userApi.sendInterestRequest(currentUserId, parsedUserId);
              setInterestStatus('PENDING');
              setIsSender(true);
            } else {
              popup.premiumRequired(
                'You have used all your requests. Upgrade to send more.',
                () => router.push('/(root)/screens/PremiumTab')
              );
            }
          } else {
            // No subscription found at all — shouldn't happen after auto-insert fix
            await userApi.sendInterestRequest(currentUserId, parsedUserId);
            setInterestStatus('PENDING');
            setIsSender(true);
          }
        } else {
          popup.premiumRequired(
            `You have used all ${quota?.total || 0} requests. Upgrade to send more.`,
            () => router.push('/(root)/screens/PremiumTab')
          );
        }
      } catch (error) {
        console.error('Error sending interest request:', error);
        popup.error('Request Failed', 'Please try again.');
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

            {/* Swipeable images — centered */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <FlatList
                data={galleryImages?.length ? galleryImages : [userDetails?.profileImage]}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center' }}
                renderItem={({ item }) => (
                  <View style={{ width: Dimensions.get('window').width, justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                      source={{ uri: item }}
                      style={styles.fullscreenImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>


        {/* <ScrollView contentContainerStyle={styles.scrollViewContent}> */}
        <View style={{ height: '100%', width: '100%' }}>
          <View style={{ paddingHorizontal: 0 }}>
            <View style={styles.rowContainer}>
              {/* Left Column - Image */}
              <View style={styles.leftColumn}>
                <View style={[styles.card, { flex: 1 }]}>
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
                              console.warn('User ID not found in storage');
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
                                  popup.success('Cancelled', 'Permission request cancelled successfully.');
                                }).catch(error => {
                                  popup.error('Error', 'Failed to cancel permission request.');
                                });
                              } else {
                                // Send request
                                setPermissionRequests(prev => ({
                                  ...prev,
                                  profileImage: true
                                }));
                                const decodedUserId = atob(currentUserId);

                                userApi.sendRestrictedFieldRequest(decodedUserId, userId, 'PROFILE_IMAGE');
                                popup.success('Sent', 'Permission request sent successfully.');
                              }
                            } catch (error) {
                              popup.error('Error', 'Failed to process permission request.');
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
                  ) : (!subscriptionData?.planTitle || subscriptionData.planTitle === 'Free') && userDetails?.profileImage ? (
                    // Free plan: show blurred photo with upgrade CTA
                    <ImageBackground
                      source={{ uri: userDetails.profileImage }}
                      style={styles.image}
                      imageStyle={{ borderRadius: 10 }}
                    >
                      <BlurView
                        intensity={50}
                        tint="dark"
                        style={styles.restrictedOverlay}
                      >
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: 8 }}>
                          <Ionicons name="lock-closed" size={24} color="#fff" />
                        </View>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
                          Upgrade to view photos
                        </Text>
                        <TouchableOpacity
                          onPress={() => router.push('/(root)/screens/PremiumTab' as any)}
                          style={{ marginTop: 8, backgroundColor: '#F6B733', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }}
                        >
                          <Text style={{ color: '#420001', fontSize: 11, fontWeight: '700' }}>Upgrade Now</Text>
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
                      {/* Gold verified shield — top-right corner of profile image */}
                      <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                        <VerifiedBadges
                          idVerified={userDetails?.idVerified}
                          educationVerified={userDetails?.educationVerified}
                          incomeVerified={userDetails?.incomeVerified}
                          mode="compact"
                          size="md"
                          color="gold"
                        />
                      </View>
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

                            if (!subscriptionData?.entitlements?.shortlist) {
                              popup.premiumRequired(
                                'Upgrade to Starter or above to shortlist profiles.',
                                () => router.push('/(root)/screens/PremiumTab' as any)
                              );
                              return;
                            }

                            const alertTitle = isShortlisted ? 'Unshortlist Profile' : 'Shortlist Profile';
                            const alertMessage = isShortlisted
                              ? 'Do you want to remove this profile from your shortlist?'
                              : 'Do you want to add this profile to your shortlist?';

                            popup.confirm(
                              alertTitle,
                              alertMessage,
                              async () => {
                                try {
                                  if (isShortlisted) {
                                    const encodedId = btoa(decodedUserId);
                                    await userApi.deleteShortlistedProfileByUsers(encodedId, userId);
                                    popup.success('Unshortlisted', 'Profile removed from your shortlist.');
                                    setIsShortlisted(false);
                                  } else {
                                    const encodedId = btoa(decodedUserId);
                                    await userApi.insertShortlistedProfile({
                                      shortlistedBy: decodedUserId,
                                      shortlistedUserId: userId
                                    });
                                    popup.success('Shortlisted', 'Profile added to your shortlist.');
                                    setIsShortlisted(true);
                                  }
                                } catch (error) {
                                  console.error('Error in shortlist operation:', error);
                                  popup.error('Error', 'Failed to process shortlist request.');
                                }
                              }
                            );
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
                  {/* Full Name + Verification badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        fontSize: 18,
                        fontWeight: '800',
                        color: '#f1f5f9',
                        marginRight: 5,
                        letterSpacing: 0.2,
                        flexShrink: 1,
                      }}
                    >
                      {userDetails?.firstName} {userDetails?.lastName}
                    </Text>
                    {(userDetails?.subscriptionTitle === 'Silver' ||
                      userDetails?.subscriptionTitle === 'Gold' ||
                      userDetails?.subscriptionTitle === 'Platinum') ? (
                      <MaterialIcons name="verified" size={16} color="#3b82f6" />
                    ) : null}
                  </View>

                  {/* Verification block — compact by default, expands on tap */}
                  <View style={{ marginBottom: 6 }}>
                    <VerifiedCollapsibleBlock
                      idVerified={userDetails?.idVerified}
                      educationVerified={userDetails?.educationVerified}
                      incomeVerified={userDetails?.incomeVerified}
                    />
                  </View>

                  {/* CTA bar: WhatsApp share + Request Call — visible for all, premium-gated on tap */}
                  {!isParent && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => {
                        const isGoldPlus = subscriptionData?.planTitle === 'Gold' || subscriptionData?.planTitle === 'Platinum';
                        if (!isGoldPlus) {
                          popup.premiumRequired('Upgrade to Gold or above to share profiles via WhatsApp.', () => router.push('/(root)/screens/PremiumTab' as any));
                          return;
                        }
                        const name = `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim();
                        const age = userDetails?.age || '';
                        const location = userDetails?.location || '';
                        const memberId = userDetails?.memberId || '';
                        const profileLink = `https://vaibhavvivaaha.com/profile/${btoa(String(userDetails?.userId || ''))}`;
                        const text = `I found a matching profile for you on Vaibhav Vivaaha! 💍\n\n👤 ${name}\n📍 ${location} | 🎂 ${age} years\n\nView full profile:\n${profileLink}\n\nDownload Vaibhav Vivaaha app to connect!\nhttps://vaibhavvivaaha.com/download`;
                        const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
                        Linking.openURL(url).catch(() => {
                          popup.error('WhatsApp not installed', 'Install WhatsApp to share this profile.');
                        });
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#25D366' }}
                    >
                      <FontAwesome name="whatsapp" size={12} color="#fff" />
                      <Text style={{ color: '#fff', marginLeft: 4, fontSize: 10, fontWeight: '700' }}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={async () => {
                        const plan = subscriptionData?.planTitle;
                        const isPaid = plan && plan !== 'Free' && plan !== 'Starter';
                        if (!isPaid) {
                          popup.premiumRequired('Upgrade to Classic or above to request a voice call.', () => router.push('/(root)/screens/PremiumTab' as any));
                          return;
                        }
                        try {
                          if (!userData.userId) return;
                          const targetId = userId ? Number(userId) : undefined;
                          const res = await userApi.createServiceRequest(
                            userData.userId,
                            'VOICE_CALL',
                            `Voice call request for ${userDetails?.firstName || 'member'}`,
                            targetId
                          );
                          if (res.data.code === 200) {
                            popup.success('Request submitted', 'Our team will reach out to you shortly to arrange the call.');
                          } else if (res.data.code === 409) {
                            popup.info('Already requested', 'You already have a pending voice-call request for this profile.');
                          } else if (res.data.code === 403) {
                            popup.premiumRequired('Upgrade to Silver or above to request a voice call.', () => router.push('/(root)/screens/PremiumTab' as any));
                          } else {
                            popup.error('Request failed', res.data.message || 'Please try again.');
                          }
                        } catch (e: any) {
                          const code = e?.response?.data?.code;
                          if (code === 409) {
                            popup.info('Already requested', 'You already have a pending voice-call request for this profile.');
                          } else if (code === 403) {
                            popup.premiumRequired('Upgrade to Silver or above to request a voice call.', () => router.push('/(root)/screens/PremiumTab' as any));
                          } else {
                            popup.error('Request failed', 'Network error. Please try again.');
                          }
                        }
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#4F46E5' }}
                    >
                      <Ionicons name="call" size={12} color="#fff" />
                      <Text style={{ color: '#fff', marginLeft: 4, fontSize: 10, fontWeight: '700' }}>Request Call</Text>
                    </TouchableOpacity>
                  </View>
                  )}

                  {/* Location + Age as compact info chips in a row */}
                  <View style={styles.infoChipRow}>
                    <View style={styles.infoChip}>
                      <MapPin size={13} color="#059669" />
                      <Text style={styles.infoChipText} numberOfLines={1}>
                        {userDetails?.location || 'Not set'}
                      </Text>
                    </View>
                    <View style={styles.infoChipDot} />
                    <View style={styles.infoChip}>
                      <Calendar size={13} color="#4F46E5" />
                      <Text style={styles.infoChipText}>
                        {userDetails?.age} yrs
                      </Text>
                    </View>
                  </View>
                </View>
                {/* Star Match Button - Premium Only */}
                <View style={styles.cardright}>
                  <TouchableOpacity
                    style={styles.starMatchButton}
                    onPress={() => {
                      if (!isPremiumValue) {
                        popup.premiumRequired(
                          'Star Match is a premium feature. Upgrade your plan to discover horoscope compatibility.',
                          () => router.push('/(root)/screens/PremiumTab')
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
    height: Dimensions.get('window').height * 0.75,
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
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.35)',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    // marginBottom: 12,
    height: '100%'
  },
  rowContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 8,
    alignItems: 'stretch',
  },
  leftColumn: {
    width: 165,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
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
    justifyContent: 'flex-start',
  },
  infoGrid: {
    flexDirection: 'column',
  },
  cardright: {
    backdropFilter: 'blur(4px)',
    width: '100%',
    marginBottom: 10,
  },
  /** Reusable 2-line detail card (icon + label + value). Used by Location, Age,
   *  and any future right-column detail rows for consistent vertical rhythm. */
  detailCard: {
    width: '100%',
    marginBottom: 10,
  },
  /** Minimal 1-line inline detail (icon + value, no label). */
  inlineDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  inlineDetailText: {
    fontSize: 14,
    color: '#DADADA',
    fontWeight: '500',
    flexShrink: 1,
  },
  /** Compact info chip row — Location · Age side by side */
  infoChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  infoChipText: {
    fontSize: 12,
    color: '#DADADA',
    fontWeight: '600',
    flexShrink: 1,
  },
  infoChipDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#6b7280',
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
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DADADA',
    lineHeight: 18,
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
    backgroundColor: '#420001', // maroon - matches page theme
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
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  iconButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 7,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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