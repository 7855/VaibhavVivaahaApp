import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    Linking,
    ActivityIndicator,
    Platform,
    Animated,
    Easing,
    TextInput,
} from 'react-native';
import userApi from '../api/userApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Clipboard from 'expo-clipboard';
import Svg, { Circle } from 'react-native-svg';
import {
    ArrowLeft,
    Check,
    Lock,
    Copy,
    Info,
    ArrowRight,
    Shield,
    Upload,
    Clock,
    QrCode,
    Award,
    Phone,
    CheckCircle,
    Hourglass,
    FileCheck,
    Sparkles,
} from 'lucide-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { NativeBaseProvider } from 'native-base';

const TIMER_DURATION = 30 * 60; // 30 minutes in seconds

// Circular Timer Component
const CircularTimer = ({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) => {
    const size = 180;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = timeLeft / totalTime;
    const strokeDashoffset = circumference * (1 - progress);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                {/* Background circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#f1f5f9"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={timeLeft > 300 ? '#FF9933' : '#ef4444'}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Text style={{
                    fontSize: 36,
                    fontWeight: '900',
                    color: timeLeft > 300 ? '#130001' : '#ef4444',
                    letterSpacing: 2,
                }}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </Text>
                <Text style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#94a3b8',
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    marginTop: 4,
                }}>
                    Remaining
                </Text>
            </View>
        </View>
    );
};

// Verification Step Item
const VerificationStep = ({
    icon, label, status, isLast
}: {
    icon: React.ReactNode;
    label: string;
    status: 'done' | 'active' | 'pending';
    isLast?: boolean;
}) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ alignItems: 'center', marginRight: 14 }}>
            <View style={[
                verifyStyles.stepDot,
                status === 'done' && verifyStyles.stepDotDone,
                status === 'active' && verifyStyles.stepDotActive,
                status === 'pending' && verifyStyles.stepDotPending,
            ]}>
                {status === 'done' ? (
                    <Check size={14} color="#fff" />
                ) : (
                    icon
                )}
            </View>
            {!isLast && (
                <View style={[
                    verifyStyles.stepLine,
                    status === 'done' && { backgroundColor: '#22c55e' },
                ]} />
            )}
        </View>
        <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
            <Text style={[
                verifyStyles.stepLabel,
                status === 'done' && { color: '#22c55e' },
                status === 'active' && { color: '#FF9933', fontWeight: '700' },
                status === 'pending' && { color: '#cbd5e1' },
            ]}>
                {label}
            </Text>
            {status === 'active' && (
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    In progress...
                </Text>
            )}
        </View>
    </View>
);

const UPI_ID = 'vaibhavvivaaha@upi';
const WHATSAPP_NUMBER = '+917904547565';

const PaymentScreen = () => {
    const params = useLocalSearchParams();
    const planTitle = (params.planTitle as string) || 'Gold Plan';
    const planPrice = (params.planPrice as string) || '₹2,999';
    const planPeriod = (params.planPeriod as string) || '12 Months';
    const paymentRequestId = (params.paymentRequestId as string) || (params.planId as string) || '';
    const { userData } = useUserData();
    const popup = usePopup();

    const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
    const [utrNumber, setUtrNumber] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Check if we should render verification view initially
    const showVerificationOnInit = params.showVerificationOnInit === 'true';
    const [showVerification, setShowVerification] = useState(showVerificationOnInit);
    const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Parent scope guard — bounce back, parents cannot make payments
    useEffect(() => {
        (async () => {
            try {
                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                const role = await AsyncStorage.getItem('userRole');
                if (role === 'PARENT') {
                    router.replace('/(root)/(tabs)' as any);
                }
            } catch (_) {}
        })();
    }, []);

    // Pulse animation for status indicator
    useEffect(() => {
        if (showVerification) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [showVerification]);

    // Countdown timer
    useEffect(() => {
        if (showVerification && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [showVerification]);

    const handleCopyUPI = useCallback(async () => {
        try {
            await Clipboard.setStringAsync(UPI_ID);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            popup.error('Error', 'Failed to copy UPI ID');
        }
    }, [popup]);

    const handleUploadScreenshot = useCallback(async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                popup.warning('Permission Required', 'Please allow access to your photo library to upload the payment screenshot.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 1,
            });

            if (result.canceled || !result.assets?.[0]) return;

            const asset = result.assets[0];
            const uri = asset.uri;

            // Validate file is an image (extension check, lenient)
            const filename = (uri.split('/').pop() || '').toLowerCase();
            const ext = filename.split('.').pop() || '';
            const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
            if (ext && !allowedExts.includes(ext)) {
                popup.error('Invalid File', 'Please select an image file (JPG, PNG, or WEBP).');
                return;
            }

            // Get file size from the asset directly (expo-image-picker provides it)
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB
            const fileSize = asset.fileSize || 0;

            if (fileSize > MAX_SIZE) {
                try {
                    const compressed = await manipulateAsync(
                        uri,
                        [{ resize: { width: 1200 } }],
                        { compress: 0.6, format: SaveFormat.JPEG }
                    );
                    setScreenshotUri(compressed.uri);
                } catch (compressErr) {
                    console.warn('Image compression failed, using original:', compressErr);
                    setScreenshotUri(uri);
                }
            } else {
                setScreenshotUri(uri);
            }
        } catch (err) {
            console.error('Error picking image:', err);
            popup.error('Error', 'Failed to pick image. Please try again.');
        }
    }, [popup]);

    const handleConfirmScreenshot = useCallback(async () => {
        if (!screenshotUri) return;
        if (!utrNumber.trim()) {
            popup.warning('Required', 'Please enter your UTR / Transaction ID to confirm payment.');
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();

            // Clean the amount before sending (remove ₹ and commas, just keeping digits and decimals)
            const cleanedAmount = (params.planPrice as string || '').replace(/[^0-9.]/g, '');

            // The API requires userId, planId, amount, utrNumber, and file
            formData.append('userId', userData.userId || '');
            formData.append('planId', params.planId as string || '');
            formData.append('amount', cleanedAmount);
            formData.append('utrNumber', utrNumber.trim());

            // Prepare the file object for React Native
            const filename = screenshotUri.split('/').pop() || 'screenshot.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('file', {
                uri: screenshotUri,
                name: filename,
                type: type,
            } as any);

            const response = await userApi.uploadScreenshot(formData);

            if (response.data.code === 200 || response.data.status === 'SUCCESS') {
                setShowVerification(true);
                setTimeLeft(TIMER_DURATION);
            } else {
                popup.error('Upload Failed', response.data.message || 'Could not upload payment details. Please try again.');
            }
        } catch (error: any) {
            console.error('Error uploading payment details:', error);
            popup.error('Error', error.response?.data?.message || 'Failed to submit payment details. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [screenshotUri, utrNumber, params.planId, params.planPrice, userData.userId]);

    const handleWhatsAppSupport = useCallback(() => {
        const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=Hi, I need help with my premium payment.`;
        Linking.openURL(url).catch(() => {
            popup.error('Error', 'WhatsApp is not installed on your device.');
        });
    }, [popup]);

    const handleGoBack = useCallback(() => {
        if (showVerification) {
            popup.confirm(
                'Leave Verification?',
                "Your payment is being verified. You can safely leave — we'll notify you once approved.",
                () => router.back(),
                'Leave',
                'Stay'
            );
        } else {
            router.back();
        }
    }, [showVerification, popup]);

    // ─── VERIFICATION STATUS VIEW ───
    if (showVerification) {
        return (
            <NativeBaseProvider>
                <View style={styles.container}>
                    <SafeAreaView edges={['top']} style={styles.headerSafe}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                                <ArrowLeft size={22} color="#475569" />
                            </TouchableOpacity>
                            <View style={styles.headerContent}>
                                <Text style={styles.headerTitle}>Payment Status</Text>
                                <Text style={styles.headerSubtitle}>STEP 3 OF 3: VERIFICATION</Text>
                            </View>
                        </View>
                    </SafeAreaView>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Progress Steps - All completed up to verify */}
                        <View style={styles.progressContainer}>
                            <View style={styles.stepWrapper}>
                                <View style={[styles.stepCircle, styles.stepCompleted]}>
                                    <Check size={16} color="#fff" />
                                </View>
                                <Text style={[styles.stepLabel, styles.stepLabelCompleted]}>Plan</Text>
                            </View>
                            <View style={[styles.progressLine, styles.progressLineActive]} />
                            <View style={styles.stepWrapper}>
                                <View style={[styles.stepCircle, styles.stepCompleted]}>
                                    <Check size={16} color="#fff" />
                                </View>
                                <Text style={[styles.stepLabel, styles.stepLabelCompleted]}>Pay</Text>
                            </View>
                            <View style={[styles.progressLine, styles.progressLineActive]} />
                            <View style={styles.stepWrapper}>
                                <View style={[styles.stepCircle, styles.stepActive]}>
                                    <Text style={styles.stepNumber}>3</Text>
                                </View>
                                <Text style={[styles.stepLabel, styles.stepLabelActive]}>Verify</Text>
                            </View>
                        </View>

                        {/* Main Verification Card */}
                        <View style={verifyStyles.card}>
                            <LinearGradient
                                colors={['#FFF7ED', '#FFFBF5', '#fff']}
                                style={verifyStyles.cardGradient}
                            >
                                {/* Pulsing Status Icon */}
                                <View style={verifyStyles.statusIconContainer}>
                                    <Animated.View style={[
                                        verifyStyles.pulseRing,
                                        { transform: [{ scale: pulseAnim }] }
                                    ]}>
                                        <View style={verifyStyles.statusIcon}>
                                            <Hourglass size={32} color="#FF9933" />
                                        </View>
                                    </Animated.View>
                                </View>

                                <Text style={verifyStyles.title}>Payment Under Review</Text>
                                <Text style={verifyStyles.subtitle}>
                                    Our team is verifying your payment screenshot.{'\n'}
                                    You'll be notified once approved! ✨
                                </Text>

                                {/* Circular Timer */}
                                <View style={verifyStyles.timerContainer}>
                                    <CircularTimer timeLeft={timeLeft} totalTime={TIMER_DURATION} />
                                </View>

                                {/* Plan Info Badge */}
                                <View style={verifyStyles.planBadge}>
                                    <Award size={16} color="#D4AF37" />
                                    <Text style={verifyStyles.planBadgeText}>
                                        {planTitle} • {planPrice}
                                    </Text>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Verification Steps Tracker */}
                        <View style={verifyStyles.stepsCard}>
                            <Text style={verifyStyles.stepsTitle}>Verification Progress</Text>
                            <View style={{ marginTop: 16 }}>
                                <VerificationStep
                                    icon={<Upload size={14} color="#FF9933" />}
                                    label="Screenshot uploaded"
                                    status="done"
                                />
                                <VerificationStep
                                    icon={<FileCheck size={14} color="#FF9933" />}
                                    label="Payment verification"
                                    status="active"
                                />
                                <VerificationStep
                                    icon={<Sparkles size={14} color="#cbd5e1" />}
                                    label="Premium activation"
                                    status="pending"
                                    isLast
                                />
                            </View>
                        </View>

                        {/* Uploaded Screenshot Preview */}
                        {screenshotUri && (
                            <View style={verifyStyles.screenshotCard}>
                                <Text style={verifyStyles.screenshotLabel}>Uploaded Screenshot</Text>
                                <View style={verifyStyles.screenshotImageWrap}>
                                    <Image
                                        source={{ uri: screenshotUri }}
                                        style={verifyStyles.screenshotImg}
                                        resizeMode="cover"
                                    />
                                    <View style={verifyStyles.screenshotBadge}>
                                        <CheckCircle size={14} color="#22c55e" />
                                        <Text style={verifyStyles.screenshotBadgeText}>Received</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* WhatsApp Support */}
                        <TouchableOpacity style={styles.whatsappCard} onPress={handleWhatsAppSupport}>
                            <View style={styles.whatsappLeft}>
                                <View style={styles.whatsappIconWrap}>
                                    <Ionicons name="logo-whatsapp" size={20} color="#16a34a" />
                                </View>
                                <View>
                                    <Text style={styles.whatsappLabel}>Need faster verification?</Text>
                                    <Text style={styles.whatsappNumber}>+91 98765 43210</Text>
                                </View>
                            </View>
                            <View style={styles.chatNowButton}>
                                <Text style={styles.chatNowText}>Chat Now</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Info Card */}
                        <View style={verifyStyles.infoCard}>
                            <Info size={16} color="#3b82f6" />
                            <Text style={verifyStyles.infoCardText}>
                                You can safely close this screen. We'll send you a notification once your payment is verified and premium is activated.
                            </Text>
                        </View>

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerContent}>
                            <View style={styles.footerIconWrap}>
                                <Shield size={16} color="#94a3b8" />
                            </View>
                            <Text style={styles.footerText}>
                                <Text style={styles.footerTextBold}>Secure Verification: </Text>
                                Your screenshot is encrypted and will be reviewed by our trusted team.
                            </Text>
                        </View>
                    </View>
                </View>
            </NativeBaseProvider>
        );
    }

    // ─── MAIN PAYMENT VIEW ───
    return (
        <NativeBaseProvider>

            <View style={styles.container}>
                {/* Header */}
                <SafeAreaView edges={['top']} style={styles.headerSafe}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                            <ArrowLeft size={22} color="#475569" />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Guided Payment</Text>
                            <Text style={styles.headerSubtitle}>STEP 2 OF 3: PAY VIA UPI</Text>
                        </View>
                    </View>
                </SafeAreaView>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Progress Steps */}
                    <View style={styles.progressContainer}>
                        {/* Step 1 - Completed */}
                        <View style={styles.stepWrapper}>
                            <View style={[styles.stepCircle, styles.stepCompleted]}>
                                <Check size={16} color="#fff" />
                            </View>
                            <Text style={[styles.stepLabel, styles.stepLabelCompleted]}>Plan</Text>
                        </View>

                        {/* Line 1 */}
                        <View style={[styles.progressLine, styles.progressLineActive]} />

                        {/* Step 2 - Active */}
                        <View style={styles.stepWrapper}>
                            <View style={[styles.stepCircle, styles.stepActive]}>
                                <Text style={styles.stepNumber}>2</Text>
                            </View>
                            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Pay</Text>
                        </View>

                        {/* Line 2 */}
                        <View style={styles.progressLine} />

                        {/* Step 3 - Inactive */}
                        <View style={styles.stepWrapper}>
                            <View style={[styles.stepCircle, styles.stepInactive]}>
                                <Text style={styles.stepNumberInactive}>3</Text>
                            </View>
                            <Text style={[styles.stepLabel, styles.stepLabelInactive]}>Verify</Text>
                        </View>
                    </View>

                    {/* Selected Plan Summary */}
                    <View style={styles.planSummary}>
                        <View style={styles.planSummaryLeft}>
                            <View style={styles.planIcon}>
                                <Award size={20} color="#D4AF37" />
                            </View>
                            <View>
                                <Text style={styles.planSummaryTitle}>{planTitle} Selection</Text>
                                <Text style={styles.planSummaryDetail}>{planPrice} • {planPeriod} Access</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleGoBack}>
                            <Text style={styles.changeButton}>Change</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Main Payment Card */}
                    <View style={styles.paymentCard}>
                        {/* Background decoration */}
                        <View style={styles.paymentCardBg}>
                            <QrCode size={80} color="#FF9933" style={{ opacity: 0.05 }} />
                        </View>

                        {/* Accent bar */}
                        <LinearGradient
                            colors={['#FF9933', '#E88A2D']}
                            style={styles.accentBar}
                        />

                        <View style={styles.paymentCardContent}>
                            {/* Step Badge */}
                            <View style={styles.currentStepBadge}>
                                <Text style={styles.currentStepText}>CURRENT STEP</Text>
                            </View>

                            <Text style={styles.scanPayTitle}>Scan & Pay</Text>
                            <Text style={styles.scanPaySubtitle}>
                                Open any UPI app to complete the transaction.
                            </Text>

                            {/* QR Code Section */}
                            <View style={styles.qrSection}>
                                <View style={styles.qrWrapper}>
                                    <Image
                                        source={require('../../../assets/images/payment_qr.png')}
                                        style={styles.qrImage}
                                        resizeMode="contain"
                                        defaultSource={require('../../../assets/images/payment_qr.png')}
                                    />
                                </View>

                                {/* UPI ID Copy */}
                                <Text style={styles.orCopyText}>OR COPY UPI ID</Text>
                                <View style={styles.upiIdContainer}>
                                    <Text style={styles.upiIdText}>{UPI_ID}</Text>
                                    <TouchableOpacity
                                        style={[styles.copyButton, copied && styles.copyButtonCopied]}
                                        onPress={handleCopyUPI}
                                    >
                                        {copied ? (
                                            <Check size={18} color="#16a34a" />
                                        ) : (
                                            <Copy size={18} color="#B22222" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {copied && (
                                    <Text style={styles.copiedText}>✓ Copied to clipboard!</Text>
                                )}
                            </View>

                            {/* Info Note */}
                            <View style={styles.infoNote}>
                                <View style={styles.infoIconWrap}>
                                    <Info size={18} color="#FF9933" />
                                </View>
                                <Text style={styles.infoText}>
                                    After payment, please{' '}
                                    <Text style={styles.infoTextBold}>take a screenshot</Text> of
                                    the confirmation screen. You'll need it for the next step.
                                </Text>
                            </View>

                            {/* Uploaded Screenshot Preview or Upload Button */}
                            {screenshotUri && !showVerification ? (
                                <View style={styles.previewContainer}>
                                    <Text style={styles.previewTitle}>Review Screenshot & Enter UTR</Text>
                                    <Image source={{ uri: screenshotUri }} style={styles.previewImage} resizeMode="cover" />

                                    <View style={styles.utrContainer}>
                                        <Text style={styles.utrLabel}>UTR / Transaction ID *</Text>
                                        <TextInput
                                            style={styles.utrInput}
                                            placeholder="Enter 12-digit UTR number"
                                            value={utrNumber}
                                            onChangeText={setUtrNumber}
                                            placeholderTextColor="#94a3b8"
                                            autoCapitalize="characters"
                                            editable={!isSubmitting}
                                        />
                                    </View>

                                    <View style={styles.previewActions}>
                                        <TouchableOpacity
                                            style={[styles.retakeButton, isSubmitting && { opacity: 0.5 }]}
                                            onPress={() => setScreenshotUri(null)}
                                            disabled={isSubmitting}
                                        >
                                            <Text style={styles.retakeButtonText}>Retake</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.confirmButton, isSubmitting && { opacity: 0.7 }]}
                                            onPress={handleConfirmScreenshot}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <ActivityIndicator color="#fff" size="small" />
                                            ) : (
                                                <>
                                                    <Text style={styles.confirmButtonText}>CONFIRM</Text>
                                                    <Check size={18} color="#fff" />
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.uploadButton}
                                    onPress={handleUploadScreenshot}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.uploadButtonText}>UPLOAD SCREENSHOT</Text>
                                            <ArrowRight size={20} color="#fff" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Step 3 Preview (Locked) */}
                    <View style={styles.lockedSection}>
                        <View style={styles.lockedHeader}>
                            <View style={styles.lockedIconWrap}>
                                <Upload size={20} color="#94a3b8" />
                            </View>
                            <View style={styles.lockedInfo}>
                                <Text style={styles.lockedTitle}>Step 3: Verification</Text>
                                <Text style={styles.lockedSubtitle}>Unlock after payment</Text>
                                <View style={styles.estimatedTime}>
                                    <Clock size={12} color="#64748b" />
                                    <Text style={styles.estimatedTimeText}>Estimated wait: 30:00</Text>
                                </View>
                            </View>
                            <Lock size={20} color="#cbd5e1" />
                        </View>
                    </View>

                    {/* WhatsApp Support */}
                    <TouchableOpacity style={styles.whatsappCard} onPress={handleWhatsAppSupport}>
                        <View style={styles.whatsappLeft}>
                            <View style={styles.whatsappIconWrap}>
                                <Ionicons name="logo-whatsapp" size={20} color="#16a34a" />
                            </View>
                            <View>
                                <Text style={styles.whatsappLabel}>Stuck somewhere?</Text>
                                <Text style={styles.whatsappNumber}>+91 98765 43210</Text>
                            </View>
                        </View>
                        <View style={styles.chatNowButton}>
                            <Text style={styles.chatNowText}>Chat Now</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Bottom spacing for footer */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Sticky Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerContent}>
                        <View style={styles.footerIconWrap}>
                            <Shield size={16} color="#94a3b8" />
                        </View>
                        <Text style={styles.footerText}>
                            <Text style={styles.footerTextBold}>Payment Security: </Text>
                            Your transaction is encrypted. Manual verification ensures 100%
                            security against fraud. Non-refundable.
                        </Text>
                    </View>
                </View>
            </View>
        </NativeBaseProvider>
    );
};

// ─── VERIFICATION STYLES ───
const verifyStyles = StyleSheet.create({
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#FF9933',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    cardGradient: {
        padding: 28,
        alignItems: 'center',
    },
    statusIconContainer: {
        marginBottom: 20,
    },
    pulseRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 153, 51, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FF9933',
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#130001',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    timerContainer: {
        marginBottom: 20,
    },
    planBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(212, 175, 55, 0.08)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    planBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#92750C',
    },
    stepsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    stepsTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#130001',
        letterSpacing: 0.3,
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepDotDone: {
        backgroundColor: '#22c55e',
    },
    stepDotActive: {
        backgroundColor: '#FFF7ED',
        borderWidth: 2,
        borderColor: '#FF9933',
    },
    stepDotPending: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    stepLine: {
        width: 2,
        height: 20,
        backgroundColor: '#e2e8f0',
        marginTop: 4,
    },
    stepLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        marginTop: 2,
    },
    screenshotCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    screenshotLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 0.5,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    screenshotImageWrap: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    screenshotImg: {
        width: '100%',
        height: 140,
    },
    screenshotBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        backgroundColor: '#f0fdf4',
    },
    screenshotBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16a34a',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    infoCardText: {
        flex: 1,
        fontSize: 12,
        color: '#1e40af',
        lineHeight: 18,
    },
});

// ─── MAIN STYLES ───
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    headerSafe: {
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerContent: {
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#B22222',
        letterSpacing: 0.3,
    },
    headerSubtitle: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 3,
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },

    // Progress Steps
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    stepWrapper: {
        alignItems: 'center',
        gap: 6,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCompleted: {
        backgroundColor: '#22c55e',
    },
    stepActive: {
        backgroundColor: '#FF9933',
        ...Platform.select({
            ios: {
                shadowColor: '#FF9933',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    stepInactive: {
        backgroundColor: '#e2e8f0',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#DADADA',
    },
    stepNumberInactive: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94a3b8',
    },
    stepLabel: {
        fontSize: 10,
        fontWeight: '700',
    },
    stepLabelCompleted: {
        color: '#16a34a',
    },
    stepLabelActive: {
        color: '#FF9933',
    },
    stepLabelInactive: {
        color: '#94a3b8',
    },
    progressLine: {
        height: 2,
        flex: 1,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 8,
        marginBottom: 18,
    },
    progressLineActive: {
        backgroundColor: '#FF9933',
    },

    // Plan Summary
    planSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    planSummaryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    planIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    planSummaryTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#130001',
    },
    planSummaryDetail: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    changeButton: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B22222',
        textDecorationLine: 'underline',
    },

    // Payment Card
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
        position: 'relative',
    },
    paymentCardBg: {
        position: 'absolute',
        top: 16,
        right: 16,
        opacity: 0.5,
    },
    accentBar: {
        height: 4,
    },
    paymentCardContent: {
        padding: 24,
    },
    currentStepBadge: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    currentStepText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FF9933',
        letterSpacing: 3,
    },
    scanPayTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#130001',
        marginBottom: 6,
    },
    scanPaySubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 24,
    },

    // QR Section
    qrSection: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        alignItems: 'center',
        marginBottom: 20,
    },
    qrWrapper: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20,
    },
    qrImage: {
        width: 176,
        height: 176,
    },
    orCopyText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 3,
        marginBottom: 12,
    },
    upiIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        width: '100%',
    },
    upiIdText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#130001',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
        backgroundColor: '#f1f5f9',
        padding: 8,
        borderRadius: 8,
    },
    copyButtonCopied: {
        backgroundColor: '#dcfce7',
    },
    copiedText: {
        fontSize: 12,
        color: '#16a34a',
        fontWeight: '600',
        marginTop: 8,
    },

    // Info Note
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 20,
    },
    infoIconWrap: {
        backgroundColor: 'rgba(255, 153, 51, 0.1)',
        padding: 8,
        borderRadius: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
    },
    infoTextBold: {
        fontWeight: '700',
        color: '#130001',
        textDecorationLine: 'underline',
        textDecorationColor: 'rgba(255, 153, 51, 0.3)',
    },

    // Upload Button
    uploadButton: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    uploadButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#DADADA',
        letterSpacing: 1,
    },

    // Preview Section
    previewContainer: {
        marginTop: 10,
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    previewTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    previewImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        marginBottom: 16,
    },
    previewActions: {
        flexDirection: 'row',
        gap: 12,
    },
    retakeButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    retakeButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#16a34a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#DADADA',
        letterSpacing: 0.5,
    },

    // Locked Section
    lockedSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        opacity: 0.6,
    },
    lockedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lockedIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockedInfo: {
        flex: 1,
        marginLeft: 12,
    },
    lockedTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94a3b8',
    },
    lockedSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 2,
    },
    estimatedTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    estimatedTimeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },

    // WhatsApp Card
    whatsappCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f0fdf4',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    whatsappLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    whatsappIconWrap: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    whatsappLabel: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
    },
    whatsappNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },
    chatNowButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    chatNowText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#15803d',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingBottom: Platform.OS === 'ios' ? 30 : 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 8,
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        maxWidth: 400,
        alignSelf: 'center',
    },
    footerIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        flexShrink: 0,
    },
    footerText: {
        fontSize: 10,
        color: '#94a3b8',
        lineHeight: 14,
        flex: 1,
    },
    footerTextBold: {
        fontWeight: '700',
        color: '#334155',
    },
    utrContainer: {
        marginBottom: 16,
    },
    utrLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6,
    },
    utrInput: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#0f172a',
        backgroundColor: '#fff',
    },
});

export default PaymentScreen;
