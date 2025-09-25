import { View, Text, TouchableOpacity, Modal } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Box, AspectRatio, Center, Heading, Image, HStack, Stack, Text as TextBase, FormControl, Input, Divider, NativeBaseProvider, FlatList, VStack } from 'native-base';
import { useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../app/(root)/api/userApi';
import { Alert } from 'react-native';
import FIcon from '@expo/vector-icons/Feather'
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionsheetBackdrop } from './ActionSheet';


const FirstRoute = ({
  data,
  isPremium = false,
  hiddenFieldsValue = [],
  profileDetailIdValue,
}: {
  data: any;
  isPremium?: boolean;
  hiddenFieldsValue?: any;
  profileDetailIdValue?: any;
}) => {

  // 🔹 1. Add state to manage permission requests
  const [permissionRequests, setPermissionRequests] = useState<{ [key: string]: boolean }>({});
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
    <NativeBaseProvider>
      <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: 'rgba(30,64,175,1.00)' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
          <View style={{ flexGrow: 1, padding: 10, alignItems: 'center' }}>
            <Box width="100%" alignItems="center">
              <Box
                width="full"
                rounded="lg"
                borderWidth={0.2}
                borderColor="#fff"
                p={4}
                style={{
                  elevation: 6,
                  shadowColor: "#fff",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0,
                  shadowRadius: 0,
                }}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <TextBase fontSize="md" fontWeight="medium" color={"warning.100"}>Personal Details</TextBase>
                </HStack>

                <FormControl mt={0}>
                  <Stack space={1}>
                    {Object.entries(data).map(([key, value], index) => {
                      const normalizedKey = key
                        .replace(/\s/g, '')
                        .replace(/[^a-zA-Z0-9]/g, '')
                        .charAt(0)
                        .toLowerCase() + key.replace(/\s/g, '').slice(1);

                      const isHidden = hiddenFieldsValue.includes(normalizedKey);
                      const permissionRequested = permissionRequests[normalizedKey];

                      return (
                        <View key={index}>
                          <TextBase marginBottom={2} color={'amber.500'} fontSize={13}>{key}</TextBase>

                          {isPremium ? (
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
                                  <FIcon name="eye-off" size={16} color="#b91c1c" style={{ marginRight: 4 }} />
                                  <Text
                                    style={{
                                      color: '#b91c1c',
                                      fontWeight: 'bold',
                                      fontSize: 12,
                                      textAlign: 'center'
                                    }}
                                  >
                                    The user restricted this field
                                  </Text>
                                </View>

                                <TouchableOpacity
                                  style={{
                                    borderRadius: 6,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    marginBottom: 8,
                                  }}
                                  onPress={() => handlePermissionToggle(normalizedKey, permissionRequests[normalizedKey], data.userId)}
                                >
                                  <Text
                                    style={{
                                      backgroundColor: '#ffe0e0',
                                      padding: 10,
                                      borderRadius: 6,
                                      color: '#b91c1c',
                                      fontWeight: 'bold',
                                      fontSize: 12,
                                    }}
                                  >
                                    {permissionRequested ? 'Cancel Request' : 'Ask Permission'}
                                  </Text>
                                </TouchableOpacity>

                              </View>
                            ) : (
                              <Input
                                type="text"
                                defaultValue={value}
                                borderWidth={0}
                                p={0}
                                fontWeight="semibold"
                                fontSize={14}
                                color={'#F5F5F5'}
                                isReadOnly
                                _focus={{ borderWidth: 0, backgroundColor: 'transparent' }}
                              />
                            )
                          ) : (
                            <View
                              style={{
                                backgroundColor: '#FFD700',
                                padding: 6,
                                borderRadius: 6,
                                alignItems: 'center',
                                flexDirection: 'row',
                                marginBottom: 8,
                                width: '75%'
                              }}
                            >
                              <FIcon name="lock" size={16} color="#1e40af" marginRight={4} />
                              <Text
                                style={{
                                  color: '#1e40af',
                                  fontWeight: 'bold',
                                  fontSize: 12,
                                  textAlign: 'center'
                                }}
                              >
                                Only Premium Members can see
                              </Text>
                            </View>
                          )}

                          {index < Object.keys(data).length - 1 && (
                            <Divider my={2} height={'0.4px'} _light={{ bg: "blueGray.100" }} />
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
    </NativeBaseProvider>
  );
};


const renderDetailBox = (title: string, details: any, onHoroscopePress?: (uri: string) => void, isPremium = false) => (
  <Box width="100%" alignItems="center">
    <Box
      width="full"
      rounded="lg"
      borderWidth={0.2}
      borderColor="#fff"
      p={4}
      style={{
        elevation: 6,
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0,
        shadowRadius: 0,
      }}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <TextBase fontSize="md" fontWeight="medium" color={"warning.100"}>{title}</TextBase>
      </HStack>
      <FormControl mt={2}>
        <Stack space={1}>
          {Object.entries(details).map(([key, value], index) => (
            <View key={index}>
              <TextBase marginBottom={2} color={'amber.500'} fontSize={13}>{key}</TextBase>
              {key === 'Horoscope' || key === 'Mobile Number' ? (
                isPremium ? (
                  key === 'Horoscope' ? (
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
                      <Text style={{ color: '#1e40af', fontWeight: 'bold', fontSize: 12 }}>
                        View Horoscope
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Input
                      type="text"
                      defaultValue={value}
                      borderWidth={0}
                      p={0}
                      fontWeight="semibold"
                      fontSize={14}
                      color={'#F5F5F5'}
                      isReadOnly
                      _focus={{ borderWidth: 0, backgroundColor: 'transparent' }}
                    />
                  )
                ) : (
                  <View
                    style={{
                      backgroundColor: '#FFD700',
                      padding: 6,
                      borderRadius: 6,
                      alignItems: 'center',
                      flexDirection: 'row',
                      marginBottom: 8,
                      width: '75%'
                    }}
                  >
                    <FIcon name="lock" size={16} color="#1e40af" marginRight={4} />
                    <Text
                      style={{
                        color: '#1e40af',
                        fontWeight: 'bold',
                        fontSize: 12,
                        textAlign: 'center'
                      }}
                    >
                      Only Premium Members can see
                    </Text>
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
                  color={'#F5F5F5'}
                  isReadOnly
                  _focus={{ borderWidth: 0, backgroundColor: 'transparent' }}
                />
              )}
              {index < Object.keys(details).length - 1 && (
                <Divider my={2} height={'0.4px'} _light={{ bg: "blueGray.100" }} />
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
  <NativeBaseProvider>
    <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: 'rgba(30,64,175,1.00)', height: '100%' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        <View style={{ flexGrow: 1, padding: 10, alignItems: 'center' }}>
          <Box width="100%" alignItems="center">
            <Box
              width="full"
              rounded="lg"
              borderWidth={0.2}
              borderColor="#fff"
              p={4}
              style={{
                elevation: 6,
                shadowColor: "#fff",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0,
                shadowRadius: 0,
              }}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <TextBase fontSize="md" fontWeight="medium" color={"warning.100"}>Religious Details</TextBase>
              </HStack>
              <FormControl mt={2}>
                <Stack space={1}>
                  {Object.entries(data).map(([key, value], index) => {
                    const normalizedKey = key
                    .replace(/\s/g, '')
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .toLowerCase(); 
                  

                      const isHidden = hiddenFieldsValue.includes(normalizedKey);

                      return (
                        <View key={index}>
                          <TextBase marginBottom={2} color={'amber.500'} fontSize={13}>{key}</TextBase>

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
                                    <FIcon name="eye-off" size={16} color="#b91c1c" marginRight={4} />
                                    <View>
                                      <Text
                                        style={{
                                          color: '#b91c1c',
                                          fontWeight: 'bold',
                                          fontSize: 12,
                                          textAlign: 'center'
                                        }}
                                      >
                                        The user restricted this field
                                      </Text>
                                    </View>
                                  </View>
                                  <TouchableOpacity
                                    style={{
                                      borderRadius: 6,
                                      alignItems: 'center',
                                      flexDirection: 'row',
                                      marginBottom: 8,
                                    }}
                                    onPress={() => {
                                      horoscopePermission
                                        ? handleHoroscopePermissionCancel()
                                        : handleHoroscopePermissionRequest();
                                    }}
                                  >
                                    <Text
                                      style={{
                                        backgroundColor: '#ffe0e0',
                                        padding: 10,
                                        borderRadius: 6,
                                        color: '#b91c1c',
                                        fontWeight: 'bold',
                                        fontSize: 12,
                                      }}
                                    >
                                      {horoscopePermission ? 'Cancel Request' : 'Ask Permission'}
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
                                  <Text style={{ color: '#1e40af', fontWeight: 'bold', fontSize: 12 }}>
                                    View Horoscope
                                  </Text>
                                </TouchableOpacity>
                              )
                            ) : (
                              <View
                                style={{
                                  backgroundColor: '#FFD700',
                                  padding: 6,
                                  borderRadius: 6,
                                  alignItems: 'center',
                                  flexDirection: 'row',
                                  marginBottom: 8,
                                  width: '75%'
                                }}
                              >
                                <FIcon name="lock" size={16} color="#1e40af" marginRight={4} />
                                <Text
                                  style={{
                                    color: '#1e40af',
                                    fontWeight: 'bold',
                                    fontSize: 12,
                                    textAlign: 'center'
                                  }}
                                >
                                  Only Premium Members can see
                                </Text>
                              </View>
                            )
                          ) : key === 'Star' || key === 'Moonsign' || key === 'Dosham' ? (
                            isPremium ? (
                              isHidden ? (
                                <View
                                  style={{
                                    backgroundColor: '#FFD700',
                                    padding: 6,
                                    borderRadius: 6,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    marginBottom: 8,
                                    width: '75%'
                                  }}
                                >
                                  <FIcon name="lock" size={16} color="#1e40af" marginRight={4} />
                                  <Text
                                    style={{
                                      color: '#1e40af',
                                      fontWeight: 'bold',
                                      fontSize: 12,
                                      textAlign: 'center'
                                    }}
                                  >
                                    Only Premium Members can see
                                  </Text>
                                </View>
                              ) : (
                                <Input
                                  type="text"
                                  defaultValue={value}
                                  borderWidth={0}
                                  p={0}
                                  fontWeight="semibold"
                                  fontSize={14}
                                  color={'#F5F5F5'}
                                  isReadOnly
                                  _focus={{ borderWidth: 0, backgroundColor: 'transparent' }}
                                />
                              )
                            ) : (
                              <View
                                style={{
                                  backgroundColor: '#FFD700',
                                  padding: 6,
                                  borderRadius: 6,
                                  alignItems: 'center',
                                  flexDirection: 'row',
                                  marginBottom: 8,
                                  width: '75%'
                                }}
                              >
                                <FIcon name="lock" size={16} color="#1e40af" marginRight={4} />
                                <Text
                                  style={{
                                    color: '#1e40af',
                                    fontWeight: 'bold',
                                    fontSize: 12,
                                    textAlign: 'center'
                                  }}
                                >
                                  Only Premium Members can see
                                </Text>
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
                              color={'#F5F5F5'}
                              isReadOnly
                              _focus={{ borderWidth: 0, backgroundColor: 'transparent' }}
                            />
                          )}
                          {index < Object.keys(data).length - 1 && (
                            <Divider my={2} height={'0.4px'} _light={{ bg: "blueGray.100" }} />
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
    </NativeBaseProvider>
  );
};

const ThirdRoute = ({ data, isPremium }: { data: any; isPremium: boolean }) => (
  <NativeBaseProvider>
    <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: 'rgba(30,64,175,1.00)' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}>
        <View style={{ flexGrow: 1, padding: 10, alignItems: 'center' }}>
          {renderDetailBox('Education Details', data, undefined, isPremium)}
        </View>
      </ScrollView>
    </SafeAreaView>
  </NativeBaseProvider>
);

const FourthRoute = ({ data, isPremium }: { data: any; isPremium: boolean }) => (
  <NativeBaseProvider>
    <SafeAreaView edges={['right', 'left', 'top']} style={{ flex: 1, backgroundColor: 'rgba(30,64,175,1.00)' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        <View style={{ flexGrow: 1, padding: 10, alignItems: 'center' }}>
          {renderDetailBox('Family Details', data, undefined, isPremium)}
        </View>
      </ScrollView>
    </SafeAreaView>
  </NativeBaseProvider>
);

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
  // console.log("Received hidden fields in ProfileDetailTab:", hiddenFields);
  // console.log("Received premium fields in ProfileDetailTab:", isPremium);
  // console.log("Received profile detail ID in ProfileDetailTab:", profileDetailId);
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [horoscopeUri, setHoroscopeUri] = useState<string | null>(null);
  const [profileDetailIdValue, setProfileDetailIdValue] = useState<any>(null);

  useEffect(() => {
    setProfileDetailIdValue(profileDetailId);
  }, [profileDetailId]);  
  const handleHoroscopePress = (uri: string) => {
    setHoroscopeUri(uri);
    setIsModalVisible(true);
  };

  const personalDetail1 = personalDetail?.[0]?.data;
  const religiousDetail = personalDetail?.[1]?.data;
  const educationDetail = personalDetail?.[2]?.data;
  const familyDetail = personalDetail?.[3]?.data;

  // console.log("family detail ---------------------------- =============>", familyDetail);

  const renderScene = SceneMap({
    first: (props: any) => <FirstRoute {...props} data={personalDetail1} isPremium={isPremium} hiddenFieldsValue={hiddenFields} onImagePress={onImagePress} profileDetailIdValue={profileDetailIdValue} />,
    second: (props: any) => <SecondRoute {...props} data={religiousDetail} onHoroscopePress={handleHoroscopePress} isPremium={isPremium} hiddenFieldsValue={hiddenFields} profileDetailIdValue={profileDetailIdValue}/>,
    third: (props: any) => <ThirdRoute {...props} data={educationDetail} isPremium={isPremium} hiddenFieldsValue={hiddenFields} />,
    fourth: (props: any) => <FourthRoute {...props} data={familyDetail} isPremium={isPremium} hiddenFieldsValue={hiddenFields} />
  });

  return (
    <View style={{ flex: 1 }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            style={{
              backgroundColor: 'rgba(30,64,175,1.00)',
              borderBottomColor: '#FFD700',
              borderTopColor: '#fff',
              borderTopEndRadius: 30,
              borderTopStartRadius: 30,
              marginTop: 0
            }}
            indicatorStyle={{
              backgroundColor: '#FFD700',
              height: 1,
            }}
          />
        )}
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