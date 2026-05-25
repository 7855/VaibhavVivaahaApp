import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const NoInternetOverlay: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
      opacity.value = withTiming(offline ? 1 : 0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });
    });
    return () => unsub();
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0.5 ? 'auto' as const : 'none' as const,
  }));

  const handleRetry = async () => {
    setChecking(true);
    const state = await NetInfo.fetch();
    const offline = !(state.isConnected && state.isInternetReachable !== false);
    setIsOffline(offline);
    opacity.value = withTiming(offline ? 1 : 0, { duration: 300 });
    setChecking(false);
  };

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.overlay, animStyle]}>
      <LinearGradient
        colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <WifiOff size={40} color="#64748b" strokeWidth={1.8} />
        </View>

        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.subtitle}>
          Please check your network settings{'\n'}and try again
        </Text>

        <TouchableOpacity onPress={handleRetry} activeOpacity={0.85} disabled={checking}>
          <LinearGradient
            colors={['#1F7FE5', '#1862B8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.retryBtn}
          >
            {checking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.retryTxt}>Try Again</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0,
    width, height,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 88, height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: '#162336',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  retryBtn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 140,
    alignItems: 'center',
  },
  retryTxt: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#fff',
    letterSpacing: 0.2,
  },
});

export default NoInternetOverlay;