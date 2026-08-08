import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { NativeBaseProvider } from 'native-base';
import { usePopup } from '../contexts/PopupContext';
import { useTranslation } from 'react-i18next';
import AppText from '../../../components/AppText';

interface OTPValidationScreenProps {
  onBack: () => void;
  onVerified: () => void;
}

export default function OTPValidationScreen({ onBack, onVerified }: OTPValidationScreenProps) {
  const router = useRouter();
  const popup = usePopup();
  const { t } = useTranslation();
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
            popup.success(t('auth.otp.emailVerifiedTitle'), t('auth.otp.emailVerifiedMessage'), () => router.back());
          } else if (purpose === 'reset') {
            const resetToken = response.data.data?.resetToken;
            router.replace({
              pathname: '/(root)/(main)/SetNewPasswordScreen',
              params: { resetToken: resetToken || '' },
            });
          }
        } else {
          setIsLoading(false);
          popup.error(t('auth.otp.invalidOtpTitle'), response.data?.message || t('auth.otp.invalidOtpMessage'));
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
        popup.error(t('auth.otp.invalidOtpTitle'), t('auth.otp.invalidOtpMessage'));
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setIsLoading(false);
        popup.error(t('common.error'), t('login.errors.genericMessage'));
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setIsLoading(false);
      popup.error(t('common.error'), t('login.errors.genericMessage'));
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
        popup.success(t('signup.otpSentTitle'), t('signup.otpSentMessage', { email }));
      } else {
        const mobile = await AsyncStorage.getItem('resetPhoneNumber');
        if (mobile) {
          await userApi.sendOtp(mobile);
          popup.success(t('signup.otpSentTitle'), t('signup.otpSentMessage', { email: mobile }));
        }
      }
    } catch (err) {
      console.error('Resend OTP failed:', err);
      popup.error(t('common.error'), t('signup.sendOtpFailedMessage'));
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

    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 40,
    }}>
      <LinearGradient
        colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
        locations={[0, 0.3, 0.6, 1.0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ width: '100%', maxWidth: 400 }}>
        {/* Header */}
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
              }}
            >
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

              <Icon name="message" size={36} color="#1F7FE5" />

              <Icon
                name="star"
                size={12}
                color="rgba(31, 127, 229, 0.6)"
                style={{ position: 'absolute', top: 4, right: 8 }}
              />
              <Icon
                name="auto-awesome"
                size={8}
                color="rgba(31, 127, 229, 0.6)"
                style={{ position: 'absolute', bottom: 8, left: 4 }}
              />
            </LinearGradient>

            <View style={{
              position: 'absolute',
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              borderRadius: 48,
              borderWidth: 1,
              borderColor: 'rgba(31, 127, 229, 0.15)',
            }} />
            <View style={{
              position: 'absolute',
              top: -16,
              left: -16,
              right: -16,
              bottom: -16,
              borderRadius: 56,
              borderWidth: 1,
              borderColor: 'rgba(31, 127, 229, 0.1)',
            }} />
          </View>

          <AppText weight="bold" style={{
            fontSize: 20,
            color: '#0f1724',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            {t('auth.otp.verificationCode')}
          </AppText>
          <AppText weight="regular" style={{
            fontSize: 13,
            color: '#64748b',
            textAlign: 'center',
            lineHeight: 22,
          }}>
            {isEmailFlow ? t('auth.otp.sentEmail') : t('auth.otp.sentMobile')}{'\n'}
            <AppText weight="bold" style={{ fontSize: 16, color: '#0f1724' }}>
              {isEmailFlow ? maskedContact : `+91 ${maskedContact}`}
            </AppText>
          </AppText>
          
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

        {/* Card */}
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
            
            <View style={{
              position: 'absolute',
              top: 24,
              left: '50%',
              marginLeft: -40,
              width: 80,
              height: 4,
              backgroundColor: 'rgba(15, 23, 42, 0.06)',
              borderRadius: 2,
            }} />
            <View style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              marginLeft: -32,
              width: 64,
              height: 2,
              backgroundColor: 'rgba(15, 23, 42, 0.06)',
              borderRadius: 1,
            }} />

            <View style={{ padding: 32 }}>
              <View style={{ gap: 28 }}>
                {/* OTP Input */}
                <View style={{ gap: 16 }}>
                  <View style={{
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}>
                    <Icon name="message" size={16} color="#1F7FE5" />
                    <AppText weight="bold" style={{
                      fontSize: 12,
                      color: '#0f1724',
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                      marginLeft: 8,
                    }}>
                      {t('auth.otp.verificationCode')}
                    </AppText>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                    {otp.map((digit, index) => (
                      <View key={index} style={{ position: 'relative' }}>
                        <TextInput
                          ref={(el) => { inputRefs.current[index] = el; }}
                          defaultValue={digit}
                          onChangeText={(text) => handleOtpChange(index, text.replace(/\D/g, ''))}
                          onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                          style={{
                            width: 48,
                            height: 56,
                            textAlign: 'center',
                            fontSize: 20,
                            fontFamily: 'Rubik-Bold',
                            backgroundColor: '#ffffff',
                            borderWidth: 1.5,
                            borderColor: '#e2e8f0',
                            borderRadius: 12,
                            color: '#0f1724',
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
                            backgroundColor: '#1F7FE5',
                            borderRadius: 6,
                          }} />
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={handleVerify}
                  disabled={!isFormValid || isLoading}
                >
                  <LinearGradient
                    colors={isFormValid && !isLoading ? ['#1F7FE5', '#1862b8'] : ['#cccccc', '#999999']}
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
                        <AppText weight="bold" style={{
                          color: '#fff',
                          fontSize: 18,
                        }}>
                          {t('auth.otp.verifying')}
                        </AppText>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="auto-awesome" size={20} color="white" />
                        <AppText weight="bold" style={{
                          color: '#fff',
                          fontSize: 18,
                          marginLeft: 8,
                        }}>
                          {t('auth.otp.verify')}
                        </AppText>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Resend Section */}
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  {canResend ? (
                    <TouchableOpacity
                      onPress={handleResend}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Icon name="refresh" size={16} color="#1F7FE5" />
                      <AppText weight="bold" style={{
                        color: '#1F7FE5',
                        fontSize: 12.5,
                        marginLeft: 8,
                      }}>
                        {t('auth.otp.resendOtp')}
                      </AppText>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 8,
                        height: 8,
                        backgroundColor: '#94a3b8',
                        borderRadius: 4,
                        marginRight: 8,
                      }} />
                      <AppText weight="regular" style={{
                        color: '#64748b',
                      }}>
                        {t('auth.otp.resendSmsIn', { seconds: resendTimer })}
                      </AppText>
                      <View style={{
                        width: 8,
                        height: 8,
                        backgroundColor: '#94a3b8',
                        borderRadius: 4,
                        marginLeft: 8,
                      }} />
                    </View>
                  )}
                </View>

                {/* Back Button */}
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
                  <AppText weight="medium" style={{
                    color: '#475569',
                    fontSize: 14,
                    marginLeft: 8,
                  }}>
                    {t('auth.changePin.returnPrevious')}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
    </TouchableWithoutFeedback>
    </NativeBaseProvider>
  );
};


