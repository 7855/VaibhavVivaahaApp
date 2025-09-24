import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [userId, location, gender, casteId] = await Promise.all([
          AsyncStorage.getItem('userId'),
          AsyncStorage.getItem('location'),
          AsyncStorage.getItem('gender'),
          AsyncStorage.getItem('casteId'),
        ]);

        const isAuth = !!(userId && location && gender && casteId);
        setIsAuthenticated(isAuth);
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

  // If authenticated, go to tabs, otherwise go to main page
  return <Redirect href={isAuthenticated ? "/(root)/(tabs)" : "/(root)/(main)"} />;
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
