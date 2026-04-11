import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';

type DocumentType = 'SALARY_SLIP' | 'ITR' | 'OFFER_LETTER' | 'OTHER';

const DOC_TYPES: { value: DocumentType; label: string; icon: string }[] = [
  { value: 'SALARY_SLIP', label: 'Salary Slip', icon: 'file-document-outline' },
  { value: 'ITR', label: 'Income Tax Return', icon: 'file-chart-outline' },
  { value: 'OFFER_LETTER', label: 'Offer Letter', icon: 'briefcase-outline' },
  { value: 'OTHER', label: 'Other Proof', icon: 'file-outline' },
];

interface LatestSubmission {
  id: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentType: string;
  claimedAnnualIncome?: string;
  rejectionReason?: string;
  reviewedAt?: string;
}

export default function IncomeVerificationScreen() {
  const popup = usePopup();
  const [encodedUserId, setEncodedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [incomeVerified, setIncomeVerified] = useState(false);
  const [latest, setLatest] = useState<LatestSubmission | null>(null);
  const [pickedImage, setPickedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [docType, setDocType] = useState<DocumentType>('SALARY_SLIP');
  const [claimedIncome, setClaimedIncome] = useState('');

  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('userId');
      setEncodedUserId(id);
      if (id) await loadStatus(id);
      setLoading(false);
    })();
  }, []);

  const loadStatus = async (id: string) => {
    try {
      const res = await userApi.getIncomeVerificationStatus(id);
      if (res.data.code === 200 && res.data.data) {
        setIncomeVerified(res.data.data.incomeVerified === true);
        setLatest(res.data.data.latestSubmission || null);
      }
    } catch (_) {}
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      popup.error('Permission needed', 'Please allow photo library access to upload your document.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPickedImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      popup.error('Permission needed', 'Please allow camera access to capture your document.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPickedImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!encodedUserId || !pickedImage) {
      popup.warning('Missing document', 'Please pick or capture your document image first.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      const fileName = pickedImage.fileName || `income_${Date.now()}.jpg`;
      const fileType = pickedImage.mimeType || 'image/jpeg';
      // @ts-ignore — RN multipart shape
      formData.append('file', {
        uri: pickedImage.uri,
        name: fileName,
        type: fileType,
      });
      formData.append('documentType', docType);
      if (claimedIncome.trim()) formData.append('claimedAnnualIncome', claimedIncome.trim());

      const res = await userApi.uploadIncomeDocument(encodedUserId, formData);
      if (res.data.code === 200) {
        popup.success(
          'Document submitted',
          'Our team will review your document within 24 hours. You will be notified once approved.',
          () => router.back()
        );
        setPickedImage(null);
        setClaimedIncome('');
        await loadStatus(encodedUserId);
      } else if (res.data.code === 403) {
        popup.premiumRequired(
          'Upgrade to Gold or Platinum to verify your income.',
          () => router.push('/(root)/screens/PremiumTab' as any)
        );
      } else if (res.data.code === 409) {
        popup.warning(
          'Already submitted',
          'You already have a pending income verification. Please wait for the admin review.'
        );
      } else {
        popup.error('Upload failed', res.data.message || 'Please try again.');
      }
    } catch (e: any) {
      if (e?.response?.data?.code === 403) {
        popup.premiumRequired(
          'Upgrade to Gold or Platinum to verify your income.',
          () => router.push('/(root)/screens/PremiumTab' as any)
        );
      } else {
        popup.error('Upload failed', e?.response?.data?.message || 'Network error. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBanner = () => {
    if (incomeVerified) {
      return (
        <View style={[styles.statusBanner, { backgroundColor: '#d1fae5' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#059669" />
          <Text style={[styles.statusText, { color: '#065f46' }]}>
            Your income is verified ✓
          </Text>
        </View>
      );
    }
    if (!latest) return null;
    if (latest.status === 'PENDING') {
      return (
        <View style={[styles.statusBanner, { backgroundColor: '#fef3c7' }]}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#b45309" />
          <Text style={[styles.statusText, { color: '#78350f' }]}>
            Submitted — admin review in progress (within 24h)
          </Text>
        </View>
      );
    }
    if (latest.status === 'REJECTED') {
      return (
        <View style={[styles.statusBanner, { backgroundColor: '#fee2e2' }]}>
          <Ionicons name="close-circle" size={20} color="#dc2626" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.statusText, { color: '#991b1b', marginLeft: 0 }]}>
              Previous submission rejected
            </Text>
            {latest.rejectionReason ? (
              <Text style={{ color: '#991b1b', fontSize: 11, marginTop: 2 }}>
                Reason: {latest.rejectionReason}
              </Text>
            ) : null}
          </View>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Verify Income' }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#420001" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Verify Income' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {renderStatusBanner()}

        {/* Explainer card */}
        <View style={styles.explainCard}>
          <View style={styles.explainHeader}>
            <MaterialCommunityIcons name="briefcase-check" size={28} color="#420001" />
            <Text style={styles.explainTitle}>Get the Salary Verified Badge</Text>
          </View>
          <View style={styles.bullet}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.bulletText}>
              Stand out as a verified earner — 4× more profile interest
            </Text>
          </View>
          <View style={styles.bullet}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.bulletText}>
              We accept salary slips, ITRs, and offer letters
            </Text>
          </View>
          <View style={styles.bullet}>
            <Ionicons name="lock-closed" size={16} color="#059669" />
            <Text style={styles.bulletText}>
              Your document is private — only our verification team can see it
            </Text>
          </View>
        </View>

        {!incomeVerified && latest?.status !== 'PENDING' && (
          <>
            {/* Document type selector */}
            <Text style={styles.sectionLabel}>What are you uploading?</Text>
            <View style={styles.docTypeGrid}>
              {DOC_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.docTypeChip,
                    docType === t.value && styles.docTypeChipActive,
                  ]}
                  onPress={() => setDocType(t.value)}
                >
                  <MaterialCommunityIcons
                    name={t.icon as any}
                    size={20}
                    color={docType === t.value ? '#fff' : '#420001'}
                  />
                  <Text
                    style={[
                      styles.docTypeLabel,
                      docType === t.value && { color: '#fff' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Annual income */}
            <Text style={styles.sectionLabel}>Annual Income (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12 LPA or ₹85,000/month"
              placeholderTextColor="#9ca3af"
              value={claimedIncome}
              onChangeText={setClaimedIncome}
              maxLength={64}
            />

            {/* Document upload */}
            <Text style={styles.sectionLabel}>Document Image</Text>
            {pickedImage ? (
              <View style={styles.imagePreviewBox}>
                <Image source={{ uri: pickedImage.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setPickedImage(null)}
                >
                  <Ionicons name="close-circle" size={26} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadBtnRow}>
                <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                  <Ionicons name="camera" size={22} color="#420001" />
                  <Text style={styles.uploadBtnText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name="images" size={22} color="#420001" />
                  <Text style={styles.uploadBtnText}>From Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!pickedImage || submitting) && { opacity: 0.5 },
              ]}
              onPress={handleSubmit}
              disabled={!pickedImage || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Submit for Verification</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  scroll: { padding: 16, paddingBottom: 40 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  statusText: { marginLeft: 8, fontSize: 13, fontWeight: '600' },
  explainCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  explainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  explainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#420001',
    marginLeft: 10,
    flex: 1,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  bulletText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#420001',
    marginBottom: 8,
    marginTop: 4,
  },
  docTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  docTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  docTypeChipActive: {
    backgroundColor: '#420001',
    borderColor: '#420001',
  },
  docTypeLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#420001',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    marginBottom: 18,
  },
  uploadBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#420001',
    backgroundColor: '#fff',
  },
  uploadBtnText: {
    color: '#420001',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },
  imagePreviewBox: {
    position: 'relative',
    marginBottom: 18,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    resizeMode: 'cover',
    backgroundColor: '#e5e7eb',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#420001',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
});
