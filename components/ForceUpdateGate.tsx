// ─────────────────────────────────────────────────────────────
//  ForceUpdateGate.tsx — version check against the APP_VERSION
//  keyValue row; blocks the app when a hard-minimum is unmet.
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Platform, Linking, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import userApi from '../app/(root)/api/userApi';

/**
 * Shape of the `APP_VERSION` keyValue row.
 *
 *   {
 *     "latestVersion":  "1.2.0",
 *     "minimumVersion": "1.1.0",
 *     "androidUrl": "https://play.google.com/store/apps/details?id=com.vaibhavvivaaha.app",
 *     "iosUrl":     "https://apps.apple.com/app/id0000000000",
 *     "message":    "optional custom copy"
 *   }
 *
 * `minimumVersion` is the HARD floor — below it the app is unusable and the dialog cannot be
 * dismissed. `latestVersion` is a soft nudge: the member is told an update exists but can skip.
 * Leave `minimumVersion` off entirely to only ever nudge.
 */
type VersionConfig = {
  latestVersion?: string;
  minimumVersion?: string;
  androidUrl?: string;
  iosUrl?: string;
  message?: string;
};

const STORE_FALLBACK = {
  android: 'https://play.google.com/store/apps/details?id=com.vaibhavvivaaha.app',
  ios: 'https://apps.apple.com/app/id0000000000',
};

/**
 * Compare dotted version strings numerically, segment by segment.
 *
 * A plain string compare is wrong here: "1.10.0" < "1.9.0" lexicographically, which would stop
 * prompting exactly when a minor version crosses 9. Missing segments count as 0, so "1.2" and
 * "1.2.0" are equal.
 *
 * @returns negative when a < b, 0 when equal, positive when a > b.
 */
export function compareVersions(a: string, b: string): number {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

const ForceUpdateGate: React.FC = () => {
  const [config, setConfig] = useState<VersionConfig | null>(null);
  const [mandatory, setMandatory] = useState(false);
  const [visible, setVisible] = useState(false);

  const currentVersion =
    Constants?.expoConfig?.version || (Constants as any)?.manifest?.version || '0.0.0';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await userApi.getKeyValueByKey('APP_VERSION');
        const raw = res?.data?.data?.valueColumn;
        if (!raw) return;

        let parsed: VersionConfig;
        try {
          parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          return;
        }
        if (!mounted) return;

        const belowMinimum =
          !!parsed.minimumVersion && compareVersions(currentVersion, parsed.minimumVersion) < 0;
        const behindLatest =
          !!parsed.latestVersion && compareVersions(currentVersion, parsed.latestVersion) < 0;

        if (belowMinimum || behindLatest) {
          setConfig(parsed);
          setMandatory(belowMinimum);
          setVisible(true);
        }
      } catch {
        // Never block the app on a failed version check — a network blip must not lock
        // everyone out. Worst case we simply don't prompt this launch.
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentVersion]);

  const openStore = useCallback(() => {
    const url =
      Platform.OS === 'ios'
        ? config?.iosUrl || STORE_FALLBACK.ios
        : config?.androidUrl || STORE_FALLBACK.android;
    Linking.openURL(url).catch(() => {
      // If the store can't open we intentionally leave the dialog up rather than closing it,
      // so a mandatory update can't be bypassed by an unopenable link.
    });
  }, [config]);

  if (!visible || !config) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      // A mandatory update must survive the Android hardware back button.
      onRequestClose={() => { if (!mandatory) setVisible(false); }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#5AA7EF', '#1F7FE5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconWrap}
          >
            <Ionicons name="cloud-download-outline" size={28} color="#fff" />
          </LinearGradient>

          <Text style={styles.title}>
            {mandatory ? 'Update required' : 'Update available'}
          </Text>
          <Text style={styles.body}>
            {config.message ||
              (mandatory
                ? 'This version is no longer supported. Please update to continue using Vaibhav Vivaaha.'
                : 'A newer version is available with improvements and fixes.')}
          </Text>
          <Text style={styles.version}>
            You have {currentVersion}
            {config.latestVersion ? ` · Latest ${config.latestVersion}` : ''}
          </Text>

          <TouchableOpacity activeOpacity={0.85} onPress={openStore} style={{ width: '100%' }}>
            <LinearGradient
              colors={['#5AA7EF', '#1F7FE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>
                {Platform.OS === 'ios' ? 'Update on App Store' : 'Update on Play Store'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {!mandatory && (
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.later}>
              <Text style={styles.laterText}>Maybe later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,36,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 26,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontFamily: 'Rubik-Bold', color: '#0f1724', textAlign: 'center' },
  body: {
    fontSize: 13,
    fontFamily: 'Rubik-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  version: {
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
    color: '#94a3b8',
    marginTop: 10,
    marginBottom: 18,
  },
  cta: {
    height: 52,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 15, fontFamily: 'Rubik-Bold', letterSpacing: 0.2 },
  later: { marginTop: 12, paddingVertical: 6 },
  laterText: { fontSize: 13, fontFamily: 'Rubik-Medium', color: '#1F7FE5' },
});

export default ForceUpdateGate;
