import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react-native';
import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';

export default function SetNewPasswordScreen() {
    const popup = usePopup();
    const params = useLocalSearchParams<{ resetToken?: string }>();
    const resetToken = params.resetToken as string | undefined;

    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const pinsMatch = newPin === confirmPin;
    const isValid = newPin.length === 4 && confirmPin.length === 4 && pinsMatch;

    const handleSubmit = async () => {
        if (!isValid) return;
        if (!resetToken) {
            popup.error('Session Expired', 'Reset session expired. Please try again.', () =>
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
                    'Your PIN has been reset successfully. Please login with your new PIN.',
                    () => router.replace('/(root)/(main)/LoginScreen')
                );
            } else {
                popup.error('Error', res.data?.message || 'Failed to reset PIN. Please try again.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            popup.error('Error', 'Failed to reset PIN. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.container}>
                    <View style={styles.iconWrap}>
                        <Lock size={40} color="#fff" strokeWidth={2.5} />
                    </View>

                    <Text style={styles.title}>Set New PIN</Text>
                    <Text style={styles.subtitle}>Create a new 4-digit PIN to secure your account</Text>

                    {/* New PIN */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New PIN</Text>
                        <View style={styles.inputWrap}>
                            <TextInput
                                style={styles.input}
                                value={newPin}
                                onChangeText={(v) => setNewPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
                                keyboardType="number-pad"
                                maxLength={4}
                                secureTextEntry={!showNew}
                                placeholder="••••"
                                placeholderTextColor="#9ca3af"
                            />
                            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                                {showNew ? <EyeOff size={18} color="#6b7280" /> : <Eye size={18} color="#6b7280" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm PIN */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm PIN</Text>
                        <View style={[styles.inputWrap, !pinsMatch && confirmPin.length > 0 && styles.inputWrapError]}>
                            <TextInput
                                style={styles.input}
                                value={confirmPin}
                                onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
                                keyboardType="number-pad"
                                maxLength={4}
                                secureTextEntry={!showConfirm}
                                placeholder="••••"
                                placeholderTextColor="#9ca3af"
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                                {showConfirm ? <EyeOff size={18} color="#6b7280" /> : <Eye size={18} color="#6b7280" />}
                            </TouchableOpacity>
                        </View>
                        {!pinsMatch && confirmPin.length > 0 && (
                            <Text style={styles.errorText}>PINs don't match</Text>
                        )}
                        {pinsMatch && confirmPin.length === 4 && (
                            <View style={styles.matchRow}>
                                <CheckCircle size={14} color="#10b981" />
                                <Text style={styles.matchText}>PINs match</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={!isValid || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Reset PIN</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FDFAFA' },
    container: {
        flex: 1,
        padding: 28,
        justifyContent: 'center',
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1F7FE5',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#130001',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EBDADC',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    inputWrapError: {
        borderColor: '#dc2626',
    },
    input: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#130001',
        paddingVertical: 14,
        letterSpacing: 6,
    },
    eyeBtn: {
        padding: 6,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 2,
    },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        marginLeft: 2,
    },
    matchText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '500',
    },
    submitBtn: {
        backgroundColor: '#1F7FE5',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 14,
        elevation: 3,
        shadowColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitBtnDisabled: {
        backgroundColor: '#9b8284',
        elevation: 0,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    backBtn: {
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 10,
    },
    backBtnText: {
        color: '#1F7FE5',
        fontSize: 14,
        fontWeight: '500',
    },
});
