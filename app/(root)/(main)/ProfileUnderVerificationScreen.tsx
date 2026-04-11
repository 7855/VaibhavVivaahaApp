import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Linking,
    ActivityIndicator,
    Image,
    SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Clock, AlertTriangle, LogOut, MessageCircle, RefreshCw } from 'lucide-react-native';
import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';

export default function ProfileUnderVerificationScreen() {
    const popup = usePopup();
    const [userStatus, setUserStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [firstName, setFirstName] = useState<string>('');
    const [userId, setUserId] = useState<string | null>(null);
    const [resubmitting, setResubmitting] = useState(false);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        const status = await AsyncStorage.getItem('userStatus');
        const reason = await AsyncStorage.getItem('rejectionReason');
        const fname = await AsyncStorage.getItem('firstName');
        const uid = await AsyncStorage.getItem('userId');
        setUserStatus(status || 'PENDING');
        setRejectionReason(reason);
        setFirstName(fname || '');
        setUserId(uid);
    };

    const handleContactSupport = async () => {
        const whatsappUrl = 'whatsapp://send?phone=+919876543210&text=Hi, I need help with my Vaibhav Vivaaha profile verification';
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
            Linking.openURL(whatsappUrl);
        } else {
            Linking.openURL('mailto:support@vaibhavvivaaha.com');
        }
    };

    const handleLogout = () => {
        popup.confirm(
            'Logout',
            'Are you sure you want to logout?',
            async () => {
                await AsyncStorage.multiRemove([
                    'authToken', 'refreshToken', 'userId', 'firstName', 'lastName', 'gender',
                    'location', 'casteId', 'isUser', 'hasStarted', 'mobileNumber',
                    'profileImage', 'userStatus', 'rejectionReason',
                ]);
                router.replace('/(root)/(main)');
            },
            'Logout',
            'Cancel'
        );
    };

    const handleResubmit = async () => {
        if (!userId) return;
        try {
            setResubmitting(true);
            const res = await userApi.resubmitProfile(userId);
            if (res.data?.code === 200) {
                await AsyncStorage.setItem('userStatus', 'PENDING');
                await AsyncStorage.removeItem('rejectionReason');
                setUserStatus('PENDING');
                setRejectionReason(null);
                popup.success('Resubmitted', 'Your profile has been resubmitted for review.');
            } else {
                popup.error('Error', res.data?.message || 'Failed to resubmit profile');
            }
        } catch (err) {
            popup.error('Error', 'Failed to resubmit profile. Please try again.');
        } finally {
            setResubmitting(false);
        }
    };

    const isRejected = userStatus === 'REJECTED';

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.iconCircle, isRejected ? styles.iconCircleRed : styles.iconCircleMaroon]}>
                        {isRejected ? (
                            <AlertTriangle size={44} color="#fff" strokeWidth={2.5} />
                        ) : (
                            <Clock size={44} color="#fff" strokeWidth={2.5} />
                        )}
                    </View>
                    <Text style={styles.title}>
                        {isRejected ? 'Profile Needs Update' : 'Profile Under Review'}
                    </Text>
                    {firstName ? <Text style={styles.subtitle}>Hi {firstName},</Text> : null}
                </View>

                {/* Message */}
                {isRejected ? (
                    <View style={styles.rejectionCard}>
                        <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                        <Text style={styles.rejectionText}>
                            {rejectionReason || 'Please review your profile and resubmit with accurate information.'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.messageCard}>
                        <Text style={styles.messageText}>
                            Thank you for registering with Vaibhav Vivaaha! Your profile is currently being reviewed by our team.
                        </Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Estimated time:</Text>
                            <Text style={styles.infoValue}>Usually within 24 hours</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status:</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusBadgeText}>PENDING</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* What happens next */}
                <View style={styles.stepsCard}>
                    <Text style={styles.stepsTitle}>What happens next?</Text>
                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                        <Text style={styles.stepText}>Our team reviews your profile details</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                        <Text style={styles.stepText}>You'll receive an email once approved</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                        <Text style={styles.stepText}>Login again to access all features</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {isRejected && (
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={handleResubmit}
                            disabled={resubmitting}
                        >
                            {resubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <RefreshCw size={18} color="#fff" />
                                    <Text style={styles.primaryBtnText}>Resubmit Profile</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleContactSupport}>
                        <MessageCircle size={18} color="#420001" />
                        <Text style={styles.secondaryBtnText}>Contact Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.ghostBtn} onPress={handleLogout}>
                        <LogOut size={16} color="#666" />
                        <Text style={styles.ghostBtnText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FDFAFA',
    },
    container: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 6,
        shadowColor: '#420001',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    iconCircleMaroon: {
        backgroundColor: '#420001',
    },
    iconCircleRed: {
        backgroundColor: '#dc2626',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#130001',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        fontWeight: '500',
    },
    messageCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F2E8E9',
        elevation: 1,
        shadowColor: '#420001',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    messageText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F5EEEF',
    },
    infoLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 13,
        color: '#130001',
        fontWeight: '600',
    },
    statusBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        color: '#92400E',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    rejectionCard: {
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
        borderLeftWidth: 4,
        borderLeftColor: '#dc2626',
    },
    rejectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#991B1B',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rejectionText: {
        fontSize: 14,
        color: '#7F1D1D',
        lineHeight: 22,
    },
    stepsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F2E8E9',
    },
    stepsTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#420001',
        marginBottom: 14,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepNumber: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#420001',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    stepText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    actions: {
        gap: 12,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#420001',
        paddingVertical: 15,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#420001',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#420001',
    },
    secondaryBtnText: {
        color: '#420001',
        fontSize: 15,
        fontWeight: '600',
    },
    ghostBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        marginTop: 4,
    },
    ghostBtnText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '500',
    },
});
