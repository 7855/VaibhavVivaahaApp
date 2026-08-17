import React, { useState } from 'react';
import { View, Image, TextInput, TouchableOpacity, Dimensions, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { NativeBaseProvider } from 'native-base';
import { usePopup } from '../contexts/PopupContext';
import AppText from '../../../components/AppText';

interface ChangePinScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');
const ChangePinScreen: React.FC<ChangePinScreenProps> = ({ onBack, onComplete }) => {
  const popup = usePopup();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Presentation-only: tracks which field is focused so we can accent its border.
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSavePin = async () => {
    if (newPin.length !== 4 || confirmPin.length !== 4 || newPin !== confirmPin) return;
    setIsLoading(true);

    try {
      const phoneNumber = await AsyncStorage.getItem('resetPhoneNumber');
      if (!phoneNumber) {
        setIsLoading(false);
        popup.error('Error', 'Something went wrong. Please try again.');
        return;
      }

      const requestBody = {
        mobileNumber: phoneNumber,
        pin: newPin
      };

      const response = await userApi.changePin(requestBody);

      if (response.data.code === 200) {
        setIsLoading(false);
        popup.success(
          'PIN Updated',
          'Your PIN has been updated. Please sign in with your new PIN.',
          () => router.replace('/(root)/(main)/LoginScreen')
        );
      } else {
        setIsLoading(false);
        popup.error('Error', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error changing PIN:', error);
      setIsLoading(false);
      popup.error('Error', 'Something went wrong. Please try again.');
    }
  };

  const isFormValid = newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin;
  const pinsMatch = newPin === confirmPin || confirmPin === '';


  return (
    <NativeBaseProvider>
      {/* behavior={undefined} made this a no-op on Android — the PIN fields stayed under the
          keyboard. KeyboardAwareScrollView handles both platforms. */}
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
          <View style={{ flexGrow: 1 }}>
            <LinearGradient
              colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
              locations={[0, 0.3, 0.6, 1.0]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
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

              {/* Brand mark — app-icon tile (see OTPValidationScreen note). */}
              <View style={{ alignItems: 'center', marginTop: 10 }}>
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
              }}>
                Set a New PIN
              </AppText>
              <AppText weight="regular" style={{
                fontSize: 13,
                color: '#64748b',
                lineHeight: 19,
                marginTop: 6,
              }}>
                Choose a 4-digit PIN you'll use to sign in to your account.
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
                  <Ionicons name="lock-closed-outline" size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{
                    fontSize: 13.5,
                    color: '#ffffff',
                  }}>
                    Set Your PIN
                  </AppText>
                  <AppText weight="regular" style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.72)',
                    lineHeight: 15,
                    marginTop: 2,
                  }}>
                    Create a 4-digit PIN you will use to sign in to your account
                  </AppText>
                </View>
              </View>

              {/* New PIN Input */}
              <View style={{ marginBottom: 14 }}>
                <AppText weight="bold" style={{
                  fontSize: 12,
                  color: '#0f1724',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                  marginLeft: 8,
                  marginBottom: 5,
                }}>
                  New PIN
                </AppText>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 52,
                  borderRadius: 28,
                  backgroundColor: '#ffffff',
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
                      flex: 1,
                      fontSize: 14,
                      fontFamily: 'Rubik-Regular',
                      color: '#333',
                      letterSpacing: 8,
                      paddingVertical: 0,
                    }}
                    placeholder="Enter 4-digit PIN"
                    placeholderTextColor="#9aa7b8"
                    secureTextEntry={!showNewPin}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  {newPin.length === 4 && (
                    <View style={{
                      width: 8,
                      height: 8,
                      backgroundColor: '#4CAF50',
                      borderRadius: 4,
                      marginRight: 12,
                    }} />
                  )}
                  <TouchableOpacity onPress={() => setShowNewPin(!showNewPin)}>
                    <Icon
                      name={showNewPin ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
                {newPin.length > 0 && newPin.length !== 4 && (
                  <AppText weight="regular" style={{
                    fontSize: 11.5,
                    color: '#dc2626',
                    marginLeft: 8,
                    marginTop: 6,
                  }}>
                    PIN must be exactly 4 digits
                  </AppText>
                )}
              </View>

              {/* Confirm PIN Input */}
              <View style={{ marginBottom: 14 }}>
                <AppText weight="bold" style={{
                  fontSize: 12,
                  color: '#0f1724',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                  marginLeft: 8,
                  marginBottom: 5,
                }}>
                  Confirm PIN
                </AppText>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 52,
                  borderRadius: 28,
                  backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: !pinsMatch
                    ? 'rgba(220, 38, 38, 0.4)'
                    : (focusedField === 'confirmPin' ? '#1F7FE5' : '#e2e8f0'),
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
                      flex: 1,
                      fontSize: 14,
                      fontFamily: 'Rubik-Regular',
                      color: '#333',
                      letterSpacing: 8,
                      paddingVertical: 0,
                    }}
                    placeholder="Re-enter your PIN"
                    placeholderTextColor="#9aa7b8"
                    secureTextEntry={!showConfirmPin}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  {isFormValid && (
                    <Icon name="check-circle" size={18} color="#4CAF50" style={{ marginRight: 12 }} />
                  )}
                  <TouchableOpacity onPress={() => setShowConfirmPin(!showConfirmPin)}>
                    <Icon
                      name={showConfirmPin ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
                {confirmPin.length > 0 && confirmPin.length !== 4 && (
                  <AppText weight="regular" style={{
                    fontSize: 11.5,
                    color: '#dc2626',
                    marginLeft: 8,
                    marginTop: 6,
                  }}>
                    PIN must be exactly 4 digits
                  </AppText>
                )}
                {confirmPin.length === 4 && !pinsMatch && (
                  <AppText weight="regular" style={{
                    fontSize: 11.5,
                    color: '#dc2626',
                    marginLeft: 8,
                    marginTop: 6,
                  }}>
                    PINs do not match
                  </AppText>
                )}
                {isFormValid && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, marginTop: 6 }}>
                    <Icon name="check-circle" size={14} color="#4CAF50" style={{ marginRight: 6 }} />
                    <AppText weight="medium" style={{
                      fontSize: 11.5,
                      color: '#4CAF50',
                    }}>
                      PINs match
                    </AppText>
                  </View>
                )}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSavePin}
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
                      Securing PIN...
                    </AppText>
                  ) : (
                    <AppText weight="bold" style={{
                      color: '#ffffff',
                      fontSize: 15,
                    }}>
                      Change PIN
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
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
    </NativeBaseProvider>
  );
}

export default ChangePinScreen;
