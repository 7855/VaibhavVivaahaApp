// import { Stack } from 'expo-router';
import { Box, AspectRatio, Center, Heading, Image, HStack, Stack, Text, FormControl, Input, Divider, NativeBaseProvider, FlatList, VStack, Pressable, Button } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import EditProfileModal from './editProfileModal';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Dimensions, Modal, TouchableOpacity, View, useWindowDimensions, ActivityIndicator } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { ScrollView, Image as RNImage, Text as RNText } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import userApi from '../app/(root)/api/userApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePopup } from '../app/(root)/contexts/PopupContext';
import { ALERT_TYPE, Dialog } from 'react-native-alert-notification';
import MaterialDesignIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import InterestChipGrid from './InterestChipGrid';
import Toast from 'react-native-toast-message';

interface GalleryItem {
  galleryId: number;
  userImage: string;
}

const FirstRoute = ({ data = [], refreshProfile, userId }: { data: any[]; refreshProfile?: () => void; userId?: string | null }) => {
  const popup = usePopup();
  const [editSection, setEditSection] = useState<any>(null);
  const [interestsEditVisible, setInterestsEditVisible] = useState(false);
  const [editableInterests, setEditableInterests] = useState<string[]>([]);
  const [savingInterests, setSavingInterests] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    (async () => {
      const role = await AsyncStorage.getItem('userRole');
      setIsParent(role === 'PARENT');
    })();
  }, []);

  const handleEdit = (section: any) => {
    if (isParent) {
      popup.error(
        'Not allowed',
        'Family members cannot edit the primary member\'s profile. Please ask the account holder to make this change.'
      );
      return;
    }
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
        PersonalDetail: (data) => {
          const clean = (v: string) => (!v || v === '-' || v === 'Not specified') ? '' : v;
          return {
            userId,
            firstName: clean(data['First Name']),
            lastName: clean(data['Last Name']),
            height: clean(data['Height']),
            weight: clean(data['Weight']),
            physicalStatus: clean(data['Physical Status']),
            maritalStatus: clean(data['Marital Status']),
            motherLanguage: clean(data['Mother Language']),
          };
        },
        ReligiousDetail: (data) => {
          const clean = (v: string) => (!v || v === '-' || v === 'Not specified') ? '' : v;
          return {
            userId,
            star: clean(data['Star']),
            moonSign: clean(data['Moon Sign']),
            dosham: clean(data['Dosham']),
          };
        },
        EducationalDetail: (data) => ({
          userId,
          education: data['Education'] || '',
          occupation: data['Occupation'] || '',
          employedAt: data['Employing In'] == 'Private' ? 'PRIVATE' : data['Employing In'] == 'Government' ? 'GOVT' : data['Employing In'] == 'Self Employment' ? 'SELF' : '',
          annualIncome: data['Annual Income'] || ''
        }),
        FamilyDetail: (data) => {
          const clean = (v: string) => (!v || v === '-' || v === 'Not specified') ? '' : v;
          return {
            userId,
            house: clean(data['Family Type']),
            familyStatus: clean(data['Family Status']),
            fatherName: clean(data['Fathers Name']),
            fatherOccupation: clean(data['Fathers Occupation']),
            motherName: clean(data['Mothers Name']),
            motherOccupation: clean(data['Mothers Occupation']),
            noOfSiblings: clean(data['No of Siblings']),
            noOfBrothers: clean(data['No of Brothers']),
            noOfSisters: clean(data['No of Sisters']),
            noOfBrothersMarried: clean(data['Brother Married']),
            noOfSistersMarried: clean(data['Sister Married']),
          };
        },
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

        const sectionLabels: Record<string, string> = {
          PersonalDetail: 'Personal details',
          ReligiousDetail: 'Religious & astro details',
          EducationalDetail: 'Education details',
          FamilyDetail: 'Family details',
        };
        const niceLabel = sectionLabels[sectionKey] || 'Profile';
        popup.success('Updated', `${niceLabel} updated successfully.`);

        refreshProfile?.();
      } else {
        console.warn('Unknown section or API mapping missing:', sectionKey);
      }

      handleClose();

    } catch (error) {
      console.error('Error updating profile:', error);
      popup.error('Update failed', 'Something went wrong while updating. Please try again.');
    }
  };


  return (
    <NativeBaseProvider>
      <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
          <View style={{ flexGrow: 1, padding: 0, alignItems: 'center', backgroundColor: '#F5F5F5' }}>
            {data && Array.isArray(data) && data.length > 0 ? (
              data.map((section: any, idx: number) => {
                // Special render for InterestsDetail — show chip grid instead of key-value form
                if (section.title === 'InterestsDetail') {
                  const hobbies: string[] = section.data?._hobbies || [];
                  return (
                    <Box key={idx} width="100%" alignItems="center" mt={idx > 0 ? 6 : 0}>
                      <Box
                        width="full"
                        rounded="lg"
                        borderWidth={0.2}
                        borderColor="#fff"
                        p={4}
                        _dark={{ borderColor: "#800000", backgroundColor: "#800000" }}
                        _light={{ backgroundColor: "#F5F5F5" }}
                        style={{ elevation: 6, shadowColor: "#fff", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 2, shadowRadius: 3 }}
                      >
                        <HStack justifyContent="space-between" alignItems="center">
                          <Text fontSize="md" fontWeight="bold" fontFamily="Rubik-Bold" color={"#130001"}>Interests</Text>
                          <TouchableOpacity
                            style={{ backgroundColor: '#fff', padding: 5, borderRadius: 999 }}
                            onPress={() => {
                              if (isParent) {
                                popup.error('Not allowed', 'Family members cannot edit interests.');
                                return;
                              }
                              setEditableInterests(hobbies);
                              setInterestsEditVisible(true);
                            }}
                          >
                            <MaterialDesignIcons name="circle-edit-outline" size={24} color="#130001" />
                          </TouchableOpacity>
                        </HStack>
                        <View style={{ marginTop: 12 }}>
                          {hobbies.length > 0 ? (
                            <InterestChipGrid selected={hobbies} readOnly />
                          ) : (
                            <Text fontSize="sm" color="#9ca3af" fontStyle="italic">
                              No interests added yet. Tap edit to add your interests.
                            </Text>
                          )}
                        </View>
                      </Box>
                    </Box>
                  );
                }

                return (
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
                      <Text fontSize="md" fontWeight="bold" fontFamily="Rubik-Bold" color={"#130001"}>{section.title}</Text>
                      <TouchableOpacity style={{ backgroundColor: '#fff', padding: 5, borderRadius: 999 }} onPress={() => handleEdit(section)}>
                        <MaterialDesignIcons name="circle-edit-outline" size={24} color="#130001" />
                      </TouchableOpacity>
                    </HStack>

                    <FormControl mt={2}>
                      <Stack space={1}>
                        {Object.entries(section.data).map(([key, value], index) => (
                          <View key={index}>
                            <Text marginBottom={2} fontWeight={500} fontFamily="Rubik-Medium" fontSize={13}>{key}</Text>
                            <Input
                              type="text"
                              defaultValue={value}
                              isReadOnly={true}
                              borderWidth={0}
                              p={0}
                              fontWeight="bold" fontFamily="Rubik-Bold"
                              fontSize={14}
                              color={'#800000'}
                              _dark={{ color: "#DADADA" }}
                              _light={{ color: "#800000" }}
                              _web={{
                                color: "#DADADA",
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
              );})
            ) : (
              <Text color="#DADADA">No data available</Text>
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

      {/* Interests Edit Modal */}
      <Modal
        visible={interestsEditVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInterestsEditVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 16,
            paddingBottom: 40,
            paddingHorizontal: 20,
            maxHeight: '80%',
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View>
                <RNText style={{ fontSize: 18, fontFamily: 'Rubik-ExtraBold', color: '#420001' }}>
                  Edit Your Interests
                </RNText>
                <RNText style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Select at least 3 interests
                </RNText>
              </View>
              <TouchableOpacity onPress={() => setInterestsEditVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Counter */}
            <View style={{
              backgroundColor: editableInterests.length >= 3 ? '#d1fae5' : '#fef3c7',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 14,
              alignSelf: 'flex-start',
              marginBottom: 14,
            }}>
              <RNText style={{
                fontSize: 11,
                fontFamily: 'Rubik-Bold',
                color: editableInterests.length >= 3 ? '#065f46' : '#92400e',
              }}>
                {editableInterests.length} selected {editableInterests.length >= 3 ? '✓' : '(min 3)'}
              </RNText>
            </View>

            {/* Chip grid */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <InterestChipGrid
                selected={editableInterests}
                onToggle={(code) => {
                  setEditableInterests((prev) =>
                    prev.includes(code)
                      ? prev.filter((c) => c !== code)
                      : [...prev, code]
                  );
                }}
              />
            </ScrollView>

            {/* Save button */}
            <TouchableOpacity
              style={{
                backgroundColor: editableInterests.length >= 3 ? '#420001' : '#9ca3af',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }}
              disabled={editableInterests.length < 3 || savingInterests}
              onPress={async () => {
                if (!userId) return;
                setSavingInterests(true);
                try {
                  await userApi.updateUserHobbies(userId, editableInterests);
                  popup.success('Updated', 'Your interests have been updated.');
                  setInterestsEditVisible(false);
                  if (refreshProfile) refreshProfile();
                } catch (err) {
                  popup.error('Error', 'Failed to update interests. Please try again.');
                } finally {
                  setSavingInterests(false);
                }
              }}
            >
              <RNText style={{ color: '#fff', fontFamily: 'Rubik-Bold', fontSize: 14 }}>
                {savingInterests ? 'Saving...' : 'Save Interests'}
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </NativeBaseProvider>
  );
};


// Define SecondRoute component

const SecondRoute = ({
  data,
  refreshProfile,
  userId,
}: {
  data: GalleryItem[];
  refreshProfile?: () => void;
  userId?: string | null;
}) => {
  const popup = usePopup();
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    (async () => {
      const role = await AsyncStorage.getItem('userRole');
      setIsParent(role === 'PARENT');
    })();
  }, []);

  const blockedForParent = (action: string) => {
    popup.error(
      'Not allowed',
      `Family members cannot ${action}. Please ask the account holder to make this change.`
    );
  };

  const handleAddPhoto = async () => {
    if (isParent) { blockedForParent('upload photos'); return; }
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
            popup.success('Photo uploaded', 'Your new gallery photo is now visible on your profile.');
            refreshProfile?.();
          } else if (response.data.code === 400) {
            popup.error('Limit reached', response.data.message || 'You can only upload 3 photos. Please delete an existing photo first.');
          } else {
            throw new Error(response.data.message || 'Failed to upload photo');
          }
        }
      }
    } catch (error: any) {
      console.error('Error adding photo:', error);
      // Check if axios error has response data with a user-friendly message
      const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong while adding photo.';
      if (errorMessage.toLowerCase().includes('maximum')) {
        Alert.alert('Maximum Limit Reached', errorMessage);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
        });
      }
    }
  };

  const handleDelete = (galleryId: number) => {
    if (isParent) { blockedForParent('delete photos'); return; }
    popup.confirm(
      'Delete photo?',
      'This photo will be removed from your gallery. This action cannot be undone.',
      async () => {
        try {
          const res = await userApi.changeGalleryImageActiveStatusByImageId(galleryId);
          if (res?.data?.code === 200) {
            popup.success('Deleted', 'Photo removed from your gallery.');
            refreshProfile?.();
          } else {
            popup.error('Delete failed', res?.data?.message || 'Could not delete photo. Please try again.');
          }
        } catch (e) {
          popup.error('Delete failed', 'Network error. Please try again.');
        }
      },
      'Delete',
      'Cancel'
    );
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
                    <Ionicons name="trash" size={18} color="#DADADA" />
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
                    <Ionicons name="expand" size={18} color="#DADADA" />
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
                <Ionicons name="add-circle" size={24} />
                <Text>Add Photo</Text>
              </HStack>
            </Pressable>
          </HStack>

          <FlatList
            data={data}
            numColumns={2}
            keyExtractor={(item) => item.galleryId.toString()}
            renderItem={renderItem}
            windowSize={5}
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            removeClippedSubviews={true}
            ListEmptyComponent={
              <Center flex={1} mt={40}>
                <Text fontSize="md">
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
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.85)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
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

const ThirdRoute = ({ data = [], refreshProfile, userId }: { data: any[]; refreshProfile?: () => void; userId?: string | null }) => {
  const popup = usePopup();
  const [horoscopeImage, setHoroscopeImage] = useState<string | null>(null);
  const [horoscopeUploading, setHoroscopeUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    (async () => {
      const role = await AsyncStorage.getItem('userRole');
      setIsParent(role === 'PARENT');
    })();
  }, []);

  const blockedForParent = (action: string) => {
    popup.error(
      'Not allowed',
      `Family members cannot ${action}. Please ask the account holder to make this change.`
    );
  };

  const handleDeleteHoroscope = () => {
    if (isParent) { blockedForParent('delete the horoscope'); return; }
    if (!userId) return;
    popup.confirm(
      'Delete horoscope?',
      'Your uploaded horoscope image will be removed from your profile. You can upload a new one anytime.',
      async () => {
        try {
          const res = await userApi.deleteHoroscopeByUserId(userId);
          if (res?.data?.code === 200) {
            popup.success('Deleted', 'Horoscope image removed.');
            setHoroscopeImage(null);
            refreshProfile?.();
          } else {
            popup.error('Delete failed', res?.data?.message || 'Could not delete horoscope. Please try again.');
          }
        } catch (e) {
          popup.error('Delete failed', 'Network error. Please try again.');
        }
      },
      'Delete',
      'Cancel'
    );
  };

  const handleAddHoroscope = async () => {
    if (isParent) { blockedForParent('upload a horoscope'); return; }
    try {
      if (!userId) {
        popup.error('Error', 'User not found. Please login again.');
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

        // Upload the image with loading
        setHoroscopeUploading(true);
        try {
          const response = await userApi.uploadHoroscopeImage(formData);
          if (response?.data?.code === 200 || response?.data?.code === 201) {
            popup.success('Success', response.data.message || 'Horoscope uploaded successfully!', () => {
              if (refreshProfile) refreshProfile();
            });
          } else {
            throw new Error(response?.data?.message || 'Failed to upload horoscope');
          }
        } finally {
          setHoroscopeUploading(false);
        }
      }
    } catch (error) {
      console.error('Error adding horoscope:', error);
      setHoroscopeUploading(false);
      popup.error('Error', 'Failed to upload horoscope. Please try again.');
    }
  };

  const handleUpdateHoroscope = async () => {
    if (isParent) { blockedForParent('update the horoscope'); return; }
    try {
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

        // console.log('Uploading horoscope image:', {
        //   uri: imageUri,
        //   type: mimeType,
        //   name: fileName,
        //   userId: userIdConvert,
        // });

        // Upload with loading
        setHoroscopeUploading(true);
        try {
          const response = await userApi.uploadHoroscopeImage(formData);
          if (response?.data?.code === 200 || response?.data?.code === 201) {
            popup.success('Success', response.data.message || 'Horoscope updated successfully!', () => {
              if (refreshProfile) refreshProfile();
            });
          } else {
            throw new Error(response?.data?.message || 'Failed to upload horoscope');
          }
        } finally {
          setHoroscopeUploading(false);
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
          <HStack justifyContent="flex-end" pt={3} pr={2} space={4}>
            <Pressable
              onPress={horoscopeImage ? handleUpdateHoroscope : handleAddHoroscope}
              borderRadius={30}
              _pressed={{ opacity: 0.5 }}
            >
              <HStack alignItems="center" space={2}>
                <Ionicons name={horoscopeImage ? 'refresh-circle' : 'add-circle'} size={24} color="#059669" />
                <Text color="#059669" fontWeight="600" fontFamily="Rubik-Medium">{horoscopeImage ? 'Update' : 'Add Horoscope'}</Text>
              </HStack>
            </Pressable>
            {horoscopeImage ? (
              <Pressable
                onPress={handleDeleteHoroscope}
                borderRadius={30}
                _pressed={{ opacity: 0.5 }}
              >
                <HStack alignItems="center" space={2}>
                  <Ionicons name="trash" size={22} color="#dc2626" />
                  <Text color="#dc2626" fontWeight="600" fontFamily="Rubik-Medium">Delete</Text>
                </HStack>
              </Pressable>
            ) : null}
          </HStack>

          <Center>
            {horoscopeUploading ? (
              <View style={{ width: '100%', height: 250, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: 12 }}>
                <ActivityIndicator size="large" color="#420001" />
                <RNText style={{ marginTop: 12, fontSize: 13, color: '#6b7280', fontFamily: 'Rubik-Medium' }}>Uploading horoscope...</RNText>
              </View>
            ) : horoscopeImage ? (
              <Image
                source={{ uri: horoscopeImage }}
                alt="Horoscope Image"
                style={{ width: '100%', height: 300, maxWidth: '100%' }}
                resizeMode="contain"
                resizeMode="contain"
              />
            ) : (
              <Text mt={40}>
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
  initialTabIndex?: number;
  userId?: string | null;
}

const Tabs = ({ personalDetail, refreshProfile, initialTabIndex = 0, userId }: ProfileDetailTabProps) => {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);

  // Update tab index when initialTabIndex changes
  React.useEffect(() => {
    if (initialTabIndex !== undefined && initialTabIndex >= 0 && initialTabIndex < routes.length) {
      setIndex(initialTabIndex);
    }
  }, [initialTabIndex]);

  // Memoize the transformed form data
  const formdata = React.useMemo(() =>
    personalDetail?.personalDetails?.map((section: any) => ({
      title: section.section,
      data: section.data
    })) || [
      { title: 'Personal Details', data: {} },
      { title: 'Religious Details', data: {} },
      { title: 'Education Details', data: {} },
      { title: 'Family Details', data: {} }
    ], [personalDetail?.personalDetails]);

  // Stable renderScene — avoids recreating sub-route components on every render
  const renderScene = React.useCallback(({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'first':
        return <FirstRoute data={formdata} refreshProfile={refreshProfile} userId={userId} />;
      case 'second':
        return <SecondRoute data={personalDetail?.galleryImages || []} refreshProfile={refreshProfile} userId={userId} />;
      case 'third':
        return <ThirdRoute data={personalDetail?.galleryImages || []} refreshProfile={refreshProfile} userId={userId} />;
      default:
        return null;
    }
  }, [formdata, personalDetail?.galleryImages, refreshProfile, userId]);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      lazy={true}
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

