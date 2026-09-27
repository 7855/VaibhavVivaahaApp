import React, { useEffect, useState } from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Keyboard,
    Linking,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, AlertTriangle, LogOut, MessageCircle, RefreshCw } from 'lucide-react-native';
import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';
import AppText from '../../../components/AppText';

export default function ProfileUnderVerificationScreen() {
    const popup = usePopup();
    const [userStatus, setUserStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [firstName, setFirstName] = useState<string>('');
    const [userId, setUserId] = useState<string | null>(null);
    const [resubmitting, setResubmitting] = useState(false);
    // Optional message to the admin, sent with the resubmission (max 250 chars,
    // mirrored server-side in UserService.resubmitProfile).
    const [adminMessage, setAdminMessage] = useState('');

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        const status = await AsyncStorage.getItem('userStatus');
        const reason = await AsyncStorage.getItem('rejectionReason');
        const fname = await AsyncStorage.getItem('firstName');
        const lname = await AsyncStorage.getItem('lastName');
        const uid = await AsyncStorage.getItem('userId');
        setUserStatus(status || 'PENDING');
        setRejectionReason(reason);
        // Full name (client ask) — falls back to first name alone if lastName is absent.
        setFirstName([fname, lname].map(v => (v || '').trim()).filter(Boolean).join(' '));
        setUserId(uid);
    };

    const handleContactSupport = async () => {
        const whatsappUrl = 'whatsapp://send?phone=+917904547565&text=Hi, I need help with my Vaibhav Vivaaha profile verification';
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
            Linking.openURL(whatsappUrl);
        } else {
            Linking.openURL('mailto:selvakrish820@gmail.com');
        }
    };

    const handleLogout = () => {
        popup.confirm(
            'Log Out',
            'Are you sure you want to log out?',
            async () => {
                await AsyncStorage.multiRemove([
                    'authToken', 'refreshToken', 'userId', 'firstName', 'lastName', 'gender',
                    'location', 'casteId', 'isUser', 'hasStarted', 'mobileNumber',
                    'profileImage', 'userStatus', 'rejectionReason',
                ]);
                router.replace('/(root)/(main)');
            },
            'Log Out',
            'Cancel'
        );
    };

    const handleResubmit = async () => {
        if (!userId) return;
        try {
            setResubmitting(true);
            Keyboard.dismiss();
            const res = await userApi.resubmitProfile(userId, adminMessage.trim());
            if (res.data?.code === 200) {
                await AsyncStorage.setItem('userStatus', 'PENDING');
                await AsyncStorage.removeItem('rejectionReason');
                setUserStatus('PENDING');
                setRejectionReason(null);
                setAdminMessage('');
                popup.success('Profile Resubmitted', "Your profile has been sent for review again. We'll let you know once it's approved.");
            } else {
                popup.error('Error', res.data?.message || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            popup.error('Error', 'Something went wrong. Please try again.');
        } finally {
            setResubmitting(false);
        }
    };

    const isRejected = userStatus === 'REJECTED';

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
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    {/* Brand mark — logo in a soft white halo */}
                    <View style={styles.logoHalo}>
                        <Image
                            source={require('../../../assets/images/LotusLogo.png')}
                            style={styles.logo}
                            resizeMode="cover"
                        />
                    </View>
                    <View style={[styles.iconCircle, isRejected ? styles.iconCircleRed : styles.iconCircleMaroon]}>
                        {isRejected ? (
                            <AlertTriangle size={30} color="#fff" strokeWidth={2.5} />
                        ) : (
                            <Clock size={30} color="#fff" strokeWidth={2.5} />
                        )}
                    </View>
                    <AppText weight="bold" style={styles.title}>
                        {isRejected ? 'Profile Not Approved' : 'Profile Under Review'}
                    </AppText>
                    {firstName ? <AppText weight="medium" style={styles.subtitle}>Hi {firstName},</AppText> : null}
                </View>

                {/* Message */}
                {isRejected ? (
                    <>
                    <View style={styles.rejectionCard}>
                        <AppText weight="bold" style={styles.rejectionTitle}>Reason For Rejection</AppText>
                        <AppText weight="regular" style={styles.rejectionText}>
                            {rejectionReason || 'Your profile could not be approved. Please review your details and submit it again.'}
                        </AppText>
                    </View>

                    {/* Optional note to the admin, sent with the resubmission */}
                    <View style={styles.noteCard}>
                        <AppText weight="bold" style={styles.noteLabel}>MESSAGE TO OUR TEAM (OPTIONAL)</AppText>
                        <TextInput
                            style={styles.noteInput}
                            value={adminMessage}
                            onChangeText={setAdminMessage}
                            placeholder="Tell us what you have corrected, or anything we should know…"
                            placeholderTextColor="#999"
                            multiline
                            maxLength={250}
                            textAlignVertical="top"
                        />
                        <AppText weight="regular" style={styles.noteCounter}>{adminMessage.length}/250</AppText>
                    </View>
                    </>
                ) : (
                    <View style={styles.messageCard}>
                        <AppText weight="regular" style={styles.messageText}>
                            Our team is reviewing your profile. This usually takes up to 24 hours, and we'll let you know as soon as it's approved.
                        </AppText>
                        <View style={styles.infoRow}>
                            <AppText weight="medium" style={styles.infoLabel}>Status:</AppText>
                            <View style={styles.statusBadge}>
                                <AppText weight="bold" style={styles.statusBadgeText}>PENDING</AppText>
                            </View>
                        </View>
                    </View>
                )}

                {/* Why review */}
                <View style={styles.stepsCard}>
                    <AppText weight="bold" style={styles.stepsTitle}>Why do we review profiles?</AppText>
                    <AppText weight="regular" style={styles.stepText}>
                        Every profile is checked by our team, so that you only ever see genuine members looking for a serious match.
                    </AppText>
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
                                    <AppText weight="bold" style={styles.primaryBtnText}>Resubmit Profile</AppText>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleContactSupport}>
                        <MessageCircle size={18} color="#1F7FE5" />
                        <AppText weight="bold" style={styles.secondaryBtnText}>Contact Support</AppText>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.ghostBtn} onPress={handleLogout}>
                        <LogOut size={16} color="#666" />
                        <AppText weight="medium" style={styles.ghostBtnText}>Log Out</AppText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    noteCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e7edf5',
        padding: 14,
        marginBottom: 16,
        shadowColor: '#1c2b3f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
    },
    noteLabel: {
        fontSize: 11,
        color: '#64748b',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    noteInput: {
        minHeight: 84,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 13,
        fontFamily: 'Rubik-Regular',
        color: '#333',
        backgroundColor: '#f8fafc',
    },
    noteCounter: {
        fontSize: 11,
        color: '#94a3b8',
        textAlign: 'right',
        marginTop: 6,
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
    // App-icon tile (see SetNewPasswordScreen note — the logo PNG is a solid square, circles
    // crop it badly).
    logoHalo: {
        width: 68,
        height: 68,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 4,
    },
    logo: {
        width: 68,
        height: 68,
        borderRadius: 20,
    },
    iconCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 16,
        elevation: 6,
        shadowColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    iconCircleMaroon: {
        backgroundColor: '#1F7FE5',
    },
    iconCircleRed: {
        backgroundColor: '#dc2626',
    },
    title: {
        fontSize: 24,
        color: '#0f1724',
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
    },
    messageCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e7edf5',
        elevation: 1,
        shadowColor: '#1F7FE5',
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
        borderTopColor: '#eef3f8',
    },
    infoLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontFamily: 'Rubik-Medium',
    },
    infoValue: {
        fontSize: 13,
        color: '#130001',
        fontFamily: 'Rubik-Medium',
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
        fontFamily: 'Rubik-Bold',
        letterSpacing: 0.5,
    },
    rejectionCard: {
        backgroundColor: '#FEF2F2',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
        borderLeftWidth: 4,
        borderLeftColor: '#dc2626',
    },
    rejectionTitle: {
        fontSize: 13,
        fontFamily: 'Rubik-Bold',
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
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e7edf5',
    },
    stepsTitle: {
        fontSize: 15,
        fontFamily: 'Rubik-Bold',
        color: '#1F7FE5',
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
        backgroundColor: '#1F7FE5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Rubik-Bold',
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
        backgroundColor: '#1F7FE5',
        paddingVertical: 16,
        borderRadius: 28,
        elevation: 3,
        shadowColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Rubik-Medium',
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: '#1F7FE5',
    },
    secondaryBtnText: {
        color: '#1F7FE5',
        fontSize: 15,
        fontFamily: 'Rubik-Medium',
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
        fontFamily: 'Rubik-Medium',
    },
});
