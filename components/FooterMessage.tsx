import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FooterMessage = () => {
  return (
    <View style={styles.footer}>
      <View style={styles.footerCard}>
        <View style={styles.textContainer}>
          <Text style={styles.footerText}>We're here with you. Take your time. </Text>
          <MaterialIcons
            name="favorite"
            size={16}
            color="#420001"
          />
        </View>
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
    width: Math.min(SCREEN_WIDTH - 32, 400),
    height: 56,
    backgroundColor: '#ebe0e0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(66, 0, 1, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#7A6B5D',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20, // Added lineHeight to match icon height
  },
});

export default React.memo(FooterMessage);