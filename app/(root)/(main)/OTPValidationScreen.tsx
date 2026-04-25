import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Dimensions, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { NativeBaseProvider } from 'native-base';
import { usePopup } from '../contexts/PopupContext';

interface OTPValidationScreenProps {
  onBack: () => void;
  onVerified: () => void;
}

export default function OTPValidationScreen({ onBack, onVerified }: OTPValidationScreenProps) {
  const router = useRouter();
  const popup = usePopup();
  const params = useLocalSearchParams<{
    phoneNumber?: string;
    email?: string;
    purpose?: string;
  }>();
  const phoneNumber = params.phoneNumber || '';
  const email = params.email || '';
  const purpose = params.purpose || ''; // 'registration' | 'reset' | ''
  const [phoneNumberState, setPhoneNumber] = useState('');
  const { width, height } = Dimensions.get('window');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otp.some(digit => !digit)) return;

    setIsLoading(true);

    try {
      const otpCode = otp.join('');

      // ===== Email-based flow (registration or reset) =====
      if (email && purpose) {
        const response = await userApi.verifyAuthOtp({
          email,
          otp: otpCode,
          purpose,
        });
        console.log('Verify Auth OTP response:', response.data);

        if (response.data?.code === 200) {
          setIsLoading(false);

          if (purpose === 'registration') {
            // Store verification token — signup screen will read this on return
            const token = response.data.data?.verificationToken;
            if (token) {
              await AsyncStorage.setItem('emailVerificationToken', token);
              await AsyncStorage.setItem('verifiedEmail', email);
            }
            popup.success('Email Verified', 'Your email has been verified successfully.', () => router.back());
          } else if (purpose === 'reset') {
            const resetToken = response.data.data?.resetToken;
            router.replace({
              pathname: '/(root)/(main)/SetNewPasswordScreen',
              params: { resetToken: resetToken || '' },
            });
          }
        } else {
          setIsLoading(false);
          popup.error('Invalid OTP', response.data?.message || 'Please enter a valid OTP');
          setOtp(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }
        return;
      }

      // ===== Legacy mobile-based flow =====
      const requestBody = {
        mobileNumber: await AsyncStorage.getItem('resetPhoneNumber'),
        otp: otpCode,
      };

      const response = await userApi.verifyOtp(requestBody);
      console.log('Verify OTP response:', response.data.code);

      if (response.data.code === 200) {
        setIsLoading(false);
        router.push({
          pathname: '/(root)/(main)/ChangePinScreen',
          params: { onComplete: 'onVerified' },
        });
      } else if (response.data.code === 400) {
        setIsLoading(false);
        popup.error('Invalid OTP', 'Please enter a valid OTP');
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setIsLoading(false);
        popup.error('Error', 'Something went wrong. Please try again.');
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setIsLoading(false);
      popup.error('Error', 'Failed to verify OTP. Please try again.');
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResendTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '']);
    inputRefs.current[0]?.focus();

    try {
      if (email && purpose) {
        await userApi.sendAuthOtp({ email, purpose });
        popup.success('OTP Resent', `A new code has been sent to ${email}.`);
      } else {
        const mobile = await AsyncStorage.getItem('resetPhoneNumber');
        if (mobile) {
          await userApi.sendOtp(mobile);
          popup.success('OTP Resent', 'A new code has been sent to your mobile.');
        }
      }
    } catch (err) {
      console.error('Resend OTP failed:', err);
      popup.error('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  const isFormValid = otp.every(digit => digit !== '');
  const maskedPhone = phoneNumberState ? phoneNumberState.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3') : '------';

  return (
    <NativeBaseProvider>
       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 40,
      backgroundColor: '#F5F5F5',
    }}>
      <View style={{ width: '100%', maxWidth: 400 }}>
        {/* Divine Header */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ position: 'relative', marginBottom: 24 }}>
            <LinearGradient
              colors={['#f5f5f5', '#e0e0e0', '#f5f5f5']}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
                // shadowColor: '#000',
                // shadowOffset: { width: 0, height: 8 },
                // shadowOpacity: 0.3,
                // shadowRadius: 16,
                // elevation: 16,
              }}
            >
              {/* Sacred inner circles */}
              <View style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                bottom: 8,
                borderRadius: 32,
                borderWidth: 2,
                borderColor: 'rgba(19, 0, 87, 0.4)',
              }} />
              <View style={{
                position: 'absolute',
                top: 12,
                left: 12,
                right: 12,
                bottom: 12,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(19, 0, 87, 0.3)',
              }} />
              
              {/* Message icon with divine aura */}
              <Icon name="message" size={36} color="#1F7FE5" />
              
              {/* Floating divine elements */}
              <Icon 
                name="star" 
                size={12} 
                color="rgba(19, 0, 87, 0.6)" 
                style={{ position: 'absolute', top: 4, right: 8 }} 
              />
              <Icon 
                name="auto-awesome" 
                size={8} 
                color="rgba(19, 0, 87, 0.6)" 
                style={{ position: 'absolute', bottom: 8, left: 4 }} 
              />
            </LinearGradient>
            
            {/* Sacred aura rings */}
            <View style={{
              position: 'absolute',
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              borderRadius: 48,
              borderWidth: 1,
              borderColor: 'rgba(245, 245, 245, 0.3)',
            }} />
            <View style={{
              position: 'absolute',
              top: -16,
              left: -16,
              right: -16,
              bottom: -16,
              borderRadius: 56,
              borderWidth: 1,
              borderColor: 'rgba(245, 245, 245, 0.2)',
            }} />
          </View>
          
          <Text style={{
            fontSize: 22,
            fontWeight: '600',
            color: '#5C1A1B',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            OTP Verification
          </Text>
          <Text style={{
            // color: '#f5f5f5',
            fontSize: 16,
            fontWeight: '500',
            textAlign: 'center',
            lineHeight: 24,
            opacity: 0.9,
          }}>
            4-Digit code sent to your Mobile number{'\n'}
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>+91 {maskedPhone}</Text>
          </Text>
          
          {/* Sacred divider with stars */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
          }}>
            <Icon name="star" size={12} color="#1F7FE5" />
            <View style={{
              width: 64,
              height: 2,
              backgroundColor: '#1F7FE5',
              marginHorizontal: 8,
            }} />
            <Icon name="star" size={12} color="#1F7FE5" />
          </View>
        </View>

        {/* Sacred OTP Card */}
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
            {/* Sacred corner ornaments */}
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
            
            {/* Divine energy lines */}
            <View style={{
              position: 'absolute',
              top: 24,
              left: '50%',
              marginLeft: -40,
              width: 80,
              height: 4,
              backgroundColor: 'rgba(19, 0, 87, 0.1)',
              borderRadius: 2,
            }} />
            <View style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              marginLeft: -32,
              width: 64,
              height: 2,
              backgroundColor: 'rgba(19, 0, 87, 0.1)',
              borderRadius: 1,
            }} />
            
            <View style={{ padding: 32 }}>
              <View style={{ gap: 28 }}>
                {/* Sacred OTP Input */}
                <View style={{ gap: 16 }}>
                  <View style={{ 
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}>
                    <Icon name="message" size={16} color="#130057" />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: '#130057',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginLeft: 8,
                    }}>
                      Enter 4 Digit Code
                    </Text>
                  </View>
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                    {otp.map((digit, index) => (
                      <View key={index} style={{ position: 'relative' }}>
                        <TextInput
                          ref={(el) => (inputRefs.current[index] = el)}
                          defaultValue={digit}
                          onChangeText={(text) => handleOtpChange(index, text.replace(/\D/g, ''))}
                          onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                          style={{
                            width: 48,
                            height: 56,
                            textAlign: 'center',
                            fontSize: 20,
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(245, 245, 245, 0.9)',
                            borderWidth: 2,
                            borderColor: 'rgba(19, 0, 87, 0.1)',
                            borderRadius: 12,
                            color: '#130057',
                          }}
                          keyboardType="numeric"
                          maxLength={1}
                        />
                        {digit && (
                          <View style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            width: 12,
                            height: 12,
                            backgroundColor: '#130057',
                            borderRadius: 6,
                          }} />
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Divine Verify Button */}
                <TouchableOpacity
                  onPress={handleVerify}
                  disabled={!isFormValid || isLoading}
                 
                >
                  <LinearGradient
                    colors={isFormValid && !isLoading ? ['#1F7FE5', '#1F7FE5'] : ['#cccccc', '#999999']}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 24,
                      borderRadius: 16,
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.3,
                      shadowRadius: 16,
                      elevation: 8,
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
                          Verifying Code...
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="auto-awesome" size={20} color="white" />
                        <Text style={{
                          color: '#DADADA',
                          fontSize: 18,
                          fontWeight: 'bold',
                          marginLeft: 8,
                        }}>
                          Verify & Continue 
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Sacred Resend Section */}
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  {canResend ? (
                    <TouchableOpacity
                      onPress={handleResend}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Icon name="refresh" size={16} color="#130057" />
                      <Text style={{
                        color: '#130057',
                        fontWeight: '600',
                        marginLeft: 8,
                        textDecorationLine: 'underline',
                      }}>
                        Resend Code
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 8,
                        height: 8,
                        backgroundColor: '#130057',
                        borderRadius: 4,
                        marginRight: 8,
                      }} />
                      <Text style={{
                        color: 'rgba(19, 0, 87, 0.7)',
                        fontWeight: '500',
                      }}>
                        Resend available in <Text style={{ fontWeight: 'bold', color: '#130057' }}>{resendTimer}s</Text>
                      </Text>
                      <View style={{
                        width: 8,
                        height: 8,
                        backgroundColor: '#130057',
                        borderRadius: 4,
                        marginLeft: 8,
                      }} />
                    </View>
                  )}
                </View>

                {/* Sacred Back Button */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 16,
                    backgroundColor: 'rgba(245, 245, 245, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(19, 0, 87, 0.2)',
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="arrow-back" size={20} color="#130057" />
                  <Text style={{
                    color: '#130057',
                    fontSize: 16,
                    fontWeight: '600',
                    marginLeft: 8,
                  }}>
                    Return to Previous Step
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Guidance note removed */}
      </View>
    </View>
    </TouchableWithoutFeedback>
    </NativeBaseProvider>
       
  );
};


