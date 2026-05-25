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
  stackedButtons?: boolean;
}

// Accent color per variant
const variantAccent: Record<PopupVariant, { title: string; btn: string; btnBg: string }> = {
  success: { title: '#15803d', btn: '#fff', btnBg: '#16a34a' },
  error: { title: '#dc2626', btn: '#fff', btnBg: '#ef4444' },
  warning: { title: '#b45309', btn: '#fff', btnBg: '#f59e0b' },
  info: { title: '#1d4ed8', btn: '#fff', btnBg: '#3b82f6' },
  confirm: { title: '#420001', btn: '#fff', btnBg: '#420001' },
  premium: { title: '#420001', btn: '#fff', btnBg: '#420001' },
  locked: { title: '#dc2626', btn: '#fff', btnBg: '#ef4444' },
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
  const colors = variantAccent[variant];

  // Minimal entry animation — scale + fade only
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.92);
      opacity.setValue(0);
    }
  }, [visible]);

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
      <TouchableOpacity activeOpacity={1} onPress={handleBackdropPress} style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: POPUP_WIDTH }}>
          <Animated.View style={{ opacity, transform: [{ scale }] }}>
            <View style={styles.card}>
              {/* Title */}
              <Text style={[styles.title, { color: colors.title }]}>{title}</Text>

              {/* Description */}
              {description ? (
                <Text style={styles.description}>{description}</Text>
              ) : null}

              {/* Buttons */}
              <View style={{ marginTop: 20, gap: stackedButtons ? 10 : 8, flexDirection: stackedButtons ? 'column' : 'row', width: '100%' }}>
                {buttons.map((btn, idx) => {
                  const isPrimary = btn.variant === 'primary' || (!btn.variant && idx === buttons.length - 1);

                  if (isPrimary) {
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        disabled={btn.loading}
                        onPress={btn.onPress}
                        style={{
                          flex: stackedButtons ? undefined : 1,
                          width: stackedButtons ? '100%' : undefined,
                          backgroundColor: colors.btnBg,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {btn.loading ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <View><Text style={{ fontSize: 14, fontFamily: 'Rubik-Bold', color: '#ffffff' }}>{btn.text || 'OK'}</Text></View>
                        )}
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      disabled={btn.loading}
                      onPress={btn.onPress}
                      style={{
                        flex: stackedButtons ? undefined : 1,
                        width: stackedButtons ? '100%' : undefined,
                        backgroundColor: '#f3f4f6',
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {btn.loading ? (
                        <ActivityIndicator size="small" color="#374151" />
                      ) : (
                        <View><Text style={{ fontSize: 14, fontFamily: 'Rubik-Medium', color: '#374151' }}>{btn.text || 'Cancel'}</Text></View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginTop: 20,
  },
  buttonColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: 8,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.3,
    color: '#374151',
  },
});

export default CommonPopup;
