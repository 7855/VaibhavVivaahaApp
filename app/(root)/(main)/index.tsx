
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const firstName = await AsyncStorage.getItem('firstName');
        const lastName = await AsyncStorage.getItem('lastName');
        const location = await AsyncStorage.getItem('location');
        const storedGender = await AsyncStorage.getItem('gender');
        const casteId = await AsyncStorage.getItem('casteId');

        if (userId && firstName && lastName && location && storedGender && casteId) {
          const approvalStatus = await AsyncStorage.getItem('userStatus');
          if (approvalStatus === 'APPROVED') {
            router.replace('/(root)/(tabs)');
          } else {
            router.replace('/(root)/(main)/ProfileUnderVerificationScreen');
          }
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/images/wedding.webp")}
        style={styles.backgroundImage}
      />

      {/* Dark gradient overlay from bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(15,23,36,0.4)', 'rgba(15,23,36,0.85)', 'rgba(15,23,36,0.95)']}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Bottom content */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        {/* Brand */}
        <Text style={styles.brand}>Vaibhav Vivaaha</Text>

        {/* Headline */}
        <Text style={styles.title}>Find Your{'\n'}Life Partner</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Where meaningful connections begin.{'\n'}Your journey to a beautiful life starts here.
        </Text>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(root)/(main)/sign-up')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/(root)/(main)/LoginScreen')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1724',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  brand: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontFamily: 'Rubik-ExtraBold',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 21,
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#0f1724',
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
  },
});
