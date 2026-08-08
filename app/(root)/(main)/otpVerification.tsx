import React, { useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, Image, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AppText from '../../../components/AppText';

const OtpVerification = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
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
      console.log("otp submit", otp);
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
          <Icon name="arrow-left" size={27} color="#130001" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>

        <AppText weight="medium" style={styles.otpHeading}>{t('auth.otp.heading')}</AppText>
        </View>
      </View>

      <View style={styles.centeredView}>
        <Image source={require('../../../assets/images/otp.png')} style={styles.image} resizeMode="contain" />
      </View>

      <AppText weight="bold" style={styles.verificationTitle}>{t('auth.otp.verificationCode')}</AppText>

      <View style={styles.verificationTextContainer}>
        <AppText weight="medium" style={styles.notifyText}>{t('auth.otp.sentMobile')}</AppText>
        <AppText weight="medium" style={styles.mobileNumber}>+91-6379829750</AppText>
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
        <AppText weight="medium">{t('auth.otp.didntGetOtp')}</AppText>
        {showResend ? (
          <TouchableOpacity onPress={resendOtp}>
            <AppText weight="medium" style={styles.resendText}> {t('auth.otp.resendOtp')}</AppText>
          </TouchableOpacity>
        ) : (
          <AppText weight="medium" style={styles.resendText}> {t('auth.otp.resendSmsIn', { seconds: timer })}</AppText>
        )}
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={onSubmit}>
        <AppText weight="bold" style={styles.continueText}>{t('login.continue')}</AppText>
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
  otpHeading: { fontSize: 20, marginLeft: 10 },
  centeredView: { alignItems: 'center', marginBottom: 20 },
  image: { width: '100%', height: 200 },
  verificationTitle: { textAlign: 'center', fontSize: 22, marginBottom: 20 },
  verificationTextContainer: { alignItems: 'center', marginBottom: 15 },
  notifyText: { fontSize: 16, color: '#3F506A' },
  mobileNumber: { fontSize: 15, color: '#3F506A', marginTop: 8 },
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
    fontFamily: 'Rubik-Bold',
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
  resendText: { color: 'gray', marginLeft: 6 },
  continueButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 50,
  },
  continueText: {
    color: '#DADADA',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default OtpVerification;
