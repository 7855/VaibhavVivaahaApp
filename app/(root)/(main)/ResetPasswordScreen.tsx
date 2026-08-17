import React, { useState } from 'react';
import { View, Image, TextInput, TouchableOpacity, Dimensions, TouchableWithoutFeedback, Platform, Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { NativeBaseProvider } from 'native-base';
import { usePopup } from '../contexts/PopupContext';
import AppText from '../../../components/AppText';

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
  const phoneNumber = email;
  const setPhoneNumber = setEmail;
  const [isLoading, setIsLoading] = useState(false);
  // Presentation-only: tracks which field is focused so we can accent its border.
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!EMAIL_REGEX.test(email)) return;
    setIsLoading(true);

    try {
      const response = await userApi.forgotPassword({ email });

      if (response.data.code === 200) {
        await AsyncStorage.setItem('resetEmail', email);
        setIsLoading(false);
        popup.success(
          'Code Sent',
          `We've sent a verification code to ${email}.`,
          () => {
            router.push({
              pathname: '/(root)/(main)/OTPValidationScreen',
              params: { email, purpose: 'reset' },
            });
          }
        );
      } else if (response.data.code === 404) {
        setIsLoading(false);
        popup.error('Not Registered', 'This email address is not registered with us. Please check and try again.');
      } else {
        setIsLoading(false);
        popup.error('Error', response.data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setIsLoading(false);
      popup.error('Error', 'We could not send the code. Please try again.');
    }
  };

  const isFormValid = EMAIL_REGEX.test(email);

  return (
    <NativeBaseProvider>
      {/* Had NO keyboard wrapper at all (KeyboardAvoidingView was imported but never rendered),
          so a focused input was covered by the keyboard on BOTH platforms. */}
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 22,
      paddingVertical: 40,
    }}>
      <LinearGradient
        colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
        locations={[0, 0.3, 0.6, 1.0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
        {/* Brand mark — logo in a soft white halo, the screen's single focal point */}
        <View style={{ alignItems: 'center' }}>
          {/* App-icon tile, same as LoginScreen — the logo PNG is a solid square (no alpha),
              so circle-cropping showed its background edges. Tile shows it as designed. */}
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

        {/* Heading block */}
        <AppText weight="bold" style={{
          fontSize: 26,
          color: '#0f1724',
          letterSpacing: -0.3,
          marginTop: 24,
          textAlign: 'center',
        }}>
          Forgot Your PIN?
        </AppText>
        <AppText weight="regular" style={{
          fontSize: 13,
          color: '#64748b',
          lineHeight: 19,
          marginTop: 6,
          textAlign: 'center',
        }}>
          Enter your registered email address and we'll send you a code to reset your PIN.
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
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5,
        }}>
          <View style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: 'rgba(90,167,239,0.28)',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Ionicons name="mail-outline" size={18} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" style={{ fontSize: 13.5, color: '#ffffff' }}>
              Reset PIN via Email
            </AppText>
            <AppText weight="regular" style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.72)',
              lineHeight: 15,
              marginTop: 2,
            }}>
              We'll send a one-time code to your registered email address
            </AppText>
          </View>
        </View>

        {/* Email Input */}
        <View style={{ marginBottom: 14 }}>
          <AppText weight="bold" style={{
            fontSize: 12,
            color: '#0f1724',
            textTransform: 'uppercase',
            letterSpacing: 0.3,
            marginLeft: 8,
            marginBottom: 5,
          }}>
            Email Address
          </AppText>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 28,
            height: 52,
            paddingHorizontal: 20,
            borderWidth: 1,
            borderColor: focusedField === 'email' ? '#1F7FE5' : '#e2e8f0',
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#1F7FE5',
            shadowOpacity: focusedField === 'email' ? 0.16 : 0.05,
            shadowRadius: focusedField === 'email' ? 10 : 6,
            shadowOffset: { width: 0, height: focusedField === 'email' ? 4 : 2 },
            elevation: focusedField === 'email' ? 3 : 1,
          }}>
            <Icon name="email" size={18} color={focusedField === 'email' ? '#1F7FE5' : '#94a3b8'} style={{ marginRight: 10 }} />
            <TextInput
              defaultValue={phoneNumber}
              onChangeText={(text) => setPhoneNumber(text)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={{
                flex: 1,
                fontSize: 14,
                fontFamily: 'Rubik-Regular',
                color: '#333',
                paddingVertical: 0,
              }}
              placeholder="Enter your email address"
              placeholderTextColor="#9aa7b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {EMAIL_REGEX.test(phoneNumber) && (
              <View style={{
                width: 8,
                height: 8,
                backgroundColor: '#4CAF50',
                borderRadius: 4,
                marginLeft: 8,
              }} />
            )}
          </View>
          {phoneNumber.length > 0 && !EMAIL_REGEX.test(phoneNumber) && (
            <AppText weight="regular" style={{
              fontSize: 11.5,
              color: '#dc2626',
              marginLeft: 8,
              marginTop: 4,
            }}>
              Please enter a valid email address
            </AppText>
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isFormValid || isLoading}
        >
          <LinearGradient
            colors={['#5AA7EF', '#1F7FE5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 28,
              height: 54,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 18,
              shadowColor: '#1F7FE5',
              shadowOpacity: 0.35,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
              opacity: (!isFormValid || isLoading) ? 0.55 : 1,
            }}
          >
            {isLoading ? (
              <AppText weight="bold" style={{
                color: '#ffffff',
                fontSize: 15,
              }}>
                Sending Code...
              </AppText>
            ) : (
              <AppText weight="bold" style={{
                color: '#ffffff',
                fontSize: 15,
              }}>
                Send Code
              </AppText>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 18,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={16} color="#1F7FE5" />
          <AppText weight="medium" style={{
            color: '#1F7FE5',
            fontSize: 13,
            marginLeft: 4,
          }}>
            Back to Sign In
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
      </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
    </NativeBaseProvider>
  );
};

export default ResetPasswordScreen;
