import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Dimensions, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { NativeBaseProvider } from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  // Matches the auth screens' focus treatment (border + shadow lift on the active field).
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSavePin = async () => {
    if (newPin.length !== 4 || confirmPin.length !== 4 || newPin !== confirmPin) return;
    setIsLoading(true);

    try {
      const phoneNumber = await AsyncStorage.getItem('resetPhoneNumber');
      if (!phoneNumber) {
        setIsLoading(false);
        Alert.alert('Error', 'Phone number not found');
        return;
      }

      const requestBody = {
        mobileNumber: phoneNumber,
        pin: newPin
      };

      const response = await userApi.changePin(requestBody);
      console.log('Change PIN response:', response.data);

      if (response.data.code === 200) {
        setIsLoading(false);
        Alert.alert(
          'Success',
          'PIN changed successfully',
          [{
            text: 'OK',
            onPress: () => router.back()
          }]
        );
      } else {
        setIsLoading(false);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error changing PIN:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to change PIN. Please try again.');
    }
  };

  const isFormValid = newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin;
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
                  Set a new 4-digit PIN to secure your account.
                </Text>

                {/* New PIN */}
                <Text style={{
                  fontSize: 11, fontFamily: 'Rubik-Medium', color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 26, marginBottom: 8,
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
                      color: '#333', paddingVertical: 0, textAlign: 'center',
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
                    <Icon name={showNewPin ? 'visibility-off' : 'visibility'} size={20} color="#94a3b8" />
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
                      color: '#333', paddingVertical: 0, textAlign: 'center',
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
                    <Icon name={showConfirmPin ? 'visibility-off' : 'visibility'} size={20} color="#94a3b8" />
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