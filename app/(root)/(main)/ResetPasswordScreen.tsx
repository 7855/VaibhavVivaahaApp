import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Dimensions, KeyboardAvoidingView, TouchableWithoutFeedback, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { NativeBaseProvider } from 'native-base';

interface ResetPasswordScreenProps {
  onBack: () => void;
  onContinue: (phoneNumber: string) => void;
}

const { width, height } = Dimensions.get('window');

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onBack, onContinue }) => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (phoneNumber.length !== 10) return;
    setIsLoading(true);

    try {
      const response = await userApi.sendOtp(phoneNumber);
      console.log('OTP response:------------------------------------>', response.data.code);

      if (response.data.code === 200) {
        await AsyncStorage.setItem('resetPhoneNumber', phoneNumber);
        setIsLoading(false);
        router.push('/(root)/(main)/OTPValidationScreen');
      }else if(response.data.code === 404){
        setIsLoading(false);
        Alert.alert('Error', 'Please Enter Registered Mobile number');
      } else {
        setIsLoading(false);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  const isFormValid = phoneNumber.length === 10;

  return (
    // <KeyboardAvoidingView
    //   style={{
    //     flex: 1,
    //     justifyContent: 'center',
    //     backgroundColor: '#f9fafb',
    //   }}
    //   behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    // >
    <NativeBaseProvider>
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
                width: 80,
                height: 80,
                borderRadius: 40,
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
                borderRadius: 32,
                borderWidth: 2,
                borderColor: 'rgba(19, 0, 87, 0.4)',
              }} />
              <View style={{
                position: 'absolute',
                top: 12,
                left: 12,
                right: 12,
                bottom: 12,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(19, 0, 87, 0.3)',
              }} />
              
              {/* Sacred Shield Icon */}
              <Icon name="security" size={36} color="#130057" />
              
              {/* Floating elements */}
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 12,
                height: 12,
                backgroundColor: 'rgba(19, 0, 87, 0.3)',
                borderRadius: 6,
              }} />
              <View style={{
                position: 'absolute',
                bottom: -4,
                left: -4,
                width: 8,
                height: 8,
                backgroundColor: 'rgba(19, 0, 87, 0.3)',
                borderRadius: 4,
              }} />
            </LinearGradient>
            
            {/* Sacred geometry around logo */}
            <View style={{
              position: 'absolute',
              top: -12,
              left: '50%',
              marginLeft: -16,
              width: 32,
              height: 8,
              backgroundColor: 'rgba(245, 245, 245, 0.3)',
              borderRadius: 4,
            }} />
            <View style={{
              position: 'absolute',
              bottom: -12,
              left: '50%',
              marginLeft: -12,
              width: 24,
              height: 4,
              backgroundColor: 'rgba(245, 245, 245, 0.3)',
              borderRadius: 2,
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
            Uravugal PIN Recovery
          </Text>
          <Text style={{
            color: '#f5f5f5',
            fontSize: 16,
            fontWeight: '500',
            textAlign: 'center',
            opacity: 0.9,
          }}>
            Restore access to your heart connection
          </Text>
          
          {/* Decorative divider */}
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
            <Icon name="spa" size={16} color="rgba(245, 245, 245, 0.4)" style={{ marginHorizontal: 12 }} />
            <View style={{
              width: 32,
              height: 2,
              backgroundColor: 'rgba(245, 245, 245, 0.3)',
            }} />
          </View>
        </View>

        {/* Sacred Recovery Card */}
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
            {/* Traditional corner decorations */}
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
            
            {/* Sacred patterns */}
            <View style={{
              position: 'absolute',
              top: 24,
              left: '50%',
              marginLeft: -32,
              width: 64,
              height: 4,
              backgroundColor: 'rgba(19, 0, 87, 0.1)',
              borderRadius: 2,
            }} />
            <View style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              marginLeft: -24,
              width: 48,
              height: 2,
              backgroundColor: 'rgba(19, 0, 87, 0.1)',
              borderRadius: 1,
            }} />
            
            <View style={{ padding: 36 }}>
              <View style={{ gap: 28 }}>
                {/* Sacred Mobile Input */}
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="phone" size={16} color="#130057" />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: '#130057',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginLeft: 8,
                    }}>
                      Registered Uravugal Number
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
                      <Icon name="phone" size={20} color="#130057" />
                    </View>
                    <TextInput
                      defaultValue={phoneNumber}
                      onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, '').slice(0, 10))}
                      style={{
                        paddingLeft: 48,
                        paddingRight: 16,
                        paddingVertical: 16,
                        backgroundColor: 'rgba(245, 245, 245, 0.9)',
                        borderWidth: 2,
                        borderColor: 'rgba(19, 0, 87, 0.1)',
                        borderRadius: 16,
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#130057',
                      }}
                      placeholder="Enter your mobile number"
                      placeholderTextColor="rgba(19, 0, 87, 0.4)"
                      keyboardType="numeric"
                      maxLength={10}
                    />
                    {phoneNumber.length === 10 && (
                      <View style={{
                        position: 'absolute',
                        right: 16,
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
                  {phoneNumber.length > 0 && phoneNumber.length !== 10 && (
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
                        Please enter a complete 10-digit uravugal number
                      </Text>
                    </View>
                  )}
                </View>

                {/* Sacred Continue Button */}
                <TouchableOpacity
                  onPress={handleContinue}
                  disabled={!isFormValid || isLoading}
               
                >
                  <LinearGradient
                    colors={isFormValid && !isLoading ? ['#130057', '#1a00a8'] : ['#cccccc', '#999999']}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 24,
                      borderRadius: 16,
                      alignItems: 'center',
                      // shadowColor: '#000',
                      // shadowOffset: { width: 0, height: 8 },
                      // shadowOpacity: 0.3,
                      // shadowRadius: 16,
                      // elevation: 8,
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
                          Sending Sacred Code...
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="security" size={20} color="white" />
                        <Text style={{
                          color: 'white',
                          fontSize: 16,
                          fontWeight: 'bold',
                          marginLeft: 8,
                        }}>
                          Send Verification Code
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
                    fontSize: 14,
                    fontWeight: '600',
                    marginLeft: 8,
                  }}>
                    Return to Login Screen
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Sacred Information */}
        <View style={{
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
              <View style={{
                width: 8,
                height: 8,
                backgroundColor: '#f5f5f5',
                borderRadius: 4,
              }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                color: '#f5f5f5',
                fontWeight: '500',
                lineHeight: 20,
              }}>
                <Text style={{ fontWeight: 'bold' }}>Uravugal Assurance:</Text> We'll send a 4-digit verification code to your registered mobile number for secure access restoration.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
      </TouchableWithoutFeedback>
    </NativeBaseProvider>
    // </KeyboardAvoidingView>

  );
};

export default ResetPasswordScreen;