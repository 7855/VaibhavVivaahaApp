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
    setIsLoading(true);

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

              // Save device info in background — don't block login
              saveDeviceInfo(response.data.data.userId).catch(() => {});

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
          popup.error('Login Failed', 'Network error. Please check your connection and try again.');
      } finally {
          setIsLoading(false);
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
              {/* Back button */}
              <View style={{ position: 'absolute', top: 60, left: 16, zIndex: 199 }}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
                >
                  <Icon name="arrow-back" size={20} color="#0f1724" />
                </TouchableOpacity>
              </View>

            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 40,
            }}>
              <View style={{ width: '100%', maxWidth: 400 }}>
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: 30 }}>
                  <View style={{ position: 'relative', marginBottom: 24 }}>
                    <LinearGradient
                      colors={['#F5F5F5', '#e0e0e0', '#F5F5F5']}
                      style={{
                        width: 96, height: 96, borderRadius: 48,
                        justifyContent: 'center', alignItems: 'center',
                        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 16,
                      }}
                    >
                      <View style={{ position: 'relative', zIndex: 10 }}>
                        <Avatar size={59} source={require('/assets/images/LotusLogo.jpeg')} />
                      </View>
                    </LinearGradient>
                  </View>

                  <Text style={{
                    fontSize: 24,
                    fontFamily: 'Rubik-Medium',
                    color: '#5C1A1B',
                    marginBottom: 8,
                    textAlign: 'center',
                  }}>
                    Vaibhav Vivaaha Matrimony
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: 'Rubik-Medium',
                    color: '#8a7a6d',
                    textAlign: 'center',
                  }}>
                    Turning Matches Into Lasting Marriages
                  </Text>
                </View>

                {/* Login Card — same as Forgot Password card */}
                <View style={{ position: 'relative' }}>
                  <View style={{
                    backgroundColor: 'white',
                    borderRadius: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 16 },
                    shadowOpacity: 0.2,
                    shadowRadius: 24,
                    elevation: 24,
                  }}>
                    {/* Corner decorations */}
                    <View style={{ position: 'absolute', top: 12, left: 12, width: 40, height: 40, borderLeftWidth: 3, borderTopWidth: 3, borderColor: '#1F7FE5', borderTopLeftRadius: 16 }} />
                    <View style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRightWidth: 3, borderTopWidth: 3, borderColor: '#1F7FE5', borderTopRightRadius: 16 }} />
                    <View style={{ position: 'absolute', bottom: 12, left: 12, width: 40, height: 40, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: '#1F7FE5', borderBottomLeftRadius: 16 }} />
                    <View style={{ position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderRightWidth: 3, borderBottomWidth: 3, borderColor: '#1F7FE5', borderBottomRightRadius: 16 }} />

                    <View style={{ padding: 36 }}>
                      <View style={{ gap: 28 }}>
                        {/* Phone Number Input */}
                        <View style={{ gap: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name="phone" size={16} color="#130057" />
                            <Text style={{
                              fontSize: 12,
                              fontFamily: 'Rubik-Bold',
                              color: '#130057',
                              letterSpacing: 1,
                              textTransform: 'uppercase',
                              marginLeft: 8,
                            }}>
                              Contact Number
                            </Text>
                          </View>
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
                              testID="input-mobile"
                              accessibilityLabel="input-mobile"
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
                                fontFamily: 'Rubik-Medium',
                                color: '#130057',
                              }}
                              placeholder="Enter mobile number"
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
                              fontFamily: 'Rubik-Medium',
                            }}>
                              Please enter a complete 10-digit number
                            </Text>
                          )}
                        </View>

                        {/* PIN Input */}
                        <View style={{ gap: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name="lock" size={16} color="#130057" />
                            <Text style={{
                              fontSize: 12,
                              fontFamily: 'Rubik-Bold',
                              color: '#130057',
                              letterSpacing: 1,
                              textTransform: 'uppercase',
                              marginLeft: 8,
                            }}>
                              PIN
                            </Text>
                          </View>
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
                              testID="input-pin"
                              accessibilityLabel="input-pin"
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
                                fontFamily: 'Rubik-Medium',
                                color: '#130057',
                              }}
                              placeholder="Enter PIN"
                              placeholderTextColor="rgba(19, 0, 87, 0.25)"
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
                              fontFamily: 'Rubik-Medium',
                            }}>
                              PIN must be exactly 4 digits
                            </Text>
                          )}
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                          testID="btn-sign-in"
                          accessibilityLabel="btn-sign-in"
                          onPress={handleLogin}
                          disabled={!isFormValid || isLoading}

                        >
                          <LinearGradient
                            colors={isFormValid && !isLoading ? ['#1F7FE5', '#1F7FE5'] : ['#cccccc', '#999999']}
                            style={{
                              paddingVertical: 16,
                              paddingHorizontal: 24,
                              borderRadius: 16,
                              alignItems: 'center',
                            }}
                          >
                            {isLoading ? (
                              <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Rubik-Bold' }}>
                                Signing in...
                              </Text>
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="favorite" size={20} color="white" />
                                <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Rubik-Bold', marginLeft: 8 }}>
                                  Sign In
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
                              fontFamily: 'Rubik-Medium',
                              marginLeft: 8,
                              textDecorationLine: 'underline',
                            }}>
                              Forgot PIN?
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Sign up link */}
                <View style={{ alignItems: 'center', marginTop: 24 }}>
                  <Text style={{ fontSize: 13, color: '#8a7a6d' }}>
                    Don't have an account?{' '}
                    <Text style={{ color: '#5C1A1B', fontFamily: 'Rubik-Medium' }} onPress={() => router.push('/(root)/(main)/sign-up')}>
                      Sign Up
                    </Text>
                  </Text>
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