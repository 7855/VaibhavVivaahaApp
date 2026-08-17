import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFooterClearance } from '@/components/VVMFooterNav';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useUserData } from '../contexts/UserDataContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { usePopup } from '../contexts/PopupContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  FlatList,
  ScrollView,
  GestureResponderEvent,
  useWindowDimensions,
  Modal,
  Pressable,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Center, Stack, VStack, Image as NBImage, Text as NBText, Divider, Skeleton, HStack as NBHStack } from 'native-base';
import { Image as ImageNative } from 'react-native';
import VerifiedBadges from '../../../components/VerifiedBadges';
import Icon from 'react-native-vector-icons/Ionicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

import { TabView, TabBar } from 'react-native-tab-view';
import userApi from '../api/userApi';
import { LinearGradient } from 'expo-linear-gradient';
import { Checkbox } from 'native-base';
import {
  MapPin,
  GraduationCap,
  DollarSign,
  Briefcase,
  Eye,
  Phone,
  Star,
  Clock,
} from 'lucide-react-native';

// Skeleton loader matching matchCard layout (260h image card with overlay text)
const MailboxCardSkeleton = () => (
  <View style={{
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    overflow: 'hidden',
  }}>
    <View style={{ height: 260, borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
      <Skeleton h="100%" w="100%" rounded="none" />
      {/* Overlay text area at bottom */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}>
        <View style={{ maxWidth: '70%' }}>
          <Skeleton h={5} w={180} rounded="sm" startColor="gray.400" endColor="gray.500" mb={2} />
          <Skeleton h={3.5} w={220} rounded="sm" startColor="gray.400" endColor="gray.500" />
        </View>
        <NBHStack space={2}>
          <Skeleton size={8} rounded="full" startColor="gray.400" endColor="gray.500" />
          <Skeleton size={8} rounded="full" startColor="gray.400" endColor="gray.500" />
        </NBHStack>
      </View>
    </View>
  </View>
);

const MailboxLoadingSkeleton = ({ count = 3 }: { count?: number }) => (
  <ScrollView>
    {Array.from({ length: count }).map((_, i) => (
      <MailboxCardSkeleton key={i} />
    ))}
  </ScrollView>
);

// Skeleton for Request cards (profile image + details)
const RequestCardSkeleton = () => (
  <View style={{
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  }}>
    <NBHStack space={3} alignItems="center">
      <Skeleton size={12} rounded="full" />
      <VStack flex={1} space={2}>
        <Skeleton h={4} w="60%" rounded="sm" />
        <Skeleton h={3} w="30%" rounded="sm" />
        <NBHStack space={1} alignItems="center">
          <Skeleton size={2} rounded="full" />
          <Skeleton h={3} w="25%" rounded="sm" />
        </NBHStack>
      </VStack>
      <VStack alignItems="flex-end" space={1}>
        <Skeleton h={3} w={14} rounded="sm" />
        <Skeleton h={3} w={10} rounded="sm" />
      </VStack>
    </NBHStack>
    <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
      <Skeleton h={3.5} w={20} rounded="sm" />
      <Skeleton h={3.5} w={20} rounded="sm" />
      <Skeleton h={3.5} w={20} rounded="sm" />
      <Skeleton h={3.5} w={20} rounded="sm" />
    </View>
  </View>
);

const RequestLoadingSkeleton = ({ count = 4 }: { count?: number }) => (
  <ScrollView>
    {Array.from({ length: count }).map((_, i) => (
      <RequestCardSkeleton key={i} />
    ))}
  </ScrollView>
);

interface ReceivedProfile {
  userId: number;
  firstName: string;
  lastName: string;
  age: number;
  degree: string;
  annualIncome: string;
  occupation: string;
  location: string;
  profileImage: string;
  status: 'pending' | 'accepted' | 'rejected';
  interestId: number;
  isSent: boolean;
  shortlistedId: number;
  idVerified?: boolean;
  educationVerified?: boolean;
  incomeVerified?: boolean;
  acceptStatus?: 'PENDING' | 'REJECTED' | 'APPROVED';
}

const DEFAULT_AVATAR = require('../../../assets/images/defaultAvatar.png');

// Every FlatList on this screen used to build its rows from an inline `renderItem` closure, so a
// single state change anywhere in the tab (a filter tap, a refocus refetch, a popup opening)
// re-rendered every mounted row's whole subtree — ImageBackground, gradient overlay, badges and
// all. Rows are now module-scope React.memo components taking plain props + stable callbacks, the
// same recipe already used by components/listchats.js's ChatRow.
const ReceivedRow = React.memo(function ReceivedRow({
  item,
  onOpen,
  onAccept,
  onDecline,
}: {
  item: ReceivedProfile;
  onOpen: (userId: number) => void;
  onAccept: (item: ReceivedProfile) => void;
  onDecline: (item: ReceivedProfile) => void;
}) {
  return (
    <TouchableOpacity style={styles.matchCard} onPress={() => onOpen(item.userId)}>
      <ImageBackground
        source={item.profileImage ? { uri: item.profileImage } : DEFAULT_AVATAR}
        style={styles.imageBackground}
        imageStyle={styles.image}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <VerifiedBadges idVerified={item.idVerified} educationVerified={item.educationVerified} incomeVerified={item.incomeVerified} mode="compact" size="sm" color="gold" />
        </View>
        <View style={styles.matchInfo}>
          <View style={styles.infoText}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}><Text style={styles.name}>{item.firstName} {item.lastName}, {item.age}</Text></View>
            <Text style={styles.occupation}>
              {item.degree}, {item.annualIncome}/yr, {item.occupation}, {item.location}
            </Text>
          </View>
          {item.status === 'pending' && (
            <View style={styles.iconActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={(e: GestureResponderEvent) => {
                  e.stopPropagation();
                  onDecline(item);
                }}
              >
                <Ionicons name="close" size={20} color="green" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={(e: GestureResponderEvent) => {
                  e.stopPropagation();
                  onAccept(item);
                }}
              >
                <Ionicons name="heart" size={20} color="red" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
});

const SentRow = React.memo(function SentRow({
  item,
  onOpen,
  onDelete,
}: {
  item: ReceivedProfile;
  onOpen: (userId: number) => void;
  onDelete: (item: ReceivedProfile) => void;
}) {
  return (
    <View style={styles.matchCard}>
      <TouchableOpacity onPress={() => onOpen(item.userId)}>
        <ImageBackground
          source={item.profileImage ? { uri: item.profileImage } : DEFAULT_AVATAR}
          style={styles.imageBackground}
          imageStyle={styles.image}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
            <VerifiedBadges idVerified={item.idVerified} educationVerified={item.educationVerified} incomeVerified={item.incomeVerified} mode="compact" size="sm" color="gold" />
          </View>
          <View style={styles.matchInfo}>
            <View style={styles.infoText}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={styles.name}>{item.firstName} {item.lastName}, {item.age}</Text>
              </View>
              <Text style={styles.occupation}>
                {item.degree}, {item.annualIncome}/yr, {item.occupation}, {item.location}
              </Text>
              <View style={{
                alignSelf: 'flex-start',
                marginTop: 4,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor: item.acceptStatus === 'APPROVED' ? '#4CAF50'
                  : item.acceptStatus === 'REJECTED' ? '#f44336'
                    : '#9E9E9E',
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                  {item.acceptStatus === 'APPROVED' ? 'Accepted'
                    : item.acceptStatus === 'REJECTED' ? 'Declined'
                      : 'Pending'}
                </Text>
              </View>
            </View>
            <View style={styles.iconActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={(e: GestureResponderEvent) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
              >
                <Ionicons name="close" size={20} color="green" />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
});

const PermissionRow = React.memo(function PermissionRow({
  item,
  onOpen,
  onAccept,
  onDelete,
}: {
  item: any;
  onOpen: (userId: number) => void;
  onAccept: (item: any) => void;
  onDelete: (item: any) => void;
}) {
  const status = String(item?.status || 'PENDING').toUpperCase();
  const isPending = status === 'PENDING';
  const statusMeta =
    status === 'APPROVED'
      ? { label: 'Approved', icon: 'checkmark-circle', bg: 'rgba(22,163,74,0.92)', fg: '#fff' }
      : status === 'REJECTED'
        ? { label: 'Declined', icon: 'close-circle', bg: 'rgba(220,38,38,0.92)', fg: '#fff' }
        : { label: 'Pending', icon: 'time', bg: 'rgba(107,114,128,0.92)', fg: '#fff' };

  return (
    <View style={styles.matchCard}>
      <TouchableOpacity onPress={() => onOpen(item.requestedBy)}>
        <ImageBackground
          source={item.profileImage ? { uri: item.profileImage } : DEFAULT_AVATAR}
          style={styles.imageBackground}
          imageStyle={styles.image}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <View style={styles.profileImageLabel}>
            <Text style={styles.profileImageLabelText}>{item.fieldType == 'PROFILE_IMAGE' ? 'Profile Photo' : item.fieldType == 'HOROSCOPE' ? 'Horoscope' : item.fieldType == 'MOBILE' ? 'Mobile Number' : ''}</Text>
          </View>
          <View style={styles.matchInfo}>
            <View style={styles.infoText}>
              <Text style={styles.name}>
                {item.firstname} {item.lastname}, {item.age}
              </Text>
              <Text style={styles.occupation}>
                {item.degree}, {item.AnnualIncome}/yr, {item.Occupation}, {item.location}
              </Text>
            </View>
            {/* Accept/reject only while the request is still open. Decided rows keep their
                place in the list but show the outcome instead of buttons that would re-submit
                a decision already made. */}
            {isPending ? (
              <View style={styles.iconActions}>
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    { marginRight: 10 }
                  ]}
                  onPress={(e: GestureResponderEvent) => {
                    e.stopPropagation();
                    onAccept(item);
                  }}
                >
                  <Ionicons name="checkmark" size={20} color="green" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={(e: GestureResponderEvent) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                >
                  <Ionicons name="close" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.statusChip, { backgroundColor: statusMeta.bg }]}>
                <Ionicons name={statusMeta.icon as any} size={13} color={statusMeta.fg} />
                <Text style={[styles.statusChipText, { color: statusMeta.fg }]}>
                  {statusMeta.label}
                </Text>
              </View>
            )}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
});

const ReceivedTab = ({ isActive }: { isActive: boolean }) => {
  const footerPad = useFooterClearance();
  const { userData } = useUserData();
  const popup = usePopup();
  const [error, setError] = useState<string | null>(null);
  const { subscriptionData } = useSubscription();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (subscriptionData?.planTitle && subscriptionData.planTitle !== 'Free') {
      // Bronze, Silver, Gold, Platinum are premium plans
      setIsPremium(true);
    } else {
      setIsPremium(false);
    }
  }, [subscriptionData]);

  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Checking your premium status...</Text>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );

  const PremiumRequiredScreen = () => (
    <TouchableOpacity
      style={styles.premiumContainer}
      onPress={() => router.replace('/(root)/screens/PremiumTab')}
    >
      <View style={styles.premiumContent}>
        <Ionicons name="lock-closed" size={40} color="#ec4899" />
        <Text style={styles.premiumTitle}>Premium Required</Text>
        <Text style={styles.premiumText}>
          Upgrade to Premium to send messages and enjoy full features
        </Text>
        <Pressable
          style={styles.upgradeButton}
          onPress={() => router.replace('/(root)/screens/PremiumTab')}
        >
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </Pressable>
      </View>
    </TouchableOpacity>
  );





  const [data, setData] = useState<ReceivedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  const statusCounts = useMemo(() => ({
    pending: data.filter(item => item.status === 'pending').length,
    accepted: data.filter(item => item.status === 'accepted').length,
    rejected: data.filter(item => item.status === 'rejected').length,
  }), [data]);

  const filteredData = useMemo(() =>
    data.filter(item => item.status === selectedFilter),
    [data, selectedFilter]
  );

  const handleAccept = useCallback(async (item: ReceivedProfile) => {
    try {
      // Accept is free for all users — no plan gate
      // Chat after accept is gated to Silver+ (handled in chatscreen)
      const res = await userApi.updateInterestRequestStatus(item.interestId, 'APPROVED');
      if (res.data?.code === 200) {
        popup.success('Request Accepted', `You've accepted ${item.firstName}'s interest request.`);
      }

      // Refresh data by fetching latest profiles
      if (!userData.userId) {
        setError('User ID not found');
        return;
      }
      const userId = userData.userId;

      const [pendingResponse, acceptedResponse, rejectedResponse] = await Promise.all([
        userApi.getPendingReceivedProfiles(userId),
        userApi.getAcceptedReceivedProfiles(userId),
        userApi.getRejectedReceivedProfiles(userId),
      ]);

      const pendingProfiles = (pendingResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'pending',
      }));

      const acceptedProfiles = (acceptedResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'accepted',
      }));

      const rejectedProfiles = (rejectedResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'rejected',
      }));

      const combinedProfiles = [...pendingProfiles, ...acceptedProfiles, ...rejectedProfiles];
      setData(combinedProfiles);
    } catch (error) {
      console.error('Error accepting profile:', error);
      popup.error('Failed', 'Could not accept the request. Please try again.');
    }
  }, [userData.userId, popup]);

  const handleDecline = useCallback(async (item: ReceivedProfile) => {
    try {
      const res = await userApi.updateInterestRequestStatus(item.interestId, 'REJECTED');
      if (res.data?.code === 200) {
        popup.success('Request Declined', `You've declined ${item.firstName}'s interest request.`);
      }

      // Refresh data by fetching latest profiles
      if (!userData.userId) {
        setError('User ID not found');
        return;
      }
      const userId = userData.userId;

      const [pendingResponse, acceptedResponse, rejectedResponse] = await Promise.all([
        userApi.getPendingReceivedProfiles(userId),
        userApi.getAcceptedReceivedProfiles(userId),
        userApi.getRejectedReceivedProfiles(userId),
      ]);

      const pendingProfiles = (pendingResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'pending',
      }));

      const acceptedProfiles = (acceptedResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'accepted',
      }));

      const rejectedProfiles = (rejectedResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'rejected',
      }));

      const combinedProfiles = [...pendingProfiles, ...acceptedProfiles, ...rejectedProfiles];
      setData(combinedProfiles);
    } catch (error) {
      console.error('Error rejecting profile:', error);
      setError('Failed to reject profile');
    }
  }, [userData.userId]);

  // Was useEffect(() => {...}, []) — fetched once on mount only. Since this tab (like the
  // others in mailBox.tsx) stays mounted when the user navigates away and back, a request
  // received (and pushed via notification) while elsewhere in the app never showed up here
  // until a full app restart — reopening the tab just re-focused the same stale state. Switched
  // to useFocusEffect, matching the same fix already applied to the Sent By You tab.
  //
  // Three further fixes on top of that:
  //  1. `isActive` — useFocusEffect keys off the whole mailBox SCREEN's focus, not this sub-tab's,
  //     so all three scenes used to fire their fetches (6 API calls) every single time the screen
  //     was focused, even the two the user wasn't looking at. Only fetch when this really is the
  //     selected sub-tab.
  //  2. The spinner now only shows on the FIRST load (hasLoadedRef) — previously every refocus set
  //     loading=true, so coming back from ProfileDetail replaced already-correct rows with a full
  //     skeleton. Matches the pattern RequestsTab already used.
  //  3. `isStillActive` cleanup flag so a slow response from a previous focus can't overwrite the
  //     state of a newer one (same guard used in app/(root)/(tabs)/index.tsx).
  const hasLoadedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!isActive) return;
      let isStillActive = true;

      const loadReceivedData = async () => {
        try {
          if (!hasLoadedRef.current) setLoading(true);
          if (!userData.userId) {
            setError('User ID not found');
            return;
          }
          const userId = userData.userId;

          const [pendingResponse, acceptedResponse, rejectedResponse] = await Promise.all([
            userApi.getPendingReceivedProfiles(userId),
            userApi.getAcceptedReceivedProfiles(userId),
            userApi.getRejectedReceivedProfiles(userId),
          ]);

          if (!isStillActive) return;

          const pendingProfiles = (pendingResponse.data?.data || []).map((item: any) => ({
            ...item,
            status: 'pending',
          }));

          const acceptedProfiles = (acceptedResponse.data?.data || []).map((item: any) => ({
            ...item,
            status: 'accepted',
          }));

          const rejectedProfiles = (rejectedResponse.data?.data || []).map((item: any) => ({
            ...item,
            status: 'rejected',
          }));

          const combinedProfiles = [...pendingProfiles, ...acceptedProfiles, ...rejectedProfiles];

          setData(combinedProfiles);
          setError(null);
        } catch (err: any) {
          if (!isStillActive) return;
          console.error('Error loading received profiles:', err);
          setError('Failed to load profiles: ' + (err.message || 'Unknown error'));
        } finally {
          hasLoadedRef.current = true;
          if (isStillActive) setLoading(false);
        }
      };

      loadReceivedData();
      return () => { isStillActive = false; };
    }, [userData.userId, isActive])
  );

  const handleOpenProfile = useCallback((userId: number) => {
    router.push(`/screens/ProfileDetail?userId=${userId}`);
  }, []);

  const renderReceivedItem = useCallback(({ item }: { item: ReceivedProfile }) => (
    <ReceivedRow item={item} onOpen={handleOpenProfile} onAccept={handleAccept} onDecline={handleDecline} />
  ), [handleOpenProfile, handleAccept, handleDecline]);

  if (loading) {
    return <MailboxLoadingSkeleton count={3} />;
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {([
          { key: 'pending', label: 'Pending', icon: 'time', iconOutline: 'time-outline', color: '#f59e0b', bg: '#fffbeb' },
          { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle', iconOutline: 'checkmark-circle-outline', color: '#10b981', bg: '#ecfdf5' },
          { key: 'rejected', label: 'Declined', icon: 'close-circle', iconOutline: 'close-circle-outline', color: '#ef4444', bg: '#fef2f2' },
        ] as const).map(filter => {
          const isActive = selectedFilter === filter.key;
          const count = statusCounts[filter.key as 'pending' | 'accepted' | 'rejected'];
          return (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setSelectedFilter(filter.key as any)}
              activeOpacity={0.8}
              style={[
                styles.filterCard,
                {
                  backgroundColor: isActive ? filter.bg : '#fff',
                  borderBottomWidth: isActive ? 3 : 0,
                  borderBottomColor: filter.color,
                },
              ]}
            >
              {/* Count badge — top right corner */}
              {count > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  right: -4,
                  backgroundColor: isActive ? filter.color : '#d1d5db',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 5,
                  borderWidth: 2,
                  borderColor: '#F5F5F5',
                  zIndex: 1,
                }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Rubik-ExtraBold', color: '#fff' }}>{count}</Text>
                </View>
              )}
              {/* Icon left, label right */}
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: isActive ? filter.color + '20' : '#f3f4f6',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons
                  name={(isActive ? filter.icon : filter.iconOutline) as any}
                  size={16}
                  color={isActive ? filter.color : '#9ca3af'}
                />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: isActive ? '800' : '600',
                color: isActive ? filter.color : '#6b7280',
              }}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.userId.toString()}
        contentContainerStyle={[styles.listContent, { paddingBottom: footerPad }]}
        windowSize={5}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        removeClippedSubviews={true}
        renderItem={renderReceivedItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No Interests Found</Text>
          </View>
        )}
      />

      <View style={{ marginBottom: 90 }}></View>
    </View>
  );
};

const SentTab = ({ isActive }: { isActive: boolean }) => {
  const footerPad = useFooterClearance();
  const { userData } = useUserData();
  const popup = usePopup();
  const [data, setData] = useState<ReceivedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const removeInterest = async (item: ReceivedProfile) => {
    try {
      const res = await userApi.deleteInterestRequest(item.interestId);
      // Backend returns HTTP 200 even on business failures — must check the body's code
      // rather than assuming the request succeeded just because the promise resolved.
      if (res?.data?.code === 200) {
        setData(prevData => prevData.filter(profile => profile.interestId !== item.interestId));
      } else {
        popup.error('Something went wrong', res?.data?.message || 'Failed to remove this request. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting interest:', error);
      popup.error('Something went wrong', 'Failed to remove this request. Please try again.');
    }
  };

  // Canceling a still-PENDING request is harmless (nobody's answered yet) so it stays instant.
  // But this same X icon also appears on an already-APPROVED item — tapping it there is really
  // "unfriend/disconnect", not "withdraw an ask": it deletes the match record and, if neither side
  // ever actually chatted, wipes the conversation too. That's irreversible enough to warrant an
  // explicit confirmation instead of a silent one-tap delete.
  const handleDelete = useCallback((item: ReceivedProfile) => {
    if (item.acceptStatus === 'APPROVED') {
      popup.confirm(
        'Remove this connection?',
        `You're already connected with ${item.firstName}. Removing this will end the connection${'\n'}— if you haven't exchanged any messages yet, the conversation will be deleted too. This can't be undone.`,
        () => removeInterest(item),
        'Remove',
        'Cancel'
      );
      return;
    }
    removeInterest(item);
    // removeInterest closes over nothing that changes between renders beyond userData/popup,
    // which are stable enough for the memoised rows below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup]);

  // Refetch every time this screen regains focus (not just on first mount) — otherwise
  // sending a second interest elsewhere and coming back shows stale data, since the tab
  // stays mounted across navigation. Guarded on `isActive` so this only fires when "Sent By You"
  // is the selected sub-tab (the screen-level focus event fires for all three scenes at once),
  // plus an isStillActive flag so a slow response can't overwrite newer state.
  useFocusEffect(
    useCallback(() => {
      if (!isActive) return;
      let isStillActive = true;

      const loadSentData = async () => {
        try {
          if (!userData.userId) {
            setError('User ID not found');
            return;
          }
          const userId = userData.userId;
          const response = await userApi.getSentMailbox(userId);
          if (!isStillActive) return;
          if (response.data.code === 200) {
            setData(response.data.data);
            setError(null);
          } else {
            setError('No Interest Sent Record Found');
          }
        } catch (error) {
          if (!isStillActive) return;
          setError('Error loading sent data');
        } finally {
          if (isStillActive) setLoading(false);
        }
      };

      loadSentData();
      return () => { isStillActive = false; };
    }, [userData.userId, isActive])
  );

  const handleOpenProfile = useCallback((userId: number) => {
    router.push(`/screens/ProfileDetail?userId=${userId}`);
  }, []);

  const renderSentItem = useCallback(({ item }: { item: ReceivedProfile }) => (
    <SentRow item={item} onOpen={handleOpenProfile} onDelete={handleDelete} />
  ), [handleOpenProfile, handleDelete]);

  if (loading) {
    return <MailboxLoadingSkeleton count={3} />;
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.userId.toString()}
      contentContainerStyle={[styles.listContent, { paddingBottom: footerPad }]}
      windowSize={5}
      initialNumToRender={6}
      maxToRenderPerBatch={4}
      removeClippedSubviews={true}
      renderItem={renderSentItem}
      ListEmptyComponent={() => (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No sent interests found</Text>
        </View>
      )}
    />
  );
};

// Hoisted out of RequestsTab (where it was re-declared on every render, so React saw a brand
// new component type each time and remounted every card in the "Request Sent" list — images,
// badges and all — on any state change in the tab) and memoised.
const RequestCard = React.memo(function RequestCard({ request }: { request: any }) {
  // Keyed on the ENUM values ('HOROSCOPE'), not the display labels ('Horoscope'). This was
  // matching against the labels while being called with request.fieldType, so EVERY badge fell
  // through to the grey default — while getRequestIcon() right below it switched on the enum
  // correctly, leaving a coloured icon sitting in a grey pill. That mismatch is most of why
  // these cards read as unfinished.
  const getRequestBadgeColor = (type: string) => {
    switch (String(type || '').toUpperCase()) {
      case 'HOROSCOPE':
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
      case 'MOBILE':
        return { backgroundColor: '#DBEAFE', color: '#2563EB' };
      case 'PROFILE_IMAGE':
        return { backgroundColor: '#F3E8FF', color: '#7C3AED' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

  // 'APPROVED' -> 'Approved'. The previous charAt(0).toUpperCase() + slice(1) was a no-op on an
  // already-uppercase enum, so members read "APPROVED" / "REJECTED" in SCREAMING_CASE.
  const getStatusLabel = (status: string) => {
    switch (String(status || 'PENDING').toUpperCase()) {
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Declined';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (String(status || '').toUpperCase()) {
      case 'APPROVED':
        return '#10B981';
      case 'REJECTED':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'HOROSCOPE':
        return <Star size={12} color="#D97706" />;
      case 'MOBILE':
        return <Phone size={12} color="#2563EB" />;
      case 'PROFILE_IMAGE':
        return <Eye size={12} color="#7C3AED" />;
      default:
        return null;
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const requestedDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - requestedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };



  return (
    <TouchableOpacity onPress={() => router.push(`/screens/ProfileDetail?userId=${request.requestedTo}`)} style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={{ position: 'relative' }}>
          {/* 60x60 slot — resizeMethod="resize" keeps Android from decoding the full-resolution
              profile photo into memory for every card in the list. */}
          <ImageNative
            source={request.profileImage ? { uri: request.profileImage } : DEFAULT_AVATAR}
            style={styles.profileImageRequestCard}
            resizeMode="cover"
            resizeMethod="resize"
          />
          {/* Gold trust shield — top-right corner, matches home carousel styling */}
          <View style={{ position: 'absolute', top: 4, right: 4 }}>
            <VerifiedBadges
              idVerified={request.idVerified}
              educationVerified={request.educationVerified}
              incomeVerified={request.incomeVerified}
              mode="compact"
              size="sm"
              color="gold"
            />
          </View>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.nameRequestCard}>
            {request.firstname} {request.lastname}
          </Text>
          <Text style={styles.age}>{request.age} years</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(request.status || 'pending') },
              ]}
            />
            <Text style={[styles.status, { color: getStatusColor(request.status || 'pending') }]}>
              {getStatusLabel(request.status)}
            </Text>
          </View>
        </View>
        <View style={styles.timeContainer}>
          <Clock size={14} color="#9CA3AF" />
          <Text style={styles.requestTime}>{getTimeAgo(request.requestedAt)}</Text>
        </View>
      </View>

      <View style={styles.requestTypesContainer}>
        <View style={styles.requestTypesRow}>
          {/* Left column */}
          <View style={styles.requestTypesLeft}>
            <Text style={styles.requestLabel}>Requested Access:</Text>
            <View style={styles.requestBadges}>
              {request.fieldType && (
                <View style={[styles.requestBadge, getRequestBadgeColor(request.fieldType)]}>
                  {getRequestIcon(request.fieldType)}
                  <Text
                    style={[
                      styles.requestBadgeText,
                      { color: getRequestBadgeColor(request.fieldType).color },
                    ]}
                  >
                    {request.fieldType === 'HOROSCOPE'
                      ? 'Horoscope'
                      : request.fieldType === 'MOBILE'
                        ? 'Mobile Number'
                        : 'Profile Photo'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Right column (button shown only if status is APPROVED) */}
          {request.status === 'APPROVED' && (
            <TouchableOpacity onPress={() => router.push(`/screens/ProfileDetail?userId=${request.requestedTo}`)} style={styles.viewProfileButton}>
              <Eye size={14} color="#1F7FE5" style={{ marginRight: 6 }} />
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>


      <View style={styles.profileDetails1}>
        <View style={styles.detailRow}>
          <Ionicons name="school-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{request.degree}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{request.Occupation}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{request.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{request.AnnualIncome}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const RequestsTab = ({ isActive }: { isActive: boolean }) => {
  const footerPad = useFooterClearance();
  const { userData } = useUserData();
  const popup = usePopup();
  const [wholeReceivedData, setWholeReceivedData] = useState<any[]>([]);
  const [receivedData, setreceivedData] = useState<any[]>([]);
  const [sentData, setsentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'sent' | 'received'>('sent');
  const [profilePhotoChecked, setProfilePhotoChecked] = useState(false);
  const [horoscopeChecked, setHoroscopeChecked] = useState(false);
  const [mobileNumberChecked, setMobileNumberChecked] = useState(false);
  // Drives a plain RN <Modal> (see the Filter Options block near the end of this component).
  //
  // This filter used to be a react-native-popup-menu <Menu>, and it left the Permissions tab
  // completely untappable: MenuProvider renders its backdrop INSIDE this TabView scene, the
  // scene stays mounted when you switch sub-tabs or footer tabs, and the backdrop outlived the
  // menu as an invisible full-screen layer swallowing every touch. Making the Menu `opened`-
  // controlled was tried first and did NOT fix it — the stranded backdrop is the provider's,
  // not the menu's. A Modal with visible={false} unmounts outright and cannot strand anything.
  const [filterOpen, setFilterOpen] = useState(false);

  // Close when this sub-tab stops being the active one.
  useEffect(() => {
    if (!isActive) setFilterOpen(false);
  }, [isActive]);

  // ...and when the whole screen loses focus (bottom-nav tab change).
  useFocusEffect(
    useCallback(() => {
      return () => setFilterOpen(false);
    }, [])
  );


  // This tab shows restricted-field ACCESS requests (mobile/horoscope/profile photo — see
  // RestrictedFieldRequest on the backend), not interest requests. handleAccept/handleDelete
  // previously called userApi.updateInterestRequestStatus / deleteInterestRequest with
  // item.interestId — but these items never have an interestId (they have requestId), so that
  // field was always undefined, producing "Failed to convert value... For input string:
  // \"undefined\"" from the backend on every reject/accept tap. Fixed to use the actual
  // restricted-field-request endpoint with the real id.
  //
  // Also used as the focus-triggered refetch (see useFocusEffect below) — this tab previously
  // only fetched once on mount via a plain useEffect, so visiting Permissions, switching to
  // another tab, and coming back showed stale data until a full app restart, same class of bug
  // already fixed for Received/Sent By You. showSpinner is false for refocus refreshes so
  // switching back in doesn't flash the loading skeleton over already-visible data.
  //
  // `stillWanted` lets the caller abort applying a response that arrived after the effect that
  // started it was torn down (stale-response guard, same pattern as app/(root)/(tabs)/index.tsx).
  const hasLoadedRef = useRef(false);
  const refreshRequestsData = useCallback(async (showSpinner: boolean = false, stillWanted: () => boolean = () => true) => {
    if (!userData.userId) {
      setError('User ID not found');
      return;
    }
    try {
      if (showSpinner) setLoading(true);
      const userId = userData.userId;
      const [sentResponse, receivedResponse] = await Promise.all([
        userApi.getRestrictedRequestsById(userId),
        userApi.getRestrictedRequestsToId(userId),
      ]);
      const sentProfiles = sentResponse.data?.data || [];
      // Every status is kept and PENDING is sorted to the top, so the inbox still reads as
      // "action needed first" while decided requests remain visible with an outcome chip.
      // Previously this filtered to PENDING only, so a request disappeared the instant it was
      // approved or rejected and the member had no record of what they had already decided.
      // The accept/reject buttons are hidden on decided rows (see PermissionRow), which is what
      // stops a decided card from looking like it still needs action.
      const STATUS_ORDER: Record<string, number> = { PENDING: 0, APPROVED: 1, REJECTED: 2 };
      const receivedProfiles = [...(receivedResponse.data?.data || [])].sort(
        (a: any, b: any) =>
          (STATUS_ORDER[a?.status] ?? 3) - (STATUS_ORDER[b?.status] ?? 3)
      );
      if (!stillWanted()) return;
      setWholeReceivedData(receivedProfiles);
      setreceivedData(receivedProfiles);
      setsentData(sentProfiles);
      setError(null);
    } catch (err: any) {
      if (!stillWanted()) return;
      console.error('Error loading requests:', err);
      setError('Failed to load requests: ' + (err.message || 'Unknown error'));
    } finally {
      hasLoadedRef.current = true;
      if (stillWanted()) setLoading(false);
    }
  }, [userData.userId]);

  // `wholeReceivedData.length`/`sentData.length` were read from the focus callback's closure,
  // which is memoised on [refreshRequestsData] and therefore never saw anything but the initial
  // empty arrays — so showSpinner was in practice always true and the skeleton flashed on every
  // refocus. A ref reads the real "have we loaded once" state. `isActive` keeps this from firing
  // while the user is on one of the other two sub-tabs.
  useFocusEffect(
    useCallback(() => {
      if (!isActive) return;
      let isStillActive = true;
      refreshRequestsData(!hasLoadedRef.current, () => isStillActive);
      return () => { isStillActive = false; };
    }, [refreshRequestsData, isActive])
  );

  const handleAccept = useCallback(async (item: any) => {
    try {
      const res = await userApi.updateRestrictedFieldStatus(btoa(item.requestId.toString()), 'APPROVED');
      if (res.data?.code === 200) {
        popup.success('Approved', `${item.firstname} can now view your ${item.fieldType === 'PROFILE_IMAGE' ? 'profile photo' : item.fieldType?.toLowerCase()}.`);
        await refreshRequestsData();
      } else {
        popup.error('Failed', res.data?.message || 'Could not approve the request.');
      }
    } catch (err: any) {
      console.error('Error accepting request:', err);
      popup.error('Failed', 'Could not approve the request. Please try again.');
    }
  }, [popup, refreshRequestsData]);

  const handleDelete = useCallback((item: any) => {
    popup.confirm(
      'Decline this request?',
      `${item.firstname} ${item.lastname} will not be able to view your ${item.fieldType === 'PROFILE_IMAGE' ? 'profile photo' : item.fieldType?.toLowerCase()}.`,
      async () => {
        try {
          const res = await userApi.updateRestrictedFieldStatus(btoa(item.requestId.toString()), 'REJECTED');
          if (res.data?.code === 200) {
            await refreshRequestsData();
          } else {
            popup.error('Failed', res.data?.message || 'Could not decline the request.');
          }
        } catch (err: any) {
          console.error('Error declining request:', err);
          popup.error('Failed', 'Could not decline the request. Please try again.');
        }
      },
      'Decline',
      'Cancel'
    );
  }, [popup, refreshRequestsData]);

  const handleOpenProfile = useCallback((userId: number) => {
    router.push(`/screens/ProfileDetail?userId=${userId}`);
  }, []);

  const renderPermissionItem = useCallback(({ item }: { item: any }) => (
    <PermissionRow item={item} onOpen={handleOpenProfile} onAccept={handleAccept} onDelete={handleDelete} />
  ), [handleOpenProfile, handleAccept, handleDelete]);

  // Filtering is DERIVED from the three checkbox states, not pushed imperatively from each
  // onChange. The previous handlePrintSelected({ mobileNumber: val }) form read the OTHER two
  // values out of the render closure, so a toggle could compute against a stale value —
  // unchecking every box still left the first-checked filter applied ("uncheck everything but
  // only mobile shows"). An effect keyed on all three can't read a stale value, and it also
  // re-applies the current filter when wholeReceivedData refreshes, which the old form dropped.
  useEffect(() => {
    const noneSelected = !profilePhotoChecked && !horoscopeChecked && !mobileNumberChecked;
    if (noneSelected) {
      setreceivedData(wholeReceivedData);
      return;
    }
    setreceivedData(
      wholeReceivedData.filter((item) => {
        const type = item.fieldType?.toUpperCase();
        return (
          (profilePhotoChecked && type === 'PROFILE_IMAGE') ||
          (horoscopeChecked && type === 'HOROSCOPE') ||
          (mobileNumberChecked && type === 'MOBILE')
        );
      })
    );
  }, [profilePhotoChecked, horoscopeChecked, mobileNumberChecked, wholeReceivedData]);


  if (loading) {
    return <RequestLoadingSkeleton count={4} />;
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{error}</Text>
      </View>
    );
  }



  return (
    <>

      <View style={styles.container}>
        <View style={styles.filterContainerReq}>
          {['sent', 'received'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButtonReq,
                selectedFilter === filter && styles.filterButtonActiveReq,
              ]}
              onPress={() => setSelectedFilter(filter as 'sent' | 'received')}
            >
              <Text style={[
                styles.filterButtonTextReq,
                selectedFilter === filter && styles.filterButtonTextActiveReq,
              ]}>
                {filter === 'sent' ? 'Request Received' : 'Request Sent'}
                {/* {getStatusCounts()[filter as 'sent' | 'received'] > 0 && (
                <Text style={styles.filterBadge}>
                  {getStatusCounts()[filter as 'sent' | 'received']}
                </Text>
              )} */}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {selectedFilter === 'sent' && (
          <>

            <View style={styles.titleRow}>
              {/* Left Section */}
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Info Access Requests</Text>
                <Text style={styles.subtitleText}>Members requesting to view your details</Text>
              </View>

              {/* Right Icon Trigger */}
              {/* <TouchableOpacity
        style={styles.filterIcon}
      >
        <Ionicons name="options-outline" size={24} color="black" />
      </TouchableOpacity> */}

              {/* Plain trigger + RN <Modal> below, deliberately NOT react-native-popup-menu.
                  That library's MenuProvider renders its backdrop INSIDE this TabView scene,
                  which stays mounted — so the backdrop outlived the menu and swallowed every
                  tap on this tab. A Modal with visible={false} unmounts outright and cannot
                  leave anything behind. */}
              <TouchableOpacity style={styles.filterIcon} onPress={() => setFilterOpen(true)}>
                <Ionicons name="options-outline" size={25} color="black" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={receivedData}
              keyExtractor={(item: any) => item.requestId.toString()}
              contentContainerStyle={[styles.listContent, { paddingBottom: footerPad }]}
              windowSize={5}
              initialNumToRender={6}
              maxToRenderPerBatch={4}
              removeClippedSubviews={true}
              renderItem={renderPermissionItem}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No Interests Found
                  </Text>
                </View>
              )}
            />

      {/* Filter Options — plain Modal, so it can never strand a touch-blocking layer. */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFilterOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(15,23,36,0.35)' }}
          activeOpacity={1}
          onPress={() => setFilterOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { }}
            style={{
              position: 'absolute', top: 96, right: 16,
              backgroundColor: '#fff', borderRadius: 16,
              paddingVertical: 14, paddingHorizontal: 18, minWidth: 210,
              shadowColor: '#0f1724', shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.16, shadowRadius: 20, elevation: 8,
            }}
          >
            <Text style={styles.menuTitle}>Filter Options</Text>
            <View style={{ marginTop: 12 }}>
              <Checkbox
                value="profilePhoto"
                isChecked={profilePhotoChecked}
                onChange={(val) => setProfilePhotoChecked(val)}
                size="sm" marginBottom={3} colorScheme="amber"
                _checked={{ bg: 'amber.500', borderColor: 'amber.500' }}
              >
                <Text>Profile Photo</Text>
              </Checkbox>

              <Checkbox
                value="horoscope"
                isChecked={horoscopeChecked}
                onChange={(val) => setHoroscopeChecked(val)}
                size="sm" marginBottom={3} colorScheme="amber"
                _checked={{ bg: 'amber.500', borderColor: 'amber.500' }}
              >
                <Text>Horoscope</Text>
              </Checkbox>

              <Checkbox
                value="mobileNumber"
                isChecked={mobileNumberChecked}
                onChange={(val) => setMobileNumberChecked(val)}
                size="sm" colorScheme="amber"
                _checked={{ bg: 'amber.500', borderColor: 'amber.500' }}
              >
                <Text>Mobile Number</Text>
              </Checkbox>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

          </>
        )}

        {selectedFilter === 'received' && (
          <View style={styles.containerRequestCard}>
            {/* <View style={styles.header}>
      <Text style={styles.headerTitle}> Request Sent</Text>
      <Text style={styles.headerSubtitle}>
        {receivedData.length} request{receivedData.length !== 1 ? 's' : ''} received
      </Text>
    </View> */}

            {sentData.length > 0 ? (
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: footerPad }]}
              >
                {sentData.map((request) => (
                  <RequestCard key={request.requestId} request={request} />
                ))}

              </ScrollView>
            ) : (
              <View style={{ padding: 20 }}>
                <Text style={{ textAlign: 'center', color: '#6B7280', fontSize: 16 }}>
                  No Interests Found
                </Text>
              </View>
            )}
          </View>
        )}

      </View>
    </>
  );
};

const ShortlistedTab = () => {
  const { userData } = useUserData();
  const [data, setData] = useState<ReceivedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async (shortlistedId: number) => {
    try {
      await userApi.deleteShortlistedProfile(shortlistedId);
      // Refresh data after successful removal
      if (!userData.userId) {
        setError('User ID not found');
        return;
      }
      const response = await userApi.getShortlistedMailbox(userData.userId);
      if (response.data.code === 200) {
        setData(response.data.data);
      } else {
        setError('Failed to refresh shortlisted data');
      }
    } catch (error) {
      setError('Error removing profile');
    }
  };

  useEffect(() => {
    const loadShortlistedData = async () => {
      try {
        if (!userData.userId) {
          setError('User ID not found');
          return;
        }
        const response = await userApi.getShortlistedMailbox(userData.userId);
        if (response.data.code === 200) {
          setData(response.data.data);
        } else {
          setError('No Shortlisted Record Found');
        }
      } catch (error) {
        setError('Error loading shortlisted data');
      } finally {
        setLoading(false);
      }
    };

    loadShortlistedData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
        <ScrollView style={{ padding: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <NBHStack key={i} space={3} alignItems="center" py={3} borderBottomWidth={1} borderColor="gray.200">
              <Skeleton size={12} rounded="full" />
              <VStack flex={1} space={2}>
                <Skeleton h={4} w="50%" rounded="sm" />
                <Skeleton h={3} w="80%" rounded="sm" />
              </VStack>
              <Skeleton size={10} rounded="full" />
            </NBHStack>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <ScrollView className='mb-3'>
        <View className='ml-5 mt-2 mb-2'>
          <NBText fontSize={'lg'} fontWeight={'semibold'} fontFamily="Rubik-Medium"> Shortlisted</NBText>
        </View>

        <View className='mb-10'>
          {data.map(member => (
            <VStack key={member.userId} space={2} alignItems="center">
              <Center w="100%" h="75" rounded="md">
                <Stack direction="row" m={5} space={3} alignItems="center">
                  {/* Profile Picture */}
                  <Center shadow={3}>
                    <NBImage
                      source={member.profileImage ? {
                        uri: member.profileImage,
                      } : require('../../../assets/images/defaultAvatar.png')}
                      alt="Img"
                      size="50px"
                      borderRadius="full"
                    />
                  </Center>

                  {/* Profile Details */}
                  <VStack flex={1} space={1}>
                    <NBHStack alignItems="center" space={1}>
                      <NBText fontSize="md" fontWeight="semibold" fontFamily="Rubik-Medium" isTruncated maxWidth="85%">
                        {member.firstName} {member.lastName}
                      </NBText>
                      <VerifiedBadges idVerified={member.idVerified} educationVerified={member.educationVerified} incomeVerified={member.incomeVerified} mode="compact" size="sm" />
                    </NBHStack>
                    <NBText fontSize="sm" color="gray.500">{member.location}, {member.degree}, {member.annualIncome}, {member.occupation}</NBText>
                  </VStack>

                  {/* Remove Button with Icon */}
                  <View style={styles.iconActions}>
                    <TouchableOpacity
                      style={{
                        borderWidth: 1,
                        borderColor: '#ff0000',
                        borderRadius: 25,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      onPress={() => handleRemove(member.shortlistedId)}
                    >
                      <Ionicons name="close" size={20} color="#ff0000" />
                    </TouchableOpacity>
                  </View>
                </Stack>
              </Center>
              <Divider my="1" _light={{
                bg: "gray.200"
              }} _dark={{
                bg: "gray.50"
              }} />
            </VStack>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MailBox = () => {
  const layout = useWindowDimensions();
  const { initialTab } = useLocalSearchParams<{ initialTab?: string }>();
  const [index, setIndex] = useState(0);

  const routes = useMemo(() => [
    { key: 'received', title: 'Received' },
    { key: 'sent', title: 'Sent By You' },
    { key: 'request', title: 'Permissions' },
  ], []);

  // Deep-link support for QuickAccessFAB ("Permission Requests" tile)
  useEffect(() => {
    if (!initialTab) return;
    const targetIndex = routes.findIndex((r) => r.key === initialTab);
    if (targetIndex >= 0) setIndex(targetIndex);
  }, [initialTab, routes]);

  // SceneMap can't forward extra props, and the scenes need to know whether they are the SELECTED
  // sub-tab (their useFocusEffect only sees this whole screen's focus, so all three used to fetch
  // — 6 API calls — every time the Request tab was opened). Rendering the scenes by hand lets each
  // one be told, and lets react-native-tab-view's `lazy` keep the other two from mounting at all
  // until the user actually swipes to them.
  const activeKey = routes[index]?.key;
  const renderScene = useCallback(({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'received':
        return <ReceivedTab isActive={activeKey === 'received'} />;
      case 'sent':
        return <SentTab isActive={activeKey === 'sent'} />;
      case 'request':
        return <RequestsTab isActive={activeKey === 'request'} />;
      default:
        return null;
    }
  }, [activeKey]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#d0dfeb' }} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          lazy
          renderLazyPlaceholder={({ route }) =>
            route.key === 'request' ? <RequestLoadingSkeleton count={4} /> : <MailboxLoadingSkeleton count={3} />
          }
          renderTabBar={props => (
            <TabBar
              {...props}
              style={styles.tabBar}
              indicatorStyle={styles.indicator}
              activeColor="#000"
              inactiveColor="#888"
              tabStyle={styles.tabStyle}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  errorText: {
    color: '#ff3b30',
    marginTop: 10,
    textAlign: 'center',
  },
  premiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  premiumContent: {
    alignItems: 'center',
    padding: 20,
  },
  premiumTitle: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    color: '#1d4ed8',
    marginTop: 20,
  },
  premiumText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 20,
  },
  upgradeButton: {
    backgroundColor: '#ec4899',
    padding: 12,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
  },
  tabStyle: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#dde8f1'
  },
  filterIconContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  filterIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    // height: '%',
    marginTop: 10,
  },
  // Clears the floating VVMFooterNav (absolute-positioned, ~68px + safe-area inset) so the
  // last item in a list isn't hidden behind it — was previously defined but never actually
  // wired up to any FlatList's contentContainerStyle, and the padding was too small anyway.
  listContent: {
    paddingBottom: 100,
  },
  // Outcome chip shown in place of the accept/reject buttons once a permission request has
  // been decided, so the row stays in the inbox as a record instead of vanishing.
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.2,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    position: 'relative',
    overflow: 'hidden',
  },
  profileImageLabel: {
    position: 'absolute',
    top: 14,
    right: 0,
    backgroundColor: 'red',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  profileImageLabelText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
  },
  profileCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: 150,
    justifyContent: 'flex-end',
    padding: 16,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: '#fff',
  },
  profileDetails: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  filterBadge: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#1F7FE5',
    paddingHorizontal: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  tabBar: {
    backgroundColor: '#e8eef5',
    borderBottomWidth: 1,
    borderBottomColor: '#dde4ed',
  },
  indicator: {
    backgroundColor: '#1F7FE5',
    height: 2.5,
  },
  // matchCard: {
  //   paddingHorizontal: 16,
  //   paddingVertical: 12,
  //   borderRadius: 16,
  //   position: 'relative',
  // },
  // profileImageLabel: {
  //   position: 'absolute',
  //   top: 12,
  //   right: 16,
  //   backgroundColor: '#2196F3',
  //   paddingHorizontal: 12,
  //   paddingVertical: 4,
  //   borderRadius: 20,
  //   zIndex: 10,
  // },
  // profileImageLabelText: {
  //   color: 'white',
  //   fontSize: 12,
  //   fontFamily: 'Rubik-Medium',
  // },
  // profileImageLabel: {
  //   position: 'absolute',
  //   top: 12,
  //   right: 16,
  //   backgroundColor: '#2196F3',
  //   paddingHorizontal: 12,
  //   paddingVertical: 4,
  //   borderRadius: 20,
  //   zIndex: 10,
  // },
  // profileImageLabelText: {
  //   color: 'white',
  //   fontSize: 12,
  //   fontFamily: 'Rubik-Medium',
  // },
  imageBackground: {
    height: 260,
    borderRadius: 16,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 16,
    height: 260,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,

  },
  matchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 16,
  },
  infoText: {
    maxWidth: '70%',
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    marginBottom: 4,
  },
  occupation: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
  },
  iconActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  filterCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    // paddingVertical: 12,
  },
  titleContainer: {
    flexShrink: 1,
  },
  // titleText: {
  //   fontSize: 16,
  //   fontFamily: 'Rubik-Medium',
  //   color: '#000',
  // },
  subtitleText: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
    marginBottom: 10,
  },
  titleText: {
    color: '#000',
    marginTop: 10,
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    marginBottom: 4,
    // fontFamily: 'Rubik-Medium',

  },
  filterContainerReq: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 5,
    // backgroundColor: '#f5f5f5',
    // borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginTop: 10,
  },
  filterButtonReq: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: 'rgba(15,35,70,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActiveReq: {
    backgroundColor: '#1F7FE5',
    borderColor: '#1F7FE5',
  },
  filterButtonTextReq: {
    color: '#333',
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
  },
  filterButtonTextActiveReq: {
    color: '#fff',
  },
  menuContent: {
    padding: 8,
    // width: 250,
  },
  // checkbox: {
  //   marginBottom: 12,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   gap: 8,
  // },
  menuTitle: {
    fontFamily: 'Rubik-Bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Rubik-Bold',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eef2f7',
    // Blue-tinted shadow matching the rest of the app's cards, rather than a neutral black
    // drop that reads as a generic slab against the light gradient background.
    shadowColor: '#1F7FE5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileImageRequestCard: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  nameRequestCard: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  age: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  status: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  timeContainer: {
    alignItems: 'center',
  },
  requestTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  requestTypesContainer: {
    marginBottom: 16,
  },
  requestLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  requestBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8, // this ensures spacing if you're using older RN versions
  },
  requestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
  },
  requestBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  profileDetails1: {
    rowGap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
  },
  containerRequestCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    marginTop: 10,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    // paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: '#1F2937',
    // marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  requestTypesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  requestTypesLeft: {
    flex: 1,
  },

  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    // #1F7FE5 is the iOS system blue; the app's accent is #1F7FE5 everywhere else.
    borderColor: 'rgba(31,127,229,0.28)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#eef5fd',
  },

  viewProfileText: {
    color: '#1F7FE5',
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
  },

});


export default MailBox;
