import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

const OtpVerification = () => {
  const navigation = useNavigation();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [showResend, setShowResend] = useState(false);
  const [timer, setTimer] = useState(30);

  const inputs: React.RefObject<TextInput>[] = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];
  React.useEffect(() => {
    if (!showResend && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setShowResend(true);
    }
  }, [timer, showResend]);

  const handleChange = (text: string, index: number) => {
    if (/^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
  
      const nextInput = inputs[index + 1]?.current;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };
  
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      
      // Only move to previous input if not at first input
      if (index > 0) {
        const prevInput = inputs[index - 1]?.current;
        if (prevInput) {
          prevInput.focus();
        }
      }
    }
  };
  

  const onSubmit = () => {
    if (otp.every((digit) => digit !== '')) {
    //   navigation.navigate('');
    console.log("otp submit",otp);
    
    }
  };

  const resendOtp = () => {
    setShowResend(false);
    setTimer(30);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

    <SafeAreaView edges={["top","bottom","left","right"]} style={styles.container}>
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={27} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>

        <Text style={styles.otpHeading}>OTP</Text>
        </View>
      </View>

      <View style={styles.centeredView}>
        <Image source={require('../../../assets/images/otp.png')} style={styles.image} resizeMode="contain" />
      </View>

      <Text style={styles.verificationTitle}>Verification Code</Text>

      <View style={styles.verificationTextContainer}>
        <Text style={styles.notifyText}>We have sent verification code to</Text>
        <Text style={styles.notifyText}>your mobile number</Text>
        <Text style={styles.mobileNumber}>+91-6379829750</Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((value, index) => (
          <TextInput
            key={index}
            ref={inputs[index]}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={1}
            defaultValue={value}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
          />
        ))}
      </View>

      <View style={styles.resendSection}>
        <Text style={{ fontWeight: '600' }}>Didn't get OTP?</Text>
        {showResend ? (
          <TouchableOpacity onPress={resendOtp}>
            <Text style={styles.resendText}> Resend OTP</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.resendText}> Resend SMS in {timer}s</Text>
        )}
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={onSubmit}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
    </TouchableWithoutFeedback>

  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    gap: 10,
  },
  otpHeading: { fontSize: 20, fontWeight: '600', marginLeft: 10 },
  centeredView: { alignItems: 'center', marginBottom: 20 },
  image: { width: '100%', height: 200 },
  verificationTitle: { textAlign: 'center', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  verificationTextContainer: { alignItems: 'center', marginBottom: 15 },
  notifyText: { fontSize: 16, color: '#3F506A', fontWeight: '600' },
  mobileNumber: { fontSize: 15, fontWeight: 'semibold', color: '#3F506A', marginTop: 8 },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 20,
    alignItems: 'center',
  },
  otpInput: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ccc',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: { color: 'gray', fontWeight: '600', marginLeft: 6 },
  continueButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 50,
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default OtpVerification;
