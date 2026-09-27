import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Closing note at the bottom of Home. Design only (2026-09-26): the copy is fixed;
// the card moved from a flat tan-text pill onto the app's card language — white,
// radius 18, #e7edf5 hairline, blue-tinted shadow, the heart in a blue-soft tile,
// ink text — so it reads as part of the same system as the Quick Actions above it.
const FooterMessage = () => {
  return (
    <View style={styles.footer}>
      <View style={styles.footerCard}>
        <LinearGradient
          colors={['#ffffff', '#f2f7fd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heartTile}>
          <MaterialIcons name="favorite" size={16} color="#1F7FE5" />
        </View>
        <Text style={styles.footerText}>We're here with you. Take your time.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 1,
    paddingBottom: 24,
    paddingTop: 0,
  },
  footerCard: {
    width: Math.min(SCREEN_WIDTH - 20, 400),
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e7edf5',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    shadowColor: '#1F7FE5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  heartTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#dfecfb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#0f1724',
    fontSize: 13.5,
    fontFamily: 'Rubik-Medium',
    letterSpacing: -0.1,
    lineHeight: 20,
    flexShrink: 1,
  },
});

export default React.memo(FooterMessage);
