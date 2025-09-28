// import { Stack } from 'expo-router';
import { Box, AspectRatio, Center, Heading, Image, HStack, Stack, Text, FormControl, Input, Divider, NativeBaseProvider, FlatList, VStack, Pressable, Button } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import EditProfileModal from './editProfileModal';
import React, { useState, useEffect } from 'react';
import { Alert, Dimensions, Modal, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { ScrollView, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import userApi from '../app/(root)/api/userApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALERT_TYPE, Dialog } from 'react-native-alert-notification';
import MaterialDesignIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
const [image, setImage] = useState<string | null>(null);
import Toast from 'react-native-toast-message';

interface GalleryItem {
  galleryId: number;
  userImage: string;
}

const FirstRoute = ({ data = [], refreshProfile }: { data: any[]; refreshProfile?: () => void; }) => {
  const [editSection, setEditSection] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Error fetching userId:', error);
      }
    };
    fetchUserId();
  }, []);

  const handleEdit = (section: any) => {
    setEditSection(section);
    setIsEditModalOpen(true);
  };

  const handleClose = () => {
    setIsEditModalOpen(false);
    setEditSection(null);
  };

  const handleUpdate = async (updatedData: any) => {
    try {
      if (!userId) {
        console.error('No userId available');
        return;
      }

      // Map section title to field formatter
      const sectionMap: Record<string, (data: any) => any> = {
        PersonalDetail: (data) => ({
          userId,
          firstName: data['First Name'] || '',
          lastName: data['Last Name'] || '',
          height: data['Height'] || '',
          weight: data['Weight'] || '',
          physicalStatus: data['Physical Status'] || '',
          maritalStatus: data['Marital Status'] || '',
          motherLanguage: data['Mother Language'] || ''
        }),
        ReligiousDetail: (data) => ({
          userId,
          star: data['Star'] || '',
          moonSign: data['Moon Sign'] || '',
          dosham: data['Dosham'] || ''
        }),
        EducationalDetail: (data) => ({
          userId,
          education: data['Education'] || '',
          occupation: data['Occupation'] || '',
          employedAt: data['Employing In'] == 'Private' ? 'PRIVATE' : data['Employing In'] == 'Government' ? 'GOVT' : data['Employing In'] == 'Self Employment' ? 'SELF' : '',
          annualIncome: data['Annual Income'] || ''
        }),
        FamilyDetail: (data) => ({
          userId,
          house: data['Family Type'] || '',
          familyStatus: data['Family Status'] || '',
          fatherName: data['Fathers Name'] || '',
          fatherOccupation: data['Fathers Occupation'] || '',
          motherName: data['Mothers Name'] || '',
          motherOccupation: data['Mothers Occupation'] || '',
          noOfSiblings: data['No of Siblings'] || '',
          noOfBrothers: data['No of Brothers'] || '',
          noOfSisters: data['No of Sisters'] || '',
          noOfBrothersMarried: data['Brother Married'] || '',
          noOfSistersMarried: data['Sister Married'] || '',
        }),
      };

      // Map section title to API function
      const apiMap: Record<string, (payload: any) => Promise<any>> = {
        PersonalDetail: userApi.updateProfile,
        ReligiousDetail: userApi.updateAstroInfo,
        EducationalDetail: userApi.updateEducationInfo,
        FamilyDetail: userApi.updateFamilyInfo
      };

      const sectionKey = editSection?.title;
      const formatter = sectionMap[sectionKey];
      const apiFunction = apiMap[sectionKey];

      if (formatter && apiFunction) {
        const formattedData = formatter(updatedData);
        await apiFunction(formattedData);

     // Replace the Toast.show() with this Alert
Alert.alert(
  'Success',
  `Image updated successfully.`,
  [
    { 
      text: 'OK',
      onPress: () => console.log('OK Pressed')
    }
  ],
  { cancelable: false }
);

        refreshProfile?.();
      } else {
        console.warn('Unknown section or API mapping missing:', sectionKey);
      }

      // Update local state
      const updatedSections = data.map((section) =>
        section.title === editSection.title ? { ...section, data: updatedData } : section
      );

      // console.log('Updated data:', updatedData);
      // console.log('Edited section title:', sectionKey);
      // console.log('Updated sections:', updatedSections);

      handleClose();

    } catch (error) {
      console.error('Error updating profile:', error);

      Alert.alert(
        'Error',
        'Something went wrong while updating. Please try again.',
        [
          { 
            text: 'OK',
            onPress: () => console.log('OK Pressed')
          }
        ],
        { cancelable: false }
      );
    }
  };


  return (
    <NativeBaseProvider>
      <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 460 }}>
          <View style={{ flexGrow: 1, padding: 0, alignItems: 'center', backgroundColor: '#F5F5F5' }}>
            {data && Array.isArray(data) && data.length > 0 ? (
              data.map((section: any, idx: number) => (
                <Box key={idx} width="100%" alignItems="center" mt={idx > 0 ? 6 : 0}>
                  <Box
                    width="full"
                    rounded="lg"
                    borderWidth={0.2}
                    borderColor="#fff"
                    p={4}
                    _dark={{ borderColor: "#800000", backgroundColor: "#800000" }}
                    _light={{ backgroundColor: "#F5F5F5" }}
                    _web={{ shadow: 10, borderWidth: 2 }}
                    style={{
                      elevation: 6,
                      shadowColor: "#fff",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 2,
                      shadowRadius: 3,
                    }}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="md" fontWeight="bold" color={"black"}>{section.title}</Text>
                      <TouchableOpacity style={{ backgroundColor: '#fff', padding: 5, borderRadius: 999 }} onPress={() => handleEdit(section)}>
                                 <MaterialDesignIcons name="circle-edit-outline" size={24} color="#000" />
                      </TouchableOpacity>
                    </HStack>

                    <FormControl mt={2}>
                      <Stack space={1}>
                        {Object.entries(section.data).map(([key, value], index) => (
                          <View key={index}>
                            <Text marginBottom={2} fontWeight={500} fontSize={13}>{key}</Text>
                            <Input
                              type="text"
                              defaultValue={value}
                              borderWidth={0}
                              p={0}
                              fontWeight="bold"
                              fontSize={14}
                              color={'#800000'}
                              _dark={{ color: "white" }}
                              _light={{ color: "#800000" }}
                              _web={{
                                color: "white",
                                backgroundColor: "#F5F5F5",
                              }}
                            />
                            {index < Object.keys(section.data).length - 1 && (
                              <Divider my={2} height={'0.5px'} bg="gray.700" />
                            )}
                          </View>
                        ))}
                      </Stack>
                    </FormControl>
                  </Box>
                </Box>
              ))
            ) : (
              <Text color="white">No data available</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={handleClose}
        section={editSection}
        onUpdate={handleUpdate}
        refreshProfile={refreshProfile}
      />
    </NativeBaseProvider>
  );
};


// Define SecondRoute component

const SecondRoute = ({
  data,
  refreshProfile,
}: {
  data: GalleryItem[];
  refreshProfile?: () => void;
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Error fetching userId:', error);
      }
    };
    fetchUserId();
  }, []);

  const handleAddPhoto = async () => {
    try {
      if (!userId) {
        console.error('No userId available');
        return;
      }
  
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      if (!result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Get file details
        const fileExtension = imageUri.split('.').pop() || 'jpg';
        const mimeType = fileExtension === 'jpg' ? 'image/jpeg' : `image/${fileExtension}`;
        const fileName = `gallery_${Date.now()}.${fileExtension}`;
  
        // Build FormData
        const formData = new FormData();
        formData.append('file', {
          uri: imageUri,
          type: mimeType,
          name: fileName,
        } as any);
        const userIdConvert = atob(userId)
        formData.append('userId', userIdConvert);
        console.log('Uploading gallery image:', {
          uri: imageUri,
          type: mimeType,
          name: fileName,
          userIdConvert,
        });
  
        // Upload the image
        const response = await userApi.uploadGalleryImage(formData);
        console.log("Gallery upload response:", response);
  
        if (response && response.data) {
          if (response.data.code === 200) {
            Alert.alert('Success', 'Profile image updated successfully!');
            console.log('Gallery upload response:', response.data.data);
          } else {
            // Only throw for actual errors
            throw new Error(response.data.message || 'Failed to update profile image');
          }
        }
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong while adding photo.',
      });
    }
  };

  const handleDelete = (galleryId: number) => {
    console.log('Delete image:', galleryId);
    // implement delete API here
  };

  const handleExpand = (imageUrl: string) => {
    setExpandedImageUrl(imageUrl);
  };

  const renderItem = ({ item }: { item: GalleryItem }) => {
    const isSelected = selectedImageId === item.galleryId;

    return (
      <Pressable
        onPress={() =>
          setSelectedImageId(isSelected ? null : item.galleryId)
        }
      >
        <Box
          flex={1}
          m={2}
          borderRadius="lg"
          overflow="hidden"
          borderWidth={1}
          borderColor="coolGray.300"
          bg="white"
          shadow={4}
          position="relative"
        >
        <Image
  source={
    item.userImage
      ? { uri: item.userImage }
      : require('../assets/images/avatarMen.png')
  }
  style={{
    width: Dimensions.get('window').width / 2 - 20,
    height: 150,
  }}
  resizeMode="cover"
/>


          {isSelected && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(0,0,0,0.4)"
              justifyContent="center"
              alignItems="center"
            >
              <HStack space={8}>
                <TouchableOpacity onPress={() => handleDelete(item.galleryId)}>
                  <View style={{
                    width: 35,
                    height: 35,
                    borderRadius: 20,
                    backgroundColor: '#1e40af', // Tailwind's blue-800
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: 'white',
                  }}>
                    <Ionicons name="trash" size={18} color="white" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleExpand(item.userImage)}>
                  <View style={{
                    width: 35,
                    height: 35,
                    borderRadius: 20,
                    backgroundColor: '#1e40af', // Tailwind's blue-800
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: 'white',
                  }}>
                    <Ionicons name="expand" size={18} color="white" />
                  </View>
                </TouchableOpacity>
              </HStack>

            </Box>
          )}
        </Box>
      </Pressable>
    );
  };

  return (
    <NativeBaseProvider>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#F5F5F5',
        }}
      >
        <VStack space={1} p={1} flex={1}>
          <HStack justifyContent="flex-end" pt={3} pr={2}>
            <Pressable
              onPress={handleAddPhoto}
              borderRadius={30}
              _pressed={{ opacity: 0.5 }}
            >
              <HStack alignItems="center" space={2}>
                <Ionicons name="add-circle" size={24} color="white" />
                <Text color="white">Add Photo</Text>
              </HStack>
            </Pressable>
          </HStack>

          <FlatList
            data={data}
            numColumns={2}
            keyExtractor={(item) => item.galleryId.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              <Center flex={1} mt={40}>
                <Text color="white" fontSize="md">
                  You have not updated images
                </Text>
              </Center>
            }
          />
        </VStack>

          {/* Expanded Image Modal */}
          <Modal visible={!!expandedImageUrl} transparent={true} animationType="fade">
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1,
              backgroundColor: 'rgba(0,0,0,0.85)',
              justifyContent: 'center',
              alignItems: 'center',}}
            onPress={() => setExpandedImageUrl(null)}
          >
            <RNImage
              source={{ uri: expandedImageUrl || '' }}
              resizeMode="contain"
              style={{
                width: Dimensions.get('window').width,
                height: Dimensions.get('window').height,
                alignSelf: 'center',
              }}
            />
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </NativeBaseProvider>
  );
};
// });

const ThirdRoute = ({ data = [], refreshProfile }: { data: any[]; refreshProfile?: () => void; }) => {
  const [horoscopeImage, setHoroscopeImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAddHoroscope = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not found. Please login again.');
        return;
      }
  
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      if (!result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Get file details
        const fileExtension = imageUri.split('.').pop() || 'jpg';
        const mimeType = fileExtension === 'jpg' ? 'image/jpeg' : `image/${fileExtension}`;
        const fileName = `horoscope_${Date.now()}.${fileExtension}`;
  
        // Build FormData
        const formData = new FormData();
        formData.append('file', {
          uri: imageUri,
          type: mimeType,
          name: fileName,
        } as any);
        const userIdConvert = atob(userId);
        formData.append('userId', userIdConvert);
  
        console.log('Uploading horoscope image:', {
          uri: imageUri,
          type: mimeType,
          name: fileName,
          userId: userIdConvert,
        });
  
        // Upload the image
        const response = await userApi.uploadHoroscopeImage(formData);
        console.log("Horoscope upload response:", response);
  
        if (response && response.data) {
          if (response.data.data.code === 200 || response.data.data.code === 201) {  // Accept both 200 and 201 as success
            Alert.alert(
              'Success',
              response.data.data.message || 'Horoscope uploaded successfully!',
              [ 
                { 
                  text: 'OK',
                  onPress: () => {
                    console.log('Horoscope uploaded successfully');
                    if (refreshProfile) {
                      refreshProfile();  // Refresh the profile to show the new horoscope
                    }
                  }
                }
              ]
            );
          } else {
            throw new Error(response.data.data.message || 'Failed to upload horoscope');
          }
        }
      }
    } catch (error) {
      console.error('Error adding horoscope:', error);
      Alert.alert(
        'Error',
         'Failed to upload horoscope. Please try again.',
        [
          { 
            text: 'OK',
            onPress: () => console.log('Error acknowledged')
          }
        ]
      );
    }
  };

  const handleUpdateHoroscope = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not found. Please login again.');
        return;
      }
  
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      if (!result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Get file details
        const fileExtension = imageUri.split('.').pop() || 'jpg';
        const mimeType = fileExtension === 'jpg' ? 'image/jpeg' : `image/${fileExtension}`;
        const fileName = `horoscope_${Date.now()}.${fileExtension}`;
  
        // Build FormData
        const formData = new FormData();
        formData.append('file', {
          uri: imageUri,
          type: mimeType,
          name: fileName,
        } as any);
        const userIdConvert = atob(userId);
        formData.append('userId', userIdConvert);
  
        console.log('Uploading horoscope image:', {
          uri: imageUri,
          type: mimeType,
          name: fileName,
          userId: userIdConvert,
        });
  
        // Upload the image
        const response = await userApi.uploadHoroscopeImage(formData);
        console.log("Horoscope upload response:", response);
  
        if (response && response.data) {
          if (response.data.data.code === 200 || response.data.data.code === 201) {  // Accept both 200 and 201 as success
            Alert.alert(
              'Success',
              response.data.data.message || 'Horoscope uploaded successfully!',
              [
                { 
                  text: 'OK',
                  onPress: () => {
                    console.log('Horoscope uploaded successfully');
                    if (refreshProfile) {
                      refreshProfile();  // Refresh the profile to show the new horoscope
                    }
                  }
                }
              ]
            );
          } else {
            throw new Error(response.data.data.message || 'Failed to upload horoscope');
          }
        }
      }
    } catch (error) {
      console.error('Error adding horoscope:', error);
      Alert.alert(
        'Error', 'Failed to upload horoscope. Please try again.',
        [
          { 
            text: 'OK',
            onPress: () => console.log('Error acknowledged')
          }
        ]
      );
    }
  };

  useEffect(() => {
    const fetchHoroscopeData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;

        const response = await userApi.getProfileDetails(userId);
        // console.log("response horoscope=============>", response.data.data.userDetail);
        
        const userData = response.data.data;
        
        // Find the horoscope image from the gallery images
        const horoscopeImg = userData?.userDetail?.[0]?.horoscope;
        setHoroscopeImage(horoscopeImg || null);
      } catch (err) {
        console.error('Error fetching horoscope data:', err);
        setError('Failed to load horoscope image');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHoroscopeData();
  }, []);

  if (isLoading) {
    return (
      <NativeBaseProvider>
        <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
          <Center flex={1}>
            <Text>Loading horoscope image...</Text>
          </Center>
        </SafeAreaView>
      </NativeBaseProvider>
    );
  }

  if (error) {
    return (
      <NativeBaseProvider>
        <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
          <Center flex={1}>
            <Text color="red.500">{error}</Text>
          </Center>
        </SafeAreaView>
      </NativeBaseProvider>
    );
  }

  return (
    <NativeBaseProvider>
      <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <VStack space={1} p={1} flex={1}>
          <HStack justifyContent="flex-end" pt={3} pr={2}>
            <Pressable
              onPress={horoscopeImage ? handleUpdateHoroscope : handleAddHoroscope}
              borderRadius={30}
              _pressed={{ opacity: 0.5 }}
            >
              <HStack alignItems="center" space={2}>
                <Ionicons name="add-circle" size={24} color="white" />
                <Text color="white">{horoscopeImage ? 'Update Horoscope' : 'Add Horoscope'}</Text>
              </HStack>
            </Pressable>
          </HStack>

          <Center>
            {horoscopeImage ? (
              <Image
                source={{ uri: horoscopeImage }}
                alt="Horoscope Image"
                style={{ width: '100%', height: 400 }}
                resizeMode="contain"
              />
            ) : (
              <Text mt={40} color="white">
                No horoscope image available
              </Text>
            )}
          </Center>
        </VStack>
      </SafeAreaView>
    </NativeBaseProvider>
  );
};
const routes = [
  { key: 'first', title: 'Personal Info' },
  { key: 'second', title: 'Gallery' },
  { key: 'third', title: 'Horoscope' },
];

interface ProfileDetailTabProps {
  personalDetail: any;
  refreshProfile: () => void;
}

const Tabs = ({ personalDetail, refreshProfile }: ProfileDetailTabProps) => {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);



  // console.log("personalDetail =============>", personalDetail);
  // Log to debug
  // console.log("Received personalDetail:", personalDetail);

  // Transform the data with proper null checks
  const formdata = personalDetail?.personalDetails?.map((section: any) => ({
    title: section.section,
    data: section.data
  })) || [
      { title: 'Personal Details', data: {} },
      { title: 'Religious Details', data: {} },
      { title: 'Education Details', data: {} },
      { title: 'Family Details', data: {} }
    ];

  console.log("Transformed formdata:", formdata);

  const renderScene = SceneMap({
    first: (props: any) => <FirstRoute data={formdata} refreshProfile={refreshProfile} {...props} />,
    second: (props: any) => <SecondRoute data={personalDetail?.galleryImages || []} {...props} />,
    third: (props: any) => <ThirdRoute data={personalDetail?.galleryImages || []} {...props} />,
  });


  // const renderScene = SceneMap({
  //   first: FirstRoute,
  //   second: SecondRoute,

  // });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={props => (
        <TabBar
          {...props}
          style={{
            backgroundColor: '#800000', // Tab bar background color
            // borderBottomWidth: 2, // Bottom border
            borderBottomColor: '#FFD700', // Border color (gold)
            // borderTopWidth: 1, // Bottom border

            borderTopColor: '#420001', // Border color (gold)
            borderTopEndRadius: 30,
            borderTopStartRadius: 30,
            // color:'#420001'
            
            


          }}
          indicatorStyle={{
            backgroundColor: '#FFD700', // Active tab indicator color
            height: 2, // Thickness of indicator
          }}
          // activeColor="#420001"     
          // inactiveColor="#9CA3AF"  
          

        />
      )}
    />
  );
}



export default Tabs;

