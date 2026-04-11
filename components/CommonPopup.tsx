import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export type PopupVariant = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'premium' | 'locked';

export interface PopupButton {
  text: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  loading?: boolean;
}

export interface CommonPopupProps {
  visible: boolean;
  title: string;
  description?: string;
  variant?: PopupVariant;
  buttons?: PopupButton[];
  onClose?: () => void;
  dismissable?: boolean;
  stackedButtons?: boolean; // render buttons in a column instead of a row
}

interface VariantStyle {
  gradient: [string, string, string];
  ring: string;
  iconBg: string;
  iconColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleColor: string;
}

const variantConfig: Record<PopupVariant, VariantStyle> = {
  success: {
    gradient: ['#16a34a', '#15803d', '#0f5d2c'],
    ring: '#bbf7d0',
    iconBg: '#dcfce7',
    iconColor: '#15803d',
    icon: 'checkmark-circle',
    titleColor: '#15803d',
  },
  error: {
    gradient: ['#ef4444', '#dc2626', '#991b1b'],
    ring: '#fecaca',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    icon: 'close-circle',
    titleColor: '#dc2626',
  },
  warning: {
    gradient: ['#f59e0b', '#d97706', '#92400e'],
    ring: '#fde68a',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    icon: 'alert-circle',
    titleColor: '#d97706',
  },
  info: {
    gradient: ['#3b82f6', '#2563eb', '#1d4ed8'],
    ring: '#bfdbfe',
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    icon: 'information-circle',
    titleColor: '#2563eb',
  },
  confirm: {
    gradient: ['#7a0002', '#420001', '#1f0000'],
    ring: '#f3d5d6',
    iconBg: '#fdecec',
    iconColor: '#420001',
    icon: 'help-circle',
    titleColor: '#420001',
  },
  premium: {
    gradient: ['#6d28d9', '#4c1d95', '#2e1065'],
    ring: '#F6B733',
    iconBg: '#f5f0ff',
    iconColor: '#6d28d9',
    icon: 'diamond',
    titleColor: '#4c1d95',
  },
  locked: {
    gradient: ['#7a0002', '#420001', '#1f0000'],
    ring: '#f3d5d6',
    iconBg: '#fdecec',
    iconColor: '#420001',
    icon: 'lock-closed',
    titleColor: '#420001',
  },
};

const { width } = Dimensions.get('window');
const POPUP_WIDTH = Math.min(width - 48, 340);

const CommonPopup: React.FC<CommonPopupProps> = ({
  visible,
  title,
  description,
  variant = 'info',
  buttons = [{ text: 'OK', variant: 'primary' }],
  onClose,
  dismissable = true,
  stackedButtons = false,
}) => {
  const cfg = variantConfig[variant];

  // Entry animations
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const haloPulse = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(120),
          Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        ]),
      ]).start();

      // Pulsing halo behind icon (loops)
      Animated.loop(
        Animated.sequence([
          Animated.timing(haloPulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(haloPulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      // Slow sparkle rotation
      Animated.loop(
        Animated.timing(sparkleRotate, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
      ).start();

      // Shimmer line across header
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerX, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          Animated.delay(800),
          Animated.timing(shimmerX, { toValue: -1, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
      iconScale.setValue(0);
      haloPulse.setValue(0);
      sparkleRotate.setValue(0);
      shimmerX.setValue(-1);
    }
  }, [visible]);

  const haloScale = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const haloOpacity = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const sparkleRotation = sparkleRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const shimmerTranslate = shimmerX.interpolate({ inputRange: [-1, 1], outputRange: [-POPUP_WIDTH, POPUP_WIDTH] });

  const handleBackdropPress = () => {
    if (dismissable && onClose) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => dismissable && onClose?.()}
    >
      <TouchableOpacity activeOpacity={1} onPress={handleBackdropPress} style={styles.backdropTouchable}>
        <LinearGradient
          colors={['rgba(20,0,0,0.75)', 'rgba(5,0,0,0.9)']}
          style={StyleSheet.absoluteFillObject}
        />

        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: POPUP_WIDTH }}>
          <Animated.View
            style={{
              opacity,
              transform: [{ scale }],
            }}
          >
            <View style={styles.card}>
              {/* Decorative gold corner brackets on the card */}
              <View style={[styles.cornerBracket, styles.cornerTL]} />
              <View style={[styles.cornerBracket, styles.cornerTR]} />
              <View style={[styles.cornerBracket, styles.cornerBL]} />
              <View style={[styles.cornerBracket, styles.cornerBR]} />

              {/* Top gradient header strip with curved bottom */}
              <LinearGradient
                colors={cfg.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerStrip}
              >
                {/* Decorative dot pattern */}
                <View style={styles.headerDots}>
                  {[0.15, 0.25, 0.4, 0.55, 0.7, 0.85].map((o, i) => (
                    <View key={i} style={[styles.headerDot, { opacity: o }]} />
                  ))}
                </View>

                {/* Animated shimmer line */}
                <Animated.View
                  style={[
                    styles.shimmer,
                    { transform: [{ translateX: shimmerTranslate }, { rotate: '15deg' }] },
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              </LinearGradient>

              {/* Curved overlap from header into body */}
              <View style={styles.headerCurve} />

              {/* Floating icon badge with halo + sparkles */}
              <View style={styles.iconWrap}>
                {/* Pulsing halo */}
                <Animated.View
                  style={[
                    styles.halo,
                    {
                      backgroundColor: cfg.iconColor,
                      opacity: haloOpacity,
                      transform: [{ scale: haloScale }],
                    },
                  ]}
                />

                {/* Rotating sparkles */}
                <Animated.View
                  style={[
                    styles.sparkleOrbit,
                    { transform: [{ rotate: sparkleRotation }] },
                  ]}
                  pointerEvents="none"
                >
                  <View style={[styles.sparkle, styles.sparkleTop]}>
                    <Ionicons name="sparkles" size={12} color="#F6B733" />
                  </View>
                  <View style={[styles.sparkle, styles.sparkleRight]}>
                    <Ionicons name="sparkles" size={10} color="#F6B733" />
                  </View>
                  <View style={[styles.sparkle, styles.sparkleBottom]}>
                    <Ionicons name="sparkles" size={12} color="#F6B733" />
                  </View>
                  <View style={[styles.sparkle, styles.sparkleLeft]}>
                    <Ionicons name="sparkles" size={10} color="#F6B733" />
                  </View>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.iconRing,
                    { borderColor: cfg.ring, transform: [{ scale: iconScale }] },
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
                    <Ionicons name={cfg.icon} size={44} color={cfg.iconColor} />
                  </View>
                </Animated.View>
              </View>

              {/* Body */}
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <View style={styles.titleOrnament} />
                  <Text style={[styles.title, { color: cfg.titleColor }]}>{title}</Text>
                  <View style={styles.titleOrnament} />
                </View>

                {description ? <Text style={styles.description}>{description}</Text> : null}

                {/* Decorative gold divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <View style={styles.diamond} />
                  <View style={styles.dividerLine} />
                </View>

                {/* Buttons */}
                <View
                  style={[
                    stackedButtons ? styles.buttonColumn : styles.buttonRow,
                    !stackedButtons && buttons.length === 1 && { justifyContent: 'center' },
                  ]}
                >
                  {buttons.map((btn, idx) => {
                    const isPrimary = btn.variant === 'primary' || (!btn.variant && idx === buttons.length - 1);
                    const isDestructive = btn.variant === 'destructive';
                    const isSecondary = !isPrimary && !isDestructive;

                    if (isSecondary) {
                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.85}
                          disabled={btn.loading}
                          onPress={btn.onPress}
                          style={[
                            styles.button,
                            styles.secondaryButton,
                            !stackedButtons && buttons.length === 1 && { minWidth: 160 },
                            stackedButtons && { width: '100%' },
                          ]}
                        >
                          {btn.loading ? (
                            <ActivityIndicator size="small" color="#420001" />
                          ) : (
                            <Text style={styles.secondaryButtonText}>{btn.text}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    }

                    const gradColors = isDestructive
                      ? (['#ef4444', '#dc2626', '#991b1b'] as [string, string, string])
                      : cfg.gradient;

                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.9}
                        disabled={btn.loading}
                        onPress={btn.onPress}
                        style={[
                          styles.buttonShadow,
                          !stackedButtons && buttons.length === 1 && { minWidth: 160 },
                          stackedButtons && { width: '100%' },
                        ]}
                      >
                        <LinearGradient
                          colors={gradColors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.button, styles.primaryButton]}
                        >
                          {/* top sheen */}
                          <LinearGradient
                            colors={['rgba(255,255,255,0.25)', 'transparent']}
                            style={styles.buttonSheen}
                            pointerEvents="none"
                          />
                          {btn.loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.primaryButtonText}>{btn.text}</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  // Gold corner brackets on the card
  cornerBracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#F6B733',
    zIndex: 5,
  },
  cornerTL: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 },
  // Top gradient strip
  headerStrip: {
    height: 80,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
  },
  shimmer: {
    position: 'absolute',
    top: -20,
    left: 0,
    width: 80,
    height: 140,
  },
  headerCurve: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    transform: [{ scaleX: 1.2 }],
  },
  headerDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  headerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  // Floating icon
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -52,
    height: 110,
    zIndex: 4,
  },
  halo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  sparkleOrbit: {
    position: 'absolute',
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleTop: { top: 0 },
  sparkleRight: { right: 0 },
  sparkleBottom: { bottom: 0 },
  sparkleLeft: { left: 0 },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Body
  body: {
    paddingTop: 6,
    paddingBottom: 26,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  titleOrnament: {
    width: 14,
    height: 2,
    backgroundColor: '#F6B733',
    borderRadius: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    color: '#6b6b6b',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  // Divider with diamond
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    marginTop: 18,
    marginBottom: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F6B733',
    opacity: 0.5,
  },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: '#F6B733',
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 10,
  },
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  buttonColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  buttonShadow: {
    flex: 1,
    borderRadius: 14,
    shadowColor: '#420001',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttonSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fdf2f2',
    borderWidth: 1.5,
    borderColor: '#e8d5d5',
  },
  secondaryButtonText: {
    color: '#420001',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

export default CommonPopup;
