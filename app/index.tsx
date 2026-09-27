import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [userId, location, gender, casteId, onboardingSeen] = await Promise.all([
          AsyncStorage.getItem('userId'),
          AsyncStorage.getItem('location'),
          AsyncStorage.getItem('gender'),
          AsyncStorage.getItem('casteId'),
          AsyncStorage.getItem('onboardingSeen'),
        ]);

        const isAuth = !!(userId && location && gender && casteId);
        setIsAuthenticated(isAuth);
        setHasSeenOnboarding(onboardingSeen === 'true');
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Splash (native) → first run: onboarding → login. Every later cold start
  // lands on login directly; logout preserves 'onboardingSeen' (utils/storage.ts)
  // so the intro never replays for a signed-out member.
  if (isAuthenticated) return <Redirect href="/(root)/(tabs)" />;
  return (
    <Redirect
      href={hasSeenOnboarding ? "/(root)/(main)/LoginScreen" : "/(root)/(main)/onboarding"}
    />
  );
}

// Loading component
const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#FF6B6B" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
