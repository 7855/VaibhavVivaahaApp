import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Dimensions, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { NativeBaseProvider } from 'native-base';

interface ChangePinScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');
interface ChangePinScreenProps {
  onBack: () => void;
  onComplete: () => void;
}
const ChangePinScreen: React.FC<ChangePinScreenProps> = ({ onBack, onComplete }) => {
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
            onPress: () => router.replace('/(root)/(main)/LoginScreen')
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
      backgroundColor: '#130057',
    }}>
      <View style={{ width: '100%', maxWidth: 400 }}>
        {/* Sacred Header */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ position: 'relative', marginBottom: 24 }}>
            <LinearGradient
              colors={['#f5f5f5', '#e0e0e0', '#f5f5f5']}
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
              {/* Sacred inner rings */}
              <View style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                bottom: 8,
                borderRadius: 36,
                borderWidth: 2,
                borderColor: 'rgba(19, 0, 87, 0.4)',
              }} />
              <View style={{
                position: 'absolute',
                top: 12,
                left: 12,
                right: 12,
                bottom: 12,
                borderRadius: 32,
                borderWidth: 1,
                borderColor: 'rgba(19, 0, 87, 0.3)',
              }} />
              <View style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                bottom: 16,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(19, 0, 87, 0.2)',
              }} />
              
              {/* Divine lock with crown */}
              <View style={{ position: 'relative' }}>
                <Icon name="lock" size={40} color="#130057" />
                <Icon 
                  name="star" 
                  size={20} 
                  color="#130057" 
                  style={{ position: 'absolute', top: -8, right: -4 }} 
                />
              </View>
              
              {/* Sacred sparkles */}
              <Icon 
                name="auto-awesome" 
                size={12} 
                color="rgba(19, 0, 87, 0.6)" 
                style={{ position: 'absolute', top: 8, left: 8 }} 
              />
              <Icon 
                name="auto-awesome" 
                size={8} 
                color="rgba(19, 0, 87, 0.6)" 
                style={{ position: 'absolute', bottom: 8, right: 8 }} 
              />
            </LinearGradient>
            
            {/* Divine aura */}
            <View style={{
              position: 'absolute',
              top: -12,
              left: -12,
              right: -12,
              bottom: -12,
              borderRadius: 56,
              borderWidth: 1,
              borderColor: 'rgba(245, 245, 245, 0.3)',
            }} />
            <View style={{
              position: 'absolute',
              top: -20,
              left: -20,
              right: -20,
              bottom: -20,
              borderRadius: 64,
              borderWidth: 1,
              borderColor: 'rgba(245, 245, 245, 0.2)',
            }} />
            
            {/* Sacred ornaments */}
            <View style={{
              position: 'absolute',
              top: -8,
              left: '50%',
              marginLeft: -8,
              width: 16,
              height: 16,
              backgroundColor: 'rgba(245, 245, 245, 0.6)',
              borderRadius: 8,
            }} />
            <View style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              marginLeft: -6,
              width: 12,
              height: 12,
              backgroundColor: 'rgba(245, 245, 245, 0.6)',
              borderRadius: 6,
            }} />
          </View>
          
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#f5f5f5',
            marginBottom: 12,
            textAlign: 'center',
            textShadowColor: 'rgba(0, 0, 0, 0.3)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
          }}>
            Create PIN
          </Text>
          <Text style={{
            color: '#f5f5f5',
            fontSize: 16,
            fontWeight: '500',
            textAlign: 'center',
            opacity: 0.9,
          }}>
            Establish your security PIN
          </Text>
          
          {/* Sacred divider */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
          }}>
            <View style={{
              width: 32,
              height: 2,
              backgroundColor: 'rgba(245, 245, 245, 0.3)',
            }} />
            <Icon name="security" size={16} color="rgba(245, 245, 245, 0.4)" style={{ marginHorizontal: 8 }} />
            <View style={{
              width: 32,
              height: 2,
              backgroundColor: 'rgba(245, 245, 245, 0.3)',
            }} />
          </View>
        </View>

        {/* Sacred PIN Creation Card */}
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
            {/* Sacred corner decorations */}
            <View style={{
              position: 'absolute',
              top: 12,
              left: 12,
              width: 40,
              height: 40,
              borderLeftWidth: 3,
              borderTopWidth: 3,
              borderColor: 'rgba(19, 0, 87, 0.2)',
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
              borderColor: 'rgba(19, 0, 87, 0.2)',
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
              borderColor: 'rgba(19, 0, 87, 0.2)',
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
              borderColor: 'rgba(19, 0, 87, 0.2)',
              borderBottomRightRadius: 16,
            }} />
            
            {/* Divine energy patterns */}
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
                {/* New Sacred PIN Input */}
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="lock" size={16} color="#130057" />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: '#130057',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginLeft: 8,
                    }}>
                      New Sacred PIN
                    </Text>
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
                      <Icon name="lock" size={20} color="#130057" />
                    </View>
                    <TextInput
                      defaultValue={newPin}
                      onChangeText={(text) => setNewPin(text.replace(/\D/g, '').slice(0, 4))}
                      style={{
                        paddingLeft: 48,
                        paddingRight: 56,
                        paddingVertical: 16,
                        backgroundColor: 'rgba(245, 245, 245, 0.9)',
                        borderWidth: 2,
                        borderColor: 'rgba(19, 0, 87, 0.1)',
                        borderRadius: 16,
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: '#130057',
                        letterSpacing: 8,
                      }}
                      placeholder="New PIN"
                      placeholderTextColor="rgba(19, 0, 87, 0.4)"
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
                        color="rgba(19, 0, 87, 0.4)" 
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
                        backgroundColor: '#f44336',
                        borderRadius: 2,
                        marginRight: 8,
                      }} />
                      <Text style={{
                        fontSize: 14,
                        color: '#f44336',
                        fontWeight: '500',
                      }}>
                        Sacred PIN must be exactly 4 digits
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Sacred PIN Input */}
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="security" size={16} color="#130057" />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: '#130057',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginLeft: 8,
                    }}>
                      Confirm Sacred PIN
                    </Text>
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
                      <Icon name="security" size={20} color="#130057" />
                    </View>
                    <TextInput
                      defaultValue={confirmPin}
                      onChangeText={(text) => setConfirmPin(text.replace(/\D/g, '').slice(0, 4))}
                      style={{
                        paddingLeft: 48,
                        paddingRight: 56,
                        paddingVertical: 16,
                        backgroundColor: 'rgba(245, 245, 245, 0.9)',
                        borderWidth: 2,
                        borderColor: pinsMatch ? 'rgba(19, 0, 87, 0.1)' : 'rgba(244, 67, 54, 0.3)',
                        borderRadius: 16,
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: '#130057',
                        letterSpacing: 8,
                      }}
                      placeholder="Confirm PIN"
                      placeholderTextColor="rgba(19, 0, 87, 0.4)"
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
                        color="rgba(19, 0, 87, 0.4)" 
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
                        backgroundColor: '#f44336',
                        borderRadius: 2,
                        marginRight: 8,
                      }} />
                      <Text style={{
                        fontSize: 14,
                        color: '#f44336',
                        fontWeight: '500',
                      }}>
                        Sacred PIN must be exactly 4 digits
                      </Text>
                    </View>
                  )}
                  {confirmPin.length === 4 && !pinsMatch && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 4,
                        height: 4,
                        backgroundColor: '#f44336',
                        borderRadius: 2,
                        marginRight: 8,
                      }} />
                      <Text style={{
                        fontSize: 14,
                        color: '#f44336',
                        fontWeight: '500',
                      }}>
                        Your PIN do not match
                      </Text>
                    </View>
                  )}
                  {isFormValid && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="check-circle" size={16} color="#4CAF50" style={{ marginRight: 8 }} />
                      <Text style={{
                        fontSize: 14,
                        color: '#4CAF50',
                        fontWeight: '500',
                      }}>
                        PINs match perfectly!
                      </Text>
                    </View>
                  )}
                </View>

                {/* Sacred Save Button */}
                <TouchableOpacity
                  onPress={handleSavePin}
                  disabled={!isFormValid || isLoading}
                  style={{
                    opacity: isFormValid && !isLoading ? 1 : 0.5,
                  }}
                >
                  <LinearGradient
                    colors={isFormValid && !isLoading ? ['#130057', '#1a0066', '#0f0040'] : ['#cccccc', '#cccccc']}
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
                          color: 'white',
                          fontSize: 18,
                          fontWeight: 'bold',
                          marginLeft: 12,
                        }}>
                          Securing PIN...
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="star" size={20} color="white" />
                        <Text style={{
                          color: 'white',
                          fontSize: 18,
                          fontWeight: 'bold',
                          marginLeft: 8,
                        }}>
                          Change Uravugal PIN
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

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

        {/* Divine Security Guidance */}
        {/* <View style={{
          marginTop: 24,
          padding: 20,
          backgroundColor: 'rgba(245, 245, 245, 0.1)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(245, 245, 245, 0.2)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{
              width: 24,
              height: 24,
              backgroundColor: 'rgba(245, 245, 245, 0.2)',
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              marginTop: 2,
            }}>
              <Icon name="star" size={12} color="#f5f5f5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                color: '#f5f5f5',
                fontWeight: '500',
                lineHeight: 20,
              }}>
                <Text style={{ fontWeight: 'bold' }}>Divine Security:</Text> Choose a sacred PIN that resonates with your heart but remains secure from others. This will protect your blessed matrimonial journey.
              </Text>
            </View>
          </View>
        </View> */}
      </View>
    </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
    </NativeBaseProvider>
  )
};

export default ChangePinScreen;
