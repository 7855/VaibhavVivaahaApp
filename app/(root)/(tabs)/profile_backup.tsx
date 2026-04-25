import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Text as TextNative, TouchableOpacity, Modal as RNModal, TextInput, KeyboardAvoidingView, Platform, Keyboard, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import IIcon from 'react-native-vector-icons/Ionicons';
import { NativeBaseProvider, Text, HStack, Avatar, Skeleton, VStack, Box } from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome';
import Tabs from '@/components/tabs';
import userApi from '@/app/(root)/api/userApi';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressRing from '../../../components/ProgressRing';
import { Crown, Award, User as UserIcon } from 'lucide-react-native';


const CACHE_DURATION_MS = 30000; // 30 seconds

const ProfileScreen = () => {
  const params = useLocalSearchParams();
  const initialTabIndex = params.tabIndex ? Number(params.tabIndex) : 0;
  const { userData, updateField } = useUserData();
  const popup = usePopup();
  const { subscriptionData } = useSubscription() || {};

  const [userDetails, setUserDetails] = useState<any>(null);
  const [personalDetail, setPersonalDetail] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<any>(null);
  const [finalData, setFinalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedAbout, setEditedAbout] = useState('');
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    (async () => {
      const role = await AsyncStorage.getItem('userRole');
      setIsParent(role === 'PARENT');
    })();
  }, []);
  const [image, setImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const handleUpdateAbout = async () => {
    try {
      Keyboard.dismiss();
      const wordCount = editedAbout.trim().split(/\s+/).length;

      if (wordCount < 18 || wordCount > 23) {
        popup.warning(
          'Validation Error',
          'Please write between 18 to 23 words about yourself.'
        );
        return;
      }

      if (!userData.userId || !userData.decodedUserId) return;
      const userIdNumber = Number(userData.decodedUserId);
      const response = await userApi.updateAboutByUserId({
        userId: userIdNumber,
        about: editedAbout
      });

      if (response.status === 200 && response.data.status === 'SUCCESS') {
        popup.success('Updated', 'Your about information has been updated successfully.', async () => {
          await refreshProfile();
          setIsEditModalVisible(false);
        });
      } else {
        popup.error('Error', 'Something went wrong. Please try again later.');
      }
    } catch (error) {
      console.error('Error updating about:', error);
    }
  };

  const formatUserDetails = (data: any) => {
    if (!data || !data.userDetail || data.userDetail.length === 0) return [];

    const detail = data.userDetail[0];

    // Parse nested JSON fields
    const basicInfo = JSON.parse(detail.basicInfo || '{}');
    const astronomicInfoArray = JSON.parse(detail.astronomicInfo || '[]');
    const familyInfoArray = JSON.parse(detail.familyInfo || '[]');

    const astro = astronomicInfoArray[0] || {};
    const family = familyInfoArray[0] || {};

    const result = [
      {
        section: "PersonalDetail",
        data: {
          // Name: `${data.firstName} ${data.lastName}`,
          "First Name": data.firstName ? data.firstName : "-",
          "Last Name": data.lastName ? data.lastName : "-",
          Gender: data.gender == 'M' ? 'Male' : 'Female',
          "Date of Birth": data.dob ? data.dob : "-",
          Height: detail.height ? detail.height : "-",
          Weight: detail.weight ? detail.weight : "-",
          "Physical Status": basicInfo.physical_status ? basicInfo.physical_status : "-",
          "Marital Status": basicInfo.marital_status ? basicInfo.marital_status : "-",
          "Mother Language": basicInfo.mother_language ? basicInfo.mother_language : "Not specified",
          "Email": data.email ? data.email : "-",
        },
      },
      {
        section: "ReligiousDetail",
        data: {
          Religion: "Hindu", // Hardcoded or from another field if available
          Caste: "SC",
          Star: astro.star ? astro.star : "-",
          "Moon Sign": astro.moon_sign ? astro.moon_sign : "-",
          Dosham: astro.dosham ? astro.dosham : "-",
        },
      },
      {
        section: "EducationalDetail",
        data: {
          Education: detail.degree ? detail.degree : "-",
          Occupation: detail.occupation ? detail.occupation : "-",
          "Employing In": detail.employedAt == 'GOVT' ? 'Government' : detail.employedAt == 'PRIVATE' ? 'Private' : 'Self Employment',
          "Annual Income": detail.annualIncome ? detail.annualIncome + "" : "-",
        },
      },
      {
        section: "FamilyDetail",
        data: {
          "Family Type": family.family_type?.trim() || "-",
          "Family Status": family.family_status?.trim() || "-",
          "Fathers Name": family.father?.trim() || "-",
          "Fathers Occupation": family.father_occupation?.trim() || "-",
          "Mothers Name": family.mother?.trim() || "-",
          "Mothers Occupation": family.mother_occupation?.trim() || "-",
          "No of Siblings": family.no_of_siblings?.toString() || "-", // if exists in your API
          "No of Brothers": family.no_of_brother?.toString() || "-",  // ✅ corrected key
          "No of Sisters": family.no_of_sister?.toString() || "-",    // ✅ corrected key
          "Sister Married": family.sister_married?.trim() || "-",
          "Brother Married": family.brother_married?.trim() || "-",
        },
      },
      {
        section: "InterestsDetail",
        data: (() => {
          try {
            const hobbiesRaw = detail?.hobbies;
            const hobbies = typeof hobbiesRaw === 'string' ? JSON.parse(hobbiesRaw) : [];
            return { _hobbies: Array.isArray(hobbies) ? hobbies : [] };
          } catch { return { _hobbies: [] }; }
        })(),
      }
    ];

    return result;
  };

  // Smart caching: show stale data immediately, refresh in background if stale
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchRef.current;

      if (timeSinceLastFetch < CACHE_DURATION_MS && finalData) {
        // Data is fresh enough, skip API calls
        return;
      }

      // If we have cached data, don't show loading spinner
      if (finalData) {
        refreshProfile(false);
      } else {
        refreshProfile(true);
      }
    }, [userData.userId])
  );

  const refreshProfile = React.useCallback(async (showLoading = true) => {
    if (!userData.userId) return;

    try {
      if (showLoading) setIsLoading(true);

      const [profileRes, galleryRes] = await Promise.all([
        userApi.getProfileDetails(userData.userId),
        userApi.getUserGalleryImages(userData.userId),
      ]);

      const rawData = profileRes.data.data;
      if (rawData?.profileImage) {
        updateField('profileImage', rawData.profileImage);
      }
      setUserDetails(rawData);

      const formattedData = formatUserDetails(rawData);
      setPersonalDetail(formattedData);

      const galleryData = galleryRes.data.data;
      setGalleryImages(galleryData);

      setFinalData({
        personalDetails: formattedData || [],
        galleryImages: galleryData || [],
      });

      lastFetchRef.current = Date.now();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userData.userId]);


  const handlePickImage = async () => {
    if (isParent) {
      popup.error(
        'Not allowed',
        'Family members cannot change the profile photo. Please ask the account holder to make this change.'
      );
      return;
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        setImage(imageUri);

        if (!userData.decodedUserId) {
          console.warn('User not found in storage — skipping');
          return;
        }

        const userId = userData.decodedUserId;

        // Get file details
        const fileExtension = imageUri.split('.').pop() || 'jpg';
        const mimeType = fileExtension === 'jpg' ? 'image/jpeg' : `image/${fileExtension}`;

        // Build FormData
        const formData = new FormData();
        formData.append('file', {
          uri: imageUri,
          type: mimeType,
          name: `profile_${Date.now()}.${fileExtension}`,
        } as any);
        formData.append('userId', userId);

        // API call with loading
        setImageUploading(true);
        try {
          const response = await userApi.updateProfileImage(formData);

          if (response?.data?.code === 200) {
            const imageUrl = typeof response.data.data === 'string' ? response.data.data : response.data.data?.profileImage;
            if (imageUrl) updateField('profileImage', imageUrl);
            // Refresh profile data to update the image everywhere
            await refreshProfile(false);
            popup.success('Updated', 'Profile image updated successfully!');
          } else {
            throw new Error(response?.data?.message || 'Failed to update profile image');
          }
        } finally {
          setImageUploading(false);
        }
      }
    } catch (error: any) {
      console.error('Error in handlePickImage:', error);
      setImageUploading(false);
      popup.error('Error', error.message || 'Failed to update profile image. Please try again.');
    }
  };



  if (isLoading) {
    return (
      <NativeBaseProvider>
        <SafeAreaView edges={['right', 'left', 'top']} style={{ backgroundColor: '#420001', marginBottom: 0, paddingBottom: 0 }}>
          {/* Header skeleton - avatar, name, email, settings */}
          <HStack alignItems="center" px={3} py={2}>
            <Skeleton size={16} rounded="full" borderWidth={3} borderColor="#FDD017" />
            <VStack flex={1} ml={3} space={2}>
              <Skeleton h={4} w="50%" rounded="sm" startColor="gray.500" endColor="gray.600" />
              <Skeleton h={3} w="70%" rounded="sm" startColor="gray.500" endColor="gray.600" />
            </VStack>
            <Skeleton size={6} rounded="full" startColor="gray.500" endColor="gray.600" mr={3} />
          </HStack>

          {/* About section skeleton */}
          <Box px={5} py={4}>
            <Skeleton h={3} w="90%" rounded="sm" startColor="gray.500" endColor="gray.600" mb={2} />
            <Skeleton h={3} w="75%" rounded="sm" startColor="gray.500" endColor="gray.600" />
          </Box>

          {/* Tabs content skeleton */}
          <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopEndRadius: 30 }}>
            {/* Tab bar skeleton */}
            <HStack justifyContent="space-around" pt={4} px={4} mb={4}>
              <Skeleton h={4} w="20%" rounded="sm" />
              <Skeleton h={4} w="20%" rounded="sm" />
              <Skeleton h={4} w="20%" rounded="sm" />
            </HStack>

            {/* Tab content skeleton - detail rows */}
            <VStack px={5} space={4}>
              <Skeleton h={5} w="40%" rounded="sm" mb={2} />
              {Array.from({ length: 6 }).map((_, i) => (
                <HStack key={i} justifyContent="space-between" alignItems="center" py={2} borderBottomWidth={0.5} borderColor="gray.200">
                  <Skeleton h={3.5} w="35%" rounded="sm" />
                  <Skeleton h={3.5} w="40%" rounded="sm" />
                </HStack>
              ))}
            </VStack>
          </View>
        </SafeAreaView>
      </NativeBaseProvider>
    );
  }

  return (
    <NativeBaseProvider>
      <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#420001', marginBottom: 0, paddingBottom: 0 }} >
        <View style={{}}>
          <View className="">
            <View style={[styles.container, { borderRadius: 999, paddingStart: 12 }]}>
              {/* {userDetails?.profileImage ? (
                <Image source={{ uri: userDetails.profileImage }} style={styles.profileImage} />
              ) : (
                <Image source={require('../../../assets/images/avatar.png')} style={styles.profileImage} />
              )} */}
              <View>
                <HStack justifyContent="center" space={10}>
                  <TouchableOpacity onPress={handlePickImage} disabled={imageUploading}>
                    <View style={{ position: 'relative' }}>
                      <Avatar
                        bg=""
                        borderColor={'#FDD017'}
                        borderWidth={3}
                        size={65}
                        padding={0.5}
                        source={
                          userDetails?.profileImage
                            ? { uri: userDetails.profileImage }
                            : userData.gender === 'M'
                              ? require('../../../assets/images/avatarMen.png')
                              : userData.gender === 'F'
                                ? require('../../../assets/images/avatarWomen.png')
                                : require('../../../assets/images/defaultAvatar.png')
                        }
                      />
                      {imageUploading && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 35, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                          <ActivityIndicator size="small" color="#F6B733" />
                        </View>
                      )}
                      <Icon
                        name="camera"
                        size={10}
                        color="#9C27B0"
                        style={{
                          position: 'absolute',
                          bottom: 3,
                          right: 3,
                          backgroundColor: 'white',
                          borderRadius: 50,
                          padding: 5,
                        }}
                      />
                      {/* Tier badge on profile image — same style as home page carousel */}
                      {subscriptionData?.planTitle && subscriptionData.planTitle !== 'Free' && (
                        <View style={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 2,
                          backgroundColor:
                            subscriptionData.planTitle === 'Platinum' ? '#7c3aed' :
                            subscriptionData.planTitle === 'Gold' ? '#d4a017' :
                            subscriptionData.planTitle === 'Silver' ? '#9ca3af' :
                            subscriptionData.planTitle === 'Classic' ? '#d97706' :
                            '#3b82f6',
                          borderRadius: 8,
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                          borderWidth: 1.5,
                          borderColor: '#420001',
                        }}>
                          {subscriptionData.planTitle === 'Platinum'
                            ? <Crown size={9} color="#fff" />
                            : <Award size={9} color="#fff" />}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </HStack>
              </View>
              <TextNative style={{ flex: 1, color: 'white', marginStart: 12 }}>
                <View>
                  <TextNative style={[styles.greetingName, { color: 'white' }]}>
                    {userDetails?.firstName} {userDetails?.lastName}
                  </TextNative>
                  {/* Plan badge row — matches home page carousel badge style */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4, flexWrap: 'wrap' }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                      backgroundColor:
                        subscriptionData?.planTitle === 'Platinum' ? '#7c3aed' :
                        subscriptionData?.planTitle === 'Gold' ? '#d4a017' :
                        subscriptionData?.planTitle === 'Silver' ? '#9ca3af' :
                        subscriptionData?.planTitle === 'Classic' ? '#d97706' :
                        subscriptionData?.planTitle === 'Starter' ? '#3b82f6' :
                        '#6b7280',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 10,
                    }}>
                      {subscriptionData?.planTitle === 'Platinum'
                        ? <Crown size={10} color="#fff" />
                        : subscriptionData?.planTitle === 'Free'
                        ? <UserIcon size={10} color="#fff" />
                        : <Award size={10} color="#fff" />}
                      <TextNative style={{ fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>
                        {(!subscriptionData?.planTitle || subscriptionData.planTitle === 'Free') ? 'FREE MEMBER' : subscriptionData.planTitle.toUpperCase()}
                      </TextNative>
                    </View>
                    {(!subscriptionData?.planTitle || subscriptionData.planTitle === 'Free') ? (
                      <TouchableOpacity
                        onPress={() => router.push('/(root)/screens/PremiumTab' as any)}
                        style={{ backgroundColor: 'rgba(246,183,51,0.25)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(246,183,51,0.5)', marginLeft: 4 }}
                      >
                        <TextNative style={{ fontSize: 8, fontWeight: '700', color: '#F6B733', letterSpacing: 0.3 }}>Upgrade Plan</TextNative>
                      </TouchableOpacity>
                    ) : subscriptionData?.endDate ? (
                      <>
                        <TextNative style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginHorizontal: 4 }}>•</TextNative>
                        <TextNative style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
                          Until {new Date(subscriptionData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </TextNative>
                      </>
                    ) : null}
                  </View>
                </View>
              </TextNative>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: '/screens/settingsPage',
                  });
                }}
              >
                <IIcon name='settings-sharp' color={'#fff'} size={25} style={{ marginRight: 15 }}></IIcon>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats + Boost Card — replaces About section */}
        <ProfileStatsBoostCard
          userId={userData.userId}
          planTitle={subscriptionData?.planTitle}
          planEndDate={subscriptionData?.endDate}
          userDetails={userDetails}
        />

        <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopEndRadius: 30 }}>

          <Tabs
            personalDetail={finalData}
            refreshProfile={refreshProfile}
            initialTabIndex={initialTabIndex}
            userId={userData.userId}
          />
        </View>
      </SafeAreaView>
    </NativeBaseProvider>
  );
};

// ─────────────────────────────────────────────────
// Stats + Boost Card — replaces the old About section
// ─────────────────────────────────────────────────
const ProfileStatsBoostCard: React.FC<{
  userId?: string;
  planTitle?: string;
  planEndDate?: string;
  userDetails?: any;
}> = ({ userId, planTitle, planEndDate, userDetails }) => {
  const popup = usePopup();
  const [stats, setStats] = useState<any>(null);
  const [boostData, setBoostData] = useState<any>(null);
  const [profileScore, setProfileScore] = useState<number>(0);
  const [boostLoading, setBoostLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Trust score from verification flags
  const trustCount = [
    true, // email always verified
    userDetails?.idVerified === true,
    userDetails?.educationVerified === true,
    userDetails?.incomeVerified === true,
  ].filter(Boolean).length;
  const trustPercent = Math.round((trustCount / 4) * 100);

  // Request quota
  const [requestQuota, setRequestQuota] = useState<any>(null);

  // Plan display
  const planLabel = planTitle && planTitle !== 'Free' ? planTitle : 'Free';
  const planEndFormatted = planEndDate
    ? new Date(planEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
    : planTitle === 'Free' ? 'Lifetime' : '';
  const PLAN_TIERS = ['Free', 'Starter', 'Classic', 'Silver', 'Gold', 'Platinum'];
  const currentIdx = PLAN_TIERS.indexOf(planLabel);
  const nextTier = currentIdx < PLAN_TIERS.length - 1 ? PLAN_TIERS[currentIdx + 1] : null;

  const fetchCardData = React.useCallback(() => {
    if (!userId) return;
    Promise.allSettled([
      userApi.userConnectionCount(userId),
      userApi.getBoostStatus(userId),
      userApi.getRequestQuota(userId),
    ]).then(([statsRes, boostRes, quotaRes]) => {
      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.code === 200) {
        setStats(statsRes.value.data.data);
      }
      if (boostRes.status === 'fulfilled' && boostRes.value?.data?.code === 200) {
        setBoostData(boostRes.value.data.data);
      }
      if (quotaRes.status === 'fulfilled' && quotaRes.value?.data?.code === 200) {
        setRequestQuota(quotaRes.value.data.data);
      }
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    // Fetch profile score — exact same pattern as home page (index.tsx line 248)
    userApi.getProfileCompletion(userId).then((response: any) => {
      const pct = response.data?.data?.data?.completion?.percentage
        ?? response.data?.data?.data?.percentage
        ?? response.data?.data?.percentage
        ?? 0;
      setProfileScore(pct);
    }).catch(() => {});
  }, [userId]);

  // Re-fetch card data on every focus (boost status, stats, quota)
  useFocusEffect(
    React.useCallback(() => {
      fetchCardData();
    }, [fetchCardData])
  );

  // Countdown timer for active boost
  useEffect(() => {
    if (!boostData?.isBoostActive || !boostData?.expiresAt) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(boostData.expiresAt).getTime();
      const diff = expires - now;
      if (diff <= 0) {
        setCountdown('');
        setBoostData((prev: any) => prev ? { ...prev, isBoostActive: false, expiresAt: null } : prev);
        clearInterval(timer);
        // Re-fetch boost status from API
        if (userId) {
          userApi.getBoostStatus(userId).then((res: any) => {
            if (res.data?.code === 200) setBoostData(res.data.data);
          }).catch(() => {});
        }
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [boostData?.isBoostActive, boostData?.expiresAt]);

  const handleBoost = async () => {
    if (!userId) return;
    const credits = boostData?.remainingCredits || 0;
    const creditsPerMonth = boostData?.creditsPerMonth || 0;

    if (creditsPerMonth === 0 && !boostData?.canBuyAddon) {
      popup.premiumRequired(
        'Upgrade to Classic or above to boost your profile.',
        () => router.push('/(root)/screens/PremiumTab' as any)
      );
      return;
    }

    if (credits <= 0 && (creditsPerMonth > 0 || boostData?.canBuyAddon)) {
      popup.confirm(
        'No boosts remaining',
        'Buy an extra boost for ₹149? You can pay via UPI and upload the screenshot.',
        () => {
          router.push({
            pathname: '/(root)/screens/AddOnPaymentScreen',
            params: {
              featureTitle: 'Profile Boost',
              featureNote: 'BOOST_PURCHASE',
              price: '149',
              planId: '0',
              description: 'Your profile will appear at the top of search results for 24 hours.',
            },
          } as any);
        },
        'Buy Boost ₹149',
        'Wait for Reset'
      );
      return;
    }

    popup.confirm(
      '🚀 Boost Your Profile',
      `Your profile will appear at the TOP of search results for 24 hours.\n\n⏰ Best time: 7PM-10PM (most users active)\n\nYou have ${credits} boost${credits !== 1 ? 's' : ''} left this month.`,
      async () => {
        setBoostLoading(true);
        try {
          const res = await userApi.startBoost(userId, 'MONTHLY_CREDIT');
          if (res.data.code === 200) {
            popup.success('Profile Boosted! 🚀', 'Your profile is now at the top of search results for 24 hours.');
            setBoostData((prev: any) => ({
              ...prev,
              isBoostActive: true,
              expiresAt: res.data.data.expiresAt,
              remainingCredits: res.data.data.remainingCredits,
            }));
          } else if (res.data.code === 409) {
            popup.info('Already Boosted', 'Your profile boost is still active.');
          } else {
            popup.error('Boost failed', res.data.message || 'Please try again.');
          }
        } catch (e: any) {
          popup.error('Boost failed', e?.response?.data?.message || 'Network error.');
        } finally {
          setBoostLoading(false);
        }
      },
      'Boost Now',
      'Cancel'
    );
  };

  const isGoldPlus = planTitle === 'Gold' || planTitle === 'Platinum';
  const canBoost = boostData?.creditsPerMonth > 0 || boostData?.canBuyAddon;

  // Accent color per tier — gold is king
  const planAccent = planLabel === 'Gold' || planLabel === 'Platinum' ? '#F6B733' : '#D4A574';

  return (
    <View style={sbc.outerWrap}>
      {/* Maroon-native background — blends with page */}
      <LinearGradient
        colors={['rgba(66,0,1,0.95)', 'rgba(30,0,0,0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={sbc.container}
      >
        {/* Plan row moved to header — card starts with metrics */}

        {/* Row 2 — Three metrics */}
        <View style={sbc.metricsRow}>
          {/* Profile Score */}
          <View style={sbc.metricItem}>
            <View style={sbc.ringWrap}>
              <ProgressRing size={50} strokeWidth={4} percentage={profileScore} color="#F6B733" bgColor="rgba(246,183,51,0.12)" />
              <TextNative style={[sbc.ringLabel, { color: '#F6B733' }]}>{profileScore}%</TextNative>
            </View>
            <TextNative style={sbc.metricTitle}>Profile</TextNative>
          </View>

          {/* Vertical thin divider */}
          <View style={sbc.vertDivider} />

          {/* Trust Score — tap to open Trust & Verification */}
          <TouchableOpacity
            style={sbc.metricItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(root)/screens/TrustVerificationScreen' as any)}
          >
            <View style={sbc.ringWrap}>
              <ProgressRing size={50} strokeWidth={4} percentage={trustPercent} color="#D4A574" bgColor="rgba(212,165,116,0.12)" />
              <TextNative style={[sbc.ringLabel, { color: '#D4A574' }]}>{trustCount}/4</TextNative>
            </View>
            <TextNative style={sbc.metricTitle}>Trust</TextNative>
          </TouchableOpacity>

          {/* Vertical thin divider */}
          <View style={sbc.vertDivider} />

          {/* Requests Remaining */}
          <View style={sbc.metricItem}>
            <View style={sbc.reachCircle}>
              <TextNative style={sbc.reachNum}>
                {requestQuota?.unlimited ? '∞' : (requestQuota?.remaining ?? '—')}
              </TextNative>
            </View>
            <TextNative style={sbc.metricTitle}>Requests</TextNative>
          </View>

          {/* Vertical thin divider */}
          <View style={sbc.vertDivider} />

          {/* Shortlisted By — tap to see list (Gold+ gated) */}
          <TouchableOpacity
            style={sbc.metricItem}
            activeOpacity={0.7}
            onPress={() => {
              const isGold = planTitle === 'Gold' || planTitle === 'Platinum';
              if (isGold) {
                router.push({ pathname: '/(root)/screens/ListUser', params: { type: 'whoShortlistedMe', title: 'Who Shortlisted You' } } as any);
              } else {
                popup.premiumRequired(
                  'Upgrade to Gold to see who shortlisted your profile.',
                  () => router.push('/(root)/screens/PremiumTab' as any)
                );
              }
            }}
          >
            <View style={[sbc.reachCircle, { borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.05)' }]}>
              <TextNative style={[sbc.reachNum, { color: '#ef4444' }]}>{stats?.Shortlisted || 0}</TextNative>
            </View>
            <TextNative style={sbc.metricTitle}>Saved You</TextNative>
          </TouchableOpacity>
        </View>

        {/* Row 3 — Boost bar */}
        {boostData?.isBoostActive ? (
          <LinearGradient
            colors={['rgba(246,183,51,0.15)', 'rgba(246,183,51,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={sbc.boostBar}
          >
            <View style={sbc.boostBarLeft}>
              <Ionicons name="flash" size={14} color="#F6B733" />
              <TextNative style={[sbc.boostBarText, { color: '#F6B733' }]}>BOOST ACTIVE</TextNative>
            </View>
            <TextNative style={sbc.boostBarTimer}>{countdown}</TextNative>
          </LinearGradient>
        ) : (
          <TouchableOpacity onPress={handleBoost} disabled={boostLoading} activeOpacity={0.8}>
            <LinearGradient
              colors={canBoost ? ['rgba(246,183,51,0.12)', 'rgba(246,183,51,0.04)'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={sbc.boostBar}
            >
              <View style={sbc.boostBarLeft}>
                <Ionicons name="flash" size={14} color={canBoost ? '#F6B733' : '#9ca3af'} />
                <TextNative style={[sbc.boostBarText, { color: canBoost ? '#F6B733' : '#9ca3af' }]}>
                  {boostLoading ? 'Boosting...' : 'Boost Profile'}
                </TextNative>
              </View>
              <View style={sbc.boostBarRight}>
                <TextNative style={sbc.boostBarCredits}>
                  {isGoldPlus
                    ? (boostData?.remainingCredits > 0 ? `${boostData.remainingCredits} left` : 'Buy Boost')
                    : boostData?.canBuyAddon
                    ? 'Boost Now'
                    : 'Upgrade'}
                </TextNative>
                <Ionicons name="chevron-forward" size={11} color="rgba(246,183,51,0.4)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

const sbc = StyleSheet.create({
  outerWrap: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  container: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(246,183,51,0.15)',
  },
  // Row 1 — Plan
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  planTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  planDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  planExpiry: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  upgradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(246,183,51,0.3)',
  },
  upgradeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F6B733',
    letterSpacing: 0.3,
  },
  // Gold line
  goldLine: {
    height: 0.5,
    backgroundColor: 'rgba(246,183,51,0.2)',
    marginBottom: 12,
  },
  // Row 2 — Metrics
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  ringWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '900',
  },
  metricTitle: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  vertDivider: {
    width: 0.5,
    height: 30,
    backgroundColor: 'rgba(246,183,51,0.15)',
  },
  reachCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(246,183,51,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246,183,51,0.05)',
  },
  reachNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F6B733',
  },
  // Row 3 — Boost bar
  boostBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  boostBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boostBarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  boostBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boostBarCredits: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  boostBarTimer: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F6B733',
    fontVariant: ['tabular-nums'],
  },
  // Legacy — keep for boost active/button styles referenced elsewhere
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  statLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
  },
  boostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 10,
  },
  boostButtonIcon: {
    fontSize: 22,
  },
  boostButtonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  boostButtonSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  boostActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
  },
  boostActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  boostActiveIcon: {
    fontSize: 28,
  },
  boostActiveTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  boostActiveTimer: {
    fontSize: 11,
    color: '#6ee7b7',
    fontWeight: '600',
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 12,
    fontWeight: '300',
    fontStyle: 'italic'
  },
  greetingName: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 25,
    marginRight: 10,
  },
  settingIcon: {
    color: '#fff',
    backgroundColor: '#fff'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic'
  },
  textInput: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    padding: 7,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#130057',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextCancel: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  }
});

export default ProfileScreen;
