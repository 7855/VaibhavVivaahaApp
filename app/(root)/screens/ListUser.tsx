import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    RefreshControl,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';

import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { buildUpgradeAction, upgradeMessage } from '../utils/upgradeNavigation';
import VerifiedBadges from '../../../components/VerifiedBadges';

type TabType = 'viewed' | 'connection' | 'shortlisted' | 'whoShortlistedMe' | 'whoLikedMe' | 'revealedContacts';

interface ShortlistedProfile {
    userId: number;
    firstName: string;
    lastName: string;
    profileImage: string;
    age: number;
    annualIncome: string;
    degree: string;
    location: string;
    occupation: string;
    shortlistedId: number;
    interestId?: number;
}

interface ViewedProfile {
    userId: number;
    firstName: string;
    lastName: string;
    profileImage: string;
    age: number;
    annualIncome: string;
    degree: string;
    email: string;
    gender: string;
    location: string;
    memberId: string;
    mobile: string;
    occupation: string;
    viewedAt: string;
    likedAt?: string;
    revealedAt?: string;
}

type ListItem = ShortlistedProfile | ViewedProfile;

const TAB_META: Record<TabType, {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyText: string;
    icon: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
    accent: string;
}> = {
    viewed: {
        title: 'Who Viewed You',
        subtitle: 'People who recently visited your profile',
        emptyTitle: 'No views yet',
        emptyText: 'When someone views your profile, they\'ll show up here.',
        icon: 'eye',
        gradient: ['#9c4040', '#7a2d2d'],
        accent: '#9c4040',
    },
    connection: {
        title: 'Your Connections',
        subtitle: 'People you\'ve matched with',
        emptyTitle: 'No connections yet',
        emptyText: 'Send interests to profiles you like. Once they accept, you\'ll see them here.',
        icon: 'people',
        gradient: ['#9c4040', '#7a2d2d'],
        accent: '#9c4040',
    },
    shortlisted: {
        title: 'Shortlisted Profiles',
        subtitle: 'Your saved favourites',
        emptyTitle: 'No shortlisted profiles',
        emptyText: 'Tap the heart on any profile to save it here.',
        icon: 'heart',
        gradient: ['#9c4040', '#7a2d2d'],
        accent: '#9c4040',
    },
    whoShortlistedMe: {
        title: 'Who Shortlisted You',
        subtitle: 'People who saved your profile',
        emptyTitle: 'No one yet',
        emptyText: 'When someone shortlists your profile, they\'ll appear here.',
        icon: 'bookmark',
        gradient: ['#9c4040', '#7a2d2d'],
        accent: '#ef4444',
    },
    whoLikedMe: {
        title: 'Who Liked You',
        subtitle: 'People who liked your profile',
        emptyTitle: 'No likes yet',
        emptyText: 'When someone likes your profile, they\'ll show up here.',
        icon: 'heart',
        gradient: ['#9c4040', '#7a2d2d'],
        accent: '#ec4899',
    },
    revealedContacts: {
        title: 'Contact Reveals',
        subtitle: 'Profiles whose contact info you\'ve viewed',
        emptyTitle: 'No reveals yet',
        emptyText: 'Profiles whose contact you reveal will show up here.',
        icon: 'call',
        gradient: ['#9c4040', '#7a2d2d'],
        accent: '#1F7FE5',
    },
};

// Only these two endpoints are actually paginated on the backend (`/mailbox/whoShortlistedMe` and
// `/mailbox/shortlisted`, both PaginatedResultResponse with a default size of 10). `viewed`,
// `whoLikedMe`, `revealedContacts` and `connection` return a plain ResultResponse with the full
// list, so there is nothing to page through there — see the report notes.
const PAGINATED_TYPES: TabType[] = ['whoShortlistedMe', 'shortlisted'];
const PAGE_SIZE = 20;

const rowKey = (item: ListItem) => `${(item as any).shortlistedId ?? (item as any).interestId ?? item.userId}`;

// Extracted from the inline `renderCard` so FlatList cells stop re-rendering whenever anything
// else in the screen changes (a page append, the refresh spinner, an upgrade check).
const ProfileRow = React.memo(function ProfileRow({
    item,
    index,
    type,
    meta,
    onOpen,
    onRemove,
}: {
    item: ListItem;
    index: number;
    type: TabType;
    meta: (typeof TAB_META)[TabType];
    onOpen: (userId: number) => void;
    onRemove: (item: ShortlistedProfile) => void;
}) {
    const viewedAt = (item as ViewedProfile).viewedAt;
    const likedAt = (item as ViewedProfile).likedAt;
    const revealedAt = (item as ViewedProfile).revealedAt;
    const mobile = (item as ViewedProfile).mobile;
    const meta2 = [
        item.age ? `${item.age} yrs` : null,
        item.location,
        (item as ShortlistedProfile).occupation,
    ].filter(Boolean).join(' · ');

    return (
        <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => onOpen(item.userId)}
            style={[styles.card, index === 0 && { marginTop: 8 }]}
        >
            {/* Avatar with ring */}
            <View style={styles.avatarWrap}>
                <LinearGradient
                    colors={meta.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarRing}
                >
                    <Image
                        source={
                            item.profileImage
                                ? { uri: item.profileImage }
                                : require('../../../assets/images/defaultAvatar.png')
                        }
                        style={styles.avatar}
                        resizeMode="cover"
                        resizeMethod="resize"
                    />
                </LinearGradient>
            </View>

            {/* Info */}
            <View style={styles.info}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.name, { flexShrink: 1 }]} numberOfLines={1}>
                        {item.firstName} {item.lastName}
                    </Text>
                    <View style={{ marginLeft: 6 }}>
                        <VerifiedBadges
                            idVerified={(item as any).idVerified}
                            educationVerified={(item as any).educationVerified}
                            incomeVerified={(item as any).incomeVerified}
                            mode="compact"
                            size="sm"
                        />
                    </View>
                </View>
                {meta2 ? (
                    <Text style={styles.meta} numberOfLines={1}>
                        {meta2}
                    </Text>
                ) : null}
                {type === 'revealedContacts' && mobile ? (
                    <View style={styles.chipsRow}>
                        <View style={[styles.chip, { backgroundColor: '#dfecfb' }]}>
                            <Ionicons name="call" size={10} color="#1F7FE5" />
                            <Text style={[styles.chipText, { color: '#1862b8', fontFamily: 'Rubik-Medium' }]} numberOfLines={1}>
                                {mobile}
                            </Text>
                        </View>
                    </View>
                ) : (item as ShortlistedProfile).degree ? (
                    <View style={styles.chipsRow}>
                        <View style={styles.chip}>
                            <Ionicons name="school-outline" size={10} color="#6b7280" />
                            <Text style={styles.chipText} numberOfLines={1}>
                                {(item as ShortlistedProfile).degree}
                            </Text>
                        </View>
                        {(item as ShortlistedProfile).annualIncome ? (
                            <View style={styles.chip}>
                                <Ionicons name="cash-outline" size={10} color="#6b7280" />
                                <Text style={styles.chipText} numberOfLines={1}>
                                    {(item as ShortlistedProfile).annualIncome}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}
                {type === 'viewed' && viewedAt ? (
                    <Text style={styles.timestamp}>
                        <Ionicons name="time-outline" size={10} color="#9ca3af" />
                        {'  '}
                        {dayjs(viewedAt).format('DD MMM, hh:mm A')}
                    </Text>
                ) : null}
                {type === 'whoLikedMe' && likedAt ? (
                    <Text style={styles.timestamp}>
                        <Ionicons name="time-outline" size={10} color="#9ca3af" />
                        {'  '}
                        {dayjs(likedAt).format('DD MMM, hh:mm A')}
                    </Text>
                ) : null}
                {type === 'revealedContacts' && revealedAt ? (
                    <Text style={styles.timestamp}>
                        <Ionicons name="time-outline" size={10} color="#9ca3af" />
                        {'  '}
                        Revealed {dayjs(revealedAt).format('DD MMM, hh:mm A')}
                    </Text>
                ) : null}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                {type === 'shortlisted' ? (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onRemove(item as ShortlistedProfile);
                        }}
                        style={styles.removeBtn}
                    >
                        <Ionicons name="close" size={16} color="#dc2626" />
                    </TouchableOpacity>
                ) : null}
                <View style={[styles.viewBtn, { backgroundColor: meta.accent }]}>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
            </View>
        </TouchableOpacity>
    );
});

export default function ListUser() {
    const popup = usePopup();
    const { subscriptionData } = useSubscription() || {};
    const { type: urlType } = useLocalSearchParams();

    // Lazy-init from URL param to prevent double fetch on mount
    const initialType: TabType =
        (typeof urlType === 'string' && ['viewed', 'connection', 'shortlisted', 'whoShortlistedMe', 'whoLikedMe', 'revealedContacts'].includes(urlType))
            ? (urlType as TabType)
            : 'viewed';

    const [type, setType] = useState<TabType>(initialType);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<ListItem[]>([]);
    const [upgradeRequired, setUpgradeRequired] = useState(false);
    // Paging state. `whoShortlistedMe` in particular is a paid Gold+ feature that used to call the
    // endpoint with no page args at all — the backend defaults to size=10, so the list was silently
    // capped at 10 people forever with no "load more" and no hint that anything was missing.
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const pageRef = useRef(0);
    // Guards against onEndReached firing repeatedly while a page request is already in flight.
    const loadingMoreRef = useRef(false);

    const meta = TAB_META[type];

    const loadProfileData = useCallback(async (
        showSpinner: boolean = true,
        opts?: { append?: boolean; page?: number },
    ) => {
        const append = opts?.append === true;
        const pageToLoad = opts?.page ?? 0;
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                setError('User ID not found');
                return;
            }

            if (showSpinner) setLoading(true);
            setError('');
            if (!append) {
                setUpgradeRequired(false);
                // Only blank the list when we're switching tabs — doing it on pull-to-refresh made
                // the visible rows vanish and the empty state flash until the response landed.
                if (showSpinner) setData([]);
            }

            const handleResponse = (response: any, emptyMessage: string) => {
                const code = response?.data?.code;
                if (code === 200) {
                    const rows: ListItem[] = response.data.data || [];
                    setData((prev) => (append ? [...prev, ...rows] : rows));

                    // Only the paginated endpoints return paginationData; everything else returns
                    // the complete list in one shot, so there is nothing more to fetch.
                    const pg = response.data.paginationData;
                    if (PAGINATED_TYPES.includes(type) && pg) {
                        const current = typeof pg.currentPage === 'number' ? pg.currentPage : pageToLoad;
                        const total = typeof pg.totalPages === 'number' ? pg.totalPages : 0;
                        pageRef.current = current;
                        setHasMore(current + 1 < total);
                    } else {
                        setHasMore(false);
                    }
                } else if (code === 403 || response?.data?.message === 'PLAN_UPGRADE_REQUIRED') {
                    setUpgradeRequired(true);
                    setHasMore(false);
                } else if (code === 404) {
                    // Empty state — not an error
                    setHasMore(false);
                } else {
                    setError(response?.data?.message || emptyMessage);
                    setHasMore(false);
                }
            };

            if (type === 'viewed') {
                const response = await userApi.getProfileViewers(userId);
                handleResponse(response, 'Failed to load viewers');
            } else if (type === 'connection') {
                const response = await userApi.getAcceptedInterestRequests(userId);
                handleResponse(response, 'Failed to load connections');
            } else if (type === 'whoShortlistedMe') {
                const response = await userApi.getWhoShortlistedMe(userId, pageToLoad, PAGE_SIZE);
                handleResponse(response, 'Failed to load who shortlisted you');
            } else if (type === 'whoLikedMe') {
                const response = await userApi.getWhoLikedMe(userId);
                handleResponse(response, 'Failed to load who liked you');
            } else if (type === 'revealedContacts') {
                const response = await userApi.getRevealedContacts(userId);
                handleResponse(response, 'Failed to load revealed contacts');
            } else {
                const response = await userApi.getShortlistedMailbox(userId, pageToLoad, PAGE_SIZE);
                handleResponse(response, 'Failed to load shortlisted profiles');
            }
        } catch (e: any) {
            console.error('Error:', e);
            const status = e?.response?.data?.code;
            const message = e?.response?.data?.message;
            if (status === 403 || message === 'PLAN_UPGRADE_REQUIRED') {
                setUpgradeRequired(true);
            } else {
                setError('Error loading data');
            }
            setHasMore(false);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
            loadingMoreRef.current = false;
        }
    }, [type]);

    useEffect(() => {
        pageRef.current = 0;
        setHasMore(false);
        loadProfileData();
    }, [loadProfileData]);

    const handleLoadMore = useCallback(() => {
        if (!hasMore || loadingMoreRef.current || loading || refreshing) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        loadProfileData(false, { append: true, page: pageRef.current + 1 });
    }, [hasMore, loading, refreshing, loadProfileData]);

    // Both handlers are useCallback'd because they feed ProfileRow's props — without stable
    // identities the React.memo above would never actually prevent a re-render.
    const handleRemove = useCallback((item: ShortlistedProfile) => {
        popup.confirm(
            'Remove from shortlist?',
            `${item.firstName} ${item.lastName} will be removed from your shortlisted profiles.`,
            async () => {
                try {
                    const response = await userApi.deleteShortlistedProfile(item.shortlistedId);
                    if (response?.data?.code === 200) {
                        setData((prev) =>
                            (prev as ShortlistedProfile[]).filter((m) => m.shortlistedId !== item.shortlistedId)
                        );
                        popup.success('Removed', 'Profile removed from your shortlist.');
                    } else {
                        popup.error('Remove failed', response?.data?.message || 'Please try again.');
                    }
                } catch (_) {
                    popup.error('Remove failed', 'Network error. Please try again.');
                }
            },
            'Remove',
            'Cancel'
        );
    }, [popup]);

    const openProfile = useCallback((userId: number) => {
        router.push({
            pathname: '/screens/ProfileDetail',
            params: { userId: userId.toString(), from: type },
        });
    }, [type]);

    // Renders through the memoized ProfileRow so a page append / refresh spinner / upgrade check
    // no longer re-renders every visible row. Handlers are stable, so memoization actually holds.
    const renderCard = useCallback(
        ({ item, index }: { item: ListItem; index: number }) => (
            <ProfileRow
                item={item}
                index={index}
                type={type}
                meta={meta}
                onOpen={openProfile}
                onRemove={handleRemove}
            />
        ),
        [type, meta, openProfile, handleRemove],
    );

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <Stack.Screen options={{ title: meta.title, headerBackTitle: '' }} />
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Subtitle + count row (the back button + title live in the default header) */}
            <View style={styles.subHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerSubtitle}>{meta.subtitle}</Text>
                </View>
                {data.length > 0 ? (
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{data.length}</Text>
                    </View>
                ) : null}
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={meta.accent} />
                    <Text style={styles.loadingText}>Loading {meta.title.toLowerCase()}...</Text>
                </View>
            ) : upgradeRequired ? (
                <View style={styles.centerState}>
                    <LinearGradient
                        colors={['#fef3c7', '#fde68a']}
                        style={styles.upgradeIcon}
                    >
                        <MaterialCommunityIcons name="crown" size={46} color="#b8860b" />
                    </LinearGradient>
                    <Text style={styles.upgradeTitle}>Premium Feature</Text>
                    <Text style={styles.upgradeSubtitle}>
                        {type === 'viewed'
                            ? upgradeMessage('see who has viewed your profile', 'Silver')
                            : type === 'whoLikedMe'
                                ? upgradeMessage('see who has liked your profile', 'Starter')
                                : type === 'connection'
                                    ? 'Upgrade to access your matched connections and chat with them.'
                                    : 'Upgrade your plan to unlock this feature.'}
                    </Text>
                    <TouchableOpacity
                        onPress={buildUpgradeAction({
                            planTitle: subscriptionData?.planTitle,
                            featureName: type === 'viewed' ? 'Who Viewed You' : type === 'whoLikedMe' ? 'Who Liked You' : type === 'connection' ? 'Connections' : 'This Feature',
                            minPlan: type === 'viewed' ? 'Silver' : type === 'whoLikedMe' ? 'Starter' : undefined,
                        })}
                        activeOpacity={0.88}
                        style={styles.upgradeBtnWrap}
                    >
                        <LinearGradient
                            colors={['#9c4040', '#7a2d2d']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.upgradeBtn}
                        >
                            <MaterialCommunityIcons name="crown" size={16} color="#fff" />
                            <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : error ? (
                <View style={styles.centerState}>
                    <View style={styles.errorIcon}>
                        <Ionicons name="alert-circle" size={44} color="#ef4444" />
                    </View>
                    <Text style={styles.errorTitle}>Something went wrong</Text>
                    <Text style={styles.errorSubtitle}>{error}</Text>
                    <TouchableOpacity onPress={() => loadProfileData()} style={styles.retryBtn}>
                        <Ionicons name="refresh" size={14} color="#9c4040" />
                        <Text style={styles.retryBtnText}>Try again</Text>
                    </TouchableOpacity>
                </View>
            ) : data.length === 0 ? (
                <View style={styles.centerState}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name={meta.icon} size={48} color="#d1d5db" />
                    </View>
                    <Text style={styles.emptyTitle}>{meta.emptyTitle}</Text>
                    <Text style={styles.emptySubtitle}>{meta.emptyText}</Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item, index) => `${rowKey(item)}-${index}`}
                    renderItem={renderCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color={meta.accent} />
                            </View>
                        ) : null
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                // Refresh restarts from page 0 — without this, a refresh after
                                // paging would keep appending onto the already-loaded rows.
                                pageRef.current = 0;
                                loadProfileData(false, { append: false, page: 0 });
                            }}
                            tintColor={meta.accent}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },

    subHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
        backgroundColor: '#f9fafb',
    },
    headerSubtitle: { fontSize: 12, color: '#6b7280' },
    countBadge: {
        backgroundColor: '#9c4040',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 28,
        alignItems: 'center',
    },
    countText: { color: '#fff', fontSize: 12, fontFamily: 'Rubik-Bold' },

    listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

    footerLoader: { paddingVertical: 18, alignItems: 'center' },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    avatarWrap: {},
    avatarRing: {
        width: 66,
        height: 66,
        borderRadius: 33,
        padding: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 61,
        height: 61,
        borderRadius: 30.5,
        backgroundColor: '#e5e7eb',
        borderWidth: 2,
        borderColor: '#fff',
    },
    info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    name: { fontSize: 15, fontFamily: 'Rubik-Bold', color: '#111' },
    meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    chipsRow: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginRight: 4,
        maxWidth: 120,
    },
    chipText: { fontSize: 9, color: '#4b5563', marginLeft: 3, fontFamily: 'Rubik-Medium' },
    timestamp: { fontSize: 10, color: '#9ca3af', marginTop: 4 },

    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    removeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#fee2e2',
        justifyContent: 'center', alignItems: 'center',
    },
    viewBtn: {
        width: 32, height: 32, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
    },

    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: { marginTop: 14, fontSize: 13, color: '#6b7280' },

    upgradeIcon: {
        width: 96, height: 96, borderRadius: 48,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 18,
        shadowColor: '#d4a017',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    upgradeTitle: { fontSize: 20, fontFamily: 'Rubik-ExtraBold', color: '#111', marginBottom: 8 },
    upgradeSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        maxWidth: 300,
    },
    upgradeBtnWrap: {
        borderRadius: 26,
        overflow: 'hidden',
        shadowColor: '#9c4040',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    upgradeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 13,
        gap: 8,
    },
    upgradeBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Rubik-Bold' },

    errorIcon: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#fee2e2',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 14,
    },
    errorTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#111' },
    errorSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 6, textAlign: 'center' },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#9c4040',
        backgroundColor: '#fff',
    },
    retryBtnText: { color: '#9c4040', fontSize: 13, fontFamily: 'Rubik-Bold' },

    emptyIcon: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 18,
    },
    emptyTitle: { fontSize: 18, fontFamily: 'Rubik-Bold', color: '#111', marginBottom: 8 },
    emptySubtitle: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 19,
        maxWidth: 280,
    },
});
