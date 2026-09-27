import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Retired landing screen → pure router hub.
 *
 * The old full-bleed "Find Your Life Partner" landing (wedding photo + Get
 * Started / Sign In buttons) was replaced by the 3-screen onboarding flow on
 * 2026-08-18: splash → onboarding (once) → LoginScreen. This file stays because
 * several code paths still route to '/(root)/(main)' bare (logout in
 * settingsPage, delete-account success) — they now all funnel to LoginScreen,
 * matching the "after logout show login only" rule.
 *
 * The logged-in restore check is kept from the old screen: a cold start that
 * somehow lands here with a valid stored session still goes straight to tabs
 * (or the under-verification screen), same as before.
 */
export default function MainIndex() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const [userId, firstName, location, gender, casteId] = await Promise.all([
          AsyncStorage.getItem('userId'),
          AsyncStorage.getItem('firstName'),
          AsyncStorage.getItem('location'),
          AsyncStorage.getItem('gender'),
          AsyncStorage.getItem('casteId'),
        ]);

        if (userId && firstName && location && gender && casteId) {
          const approvalStatus = await AsyncStorage.getItem('userStatus');
          if (approvalStatus === 'APPROVED') {
            router.replace('/(root)/(tabs)');
          } else {
            router.replace('/(root)/(main)/ProfileUnderVerificationScreen');
          }
          return;
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
      setChecked(true);
    };

    checkUserStatus();
  }, [router]);

  if (!checked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1F7FE5" />
      </View>
    );
  }

  return <Redirect href="/(root)/(main)/LoginScreen" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f7fa',
  },
});
