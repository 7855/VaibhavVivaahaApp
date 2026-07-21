import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  Modal, FlatList, Dimensions, Linking, StatusBar, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import VerifiedBadges from '@/components/VerifiedBadges';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '@/app/(root)/api/userApi';
import { Heart, Share2, Phone, Star, ChevronLeft, MoreVertical, Maximize2, Bookmark, BookmarkCheck, ShieldAlert, Flag, Clock } from 'lucide-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { buildUpgradeAction } from '../utils/upgradeNavigation';
import { LinearGradient } from 'expo-linear-gradient';
import { REPORT_REASONS } from '@/constants/data';

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
      <Text style={{ fontSize: 10, fontFamily: 'Rubik-Medium', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 13.5, fontFamily: 'Rubik-Medium', color: '#0f1724', letterSpacing: -0.2, lineHeight: 18 }}>{value}</Text>
    </View>
  );
};

const SectionCard = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
  <View style={{ backgroundColor: '#fff', padding: 14, borderRadius: 18, marginBottom: 8, shadowColor: 'rgba(15,35,70,0.08)', shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#dfecfb', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialIcons name={icon} size={16} color="#1F7FE5" />
      </View>
      <Text style={{ fontSize: 13.5, fontFamily: 'Rubik-Bold', color: '#0f1724', letterSpacing: -0.2 }}>{title}</Text>
    </View>
    {children}
  </View>
);

const PremiumLock = ({ message, planTitle, featureName }: { message: string; planTitle?: string; featureName?: string }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={buildUpgradeAction({ planTitle, featureName: featureName || 'this feature' })} style={{ backgroundColor: '#fffbeb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#fde68a' }}>
    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' }}>
      <MaterialIcons name="lock" size={14} color="#d97706" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, fontFamily: 'Rubik-Bold', color: '#92400e' }}>Premium Only</Text>
      <Text style={{ fontSize: 10, color: '#b45309' }}>{message}</Text>
    </View>
    <MaterialIcons name="chevron-right" size={18} color="#d97706" />
  </TouchableOpacity>
);

const RestrictedField = ({ fieldType, profileDetailId, currentUserId, initialRequested = false }: { fieldType: string; profileDetailId: string; currentUserId: string; initialRequested?: boolean }) => {
  const [requested, setRequested] = useState(initialRequested);
  // Parent only knows the true server state once its own fetch resolves (after this component's
  // first render), so sync up when that arrives instead of only reading it once at mount.
  useEffect(() => {
    setRequested(initialRequested);
  }, [initialRequested]);
  const popup = usePopup();
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
        } catch (e) {
          popup.error('Error', 'Failed to process request. Please try again.');
        }
      }}
      style={{ backgroundColor: '#fff7ed', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#fed7aa' }}
    >
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialIcons name={requested ? 'hourglass-top' : 'lock'} size={14} color="#c2410c" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Rubik-Bold', color: '#9a3412' }}>{fieldLabel} Hidden</Text>
        <Text style={{ fontSize: 10, color: '#c2410c' }}>{requested ? 'Permission requested' : 'Tap to request access'}</Text>
      </View>
      <MaterialIcons name={requested ? 'close' : 'chevron-right'} size={18} color="#c2410c" />
    </TouchableOpacity>
  );
};

const InlineProfileTabs = ({ personalDetail, isPremium, hiddenFields = [], profileDetailId = '', currentUserId = '', planTitle = '', interestStatus = '', permissionRequests = {}, approvedFields = [] }: {
  personalDetail: any[]; isPremium: boolean; hiddenFields?: string[]; profileDetailId?: string; currentUserId?: string; planTitle?: string; interestStatus?: string; permissionRequests?: { [key: string]: boolean }; approvedFields?: string[];
}) => {
  const personal = personalDetail?.[0]?.data || {};
  const religious = personalDetail?.[1]?.data || {};
  const education = personalDetail?.[2]?.data || {};
  const family = personalDetail?.[3]?.data || {};
  const interests = personalDetail?.[4]?.data?._hobbies || [];

  const popup = usePopup();
  const [revealedMobile, setRevealedMobile] = useState<string | null>(null);
  const [revealQuota, setRevealQuota] = useState<{ remaining: number; total: number } | null>(null);
  const [revealing, setRevealing] = useState(false);
  // One combined reveal now covers both Contact and Horoscope — clicking either button spends
  // the same contact-reveal quota tap and shows whichever of the two the viewer is eligible for.
  // Horoscope eligibility is unchanged from before (plan must have HOROSCOPE_VIEW AND the interest
  // between the two users must be APPROVED) — revealing contact doesn't bypass that, it just
  // surfaces both together instead of horoscope only ever appearing passively on its own.
  const [revealedHoroscope, setRevealedHoroscope] = useState<string | null>(null);
  const [horoscopeEligible, setHoroscopeEligible] = useState<boolean | null>(null);

  // Classic gets a limited number of contact reveals (see VIEW_PERSONAL_INFO plan_features
  // row — a numeric quota, not "enabled" like Silver+), so it needs an explicit action here
  // rather than the flat upgrade wall Free/Starter see.
  const handleRevealContact = async () => {
    if (!currentUserId || !profileDetailId || revealing) return;
    setRevealing(true);
    try {
      const res = await userApi.revealContact(currentUserId, profileDetailId);
      if (res.data?.code === 200) {
        setRevealedMobile(res.data.data.mobile);
        if (!res.data.data.unlimited) {
          setRevealQuota({ remaining: res.data.data.remaining, total: res.data.data.total });
        }
        setHoroscopeEligible(!!res.data.data.horoscopeEligible);
        if (res.data.data.horoscopeEligible) {
          setRevealedHoroscope(res.data.data.horoscope || null);
        } else {
          popup.success('Contact revealed', 'Horoscope will unlock once your interest with this profile is accepted.');
        }
      } else if (res.data?.message === 'CONTACT_VIEW_LIMIT_EXCEEDED') {
        popup.premiumRequired(
          "You've used all your contact reveals for this plan. Upgrade to Silver for unlimited access.",
          buildUpgradeAction({ planTitle, featureName: 'Contact Reveal', minPlan: 'Silver' })
        );
      } else if (res.data?.code === 403) {
        popup.premiumRequired('Upgrade your plan to view contact details.', buildUpgradeAction({ planTitle, featureName: 'Contact Reveal' }));
      } else {
        popup.error('Error', res.data?.message || 'Could not reveal contact.');
      }
    } catch (e) {
      popup.error('Error', 'Could not reveal contact. Please try again.');
    } finally {
      setRevealing(false);
    }
  };

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
        {hiddenFields.includes('mobileNumber') && !approvedFields.includes('MOBILE') ? (
          <RestrictedField fieldType="MOBILE" profileDetailId={profileDetailId} currentUserId={currentUserId} initialRequested={permissionRequests.mobile} />
        ) : (personal['Mobile Number'] && personal['Mobile Number'] !== 'null') || revealedMobile ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#dfecfb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(31,127,229,0.15)' }}>
            <View>
              <Text style={{ fontSize: 10, fontFamily: 'Rubik-Medium', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 }}>Mobile</Text>
              <Text style={{ fontSize: 15, fontFamily: 'Rubik-Medium', color: '#1862b8', marginTop: 2 }}>{revealedMobile || personal['Mobile Number']}</Text>
              {revealQuota && (
                <Text style={{ fontSize: 11, fontFamily: 'Rubik-Regular', color: '#64748b', marginTop: 2 }}>
                  {revealQuota.remaining} of {revealQuota.total} contact reveals left
                </Text>
              )}
            </View>
            <MaterialIcons name="phone" size={20} color="#1F7FE5" />
          </View>
        ) : planTitle === 'Classic' ? (
          <TouchableOpacity
            onPress={handleRevealContact}
            disabled={revealing}
            activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dfecfb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(31,127,229,0.2)' }}
          >
            <MaterialIcons name="visibility" size={18} color="#1F7FE5" />
            <Text style={{ fontSize: 13, fontFamily: 'Rubik-Bold', color: '#1F7FE5' }}>
              {revealing ? 'Revealing…' : 'Reveal Contact & Horoscope'}
            </Text>
          </TouchableOpacity>
        ) : planTitle === 'Starter' ? (
          <PremiumLock message="Want to see their contact info? Upgrade to Classic" planTitle={planTitle} featureName="Contact Reveal" />
        ) : (
          <PremiumLock message="Upgrade to view contact details" planTitle={planTitle} featureName="Contact Reveal" />
        )}
      </SectionCard>
      {interests.length > 0 && (
        <SectionCard icon="interests" title="Interests & Hobbies">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {interests.map((hobby: string, i: number) => (
              <View key={i} style={{ backgroundColor: '#f6f8fa', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Rubik-Medium', color: '#1e293b' }}>
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
        {hiddenFields.includes('horoscope') && !approvedFields.includes('HOROSCOPE') ? (
          <RestrictedField fieldType="HOROSCOPE" profileDetailId={profileDetailId} currentUserId={currentUserId} initialRequested={permissionRequests.horoscope} />
        ) : revealedHoroscope ? (
          <Image source={{ uri: revealedHoroscope }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="contain" />
        ) : religious.Horoscope && religious.Horoscope !== 'null' ? (
          <Image source={{ uri: religious.Horoscope }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="contain" />
        ) : planTitle === 'Classic' && horoscopeEligible === null ? (
          // Same combined reveal as Contact — one tap unlocks whichever of the two the viewer
          // is eligible for. Only shown pre-attempt (horoscopeEligible === null); once a reveal
          // has actually run, horoscopeEligible becomes true or false and the branches below take
          // over instead — otherwise "eligible but this profile has no horoscope uploaded" kept
          // re-showing this same button forever, inviting endless pointless re-taps.
          <TouchableOpacity
            onPress={handleRevealContact}
            disabled={revealing}
            activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dfecfb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(31,127,229,0.2)' }}
          >
            <MaterialIcons name="visibility" size={18} color="#1F7FE5" />
            <Text style={{ fontSize: 13, fontFamily: 'Rubik-Bold', color: '#1F7FE5' }}>
              {revealing ? 'Revealing…' : 'Reveal Contact & Horoscope'}
            </Text>
          </TouchableOpacity>
        ) : !isPremium ? (
          <PremiumLock message="Upgrade to view horoscope" planTitle={planTitle} featureName="Horoscope" />
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <MaterialIcons name="image-not-supported" size={32} color="#E6E4F0" />
            <Text style={{ color: '#9E9AA7', fontSize: 13, marginTop: 8 }}>
              {interestStatus === 'APPROVED'
                ? "This member hasn't added their horoscope yet"
                : 'Horoscope available after interest accepted'}
            </Text>
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
  // Fields the OWNER has approved specifically for the current viewer — separate from
  // hiddenFeildsValue, which only reflects the owner's OWN blanket privacy toggle. Approving a
  // RestrictedFieldRequest never actually unlocked anything before this: the blur/lock views only
  // ever checked hiddenFeildsValue, with zero awareness of any per-viewer approval, so an
  // approved request updated its status in the DB and notified the requester but the requester's
  // own profile view stayed blurred/locked forever.
  const [approvedFields, setApprovedFields] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  // Defaults to true — reporting a whole profile is a decisive action where blocking too is the
  // expected default, but the admin/user can still uncheck it. Previously this was forced/silent.
  const [reportAlsoBlock, setReportAlsoBlock] = useState(true);
  // Persists the "already sent" state across remounts (e.g. leaving and reopening this profile),
  // same pattern as interestStatus/permissionRequests below — checked once against this specific
  // target user's pending VOICE_CALL rows rather than relying only on the in-session toast.
  const [callRequestSent, setCallRequestSent] = useState(false);

  const currentUserId = userData?.userId || null;
  const planTitle = subscriptionData?.planTitle;

  // ─── Effects ───────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('userRole').then(role => setIsParent(role === 'PARENT'));
  }, []);

  useEffect(() => {
    if (!userId || !userData.userId) return;
    userApi.getMyServiceRequests(userData.userId, 0, 50)
      .then((res) => {
        const rows = res?.data?.data || [];
        const alreadyPending = rows.some((r: any) =>
          r.requestType === 'VOICE_CALL' && r.status === 'PENDING' && String(r.targetUserId) === String(userId)
        );
        if (alreadyPending) setCallRequestSent(true);
      })
      .catch(() => {});
  }, [userId, userData.userId]);

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
          if (msg === 'USER_BLOCKED') {
            popup.error('Blocked', 'This profile is not accessible.');
          } else if (msg === 'PROFILE_VIEW_LIMIT_EXCEEDED') {
            popup.premiumRequired('You\'ve reached your profile view limit. Upgrade for more views.', buildUpgradeAction({ planTitle, featureName: 'Profile Views' }));
          } else if (msg === 'PROFILE_VIEW_BLURRED') {
            popup.premiumRequired('Upgrade to Starter or above to view full profiles.', buildUpgradeAction({ planTitle, featureName: 'Full Profile View', minPlan: 'Starter' }));
          } else {
            popup.premiumRequired('Upgrade your plan to view this profile.', buildUpgradeAction({ planTitle, featureName: 'View Profile' }));
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

      // Process permission requests — profileImage, mobile and horoscope all read from the same
      // fetch. RestrictedField (mobile/horoscope) used to track its "already requested?" state
      // purely locally, starting at false on every mount with no check against what's actually
      // on the server — so navigating away and back (or a fresh screen load) always showed "Tap
      // to request access" again even when a request was already pending, and re-tapping it then
      // hit the backend's "Request already exists" 400 (silently swallowed by RestrictedField's
      // empty catch block, so nothing visibly happened).
      if (requestsRes.status === 'fulfilled' && requestsRes.value?.data?.data) {
        const data = requestsRes.value.data.data;
        const requests = Array.isArray(data) ? data : [data];
        // getRequestsTo filters only by isActive='Y', not by status — a REJECTED (or APPROVED)
        // request row stays isActive='Y' forever, so without this the button kept showing
        // "Permission requested" (hourglass + cancel) even after the owner had already declined
        // it, instead of reverting to "Tap to request access".
        const existing = requests.filter((r: any) => r?.fieldType && r?.status === 'PENDING').map((r: any) => r.fieldType);
        setPermissionRequests(prev => ({
          ...prev,
          profileImage: existing.includes('PROFILE_IMAGE'),
          mobile: existing.includes('MOBILE'),
          horoscope: existing.includes('HOROSCOPE'),
        }));
        setApprovedFields(requests.filter((r: any) => r?.fieldType && r?.status === 'APPROVED').map((r: any) => r.fieldType));
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
    // Nothing to zoom into when this profile has no real photo — the default gendered avatar
    // isn't a "photo" to expand, and without this guard the modal opened with an empty
    // gallery, rendering an <Image source={{uri: undefined}}> (blank/broken image).
    if (!hasProfileImage) return;
    setCurrentImageIndex(0);
    if (!planTitle || planTitle === 'Free') {
      popup.premiumRequired('Upgrade to Starter or above to view all profile photos.', buildUpgradeAction({ planTitle, featureName: 'Full Profile Photos', minPlan: 'Starter' }));
      return;
    }
    try {
      const encodeId = btoa(String(userDetailId));
      const res = await userApi.getUserGalleryImages(encodeId);
      const mainPhoto = userDetails?.profileImage;

      let images: string[] = [];
      if (res?.data?.data?.length > 0) {
        const galleryUrls: string[] = res.data.data.map((img: any) => img.userImage);
        // Always put the hero profile photo first, then the rest of the gallery
        // de-duped (the profile photo may or may not already be a gallery entry).
        if (mainPhoto) {
          images = [mainPhoto, ...galleryUrls.filter((url) => url !== mainPhoto)];
        } else {
          images = galleryUrls;
        }
      } else if (mainPhoto) {
        images = [mainPhoto];
      }

      if (images.length > 0) setGalleryImages(images);
      setImageModalVisible(true);
    } catch (e) {
      const mainPhoto = userDetails?.profileImage;
      if (mainPhoto) setGalleryImages([mainPhoto]);
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
      popup.premiumRequired('Upgrade to Starter or above to shortlist profiles.', buildUpgradeAction({ planTitle, featureName: 'Shortlist Profiles', minPlan: 'Starter' }));
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
    // REJECTED is sendable again — backend resets the existing row back to PENDING
    // rather than blocking, since a unique constraint forbids a second row for this pair.
    const canSend = interestStatus === 'NONE' || interestStatus === '' || interestStatus === null || interestStatus === 'REJECTED';
    if (!canSend) {
      if (interestStatus === 'APPROVED') {
        // The conversation already exists (created automatically when the interest was sent —
        // see InterestRequestService on the backend), but this used to navigate with a
        // hardcoded empty conversationId, so every conversation-scoped call chatscreen makes
        // (getConversationData, getConversationStatusById, ...) 404'd on arrival. Resolve the
        // real id first.
        let resolvedConversationId = '';
        try {
          const decodedCurrentUserId = atob(currentUserId);
          const convoRes = await userApi.getConversationByUsers(decodedCurrentUserId, parsedUserId);
          if (convoRes.data?.code === 200 && convoRes.data?.data?.id) {
            resolvedConversationId = String(convoRes.data.data.id);
          }
        } catch (e) {
          console.error('Error resolving conversation id:', e);
        }
        router.push({
          pathname: '/(root)/screens/chatscreen',
          params: {
            conversationId: resolvedConversationId,
            otherUserId: String(userId),
            otherUserName: `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim(),
            profileImage: userDetails?.profileImage || '',
            otherUserGender: userDetails?.gender || '',
          },
        });
      }
      return;
    }

    // Backend always responds HTTP 200 even on business failures (e.g. a request
    // between these two users already exists) — must check res.data.code, not just
    // that the call didn't throw, or the UI shows "sent" when nothing was created.
    const sendInterest = async () => {
      const res = await userApi.sendInterestRequest(currentUserId, parsedUserId);
      if (res.data?.code === 201) {
        setInterestStatus('PENDING');
        setIsSender(true);
      } else {
        popup.error('Request Failed', res.data?.message || 'Could not send interest request.');
      }
    };

    try {
      const uid = userData.userId;
      if (!uid) return;
      const quotaRes = await userApi.getRequestQuota(uid);
      const quota = quotaRes.data?.data;

      if (quota?.unlimited) {
        await sendInterest();
      } else if (quota?.remaining > 0) {
        let subId = subscriptionData?.subscriptionId;
        if (!subId) {
          const subRes = await userApi.getActiveUserSubscriptionByUserId(atob(uid));
          subId = subRes.data?.data?.subscriptionId || subRes.data?.data?.id;
        }
        if (subId) {
          const updateRes = await userApi.updateSendRequestCount(atob(uid), subId, 4);
          if (updateRes.data.code == 200) {
            await sendInterest();
          } else {
            popup.premiumRequired('You have used all your requests. Upgrade to send more.', buildUpgradeAction({ planTitle, featureName: 'Send Interest' }));
          }
        } else {
          // Fallback: send without quota tracking
          await sendInterest();
        }
      } else {
        popup.premiumRequired(`You have used all ${quota?.total || 0} requests. Upgrade to send more.`, buildUpgradeAction({ planTitle, featureName: 'Send Interest' }));
      }
    } catch (e) {
      popup.error('Request Failed', 'Please try again.');
    }
  };

  const handleWhatsAppShare = () => {
    const isGoldPlus = planTitle === 'Gold' || planTitle === 'Platinum';
    if (!isGoldPlus) {
      popup.premiumRequired('Upgrade to Gold or above to share profiles via WhatsApp.', buildUpgradeAction({ planTitle, featureName: 'WhatsApp Share', minPlan: 'Gold' }));
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
    if (callRequestSent) { popup.info('Already sent', 'You already have a pending request for this member.'); return; }
    const isPaid = planTitle && planTitle !== 'Free' && planTitle !== 'Starter';
    if (!isPaid) {
      popup.premiumRequired('Upgrade to Classic or above to request a voice call.', buildUpgradeAction({ planTitle, featureName: 'Voice Call', minPlan: 'Classic' }));
      return;
    }
    if (interestStatus !== 'APPROVED') {
      // Button is disabled in this state too (see JSX below) — this is just a defensive
      // second check in case interestStatus is momentarily stale.
      popup.info('Not connected yet', 'You can request a call once this member accepts your interest.');
      return;
    }

    const submitCallRequest = async () => {
      try {
        if (!userData.userId) return;
        const targetId = userId ? Number(userId) : undefined;
        const res = await userApi.createServiceRequest(userData.userId, 'VOICE_CALL', `Voice call request for ${userDetails?.firstName || 'member'}`, targetId);
        if (res.data.code === 200) {
          setCallRequestSent(true);
          popup.success('Request sent', 'Our team will arrange the call.');
        }
        else if (res.data.code === 409) {
          setCallRequestSent(true);
          popup.info('Already sent', 'You already have a pending request for this member.');
        }
        else if (res.data.code === 403 && res.data.message === 'INTEREST_NOT_APPROVED') popup.info('Not connected yet', 'You can request a call once this member accepts your interest.');
        else if (res.data.code === 403) popup.premiumRequired('Upgrade to Silver or above.', buildUpgradeAction({ planTitle, featureName: 'Voice Call', minPlan: 'Silver' }));
        else popup.error('Request failed', res.data.message || 'Please try again.');
      } catch (e: any) {
        const code = e?.response?.data?.code;
        const message = e?.response?.data?.message;
        if (code === 409) { setCallRequestSent(true); popup.info('Already sent', 'Pending request exists.'); }
        else if (code === 403 && message === 'INTEREST_NOT_APPROVED') popup.info('Not connected yet', 'You can request a call once this member accepts your interest.');
        else if (code === 403) popup.premiumRequired('Upgrade required.', buildUpgradeAction({ planTitle, featureName: 'Voice Call' }));
        else popup.error('Request failed', 'Network error.');
      }
    };

    popup.confirm(
      'Request a Voice Call',
      `We'll send your request to our team, and they'll arrange a call between you and ${userDetails?.firstName || 'this member'}.`,
      submitCallRequest,
      'Send Request',
      'Cancel'
    );
  };

  const handleStarMatch = () => {
    if (!isPremiumValue) {
      popup.premiumRequired('Star Match is a premium feature. Upgrade to discover horoscope compatibility.', buildUpgradeAction({ planTitle, featureName: 'Star Match' }));
      return;
    }
    // Same rule as Request Call: matching this member's horoscope against yours requires
    // their consent via an accepted interest first. The standalone Star Match utility
    // (settingsPage.tsx / QuickAccessFAB.tsx, no viewedUserId) is unaffected — this check
    // only applies to the profile-initiated flow.
    if (interestStatus !== 'APPROVED') {
      popup.info('Not connected yet', 'You can check Star Match compatibility once this member accepts your interest.');
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

  // ─── Block / Report ───────────────────────────────
  const handleBlockUser = () => {
    if (isParent) { popup.error('Not allowed', 'Parent accounts cannot block users.'); return; }
    popup.confirm(
      'Block User',
      `Block ${userDetails?.firstName || 'this user'}? You won't see each other's profiles anymore. This can be reversed from Settings.`,
      async () => {
        try {
          await userApi.blockUser({ blockedByUserId: userData.userId, blockedUserId: userId });
          popup.success('Blocked', `${userDetails?.firstName || 'User'} has been blocked.`);
          router.back();
        } catch { popup.error('Error', 'Could not block user. Try again.'); }
      },
      'Block',
    );
  };

  const handleReportUser = () => {
    if (isParent) { popup.error('Not allowed', 'Parent accounts cannot report users.'); return; }
    setSelectedReason('');
    setReportAlsoBlock(true);
    setReportModalVisible(true);
  };

  const handleReportSubmit = async () => {
    if (!selectedReason) { popup.error('Select Reason', 'Please select a reason for reporting.'); return; }
    try {
      await userApi.reportUser({
        reportedByUserId: userData.userId,
        reportedUserId: userId,
        reason: selectedReason,
        blockUser: reportAlsoBlock,
      });
      setReportModalVisible(false);
      popup.success(
        'Reported',
        reportAlsoBlock
          ? 'Your report has been submitted and this user has been blocked.'
          : 'Your report has been submitted. Our team will review it.'
      );
    } catch { popup.error('Error', 'Could not submit report. Try again.'); }
  };

  // ─── Derived values ────────────────────────────────
  const profileImage = userDetails?.profileImage;
  const hasProfileImage = !!profileImage;
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
    <MenuProvider>
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
        <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT, overflow: 'hidden', position: 'relative' }}>
          {hiddenFeildsValue.includes('profileImage') && !approvedFields.includes('PROFILE_IMAGE') ? (
            /* Hidden by profile owner — ask permission */
            <View style={{ flex: 1 }}>
              <Image
                source={
                  profileImage ? { uri: profileImage } :
                  userDetails?.gender === 'M' ? require('../../../assets/images/avatarMen.png') :
                  userDetails?.gender === 'F' ? require('../../../assets/images/avatarWomen.png') :
                    require('../../../assets/images/defaultAvatar.png')
                }
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                blurRadius={30}
              />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }]}>
                <Ionicons name="eye-off" size={40} color="rgba(255,255,255,0.8)" />
                <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Rubik-Medium', marginTop: 10, textAlign: 'center' }}>User has restricted their profile photo</Text>
                <TouchableOpacity
                  onPress={handlePermissionRequest}
                  style={{ marginTop: 14, backgroundColor: permissionRequests.profileImage ? '#EF4444' : '#1F7FE5', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 }}
                >
                  <Text style={{ color: '#fff', fontFamily: 'Rubik-Bold', fontSize: 13 }}>
                    {permissionRequests.profileImage ? 'Cancel Request' : 'Ask Permission'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            // The default avatar assets are square (500x500/512x512), but this frame is a 4:5
            // portrait rectangle. `resizeMode="cover"` (used for real photos, which are already
            // portrait-cropped by the upload flow) was center-cropping ~12.5% off each side of
            // these square, near-full-bleed illustrations — clipping hair/shoulders and making
            // the avatar look zoomed-in/off-center compared to a real photo in the same frame.
            // `contain` + a neutral fill behind it keeps the whole illustration visible and
            // properly centered instead.
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#eef1f5', justifyContent: 'center', alignItems: 'center' }]}>
              <Image
                source={
                  userDetails?.gender === 'M' ? require('../../../assets/images/avatarMen.png') :
                  userDetails?.gender === 'F' ? require('../../../assets/images/avatarWomen.png') :
                    require('../../../assets/images/defaultAvatar.png')
                }
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Gradient overlay at bottom — purely decorative (darkens the lower half for text
              legibility), but being an absolutely-positioned View covering half the hero image
              with no pointerEvents, it silently swallowed taps meant for anything underneath it
              in that zone — including the "Ask Permission"/"Cancel Request" button, whose centered
              content (icon + text + button) commonly extends past the container's vertical
              midpoint on a tall hero image. */}
          <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.5)']} style={[StyleSheet.absoluteFillObject, { top: '50%' }]} />

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
            <TouchableOpacity
              style={[s.sideBtn, { backgroundColor: 'rgba(255,255,255,0.8)' }, !hasProfileImage && { opacity: 0.4 }]}
              onPress={openImageModal}
              disabled={!hasProfileImage}
            >
              <Maximize2 size={20} color="#0f1724" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Floating header buttons ─── */}
        <View style={[s.headerRow, { top: 8 }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Menu>
            <MenuTrigger>
              <View style={s.headerBtn}>
                <MoreVertical size={22} color="#fff" />
              </View>
            </MenuTrigger>
            <MenuOptions customStyles={{ optionsContainer: { borderRadius: 14, paddingVertical: 6, width: 210, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 } }}>
              <MenuOption onSelect={handleBlockUser}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
                  <ShieldAlert size={18} color="#334155" />
                  <View>
                    <Text style={{ fontSize: 14, fontFamily: 'Rubik-Medium', color: '#1e293b' }}>Block</Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Hide each other. Reversible.</Text>
                  </View>
                </View>
              </MenuOption>
              <View style={{ height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 12 }} />
              <MenuOption onSelect={handleReportUser}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
                  <Flag size={18} color="#dc2626" />
                  <View>
                    <Text style={{ fontSize: 14, fontFamily: 'Rubik-Medium', color: '#dc2626' }}>Report User</Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Flag for moderator review.</Text>
                  </View>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>

        {/* ─── Profile Card (overlaps image) ─── */}
        <View style={s.profileCard}>
          {/* Verified tag above name */}
          {(anyVerified || isVerifiedPlan) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <MaterialIcons name="verified" size={14} color="#1F7FE5" />
              <Text style={{ fontSize: 10, fontFamily: 'Rubik-Bold', color: '#1F7FE5', textTransform: 'uppercase', letterSpacing: 0.8 }}>Verified Profile</Text>
            </View>
          )}
          {/* Name */}
          <View style={{ marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Text style={s.nameText}>{userDetails?.firstName} {userDetails?.lastName}</Text>
            {userDetails?.memberId && (
              <View style={{ backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 11, fontFamily: 'Rubik-Bold', color: '#64748b', letterSpacing: 0.2 }}>
                  {userDetails.memberId}
                </Text>
              </View>
            )}
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
              {!isParent && (() => {
                const isPaidPlan = planTitle && planTitle !== 'Free' && planTitle !== 'Starter';
                // Only grey this out for the "not matched yet" reason — an insufficient-plan
                // tap should still go through and show the upgrade popup (existing behavior).
                const callLocked = isPaidPlan && interestStatus !== 'APPROVED';

                if (callRequestSent) {
                  return (
                    <TouchableOpacity style={[s.secondaryBtn, s.secondaryBtnSent]} disabled activeOpacity={1}>
                      <Clock size={18} color="#1F7FE5" />
                      <Text style={[s.secondaryBtnText, s.secondaryBtnSentText]}>Request Sent</Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    style={[s.secondaryBtn, callLocked && s.secondaryBtnDisabled]}
                    onPress={handleRequestCall}
                    disabled={callLocked}
                    activeOpacity={0.8}
                  >
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Phone size={18} color={callLocked ? '#94a3b8' : '#1F7FE5'} />
                        <Text style={[s.secondaryBtnText, callLocked && s.secondaryBtnTextDisabled]}>Request Call</Text>
                      </View>
                      {callLocked && (
                        <Text style={s.secondaryBtnSubtext}>Available after they accept your interest</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })()}
              {(() => {
                // Only grey out for "not matched yet" — Free/insufficient-plan taps still
                // go through to show the upgrade popup (existing behavior for that case).
                const matchLocked = isPremiumValue && interestStatus !== 'APPROVED';
                return (
                  <TouchableOpacity
                    style={[s.secondaryBtn, matchLocked && s.secondaryBtnDisabled]}
                    onPress={handleStarMatch}
                    disabled={matchLocked}
                    activeOpacity={0.8}
                  >
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Star size={18} color={matchLocked ? '#94a3b8' : '#1F7FE5'} />
                        <Text style={[s.secondaryBtnText, matchLocked && s.secondaryBtnTextDisabled]}>Match Score</Text>
                      </View>
                      {matchLocked && (
                        <Text style={s.secondaryBtnSubtext}>Available after they accept your interest</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })()}
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
            planTitle={planTitle || ''}
            interestStatus={interestStatus}
            permissionRequests={permissionRequests}
            approvedFields={approvedFields}
          />}
        </View>
      </ScrollView>

      {/* ─── Report Modal ─── */}
      <Modal visible={reportModalVisible} transparent animationType="fade">
        <View style={s.reportOverlay}>
          <View style={s.reportCard}>
            <Text style={s.reportTitle}>Report User</Text>
            <Text style={s.reportDesc}>Why are you reporting {userDetails?.firstName || 'this user'}?</Text>
            <View style={s.reportReasons}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[s.reportChip, selectedReason === reason && s.reportChipActive]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text style={[s.reportChipText, selectedReason === reason && s.reportChipTextActive]}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}
              onPress={() => setReportAlsoBlock((v) => !v)}
              activeOpacity={0.7}
            >
              <Ionicons name={reportAlsoBlock ? 'checkbox' : 'square-outline'} size={20} color={reportAlsoBlock ? '#dc2626' : '#94a3b8'} />
              <Text style={{ fontSize: 13, fontFamily: 'Rubik-Medium', color: '#334155', flex: 1 }}>
                Also block this user
              </Text>
            </TouchableOpacity>
            <View style={s.reportBtnRow}>
              <TouchableOpacity style={s.reportCancelBtn} onPress={() => setReportModalVisible(false)}>
                <Text style={s.reportCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.reportSubmitBtn, !selectedReason && { opacity: 0.5 }]} onPress={handleReportSubmit}>
                <LinearGradient colors={['#dc2626', '#b91c1c']} style={s.reportSubmitGrad}>
                  <Text style={s.reportSubmitTxt}>Report</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </MenuProvider>
  );
};

// ─── Styles ────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },

  // Header — glassmorphism floating buttons
  headerRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 50 },
  // Both float over a user-uploaded photo with no darkening scrim on this top portion, so a
  // translucent tint (not a flat opaque color) is what stays legible across any photo — tinted
  // with the app's own brand maroon rather than an unrelated color, plus a soft light border
  // for definition against dark photos.
  // Android ignores shadowColor/shadowOpacity/shadowRadius/shadowOffset entirely (View shadows only
  // respect `elevation` there) and — separately — combining `elevation` with a translucent
  // (alpha < 1) backgroundColor is a known Android rendering quirk that makes the button look
  // darker/blotchier than the same rgba on iOS. Platform.select bumps Android's fill opacity to
  // compensate and drops the no-op iOS shadow props so the two platforms read the same visually.
  headerBtn: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    ...Platform.select({
      ios: { backgroundColor: 'rgba(66,0,1,0.45)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { backgroundColor: 'rgba(66,0,1,0.72)', elevation: 4 },
    }),
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    ...Platform.select({
      ios: { backgroundColor: 'rgba(66,0,1,0.45)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { backgroundColor: 'rgba(66,0,1,0.72)', elevation: 4 },
    }),
  },

  // Side action FABs
  sideActions: { position: 'absolute', right: 16, gap: 10 },
  sideBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: 'rgba(15,35,70,0.08)', shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5 },

  // Profile card — soft overlap
  profileCard: { marginTop: -36, backgroundColor: '#f1f5f9', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 60, shadowColor: 'rgba(15,35,70,0.06)', shadowOpacity: 1, shadowRadius: 24, shadowOffset: { width: 0, height: -8 } },

  // Typography
  nameText: { fontSize: 20, fontFamily: 'Rubik-ExtraBold', color: '#0f1724', letterSpacing: -0.5 },
  subText: { fontSize: 12.5, color: '#475569', marginTop: 2, fontFamily: 'Rubik-Medium', letterSpacing: -0.2 },
  occupationText: { fontSize: 12.5, color: '#1F7FE5', fontFamily: 'Rubik-Medium', marginTop: 3, letterSpacing: -0.1 },

  // Verification badges
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#dfecfb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  badgeText: { fontSize: 9.5, fontFamily: 'Rubik-Medium', color: '#1862b8' },

  // Primary CTA
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, shadowColor: 'rgba(31,127,229,0.25)', shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  primaryBtnText: { color: '#fff', fontSize: 13.5, fontFamily: 'Rubik-Bold' },

  // Secondary buttons
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  secondaryBtnText: { color: '#1F7FE5', fontSize: 12.5, fontFamily: 'Rubik-Bold' },
  secondaryBtnDisabled: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  secondaryBtnTextDisabled: { color: '#94a3b8' },
  secondaryBtnSubtext: { color: '#94a3b8', fontSize: 8.5, lineHeight: 11, marginTop: 2, textAlign: 'center' },
  secondaryBtnSent: { backgroundColor: '#dfecfb', borderColor: 'rgba(31,127,229,0.2)' },
  secondaryBtnSentText: { color: '#1F7FE5' },

  // Share button
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 12, backgroundColor: '#f6f8fa' },
  shareBtnText: { color: '#475569', fontSize: 11.5, fontFamily: 'Rubik-Medium' },

  // Image gallery modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,10,15,0.97)', justifyContent: 'center' },
  modalClose: { position: 'absolute', right: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 40 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: '#1F7FE5', width: 20, borderRadius: 3 },

  // Report modal
  reportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  reportCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  reportTitle: { fontSize: 18, fontFamily: 'Rubik-Bold', color: '#1e293b', marginBottom: 6 },
  reportDesc: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  reportReasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  reportChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  reportChipActive: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  reportChipText: { fontSize: 13, fontFamily: 'Rubik-Medium', color: '#475569' },
  reportChipTextActive: { color: '#dc2626', fontFamily: 'Rubik-Medium' },
  reportBtnRow: { flexDirection: 'row', gap: 10 },
  reportCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' },
  reportCancelTxt: { fontSize: 14, fontFamily: 'Rubik-Medium', color: '#64748b' },
  reportSubmitBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  reportSubmitGrad: { paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  reportSubmitTxt: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#fff' },
});

export default ProfileDetailRevamp;