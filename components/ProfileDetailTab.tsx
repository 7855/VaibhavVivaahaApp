import { View, Text, TouchableOpacity, Modal } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Box, AspectRatio, Center, Heading, Image, HStack, Stack, Text as TextBase, FormControl, Input, Divider, NativeBaseProvider, FlatList, VStack } from 'native-base';
import { useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../app/(root)/api/userApi';
import { Alert } from 'react-native';
import FIcon from '@expo/vector-icons/Feather'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { ScrollView } from 'react-native';
import InterestChipGrid from './InterestChipGrid';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionsheetBackdrop } from './ActionSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { usePopup } from '../app/(root)/contexts/PopupContext';


const FirstRoute = ({
  data,
  isPremium = false,
  hiddenFieldsValue = [],
  profileDetailIdValue,
  interestsData = [],
}: {
  data: any;
  isPremium?: boolean;
  hiddenFieldsValue?: any;
  profileDetailIdValue?: any;
  interestsData?: string[];
}) => {

  // 🔹 1. Add state to manage permission requests
  const [permissionRequests, setPermissionRequests] = useState<{ [key: string]: boolean }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const popup = usePopup();
  const [revealedContact, setRevealedContact] = useState<{ mobile?: string; email?: string } | null>(null);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);
      } catch (error) {
        console.error('Error loading user ID:', error);
      }
    };
    loadUserId();
  }, []);

  // 🔹 3. Load existing requests when userId and profileDetailId are available
  useEffect(() => {
    const loadExistingRequests = async () => {
      if (!userId || !profileDetailIdValue) return;

      try {
        setIsLoading(true);
        const decodedUserId = atob(userId);
        const response = await userApi.getRequestsTo(decodedUserId, profileDetailIdValue);
        
        // Handle null response or error response
        if (!response?.data?.data) {
          console.log('No existing requests found');
          return;
        }

        // Get the actual data from the response
        const requests = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        
        // Filter out null/undefined requests and get field types
        const existingRequests = requests
          .filter((request: any) => request && request.fieldType)
          .map((request: any) => request.fieldType);
        
        // Update permissionRequests state
        const updatedRequests = {
          ...permissionRequests,
          horoscope: existingRequests.includes('HOROSCOPE'),
          mobileNumber: existingRequests.includes('MOBILE')
        };
        setPermissionRequests(updatedRequests);
      } catch (error) {
        console.error('Error loading existing requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingRequests();
  }, [userId, profileDetailIdValue]);

  // 🔹 2. Functions to handle permission requests
  const handlePermissionRequest = async (fieldKey: string) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Sending permission request for field:', fieldKey);
      
      // Map fieldKey to fieldType (you may need to adjust this mapping based on your actual field types)
      const fieldType = fieldKey == "mobileNumber" ? "MOBILE" : fieldKey == "horoscope" ? "HOROSCOPE" : fieldKey;
      const decodedUserId = atob(userId);
      await userApi.sendRestrictedFieldRequest(decodedUserId, profileDetailIdValue, fieldType);
      
      // Update local state
      setPermissionRequests(prev => ({
        ...prev,
        [fieldKey]: true
      }));
      
      Alert.alert('Success', 'Permission request sent successfully');
    } catch (error) {
      console.error('Error sending permission request:', error);
      Alert.alert('Error', 'Failed to send permission request');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionCancel = async (fieldKey: string) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Cancelling permission request for field:', fieldKey);
      
      // Map fieldKey to fieldType
      const fieldType = fieldKey == "mobileNumber" ? "MOBILE" : fieldKey == "horoscope" ? "HOROSCOPE" : fieldKey;
      const decodedUserId = atob(userId);
      
      await userApi.deleteRequest(decodedUserId, profileDetailIdValue, fieldType);
      
      // Update local state
      setPermissionRequests(prev => ({
        ...prev,
        [fieldKey]: false
      }));
      
      Alert.alert('Success', 'Permission request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling permission request:', error);
      Alert.alert('Error', 'Failed to cancel permission request');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = (fieldKey: string, isRequested: boolean, requestedToId: string) => {
    if (isRequested) {
      handlePermissionCancel(fieldKey);
    } else {
      handlePermissionRequest(fieldKey, requestedToId);
    }
  };

  return (
      <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
          <View style={{ flexGrow: 1, padding: 10, alignItems: 'center' }}>
            <Box width="100%" alignItems="center">
              <Box
                width="full"
                rounded="lg"
                borderWidth={0.2}
                borderColor="#fff"
                p={2}
                style={{
                  elevation: 6,
                  shadowColor: "#fff",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0,
                  shadowRadius: 0,
                }}
              >
                <HStack justifyContent="space-between" alignItems="center" style={{ marginBottom: 10 }}>
                  <TextBase fontSize="md" fontWeight="bold">Personal Details</TextBase>
                </HStack>

                <FormControl mt={0}>
                  <Stack space={1}>
                    {Object.entries(data || {}).map(([key, value], index) => {
                      const normalizedKey = key
                        .replace(/\s/g, '')
                        .replace(/[^a-zA-Z0-9]/g, '')
                        .charAt(0)
                        .toLowerCase() + key.replace(/\s/g, '').slice(1);

                      const isHidden = hiddenFieldsValue.includes(normalizedKey);
                      const permissionRequested = permissionRequests[normalizedKey];

                      return (
                        <View key={index}>
                          <TextBase marginBottom={2} fontWeight={500} fontSize={13}>{key}</TextBase>

                          {normalizedKey === 'mobileNumber' && !isPremium ? (
                            // 🔒 Free/Starter — no contact access at all
                            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(root)/screens/PremiumTab' as any)} style={{ backgroundColor: '#fff7ed', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, borderWidth: 1, borderColor: '#fed7aa' }}>
                              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="diamond-outline" size={14} color="#c2410c" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: '#9a3412', fontSize: 11, fontFamily: 'Rubik-Bold' }}>Premium Only</Text>
                                <Text style={{ color: '#c2410c', fontSize: 10, fontFamily: 'Rubik-Medium' }}>Upgrade to Classic or above to view contact</Text>
                              </View>
                              <Ionicons name="chevron-forward" size={14} color="#ea580c" />
                            </TouchableOpacity>
                          ) : normalizedKey === 'mobileNumber' && isPremium && (!value || value === '-' || value === 'null') && !revealedContact ? (
                            // 🔓 Classic plan — contact hidden, show "View Contact" button
                            <TouchableOpacity activeOpacity={0.7} onPress={async () => {
                              try {
                                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                                const myUserId = await AsyncStorage.getItem('userId');
                                if (!myUserId || !profileDetailIdValue) return;
                                const res = await userApi.revealContact(myUserId, profileDetailIdValue);
                                if (res.data?.code === 200) {
                                  const { mobile, email, remaining, total, unlimited } = res.data.data;
                                  setRevealedContact({ mobile, email });
                                  const remainingText = unlimited ? '' : `\n\n${remaining} of ${total} contact reveals remaining`;
                                  popup.success('Contact Revealed', `📞 ${mobile || 'N/A'}${remainingText}`);
                                } else if (res.data?.message === 'CONTACT_VIEW_LIMIT_EXCEEDED') {
                                  const limit = res.data?.data?.limit || 40;
                                  popup.premiumRequired(
                                    `You've used all ${limit} contact reveals. Upgrade to Silver for unlimited access.`,
                                    () => router.push('/(root)/screens/PremiumTab' as any)
                                  );
                                } else {
                                  popup.premiumRequired(
                                    'Upgrade to Classic or above to view contacts.',
                                    () => router.push('/(root)/screens/PremiumTab' as any)
                                  );
                                }
                              } catch (e) {
                                popup.error('Error', 'Failed to reveal contact. Try again.');
                              }
                            }} style={{ backgroundColor: '#eff6ff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, borderWidth: 1, borderColor: '#bfdbfe' }}>
                              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="call" size={14} color="#2563eb" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: '#1e40af', fontSize: 12, fontFamily: 'Rubik-Bold' }}>View Contact</Text>
                                <Text style={{ color: '#3b82f6', fontSize: 10, fontFamily: 'Rubik-Medium' }}>Tap to reveal phone & email</Text>
                              </View>
                              <Ionicons name="eye" size={16} color="#2563eb" />
                            </TouchableOpacity>
                          ) : normalizedKey === 'mobileNumber' && revealedContact ? (
                            // ✅ Contact just revealed in this session — show the number
                            <View style={{ marginBottom: 8 }}>
                              <Text style={{ fontSize: 14, fontFamily: 'Rubik-Medium', color: '#1e40af' }}>
                                {revealedContact.mobile || 'N/A'}
                              </Text>
                            </View>
                          ) : (
                            // ✅ Silver+ users OR non-mobile fields
                            isHidden ? (
                              <View>
                                <View
                                  style={{
                                    backgroundColor: '#ffe0e0',
                                    padding: 6,
                                    borderRadius: 6,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    marginBottom: 8,
                                    width: '75%'
                                  }}
                                >
                                  <Ionicons name="lock-closed" size={14} color="#9ca3af" />
                                  <Text style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'Rubik-Medium' }}>
                                    This field is private
                                  </Text>
                                </View>

                                <TouchableOpacity
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    backgroundColor: permissionRequested ? '#fef2f2' : '#f0f0ff',
                                    paddingVertical: 8,
                                    paddingHorizontal: 14,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: permissionRequested ? '#fecaca' : '#e0e0ff',
                                    marginBottom: 8,
                                  }}
                                  onPress={() =>
                                    handlePermissionToggle(normalizedKey, permissionRequests[normalizedKey], data.userId)
                                  }
                                >
                                  <Ionicons
                                    name={permissionRequested ? 'close-circle-outline' : 'key-outline'}
                                    size={14}
                                    color={permissionRequested ? '#ef4444' : '#6c5ce7'}
                                  />
                                  <Text style={{
                                    fontSize: 12,
                                    fontFamily: 'Rubik-Bold',
                                    color: permissionRequested ? '#ef4444' : '#6c5ce7',
                                  }}>
                                    {permissionRequested ? 'Cancel Request' : 'Request Access'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <Input
                                type="text"
                                defaultValue={value}
                                borderWidth={0}
                                p={0}
                                fontWeight="bold"
                                fontSize={14}
                                color={'#420001'}
                                isReadOnly
                                _focus={{ borderWidth: 0, backgroundColor: 'transparent' }}
                              />
                            )
                          )}


                          {index < Object.keys(data).length - 1 && (
                            <Divider my={2} height={'0.5px'} bg="gray.700" />
                          )}
                        </View>
                      );
                    })}
                  </Stack>
                </FormControl>
              </Box>
            </Box>

            {/* Interests section — below Personal Details */}
            <Box width="100%" alignItems="center" mt={4}>
              <Box
                width="full"
                rounded="lg"
                borderWidth={0.2}
                borderColor="#fff"
                p={2}
                style={{ elevation: 6, shadowColor: "#fff", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0, shadowRadius: 0 }}
              >
                <HStack justifyContent="space-between" alignItems="center" style={{ marginBottom: 10 }}>
                  <TextBase fontSize="md" fontWeight="bold">Interests</TextBase>
                </HStack>
                {interestsData && interestsData.length > 0 ? (
                  <InterestChipGrid selected={interestsData} readOnly />
                ) : (
                  <TextBase fontSize="sm" color="#9ca3af" fontStyle="italic">
                    No interests added yet
                  </TextBase>
                )}
              </Box>
            </Box>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
};


const renderDetailBox = (title: string, details: any, onHoroscopePress?: (uri: string) => void, isPremium = false) => (
  <Box width="100%" alignItems="center">
    <Box
      width="full"
      rounded="lg"
      borderWidth={0.2}
      borderColor="#fff"
      p={2}
      style={{
        elevation: 6,
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0,
        shadowRadius: 0,
      }}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <TextBase fontSize="md" fontWeight="bold" >{title}</TextBase>
      </HStack>
      <FormControl mt={2}>
        <Stack space={1}>
          {Object.entries(details).map(([key, value], index) => (
            <View key={index}>
              <TextBase marginBottom={2} fontWeight={500} fontSize={13}>{key}</TextBase>
              {key === 'Horoscope' || key === 'Mobile Number' ? (
                isPremium ? (
                  key === 'Horoscope' ? (
                    value && value !== 'null' && value !== '-' ? (
                      <TouchableOpacity
                        onPress={() => onHoroscopePress?.(value)}
                        style={{
                          backgroundColor: '#FFD700',
                          padding: 6,
                          borderRadius: 6,
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ color: '#1e40af', fontFamily: 'Rubik-Bold', fontSize: 12 }}>
                          View Horoscope
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ backgroundColor: '#fff7ed', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, borderWidth: 1, borderColor: '#fed7aa' }}>
                        <Ionicons name="lock-closed" size={14} color="#c2410c" />
                        <Text style={{ color: '#9a3412', fontSize: 11, fontFamily: 'Rubik-Medium' }}>Available after interest accepted</Text>
                      </View>
                    )
                  ) : (
                    <Input
                      type="text"
                      defaultValue={value}
                      borderWidth={0}
                      p={0}
                      fontWeight="semibold"
                      fontSize={14}
                      color={'#420001'}
                      isReadOnly
                      _focus={{ borderWidth: 0, backgroundColor: 'transparent' }}
                    />
                  )
                ) : (
                  <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(root)/screens/PremiumTab' as any)} style={{ backgroundColor: '#fff7ed', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, borderWidth: 1, borderColor: '#fed7aa' }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="diamond-outline" size={14} color="#c2410c" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#9a3412', fontSize: 11, fontFamily: 'Rubik-Bold' }}>Premium Only</Text>
                      <Text style={{ color: '#c2410c', fontSize: 10, fontFamily: 'Rubik-Medium' }}>Upgrade to view this info</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#ea580c" />
                  </TouchableOpacity>
                )
              ) : (
                <Input
                  type="text"
                  defaultValue={value}
                  borderWidth={0}
                  p={0}
                  fontWeight="bold"
                  fontSize={14}
                  color={'#420001'}
                  isReadOnly
                  _focus={{ borderWidth: 0, backgroundColor: 'transparent' }}
                />
              )}
              {index < Object.keys(details).length - 1 && (
                              <Divider my={2} height={'0.5px'} bg="gray.700" />
                            )}
            </View>
          ))}
        </Stack>
      </FormControl>
    </Box>
  </Box>
);


const SecondRoute = ({
  data,
  onHoroscopePress,
  isPremium,
  hiddenFieldsValue = [],
  profileDetailIdValue,
}: {
  data: any;
  onHoroscopePress?: (uri: string) => void;
  isPremium: boolean;
  hiddenFieldsValue?: string[];
  profileDetailIdValue?: string;
}) => {
  const [horoscopePermission, setHoroscopePermission] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);
      } catch (error) {
        console.error('Error loading user ID:', error);
      }
    };
    loadUserId();
  }, []);

  // Load existing horoscope request
  useEffect(() => {
    const loadExistingRequest = async () => {
      if (!userId || !profileDetailIdValue) return;

      try {
        setIsLoading(true);
        const decodedUserId = atob(userId);
        const response = await userApi.getRequestsTo(decodedUserId, profileDetailIdValue);
        
        if (!response || !response.data) {
          console.error('Invalid response:', response);
          return;
        }

        // Handle null/undefined response data
        if (!response.data) {
          console.log('No existing requests found');
          return;
        }

        try {
          // Handle null/undefined response data
          if (!response?.data?.data) {
            console.log('No existing requests found');
            setHoroscopePermission(false);
            return;
          }

          const requests = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
          
          // Filter out null/undefined requests and get field types
          const existingRequests = requests
            .filter((request: any) => request && request.fieldType)
            .map((request: any) => request.fieldType);
          
          if (existingRequests.includes('HOROSCOPE')) {
            setHoroscopePermission(true);
          } else {
            setHoroscopePermission(false);
          }
        } catch (error) {
          console.error('Error processing requests:', error);
          setHoroscopePermission(false);
        }
      } catch (error) {
        console.error('Error loading existing horoscope request:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingRequest();
  }, [userId, profileDetailIdValue]);

  // Handle horoscope permission request
  const handleHoroscopePermissionRequest = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setIsLoading(true);
      const decodedUserId = atob(userId);
      await userApi.sendRestrictedFieldRequest(decodedUserId, profileDetailIdValue, 'HOROSCOPE');
      setHoroscopePermission(true);
      Alert.alert('Success', 'Horoscope permission request sent successfully');
    } catch (error) {
      console.error('Error sending horoscope permission request:', error);
      Alert.alert('Error', 'Failed to send horoscope permission request');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle horoscope permission cancel
  const handleHoroscopePermissionCancel = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setIsLoading(true);
      const decodedUserId = atob(userId);
      await userApi.deleteRequest(decodedUserId, profileDetailIdValue, 'HOROSCOPE');
      setHoroscopePermission(false);
      Alert.alert('Success', 'Horoscope permission request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling horoscope permission request:', error);
      Alert.alert('Error', 'Failed to cancel horoscope permission request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#F5F5F5', height: '100%' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        <View style={{ flexGrow: 1, padding: 10, alignItems: 'center' }}>
          <Box width="100%" alignItems="center">
            <Box
              width="full"
              rounded="lg"
              borderWidth={0.2}
              borderColor="#fff"
              p={2}
              style={{
                elevation: 6,
                shadowColor: "#fff",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0,
                shadowRadius: 0,
              }}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <TextBase fontSize="md" fontWeight="bold" >Religious Details</TextBase>
              </HStack>
              <FormControl mt={2}>
                <Stack space={1}>
                  {Object.entries(data || {}).map(([key, value], index) => {
                    const normalizedKey = key
                    .replace(/\s/g, '')
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .toLowerCase(); 
                  

                      const isHidden = hiddenFieldsValue.includes(normalizedKey);

                      return (
                        <View key={index}>
                          <TextBase marginBottom={2} fontWeight={500} fontSize={13}>{key}</TextBase>

                          {/* Horoscope Field */}
                          {key.toLowerCase() === 'horoscope' ? (
                            isPremium ? (
                              isHidden ? (
                                <View>
                                  <View
                                    style={{
                                      backgroundColor: '#ffe0e0',
                                      padding: 6,
                                      borderRadius: 6,
                                      alignItems: 'center',
                                      flexDirection: 'row',
                                      marginBottom: 8,
                                      width: '75%'
                                    }}
                                  >
                                    <Ionicons name="lock-closed" size={14} color="#9ca3af" />
                                    <Text style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'Rubik-Medium' }}>
                                      Horoscope is private
                                    </Text>
                                  </View>
                                  <TouchableOpacity
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 6,
                                      backgroundColor: horoscopePermission ? '#fef2f2' : '#f0f0ff',
                                      paddingVertical: 8,
                                      paddingHorizontal: 14,
                                      borderRadius: 10,
                                      borderWidth: 1,
                                      borderColor: horoscopePermission ? '#fecaca' : '#e0e0ff',
                                      marginBottom: 8,
                                    }}
                                    onPress={() => {
                                      horoscopePermission
                                        ? handleHoroscopePermissionCancel()
                                        : handleHoroscopePermissionRequest();
                                    }}
                                  >
                                    <Ionicons
                                      name={horoscopePermission ? 'close-circle-outline' : 'key-outline'}
                                      size={14}
                                      color={horoscopePermission ? '#ef4444' : '#6c5ce7'}
                                    />
                                    <Text style={{
                                      fontSize: 12,
                                      fontFamily: 'Rubik-Bold',
                                      color: horoscopePermission ? '#ef4444' : '#6c5ce7',
                                    }}>
                                      {horoscopePermission ? 'Cancel Request' : 'Request Access'}
                                    </Text>
                                   
                                  </TouchableOpacity>

                                </View>
                              ) : (
                                <TouchableOpacity
                                  onPress={() => onHoroscopePress?.(value)}
                                  style={{
                                    backgroundColor: '#FFD700',
                                    padding: 6,
                                    borderRadius: 6,
                                    alignItems: 'center',
                                    marginBottom: 8,
                                  }}
                                >
                                  <Text style={{ color: '#1e40af', fontFamily: 'Rubik-Bold', fontSize: 12 }}>
                                    View Horoscope
                                  </Text>
                                </TouchableOpacity>
                              )
                            ) : (
                              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(root)/screens/PremiumTab' as any)} style={{ backgroundColor: '#fff7ed', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, borderWidth: 1, borderColor: '#fed7aa' }}>
                                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center' }}>
                                  <Ionicons name="diamond-outline" size={14} color="#c2410c" />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: '#9a3412', fontSize: 11, fontFamily: 'Rubik-Bold' }}>Premium Only</Text>
                                  <Text style={{ color: '#c2410c', fontSize: 10, fontFamily: 'Rubik-Medium' }}>Upgrade to view this info</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={14} color="#ea580c" />
                              </TouchableOpacity>
                            )
                          ) : key === 'Star' || key === 'Moonsign' || key === 'Dosham' ? (
                            isPremium ? (
                              isHidden ? (
                                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(root)/screens/PremiumTab' as any)} style={{ backgroundColor: '#fff7ed', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, borderWidth: 1, borderColor: '#fed7aa' }}>
                                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center' }}>
                                    <Ionicons name="diamond-outline" size={14} color="#c2410c" />
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#9a3412', fontSize: 11, fontFamily: 'Rubik-Bold' }}>Premium Only</Text>
                                    <Text style={{ color: '#c2410c', fontSize: 10, fontFamily: 'Rubik-Medium' }}>Upgrade to view this info</Text>
                                  </View>
                                  <Ionicons name="chevron-forward" size={14} color="#ea580c" />
                                </TouchableOpacity>
                              ) : (
                                <Input
                                  type="text"
                                  defaultValue={value}
                                  borderWidth={0}
                                  p={0}
                                  fontWeight="bold"
                                  fontSize={14}
                                  color={'#420001'}
                                  isReadOnly
                                  _focus={{ borderWidth: 0, backgroundColor: 'transparent' }}
                                />
                              )
                            ) : (
                              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(root)/screens/PremiumTab' as any)} style={{ backgroundColor: '#fff7ed', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, borderWidth: 1, borderColor: '#fed7aa' }}>
                                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center' }}>
                                  <Ionicons name="diamond-outline" size={14} color="#c2410c" />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: '#9a3412', fontSize: 11, fontFamily: 'Rubik-Bold' }}>Premium Only</Text>
                                  <Text style={{ color: '#c2410c', fontSize: 10, fontFamily: 'Rubik-Medium' }}>Upgrade to view this info</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={14} color="#ea580c" />
                              </TouchableOpacity>
                            )
                          ) : (
                            <Input
                              type="text"
                              defaultValue={value}
                              borderWidth={0}
                              p={0}
                              fontWeight="bold"
                              fontSize={14}
                              color={'#420001'}
                              isReadOnly
                              _focus={{ borderWidth: 0, backgroundColor: 'transparent' }}
                            />
                          )}
                          {index < Object.keys(data).length - 1 && (
                              <Divider my={2} height={'0.5px'} bg="gray.700" />
                          )}
                        </View>
                      );
                    })}
                  </Stack>
                </FormControl>
              </Box>
            </Box>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
};

const ThirdRoute = ({ data, isPremium }: { data: any; isPremium: boolean }) => (
    <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}>
        <View style={{ flexGrow: 1, padding: 10, alignItems: 'center' }}>
          {renderDetailBox('Education Details', data, undefined, isPremium)}
        </View>
      </ScrollView>
    </SafeAreaView>
);

const FourthRoute = ({ data, isPremium }: { data: any; isPremium: boolean }) => (
    <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        <View style={{ flexGrow: 1, padding: 10, alignItems: 'center' }}>
          {renderDetailBox('Family Details', data, undefined, isPremium)}
        </View>
      </ScrollView>
    </SafeAreaView>
);

const FifthRoute = ({ data }: { data: any }) => {
  const hobbies: string[] = data?._hobbies || [];
  return (
      <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
          <View style={{ flexGrow: 1, padding: 16, alignItems: 'center' }}>
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              width: '100%',
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}>
              <Text style={{ fontSize: 16, fontFamily: 'Rubik-Bold', color: '#420001', marginBottom: 12 }}>
                Interests
              </Text>
              {hobbies.length > 0 ? (
                <InterestChipGrid
                  selected={hobbies}
                  readOnly
                />
              ) : (
                <Text style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                  No interests added yet
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
};

const routes = [
  { key: 'first', title: 'Personal' },
  { key: 'second', title: 'Religious' },
  { key: 'third', title: 'Education' },
  { key: 'fourth', title: 'Family' },
];

interface ProfileDetailTabProps {
  personalDetail: any;
  onHoroscopePress?: (uri: string) => void;
  isPremium?: boolean;
  hiddenFields?: any;
  onImagePress?: (uri: string) => void;
  profileDetailId?: any;
}

const ProfileDetailTab = ({ personalDetail, isPremium, hiddenFields, onImagePress, profileDetailId }: ProfileDetailTabProps) => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [horoscopeUri, setHoroscopeUri] = useState<string | null>(null);
  const popup = usePopup();

  // Use prop directly — no state copy needed (was causing extra re-render)
  const handleHoroscopePress = React.useCallback((uri: string) => {
    if (!uri || uri === 'null' || uri === '-' || uri === '') {
      popup.info('Horoscope Locked', 'Send an interest request first. Horoscope will be available after the request is accepted.');
      return;
    }
    setHoroscopeUri(uri);
    setIsModalVisible(true);
  }, [popup]);

  const personalDetail1 = personalDetail?.[0]?.data;
  const religiousDetail = personalDetail?.[1]?.data;
  const educationDetail = personalDetail?.[2]?.data;
  const familyDetail = personalDetail?.[3]?.data;
  const interestsData = personalDetail?.[4]?.data?._hobbies || [];

  // Stable renderScene — prevents TabView from unmounting/remounting scenes on every render.
  // SceneMap was the root cause of loading spinners on every tab switch.
  const renderScene = React.useCallback(({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'first':
        return <FirstRoute data={personalDetail1} isPremium={isPremium} hiddenFieldsValue={hiddenFields} onImagePress={onImagePress} profileDetailIdValue={profileDetailId} interestsData={interestsData} />;
      case 'second':
        return <SecondRoute data={religiousDetail} onHoroscopePress={handleHoroscopePress} isPremium={isPremium} hiddenFieldsValue={hiddenFields} profileDetailIdValue={profileDetailId} />;
      case 'third':
        return <ThirdRoute data={educationDetail} isPremium={isPremium} hiddenFieldsValue={hiddenFields} />;
      case 'fourth':
        return <FourthRoute data={familyDetail} isPremium={isPremium} hiddenFieldsValue={hiddenFields} />;
      default:
        return null;
    }
  }, [personalDetail1, religiousDetail, educationDetail, familyDetail, isPremium, hiddenFields, interestsData, profileDetailId, handleHoroscopePress, onImagePress]);

  // Stable tab bar renderer
  const renderTabBar = React.useCallback((props: any) => (
    <TabBar
      {...props}
      style={{
        backgroundColor: '#800000',
        borderBottomColor: '#FFD700',
        borderTopColor: '#fff',
        borderTopEndRadius: 30,
        borderTopStartRadius: 30,
        marginTop: 0
      }}
      indicatorStyle={{
        backgroundColor: '#FFD700',
        height: 2,
      }}
    />
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        lazy={true}
        renderTabBar={renderTabBar}
      />

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Image
            source={{ uri: horoscopeUri || '' }}
            resizeMode="contain"
            style={{
              width: '90%',
              height: '80%',
              borderRadius: 10,
              backgroundColor: '#fff'
            }}
          />
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default ProfileDetailTab;