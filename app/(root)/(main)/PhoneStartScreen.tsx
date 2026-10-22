/**
 * Phone-first entry (2026-10-16): one number, one WhatsApp code.
 *   registered number → logged in (purpose "start" + /user/login-with-otp)
 *   new number        → sign-up with the mobile already verified
 * Reached from LoginScreen's "Continue with WhatsApp".
 */
import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeBaseProvider } from 'native-base';
import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';
import AppText from '../../../components/AppText';

const MOBILE_RE = /^[6-9]\d{9}$/;

export default function PhoneStartScreen() {
  const router = useRouter();
  const popup = usePopup();
  const [mobile, setMobile] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('lastLoginMobile').then((m) => { if (m && MOBILE_RE.test(m)) setMobile(m); }).catch(() => {});
  }, []);

  const sendCode = async () => {
    if (!MOBILE_RE.test(mobile)) return;
    setBusy(true);
    try {
      const res = await userApi.sendMobileOtp({ mobile, purpose: 'start' });
      const code = res.data?.code;
      if (code === 200) {
        const exists = !!res.data?.data?.exists;
        router.push({
          pathname: '/(root)/(main)/OTPValidationScreen',
          params: { mobile, purpose: 'start', exists: exists ? '1' : '0' },
        });
      } else if (code === 403) {
        popup.error('Number not allowed', res.data?.message || 'This number cannot be used. Please contact support.');
      } else if (code === 429) {
        popup.warning('Please wait', res.data?.message || 'Too many codes requested. Please try again after 10 minutes.');
      } else {
        popup.error('Could not send', res.data?.message || 'We could not send the WhatsApp code. Please try again.');
      }
    } catch (e: any) {
      const code = e?.response?.data?.code ?? e?.response?.status;
      if (code === 429) popup.warning('Please wait', 'Too many codes requested. Please try again after 10 minutes.');
      else popup.error('Could not send', 'Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const valid = MOBILE_RE.test(mobile);

  return (
    <NativeBaseProvider>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <LinearGradient
            colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
            locations={[0, 0.3, 0.6, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 }} enableOnAndroid keyboardShouldPersistTaps="handled">
              <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginTop: 8 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={22} color="#0f1724" />
              </TouchableOpacity>

              <View style={{ marginTop: 28 }}>
                <AppText weight="bold" style={{ fontSize: 26, color: '#0f1724' }}>Your WhatsApp number</AppText>
                <AppText weight="regular" style={{ fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 19 }}>
                  We'll send a 6-digit code on WhatsApp. If you already have an account you'll be signed in; if not, we'll create one.
                </AppText>
              </View>

              <View style={{ backgroundColor: '#1c2b3f', borderRadius: 20, padding: 16, marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(90,167,239,0.28)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="logo-whatsapp" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ color: '#fff', fontSize: 14 }}>No password to remember</AppText>
                  <AppText weight="regular" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>The code arrives in seconds. Tap Copy Code, then paste.</AppText>
                </View>
              </View>

              <AppText weight="bold" style={{ fontSize: 11, color: '#0f1724', letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 26, marginBottom: 8 }}>Mobile number</AppText>
              <View style={{
                flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 28, backgroundColor: '#fff', paddingHorizontal: 16,
                borderWidth: 1.5, borderColor: focused ? '#1F7FE5' : '#e2e8f0',
                shadowColor: '#1F7FE5', shadowOpacity: focused ? 0.18 : 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: focused ? 3 : 1,
              }}>
                <AppText weight="medium" style={{ color: '#64748b', fontSize: 15, marginRight: 8 }}>+91</AppText>
                <TextInput
                  value={mobile}
                  onChangeText={(t) => setMobile(t.replace(/\D/g, '').slice(0, 10))}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="10-digit number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus={!mobile}
                  returnKeyType="done"
                  onSubmitEditing={sendCode}
                  style={{ flex: 1, fontSize: 16, color: '#0f1724', fontFamily: 'Rubik-Regular', letterSpacing: 1 }}
                />
              </View>

              <TouchableOpacity onPress={sendCode} disabled={!valid || busy} activeOpacity={0.85} style={{ marginTop: 22, opacity: !valid || busy ? 0.55 : 1 }}>
                <LinearGradient colors={['#5AA7EF', '#1F7FE5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                  {busy ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                      <AppText weight="bold" style={{ color: '#fff', fontSize: 16 }}>Continue with WhatsApp</AppText>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={{ alignItems: 'center', marginTop: 18 }}>
                <AppText weight="medium" style={{ color: '#1F7FE5', fontSize: 13 }}>Use my PIN instead</AppText>
              </TouchableOpacity>
            </KeyboardAwareScrollView>
          </SafeAreaView>
        </View>
      </TouchableWithoutFeedback>
    </NativeBaseProvider>
  );
}
