import React, { useState, useRef, useEffect } from 'react';
import { View, Image, TextInput, TouchableOpacity, Dimensions, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { NativeBaseProvider } from 'native-base';
import { usePopup } from '../contexts/PopupContext';
import AppText from '../../../components/AppText';

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
  const purpose = params.purpose || '';
  const isEmailFlow = !!email;
  const { width, height } = Dimensions.get('window');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  // Presentation-only: index of the focused OTP box, used to accent its border.
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

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

      if (email && purpose) {
        const response = await userApi.verifyAuthOtp({
          email,
          otp: otpCode,
          purpose,
        });

        if (response.data?.code === 200) {
          setIsLoading(false);

          if (purpose === 'registration') {
            const token = response.data.data?.verificationToken;
            if (token) {
              await AsyncStorage.setItem('emailVerificationToken', token);
              await AsyncStorage.setItem('verifiedEmail', email);
            }
            popup.success('Email Verified', 'Your email address has been verified successfully.', () => router.back());
          } else if (purpose === 'reset') {
            const resetToken = response.data.data?.resetToken;
            router.replace({
              pathname: '/(root)/(main)/SetNewPasswordScreen',
              params: { resetToken: resetToken || '' },
            });
          }
        } else {
          setIsLoading(false);
          popup.error('Invalid Code', response.data?.message || 'The code you entered is incorrect. Please try again.');
          setOtp(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }
        return;
      }

      const requestBody = {
        mobileNumber: await AsyncStorage.getItem('resetPhoneNumber'),
        otp: otpCode,
      };

      const response = await userApi.verifyOtp(requestBody);

      if (response.data.code === 200) {
        setIsLoading(false);
        router.push({
          pathname: '/(root)/(main)/ChangePinScreen',
          params: { onComplete: 'onVerified' },
        });
      } else if (response.data.code === 400) {
        setIsLoading(false);
        popup.error('Invalid Code', 'The code you entered is incorrect. Please try again.');
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
      popup.error('Error', 'Something went wrong. Please try again.');
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
        popup.success('Code Sent', `We've sent a new verification code to ${email}.`);
      } else {
        const mobile = await AsyncStorage.getItem('resetPhoneNumber');
        if (mobile) {
          await userApi.sendOtp(mobile);
          popup.success('Code Sent', `We've sent a new verification code to ${mobile}.`);
        }
      }
    } catch (err) {
      console.error('Resend OTP failed:', err);
      popup.error('Error', 'We could not send the code. Please try again.');
    }
  };

  const isFormValid = otp.every(digit => digit !== '');

  const maskEmail = (value: string) => {
    const [local, domain] = value.split('@');
    if (!domain) return value;
    if (local.length <= 3) return `${local[0] || '*'}***@${domain}`;
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
  };
  const maskedContact = isEmailFlow
    ? maskEmail(email)
    : (phoneNumber ? phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3') : '------');

  return (
    <NativeBaseProvider>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <LinearGradient
            colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
            locations={[0, 0.3, 0.6, 1.0]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {/* KeyboardAvoidingView was imported but never rendered here either — the OTP boxes
              and Verify button sat under the keyboard on both platforms. */}
          <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraScrollHeight={Platform.OS === 'ios' ? 30 : 20}
            keyboardOpeningTime={0}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            enableResetScrollToCoords={false}
          >
          <SafeAreaView style={{ flex: 1, paddingHorizontal: 22 }}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
                shadowColor: '#1F7FE5',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Ionicons name="chevron-back" size={22} color="#0f1724" />
            </TouchableOpacity>

            {/* Brand mark — app-icon tile (the logo PNG is a solid square with no alpha;
                circle-cropping showed its background edges, a tile shows it as designed). */}
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <View style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                backgroundColor: '#ffffff',
                shadowColor: '#1F7FE5',
                shadowOpacity: 0.14,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4,
              }}>
                <Image
                  source={require('../../../assets/images/LotusLogo.png')}
                  style={{ width: 68, height: 68, borderRadius: 20 }}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Heading */}
            <AppText weight="bold" style={{
              fontSize: 26,
              color: '#0f1724',
              letterSpacing: -0.3,
              marginTop: 24,
              textAlign: 'center',
            }}>
              Verification Code
            </AppText>
            <AppText weight="regular" style={{
              fontSize: 13,
              color: '#64748b',
              lineHeight: 19,
              marginTop: 6,
              textAlign: 'center',
            }}>
              {isEmailFlow
                ? 'We sent a 4-digit code to your email address. Enter it below to continue.'
                : 'We sent a 4-digit code to your mobile number. Enter it below to continue.'}
            </AppText>

            {/* Dark step banner */}
            <View style={{
              backgroundColor: '#1c2b3f',
              borderRadius: 20,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginTop: 20,
              marginBottom: 24,
              shadowColor: '#1c2b3f',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 5,
            }}>
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(90,167,239,0.28)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="bold" style={{
                  fontSize: 13.5,
                  color: '#ffffff',
                }}>
                  Verify Code
                </AppText>
                <AppText weight="regular" style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.72)',
                  lineHeight: 15,
                  marginTop: 2,
                }}>
                  4-digit code sent to {isEmailFlow ? maskedContact : `+91 ${maskedContact}`}
                </AppText>
              </View>
            </View>

            {/* OTP Input */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 12,
            }}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  defaultValue={digit}
                  onChangeText={(text) => handleOtpChange(index, text.replace(/\D/g, ''))}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  style={{
                    flex: 1,
                    maxWidth: 64,
                    height: 62,
                    borderRadius: 18,
                    backgroundColor: '#ffffff',
                    borderWidth: 1.5,
                    borderColor: (digit || focusedIndex === index) ? '#1F7FE5' : '#e2e8f0',
                    textAlign: 'center',
                    fontSize: 22,
                    fontFamily: 'Rubik-Bold',
                    color: '#0f1724',
                    shadowColor: '#1F7FE5',
                    shadowOffset: { width: 0, height: focusedIndex === index ? 4 : 2 },
                    shadowOpacity: focusedIndex === index ? 0.18 : 0.06,
                    shadowRadius: focusedIndex === index ? 10 : 6,
                    elevation: focusedIndex === index ? 3 : 1,
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                />
              ))}
            </View>

            {/* Resend Section */}
            <View style={{ alignItems: 'center', marginTop: 22 }}>
              {canResend ? (
                <TouchableOpacity onPress={handleResend}>
                  <AppText weight="medium" style={{
                    fontSize: 13,
                    color: '#1F7FE5',
                    textAlign: 'center',
                  }}>
                    Resend Code
                  </AppText>
                </TouchableOpacity>
              ) : (
                <AppText weight="regular" style={{
                  fontSize: 13,
                  color: '#64748b',
                  textAlign: 'center',
                }}>
                  {`Resend code in ${resendTimer}s`}
                </AppText>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerify}
              disabled={!isFormValid || isLoading}
              style={{
                marginTop: 18,
                opacity: isFormValid && !isLoading ? 1 : 0.55,
              }}
            >
              <LinearGradient
                colors={['#5AA7EF', '#1F7FE5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 54,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#1F7FE5',
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                }}
              >
                {isLoading ? (
                  <AppText weight="bold" style={{
                    color: '#ffffff',
                    fontSize: 15,
                  }}>
                    Verifying...
                  </AppText>
                ) : (
                  <AppText weight="bold" style={{
                    color: '#ffffff',
                    fontSize: 15,
                  }}>
                    Verify
                  </AppText>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back Link */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginTop: 18, alignItems: 'center' }}
            >
              <AppText weight="medium" style={{
                fontSize: 13,
                color: '#1F7FE5',
                textAlign: 'center',
              }}>
                Return to Previous Screen
              </AppText>
            </TouchableOpacity>
          </SafeAreaView>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>
    </NativeBaseProvider>
  );
};
