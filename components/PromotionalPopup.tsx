import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
  Linking,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import userApi from '../app/(root)/api/userApi';

type ShowFrequency = 'every_open' | 'once_per_day' | 'once_ever';

interface PromoConfig {
  enabled?: boolean;
  imageUrl?: string;
  buttonText?: string;
  buttonAction?: string; // route path (when isInternal=true) or URL (when false); empty string = close only
  isInternal?: boolean;  // true → in-app navigation, false → in-app browser
  headerLabel?: string;  // e.g. "Exclusive Offer", "Happy Diwali 🪔"
  dismissText?: string;  // e.g. "No thanks, maybe later"
  showFrequency?: ShowFrequency; // default: "every_open"
  bannerId?: string;     // used as part of the storage key — change to reset once_ever/once_per_day state
}

const STORAGE_KEY_PREFIX = 'promo_seen_';

/** Returns true if the popup should be shown based on frequency config */
async function shouldShowPopup(config: PromoConfig): Promise<boolean> {
  const freq = config.showFrequency ?? 'every_open';
  if (freq === 'every_open') return true;

  const key = STORAGE_KEY_PREFIX + (config.bannerId || 'default');

  if (freq === 'once_ever') {
    const seen = await AsyncStorage.getItem(key);
    return seen === null;
  }

  if (freq === 'once_per_day') {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return true;
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    return stored !== today;
  }

  return true;
}

/** Mark popup as shown — persists based on frequency */
async function markShown(config: PromoConfig): Promise<void> {
  const freq = config.showFrequency ?? 'every_open';
  if (freq === 'every_open') return;

  const key = STORAGE_KEY_PREFIX + (config.bannerId || 'default');

  if (freq === 'once_ever') {
    await AsyncStorage.setItem(key, 'seen');
  } else if (freq === 'once_per_day') {
    const today = new Date().toISOString().slice(0, 10);
    await AsyncStorage.setItem(key, today);
  }
}

const { width } = Dimensions.get('window');
const POPUP_WIDTH = Math.min(width - 48, 340);

const PromotionalPopup: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<PromoConfig | null>(null);
  const [imgLoading, setImgLoading] = useState(true);

  // Entry animation
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await userApi.getKeyValueByKey('promotionalPopupBanner');
        const raw = res?.data?.data?.valueColumn;
        if (!raw) return;
        let parsed: PromoConfig;
        try {
          parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          return;
        }
        if (!parsed?.enabled || !parsed?.imageUrl) return;
        const show = await shouldShowPopup(parsed);
        if (mounted && show) {
          setConfig(parsed);
          setVisible(true);
          await markShown(parsed);
        }
      } catch (err) {
        // silent — promo failure should never block the app
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible]);

  const handleButton = async () => {
    setVisible(false);
    if (!config?.buttonAction) return;

    if (config.isInternal) {
      // In-app navigation (e.g. "/(root)/(tabs)/explore")
      try {
        router.push(config.buttonAction as any);
      } catch (err) {
        console.warn('Promo internal navigation failed:', err);
      }
    } else {
      // External URL → open in in-app browser
      try {
        await WebBrowser.openBrowserAsync(config.buttonAction);
      } catch (err) {
        // fallback to system browser
        Linking.openURL(config.buttonAction).catch(() => {});
      }
    }
  };

  if (!config) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      {/* Blurred maroon-tinted backdrop */}
      <LinearGradient
        colors={['rgba(40,0,0,0.85)', 'rgba(10,0,0,0.92)']}
        style={styles.backdrop}
      >
        {/* Floating ribbon badge above the card */}
        <Animated.View
          style={[
            styles.ribbonWrap,
            { width: POPUP_WIDTH, transform: [{ scale }], opacity },
          ]}
        >
          <LinearGradient
            colors={['#FFD27A', '#F6B733', '#C8861A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ribbon}
          >
            <Ionicons name="sparkles" size={14} color="#5a0001" />
            <Text style={styles.ribbonText}>
              {(config.headerLabel || 'Exclusive Offer').toUpperCase()}
            </Text>
            <Ionicons name="sparkles" size={14} color="#5a0001" />
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { width: POPUP_WIDTH, transform: [{ scale }], opacity },
          ]}
        >
          {/* Gold accent border ring */}
          <LinearGradient
            colors={['#F6B733', '#fdf2f2', '#F6B733']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.borderGlow}
            pointerEvents="none"
          />

          {/* Inner content card */}
          <View style={styles.innerCard}>
            {/* Decorative corner ornaments */}
            <View style={[styles.cornerOrn, styles.cornerTL]} />
            <View style={[styles.cornerOrn, styles.cornerTR]} />
            <View style={[styles.cornerOrn, styles.cornerBL]} />
            <View style={[styles.cornerOrn, styles.cornerBR]} />

            {/* Close icon */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>

            {/* Image with gold frame */}
            <View style={styles.imageFrame}>
              <View style={styles.imageWrap}>
                {imgLoading && (
                  <ActivityIndicator
                    size="large"
                    color="#420001"
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <Image
                  source={{ uri: config.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                  onLoadEnd={() => setImgLoading(false)}
                />
                {/* Top sheen */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.18)', 'transparent']}
                  style={styles.imageSheen}
                  pointerEvents="none"
                />
                {/* Bottom dark vignette */}
                <LinearGradient
                  colors={['transparent', 'rgba(20,0,0,0.45)']}
                  style={styles.imageFade}
                  pointerEvents="none"
                />
              </View>
            </View>

            {/* Decorative divider with diamond */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.diamond}>
                <View style={styles.diamondInner} />
              </View>
              <View style={styles.dividerLine} />
            </View>

            {/* CTA */}
            {config.buttonText ? (
              <View style={styles.ctaShadow}>
                <TouchableOpacity activeOpacity={0.9} onPress={handleButton}>
                  <LinearGradient
                    colors={['#7a0002', '#420001', '#1f0000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cta}
                  >
                    {/* gold shine line on top of button */}
                    <LinearGradient
                      colors={['rgba(246,183,51,0.6)', 'transparent']}
                      style={styles.ctaShine}
                      pointerEvents="none"
                    />
                    <Text style={styles.ctaText}>{config.buttonText}</Text>
                    <View style={styles.ctaArrowCircle}>
                      <Ionicons name="arrow-forward" size={14} color="#420001" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity onPress={() => setVisible(false)} style={styles.dismiss}>
              <Text style={styles.dismissText}>
                {config.dismissText || 'No thanks, maybe later'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // Floating gold ribbon above the card
  ribbonWrap: {
    alignItems: 'center',
    marginBottom: -18,
    zIndex: 10,
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#F6B733',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
  ribbonText: {
    color: '#420001',
    fontSize: 12,
    fontFamily: 'Rubik-ExtraBold',
    letterSpacing: 2.5,
  },
  // Outer card — gold border ring
  card: {
    borderRadius: 26,
    padding: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.55,
    shadowRadius: 36,
    elevation: 22,
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
  },
  innerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  // Decorative corner ornaments
  cornerOrn: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#F6B733',
    zIndex: 3,
  },
  cornerTL: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(246,183,51,0.6)',
  },
  // Image area with gold frame
  imageFrame: {
    marginTop: 28,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 2,
    backgroundColor: '#F6B733',
    shadowColor: '#420001',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fdf2f2',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  // Divider with diamond
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 18,
    paddingHorizontal: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F6B733',
    opacity: 0.6,
  },
  diamond: {
    width: 12,
    height: 12,
    backgroundColor: '#F6B733',
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamondInner: {
    width: 5,
    height: 5,
    backgroundColor: '#420001',
  },
  // CTA
  ctaShadow: {
    marginHorizontal: 22,
    borderRadius: 16,
    shadowColor: '#420001',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  cta: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F6B733',
    overflow: 'hidden',
    position: 'relative',
  },
  ctaShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  ctaText: {
    color: '#FFE7B5',
    fontSize: 14,
    fontFamily: 'Rubik-ExtraBold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ctaArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F6B733',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  dismiss: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'center',
  },
  dismissText: {
    color: '#9a7f7f',
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    letterSpacing: 0.4,
    textDecorationLine: 'underline',
  },
});

export default PromotionalPopup;
