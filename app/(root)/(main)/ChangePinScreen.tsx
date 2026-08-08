import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { NativeBaseProvider } from 'native-base';
import { usePopup } from '../contexts/PopupContext';
import { useTranslation } from 'react-i18next';
import AppText from '../../../components/AppText';

interface ChangePinScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');
const ChangePinScreen: React.FC<ChangePinScreenProps> = ({ onBack, onComplete }) => {
  const popup = usePopup();
  const { t } = useTranslation();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSavePin = async () => {
    if (newPin.length !== 4 || confirmPin.length !== 4 || newPin !== confirmPin) return;
    setIsLoading(true);

    try {
      const phoneNumber = await AsyncStorage.getItem('resetPhoneNumber');
      if (!phoneNumber) {
        setIsLoading(false);
        popup.error(t('common.error'), t('login.errors.genericMessage'));
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
          t('auth.changePin.pinUpdatedTitle'),
          t('auth.changePin.pinUpdatedMessage'),
          () => router.replace('/(root)/(main)/LoginScreen')
        );
      } else {
        setIsLoading(false);
        popup.error(t('common.error'), t('login.errors.genericMessage'));
      }
    } catch (error) {
      console.error('Error changing PIN:', error);
      setIsLoading(false);
      popup.error(t('common.error'), t('login.errors.genericMessage'));
    }
  };

  const isFormValid = newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin;
  const pinsMatch = newPin === confirmPin || confirmPin === '';


  return (
        <NativeBaseProvider>
    
      <KeyboardAvoidingView
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
          }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
                width: 88,
                height: 88,
                borderRadius: 44,
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
                borderRadius: 36,
                borderWidth: 2,
                borderColor: 'rgba(31, 127, 229, 0.35)',
              }} />
              <View style={{
                position: 'absolute',
                top: 12,
                left: 12,
                right: 12,
                bottom: 12,
                borderRadius: 32,
                borderWidth: 1,
                borderColor: 'rgba(31, 127, 229, 0.25)',
              }} />
              <View style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                bottom: 16,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(31, 127, 229, 0.18)',
              }} />

              {/* Lock icon */}
              <View style={{ position: 'relative' }}>
                <Icon name="lock" size={40} color="#1F7FE5" />
                <Icon 
                  name="star" 
                  size={20} 
                  color="#1F7FE5" 
                  style={{ position: 'absolute', top: -8, right: -4 }} 
                />
              </View>
              
              {/* Sparkles */}
              <Icon
                name="auto-awesome"
                size={12}
                color="rgba(31, 127, 229, 0.6)"
                style={{ position: 'absolute', top: 8, left: 8 }}
              />
              <Icon
                name="auto-awesome"
                size={8}
                color="rgba(31, 127, 229, 0.6)"
                style={{ position: 'absolute', bottom: 8, right: 8 }}
              />
            </LinearGradient>

            {/* Aura rings */}
            <View style={{
              position: 'absolute',
              top: -12,
              left: -12,
              right: -12,
              bottom: -12,
              borderRadius: 56,
              borderWidth: 1,
              borderColor: '#1F7FE5',
            }} />
            <View style={{
              position: 'absolute',
              top: -20,
              left: -20,
              right: -20,
              bottom: -20,
              borderRadius: 64,
              borderWidth: 1,
              borderColor: '#1F7FE5',
            }} />
            
            <View style={{
              position: 'absolute',
              top: -8,
              left: '50%',
              marginLeft: -8,
              width: 16,
              height: 16,
              backgroundColor: '#1F7FE5',
              borderRadius: 8,
            }} />
            <View style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              marginLeft: -6,
              width: 12,
              height: 12,
              backgroundColor: '#1F7FE5',
              borderRadius: 6,
            }} />
          </View>
          
          <AppText weight="bold" style={{
            fontSize: 20,
            color: '#0f1724',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            {t('auth.changePin.title')}
          </AppText>
          <AppText weight="regular" style={{
            fontSize: 12,
            color: '#64748b',
            textAlign: 'center',
          }}>
            {t('auth.changePin.subtitle')}
          </AppText>
          
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
            <Icon name="security" size={16} color="#1F7FE5" style={{ marginHorizontal: 8 }} />
            <View style={{
              width: 32,
              height: 2,
              backgroundColor: '#1F7FE5',
            }} />
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
                {/* New PIN Input */}
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="lock" size={16} color="#1F7FE5" />
                    <AppText weight="bold" style={{
                      fontSize: 12,
                      color: '#0f1724',
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                      marginLeft: 8,
                    }}>
                      {t('auth.changePin.newPin')}
                    </AppText>
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
                      <Icon name="lock" size={20} color="#1F7FE5" />
                    </View>
                    <TextInput
                      defaultValue={newPin}
                      onChangeText={(text) => setNewPin(text.replace(/\D/g, '').slice(0, 4))}
                      style={{
                        paddingLeft: 48,
                        paddingRight: 56,
                        paddingVertical: 16,
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        borderRadius: 16,
                        fontSize: 14,
                        fontFamily: 'Rubik-Bold',
                        color: '#0f1724',
                        letterSpacing: 8,
                      }}
                      placeholder={t('auth.changePin.newPin')}
                      placeholderTextColor="#999"
                      secureTextEntry={!showNewPin}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPin(!showNewPin)}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: 0,
                        bottom: 0,
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        name={showNewPin ? 'visibility-off' : 'visibility'}
                        size={20}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                    {newPin.length === 4 && (
                      <View style={{
                        position: 'absolute',
                        right: 48,
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
                  {newPin.length > 0 && newPin.length !== 4 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 4,
                        height: 4,
                        backgroundColor: '#dc2626',
                        borderRadius: 2,
                        marginRight: 8,
                      }} />
                      <AppText weight="regular" style={{
                        fontSize: 14,
                        color: '#dc2626',
                      }}>
                        {t('auth.changePin.pinMustBe4')}
                      </AppText>
                    </View>
                  )}
                </View>

                {/* Confirm PIN Input */}
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="security" size={16} color="#1F7FE5" />
                    <AppText weight="bold" style={{
                      fontSize: 12,
                      color: '#0f1724',
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                      marginLeft: 8,
                    }}>
                      {t('auth.changePin.confirmPin')}
                    </AppText>
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
                      <Icon name="security" size={20} color="#1F7FE5" />
                    </View>
                    <TextInput
                      defaultValue={confirmPin}
                      onChangeText={(text) => setConfirmPin(text.replace(/\D/g, '').slice(0, 4))}
                      style={{
                        paddingLeft: 48,
                        paddingRight: 56,
                        paddingVertical: 16,
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: pinsMatch ? '#e2e8f0' : 'rgba(220, 38, 38, 0.4)',
                        borderRadius: 16,
                        fontSize: 14,
                        fontFamily: 'Rubik-Bold',
                        color: '#0f1724',
                        letterSpacing: 8,
                      }}
                      placeholder={t('auth.changePin.confirmPin')}
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirmPin}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPin(!showConfirmPin)}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: 0,
                        bottom: 0,
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        name={showConfirmPin ? 'visibility-off' : 'visibility'}
                        size={20}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                    {isFormValid && (
                      <View style={{
                        position: 'absolute',
                        right: 48,
                        top: 0,
                        bottom: 0,
                        justifyContent: 'center',
                      }}>
                        <Icon name="check-circle" size={20} color="#4CAF50" />
                      </View>
                    )}
                  </View>
                  {confirmPin.length > 0 && confirmPin.length !== 4 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 4,
                        height: 4,
                        backgroundColor: '#dc2626',
                        borderRadius: 2,
                        marginRight: 8,
                      }} />
                      <AppText weight="regular" style={{
                        fontSize: 14,
                        color: '#dc2626',
                      }}>
                        {t('auth.changePin.pinMustBe4')}
                      </AppText>
                    </View>
                  )}
                  {confirmPin.length === 4 && !pinsMatch && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 4,
                        height: 4,
                        backgroundColor: '#dc2626',
                        borderRadius: 2,
                        marginRight: 8,
                      }} />
                      <AppText weight="regular" style={{
                        fontSize: 14,
                        color: '#dc2626',
                      }}>
                        {t('auth.changePin.pinsDoNotMatch')}
                      </AppText>
                    </View>
                  )}
                  {isFormValid && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="check-circle" size={16} color="#4CAF50" style={{ marginRight: 8 }} />
                      <AppText weight="medium" style={{
                        fontSize: 14,
                        color: '#4CAF50',
                      }}>
                        {t('auth.changePin.pinsMatch')}
                      </AppText>
                    </View>
                  )}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSavePin}
                  disabled={!isFormValid || isLoading}
                  style={{
                    opacity: isFormValid && !isLoading ? 1 : 0.5,
                  }}
                >
                  <LinearGradient
                    colors={isFormValid && !isLoading ? ['#1F7FE5', '#1862b8'] : ['#cccccc', '#cccccc']}
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
                          {t('auth.changePin.securingPin')}
                        </AppText>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="star" size={20} color="white" />
                        <AppText weight="bold" style={{
                          color: '#fff',
                          fontSize: 18,
                          marginLeft: 8,
                        }}>
                          {t('auth.changePin.changePinButton')}
                        </AppText>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

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
    </KeyboardAvoidingView>
    </NativeBaseProvider>
  );
}

export default ChangePinScreen;
