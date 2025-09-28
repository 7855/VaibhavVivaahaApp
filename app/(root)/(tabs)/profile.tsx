import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text as TextNative, TouchableOpacity, Modal as RNModal, TextInput, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import icons from '@/constants/icons';
import IIcon from 'react-native-vector-icons/Ionicons';
import { NativeBaseProvider, Text, HStack, Avatar } from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome';
import Tabs from '@/components/tabs';
import userApi from '@/app/(root)/api/userApi';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialDesignIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';


const ProfileScreen = () => {

  
  const [userDetails, setUserDetails] = useState<any>(null);
  const [personalDetail, setPersonalDetail] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<any>(null);
  const [finalData, setFinalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gender, setGender] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedAbout, setEditedAbout] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const handleUpdateAbout = async () => {
    try {
      Keyboard.dismiss();
      const wordCount = editedAbout.trim().split(/\s+/).length;
      
      if (wordCount < 18 || wordCount > 23) {
        Alert.alert(
          'Validation Error',
          'Please write between 18 to 23 words about yourself.',
          [{ text: 'OK' }]
        );
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        return;
      }
      const userIdNumber = Number(atob(userId));
      const response = await userApi.updateAboutByUserId({
        userId: userIdNumber,
        about: editedAbout
      });
      
      if (response.status === 200 && response.data.status === 'SUCCESS') {
        Alert.alert('Success', 'About information updated successfully', [
          {
            text: 'OK',
            onPress: async () => {
              await refreshProfile();
              setIsEditModalVisible(false);
            }
          }
        ]);
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again later.');
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
      }
    ];

    return result;
  };

let val : any;

useFocusEffect(
  
  useCallback(() => {
    refreshProfile();
  }, [])
);

  const refreshProfile = async () => {
    try {
      setIsLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      const storedGender = await AsyncStorage.getItem('gender');
      console.log("storedGender=====================>", storedGender);
      
      setGender(storedGender);
      
      const response = await userApi.getProfileDetails(userId);
      const rawData = response.data.data;
      if(rawData){
        AsyncStorage.setItem("profileImage",rawData.profileImage)
      }
      setUserDetails(rawData);
      const formattedData = formatUserDetails(rawData);
      val = formattedData;
      setPersonalDetail(formattedData);

      // Load gender from AsyncStorage


      const galleryRes = await userApi.getUserGalleryImages(userId);
      const galleryData = galleryRes.data.data;
      setGalleryImages(galleryData);

    const mergeData = {
      personalDetails: val || [],
      galleryImages: galleryData || [],
    };
    setFinalData(mergeData);
  } catch (error) {
    console.error("Refresh error:", error);
  } finally {
    setIsLoading(false);
  }
};

// useFocusEffect(
//   useCallback(() => {
//     const fetchUserDetail = async () => {
//       try {
//         setIsLoading(true);
//         const response = await userApi.getProfileDetails(1);
//         const rawData = response.data.data;
//         setUserDetails(rawData);
//         const formattedData = formatUserDetails(rawData);
//         val = formattedData;
//         setPersonalDetail(formattedData);
//         await fetchGalleryImages(); // Ensure this waits before moving on
//       } catch (error: any) {
//         console.error('API call error:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     const fetchGalleryImages = async () => {
//       try {
//         const response = await userApi.getUserGalleryImages(1);
//         const rawData = response.data.data;
//         setGalleryImages(rawData);

//         const mergeData = {
//           personalDetails: val || [],
//           galleryImages: rawData || [],
//         };
//         console.log("mergeData=======================>", mergeData);
//         setFinalData(mergeData);
//       } catch (error: any) {
//         console.error('API call error:', error);
//       }
//     };

//     fetchUserDetail();
//   }, [])
// );
// handlePickImage
const handlePickImage = async () => {
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

      const userIdEncoded = await AsyncStorage.getItem('userId');
      if (!userIdEncoded) {
        Alert.alert('Error', 'User not found. Please login again.');
        return;
      }

      const userId = atob(userIdEncoded);
      console.log("Decoded userId:", userId);

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

      console.log('Sending FormData:', {
        uri: imageUri,
        type: mimeType,
        name: `profile_${Date.now()}.${fileExtension}`,
        userId,
      });

      // API call
      const response = await userApi.updateProfileImage(formData);

      console.log("Response from server:", response);

      if (response?.data?.code === 200) {
        Alert.alert('Success', 'Profile image updated successfully!');
        AsyncStorage.setItem('profileImage', response.data.data.profileImage);
      } else {
        throw new Error(response?.data?.message || 'Failed to update profile image');
      }
    }
  } catch (error: any) {
    console.error('Error in handlePickImage:', error);
    Alert.alert('Error', error.message || 'Failed to update profile image. Please try again.');
  }
};



  return (
    <NativeBaseProvider>
      <SafeAreaView edges={['right', 'left', 'top']} style={{ backgroundColor: '#130057', marginBottom: 0, paddingBottom: 0 }} >
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
                  <TouchableOpacity onPress={handlePickImage}>
                    <View style={{ position: 'relative' }}>
                      <Avatar
                        bg=""
                        borderColor={'#9C27B0'}
                        borderWidth={3}
                        size={65}
                        padding={0.5}
                        source={
                          userDetails?.profileImage
                            ? { uri: userDetails.profileImage }
                            : gender === 'M'
                              ? require('../../../assets/images/avatarMen.png')
                              : gender === 'F'
                                ? require('../../../assets/images/avatarWomen.png')
                                : require('../../../assets/images/defaultAvatar.png')
                        }
                      />
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
                    </View>
                  </TouchableOpacity>
                </HStack>
              </View> 
              <TextNative style={{ flex: 1, color: 'white', marginStart: 12 }}>
                <View>
                  <TextNative style={[styles.greetingName, { color: 'white' }]}>
                    {userDetails?.firstName} {userDetails?.lastName}
                  </TextNative>
                  <TextNative style={[styles.greeting, { color: 'white', marginTop: 4 }]}>
                    {userDetails?.email}
                  </TextNative>
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

        <View style={{
          padding: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <Text color={"#fff"} style={{ fontStyle: 'italic',width:'93%' }}>{userDetails?.userDetail?.[0]?.about}</Text>
          <TouchableOpacity style={{backgroundColor: '#fff', padding: 5, borderRadius: 999}} onPress={() => {
            setEditedAbout(userDetails?.userDetail?.[0]?.about || '');
            setIsEditModalVisible(true);
          }}>
            <MaterialDesignIcons name="circle-edit-outline" size={24} color="#000" />
          </TouchableOpacity>

          {/* Edit Modal */}
          <RNModal
            animationType="slide"
            transparent={true}
            visible={isEditModalVisible}
            onRequestClose={() => setIsEditModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Write about yourself...</Text>
                  {/* <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                    <IIcon name="close" size={24} color="#000" />
                  </TouchableOpacity> */}
                </View>
                <TextInput
                  defaultValue={editedAbout}
                  onChangeText={setEditedAbout}
                  placeholder="Write about yourself..."
                  multiline={true}
                  numberOfLines={6}
                  style={styles.textInput}
                />
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setIsEditModalVisible(false)}
                  >
                    <Text style={styles.buttonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleUpdateAbout}
                  >
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </RNModal>
        </View>

        <View  style={{height:'100%', backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopEndRadius: 30 }}>

          <Tabs personalDetail={finalData} refreshProfile={refreshProfile} />
        </View>
      </SafeAreaView>
    </NativeBaseProvider>
  );
};

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
