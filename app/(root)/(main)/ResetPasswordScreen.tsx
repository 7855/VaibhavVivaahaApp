import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Dimensions, KeyboardAvoidingView, TouchableWithoutFeedback, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { NativeBaseProvider } from 'native-base';
import { usePopup } from '../contexts/PopupContext';

interface ResetPasswordScreenProps {
  onBack: () => void;
  onContinue: (email: string) => void;
}

const { width, height } = Dimensions.get('window');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onBack, onContinue }) => {
  const router = useRouter();
  const popup = usePopup();
  const [email, setEmail] = useState('');
  // Kept as `phoneNumber` state variable alias for minimal JSX changes below
  const phoneNumber = email;
  const setPhoneNumber = setEmail;
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!EMAIL_REGEX.test(email)) return;
    setIsLoading(true);

    try {
      const response = await userApi.forgotPassword({ email });
      console.log('Forgot-password response:', response.data.code);

      if (response.data.code === 200) {
        await AsyncStorage.setItem('resetEmail', email);
        setIsLoading(false);
        popup.success(
          'OTP Sent',
          `A reset code has been sent to ${email}. Please check your inbox.`,
          () => {
            router.push({
              pathname: '/(root)/(main)/OTPValidationScreen',
              params: { email, purpose: 'reset' },
            });
          }
        );
      } else if (response.data.code === 404) {
        setIsLoading(false);
        popup.error('Not Registered', 'No account found with this email address.');
      } else {
        setIsLoading(false);
        popup.error('Error', response.data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setIsLoading(false);
      popup.error('Error', 'Failed to send OTP. Please try again.');
    }
  };

  const isFormValid = EMAIL_REGEX.test(email);

  return (
    // <KeyboardAvoidingView
    //   style={{
    //     flex: 1,
    //     justifyContent: 'center',
    //     backgroundColor: '#f9fafb',
    //   }}
    //   behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    // >
    <NativeBaseProvider>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 40,
    }}>
      {/* Same soft blue theme gradient used app-wide (explore.tsx, sign-up.tsx, LoginScreen.tsx)
          instead of the flat '#F5F5F5' this screen had. */}
      <LinearGradient
        colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
        locations={[0, 0.3, 0.6, 1.0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ width: '100%', maxWidth: 400 }}>
        {/* Sacred Header */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ position: 'relative', marginBottom: 24 }}>
            <LinearGradient
              colors={['#eaf2fc', '#d0dfeb', '#eaf2fc']}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 16,
              }}
            >
              {/* Inner rings */}
              <View style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                bottom: 8,
                borderRadius: 32,
                borderWidth: 2,
                borderColor: 'rgba(31, 127, 229, 0.35)',
              }} />
              <View style={{
                position: 'absolute',
                top: 12,
                left: 12,
                right: 12,
                bottom: 12,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(31, 127, 229, 0.25)',
              }} />

              {/* Shield icon */}
              <Icon name="security" size={36} color="#1F7FE5" />

              {/* Floating elements */}
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 12,
                height: 12,
                backgroundColor: 'rgba(31, 127, 229, 0.3)',
                borderRadius: 6,
              }} />
              <View style={{
                position: 'absolute',
                bottom: -4,
                left: -4,
                width: 8,
                height: 8,
                backgroundColor: 'rgba(31, 127, 229, 0.3)',
                borderRadius: 4,
              }} />
            </LinearGradient>
            
            {/* Sacred geometry around logo */}
            <View style={{
              position: 'absolute',
              top: -12,
              left: '50%',
              marginLeft: -16,
              width: 32,
              height: 8,
              backgroundColor: 'rgba(245, 245, 245, 0.3)',
              borderRadius: 4,
            }} />
            <View style={{
              position: 'absolute',
              bottom: -12,
              left: '50%',
              marginLeft: -12,
              width: 24,
              height: 4,
              backgroundColor: 'rgba(245, 245, 245, 0.3)',
              borderRadius: 2,
            }} />
          </View>
          
          <Text style={{
            fontSize: 20,
            fontFamily: 'Rubik-Bold',
            color: '#0f1724',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Forgot Password
          </Text>
          <Text style={{
            fontSize: 12,
            fontFamily: 'Rubik-Regular',
            color: '#64748b',
            textAlign: 'center',
          }}>
            Restore access to your heart connection
          </Text>
          
          {/* Decorative divider */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
          }}>
            <View style={{
              width: 32,
              height: 2,
              backgroundColor: '#1F7FE5',
            }} />
            <Icon name="spa" size={16} color="#1F7FE5" style={{ marginHorizontal: 12 }} />
            <View style={{
              width: 32,
              height: 2,
              backgroundColor: '#1F7FE5',
            }} />
          </View>
        </View>

        {/* Sacred Recovery Card */}
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
            {/* Traditional corner decorations */}
            <View style={{
              position: 'absolute',
              top: 12,
              left: 12,
              width: 40,
              height: 40,
              borderLeftWidth: 3,
              borderTopWidth: 3,
              borderColor: '#1F7FE5',
              borderTopLeftRadius: 16,
            }} />
            <View style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 40,
              height: 40,
              borderRightWidth: 3,
              borderTopWidth: 3,
              borderColor: '#1F7FE5',
              borderTopRightRadius: 16,
            }} />
            <View style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              width: 40,
              height: 40,
              borderLeftWidth: 3,
              borderBottomWidth: 3,
              borderColor: '#1F7FE5',
              borderBottomLeftRadius: 16,
            }} />
            <View style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: 40,
              height: 40,
              borderRightWidth: 3,
              borderBottomWidth: 3,
              borderColor: '#1F7FE5',
              borderBottomRightRadius: 16,
            }} />
            
            {/* Decorative patterns */}
            <View style={{
              position: 'absolute',
              top: 24,
              left: '50%',
              marginLeft: -32,
              width: 64,
              height: 4,
              backgroundColor: 'rgba(15, 23, 42, 0.06)',
              borderRadius: 2,
            }} />
            <View style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              marginLeft: -24,
              width: 48,
              height: 2,
              backgroundColor: 'rgba(15, 23, 42, 0.06)',
              borderRadius: 1,
            }} />
            
            <View style={{ padding: 36 }}>
              <View style={{ gap: 28 }}>
                {/* Sacred Mobile Input */}
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="email" size={16} color="#1F7FE5" />
                    <Text style={{
                      fontSize: 12,
                      fontFamily: 'Rubik-Bold',
                      color: '#0f1724',
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                      marginLeft: 8,
                    }}>
                      Registered Email
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
                      <Icon name="email" size={20} color="#1F7FE5" />
                    </View>
                    <TextInput
                      defaultValue={phoneNumber}
                      onChangeText={(text) => setPhoneNumber(text)}
                      style={{
                        paddingLeft: 48,
                        paddingRight: 16,
                        paddingVertical: 16,
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        borderRadius: 16,
                        fontSize: 14,
                        fontFamily: 'Rubik-Regular',
                        color: '#333',
                      }}
                      placeholder="Enter your email"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {EMAIL_REGEX.test(phoneNumber) && (
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
                  {phoneNumber.length > 0 && !EMAIL_REGEX.test(phoneNumber) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 4,
                        height: 4,
                        backgroundColor: '#dc2626',
                        borderRadius: 2,
                        marginRight: 8,
                      }} />
                      <Text style={{
                        fontSize: 14,
                        color: '#dc2626',
                        fontFamily: 'Rubik-Regular',
                      }}>
                        Please enter a valid email address
                      </Text>
                    </View>
                  )}
                </View>

                {/* Sacred Continue Button */}
                <TouchableOpacity
                  onPress={handleContinue}
                  disabled={!isFormValid || isLoading}
               
                >
                  <LinearGradient
                    colors={isFormValid && !isLoading ? ['#1F7FE5', '#1862b8'] : ['#cccccc', '#999999']}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 24,
                      borderRadius: 16,
                      alignItems: 'center',
                    }}
                  >
                    {isLoading ? (
                      // No icon precedes this text (unlike the non-loading state below), so the
                      // leftover `marginLeft: 12` it was copy-pasted with just indented it off
                      // center for no reason — removed.
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                          color: '#fff',
                          fontSize: 16,
                          fontFamily: 'Rubik-Bold',
                        }}>
                          Sending Code...
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="security" size={20} color="white" />
                        <Text style={{
                          color: '#fff',
                          fontSize: 16,
                          fontFamily: 'Rubik-Bold',
                          marginLeft: 8,
                        }}>
                          Send Verification Code
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Sacred Back Button */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 16,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: '#e2e8f0',
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="arrow-back" size={20} color="#475569" />
                  <Text style={{
                    color: '#475569',
                    fontSize: 14,
                    fontFamily: 'Rubik-Medium',
                    marginLeft: 8,
                  }}>
                    Return to Login Screen
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* VVM Assurance note removed */}
      </View>
    </View>
      </TouchableWithoutFeedback>
    </NativeBaseProvider>
    // </KeyboardAvoidingView>

  );
};

export default ResetPasswordScreen;