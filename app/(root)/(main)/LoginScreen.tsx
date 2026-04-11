import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Dimensions, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { webSocketService } from '../services/webSocketService';
import { Avatar, NativeBaseProvider } from 'native-base';
import { saveDeviceInfo } from '../../../utils/deviceInfo';
import { useUserData } from '../contexts/UserDataContext';
import CommonPopup from '../../../components/CommonPopup';
import { usePopup } from '../contexts/PopupContext';

interface LoginScreenProps {
  onForgetPin?: () => void;
}

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = ({ onForgetPin = () => {} }) => {
  const { loadUserData } = useUserData();
  const popup = usePopup();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [mobileNumber, setMobileNumber] = useState('')
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (phoneNumber.length !== 10 || pin.length !== 4) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      popup.success('Success', 'Login successful!');
    }, 1500);
  };


  const handleLogin = async () => {
      try {
    if (mobileNumber.length !== 10 || pin.length !== 4) return;

          const request = {
              mobile: mobileNumber,
              pin: pin
          }
          const response = await userApi.login(request)
          // console.log('Login response:', response.data)
          if(response.data.code === 200){
              // Store JWT token for authenticated API calls
              if (response.data.data.token) {
                await AsyncStorage.setItem('authToken', response.data.data.token)
              }
              if (response.data.data.refreshToken) {
                await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken)
              }
              // Store only non-null values
              await AsyncStorage.setItem('userId', response.data.data.userId)
              await AsyncStorage.setItem('mobileNumber', mobileNumber)
              
              // Only store profileImage if it exists
              if (response.data.data.profileImage) {
                  await AsyncStorage.setItem('profileImage', response.data.data.profileImage)
              }
              // console.log("response.data.data.isUser===================>",response.data.data.isUser);
              
              
              await AsyncStorage.setItem('firstName', response.data.data.firstName || '')
              await AsyncStorage.setItem('lastName', response.data.data.lastName || '')
              await AsyncStorage.setItem('gender', response.data.data.gender || '')
              await AsyncStorage.setItem('location', response.data.data.location || '')
              if (response.data.data.casteId) {
                await AsyncStorage.setItem('casteId', response.data.data.casteId.toString());
              }
              await AsyncStorage.setItem('isUser', response.data.data.isUser || '');
              // Store role: 'PARENT' for family logins, 'USER' for normal members
              await AsyncStorage.setItem('userRole', response.data.data.role || 'USER');
              if (response.data.data.familyLoginId) {
                await AsyncStorage.setItem('familyLoginId', String(response.data.data.familyLoginId));
                await AsyncStorage.setItem('parentName', response.data.data.parentName || '');
                await AsyncStorage.setItem('relationship', response.data.data.relationship || '');
              } else {
                await AsyncStorage.removeItem('familyLoginId');
                await AsyncStorage.removeItem('parentName');
                await AsyncStorage.removeItem('relationship');
              }
              await AsyncStorage.setItem('hasStarted', 'true')

              // Store profile approval status. Default to APPROVED when the
              // backend doesn't send it (legacy payloads) — only PENDING/REJECTED
              // should actually hold users on the verification screen.
              const userStatus = response.data.data.userStatus || 'APPROVED';
              await AsyncStorage.setItem('userStatus', userStatus);
              if (response.data.data.rejectionReason) {
                await AsyncStorage.setItem('rejectionReason', response.data.data.rejectionReason);
              } else {
                await AsyncStorage.removeItem('rejectionReason');
              }

              // Initialize WebSocket connection if not already connected
              try {
                  if (!webSocketService.socket) {
                      await webSocketService.connect(response.data.data.userId);
                  }
              } catch (error) {
                  console.error('Error initializing WebSocket connection:', error);
              }

              // Save device info and then navigate
              try {
                await saveDeviceInfo(response.data.data.userId);
              } catch (error) {
                console.error('Error saving device info:', error);
              }

              // Refresh user data context with the freshly stored values
              await loadUserData();

              const name = response.data.data.firstName || 'there';
              setWelcomeName(name);
              setPendingNavigation(() => () => {
                // Only hold on the verification screen when explicitly pending/rejected
                if (userStatus === 'PENDING' || userStatus === 'REJECTED') {
                  router.replace('/(root)/(main)/ProfileUnderVerificationScreen');
                } else {
                  router.replace('/(root)/(tabs)');
                }
              });
              setWelcomeVisible(true);
          }else if(response.data.code === 404){
            popup.error('Not Registered', 'This mobile number is not registered. Please sign up first.')
          }else if(response.data.code === 401){
            popup.error('Invalid PIN', 'The PIN you entered is incorrect. Please try again.')
          }else if(response.data.code === 403){
            popup.error('Account Blocked', response.data.message || 'Your account has been blocked by the administrator.')
          }else{
            popup.error('Login Failed', 'Something went wrong. Please try again.')
          }
      } catch (error) {
          console.error('Login error:', error)
      }
  }

  const isFormValid = mobileNumber.length === 10 && pin.length === 4;

  return (
    <NativeBaseProvider>
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <View style={{ position: 'absolute', top: 70, left:10, zIndex: 199 }}>
                <View style={{ backgroundColor: '#420001', borderRadius: 999, padding: 0 }}>
                  <TouchableOpacity 
                  onPress={() => router.back()}
                  style={{ padding: 5 }}
                >
                  <Icon name="arrow-back" size={24} color="#DADADA" />
                </TouchableOpacity>
                </View>
              </View>
         
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 40,
              backgroundColor: '#F5F5F5'
            }}>
              <View style={{ width: '100%', maxWidth: 400 }}>
                {/* Elegant Header with Traditional Elements */}
                <View style={{ alignItems: 'center', marginBottom: 30 }}>
                  {/* Logo with Traditional Design */}
                  <View style={{ position: 'relative', marginBottom: 24 }}>
                    <LinearGradient
                      colors={['#F5F5F5', '#e0e0e0', '#F5F5F5']}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.3,
                        shadowRadius: 16,
                        elevation: 16,
                      }}
                    >
                      {/* Inner decorative ring */}
                      <View style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        right: 8,
                        bottom: 8,
                        borderRadius: 40,
                        borderWidth: 2,
                        borderColor: 'rgba(19, 0, 87, 0.3)',
                      }} />
                      <View style={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        right: 16,
                        bottom: 16,
                        borderRadius: 32,
                        borderWidth: 1,
                        borderColor: 'rgba(19, 0, 87, 0.2)',
                      }} />

                      {/* Main Icon */}
                      <View style={{ position: 'relative', zIndex: 10 }}>
                        <Avatar size={59} source={require('/assets/images/LotusLogo.jpeg')} />
                        {/* <Icon name="favorite" size={40} color="#130057" /> */}
                        {/* <Icon
                          name="star"
                          size={24}
                          color="#130057"
                          style={{ position: 'absolute', top: -8, right: -4 }}
                        /> */}
                      </View>

                      {/* Sparkle Effects */}
                      <Icon
                        name="auto-awesome"
                        size={16}
                        color="#130057"
                        style={{ position: 'absolute', top: 8, left: 8, opacity: 0.6 }}
                      />
                      <Icon
                        name="auto-awesome"
                        size={12}
                        color="#130057"
                        style={{ position: 'absolute', bottom: 12, right: 8, opacity: 0.6 }}
                      />
                    </LinearGradient>

                    {/* Decorative Elements Around Logo */}
                    <View style={{
                      position: 'absolute',
                      top: -8,
                      left: -8,
                      width: 24,
                      height: 24,
                      borderWidth: 2,
                      borderColor: 'rgba(245, 245, 245, 0.6)',
                      borderRadius: 12,
                    }} />
                    <View style={{
                      position: 'absolute',
                      bottom: -8,
                      right: -8,
                      width: 16,
                      height: 16,
                      backgroundColor: 'rgba(245, 245, 245, 0.6)',
                      borderRadius: 8,
                    }} />
                  </View>

                  <Text style={{
                    fontSize: 25,
                    fontWeight: 'bold',
                    color: '#420001',
                    marginBottom: 12,
                    textAlign: 'center',
                    // textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    // textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 4,
                  }}>
                    Vaibhav Vivaaha Matrimony
                  </Text>
                  <Text style={{
                    // color: '#f5f5f5',
                    fontSize: 18,
                    fontWeight: '500',
                    textAlign: 'center',
                    opacity: 0.9,
                  }}>
Turning Matches Into Lasting Marriages                 
 </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 8,
                  }}>
                    <View style={{
                      width: 48,
                      height: 2,
                      backgroundColor: 'rgba(245, 245, 245, 0.3)',
                    }} />
                    <Icon name="favorite" size={16} color="rgba(245, 245, 245, 0.4)" style={{ marginHorizontal: 8 }} />
                    <View style={{
                      width: 48,
                      height: 2,
                      backgroundColor: 'rgba(245, 245, 245, 0.3)',
                    }} />
                  </View>
                </View>

                {/* Elegant Login Card */}
                <View style={{ position: 'relative' }}>
                  {/* Card Background */}
                  <View style={{
                    backgroundColor: 'white',
                    borderRadius: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 16 },
                    shadowOpacity: 0.2,
                    shadowRadius: 24,
                    elevation: 24,
                  }}>
                    {/* Decorative Corner Elements */}
                    <View style={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      width: 32,
                      height: 32,
                      borderLeftWidth: 2,
                      borderTopWidth: 2,
                      borderColor: '#420001',
                      borderTopLeftRadius: 8,
                    }} />
                    <View style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      width: 32,
                      height: 32,
                      borderRightWidth: 2,
                      borderTopWidth: 2,
                      borderColor: '#420001',
                      borderTopRightRadius: 8,
                    }} />
                    <View style={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      width: 32,
                      height: 32,
                      borderLeftWidth: 2,
                      borderBottomWidth: 2,
                      borderColor: '#420001',
                      borderBottomLeftRadius: 8,
                    }} />
                    <View style={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      width: 32,
                      height: 32,
                      borderRightWidth: 2,
                      borderBottomWidth: 2,
                      borderColor: '#420001',
                      borderBottomRightRadius: 8,
                    }} />

                    <View style={{ padding: 40 }}>
                      <View style={{ gap: 32 }}>
                        {/* Phone Number Input */}
                        <View style={{ gap: 12 }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: '#130057',
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                          }}>
                            Contact Number
                          </Text>
                          <View style={{ position: 'relative' }}>
                            <View style={{
                              position: 'absolute',
                              left: 16,
                              top: 0,
                              bottom: 0,
                              justifyContent: 'center',
                              zIndex: 1,
                            }}>
                              <Icon name="phone" size={20} color="#130057" />
                            </View>
                            <TextInput
                              defaultValue={mobileNumber}
                              onChangeText={(text) => setMobileNumber(text.replace(/\D/g, '').slice(0, 10))}
                              style={{
                                paddingLeft: 48,
                                paddingRight: 16,
                                paddingVertical: 16,
                                backgroundColor: 'rgba(245, 245, 245, 0.8)',
                                borderWidth: 2,
                                borderColor: 'rgba(19, 0, 87, 0.1)',
                                borderRadius: 16,
                                fontSize: 14,
                                fontWeight: '500',
                                color: '#130057',
                              }}
                              placeholder="N U M B E R"
                              placeholderTextColor="rgba(19, 0, 87, 0.4)"
                              keyboardType="numeric"
                              maxLength={10}
                            />
                            {mobileNumber.length === 10 && (
                              <View style={{
                                position: 'absolute',
                                right: 16,
                                top: 0,
                                bottom: 0,
                                justifyContent: 'center',
                              }}>
                                <View style={{
                                  width: 8,
                                  height: 8,
                                  backgroundColor: '#4CAF50',
                                  borderRadius: 4,
                                }} />
                              </View>
                            )}
                          </View>
                          {mobileNumber.length > 0 && mobileNumber.length !== 10 && (
                            <Text style={{
                              fontSize: 14,
                              color: '#f44336',
                              fontWeight: '500',
                            }}>
                              Please enter a complete 10-digit number
                            </Text>
                          )}
                        </View>

                        {/* PIN Input */}
                        <View style={{ gap: 12 }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: '#130057',
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                          }}>
                            PIN
                          </Text>
                          <View style={{ position: 'relative' }}>
                            <View style={{
                              position: 'absolute',
                              left: 16,
                              top: 0,
                              bottom: 0,
                              justifyContent: 'center',
                              zIndex: 1,
                            }}>
                              <Icon name="lock" size={20} color="#130057" />
                            </View>
                            <TextInput
                              defaultValue={pin}
                              onChangeText={(text) => setPin(text.replace(/\D/g, '').slice(0, 4))}
                              style={{
                                paddingLeft: 48,
                                paddingRight: 56,
                                paddingVertical: 16,
                                backgroundColor: 'rgba(245, 245, 245, 0.8)',
                                borderWidth: 2,
                                borderColor: 'rgba(19, 0, 87, 0.1)',
                                borderRadius: 16,
                                fontSize: 14,
                                fontWeight: '500',
                                color: '#130057',
                                letterSpacing: 8,
                              }}
                              placeholder="PIN"
                              placeholderTextColor="rgba(19, 0, 87, 0.4)"
                              secureTextEntry={!showPin}
                              keyboardType="numeric"
                              maxLength={4}
                            />
                            <TouchableOpacity
                              onPress={() => setShowPin(!showPin)}
                              style={{
                                position: 'absolute',
                                right: 16,
                                top: 0,
                                bottom: 0,
                                justifyContent: 'center',
                              }}
                            >
                              <Icon
                                name={showPin ? 'visibility-off' : 'visibility'}
                                size={20}
                                color="rgba(19, 0, 87, 0.4)"
                              />
                            </TouchableOpacity>
                          </View>
                          {pin.length > 0 && pin.length !== 4 && (
                            <Text style={{
                              fontSize: 14,
                              color: '#f44336',
                              fontWeight: '500',
                            }}>
                              PIN must be exactly 4 digits
                            </Text>
                          )}
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                          onPress={handleLogin}
                          disabled={!isFormValid || isLoading}
                         
                        >
                          <LinearGradient
                            colors={isFormValid && !isLoading ? ['#420001', '#420001'] : ['#cccccc', '#999999']}
                            style={{
                              paddingVertical: 16,
                              paddingHorizontal: 24,
                              borderRadius: 16,
                              alignItems: 'center',
                              // shadowColor: '#000',
                              // shadowOffset: { width: 0, height: 8 },
                              // shadowOpacity: 0.3,
                              // shadowRadius: 16,
                              // elevation: 8,
                            }}
                          >
                            {isLoading ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{
                                  color: '#DADADA',
                                  fontSize: 18,
                                  fontWeight: 'bold',
                                  marginLeft: 12,
                                }}>
                                  Entering Portal...
                                </Text>
                              </View>
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="favorite" size={20} color="white" />
                                <Text style={{
                                  color: '#DADADA',
                                  fontSize: 18,
                                  fontWeight: 'bold',
                                  marginLeft: 8,
                                }}>
                                  Begin Your Journey
                                </Text>
                              </View>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Forget PIN */}
                        <View style={{ alignItems: 'center', paddingTop: 16 }}>
                          <TouchableOpacity
                            onPress={() => router.push('/(root)/(main)/ResetPasswordScreen')}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                          >
                            <Icon name="lock" size={16} color="#130057" />
                            <Text style={{
                              color: '#130057',
                              fontWeight: '600',
                              marginLeft: 8,
                              textDecorationLine: 'underline',
                            }}>
                              Forgotten PIN?
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View style={{ alignItems: 'center', marginTop: 32 }}>
                  <Text style={{
                    color: 'rgba(245, 245, 245, 0.7)',
                    fontWeight: '500',
                    textAlign: 'center',
                  }}>
💍 United by Love • Guided by Tradition • Blessed for Life 💍                  </Text>
                </View>
              </View>
            </View>
          </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
    </View>
    <CommonPopup
      visible={welcomeVisible}
      variant="success"
      title="Welcome!"
      description={`Hi ${welcomeName}, you have logged in successfully.`}
      dismissable={false}
      buttons={[
        {
          text: 'Continue',
          variant: 'primary',
          onPress: () => {
            setWelcomeVisible(false);
            pendingNavigation?.();
          },
        },
      ]}
    />
    </NativeBaseProvider>

  );
};

export default LoginScreen;