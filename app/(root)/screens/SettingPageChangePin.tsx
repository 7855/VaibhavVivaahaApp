import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Image } from 'react-native';
import { usePopup } from '../contexts/PopupContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { NativeBaseProvider } from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserData } from '../contexts/UserDataContext';

interface ChangePinScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');
interface ChangePinScreenProps {
  onBack: () => void;
  onComplete: () => void;
}
const SettingPageChangePin: React.FC<ChangePinScreenProps> = ({ onBack, onComplete }) => {
  const { userData } = useUserData();
  const popup = usePopup();
  // The member must prove their CURRENT pin before it changes (2026-09-05) —
  // settings-only rule; the forgot-PIN flow has no old pin and stays as-is.
  const [oldPin, setOldPin] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  // Matches the auth screens' focus treatment (border + shadow lift on the active field).
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSavePin = async () => {
    if (oldPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4 || newPin !== confirmPin) return;
    setIsLoading(true);

    try {
      // 🔴 This used to read AsyncStorage 'resetPhoneNumber', which is NEVER WRITTEN
      // anywhere in the app — four screens read that key and nothing sets it. So this
      // screen failed with "Phone number not found" 100% of the time and Settings →
      // Change PIN could not work at all.
      //
      // That key belonged to a legacy mobile-OTP reset flow. The live forgot-PIN flow
      // is email-based (`resetEmail` + a resetToken → SetNewPasswordScreen) and never
      // populates it. This screen is reached by a member who is already SIGNED IN, so
      // the right identity is simply their own number: UserDataContext, with the
      // AsyncStorage key LoginScreen actually writes as a fallback.
      const phoneNumber =
        userData?.mobileNumber || (await AsyncStorage.getItem('mobileNumber'));
      if (!phoneNumber) {
        setIsLoading(false);
        popup.error('Error', 'Could not identify your account. Please sign in again.');
        return;
      }

      const requestBody = {
        mobileNumber: phoneNumber,
        oldPin,
        newPin,
      };

      const response = await userApi.changePinWithOld(requestBody);
      console.log('Change PIN response:', response.data);

      if (response.data.code === 200) {
        setIsLoading(false);
        popup.success('PIN Changed', 'Your PIN has been updated successfully.', () => router.back());
      } else if (response.data.code === 401) {
        setIsLoading(false);
        popup.error('Incorrect PIN', 'The current PIN you entered is wrong. Please try again.');
      } else {
        setIsLoading(false);
        popup.error('Error', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error changing PIN:', error);
      setIsLoading(false);
      popup.error('Error', 'Failed to change PIN. Please try again.');
    }
  };

  const isFormValid = oldPin.length === 4 && newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin;
  const pinsMatch = newPin === confirmPin || confirmPin === '';


  return (
    <NativeBaseProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#d0dfeb' }} edges={['top']}>
        <LinearGradient
          colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
          locations={[0, 0.3, 0.6, 1.0]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1, paddingHorizontal: 22, alignItems: 'center' }}>

                {/* Back button — same pill the auth screens use */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: '#ffffff',
                    alignItems: 'center', justifyContent: 'center',
                    alignSelf: 'flex-start',
                    marginTop: 8,
                    shadowColor: '#1F7FE5',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
                  }}
                >
                  <Icon name="chevron-left" size={24} color="#0f1724" />
                </TouchableOpacity>

                {/* Brand mark */}
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <View style={{
                    width: 68, height: 68, borderRadius: 20,
                    backgroundColor: '#ffffff',
                    shadowColor: '#1F7FE5',
                    shadowOpacity: 0.14, shadowRadius: 14,
                    shadowOffset: { width: 0, height: 6 }, elevation: 4,
                  }}>
                    <Image
                      source={require('../../../assets/images/LotusLogo.png')}
                      style={{ width: 68, height: 68, borderRadius: 20 }}
                      resizeMode="cover"
                    />
                  </View>
                </View>

                {/* Heading — 26px, centred with the rest of the page content. The FIELD
                    labels below are left-aligned against their inputs. */}
                <Text style={{
                  fontSize: 26, fontFamily: 'Rubik-Bold', color: '#0f1724',
                  letterSpacing: -0.3, marginTop: 24, textAlign: 'center',
                }}>
                  Change PIN
                </Text>
                <Text style={{
                  fontSize: 13, fontFamily: 'Rubik-Regular', color: '#64748b',
                  marginTop: 6, lineHeight: 19, textAlign: 'center',
                }}>
                  Enter your current PIN, then set a new 4-digit PIN.
                </Text>

                {/* Current (old) PIN — must match server-side before the change is allowed */}
                <Text style={{
                  fontSize: 11, fontFamily: 'Rubik-Medium', color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 26, marginBottom: 8,
                  width: '100%', textAlign: 'left', paddingLeft: 4,
                }}>
                  Current PIN
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  width: '100%',
                  height: 52, borderRadius: 28, backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: focusedField === 'oldPin' ? '#1F7FE5' : '#e2e8f0',
                  paddingHorizontal: 20,
                  shadowColor: '#1F7FE5',
                  shadowOffset: { width: 0, height: focusedField === 'oldPin' ? 4 : 2 },
                  shadowOpacity: focusedField === 'oldPin' ? 0.16 : 0.06,
                  shadowRadius: focusedField === 'oldPin' ? 10 : 6,
                  elevation: focusedField === 'oldPin' ? 3 : 1,
                }}>
                  <Icon name="lock-outline" size={18} color="#1F7FE5" style={{ marginRight: 10 }} />
                  <TextInput
                    defaultValue={oldPin}
                    onChangeText={(text) => setOldPin(text.replace(/\D/g, '').slice(0, 4))}
                    onFocus={() => setFocusedField('oldPin')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      flex: 1, fontSize: 14, fontFamily: 'Rubik-Regular',
                      color: '#333', paddingVertical: 0, textAlign: oldPin.length ? 'center' : 'left',
                      letterSpacing: oldPin.length ? 8 : 0,
                    }}
                    placeholder="Current PIN"
                    placeholderTextColor="#9aa7b8"
                    secureTextEntry={!showOldPin}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <TouchableOpacity
                    onPress={() => setShowOldPin(!showOldPin)}
                    style={{ justifyContent: 'center', paddingLeft: 8 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name={showOldPin ? 'visibility' : 'visibility-off'} size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* New PIN */}
                <Text style={{
                  fontSize: 11, fontFamily: 'Rubik-Medium', color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 18, marginBottom: 8,
                  width: '100%', textAlign: 'left', paddingLeft: 4,
                }}>
                  New PIN
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  width: '100%',
                  height: 52, borderRadius: 28, backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: focusedField === 'newPin' ? '#1F7FE5' : '#e2e8f0',
                  paddingHorizontal: 20,
                  shadowColor: '#1F7FE5',
                  shadowOffset: { width: 0, height: focusedField === 'newPin' ? 4 : 2 },
                  shadowOpacity: focusedField === 'newPin' ? 0.16 : 0.06,
                  shadowRadius: focusedField === 'newPin' ? 10 : 6,
                  elevation: focusedField === 'newPin' ? 3 : 1,
                }}>
                  <Icon name="lock" size={18} color="#1F7FE5" style={{ marginRight: 10 }} />
                  <TextInput
                    defaultValue={newPin}
                    onChangeText={(text) => setNewPin(text.replace(/\D/g, '').slice(0, 4))}
                    onFocus={() => setFocusedField('newPin')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      flex: 1, fontSize: 14, fontFamily: 'Rubik-Regular',
                      color: '#333', paddingVertical: 0, textAlign: newPin.length ? 'center' : 'left',
                      // letterSpacing applies to the PLACEHOLDER as well as the value, so a
                      // wide-tracked hint overflowed the pill. Only track the typed digits.
                      letterSpacing: newPin.length ? 8 : 0,
                    }}
                    placeholder="Enter PIN"
                    placeholderTextColor="#9aa7b8"
                    secureTextEntry={!showNewPin}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPin(!showNewPin)}
                    style={{ justifyContent: 'center', paddingLeft: 8 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name={showNewPin ? 'visibility' : 'visibility-off'} size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Confirm PIN */}
                <Text style={{
                  fontSize: 11, fontFamily: 'Rubik-Medium', color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 18, marginBottom: 8,
                  width: '100%', textAlign: 'left', paddingLeft: 4,
                }}>
                  Confirm PIN
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  width: '100%',
                  height: 52, borderRadius: 28, backgroundColor: '#ffffff',
                  borderWidth: 1,
                  // Mismatch wins over focus so the error stays visible while still typing.
                  borderColor: !pinsMatch
                    ? '#dc2626'
                    : focusedField === 'confirmPin' ? '#1F7FE5' : '#e2e8f0',
                  paddingHorizontal: 20,
                  shadowColor: '#1F7FE5',
                  shadowOffset: { width: 0, height: focusedField === 'confirmPin' ? 4 : 2 },
                  shadowOpacity: focusedField === 'confirmPin' ? 0.16 : 0.06,
                  shadowRadius: focusedField === 'confirmPin' ? 10 : 6,
                  elevation: focusedField === 'confirmPin' ? 3 : 1,
                }}>
                  <Icon name="security" size={18} color="#1F7FE5" style={{ marginRight: 10 }} />
                  <TextInput
                    defaultValue={confirmPin}
                    onChangeText={(text) => setConfirmPin(text.replace(/\D/g, '').slice(0, 4))}
                    onFocus={() => setFocusedField('confirmPin')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      flex: 1, fontSize: 14, fontFamily: 'Rubik-Regular',
                      color: '#333', paddingVertical: 0, textAlign: confirmPin.length ? 'center' : 'left',
                      letterSpacing: confirmPin.length ? 8 : 0,
                    }}
                    placeholder="Re-enter PIN"
                    placeholderTextColor="#9aa7b8"
                    secureTextEntry={!showConfirmPin}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPin(!showConfirmPin)}
                    style={{ justifyContent: 'center', paddingLeft: 8 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name={showConfirmPin ? 'visibility' : 'visibility-off'} size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {!pinsMatch && (
                  <Text style={{
                    fontSize: 12, fontFamily: 'Rubik-Regular', color: '#dc2626', marginTop: 8,
                    width: '100%', textAlign: 'center',
                  }}>
                    PINs do not match
                  </Text>
                )}

                {/* CTA — gradient pill. Label is #fff, not the old low-contrast #DADADA. */}
                <TouchableOpacity
                  onPress={handleSavePin}
                  disabled={!isFormValid || isLoading}
                  activeOpacity={0.85}
                  style={{ marginTop: 28, width: '100%', opacity: isFormValid && !isLoading ? 1 : 0.55 }}
                >
                  <LinearGradient
                    colors={['#5AA7EF', '#1F7FE5']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                      height: 54, borderRadius: 28,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{
                      color: '#ffffff', fontSize: 16, fontFamily: 'Rubik-Bold', letterSpacing: 0.2,
                    }}>
                      {isLoading ? 'Securing PIN...' : 'Change PIN'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    </NativeBaseProvider>
  );
};

export default SettingPageChangePin;