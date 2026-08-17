import React, { useState } from 'react';
import {
    View,
    Image,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Lock, CheckCircle, ShieldCheck } from 'lucide-react-native';
import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';
import AppText from '../../../components/AppText';

export default function SetNewPasswordScreen() {
    const popup = usePopup();
    const params = useLocalSearchParams<{ resetToken?: string }>();
    const resetToken = params.resetToken as string | undefined;

    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    // Presentation-only: tracks which field is focused so we can accent its border.
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const pinsMatch = newPin === confirmPin;
    const isValid = newPin.length === 4 && confirmPin.length === 4 && pinsMatch;

    const handleSubmit = async () => {
        if (!isValid) return;
        if (!resetToken) {
            popup.error('Session Expired', 'Your reset session has expired. Please request a new code.', () =>
                router.replace('/(root)/(main)/ResetPasswordScreen')
            );
            return;
        }

        try {
            setLoading(true);
            const res = await userApi.resetPasswordWithToken({
                resetToken,
                newPassword: newPin,
            });

            if (res.data?.code === 200) {
                popup.success(
                    'PIN Reset',
                    'Your PIN has been reset. Please sign in with your new PIN.',
                    () => router.replace('/(root)/(main)/LoginScreen')
                );
            } else {
                popup.error('Error', res.data?.message || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            popup.error('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
                locations={[0, 0.3, 0.6, 1.0]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={styles.safeArea}>
                {/* behavior={undefined} was a no-op on Android — PIN fields sat under the keyboard. */}
                <KeyboardAwareScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    enableOnAndroid={true}
                    enableAutomaticScroll={true}
                    extraScrollHeight={Platform.OS === 'ios' ? 30 : 20}
                    keyboardOpeningTime={0}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    enableResetScrollToCoords={false}
                >
                    <View style={styles.container}>
                        {/* Brand mark — logo in a soft white halo, the screen's single focal point */}
                        <View style={styles.logoHalo}>
                            <Image
                                source={require('../../../assets/images/LotusLogo.png')}
                                style={styles.logo}
                                resizeMode="cover"
                            />
                        </View>

                        <AppText weight="bold" style={styles.title}>Set a New PIN</AppText>
                        <AppText weight="regular" style={styles.subtitle}>
                            Create a 4-digit PIN you'll use to sign in to your account.
                        </AppText>

                        {/* Dark step banner */}
                        <View style={styles.banner}>
                            <View style={styles.bannerIcon}>
                                <ShieldCheck size={18} color="#ffffff" strokeWidth={2.2} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText weight="bold" style={styles.bannerTitle}>Almost Done</AppText>
                                <AppText weight="regular" style={styles.bannerSubtitle}>
                                    Your identity is verified — just pick a new PIN
                                </AppText>
                            </View>
                        </View>

                        {/* New PIN */}
                        <View style={styles.inputGroup}>
                            <AppText weight="medium" style={styles.label}>New PIN</AppText>
                            <View style={[styles.inputWrap, focusedField === 'newPin' && styles.inputWrapFocused]}>
                                <Lock size={18} color="#1F7FE5" strokeWidth={2.2} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    value={newPin}
                                    onChangeText={(v) => setNewPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
                                    onFocus={() => setFocusedField('newPin')}
                                    onBlur={() => setFocusedField(null)}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    secureTextEntry={!showNew}
                                    placeholder="••••"
                                    placeholderTextColor="#9aa7b8"
                                />
                                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                                    {showNew ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm PIN */}
                        <View style={styles.inputGroup}>
                            <AppText weight="medium" style={styles.label}>Confirm PIN</AppText>
                            <View style={[
                                styles.inputWrap,
                                focusedField === 'confirmPin' && styles.inputWrapFocused,
                                !pinsMatch && confirmPin.length > 0 && styles.inputWrapError,
                            ]}>
                                <Lock size={18} color="#1F7FE5" strokeWidth={2.2} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    value={confirmPin}
                                    onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
                                    onFocus={() => setFocusedField('confirmPin')}
                                    onBlur={() => setFocusedField(null)}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    secureTextEntry={!showConfirm}
                                    placeholder="••••"
                                    placeholderTextColor="#9aa7b8"
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                                    {showConfirm ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                                </TouchableOpacity>
                            </View>
                            {!pinsMatch && confirmPin.length > 0 && (
                                <AppText weight="regular" style={styles.errorText}>PINs do not match</AppText>
                            )}
                            {pinsMatch && confirmPin.length === 4 && (
                                <View style={styles.matchRow}>
                                    <CheckCircle size={14} color="#10b981" />
                                    <AppText weight="medium" style={styles.matchText}>PINs match</AppText>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!isValid || loading}
                            style={{ marginTop: 18, opacity: isValid && !loading ? 1 : 0.55 }}
                        >
                            <LinearGradient
                                colors={['#5AA7EF', '#1F7FE5']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.submitBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <AppText weight="bold" style={styles.submitBtnText}>Reset PIN</AppText>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <AppText weight="medium" style={styles.backBtnText}>Back</AppText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAwareScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: {
        flex: 1,
        paddingHorizontal: 22,
        paddingVertical: 28,
        justifyContent: 'center',
    },
    // Rounded-square "app icon" tile, not a circle. The logo PNG has NO transparency (a solid
    // square with its own background), so circle-cropping it showed the logo's square background
    // inside the disc — mismatched edges. A tile shows the asset exactly as designed.
    logoHalo: {
        width: 68,
        height: 68,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
        elevation: 4,
    },
    logo: {
        width: 68,
        height: 68,
        borderRadius: 20,
    },
    title: {
        fontSize: 26,
        color: '#0f1724',
        letterSpacing: -0.3,
        marginTop: 24,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 19,
        marginTop: 6,
        textAlign: 'center',
    },
    banner: {
        backgroundColor: '#1c2b3f',
        borderRadius: 20,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
        marginBottom: 24,
        shadowColor: '#1c2b3f',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 5,
    },
    bannerIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(90,167,239,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerTitle: {
        fontSize: 13.5,
        color: '#ffffff',
    },
    bannerSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 15,
        marginTop: 2,
    },
    inputGroup: {
        marginBottom: 14,
    },
    label: {
        fontSize: 12,
        color: '#0f1724',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginLeft: 8,
        marginBottom: 5,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 28,
        height: 52,
        paddingHorizontal: 20,
        shadowColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
    },
    inputWrapFocused: {
        borderColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
        elevation: 3,
    },
    inputWrapError: {
        borderColor: '#dc2626',
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Rubik-Medium',
        color: '#333',
        paddingVertical: 0,
        letterSpacing: 8,
    },
    eyeBtn: {
        padding: 6,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 11.5,
        marginTop: 6,
        marginLeft: 8,
    },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        marginLeft: 8,
    },
    matchText: {
        color: '#10b981',
        fontSize: 11.5,
    },
    submitBtn: {
        height: 54,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 15,
    },
    backBtn: {
        alignItems: 'center',
        marginTop: 18,
        paddingVertical: 4,
    },
    backBtnText: {
        color: '#1F7FE5',
        fontSize: 13,
    },
});
