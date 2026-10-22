/**
 * Landing route for WhatsApp / email buttons that open the Requests tab —
 * vaibhavvivaaha://requests/<tab>, reached through the website's
 * /open-app?to=requests page (WhatsApp buttons must be https).
 *
 *   /requests/permissions → Requests → Permissions sub-tab
 *   /requests/received    → Requests → Received
 *   /requests/sent        → Requests → Sent By You
 *
 * Same session rule as app/profile/[id].tsx: signed out → login.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TAB_KEY: Record<string, string> = { permissions: 'request', received: 'received', sent: 'sent' };

export default function RequestsLink() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const [userId, token, status, started] = await AsyncStorage.multiGet([
        'userId', 'authToken', 'userStatus', 'hasStarted',
      ]).then((rows) => rows.map(([, v]) => v));
      setSignedIn(!!userId && !!token && status === 'APPROVED' && started === 'true');
    })();
  }, []);

  if (signedIn === null) {
    return (
      <View style={s.wrap}>
        <ActivityIndicator size="large" color="#1F7FE5" />
      </View>
    );
  }
  if (!signedIn) return <Redirect href="/(root)/(main)/LoginScreen" />;
  const initialTab = TAB_KEY[String(tab || '').toLowerCase()] || 'request';
  return <Redirect href={{ pathname: '/(root)/(tabs)/mailBox', params: { initialTab } }} />;
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f7fa' },
});
