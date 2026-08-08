import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';
import { useUserData } from '../contexts/UserDataContext';

const UPI_ID = 'vaibhavvivaaha@upi';

/**
 * Reusable Add-On Payment Screen.
 *
 * Route params:
 *   featureTitle:  "Profile Boost"
 *   featureNote:   "BOOST_PURCHASE"    (stored as PaymentRequest.note — backend uses it to route approval)
 *   price:         "149"
 *   planId:        "0"                 (use 0 for add-on purchases that aren't tied to a plan)
 *   description:   "Your profile will appear at the top of search for 24 hours"
 */
export default function AddOnPaymentScreen() {
  const params = useLocalSearchParams();
  const popup = usePopup();
  const { userData } = useUserData();

  const featureTitle = (params.featureTitle as string) || 'Add-On Feature';
  const featureNote = (params.featureNote as string) || 'ADDON_PURCHASE';
  const price = (params.price as string) || '149';
  const planId = (params.planId as string) || '0';
  const description = (params.description as string) || '';

  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const [hasPending, setHasPending] = useState(false);

  // Check if there's already a pending payment for this feature
  useEffect(() => {
    (async () => {
      if (!userData.userId) { setCheckingPending(false); return; }
      try {
        const res = await userApi.getPaymentRequestsByUser(userData.userId);
        const pending = (res.data?.data || []).find(
          (r: any) => r.status === 'PENDING' && r.note === featureNote
        );
        if (pending) setHasPending(true);
      } catch (_) { }
      finally { setCheckingPending(false); }
    })();
  }, [userData.userId, featureNote]);

  const handleCopyUPI = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      popup.error('Error', 'Failed to copy UPI ID');
    }
  }, []);

  const pickScreenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      popup.error('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!screenshotUri) {
      popup.warning('Missing screenshot', 'Please upload your payment screenshot.');
      return;
    }
    if (!utrNumber.trim()) {
      popup.warning('Missing UTR', 'Please enter the UTR / transaction number.');
      return;
    }
    if (!userData.userId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('userId', userData.userId);
      formData.append('planId', planId);
      formData.append('amount', price);
      formData.append('utrNumber', utrNumber.trim());
      formData.append('note', featureNote);
      // @ts-ignore
      formData.append('file', {
        uri: screenshotUri,
        name: `addon_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      const res = await userApi.uploadScreenshot(formData);
      if (res.data.code === 200) {
        setSubmitted(true);
      } else {
        popup.error('Upload failed', res.data.message || 'Please try again.');
      }
    } catch (e: any) {
      popup.error('Upload failed', e?.response?.data?.message || 'Network error.');
    } finally {
      setUploading(false);
    }
  };

  if (checkingPending) {
    return (
      <SafeAreaView style={s.container}>
        <Stack.Screen options={{ title: featureTitle }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#420001" />
        </View>
      </SafeAreaView>
    );
  }

  // Already submitted or pending from before
  if (submitted || hasPending) {
    return (
      <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: featureTitle }} />
        <View style={s.pendingCenter}>
          <View style={s.pendingIcon}>
            <MaterialCommunityIcons name="clock-check-outline" size={48} color="#f59e0b" />
          </View>
          <Text style={s.pendingTitle}>Payment Under Review</Text>
          <Text style={s.pendingDesc}>
            We've received your payment of ₹{price} for {featureTitle}. Our team will verify and approve it within a few hours.
          </Text>
          <Text style={s.pendingNote}>
            You'll receive a notification once approved.
          </Text>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
            <Text style={s.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: `Buy ${featureTitle}` }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Feature info card */}
          <View style={s.featureCard}>
            <Text style={s.featureEmoji}>🚀</Text>
            <Text style={s.featureTitle}>{featureTitle}</Text>
            <Text style={s.featurePrice}>₹{price}</Text>
            {description ? <Text style={s.featureDesc}>{description}</Text> : null}
          </View>

          {/* Step 1 — Pay via UPI */}
          <View style={s.stepCard}>
            <View style={s.stepHeader}>
              <View style={s.stepBadge}>
                <Text style={s.stepBadgeText}>1</Text>
              </View>
              <Text style={s.stepTitle}>Pay via UPI</Text>
            </View>
            <Text style={s.stepDesc}>Send ₹{price} to the UPI ID below using any UPI app (GPay, PhonePe, Paytm).</Text>

            <TouchableOpacity style={s.upiRow} onPress={handleCopyUPI}>
              <Text style={s.upiId}>{UPI_ID}</Text>
              <View style={[s.copyBtn, copied && { backgroundColor: '#10b981' }]}>
                <Ionicons name={copied ? 'checkmark' : 'copy'} size={14} color="#fff" />
                <Text style={s.copyBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Step 2 — Upload screenshot */}
          <View style={s.stepCard}>
            <View style={s.stepHeader}>
              <View style={s.stepBadge}>
                <Text style={s.stepBadgeText}>2</Text>
              </View>
              <Text style={s.stepTitle}>Upload Payment Screenshot</Text>
            </View>

            {screenshotUri ? (
              <View style={s.previewBox}>
                <Image source={{ uri: screenshotUri }} style={s.preview} />
                <TouchableOpacity style={s.removeBtn} onPress={() => setScreenshotUri(null)}>
                  <Ionicons name="close-circle" size={26} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.uploadBtn} onPress={pickScreenshot}>
                <Ionicons name="cloud-upload" size={24} color="#420001" />
                <Text style={s.uploadBtnText}>Pick Screenshot</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Step 3 — Enter UTR */}
          <View style={s.stepCard}>
            <View style={s.stepHeader}>
              <View style={s.stepBadge}>
                <Text style={s.stepBadgeText}>3</Text>
              </View>
              <Text style={s.stepTitle}>Enter UTR / Transaction Number</Text>
            </View>
            <TextInput
              style={s.input}
              placeholder="e.g. 312345678901"
              placeholderTextColor="#9ca3af"
              value={utrNumber}
              onChangeText={setUtrNumber}
              keyboardType="default"
              maxLength={30}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, (!screenshotUri || !utrNumber.trim() || uploading) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={!screenshotUri || !utrNumber.trim() || uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={s.submitBtnText}>Submit Payment</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  scroll: { padding: 16, paddingBottom: 40 },

  featureCard: {
    backgroundColor: '#420001',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },
  featureEmoji: { fontSize: 36, marginBottom: 8 },
  featureTitle: { fontSize: 18, fontFamily: 'Rubik-ExtraBold', color: '#fff', marginBottom: 4 },
  featurePrice: { fontSize: 28, fontFamily: 'Rubik-ExtraBold', color: '#f59e0b' },
  featureDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 6 },

  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#420001', alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  stepBadgeText: { color: '#fff', fontSize: 12, fontFamily: 'Rubik-ExtraBold' },
  stepTitle: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#111827' },
  stepDesc: { fontSize: 12, color: '#6b7280', lineHeight: 17, marginBottom: 10 },

  upiRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb',
  },
  upiId: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#111827', flex: 1 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#420001',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4,
  },
  copyBtnText: { color: '#fff', fontSize: 11, fontFamily: 'Rubik-Bold' },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 10, borderWidth: 1.5,
    borderStyle: 'dashed', borderColor: '#420001', backgroundColor: '#fff', gap: 8,
  },
  uploadBtnText: { color: '#420001', fontFamily: 'Rubik-Bold', fontSize: 13 },

  previewBox: { position: 'relative', marginBottom: 4 },
  preview: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'cover', backgroundColor: '#e5e7eb' },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 14 },

  input: {
    backgroundColor: '#f9fafb', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827',
  },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#420001', paddingVertical: 14, borderRadius: 12, marginTop: 6, gap: 8,
  },
  submitBtnText: { color: '#fff', fontFamily: 'Rubik-Bold', fontSize: 14 },

  pendingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  pendingIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#fef3c7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  pendingTitle: { fontSize: 20, fontFamily: 'Rubik-ExtraBold', color: '#111827', marginBottom: 8 },
  pendingDesc: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 19, marginBottom: 12 },
  pendingNote: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic', textAlign: 'center' },
  backButton: {
    marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#420001',
  },
  backButtonText: { color: '#fff', fontFamily: 'Rubik-Bold', fontSize: 13 },
});
