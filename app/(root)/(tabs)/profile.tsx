import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, StyleSheet, Image, Text, TouchableOpacity,
  ActivityIndicator, ScrollView, Dimensions,
  Animated, Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressRing from '@/components/ProgressRing';
import EditProfileModal from '@/components/editProfileModal';
import userApi from '@/app/(root)/api/userApi';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';
import { useSubscription } from '../contexts/subscriptionContext';

const { width: SW } = Dimensions.get('window');
const CACHE_MS = 30000;

// ─── Color palette (from HTML design) ────────────────
const C = {
  brand: '#1F7FE5',
  brandDeep: '#1862b8',
  brandSoft: '#dfecfb',
  brandGlow: 'rgba(31,127,229,0.35)',
  amber: '#F5A425',
  amberSoft: '#feead0',
  amberDeep: '#c7811a',
  amberGlow: 'rgba(245,164,37,0.3)',
  maroon: '#420001',
  maroonSoft: '#f5e3e4',
  green: '#2e9a5c',
  greenSoft: '#dcf0e2',
  greenDeep: '#1f6b3e',
  pink: '#e85a7a',
  pinkSoft: '#fde0e7',
  lavender: '#8b6fd9',
  lavenderSoft: '#ebe5fb',
  ink: '#0f1724',
  ink2: '#1e293b',
  ink3: '#475569',
  ink4: '#64748b',
  ink5: '#94a3b8',
  line: '#e2e8f0',
  lineSoft: '#edf2f7',
  white: '#ffffff',
  bg: '#f1f5f9',
};

const HOBBY_EMOJI: Record<string, string> = {
  food: '🍕', travel: '✈️', photography: '📸', music: '🎵', reading: '📚',
  cricket: '🏏', yoga: '🧘', movies: '🎬', technology: '💻', fitness: '💪',
  art: '🎨', dance: '💃', cooking: '🍳', gardening: '🌱', spirituality: '🙏',
};

// ─── Helper: Detail Field ────────────────────────────
const DetailField = ({ label, value, full }: { label: string; value: string; full?: boolean }) => {
  const display = (!value || value === 'null' || value === 'undefined') ? '-' : value;
  return (
    <View style={[s.detailField, full && { width: '100%' }]}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, display === '-' && { color: '#94a3b8' }]}>{display}</Text>
    </View>
  );
};

// ─── Helper: Section Card ────────────────────────────
const SectionCard = ({ emoji, title, subtitle, onEdit, children }: {
  emoji: string; title: string; subtitle?: string; onEdit?: () => void; children: React.ReactNode;
}) => (
  <View style={s.detailCard}>
    <View style={s.detailHead}>
      <View style={s.detailHeadLeft}>
        <View style={[s.detailIconSm, { backgroundColor: C.brandSoft }]}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
        <View>
          <Text style={s.detailTitle}>{title}</Text>
          {subtitle && <Text style={s.detailSub}>{subtitle}</Text>}
        </View>
      </View>
      {onEdit && (
        <TouchableOpacity style={s.editMini} onPress={onEdit}>
          <MaterialIcons name="edit" size={13} color={C.ink3} />
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

// ─── Rotating Ring around Avatar ─────────────────────
const RotatingRing = () => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={[s.avatarRingOuter, { transform: [{ rotate: spin }] }]}>
      <LinearGradient
        colors={[C.amber, C.brand, C.pink, C.amber]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.avatarRingGradient}
      >
        <View style={s.avatarRingInner} />
      </LinearGradient>
    </Animated.View>
  );
};

// ─── Main Component ──────────────────────────────────
const ProfileScreen = () => {
  // params + initialTabIndex removed — card layout doesn't use tab index
  const { userData, updateField } = useUserData();
  const popup = usePopup();
  const { subscriptionData } = useSubscription() || {};

  const [userDetails, setUserDetails] = useState<any>(null);
  const [personalDetail, setPersonalDetail] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<any>(null);
  const [finalData, setFinalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isParent, setIsParent] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const lastFetchRef = useRef<number>(0);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSection, setEditSection] = useState<any>(null);

  // Horoscope state
  const [horoscopeImage, setHoroscopeImage] = useState<string | null>(null);
  const [horoscopeUploading, setHoroscopeUploading] = useState(false);

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [boostData, setBoostData] = useState<any>(null);
  const [profileScore, setProfileScore] = useState<number>(0);
  const [requestQuota, setRequestQuota] = useState<any>(null);
  const [countdown, setCountdown] = useState('');
  const [boostLoading, setBoostLoading] = useState(false);

  const planTitle = subscriptionData?.planTitle || 'Free';
  const planEnd = subscriptionData?.endDate; // used for expiry display

  useEffect(() => {
    (async () => {
      const role = await AsyncStorage.getItem('userRole');
      setIsParent(role === 'PARENT');
    })();
  }, []);

  // ─── Format user details ───────────────────────────
  const formatUserDetails = (data: any) => {
    if (!data?.userDetail?.length) return [];
    const d = data.userDetail[0];
    const basic = JSON.parse(d.basicInfo || '{}');
    const astroArr = JSON.parse(d.astronomicInfo || '[]');
    const famArr = JSON.parse(d.familyInfo || '[]');
    const astro = astroArr[0] || {};
    const fam = famArr[0] || {};
    return [
      { section: "PersonalDetail", data: { "First Name": data.firstName || "-", "Last Name": data.lastName || "-", Gender: data.gender === 'M' ? 'Male' : 'Female', "Date of Birth": data.dob || "-", Height: d.height || "-", Weight: d.weight || "-", "Physical Status": basic.physical_status || "-", "Marital Status": basic.marital_status || "-", "Mother Language": basic.mother_language || "Not specified" } },
      { section: "ReligiousDetail", data: { Religion: "Hindu", Caste: "SC", Star: astro.star || "-", "Moon Sign": astro.moon_sign || "-", Dosham: astro.dosham || "-" } },
      { section: "EducationalDetail", data: { Education: d.degree || "-", Occupation: d.occupation || "-", "Employing In": d.employedAt === 'GOVT' ? 'Government' : d.employedAt === 'PRIVATE' ? 'Private' : 'Self', "Annual Income": d.annualIncome ? d.annualIncome + "" : "-" } },
      { section: "FamilyDetail", data: { "Family Type": fam.family_type?.trim() || "-", "Family Status": fam.family_status?.trim() || "-", "Fathers Name": fam.father?.trim() || "-", "Fathers Occupation": fam.father_occupation?.trim() || "-", "Mothers Name": fam.mother?.trim() || "-", "Mothers Occupation": fam.mother_occupation?.trim() || "-", "No of Siblings": fam.no_of_siblings?.toString() || "-", "No of Brothers": fam.no_of_brother?.toString() || "-", "No of Sisters": fam.no_of_sister?.toString() || "-", "Sister Married": fam.sister_married?.trim() || "-", "Brother Married": fam.brother_married?.trim() || "-" } },
      { section: "InterestsDetail", data: (() => { try { const h = d?.hobbies; return { _hobbies: Array.isArray(typeof h === 'string' ? JSON.parse(h) : h) ? (typeof h === 'string' ? JSON.parse(h) : h) : [] }; } catch { return { _hobbies: [] }; } })() }
    ];
  };

  // ─── Data fetching ─────────────────────────────────
  useFocusEffect(useCallback(() => {
    const now = Date.now();
    if (now - lastFetchRef.current < CACHE_MS && finalData) return;
    refreshProfile(finalData ? false : true);
  }, [userData.userId]));

  const refreshProfile = useCallback(async (showLoading = true) => {
    if (!userData.userId) return;
    try {
      if (showLoading) setIsLoading(true);
      const [profileRes, galleryRes] = await Promise.all([
        userApi.getProfileDetails(userData.userId),
        userApi.getUserGalleryImages(userData.userId),
      ]);
      const raw = profileRes.data.data;
      if (raw?.profileImage) updateField('profileImage', raw.profileImage);
      setUserDetails(raw);
      const fmt = formatUserDetails(raw);
      setPersonalDetail(fmt);
      setGalleryImages(galleryRes.data.data);
      // Extract horoscope image from user detail
      const horoImg = raw?.userDetail?.[0]?.horoscope;
      setHoroscopeImage(horoImg && horoImg !== 'null' ? horoImg : null);
      setFinalData({ personalDetails: fmt || [], galleryImages: galleryRes.data.data || [] });
      lastFetchRef.current = Date.now();
    } catch (e) { console.error('Refresh error:', e); }
    finally { setIsLoading(false); }
  }, [userData.userId]);

  // Fetch stats, boost, score, quota
  useFocusEffect(useCallback(() => {
    if (!userData.userId) return;
    Promise.allSettled([
      userApi.userConnectionCount(userData.userId),
      userApi.getBoostStatus(userData.userId),
      userApi.getRequestQuota(userData.userId),
      userApi.getProfileCompletion(userData.userId),
    ]).then(([sR, bR, qR, pR]) => {
      if (sR.status === 'fulfilled' && sR.value?.data?.code === 200) setStats(sR.value.data.data);
      if (bR.status === 'fulfilled' && bR.value?.data?.code === 200) setBoostData(bR.value.data.data);
      if (qR.status === 'fulfilled' && qR.value?.data?.code === 200) setRequestQuota(qR.value.data.data);
      if (pR.status === 'fulfilled') {
        const pct = pR.value?.data?.data?.data?.completion?.percentage ?? pR.value?.data?.data?.data?.percentage ?? 0;
        setProfileScore(pct);
      }
    });
  }, [userData.userId]));

  // Boost countdown
  useEffect(() => {
    if (!boostData?.isBoostActive || !boostData?.expiresAt) return;
    const timer = setInterval(() => {
      const diff = new Date(boostData.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('');
        setBoostData((p: any) => p ? { ...p, isBoostActive: false } : p);
        clearInterval(timer);
        if (userData.userId) userApi.getBoostStatus(userData.userId).then((r: any) => { if (r.data?.code === 200) setBoostData(r.data.data); }).catch(() => { });
        return;
      }
      setCountdown(`${String(Math.floor(diff / 3600000)).padStart(2, '0')}:${String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')}:${String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [boostData?.isBoostActive, boostData?.expiresAt]);

  // ─── Handlers ──────────────────────────────────────

  const handlePickImage = async () => {
    if (isParent) { popup.error('Not allowed', 'Family members cannot change the profile photo.'); return; }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 1 });
      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        setImage(uri);
        if (!userData.decodedUserId) return;
        const ext = uri.split('.').pop() || 'jpg';
        const fd = new FormData();
        fd.append('file', { uri, type: ext === 'jpg' ? 'image/jpeg' : `image/${ext}`, name: `profile_${Date.now()}.${ext}` } as any);
        fd.append('userId', userData.decodedUserId);
        setImageUploading(true);
        try {
          const res = await userApi.updateProfileImage(fd);
          if (res?.data?.code === 200) {
            const url = typeof res.data.data === 'string' ? res.data.data : res.data.data?.profileImage;
            if (url) updateField('profileImage', url);
            await refreshProfile(false);
            popup.success('Updated', 'Profile image updated!');
          } else throw new Error(res?.data?.message || 'Failed');
        } finally { setImageUploading(false); }
      }
    } catch (e: any) { setImageUploading(false); popup.error('Error', e.message || 'Failed to update.'); }
  };

  const handleBoost = async () => {
    if (!userData.userId) return;
    const credits = boostData?.remainingCredits || 0;
    const cpm = boostData?.creditsPerMonth || 0;
    if (cpm === 0 && !boostData?.canBuyAddon) {
      popup.premiumRequired('Upgrade to Classic or above to boost your profile.', () => router.push('/(root)/screens/PremiumTab' as any));
      return;
    }
    if (credits <= 0 && (cpm > 0 || boostData?.canBuyAddon)) {
      popup.confirm('No boosts remaining', 'Buy an extra boost for ₹149?', () => {
        router.push({ pathname: '/(root)/screens/AddOnPaymentScreen', params: { featureTitle: 'Profile Boost', featureNote: 'BOOST_PURCHASE', price: '149', planId: '0', description: 'Top of search for 24h.' } } as any);
      }, 'Buy ₹149', 'Later');
      return;
    }
    popup.confirm('🚀 Boost Profile', `Top of search for 24h.\n${credits} boost${credits !== 1 ? 's' : ''} left.`, async () => {
      setBoostLoading(true);
      try {
        const res = await userApi.startBoost(userData.userId, 'MONTHLY_CREDIT');
        if (res.data.code === 200) {
          popup.success('Boosted! 🚀', '24h top placement active.');
          setBoostData((p: any) => ({ ...p, isBoostActive: true, expiresAt: res.data.data.expiresAt, remainingCredits: res.data.data.remainingCredits }));
        } else if (res.data.code === 409) popup.info('Active', 'Boost is already active.');
        else popup.error('Failed', res.data.message || 'Try again.');
      } catch (e: any) { popup.error('Failed', e?.response?.data?.message || 'Network error.'); }
      finally { setBoostLoading(false); }
    }, 'Boost Now', 'Cancel');
  };

  // ─── Gallery handlers ──────────────────────────────
  const handleGalleryUpload = async () => {
    if (isParent) { popup.error('Not allowed', 'Family members cannot upload gallery images.'); return; }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 1 });
      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        const ext = uri.split('.').pop() || 'jpg';
        const fd = new FormData();
        fd.append('file', { uri, type: ext === 'jpg' ? 'image/jpeg' : `image/${ext}`, name: `gallery_${Date.now()}.${ext}` } as any);
        fd.append('userId', userData.decodedUserId || atob(userData.userId));
        setImageUploading(true);
        try {
          const res = await userApi.uploadGalleryImage(fd);
          if (res?.data?.code === 200 || res?.data?.code === 201) {
            popup.success('Uploaded', 'Gallery image added!');
            await refreshProfile(false);
          } else popup.error('Upload failed', res?.data?.message || 'Try again.');
        } finally { setImageUploading(false); }
      }
    } catch (e) { setImageUploading(false); popup.error('Error', 'Failed to upload.'); }
  };

  const handleGalleryDelete = (galleryId: number) => {
    if (isParent) { popup.error('Not allowed', 'Family members cannot delete gallery images.'); return; }
    popup.confirm('Delete photo?', 'This photo will be removed from your gallery.', async () => {
      try {
        const res = await userApi.changeGalleryImageActiveStatusByImageId(galleryId);
        if (res?.data?.code === 200) { popup.success('Deleted', 'Photo removed.'); await refreshProfile(false); }
        else popup.error('Failed', res?.data?.message || 'Could not delete.');
      } catch (e) { popup.error('Failed', 'Network error.'); }
    }, 'Delete', 'Cancel');
  };

  // ─── Horoscope handlers ────────────────────────────
  const handleAddHoroscope = async () => {
    if (isParent) { popup.error('Not allowed', 'Family members cannot upload horoscope.'); return; }
    if (!userData.userId) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 1 });
      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        const ext = uri.split('.').pop() || 'jpg';
        const fd = new FormData();
        fd.append('file', { uri, type: ext === 'jpg' ? 'image/jpeg' : `image/${ext}`, name: `horoscope_${Date.now()}.${ext}` } as any);
        fd.append('userId', atob(userData.userId));
        setHoroscopeUploading(true);
        try {
          const res = await userApi.uploadHoroscopeImage(fd);
          if (res?.data?.code === 200 || res?.data?.code === 201) {
            popup.success('Success', 'Horoscope uploaded!', () => refreshProfile(false));
          } else {
            popup.error('Upload failed', res?.data?.message || 'Try again.');
          }
        } finally { setHoroscopeUploading(false); }
      }
    } catch (e) { setHoroscopeUploading(false); popup.error('Error', 'Failed to upload horoscope.'); }
  };

  const handleDeleteHoroscope = () => {
    if (isParent) { popup.error('Not allowed', 'Family members cannot delete horoscope.'); return; }
    if (!userData.userId) return;
    popup.confirm('Delete horoscope?', 'Your horoscope image will be removed. You can upload a new one anytime.', async () => {
      try {
        const res = await userApi.deleteHoroscopeByUserId(userData.userId);
        if (res?.data?.code === 200) { popup.success('Deleted', 'Horoscope removed.'); setHoroscopeImage(null); refreshProfile(false); }
        else popup.error('Failed', res?.data?.message || 'Could not delete.');
      } catch (e) { popup.error('Failed', 'Network error.'); }
    }, 'Delete', 'Cancel');
  };

  // ─── Edit handlers ─────────────────────────────────
  const handleEdit = (section: any) => {
    if (isParent) {
      popup.error('Not allowed', 'Family members cannot edit the primary member\'s profile.');
      return;
    }
    setEditSection(section);
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setEditSection(null);
  };

  const handleEditUpdate = async (updatedData: any) => {
    try {
      if (!userData.userId) return;
      const userId = userData.userId;
      const clean = (v: string) => (!v || v === '-' || v === 'Not specified') ? '' : v;

      const sectionMap: Record<string, (data: any) => any> = {
        PersonalDetail: (data) => ({
          userId, firstName: clean(data['First Name']), lastName: clean(data['Last Name']),
          height: clean(data['Height']), weight: clean(data['Weight']),
          physicalStatus: clean(data['Physical Status']), maritalStatus: clean(data['Marital Status']),
          motherLanguage: clean(data['Mother Language']),
        }),
        ReligiousDetail: (data) => ({
          userId, star: clean(data['Star']), moonSign: clean(data['Moon Sign']), dosham: clean(data['Dosham']),
        }),
        EducationalDetail: (data) => ({
          userId, education: data['Education'] || '', occupation: data['Occupation'] || '',
          employedAt: data['Employing In'] === 'Private' ? 'PRIVATE' : data['Employing In'] === 'Government' ? 'GOVT' : data['Employing In'] === 'Self Employment' ? 'SELF' : '',
          annualIncome: data['Annual Income'] || '',
        }),
        FamilyDetail: (data) => ({
          userId, house: clean(data['Family Type']), familyStatus: clean(data['Family Status']),
          fatherName: clean(data['Fathers Name']), fatherOccupation: clean(data['Fathers Occupation']),
          motherName: clean(data['Mothers Name']), motherOccupation: clean(data['Mothers Occupation']),
          noOfSiblings: clean(data['No of Siblings']), noOfBrothers: clean(data['No of Brothers']),
          noOfSisters: clean(data['No of Sisters']), noOfBrothersMarried: clean(data['Brother Married']),
          noOfSistersMarried: clean(data['Sister Married']),
        }),
      };

      const apiMap: Record<string, (payload: any) => Promise<any>> = {
        PersonalDetail: userApi.updateProfile,
        ReligiousDetail: userApi.updateAstroInfo,
        EducationalDetail: userApi.updateEducationInfo,
        FamilyDetail: userApi.updateFamilyInfo,
      };

      const key = editSection?.title;
      const formatter = sectionMap[key];
      const apiFn = apiMap[key];

      if (formatter && apiFn) {
        await apiFn(formatter(updatedData));
        const labels: Record<string, string> = {
          PersonalDetail: 'Personal details', ReligiousDetail: 'Religious details',
          EducationalDetail: 'Education details', FamilyDetail: 'Family details',
        };
        popup.success('Updated', `${labels[key] || 'Profile'} updated successfully.`);
        handleEditClose();
        await refreshProfile(false);
      }
    } catch (e) {
      console.error('Edit update error:', e);
      popup.error('Error', 'Failed to update. Please try again.');
    }
  };

  // ─── Derived ───────────────────────────────────────
  const trustCount = [true, userDetails?.idVerified, userDetails?.educationVerified, userDetails?.incomeVerified].filter(Boolean).length;

  const hobbies = (() => { try { const h = userDetails?.userDetail?.[0]?.hobbies; return typeof h === 'string' ? JSON.parse(h) : Array.isArray(h) ? h : []; } catch { return []; } })();
  const detail = userDetails?.userDetail?.[0] || {};
  const basic = (() => { try { return JSON.parse(detail.basicInfo || '{}'); } catch { return {}; } })();
  const astro = (() => { try { return (JSON.parse(detail.astronomicInfo || '[]'))[0] || {}; } catch { return {}; } })();
  const family = (() => { try { const f = JSON.parse(detail.familyInfo || '[]'); return Array.isArray(f) ? f[0] || {} : f; } catch { return {}; } })();
  const isGoldPlus = planTitle === 'Gold' || planTitle === 'Platinum';
  const canBoost = boostData?.creditsPerMonth > 0 || boostData?.canBuyAddon;

  // planBadgeColor removed — tier colors now in WelcomeHeaderCard

  // ─── Loading skeleton ──────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#d0dfeb' }} edges={['top']}>
        <LinearGradient colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']} locations={[0, 0.3, 0.6, 1.0]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* Topbar skeleton */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.5)' }} />
            <View style={{ width: 80, height: 20, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.4)', alignSelf: 'center' }} />
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.5)' }} />
          </View>
          {/* Hero skeleton */}
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
            <View style={{ width: 86, height: 86, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.4)' }} />
            <View style={{ flex: 1, gap: 8, paddingTop: 6 }}>
              <View style={{ width: 160, height: 20, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.4)' }} />
              <View style={{ width: 120, height: 14, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={{ width: 70, height: 24, borderRadius: 100, backgroundColor: 'rgba(245,164,37,0.3)' }} />
                <View style={{ width: 70, height: 24, borderRadius: 100, backgroundColor: 'rgba(31,127,229,0.2)' }} />
              </View>
            </View>
          </View>
          {/* Stats skeleton */}
          <View style={{ flexDirection: 'row', marginTop: 20, gap: 8 }}>
            {[1, 2, 3, 4].map(i => <View key={i} style={{ flex: 1, height: 60, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.4)' }} />)}
          </View>
          {/* Cards skeleton */}
          <View style={{ marginTop: 20, gap: 10 }}>
            <View style={{ height: 100, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.5)' }} />
            <View style={{ height: 180, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.5)' }} />
            <View style={{ height: 140, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.5)' }} />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ─── Render ────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#d0dfeb' }} edges={['top']}>
        <LinearGradient
          colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
          locations={[0, 0.3, 0.6, 1.0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {/* Top bar removed — settings icon is next to name */}

        {/* ─── HERO ─── */}
        <View style={s.hero}>
          <View style={s.heroRow}>
            {/* Avatar */}
            <TouchableOpacity onPress={handlePickImage} disabled={imageUploading} style={s.avatarBox}>
              <RotatingRing />
              <View style={s.avatarImg}>
                {userDetails?.profileImage ? (
                  <Image source={{ uri: userDetails.profileImage }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ fontSize: 22, color: '#fff', fontFamily: 'Rubik-Medium' }}>
                    {(userDetails?.firstName || 'U').charAt(0)}{(userDetails?.lastName || '').charAt(0)}
                  </Text>
                )}
              </View>
              {imageUploading && (
                <View style={{ ...StyleSheet.absoluteFillObject, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 5 }}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
              <View style={s.avatarEdit}>
                <MaterialIcons name="edit" size={12} color={C.ink2} />
              </View>
              <View style={s.onlineDot} />
            </TouchableOpacity>

            {/* Info */}
            <View style={s.heroInfo}>
              <Text style={s.heroName}>
                {userDetails?.firstName} {userDetails?.lastName} <Text style={s.heroAge}>({userDetails?.age || ''})</Text>
              </Text>
              <View style={s.heroLocation}>
                <MaterialIcons name="place" size={14} color={C.brand} />
                <Text style={s.heroLocationText}>{userDetails?.location || 'Location not set'}</Text>
              </View>
              <View style={s.heroTags}>
                <LinearGradient colors={[C.amber, C.amberDeep]} style={s.tagPillAmber}>
                  <Text style={{ fontSize: 10, marginRight: 3 }}>♛</Text>
                  <Text style={s.tagPillAmberText}>{planTitle}</Text>
                </LinearGradient>
                {trustCount > 1 && (
                  <LinearGradient colors={[C.brand, C.brandDeep]} style={s.tagPillBlue}>
                    <MaterialIcons name="verified" size={11} color="#fff" />
                    <Text style={s.tagPillBlueText}>Verified</Text>
                  </LinearGradient>
                )}

                {planEnd && planTitle !== 'Free' && (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Rubik-Medium', color: '#64748b', letterSpacing: -0.1 }}>
                      Until {new Date(planEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Settings */}
            <TouchableOpacity onPress={() => router.push('/screens/settingsPage' as any)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: 'rgba(15,35,70,0.06)', shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, alignSelf: 'center', flexShrink: 0 }}>
              <MaterialIcons name="settings" size={20} color={C.ink3} />
            </TouchableOpacity>
          </View>

          {/* ─── STATS ROW ─── */}
          <View style={s.statsRow}>
            {/* Profile Score with Ring */}
            <View style={s.statCell}>
              <View style={{ width: 48, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <ProgressRing size={48} strokeWidth={3.5} percentage={profileScore} color={C.brand} bgColor="rgba(31,127,229,0.12)" />
                <Text style={{ position: 'absolute', fontSize: 12, fontFamily: 'Rubik-Bold', color: C.ink }}>{profileScore}%</Text>
              </View>
              <Text style={s.statLabel}>Profile</Text>
            </View>

            {/* Trust Score with Ring — tappable */}
            <TouchableOpacity style={s.statCell} activeOpacity={0.7} onPress={() => router.push('/(root)/screens/TrustVerificationScreen' as any)}>
              <View style={{ width: 48, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <ProgressRing size={48} strokeWidth={3.5} percentage={Math.round((trustCount / 4) * 100)} color={C.green} bgColor="rgba(46,154,92,0.12)" />
                <Text style={{ position: 'absolute', fontSize: 12, fontFamily: 'Rubik-Bold', color: C.ink }}>{trustCount}/4</Text>
              </View>
              <Text style={s.statLabel}>Trust</Text>
            </TouchableOpacity>

            {/* Requests */}
            <View style={s.statCell}>
              <View style={{ height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Text style={s.statNum}>{requestQuota?.unlimited ? '∞' : (requestQuota?.remaining ?? '—')}</Text>
              </View>
              <Text style={s.statLabel}>Requests</Text>
            </View>

            {/* Saved You — Gold+ gated */}
            <TouchableOpacity style={[s.statCell, { borderRightWidth: 0 }]} activeOpacity={0.7} onPress={() => {
              if (isGoldPlus) {
                router.push({ pathname: '/(root)/screens/ListUser', params: { type: 'whoShortlistedMe', title: 'Who Shortlisted You' } } as any);
              } else {
                popup.premiumRequired('Upgrade to Gold to see who shortlisted your profile.', () => router.push('/(root)/screens/PremiumTab' as any));
              }
            }}>
              <View style={{ height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Text style={s.statNum}>{stats?.Shortlisted || 0}</Text>
              </View>
              <Text style={s.statLabel}>Saved</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── CONTENT ─── */}
        <View style={s.content}>

          {/* Boost Banner */}
          {boostData?.isBoostActive ? (
            <LinearGradient colors={['#2d1f3d', '#1e1030']} style={s.boostBanner}>
              <View style={s.boostIcon}><Ionicons name="rocket" size={18} color="#4a2e06" /></View>
              <View style={{ flex: 1, zIndex: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={s.liveDot} />
                  <Text style={s.boostTitle}>Boost is live</Text>
                </View>
                <Text style={s.boostSub}>10× visibility · <Text style={{ color: '#fff', fontFamily: 'Rubik-Medium' }}>{countdown}</Text> left</Text>
              </View>
            </LinearGradient>
          ) : canBoost || (boostData?.creditsPerMonth > 0) ? (
            <TouchableOpacity onPress={handleBoost} disabled={boostLoading} activeOpacity={0.85}>
              <LinearGradient colors={['#2d1f3d', '#1e1030']} style={s.boostBanner}>
                <View style={s.boostIcon}><Ionicons name="rocket" size={18} color="#4a2e06" /></View>
                <View style={{ flex: 1, zIndex: 2 }}>
                  <Text style={s.boostTitle}>{boostLoading ? 'Boosting...' : 'Boost your profile'}</Text>
                  <Text style={s.boostSub}>Get 10× visibility for 24 hours</Text>
                </View>
                <View style={s.boostCta}>
                  <Text style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: C.ink }}>{boostData?.remainingCredits > 0 ? `${boostData.remainingCredits} left` : '₹149'}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {/* Quick Links */}
          <Text style={s.sectionTitle}>Your Matrimony Profile</Text>

          <TouchableOpacity style={s.listCard} onPress={() => router.push({ pathname: '/screens/ListUser', params: { type: 'shortlisted', title: 'Saved Profiles' } } as any)}>
            <View style={[s.listCardIcon, { backgroundColor: C.pinkSoft }]}><Text style={{ fontSize: 22 }}>💗</Text></View>
            <View style={s.listCardBody}>
              <Text style={s.listCardTitle}>Saved Profiles</Text>
              <Text style={s.listCardSub}>Your shortlisted profiles</Text>
            </View>
            <View style={s.listCardChev}><MaterialIcons name="chevron-right" size={16} color={C.ink3} /></View>
          </TouchableOpacity>

          <TouchableOpacity style={s.listCard} onPress={() => router.push({ pathname: '/screens/ListUser', params: { type: 'viewed', title: 'Who Viewed You' } } as any)}>
            <View style={[s.listCardIcon, { backgroundColor: C.lavenderSoft }]}><Text style={{ fontSize: 22 }}>👀</Text></View>
            <View style={s.listCardBody}>
              <Text style={s.listCardTitle}>Who Viewed You</Text>
              <Text style={s.listCardSub}>{stats?.Admirers || 0} profiles this week</Text>
            </View>
            <View style={s.listCardChev}><MaterialIcons name="chevron-right" size={16} color={C.ink3} /></View>
          </TouchableOpacity>

          {isGoldPlus && (
            <TouchableOpacity style={s.listCard} onPress={() => router.push({ pathname: '/screens/ListUser', params: { type: 'whoShortlistedMe', title: 'Who Shortlisted You' } } as any)}>
              <View style={[s.listCardIcon, { backgroundColor: C.amberSoft }]}><Text style={{ fontSize: 22 }}>⭐</Text></View>
              <View style={s.listCardBody}>
                <Text style={s.listCardTitle}>Who Shortlisted You</Text>
                <Text style={s.listCardSub}>{stats?.Shortlisted || 0} profiles saved you</Text>
              </View>
              <View style={s.listCardChev}><MaterialIcons name="chevron-right" size={16} color={C.ink3} /></View>
            </TouchableOpacity>
          )}

          {/* ─── YOUR DETAILS ─── */}
          <Text style={s.sectionTitle}>Your Details</Text>



          {/* Personal */}
          <SectionCard emoji="👤" title="Personal" subtitle={`${Object.values(personalDetail?.[0]?.data || {}).filter(v => v && v !== '-').length} fields`} onEdit={() => handleEdit(personalDetail?.[0])}>
            <View style={s.detailGrid}>
              <DetailField label="Gender" value={userDetails?.gender === 'M' ? 'Male' : 'Female'} />
              <DetailField label="DOB" value={userDetails?.dob} />
              <DetailField label="Marital" value={basic.marital_status} />
              <DetailField label="Height" value={detail.height} />
              <DetailField label="Weight" value={detail.weight} />
              <DetailField label="Mother tongue" value={basic.mother_language || detail.languages} />
              <DetailField label="Physical status" value={basic.physical_status} full />
            </View>
          </SectionCard>

          {/* Hobbies */}
          <SectionCard emoji="🎨" title="Interests & Hobbies" subtitle={`${hobbies.length} selected`} onEdit={() => handleEdit(personalDetail?.[4])}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {hobbies.length > 0 ? hobbies.map((h: string, i: number) => (
                <View key={i} style={s.chip}>
                  <Text style={{ fontSize: 13, marginRight: 4 }}>{HOBBY_EMOJI[h.toLowerCase()] || '🎯'}</Text>
                  <Text style={s.chipText}>{h.charAt(0).toUpperCase() + h.slice(1)}</Text>
                </View>
              )) : (
                <Text style={{ fontSize: 12, color: C.ink4, fontStyle: 'italic' }}>No interests added yet</Text>
              )}
            </View>
          </SectionCard>

          {/* Contact */}
          <LinearGradient colors={[C.brand, C.brandDeep]} style={s.contactCard}>
            <View style={s.contactHead}>
              <View style={s.contactBadge}><MaterialIcons name="verified" size={10} color="#fff" /><Text style={{ fontSize: 10, fontFamily: 'Rubik-Medium', color: '#fff', marginLeft: 4 }}>VERIFIED</Text></View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Mobile · Primary</Text>
            </View>
            <View style={s.contactBody}>
              <Text style={s.contactNum}>{userDetails?.mobile || '—'}</Text>
              <TouchableOpacity style={s.contactBtn}>
                <MaterialIcons name="phone" size={17} color={C.brand} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Religious */}
          <SectionCard emoji="🕉️" title="Religious" subtitle="5 fields" onEdit={() => handleEdit(personalDetail?.[1])}>
            <View style={s.detailGrid}>
              <DetailField label="Religion" value="Hindu" />
              <DetailField label="Caste" value="SC" />
              <DetailField label="Nakshatra" value={astro.star} />
              <DetailField label="Moon sign" value={astro.moon_sign} />
              <DetailField label="Dosham" value={astro.dosham} full />
            </View>
          </SectionCard>

          {/* Horoscope */}
          <SectionCard emoji="🔮" title="Birth Chart" subtitle={horoscopeImage ? 'Uploaded' : 'Not uploaded'}>
            {horoscopeUploading ? (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <ActivityIndicator size="large" color={C.brand} />
                <Text style={{ color: C.ink4, fontSize: 12, marginTop: 8 }}>Uploading...</Text>
              </View>
            ) : horoscopeImage ? (
              <View>
                <Image source={{ uri: horoscopeImage }} style={{ width: '100%', height: 200, borderRadius: 14 }} resizeMode="contain" />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f6f8fa', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 }} onPress={handleAddHoroscope}>
                    <MaterialIcons name="upload" size={14} color={C.ink3} />
                    <Text style={{ fontSize: 12, fontFamily: 'Rubik-Medium', color: C.ink2 }}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f6f8fa', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 }} onPress={handleDeleteHoroscope}>
                    <MaterialIcons name="delete-outline" size={14} color="#dc2626" />
                    <Text style={{ fontSize: 12, fontFamily: 'Rubik-Medium', color: '#dc2626' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={handleAddHoroscope} style={{ alignItems: 'center', paddingVertical: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.brand, borderRadius: 14, backgroundColor: C.brandSoft }}>
                <MaterialIcons name="add-photo-alternate" size={28} color={C.brand} />
                <Text style={{ fontSize: 12, fontFamily: 'Rubik-Medium', color: C.brand, marginTop: 6 }}>Upload Horoscope</Text>
                <Text style={{ fontSize: 10, color: C.ink4, marginTop: 2 }}>Rasi chart or Jathagam image</Text>
              </TouchableOpacity>
            )}
          </SectionCard>

          {/* Work & Education */}
          <SectionCard emoji="💼" title="Work & Education" subtitle="6 fields" onEdit={() => handleEdit(personalDetail?.[2])}>
            <View style={s.detailGrid}>
              <DetailField label="Education" value={detail.degree} />
              <DetailField label="Specialization" value={detail.educationInDetail} />
              <DetailField label="Occupation" value={detail.occupation} />
              <DetailField label="Sector" value={detail.employedAt === 'GOVT' ? 'Government' : detail.employedAt === 'PRIVATE' ? 'Private' : detail.employedAt === 'SELF' ? 'Self Employed' : detail.employedAt || '-'} />
              <DetailField label="Income" value={detail.annualIncome ? `₹${Number(detail.annualIncome).toLocaleString('en-IN')}` : '-'} />
              <DetailField label="Job location" value={detail.jobPlace} />
            </View>
          </SectionCard>

          {/* Family */}
          <SectionCard emoji="👨‍👩‍👧‍👦" title="Family Details" subtitle={`${Object.values(family).filter(v => v && v !== '-' && v).length} fields`} onEdit={() => handleEdit(personalDetail?.[3])}>
            <View style={s.detailGrid}>
              <DetailField label="Family type" value={family.family_type || family.familyType} />
              <DetailField label="Family status" value={family.family_status} />
              <DetailField label="Father's name" value={family.father} />
              <DetailField label="Father's job" value={family.father_occupation} />
              <DetailField label="Mother's name" value={family.mother} />
              <DetailField label="Mother's job" value={family.mother_occupation} />
              <DetailField label="Siblings" value={family.no_of_siblings} />
              <DetailField label="Brothers" value={family.no_of_brother} />
              <DetailField label="Brothers married" value={family.brother_married} />
              <DetailField label="Sisters" value={family.no_of_sister} />
              <DetailField label="Sisters married" value={family.sister_married} />
            </View>
          </SectionCard>

          {/* Action tiles */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionTile} onPress={() => router.push('/screens/PrivacySettingsPage' as any)}>
              <View style={[s.actionTileIcon, { backgroundColor: C.brandSoft }]}><MaterialIcons name="shield" size={16} color={C.brand} /></View>
              <View><Text style={s.actionTileTitle}>Privacy</Text><Text style={s.actionTileSub}>Who sees what</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionTile} onPress={() => router.push('/(root)/screens/TrustVerificationScreen' as any)}>
              <View style={[s.actionTileIcon, { backgroundColor: C.amberSoft }]}><MaterialIcons name="star" size={16} color={C.amberDeep} /></View>
              <View><Text style={s.actionTileTitle}>Trust score</Text><Text style={s.actionTileSub}>{trustCount} of 4 verified</Text></View>
            </TouchableOpacity>
          </View>

          {/* ─── GALLERY ─── */}
          <View style={s.galWrap}>
            <View style={s.galHead}>
              <View style={s.detailHeadLeft}>
                <View style={[s.detailIconSm, { backgroundColor: C.brandSoft }]}><Text style={{ fontSize: 18 }}>📷</Text></View>
                <View>
                  <Text style={s.detailTitle}>Photos</Text>
                  <Text style={s.detailSub}>High-quality boosts views by 3×</Text>
                </View>
              </View>
              {galleryImages?.length > 0 && (
                <View style={s.galProgress}>
                  <Text style={s.galProgressText}>{galleryImages.filter((g: any) => g.isActive === 'Y').length}/{galleryImages.length}</Text>
                  <View style={s.galProgressBar}>
                    <View style={{ width: `${Math.min(100, (galleryImages.filter((g: any) => g.isActive === 'Y').length / Math.max(1, galleryImages.length)) * 100)}%`, height: '100%', backgroundColor: C.brand, borderRadius: 100 }} />
                  </View>
                </View>
              )}
            </View>
            <View style={s.galGrid}>
              {/* Primary photo */}
              {userDetails?.profileImage ? (
                <TouchableOpacity style={s.galSlot} onPress={handlePickImage}>
                  <Image source={{ uri: userDetails.profileImage }} style={{ width: '100%', height: '100%' }} />
                  <View style={s.slotTag}><Text style={s.slotTagText}>Primary</Text></View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[s.galSlot, s.galSlotEmpty]} onPress={handlePickImage}>
                  <MaterialIcons name="add" size={22} color={C.brand} />
                  <Text style={s.galSlotEmptyText}>Profile</Text>
                </TouchableOpacity>
              )}

              {/* Gallery images — long press to delete */}
              {galleryImages?.filter((g: any) => g.isActive === 'Y')?.slice(0, 2).map((img: any, i: number) => (
                <TouchableOpacity key={i} style={s.galSlot} onLongPress={() => handleGalleryDelete(img.id)} activeOpacity={0.9}>
                  <Image source={{ uri: img.userImage }} style={{ width: '100%', height: '100%' }} />
                  {i === 0 && <View style={s.slotTag}><Text style={s.slotTagText}>Gallery</Text></View>}
                </TouchableOpacity>
              ))}

              {/* Empty slots — tap to upload */}
              {Array.from({ length: Math.max(0, 3 - 1 - (galleryImages?.filter((g: any) => g.isActive === 'Y')?.length || 0)) }).map((_, i) => (
                <TouchableOpacity key={`empty-${i}`} style={[s.galSlot, s.galSlotEmpty]} onPress={handleGalleryUpload} activeOpacity={0.7}>
                  <MaterialIcons name="add" size={22} color={C.brand} />
                  <Text style={s.galSlotEmptyText}>Add photo</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <View style={s.footerLine} />
            <Text style={s.footerBrand}>Vaibhav <Text style={{ color: C.brand, fontStyle: 'italic' }}>Vivaha</Text></Text>
            <Text style={s.footerVersion}>v2.1 · Sacred matches made simple</Text>
          </View>
        </View>
      </ScrollView>
      </LinearGradient>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        section={editSection}
        onUpdate={handleEditUpdate}
        refreshProfile={() => refreshProfile(false)}
      />
    </SafeAreaView>
  );
};

// ─── Styles (matching HTML design tokens exactly) ────
const SHADOW = { shadowColor: 'rgba(15,35,70,0.08)', shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 };

const s = StyleSheet.create({
  // Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', ...SHADOW },
  topbarTitle: { fontSize: 20, fontFamily: 'Rubik-Bold', color: C.ink, letterSpacing: -0.4 },

  // Hero
  hero: { paddingHorizontal: 16, paddingTop: 8 },
  heroRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatarBox: { width: 68, height: 68, position: 'relative', flexShrink: 0 },
  avatarRingOuter: { position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: 22, opacity: 0.85, zIndex: 0 },
  avatarRingGradient: { width: '100%', height: '100%', borderRadius: 22, padding: 2, justifyContent: 'center', alignItems: 'center' },
  avatarRingInner: { width: '100%', height: '100%', borderRadius: 19, backgroundColor: '#b8d0e8' },
  avatarImg: { position: 'relative', zIndex: 2, width: '100%', height: '100%', borderRadius: 17, overflow: 'hidden', backgroundColor: '#9b6f52', justifyContent: 'center', alignItems: 'center' },
  avatarEdit: { position: 'absolute', bottom: -3, right: -3, width: 24, height: 24, borderRadius: 12, backgroundColor: C.white, borderWidth: 2, borderColor: '#b8d0e8', justifyContent: 'center', alignItems: 'center', zIndex: 3, ...SHADOW },
  onlineDot: { position: 'absolute', top: 4, right: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: C.green, borderWidth: 2, borderColor: '#b8d0e8', zIndex: 3 },
  heroInfo: { flex: 1, minWidth: 0 },
  heroName: { fontSize: 18, fontFamily: 'Rubik-Bold', color: C.ink, letterSpacing: -0.4, lineHeight: 22 },
  heroAge: { fontFamily: 'Rubik-Regular', color: C.ink3, fontSize: 15, letterSpacing: -0.2 },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  heroLocationText: { fontSize: 12, fontFamily: 'Rubik-Medium', color: C.ink4, letterSpacing: -0.1 },
  heroTags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tagPillAmber: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, shadowColor: C.amberGlow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  tagPillAmberText: { fontSize: 10, fontFamily: 'Rubik-Bold', color: '#4a2e06', letterSpacing: 0.1 },
  tagPillBlue: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, shadowColor: C.brandGlow, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  tagPillBlueText: { fontSize: 10, fontFamily: 'Rubik-Bold', color: '#fff' },

  // Stats
  statsRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 10, marginTop: 8 },
  statCell: { flex: 1, alignItems: 'center', position: 'relative', paddingVertical: 4, paddingHorizontal: 2, borderRightWidth: 1, borderRightColor: 'rgba(15,35,70,0.14)' },
  statNum: { fontSize: 26, fontFamily: 'Rubik-Bold', color: C.ink, letterSpacing: -1, lineHeight: 28 },
  statPct: { fontSize: 16, fontFamily: 'Rubik-Medium', color: C.ink4, marginLeft: 1 },
  statFrac: { fontSize: 16, fontFamily: 'Rubik-Medium', color: C.ink4, marginLeft: 1 },
  statLabel: { marginTop: 5, fontSize: 11, fontFamily: 'Rubik-Medium', color: C.ink4, letterSpacing: -0.1 },

  // Content
  content: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: C.ink, marginTop: 10, marginBottom: 8, letterSpacing: -0.3 },

  // Boost banner
  boostBanner: { borderRadius: 18, padding: 12, paddingHorizontal: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', shadowColor: 'rgba(31,16,48,0.25)', shadowOpacity: 1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  boostIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.amber, justifyContent: 'center', alignItems: 'center', zIndex: 2, shadowColor: C.amberGlow, shadowOpacity: 1, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  boostTitle: { fontSize: 14, fontFamily: 'Rubik-Bold', color: C.white, letterSpacing: -0.2 },
  boostSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.65)', marginTop: 2, letterSpacing: -0.1 },
  boostCta: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: C.white, zIndex: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.amber },

  // List cards
  listCard: { backgroundColor: C.white, borderRadius: 18, padding: 12, paddingHorizontal: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, ...SHADOW },
  listCardIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  listCardBody: { flex: 1, minWidth: 0 },
  listCardTitle: { fontSize: 15, fontFamily: 'Rubik-Bold', color: C.ink, letterSpacing: -0.3, marginBottom: 3 },
  listCardSub: { fontSize: 12.5, fontFamily: 'Rubik-Regular', color: C.ink4, letterSpacing: -0.1 },
  listCardChev: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f6f8fa', justifyContent: 'center', alignItems: 'center' },

  // Detail cards
  detailCard: { backgroundColor: C.white, borderRadius: 18, padding: 14, paddingTop: 12, marginBottom: 8, ...SHADOW },
  detailHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  detailHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailIconSm: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  detailTitle: { fontSize: 14.5, fontFamily: 'Rubik-Bold', color: C.ink, letterSpacing: -0.2 },
  detailSub: { fontSize: 11, fontFamily: 'Rubik-Regular', color: C.ink4, letterSpacing: -0.1, marginTop: 1 },
  editMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.lineSoft, justifyContent: 'center', alignItems: 'center' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailField: { width: '47%', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f6f8fa', borderRadius: 12 },
  detailLabel: { fontSize: 10, fontFamily: 'Rubik-Medium', color: C.ink4, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 13.5, fontFamily: 'Rubik-Medium', color: C.ink, letterSpacing: -0.2, lineHeight: 18 },

  // Chips
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100, backgroundColor: '#f6f8fa' },
  chipText: { fontSize: 12, fontFamily: 'Rubik-Medium', color: C.ink2, letterSpacing: -0.1 },

  // Contact
  contactCard: { borderRadius: 18, padding: 14, marginBottom: 8, overflow: 'hidden', shadowColor: C.brandGlow, shadowOpacity: 1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  contactHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, zIndex: 2 },
  contactBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 100 },
  contactBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  contactNum: { fontSize: 22, fontFamily: 'Rubik-Bold', color: C.white, letterSpacing: -0.5 },
  contactBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, justifyContent: 'center', alignItems: 'center' },

  // Action tiles
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  actionTile: { flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, ...SHADOW },
  actionTileIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actionTileTitle: { fontSize: 13, fontFamily: 'Rubik-Medium', color: C.ink, letterSpacing: -0.2 },
  actionTileSub: { fontSize: 10.5, fontFamily: 'Rubik-Regular', color: C.ink4, marginTop: 1 },

  // Gallery
  galWrap: { backgroundColor: C.white, borderRadius: 18, padding: 14, marginBottom: 8, ...SHADOW },
  galHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, paddingHorizontal: 2 },
  galProgress: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.brandSoft, borderRadius: 100 },
  galProgressText: { fontSize: 10.5, fontFamily: 'Rubik-Medium', color: C.brandDeep },
  galProgressBar: { width: 30, height: 3, borderRadius: 100, backgroundColor: 'rgba(31,127,229,0.2)', overflow: 'hidden' },
  galGrid: { flexDirection: 'row', gap: 8 },
  galSlot: { flex: 1, aspectRatio: 3 / 4, borderRadius: 14, overflow: 'hidden', position: 'relative', backgroundColor: '#e8ddd4' },
  galSlotEmpty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.brand, backgroundColor: C.brandSoft, justifyContent: 'center', alignItems: 'center' },
  galSlotEmptyText: { fontSize: 10, fontFamily: 'Rubik-Medium', color: C.brand, marginTop: 5, letterSpacing: -0.1 },
  slotTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 100 },
  slotTagText: { fontSize: 9, fontFamily: 'Rubik-Medium', color: C.white, letterSpacing: 0.2 },

  // Footer
  footer: { alignItems: 'center', paddingTop: 16, paddingBottom: 6 },
  footerLine: { width: 30, height: 2, backgroundColor: C.brand, borderRadius: 2, marginBottom: 12 },
  footerBrand: { fontSize: 15, fontFamily: 'Rubik-Medium', color: C.ink3, letterSpacing: -0.3 },
  footerVersion: { fontSize: 10, color: C.ink5, marginTop: 4, letterSpacing: 0.3 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: C.white, borderRadius: 22, padding: 22 },
  modalTitle: { fontSize: 18, fontFamily: 'Rubik-Bold', color: C.ink, marginBottom: 4 },
  modalInput: { backgroundColor: '#f6f8fa', borderRadius: 14, padding: 14, fontSize: 14, color: C.ink, textAlignVertical: 'top', minHeight: 100, borderWidth: 1, borderColor: C.line },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
});

export default ProfileScreen;