import React from 'react';
import { Text, StyleSheet, Linking, StyleProp, TextStyle } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { LEGAL_URLS } from '../constants/data';

/**
 * "By continuing, you agree to our Terms & Conditions, Refund & Cancellation Policy and Privacy
 * Policy." — shown directly under every button that leads to a payment, with each policy name
 * tappable (client, 2026-09-28).
 *
 * One component on purpose: the plan card (PremiumTab) and the checkout screen
 * (GatewayCheckoutView) must say exactly the same thing, and at a dispute, "the member was shown
 * the refund terms before paying" is the whole defence.
 *
 * Links open the WEBSITE pages (single source of truth) in the in-app browser, so the member
 * returns to the same screen afterwards. Nested <Text> keeps it one wrapping paragraph.
 */
async function open(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    // No custom-tab provider on this device — fall back to the system browser.
    Linking.openURL(url).catch(() => {});
  }
}

export default function PolicyAgreement({
  prefix = 'By continuing, you agree to our',
  style,
  linkColor = '#1F7FE5',
}: {
  prefix?: string;
  style?: StyleProp<TextStyle>;
  linkColor?: string;
}) {
  const link = [s.link, { color: linkColor }];
  return (
    <Text style={[s.base, style]}>
      {prefix}{' '}
      <Text style={link} onPress={() => open(LEGAL_URLS.terms)} accessibilityRole="link">
        Terms & Conditions
      </Text>
      {', '}
      <Text style={link} onPress={() => open(LEGAL_URLS.refund)} accessibilityRole="link">
        Refund & Cancellation Policy
      </Text>
      {' and '}
      <Text style={link} onPress={() => open(LEGAL_URLS.privacy)} accessibilityRole="link">
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

const s = StyleSheet.create({
  base: { fontSize: 11, lineHeight: 16, fontFamily: 'Rubik-Regular', color: '#64748b', textAlign: 'center' },
  link: { fontFamily: 'Rubik-Medium', textDecorationLine: 'underline' },
});
