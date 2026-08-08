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
import { useSubscription } from '../contexts/subscriptionContext';
import { buildUpgradeAction } from '../utils/upgradeNavigation';

type DocumentType = 'AADHAAR_CARD' | 'PAN_CARD' | 'VOTER_ID' | 'DRIVING_LICENSE' | 'PASSPORT';

const DOC_TYPES: { value: DocumentType; label: string; icon: string }[] = [
  { value: 'AADHAAR_CARD', label: 'Aadhaar Card', icon: 'card-account-details' },
  { value: 'PAN_CARD', label: 'PAN Card', icon: 'credit-card-outline' },
  { value: 'VOTER_ID', label: 'Voter ID', icon: 'vote-outline' },
  { value: 'DRIVING_LICENSE', label: 'Driving License', icon: 'car' },
  { value: 'PASSPORT', label: 'Passport', icon: 'passport' },
];

interface LatestSubmission {
  id: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentType: string;
  documentNumberLast4?: string;
  rejectionReason?: string;
  reviewedAt?: string;
}

export default function IdVerificationScreen() {
  const popup = usePopup();
  const { subscriptionData } = useSubscription() || {};
  const [encodedUserId, setEncodedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [latest, setLatest] = useState<LatestSubmission | null>(null);
  const [pickedImage, setPickedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [docType, setDocType] = useState<DocumentType>('AADHAAR_CARD');
  const [documentNumber, setDocumentNumber] = useState('');

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
      const res = await userApi.getIdVerificationStatus(id);
      if (res.data.code === 200 && res.data.data) {
        setIdVerified(res.data.data.idVerified === true);
        setLatest(res.data.data.latestSubmission || null);
      }
    } catch (_) { }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      popup.error('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]) setPickedImage(result.assets[0]);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      popup.error('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]) setPickedImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!encodedUserId || !pickedImage) {
      popup.warning('Missing document', 'Please pick or capture your ID photo first.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      const fileName = pickedImage.fileName || `id_${Date.now()}.jpg`;
      const fileType = pickedImage.mimeType || 'image/jpeg';
      // @ts-ignore
      formData.append('file', { uri: pickedImage.uri, name: fileName, type: fileType });
      formData.append('documentType', docType);
      if (documentNumber.trim()) formData.append('documentNumber', documentNumber.trim());

      const res = await userApi.uploadIdDocument(encodedUserId, formData);
      if (res.data.code === 200) {
        popup.success(
          'ID submitted',
          'Our team will review your ID within 24 hours. You will be notified once approved.',
          () => router.back()
        );
        setPickedImage(null);
        setDocumentNumber('');
        await loadStatus(encodedUserId);
      } else if (res.data.code === 403) {
        popup.premiumRequired(
          'Upgrade to Silver or above to verify your ID.',
          buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'ID Verification', minPlan: 'Silver' })
        );
      } else if (res.data.code === 409) {
        popup.warning('Already submitted', 'You already have a pending ID verification.');
      } else {
        popup.error('Upload failed', res.data.message || 'Please try again.');
      }
    } catch (e: any) {
      if (e?.response?.data?.code === 403) {
        popup.premiumRequired(
          'Upgrade to Silver or above to verify your ID.',
          buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'ID Verification', minPlan: 'Silver' })
        );
      } else {
        popup.error('Upload failed', e?.response?.data?.message || 'Network error.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBanner = () => {
    if (idVerified) {
      return (
        <View style={[s.banner, { backgroundColor: '#d1fae5' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#059669" />
          <Text style={[s.bannerText, { color: '#065f46' }]}>Your ID is verified ✓</Text>
        </View>
      );
    }
    if (!latest) return null;
    if (latest.status === 'PENDING') {
      return (
        <View style={[s.banner, { backgroundColor: '#fef3c7' }]}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#b45309" />
          <Text style={[s.bannerText, { color: '#78350f' }]}>
            Submitted — admin review in progress (within 24h)
          </Text>
        </View>
      );
    }
    if (latest.status === 'REJECTED') {
      return (
        <View style={[s.banner, { backgroundColor: '#fee2e2' }]}>
          <Ionicons name="close-circle" size={20} color="#dc2626" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[s.bannerText, { color: '#991b1b', marginLeft: 0 }]}>
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
      <SafeAreaView style={s.container}>
        <Stack.Screen options={{ title: 'Verify Government ID' }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#420001" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Verify Government ID' }} />
      <ScrollView contentContainerStyle={s.scroll}>
        {renderStatusBanner()}

        <View style={s.explainCard}>
          <View style={s.explainHeader}>
            <MaterialCommunityIcons name="shield-check" size={28} color="#420001" />
            <Text style={s.explainTitle}>Get the ID Verified Badge</Text>
          </View>
          <View style={s.bullet}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={s.bulletText}>
              Earn the highest trust signal — 5× more profile interest
            </Text>
          </View>
          <View style={s.bullet}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={s.bulletText}>
              Aadhaar, PAN, Voter ID, Driving License, or Passport accepted
            </Text>
          </View>
          <View style={s.bullet}>
            <Ionicons name="lock-closed" size={16} color="#059669" />
            <Text style={s.bulletText}>
              We only store the last 4 digits of your document number — never the full number
            </Text>
          </View>
        </View>

        {!idVerified && latest?.status !== 'PENDING' && (
          <>
            <Text style={s.sectionLabel}>Document Type</Text>
            <View style={s.docGrid}>
              {DOC_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[s.docChip, docType === t.value && s.docChipActive]}
                  onPress={() => setDocType(t.value)}
                >
                  <MaterialCommunityIcons
                    name={t.icon as any}
                    size={18}
                    color={docType === t.value ? '#fff' : '#420001'}
                  />
                  <Text style={[s.docLabel, docType === t.value && { color: '#fff' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionLabel}>Document Number (optional)</Text>
            <Text style={s.hint}>We only store the last 4 digits for audit</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 1234 5678 9012"
              placeholderTextColor="#9ca3af"
              value={documentNumber}
              onChangeText={setDocumentNumber}
              maxLength={32}
            />

            <Text style={s.sectionLabel}>Document Image</Text>
            {pickedImage ? (
              <View style={s.previewBox}>
                <Image source={{ uri: pickedImage.uri }} style={s.preview} />
                <TouchableOpacity style={s.removeBtn} onPress={() => setPickedImage(null)}>
                  <Ionicons name="close-circle" size={26} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.uploadRow}>
                <TouchableOpacity style={s.uploadBtn} onPress={takePhoto}>
                  <Ionicons name="camera" size={22} color="#420001" />
                  <Text style={s.uploadBtnText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.uploadBtn} onPress={pickImage}>
                  <Ionicons name="images" size={22} color="#420001" />
                  <Text style={s.uploadBtnText}>From Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[s.submitBtn, (!pickedImage || submitting) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!pickedImage || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={s.submitBtnText}>Submit for Verification</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  scroll: { padding: 16, paddingBottom: 40 },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 16 },
  bannerText: { marginLeft: 8, fontSize: 13, fontFamily: 'Rubik-Medium' },
  explainCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  explainHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  explainTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#420001', marginLeft: 10, flex: 1 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  bulletText: { fontSize: 12, color: '#374151', marginLeft: 8, flex: 1, lineHeight: 18 },
  sectionLabel: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#420001', marginBottom: 4, marginTop: 4 },
  hint: { fontSize: 11, color: '#6b7280', marginBottom: 6, fontStyle: 'italic' },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  docChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 22, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff',
  },
  docChipActive: { backgroundColor: '#420001', borderColor: '#420001' },
  docLabel: { marginLeft: 6, fontSize: 12, fontFamily: 'Rubik-Medium', color: '#420001' },
  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', marginBottom: 18,
  },
  uploadRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  uploadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: '#420001', backgroundColor: '#fff',
  },
  uploadBtnText: { color: '#420001', fontFamily: 'Rubik-Bold', marginLeft: 6, fontSize: 13 },
  previewBox: { position: 'relative', marginBottom: 18 },
  preview: {
    width: '100%', height: 220, borderRadius: 10, resizeMode: 'cover', backgroundColor: '#e5e7eb',
  },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 14 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#420001', paddingVertical: 14, borderRadius: 10, marginTop: 6,
  },
  submitBtnText: { color: '#fff', fontFamily: 'Rubik-Bold', fontSize: 14, marginLeft: 8 },
});
