
import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

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
          router.replace('/(root)/(tabs)');
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
      <View style={styles.cardContainer}>
        <Text style={styles.title}>Find Your Best Friend With Us</Text>
        <Text style={styles.subtitle}>
          Let's find your life partner to enjoy every moment of your life.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('/(root)/(main)/LoginScreen')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
           {/* <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push("/(root)/(tabs)")}
          >
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity> */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('/sign-up')}
          >
            <Text style={styles.buttonText}>Get Start</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    position: "absolute",
  },
  cardContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#420001",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "gold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  button: {
    borderWidth: 1.5,
    borderColor: 'white',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
