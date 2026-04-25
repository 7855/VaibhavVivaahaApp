import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  Modal, FlatList, Dimensions, Linking, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import VerifiedBadges from '@/components/VerifiedBadges';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '@/app/(root)/api/userApi';
import { Heart, Share2, Phone, Star, ChevronLeft, MoreVertical, Maximize2, Bookmark, BookmarkCheck } from 'lucide-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_ASPECT = 5 / 4;
const IMAGE_HEIGHT = SCREEN_WIDTH * IMAGE_ASPECT;

// ─── Inline Profile Sections ───
const HOBBY_EMOJI: Record<string, string> = {
  food: '🍕', travel: '✈️', photography: '📸', music: '🎵', reading: '📚',
  cricket: '🏏', yoga: '🧘', movies: '🎬', technology: '💻', fitness: '💪',
  art: '🎨', dance: '💃', cooking: '🍳', gardening: '🌱', spirituality: '🙏',
};

const DetailField = ({ label, value }: { label: string; value: string }) => {
  if (!value || value === '-' || value === 'null' || value === 'undefined') return null;
  return (
    <View style={{ flex: 1, minWidth: '46%', marginBottom: 0, backgroundColor: '#f6f8fa', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 }}>
      <Text style={{ fontSize: 10, fontWeight: '500', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#0f1724', letterSpacing: -0.2, lineHeight: 18 }}>{value}</Text>
    </View>
  );
};

const SectionCard = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
  <View style={{ backgroundColor: '#fff', padding: 14, borderRadius: 18, marginBottom: 8, shadowColor: 'rgba(15,35,70,0.08)', shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#dfecfb', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialIcons name={icon} size={16} color="#1F7FE5" />
      </View>
      <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#0f1724', letterSpacing: -0.2 }}>{title}</Text>
    </View>
    {children}
  </View>
);

const PremiumLock = ({ message }: { message: string }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(root)/screens/PremiumTab' as any)} style={{ backgroundColor: '#fffbeb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#fde68a' }}>
    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' }}>
      <MaterialIcons name="lock" size={14} color="#d97706" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400e' }}>Premium Only</Text>
      <Text style={{ fontSize: 10, color: '#b45309' }}>{message}</Text>
    </View>
    <MaterialIcons name="chevron-right" size={18} color="#d97706" />
  </TouchableOpacity>
);

const RestrictedField = ({ fieldType, profileDetailId, currentUserId }: { fieldType: string; profileDetailId: string; currentUserId: string }) => {
  const [requested, setRequested] = useState(false);
  const fieldLabel = fieldType === 'PROFILE_IMAGE' ? 'Profile Photo' : fieldType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={async () => {
        try {
          const decodedId = (() => { try { return atob(currentUserId); } catch { return currentUserId; } })();
          if (requested) {
            await userApi.deleteRequest(decodedId, profileDetailId, fieldType);
            setRequested(false);
          } else {
            await userApi.sendRestrictedFieldRequest(decodedId, profileDetailId, fieldType);
            setRequested(true);
          }
        } catch {}
      }}
      style={{ backgroundColor: '#fff7ed', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#fed7aa' }}
    >
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialIcons name={requested ? 'hourglass-top' : 'lock'} size={14} color="#c2410c" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#9a3412' }}>{fieldLabel} Hidden</Text>
        <Text style={{ fontSize: 10, color: '#c2410c' }}>{requested ? 'Permission requested' : 'Tap to request access'}</Text>
      </View>
      <MaterialIcons name={requested ? 'close' : 'chevron-right'} size={18} color="#c2410c" />
    </TouchableOpacity>
  );
};

const InlineProfileTabs = ({ personalDetail, isPremium, hiddenFields = [], profileDetailId = '', currentUserId = '' }: {
  personalDetail: any[]; isPremium: boolean; hiddenFields?: string[]; profileDetailId?: string; currentUserId?: string;
}) => {
  const personal = personalDetail?.[0]?.data || {};
  const religious = personalDetail?.[1]?.data || {};
  const education = personalDetail?.[2]?.data || {};
  const family = personalDetail?.[3]?.data || {};
  const interests = personalDetail?.[4]?.data?._hobbies || [];

  const renderPersonal = () => (
    <View style={{ gap: 0 }}>
      <SectionCard icon="person" title="Basic Details">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <DetailField label="Date of Birth" value={personal['Date of Birth']} />
          <DetailField label="Marital Status" value={personal['Marital Status']} />
          <DetailField label="Height / Weight" value={`${personal.Height || '-'} / ${personal.Weight || '-'}`} />
          <DetailField label="Mother Tongue" value={personal['Mother Language']} />
          <DetailField label="Physical Status" value={personal['Physical Status']} />
          <DetailField label="Gender" value={personal.Gender} />
        </View>
      </SectionCard>
      <SectionCard icon="contact-phone" title="Contact">
        {hiddenFields.includes('mobile') ? (
          <RestrictedField fieldType="MOBILE" profileDetailId={profileDetailId} currentUserId={currentUserId} />
        ) : personal['Mobile Number'] && personal['Mobile Number'] !== 'null' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#dfecfb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(31,127,229,0.15)' }}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '500', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 }}>Mobile</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#1862b8', marginTop: 2 }}>{personal['Mobile Number']}</Text>
            </View>
            <MaterialIcons name="phone" size={20} color="#1F7FE5" />
          </View>
        ) : (
          <PremiumLock message="Upgrade to view contact details" />
        )}
      </SectionCard>
      {interests.length > 0 && (
        <SectionCard icon="interests" title="Interests & Hobbies">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {interests.map((hobby: string, i: number) => (
              <View key={i} style={{ backgroundColor: '#f6f8fa', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1e293b' }}>
                  {HOBBY_EMOJI[hobby.toLowerCase()] || '🎯'} {hobby.charAt(0).toUpperCase() + hobby.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}
    </View>
  );

  const renderReligious = () => (
    <View style={{ gap: 0 }}>
      <SectionCard icon="auto-awesome" title="Religious Details">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <DetailField label="Religion" value={religious.Religion} />
          <DetailField label="Caste" value={religious.Caste} />
          <DetailField label="Star" value={religious.Star} />
          <DetailField label="Moon Sign" value={religious.Moonsign} />
          <DetailField label="Dosham" value={religious.Dosham} />
        </View>
      </SectionCard>
      <SectionCard icon="photo" title="Horoscope">
        {hiddenFields.includes('horoscope') ? (
          <RestrictedField fieldType="HOROSCOPE" profileDetailId={profileDetailId} currentUserId={currentUserId} />
        ) : religious.Horoscope && religious.Horoscope !== 'null' ? (
          <Image source={{ uri: religious.Horoscope }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="contain" />
        ) : !isPremium ? (
          <PremiumLock message="Upgrade to view horoscope" />
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <MaterialIcons name="image-not-supported" size={32} color="#E6E4F0" />
            <Text style={{ color: '#9E9AA7', fontSize: 13, marginTop: 8 }}>Horoscope available after interest accepted</Text>
          </View>
        )}
      </SectionCard>
    </View>
  );

  const renderProfessional = () => (
    <SectionCard icon="work" title="Job & Education">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <DetailField label="Education" value={education.Education} />
        <DetailField label="Employed In" value={education['Employing In']} />
        <DetailField label="Occupation" value={personal.Occupation} />
        <DetailField label="Annual Income" value={education['Annual Income']} />
      </View>
    </SectionCard>
  );

  const renderFamily = () => (
    <SectionCard icon="family-restroom" title="Family Details">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <DetailField label="Family Type" value={family['Family Type']} />
        <DetailField label="Family Status" value={family['Family Status']} />
        <DetailField label="Father's Name" value={family['Fathers Name']} />
        <DetailField label="Father's Occupation" value={family['Fathers Occupation']} />
        <DetailField label="Mother's Name" value={family['Mothers Name']} />
        <DetailField label="Mother's Occupation" value={family['Mothers Occupation']} />
        <DetailField label="Siblings" value={family['Number of Siblings']} />
        <DetailField label="Brothers" value={family.Brothers} />
        <DetailField label="Brothers Married" value={family['Brothers Married']} />
        <DetailField label="Sisters" value={family.Sisters} />
        <DetailField label="Sisters Married" value={family['Sisters Married']} />
      </View>
    </SectionCard>
  );

  return (
    <View style={{ marginTop: 14, gap: 0 }}>
      {renderPersonal()}
      {renderReligious()}
      {renderProfessional()}
      {renderFamily()}
    </View>
  );
};

// ─── Main Component ────────────────────────────────
const ProfileDetailRevamp = () => {
  const { userData } = useUserData();
  const popup = usePopup();
  const { subscriptionData } = useSubscription();
  const { userId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // ─── State ─────────────────────────────────────────
  const [userDetails, setUserDetails] = useState<any>(null);
  const [userDetailId, setUserDetailId] = useState<any>(null);
  const [personalDetail, setPersonalDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSender, setIsSender] = useState(false);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isPremiumValue, setIsPremiumValue] = useState(false);
  const [hiddenFeildsValue, setHiddenFeildsValue] = useState<any>([]);
  const [subscriptionId, setSubscriptionId] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [interestStatus, setInterestStatus] = useState('NONE');
  const [isParent, setIsParent] = useState(false);
  const [permissionRequests, setPermissionRequests] = useState<{ [key: string]: boolean }>({ profileImage: false });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const currentUserId = userData?.userId || null;
  const planTitle = subscriptionData?.planTitle;

  // ─── Effects ───────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('userRole').then(role => setIsParent(role === 'PARENT'));
  }, []);

  // Single parallel load — all API calls fire at once for <1.5s load
  useEffect(() => {
    if (!userId || !userData.userId) return;
    setUserDetailId(userId);
    setLoading(true);

    const loadAll = async () => {
      const userIdValue = userData.userId;
      const decodedId = (() => { try { return atob(userIdValue); } catch { return userIdValue; } })();

      const [profileRes, hiddenRes, requestsRes] = await Promise.allSettled([
        userApi.getProfileDetailWithIntractionStatus(userIdValue, userId),
        userApi.getHiddenFieldsByUserId(userId),
        userApi.getRequestsTo(decodedId, userId),
      ]);

      // Fire-and-forget: record profile view (don't block render)
      userApi.viewedProfile(userData.userId, userId).catch(() => {});

      // Process profile response
      if (profileRes.status === 'fulfilled') {
        const res = profileRes.value;
        if (res.data?.code === 403) {
          const msg = res.data?.message;
          if (msg === 'PROFILE_VIEW_LIMIT_EXCEEDED') {
            popup.premiumRequired('You\'ve reached your profile view limit. Upgrade for more views.', () => router.push('/(root)/screens/PremiumTab' as any));
          } else if (msg === 'PROFILE_VIEW_BLURRED') {
            popup.premiumRequired('Upgrade to Starter or above to view full profiles.', () => router.push('/(root)/screens/PremiumTab' as any));
          } else {
            popup.premiumRequired('Upgrade your plan to view this profile.', () => router.push('/(root)/screens/PremiumTab' as any));
          }
          router.back();
          return;
        }
        if (res.data?.data) {
          const { profile, interactionStatus } = res.data.data;
          setUserDetails(profile);
          setPersonalDetail(formatUserDetails(profile));
          setUserDetailId(profile.userId);
          if (interactionStatus) {
            setInterestStatus(interactionStatus.interest?.status || 'NONE');
            setIsLiked(interactionStatus.liked || false);
            setIsShortlisted(interactionStatus.shortlisted || false);
            setIsSender(interactionStatus.interest?.sentBy === 'VIEWER');
          }
          // Pre-populate gallery if available
          if (profile.galleryImages?.length) {
            setGalleryImages(profile.galleryImages.map((img: any) => typeof img === 'string' ? img : img.userImage));
          }
        }
      }

      // Process hidden fields
      if (hiddenRes.status === 'fulfilled' && hiddenRes.value?.data?.data?.length > 0) {
        setHiddenFeildsValue(hiddenRes.value.data.data.map((i: any) => i.fieldName));
      }

      // Process permission requests
      if (requestsRes.status === 'fulfilled' && requestsRes.value?.data?.data) {
        const data = requestsRes.value.data.data;
        const requests = Array.isArray(data) ? data : [data];
        const existing = requests.filter((r: any) => r?.fieldType).map((r: any) => r.fieldType);
        setPermissionRequests(prev => ({ ...prev, profileImage: existing.includes('PROFILE_IMAGE') }));
      }

      // Premium check from context, with fallback API call
      if (subscriptionData?.entitlements) {
        setSubscriptionId(subscriptionData.subscriptionId);
        setIsPremiumValue(!!subscriptionData.entitlements.viewPersonalInfo);
      } else if (userData.decodedUserId) {
        try {
          const sub = await userApi.getActiveUserSubscriptionByUserId(userData.decodedUserId);
          if (sub.data?.code === 200 && sub.data?.data) {
            setSubscriptionId(sub.data.data.subscriptionId || sub.data.data.id);
            setIsPremiumValue(!!sub.data.data.entitlements?.viewPersonalInfo);
          }
        } catch {}
      }

      setLoading(false);
    };

    loadAll();
  }, [userId, userData.userId]);

  // Update premium when subscription context changes
  useEffect(() => {
    if (subscriptionData?.entitlements) {
      setSubscriptionId(subscriptionData.subscriptionId);
      setIsPremiumValue(!!subscriptionData.entitlements.viewPersonalInfo);
    }
  }, [subscriptionData]);

  // All data loading is done in the single parallel useEffect above
  // No separate fetch functions needed

  // ─── Format ────────────────────────────────────────
  const formatUserDetails = (data: any) => {
    if (!data || !data.userDetail || data.userDetail.length === 0) return [];
    const detail = data.userDetail[0];
    const basicInfo = JSON.parse(detail.basicInfo || '{}');
    const astroArr = JSON.parse(detail.astronomicInfo || '[]');
    const familyRaw = JSON.parse(detail.familyInfo || '{}');
    const astro = astroArr[0] || {};
    const family = Array.isArray(familyRaw) ? (familyRaw[0] || {}) : (familyRaw || {});

    return [
      {
        section: "PersonalDetail",
        data: {
          Name: `${data.firstName} ${data.lastName}`,
          Gender: data.gender == 'M' ? 'Male' : 'Female',
          Occupation: detail.occupation,
          "Date of Birth": data.dob,
          'Mobile Number': data.mobile,
          Height: detail.height + "f.t",
          Weight: detail.weight,
          "Physical Status": basicInfo.physical_status,
          "Marital Status": basicInfo.marital_status,
          "Mother Language": detail.languages || "Not specified",
        },
      },
      {
        section: "ReligiousDetail",
        data: {
          Religion: "Hindu",
          Caste: "SC",
          Star: astro.star,
          Moonsign: astro.moon_sign,
          Dosham: astro.dosham,
          Horoscope: detail.horoscope
        },
      },
      {
        section: "EducationalDetail",
        data: {
          Education: detail.degree,
          "Employing In": detail.employedAt,
          "Annual Income": detail.annualIncome + "",
        },
      },
      {
        section: "FamilyDetail",
        data: {
          "Family Type": family.family_type || family.familyType || "-",
          "Family Status": family.family_status || "-",
          "Fathers Name": family.father || "-",
          "Fathers Occupation": family.father_occupation || "-",
          "Mothers Name": family.mother || "-",
          "Mothers Occupation": family.mother_occupation || "-",
          "Number of Siblings": (() => { const s = parseInt(family.no_of_sister) || 0; const b = parseInt(family.no_of_brother) || 0; return (s + b) > 0 ? String(s + b) : "-"; })(),
          "Brothers": String(parseInt(family.no_of_brother) || 0) || "-",
          "Brothers Married": (() => { const bm = parseInt(family.brother_married) || 0; const b = parseInt(family.no_of_brother) || 0; return b === 0 ? "-" : `${bm} of ${b}`; })(),
          "Sisters": String(parseInt(family.no_of_sister) || 0) || "-",
          "Sisters Married": (() => { const sm = parseInt(family.sister_married) || 0; const s = parseInt(family.no_of_sister) || 0; return s === 0 ? "-" : `${sm} of ${s}`; })(),
        },
      },
      {
        section: "InterestsDetail",
        data: (() => {
          try {
            const h = detail?.hobbies;
            const hobbies = typeof h === 'string' ? JSON.parse(h) : Array.isArray(h) ? h : [];
            return { _hobbies: hobbies };
          } catch { return { _hobbies: [] }; }
        })(),
      }
    ];
  };

  // ─── Handlers ────────────────────────────────��─────
  const handlePermissionRequest = async () => {
    if (!userData.userId || !userId) return;
    const decodedId = (() => { try { return atob(userData.userId); } catch { return userData.userId; } })();
    try {
      if (permissionRequests.profileImage) {
        await userApi.deleteRequest(decodedId, userId, 'PROFILE_IMAGE');
        setPermissionRequests(prev => ({ ...prev, profileImage: false }));
        popup.success('Cancelled', 'Permission request cancelled.');
      } else {
        await userApi.sendRestrictedFieldRequest(decodedId, userId, 'PROFILE_IMAGE');
        setPermissionRequests(prev => ({ ...prev, profileImage: true }));
        popup.success('Sent', 'Permission request sent to view profile photo.');
      }
    } catch (e) {
      popup.error('Error', 'Failed to process request.');
    }
  };

  const openImageModal = async () => {
    setCurrentImageIndex(0);
    if (!planTitle || planTitle === 'Free') {
      popup.premiumRequired('Upgrade to Starter or above to view all profile photos.', () => router.push('/(root)/screens/PremiumTab' as any));
      return;
    }
    try {
      const encodeId = btoa(userDetailId);
      const res = await userApi.getUserGalleryImages(encodeId);
      if (res?.data?.data?.length > 0) {
        setGalleryImages(res.data.data.map((img: any) => img.userImage));
      } else if (userDetails?.profileImage) {
        setGalleryImages([userDetails.profileImage]);
      }
      setImageModalVisible(true);
    } catch (e) {
      setGalleryImages([userDetails?.profileImage]);
      setImageModalVisible(true);
    }
  };

  const handleLike = async () => {
    if (!currentUserId || !userId) return;
    const parsedUserId = Array.isArray(userId) ? userId[0] : userId;
    if (isLiked) {
      popup.confirm('Revert Like', 'Are you sure you want to revert this like?', async () => {
        try { await userApi.deleteLike(currentUserId, parsedUserId); setIsLiked(false); } catch (e) { }
      }, 'Yes', 'No');
    } else {
      try { await userApi.createUserLike({ likedBy: currentUserId, likedTo: parsedUserId }); setIsLiked(true); } catch (e) { }
    }
  };

  const handleShortlist = async () => {
    if (!currentUserId || !userId) return;
    const storedUserId = userData.userId;
    if (!storedUserId) return;

    let decodedUserId = '';
    try { decodedUserId = atob(storedUserId); } catch { return; }

    if (!subscriptionData?.entitlements?.shortlist) {
      popup.premiumRequired('Upgrade to Starter or above to shortlist profiles.', () => router.push('/(root)/screens/PremiumTab' as any));
      return;
    }

    popup.confirm(
      isShortlisted ? 'Unshortlist Profile' : 'Shortlist Profile',
      isShortlisted ? 'Remove this profile from your shortlist?' : 'Add this profile to your shortlist?',
      async () => {
        try {
          if (isShortlisted) {
            await userApi.deleteShortlistedProfileByUsers(btoa(decodedUserId), userId);
            popup.success('Unshortlisted', 'Profile removed from your shortlist.');
            setIsShortlisted(false);
          } else {
            await userApi.insertShortlistedProfile({ shortlistedBy: decodedUserId, shortlistedUserId: userId });
            popup.success('Shortlisted', 'Profile added to your shortlist.');
            setIsShortlisted(true);
          }
        } catch (e) { popup.error('Error', 'Failed to process shortlist request.'); }
      }
    );
  };

  const handleSendInterest = async () => {
    if (isParent) { popup.error('Not allowed', 'Family logins cannot send interest requests.'); return; }
    if (!currentUserId || !userId) return;
    const parsedUserId = Array.isArray(userId) ? userId[0] : userId;
    const canSend = interestStatus === 'NONE' || interestStatus === '' || interestStatus === null;
    if (!canSend) {
      if (interestStatus === 'APPROVED') {
        // Navigate to chat
        router.push({ pathname: '/(root)/screens/chatscreen', params: { conversationId: '', otherUserId: String(userId), profileImage: userDetails?.profileImage || '' } });
      }
      return;
    }

    try {
      const uid = userData.userId;
      if (!uid) return;
      const quotaRes = await userApi.getRequestQuota(uid);
      const quota = quotaRes.data?.data;

      if (quota?.unlimited) {
        await userApi.sendInterestRequest(currentUserId, parsedUserId);
        setInterestStatus('PENDING');
        setIsSender(true);
      } else if (quota?.remaining > 0) {
        let subId = subscriptionData?.subscriptionId;
        if (!subId) {
          const subRes = await userApi.getActiveUserSubscriptionByUserId(atob(uid));
          subId = subRes.data?.data?.subscriptionId || subRes.data?.data?.id;
        }
        if (subId) {
          const updateRes = await userApi.updateSendRequestCount(atob(uid), subId, 4);
          if (updateRes.data.code == 200) {
            await userApi.sendInterestRequest(currentUserId, parsedUserId);
            setInterestStatus('PENDING');
            setIsSender(true);
          } else {
            popup.premiumRequired('You have used all your requests. Upgrade to send more.', () => router.push('/(root)/screens/PremiumTab'));
          }
        } else {
          // Fallback: send without quota tracking
          await userApi.sendInterestRequest(currentUserId, parsedUserId);
          setInterestStatus('PENDING');
          setIsSender(true);
        }
      } else {
        popup.premiumRequired(`You have used all ${quota?.total || 0} requests. Upgrade to send more.`, () => router.push('/(root)/screens/PremiumTab'));
      }
    } catch (e) {
      popup.error('Request Failed', 'Please try again.');
    }
  };

  const handleWhatsAppShare = () => {
    const isGoldPlus = planTitle === 'Gold' || planTitle === 'Platinum';
    if (!isGoldPlus) {
      popup.premiumRequired('Upgrade to Gold or above to share profiles via WhatsApp.', () => router.push('/(root)/screens/PremiumTab' as any));
      return;
    }
    const name = `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim();
    const profileLink = `https://vaibhavvivaaha.com/profile/${btoa(String(userDetails?.userId || ''))}`;
    const text = `I found a matching profile for you on Vaibhav Vivaaha! 💍\n\n👤 ${name}\n📍 ${userDetails?.location || ''} | 🎂 ${userDetails?.age || ''} years\n\nView full profile:\n${profileLink}\n\nDownload Vaibhav Vivaaha app to connect!\nhttps://vaibhavvivaaha.com/download`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => {
      popup.error('WhatsApp not installed', 'Install WhatsApp to share this profile.');
    });
  };

  const handleRequestCall = async () => {
    if (isParent) { popup.error('Not allowed', 'Family logins cannot request calls.'); return; }
    const isPaid = planTitle && planTitle !== 'Free' && planTitle !== 'Starter';
    if (!isPaid) {
      popup.premiumRequired('Upgrade to Classic or above to request a voice call.', () => router.push('/(root)/screens/PremiumTab' as any));
      return;
    }
    try {
      if (!userData.userId) return;
      const targetId = userId ? Number(userId) : undefined;
      const res = await userApi.createServiceRequest(userData.userId, 'VOICE_CALL', `Voice call request for ${userDetails?.firstName || 'member'}`, targetId);
      if (res.data.code === 200) popup.success('Request submitted', 'Our team will reach out shortly.');
      else if (res.data.code === 409) popup.info('Already requested', 'You already have a pending voice-call request.');
      else if (res.data.code === 403) popup.premiumRequired('Upgrade to Silver or above.', () => router.push('/(root)/screens/PremiumTab' as any));
      else popup.error('Request failed', res.data.message || 'Please try again.');
    } catch (e: any) {
      const code = e?.response?.data?.code;
      if (code === 409) popup.info('Already requested', 'Pending request exists.');
      else if (code === 403) popup.premiumRequired('Upgrade required.', () => router.push('/(root)/screens/PremiumTab' as any));
      else popup.error('Request failed', 'Network error.');
    }
  };

  const handleStarMatch = () => {
    if (!isPremiumValue) {
      popup.premiumRequired('Star Match is a premium feature. Upgrade to discover horoscope compatibility.', () => router.push('/(root)/screens/PremiumTab'));
      return;
    }
    const detail = userDetails?.userDetail?.[0];
    let viewedStar = '', viewedRasi = '', viewedPlace = '', viewedDob = userDetails?.dob || '';
    if (detail) {
      try { const a = JSON.parse(detail.astronomicInfo || '[]'); viewedStar = a[0]?.star || ''; viewedRasi = a[0]?.moon_sign || ''; } catch { }
      try { viewedPlace = JSON.parse(detail.basicInfo || '{}').place_of_birth || ''; } catch { }
    }
    router.push({
      pathname: '/(root)/screens/StarMatch',
      params: { viewedProfile: JSON.stringify({ name: `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim(), gender: userDetails?.gender || '', dob: viewedDob, star: viewedStar, rasi: viewedRasi, place: viewedPlace }), viewedUserId: userId as string }
    });
  };

  // ─── Derived values ────────────────────────────────
  const profileImage = userDetails?.profileImage;
  const isFree = !planTitle || planTitle === 'Free';
  const isVerifiedPlan = ['Silver', 'Gold', 'Platinum'].includes(userDetails?.subscriptionTitle || '');
  const anyVerified = userDetails?.idVerified || userDetails?.educationVerified || userDetails?.incomeVerified;
  const occupation = userDetails?.userDetail?.[0]?.occupation || '';

  const interestButtonConfig = (() => {
    switch (interestStatus) {
      case 'PENDING': return { label: isSender ? 'Request Pending' : 'Accept Request', icon: 'access-time', bg: '#6D6A85', disabled: isSender };
      case 'APPROVED': return { label: 'Chat Now', icon: 'chat', bg: '#10b981', disabled: false };
      default: return { label: 'Send Interest', icon: 'send', bg: '#1F7FE5', disabled: false };
    }
  })();

  // ─── Loading ───────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        {/* Skeleton shimmer */}
        <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT, backgroundColor: '#E6E4F0' }}>
          {/* Pulsing overlay */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#ddd', opacity: 0.6 }]} />
        </View>
        <View style={[s.profileCard, { marginTop: -40 }]}>
          {/* Name skeleton */}
          <View style={{ width: 180, height: 28, backgroundColor: '#E6E4F0', borderRadius: 8, marginBottom: 8 }} />
          <View style={{ width: 220, height: 16, backgroundColor: '#E6E4F0', borderRadius: 6, marginBottom: 6 }} />
          <View style={{ width: 140, height: 16, backgroundColor: '#E6E4F0', borderRadius: 6, marginBottom: 16 }} />
          {/* Badge skeletons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ width: 100, height: 26, backgroundColor: '#F1EFFF', borderRadius: 13 }} />
            <View style={{ width: 100, height: 26, backgroundColor: '#F1EFFF', borderRadius: 13 }} />
          </View>
          {/* Button skeletons */}
          <View style={{ marginTop: 14, gap: 8 }}>
            <View style={{ height: 52, backgroundColor: '#E6E4F0', borderRadius: 16 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, height: 48, backgroundColor: '#E6E4F0', borderRadius: 16 }} />
              <View style={{ flex: 1, height: 48, backgroundColor: '#E6E4F0', borderRadius: 16 }} />
            </View>
          </View>
          {/* Tab skeleton */}
          <View style={{ marginTop: 24, height: 44, backgroundColor: '#F1EFFF', borderRadius: 22 }} />
          {/* Content skeleton */}
          <View style={{ marginTop: 16, gap: 12 }}>
            <View style={{ height: 180, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#E6E4F0' }} />
            <View style={{ height: 120, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#E6E4F0' }} />
          </View>
        </View>
      </View>
    );
  }

  // ─── Render ────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Image Gallery Modal */}
      <Modal visible={isImageModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <TouchableOpacity style={[s.modalClose, { top: insets.top + 10 }]} onPress={() => setImageModalVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={galleryImages?.length ? galleryImages : [profileImage]}
            keyExtractor={(_, i) => i.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={{ uri: item }} style={s.modalImage} resizeMode="contain" />
              </View>
            )}
          />
          {/* Dot indicators */}
          {galleryImages.length > 1 && (
            <View style={s.dotRow}>
              {galleryImages.map((_, i) => (
                <View key={i} style={[s.dot, currentImageIndex === i && s.dotActive]} />
              ))}
            </View>
          )}
        </View>
      </Modal>

      <ScrollView style={s.root} bounces={false} showsVerticalScrollIndicator={false}>
        {/* ─── Hero Image ─── */}
        <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}>
          {hiddenFeildsValue.includes('profileImage') ? (
            /* Hidden by profile owner — ask permission */
            <View style={{ flex: 1 }}>
              <Image
                source={profileImage ? { uri: profileImage } : require('../../../assets/images/defaultAvatar.png')}
                style={StyleSheet.absoluteFillObject}
                blurRadius={30}
              />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }]}>
                <Ionicons name="eye-off" size={40} color="rgba(255,255,255,0.8)" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 10, textAlign: 'center' }}>User has restricted their profile photo</Text>
                <TouchableOpacity
                  onPress={handlePermissionRequest}
                  style={{ marginTop: 14, backgroundColor: permissionRequests.profileImage ? '#EF4444' : '#1F7FE5', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                    {permissionRequests.profileImage ? 'Cancel Request' : 'Ask Permission'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : isFree && profileImage ? (
            /* Free plan blur */
            <View style={{ flex: 1 }}>
              <Image source={{ uri: profileImage }} style={StyleSheet.absoluteFillObject} blurRadius={25} />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="lock-closed" size={40} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 10 }}>Upgrade to view photos</Text>
                <TouchableOpacity onPress={() => router.push('/(root)/screens/PremiumTab' as any)} style={{ marginTop: 12, backgroundColor: '#1F7FE5', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Upgrade Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Image
              source={profileImage ? { uri: profileImage } :
                userDetails?.gender === 'M' ? require('../../../assets/images/avatarMen.png') :
                  userDetails?.gender === 'F' ? require('../../../assets/images/avatarWomen.png') :
                    require('../../../assets/images/defaultAvatar.png')}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          )}

          {/* Gradient overlay at bottom */}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={[StyleSheet.absoluteFillObject, { top: '50%' }]} />

          {/* Verified compact badge on image */}
          {(anyVerified || isVerifiedPlan) && (
            <View style={{ position: 'absolute', top: insets.top + 56, right: 16, zIndex: 20 }}>
              <VerifiedBadges
                idVerified={userDetails?.idVerified}
                educationVerified={userDetails?.educationVerified}
                incomeVerified={userDetails?.incomeVerified}
                mode="compact" color="gold"
              />
            </View>
          )}

          {/* Action buttons — right side */}
          <View style={[s.sideActions, { bottom: 60 }]}>
            <TouchableOpacity style={[s.sideBtn, { backgroundColor: '#FF6B6B' }]} onPress={handleLike}>
              <Heart size={22} color="#fff" fill={isLiked ? '#fff' : 'none'} />
            </TouchableOpacity>
            <TouchableOpacity style={s.sideBtn} onPress={handleShortlist}>
              {isShortlisted ? <BookmarkCheck size={22} color="#1F7FE5" /> : <Bookmark size={22} color="#0f1724" />}
            </TouchableOpacity>
            <TouchableOpacity style={[s.sideBtn, { backgroundColor: 'rgba(255,255,255,0.8)' }]} onPress={openImageModal}>
              <Maximize2 size={20} color="#0f1724" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Floating header buttons ─── */}
        <View style={[s.headerRow, { top: 8 }]}>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn}>
            <MoreVertical size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ─── Profile Card (overlaps image) ─── */}
        <View style={s.profileCard}>
          {/* Verified tag above name */}
          {(anyVerified || isVerifiedPlan) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <MaterialIcons name="verified" size={14} color="#1F7FE5" />
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#1F7FE5', textTransform: 'uppercase', letterSpacing: 0.8 }}>Verified Profile</Text>
            </View>
          )}
          {/* Name */}
          <View style={{ marginBottom: 4 }}>
            <Text style={s.nameText}>{userDetails?.firstName} {userDetails?.lastName}</Text>
          </View>

          {/* Age, Height, Location */}
          <Text style={s.subText}>
            {userDetails?.age} Yrs, {userDetails?.userDetail?.[0]?.height || ''} • {userDetails?.location || ''}
          </Text>

          {/* Occupation */}
          <Text style={s.occupationText}>{occupation}</Text>

          {/* Verification badges */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {userDetails?.idVerified && (
              <View style={s.badge}><MaterialIcons name="badge" size={13} color="#1F7FE5" /><Text style={s.badgeText}>ID Confirmed</Text></View>
            )}
            {userDetails?.educationVerified && (
              <View style={s.badge}><MaterialIcons name="school" size={13} color="#1F7FE5" /><Text style={s.badgeText}>Edu Confirmed</Text></View>
            )}
            {userDetails?.incomeVerified && (
              <View style={s.badge}><MaterialIcons name="payments" size={13} color="#1F7FE5" /><Text style={s.badgeText}>Income Confirmed</Text></View>
            )}
          </View>

          {/* ─── Action Buttons ─── */}
          <View style={{ marginTop: 14, gap: 8 }}>
            {/* Send Interest / Pending / Chat Now — full width */}
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: interestButtonConfig.bg }]}
              onPress={handleSendInterest}
              disabled={interestButtonConfig.disabled}
              activeOpacity={0.85}
            >
              <MaterialIcons name={interestButtonConfig.icon} size={20} color="#fff" />
              <Text style={s.primaryBtnText}>{interestButtonConfig.label}</Text>
            </TouchableOpacity>

            {/* Call + Match side by side */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {!isParent && (
                <TouchableOpacity style={s.secondaryBtn} onPress={handleRequestCall} activeOpacity={0.8}>
                  <Phone size={18} color="#1F7FE5" />
                  <Text style={s.secondaryBtnText}>Request Call</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.secondaryBtn} onPress={handleStarMatch} activeOpacity={0.8}>
                <Star size={18} color="#1F7FE5" />
                <Text style={s.secondaryBtnText}>Match Score</Text>
              </TouchableOpacity>
            </View>

            {/* WhatsApp Share */}
            {!isParent && (
              <TouchableOpacity style={s.shareBtn} onPress={handleWhatsAppShare} activeOpacity={0.8}>
                <Share2 size={16} color="#6D6A85" />
                <Text style={s.shareBtnText}>Share Profile via WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ─── Inline Tabs (matching HTML design) ─── */}
          {personalDetail && <InlineProfileTabs
            personalDetail={personalDetail}
            isPremium={isPremiumValue}
            hiddenFields={hiddenFeildsValue}
            profileDetailId={String(userDetailId || '')}
            currentUserId={currentUserId || ''}
          />}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },

  // Header — glassmorphism floating buttons
  headerRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 50 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', shadowColor: 'rgba(15,35,70,0.06)', shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 3 },

  // Side action FABs
  sideActions: { position: 'absolute', right: 16, gap: 10 },
  sideBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: 'rgba(15,35,70,0.08)', shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5 },

  // Profile card — soft overlap
  profileCard: { marginTop: -36, backgroundColor: '#f1f5f9', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 60, shadowColor: 'rgba(15,35,70,0.06)', shadowOpacity: 1, shadowRadius: 24, shadowOffset: { width: 0, height: -8 } },

  // Typography
  nameText: { fontSize: 20, fontWeight: '800', color: '#0f1724', letterSpacing: -0.5 },
  subText: { fontSize: 12.5, color: '#475569', marginTop: 2, fontWeight: '500', letterSpacing: -0.2 },
  occupationText: { fontSize: 12.5, color: '#1F7FE5', fontWeight: '600', marginTop: 3, letterSpacing: -0.1 },

  // Verification badges
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#dfecfb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  badgeText: { fontSize: 9.5, fontWeight: '600', color: '#1862b8' },

  // Primary CTA
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, shadowColor: 'rgba(31,127,229,0.25)', shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  primaryBtnText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },

  // Secondary buttons
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  secondaryBtnText: { color: '#1F7FE5', fontSize: 12.5, fontWeight: '700' },

  // Share button
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 12, backgroundColor: '#f6f8fa' },
  shareBtnText: { color: '#475569', fontSize: 11.5, fontWeight: '500' },

  // Image gallery modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,10,15,0.97)', justifyContent: 'center' },
  modalClose: { position: 'absolute', right: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 40 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: '#1F7FE5', width: 20, borderRadius: 3 },
});

export default ProfileDetailRevamp;