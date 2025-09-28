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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';




const ProfileDetail = () => {
  const { userId } = useLocalSearchParams();
  const [userDetailId, setUserDetailId] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [permissionRequests, setPermissionRequests] = useState<{ [key: string]: boolean }>({ profileImage: false });
  const [personalDetail, setPersonalDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSender, setIsSender] = useState(false);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isPremiumValue, setIsPremiumValue] = useState(false);
  const [hiddenFeildsValue, setHiddenFeildsValue] = useState<any>([]);

  const [interestStatus, setInterestStatus] = useState('');

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userIdValue = await AsyncStorage.getItem('userId');
        if (userIdValue && userId) {
          // const decodedUserId = atob(userIdValue);
          userApi.checkIfShortlisted(userIdValue, userId).then((response: any) => {
            // API response has a nested structure: {data: {data: boolean}}
            const isShortlisted = response?.data?.data || false;
            setIsShortlisted(isShortlisted);
          });
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    const fetchViewedProfile = async () => {
      try {
        const userIdValue = await AsyncStorage.getItem('userId');
        if (userIdValue && userId) {
          userApi.viewedProfile(userIdValue, userId).then((response: any) => {
          });
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };
    fetchUserId();
    fetchViewedProfile();
  }, [userId]);
  

  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setCurrentUserId(storedUserId);
        }
      } catch (error) {
        console.error('Error fetching current user ID:', error);
      }
    };
    fetchCurrentUserId();
  }, []);

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
    if (currentUserId && userId) {
      const parsedUserId = Array.isArray(userId) ? userId[0] : userId;
      checkLikeStatus(currentUserId, parsedUserId);
      checkInterestStatus(currentUserId, parsedUserId);
    }
  }, [currentUserId, userId]);


  useEffect(() => {
    if (userId) {
      setUserDetailId(userId);
      console.log("userId============================>", userId);
      fetchUserDetails(userId);

    }
  }, [userId]);

  const fetchUserDetails = async (userId: any) => {
    try {
      setLoading(true);
      const hiddenFeildsResp = await userApi.getHiddenFieldsByUserId(userId);
      const hiddenFeilds = hiddenFeildsResp.data.data;
      // console.log("Hidden Feilds Data ===========>", hiddenFeilds);

      const isPremium = await AsyncStorage.getItem('isUser');
      // console.log("isPremium----------------------->", isPremium);

      setIsPremiumValue(isPremium == 'PU' ? true : false);
      
      if (hiddenFeilds?.length > 0) {
        const fieldNames = hiddenFeilds.map((item: any) => item.fieldName);
        setHiddenFeildsValue(fieldNames);
      
        // console.log("Hidden Feilds Data =valueeeeeeee==========>", hiddenFeildsValue); // log the actual value before setting state
      }
      
      

      // console.log('Fetching details for userId:', userId);
      const response = await userApi.getProfileDetailByUserId(userId);
      const rawData = response.data.data;
      setUserDetails(rawData);
      const formattedData = formatUserDetails(rawData);
      setPersonalDetail(formattedData);
      // console.log("userDetails===>", formattedData);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    // console.log("currentUserId===================================>", currentUserId);
    // console.log("userId===================================>", userId);

    if (!currentUserId || !userId) return;

    const parsedUserId = Array.isArray(userId) ? userId[0] : userId;

    if (hasLiked) {
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
                setHasLiked(false);
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
        setHasLiked(true);
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

      // Allow sending request if status is NONE, empty string, or null
      if (interestStatus === 'NONE' || interestStatus === '' || interestStatus === null) {
        await userApi.sendInterestRequest(currentUserId, parsedUserId);
        setInterestStatus('PENDING');
        setIsSender(true);
        console.log("isSender=========1==========================>", isSender);
        console.log('New interest request sent successfully');
      } else if (interestStatus === 'REJECTED') {
        console.log('Cannot send request - request was previously rejected');
      } else if (interestStatus === 'PENDING') {
        console.log('Cannot send request - request is already pending');
      } else if (interestStatus === 'APPROVED') {
        console.log('Cannot send request - request is already approved');
      } else {
        console.log('Unknown status:', interestStatus);
      }
    } catch (error) {
      console.error('Error sending interest request:', error);
    }
  };
  const checkInterestStatus = async (senderId: string, receiverId: string) => {
    try {
      const response = await userApi.checkInterestStatus(senderId, receiverId);
      const status = response.data?.data || {};
      console.log("🔵 Interest Status Response:", response.data);

      // Decode the senderId and compare with reqReceivedBy
      const decodedSenderId = atob(senderId);
      console.log("🔵 Decoded Sender ID:", decodedSenderId);

      // Handle case where status is null or undefined
      const isCurrentSender = status?.reqSendedBy ? 
        parseInt(decodedSenderId) === parseInt(status.reqSendedBy) : 
        false;

      console.log("🔵 Is Current Sender:", isCurrentSender);
      
      // Store the sender/receiver status
      setIsSender(isCurrentSender); 

      // Handle case where status is null or undefined
      const statusValue = status?.status || 'NONE';
      setInterestStatus(statusValue);

      // Update UI based on status
      if (statusValue === 'PENDING') {
        console.log('Interest request is pending');
      } else if (status.status === 'APPROVED') {
        console.log('Interest request accepted');
      } else if (status.status === 'REJECTED') {
        console.log('Interest request rejected');
      }
    } catch (error) {
      console.error('Error checking interest status:', error);
      setInterestStatus('');
    }
  };
  const checkLikeStatus = async (likedBy: any, likedTo: any) => {
    try {
      const response = await userApi.checkIfLiked(likedBy, likedTo);
      console.log("🔵 API Response:", response.data);

      const result = response.data.data;

      // Set hasLiked = true only if result is true; otherwise false
      setHasLiked(result === true);
      console.log("✅ Has Liked Before:", result === true);

    } catch (error) {
      console.error('Error checking like status:', error);
      setHasLiked(false); // fallback to false if any error occurs
    }
  };

  // Add removeUserLike to userApi
  // userApi.deleteLike()

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
        <View style={{height: '100%',width:'100%'}}>
          <View style={{ paddingHorizontal: 0 }}>
            <View style={styles.rowContainer}>
              {/* Left Column - Image */}
              <View style={styles.leftColumn}>
                <View style={styles.card}>
                  {hiddenFeildsValue.includes('profileImage') ? (
                    <ImageBackground
                      source={{ uri: userDetails?.profileImage }}
                      style={[styles.image]}
                      imageStyle={{ borderRadius: 10 }}
                    >
                      <BlurView
                        intensity={40}
                        tint="dark"
                        style={styles.restrictedOverlay}
                      >
                        <View style={{backgroundColor:'#fff',borderRadius:999,padding:5}}>

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
                          <Text style={styles.permissionButtonText}>
                            {permissionRequests.profileImage ? 'Cancel Request' : 'Ask Permission'}
                          </Text>
                        </TouchableOpacity>
                      </BlurView>
                    </ImageBackground>
                  ) : (
                    <ImageBackground
                      source={{ uri: userDetails?.profileImage }}
                      style={styles.image}
                      imageStyle={styles.imageStyle}
                    >
                    <View style={styles.iconOverlay}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={handleLike}
                      >
                        <FontAwesome
                          name={hasLiked ? "thumbs-up" : "thumbs-o-up"}
                          size={20}
                          color={hasLiked ? "red" : "gray"}
                        />
                      </TouchableOpacity>

                      {/* Expand Icon in the Center */}
                      <TouchableOpacity style={styles.iconButton} onPress={openImageModal}>
                        <Ionicons name="expand-outline" size={20} color="green" />
                      </TouchableOpacity>





                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={async () => {
                          const storedUserId = await AsyncStorage.getItem('userId');

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

                          // Check if user is premium before showing any alert
                          const userId = await AsyncStorage.getItem('userId');
                          const response = await userApi.getUserPaidStatus(userId);
                          const isPremium = response.data.data.isPremium;
                          console.log("isPremiumValue----------------------->", isPremium);
                          setIsPremiumValue(isPremium);
                          console.log("isPremiumValue----------------------->", isPremiumValue);
                          if (!isPremium) {
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
                                        encodedId,
                                        userId
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
                        color: '#FFFFFF',
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

                  {/* Height Card */}
                  <View style={styles.cardright}>
                    <View style={styles.cardRow}>
                      <Ruler size={16} color="#7C3AED" />
                      <View style={styles.cardTextBlock}>
                        <Text style={styles.cardLabel}>Height</Text>
                        <Text style={styles.cardValue}>
                          {userDetails?.userDetail?.[0]?.height}
                        </Text>
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

                  {/* Annual Income */}
                  {/* {userDetails?.userDetail?.[0]?.annualIncome && (
      <View style={[styles.cardright, styles.cardFull]}>
        <View style={styles.cardRow}>
          <DollarSign size={16} color="#059669" />
          <View style={styles.cardTextBlock}>
            <Text style={styles.cardLabel}>Annual Income</Text>
            <Text style={styles.cardValue}>
              {userDetails.userDetail[0].annualIncome}
            </Text>
          </View>
        </View>
      </View>
    )} */}


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
                    <Text style={[styles.buttonText, { color: '#fff' }]}>
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

                  {/* Chat Button */}
                  {/* <TouchableOpacity style={styles.chatButton}>
    <MessageCircle size={16} color="#4B5563" />
    <Text style={[styles.buttonText, { color: '#4B5563' }]}>Chat</Text>
  </TouchableOpacity> */}
                </View>


              </View>


            </View>
          </View>
          {personalDetail && (
          <View style={{flex: 1, marginTop: 0, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 }}>
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
    color: 'white',
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
    color: '#FFFFFF',
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
    borderRadius: 14,
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
  // chatButton: {
  //   flex: 1,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   paddingVertical: 10,
  //   paddingHorizontal: 12,
  //   backgroundColor: '#fff',
  //   borderRadius: 14,
  //   borderWidth: 1,
  //   borderColor: '#E5E7EB',
  // },
  // buttonText: {
  //   fontSize: 14,
  //   fontWeight: '600',
  //   marginLeft: 6,
  //   color: '#fff',
  // },
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
  // modalOverlay: {
  //   flex: 1,
  //   backgroundColor: 'rgba(0,0,0,0.9)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },

  // fullscreenImage: {
  //   width: '100%',
  //   height: '100%',
  // },
  restrictedOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  restrictedText: {
    color: '#fff',
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
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // imageStyle: {
  //   width: 150,
  //   height: 150,
  //   borderRadius: 10,
  // },

});

export default ProfileDetail