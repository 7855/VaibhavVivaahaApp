/**
 * Landing route for shared profile links — https://vaibhavvivaahamatrimony.com/profile/<id>.
 *
 * The share sheet (ProfileDetail → profileWebUrl) puts the BASE64 member id in the web URL, while
 * ProfileDetail itself needs the RAW numeric id (its `userId` param goes straight into
 * /getProfileDetailWithIntractionStatus, a `@PathVariable Long`). This route is the adapter:
 * decode, then hand off. It is reached by the Android App Link declared in AndroidManifest.xml
 * (and, on iOS, by associatedDomains once an AASA file is hosted).
 *
 * A signed-out member is sent to login instead — ProfileDetail cannot render without a session.
 * The link is not replayed after login (kept simple; the member can tap it again).
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Base64 member id → raw numeric id; a raw numeric id passes through; anything else → null. */
export function decodeProfileLinkId(raw: string | undefined): string | null {
  const v = String(raw ?? '').trim();
  if (!v) return null;
  if (/^\d+$/.test(v)) return v;
  try {
    const decoded = atob(v);
    return /^\d+$/.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export default function ProfileLink() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [target, setTarget] = useState<'loading' | 'login' | 'home' | { userId: string }>('loading');

  useEffect(() => {
    let alive = true;
    (async () => {
      const userId = decodeProfileLinkId(id);
      let signedIn = false;
      try {
        const [me, location, gender, casteId] = await Promise.all([
          AsyncStorage.getItem('userId'),
          AsyncStorage.getItem('location'),
          AsyncStorage.getItem('gender'),
          AsyncStorage.getItem('casteId'),
        ]);
        // Same session test as app/index.tsx, so a half-written session is not treated as a login.
        signedIn = !!(me && location && gender && casteId);
      } catch {
        signedIn = false;
      }
      if (!alive) return;
      if (!signedIn) setTarget('login');
      else if (!userId) setTarget('home');
      else setTarget({ userId });
    })();
    return () => { alive = false; };
  }, [id]);

  if (target === 'loading') {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#1F7FE5" />
      </View>
    );
  }
  if (target === 'login') return <Redirect href="/(root)/(main)/LoginScreen" />;
  if (target === 'home') return <Redirect href="/(root)/(tabs)" />;
  return (
    <Redirect
      href={{ pathname: '/(root)/screens/ProfileDetail', params: { userId: target.userId } } as any}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F7FA' },
});
