import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, Dimensions, Platform, Keyboard, TouchableWithoutFeedback, BackHandler } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { draftFromRegistration } from './RegisterScreen';
import { webSocketService } from '../services/webSocketService';
import { NativeBaseProvider } from 'native-base';
import { saveDeviceInfo } from '../../../utils/deviceInfo';
import { persistLoginSession } from '../utils/persistSession';
import { useUserData } from '../contexts/UserDataContext';
import CommonPopup from '../../../components/CommonPopup';
import { usePopup } from '../contexts/PopupContext';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  onForgetPin?: () => void;
}

const { width, height } = Dimensions.get('window');

const KOLAM_PAGE = (() => { const d: { x: number; y: number }[] = []; for (let x = 12; x < 460; x += 26) for (let y = 12; y < 960; y += 26) d.push({ x, y }); return d; })();
const KOLAM_BAND = (() => { const d: { x: number; y: number }[] = []; for (let x = 10; x < 460; x += 22) for (let y = 8; y < 200; y += 22) d.push({ x, y }); return d; })();
/** Page backdrop only (2026-10-20) — the form rendered above it is untouched. */
const LoginBackdrop = ({ bandH }: { bandH: number }) => {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFF8EE' }}>
      <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        {KOLAM_PAGE.map((d, i) => <Circle key={i} cx={d.x} cy={d.y} r="1.1" fill="rgba(66,0,1,0.07)" />)}
      </Svg>
      <LinearGradient colors={['#7A120B', '#420001', '#2A0004']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={{ height: bandH, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: 'hidden' }}>
        <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          {KOLAM_BAND.map((d, i) => <Circle key={i} cx={d.x} cy={d.y} r="1.2" fill="rgba(255,255,255,0.16)" />)}
        </Svg>
        <View style={{ position: 'absolute', right: -70, top: -90, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(246,183,51,0.22)' }} />
      </LinearGradient>
    </View>
  );
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onForgetPin = () => { } }) => {
  const { loadUserData } = useUserData();
  const { login } = useAuth();
  const popup = usePopup();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [mobileNumber, setMobileNumber] = useState('')
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Same reason as the removed back chevron: the signed-out user must never be
  // able to reach the authenticated stack that is still sitting in history.
  // Swallow Android's hardware back on this screen; returning true stops the
  // default pop. (Exiting the app is handled by the OS from the true root.)
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        // Login is the root of the app: back should leave the app, which is what
        // Android users expect here — NOT re-enter the signed-out session's
        // leftover stack. Returning true (swallowing it) would leave back feeling
        // broken, so exit explicitly instead.
        BackHandler.exitApp();
        return true;
      });
      return () => sub.remove();
    }, [])
  );
  const [isLoading, setIsLoading] = useState(false);
  // Presentation-only: tracks which field is focused so we can accent its border.
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      if (!identifierValid || pin.length !== 4) return;
      setIsLoading(true);

      // The backend's login reads the identifier from `mobile` and routes by
      // shape itself (contains '@' → email lookup, else mobile lookup).
      const request = {
        mobile: mobileNumber.trim(),
        pin: pin
      }
      const response = await userApi.login(request)
      // console.log('Login response:', response.data)
      if (response.data.code === 200) {
        // One shared persistence path with the WhatsApp login — see utils/persistSession.
        const userStatus = await persistLoginSession(response.data.data, login);
        await loadUserData();

        // Full name, not just the first — the header greeting already shows both,
        // so a first-name-only welcome read as a different, truncated identity.
        const name = [response.data.data.firstName, response.data.data.lastName]
          .filter(Boolean).join(' ').trim() || 'there';
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
      } else if (response.data.code === 429) {
        popup.warning('Too many attempts', response.data.message || 'Too many wrong attempts. Please try again in 15 minutes.');
      } else if (response.data.code === 404 || response.data.code === 401) {
        // ONE message for both "no such account" (404) and "wrong PIN" (401), by client ask
        // and standard practice: a distinct "Not Registered" reply confirms which mobiles and
        // emails have accounts here, letting anyone enumerate members one guess at a time.
        // Never name which half was wrong.
        popup.error('Invalid Credentials', 'The mobile number / email or PIN you entered is incorrect. Please try again.')
      } else if (response.data.code === 403) {
        // Backend now blocks PENDING/REJECTED at login too (previously only BANNED/SUSPENDED
        // returned 403 here) — those two carry real userStatus/rejectionReason data so we can
        // still route to ProfileUnderVerificationScreen instead of just showing an error popup,
        // same UX as the old 200-response path used to give a PENDING/REJECTED user.
        const pendingData = response.data.data;
        const pendingStatus = pendingData?.userStatus;
        if (response.data.message === 'REGISTRATION_INCOMPLETE') {
          // New flow (2026-10-19): the registration was started but never finished. The PIN
          // is chosen on the number page, so the server has just checked it and hands back the
          // saved sections — the member lands straight on the pending steps (any phone).
          const reg = response.data.data;
          if (reg?.registrationToken) {
            await AsyncStorage.setItem('registerDraft', JSON.stringify({ ...draftFromRegistration(reg, mobileNumber.trim()), fromLogin: true })).catch(() => {});
            router.push('/(root)/(main)/RegisterScreen' as any);
            return;
          }
          // Older jar (no draft on a PIN login): re-verify the number inside the register flow.
          await AsyncStorage.setItem('registerDraft', JSON.stringify({ mobile: mobileNumber.trim(), stage: 'start', resume: true })).catch(() => {});
          popup.info('Finish your registration', 'This number has an unfinished registration. Verify it on WhatsApp to continue where you left off.', () => router.push('/(root)/(main)/RegisterScreen' as any));
          return;
        }
        if (pendingStatus === 'PENDING' || pendingStatus === 'REJECTED') {
          if (pendingData.userId) await AsyncStorage.setItem('userId', pendingData.userId);
          await AsyncStorage.setItem('firstName', pendingData.firstName || '');
          await AsyncStorage.setItem('lastName', pendingData.lastName || '');
          await AsyncStorage.setItem('userStatus', pendingStatus);
          if (pendingData.rejectionReason) {
            await AsyncStorage.setItem('rejectionReason', pendingData.rejectionReason);
          } else {
            await AsyncStorage.removeItem('rejectionReason');
          }
          router.replace('/(root)/(main)/ProfileUnderVerificationScreen');
        } else {
          popup.error('Account Blocked', response.data.message || 'Your account has been blocked by the administrator.')
        }
      } else {
        popup.error('Login Failed', 'Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      popup.error('Login Failed', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Maroon band height (client, 2026-10-20): its bottom edge sits on the MIDDLE line of the
  // lotus tile, wherever the vertically-centred form puts that tile on this phone — measured
  // from the tile itself, not assumed from the screen height.
  const insets = useSafeAreaInsets();
  const [bandH, setBandH] = useState(insets.top + 92);
  const logoRef = useRef<View | null>(null);
  const measureLogo = () => {
    logoRef.current?.measureInWindow((_x, y, _w, h) => { if (h > 0 && y > 0) setBandH(Math.round(y + h / 2)); });
  };

  // Email-or-mobile login (2026-09-05): one field carries either identifier.
  const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mobileNumber);
  const isMobileFormat = /^\d{10}$/.test(mobileNumber);
  const identifierValid = isEmailFormat || isMobileFormat;
  const isFormValid = identifierValid && pin.length === 4;

  return (
    <NativeBaseProvider>
      <View style={{ flex: 1 }}>
        {/* Background only (client, 2026-10-20): the register page's language — jasmine-cream
            page with a faint maroon kolam, and a short maroon band with white kolam dots + a
            marigold glow across the top. The band stops above the content on every phone, so the
            ink title and slate copy below it are untouched. Nothing inside the form changed. */}
        <LoginBackdrop bandH={bandH} />
        {/* Was a KeyboardAvoidingView with behavior=undefined on Android — i.e. a no-op — and
            there was no scrollable container, so a focused input could not be scrolled above the
            keyboard. KeyboardAwareScrollView handles both platforms; enableOnAndroid +
            enableAutomaticScroll are BOTH required on Android (enableOnAndroid alone only
            resizes, it does not scroll to the focused field — same fix as sign-up.tsx). */}
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.OS === 'ios' ? 30 : 20}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // The login form fits the screen with the keyboard closed, but a
          // ScrollView still lets you drag/rubber-band it, which made the page
          // feel loose. These stop any movement when the content fits, while
          // still allowing a real scroll if it genuinely overflows (small screens,
          // large font sizes) — so nothing can get trapped off-screen.
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          // Return to the top once the keyboard closes. With this false the form
          // stayed wherever the keyboard had pushed it, which is the other half
          // of the "unstable" feel. Between the two fields the keyboard stays
          // open, so this does not fire mid-form.
          enableResetScrollToCoords={true}
          resetScrollToCoords={{ x: 0, y: 0 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              {/* No back button here by design. Login is the ROOT of the app's
                  unauthenticated flow and EVERY route to it is a router.replace()
                  — onboarding, logout, sign-up, PIN reset — so there is never a
                  legitimate screen behind it. A `canGoBack()` check is NOT
                  sufficient: after logout the authenticated (tabs) stack is still
                  in history across the group boundary, so canGoBack() returns true
                  and tapping back walked the signed-out user straight back into
                  the profile page. */}

              <View style={{
                flexGrow: 1,
                justifyContent: 'center',
                paddingHorizontal: 22,
                paddingVertical: 40,
              }}>
                <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
                  {/* Brand mark — rounded-square "app icon" tile. The logo PNG has NO
                      transparency (solid square with its own background), so circle-cropping it
                      showed the square background's edges inside the disc. The tile shows the
                      asset exactly as designed, like the app icon itself. Image carries its own
                      borderRadius (works on both platforms); the wrapper only carries the shadow
                      so Android elevation isn't clipped away. */}
                  <View style={{ alignItems: 'center' }}>
                    <View ref={logoRef} onLayout={measureLogo} style={{
                      width: 84, height: 84, borderRadius: 42, backgroundColor: '#ffffff',
                      shadowColor: '#1F7FE5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 14, elevation: 4,
                    }}>
                      <Image
                        source={require('../../../assets/images/LotusLogo.png')}
                        style={{ width: 84, height: 84, borderRadius: 42 }}
                        resizeMode="cover"
                      />
                    </View>
                  </View>

                  {/* Heading block */}
                  <Text style={{
                    fontSize: 26,
                    fontFamily: 'Rubik-Bold',
                    color: '#0f1724',
                    letterSpacing: -0.3,
                    marginTop: 24,
                    textAlign: 'center',
                  }}>
                    Welcome Back!
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontFamily: 'Rubik-Regular',
                    color: '#64748b',
                    lineHeight: 19,
                    marginTop: 6,
                    textAlign: 'center',
                  }}>
                    Turning Matches Into Lasting Marriages
                  </Text>

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
                      <Ionicons name="phone-portrait-outline" size={18} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontFamily: 'Rubik-Bold', color: '#ffffff' }}>
                        Login with Mobile/Email & PIN
                      </Text>
                      <Text style={{
                        fontSize: 11,
                        fontFamily: 'Rubik-Regular',
                        color: 'rgba(255,255,255,0.72)',
                        lineHeight: 15,
                        marginTop: 2,
                      }}>
                        Use the email or mobile number you registered with
                      </Text>
                    </View>
                  </View>

                  {/* Phone Number Input */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{
                      fontSize: 12,
                      fontFamily: 'Rubik-Bold',
                      color: '#0f1724',
                      textTransform: 'uppercase',
                      letterSpacing: 0.3,
                      marginLeft: 8,
                      marginBottom: 5,
                    }}>
                      Email or Mobile Number
                    </Text>
                    <View style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 28,
                      height: 52,
                      paddingHorizontal: 20,
                      borderWidth: 1,
                      borderColor: focusedField === 'mobile' ? '#1F7FE5' : '#e2e8f0',
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#1F7FE5',
                      shadowOpacity: focusedField === 'mobile' ? 0.16 : 0.05,
                      shadowRadius: focusedField === 'mobile' ? 10 : 6,
                      shadowOffset: { width: 0, height: focusedField === 'mobile' ? 4 : 2 },
                      elevation: focusedField === 'mobile' ? 3 : 1,
                    }}>
                      <Icon name="phone" size={18} color={focusedField === 'mobile' ? '#1F7FE5' : '#94a3b8'} style={{ marginRight: 10 }} />
                      <TextInput
                        testID="input-mobile"
                        accessibilityLabel="input-mobile"
                        defaultValue={mobileNumber}
                        onChangeText={(text) => {
                          const t = text.replace(/\s/g, '');
                          // Pure digits keep the old 10-digit mobile behaviour;
                          // anything else is treated as an email being typed.
                          setMobileNumber(/^\d*$/.test(t) ? t.slice(0, 10) : t.slice(0, 100));
                        }}
                        onFocus={() => setFocusedField('mobile')}
                        onBlur={() => setFocusedField(null)}
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontFamily: 'Rubik-Regular',
                          color: '#333',
                          paddingVertical: 0,
                          letterSpacing: 0,
                        }}
                        placeholder="Email/Mobile Number"
                        placeholderTextColor="#9aa7b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={100}
                      />
                      {identifierValid && (
                        <View style={{
                          width: 8,
                          height: 8,
                          backgroundColor: '#4CAF50',
                          borderRadius: 4,
                          marginLeft: 8,
                        }} />
                      )}
                    </View>
                    {mobileNumber.length > 0 && !identifierValid && (
                      <Text style={{
                        fontSize: 11.5,
                        fontFamily: 'Rubik-Regular',
                        color: '#dc2626',
                        marginLeft: 8,
                        marginTop: 4,
                      }}>
                        Enter a valid email or 10-digit mobile number
                      </Text>
                    )}
                  </View>

                  {/* PIN Input */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{
                      fontSize: 12,
                      fontFamily: 'Rubik-Bold',
                      color: '#0f1724',
                      textTransform: 'uppercase',
                      letterSpacing: 0.3,
                      marginLeft: 8,
                      marginBottom: 5,
                    }}>
                      PIN
                    </Text>
                    <View style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 28,
                      height: 52,
                      paddingHorizontal: 20,
                      borderWidth: 1,
                      borderColor: focusedField === 'pin' ? '#1F7FE5' : '#e2e8f0',
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#1F7FE5',
                      shadowOpacity: focusedField === 'pin' ? 0.16 : 0.05,
                      shadowRadius: focusedField === 'pin' ? 10 : 6,
                      shadowOffset: { width: 0, height: focusedField === 'pin' ? 4 : 2 },
                      elevation: focusedField === 'pin' ? 3 : 1,
                    }}>
                      <Icon name="lock" size={18} color={focusedField === 'pin' ? '#1F7FE5' : '#94a3b8'} style={{ marginRight: 10 }} />
                      <TextInput
                        testID="input-pin"
                        accessibilityLabel="input-pin"
                        defaultValue={pin}
                        onChangeText={(text) => setPin(text.replace(/\D/g, '').slice(0, 4))}
                        onFocus={() => setFocusedField('pin')}
                        onBlur={() => setFocusedField(null)}
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontFamily: 'Rubik-Regular',
                          color: '#0f1724',
                          paddingVertical: 0,
                        }}
                        placeholder="Enter PIN"
                        placeholderTextColor="#9aa7b8"
                        secureTextEntry={!showPin}
                        keyboardType="numeric"
                        maxLength={4}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPin(!showPin)}
                        style={{ marginLeft: 8, paddingVertical: 6 }}
                      >
                        <Icon
                          name={showPin ? 'visibility' : 'visibility-off'}
                          size={20}
                          color="#94a3b8"
                        />
                      </TouchableOpacity>
                    </View>
                    {pin.length > 0 && pin.length !== 4 && (
                      <Text style={{
                        fontSize: 11.5,
                        fontFamily: 'Rubik-Regular',
                        color: '#dc2626',
                        marginLeft: 8,
                        marginTop: 4,
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
                        <Text style={{ color: '#ffffff', fontSize: 15, fontFamily: 'Rubik-Bold' }}>
                          Signing in...
                        </Text>
                      ) : (
                        <Text style={{ color: '#ffffff', fontSize: 15, fontFamily: 'Rubik-Bold' }}>
                          Sign In
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Forget PIN */}
                  <View style={{ alignItems: 'center', marginTop: 18 }}>
                    <TouchableOpacity
                      onPress={() => router.push('/(root)/(main)/ResetPasswordScreen')}
                    >
                      <Text style={{
                        color: '#1F7FE5',
                        fontSize: 13,
                        fontFamily: 'Rubik-Medium',
                      }}>
                        Forgot PIN?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sign up link */}
                  <View style={{ alignItems: 'center', marginTop: 14 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Rubik-Medium', color: '#64748b' }}>
                      Don't have an account?{' '}
                      <Text style={{ color: '#1F7FE5', fontFamily: 'Rubik-Bold' }} onPress={() => router.push('/(root)/(main)/RegisterScreen' as any)} /* 2026-10-19: new register flow; old sign-up.tsx untouched */>
                        Sign Up
                      </Text>
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>
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