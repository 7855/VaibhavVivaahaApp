import React, { useCallback, useEffect, useState } from 'react';
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
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';

import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';
import VerifiedBadges from '../../../components/VerifiedBadges';

type TabType = 'viewed' | 'connection' | 'shortlisted' | 'whoShortlistedMe';

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
};

export default function ListUser() {
    const popup = usePopup();
    const { type: urlType } = useLocalSearchParams();

    // Lazy-init from URL param to prevent double fetch on mount
    const initialType: TabType =
        (typeof urlType === 'string' && ['viewed', 'connection', 'shortlisted', 'whoShortlistedMe'].includes(urlType))
            ? (urlType as TabType)
            : 'viewed';

    const [type, setType] = useState<TabType>(initialType);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<ListItem[]>([]);
    const [upgradeRequired, setUpgradeRequired] = useState(false);

    const meta = TAB_META[type];

    const loadProfileData = useCallback(async (showSpinner: boolean = true) => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                setError('User ID not found');
                return;
            }

            if (showSpinner) setLoading(true);
            setError('');
            setUpgradeRequired(false);
            // Clear stale data immediately so the old tab's rows don't flash
            setData([]);

            const handleResponse = (response: any, emptyMessage: string) => {
                const code = response?.data?.code;
                if (code === 200) {
                    setData(response.data.data || []);
                } else if (code === 403 || response?.data?.message === 'PLAN_UPGRADE_REQUIRED') {
                    setUpgradeRequired(true);
                } else if (code === 404) {
                    // Empty state — not an error
                } else {
                    setError(response?.data?.message || emptyMessage);
                }
            };

            if (type === 'viewed') {
                const response = await userApi.getProfileViewers(userId);
                handleResponse(response, 'Failed to load viewers');
            } else if (type === 'connection') {
                const response = await userApi.getAcceptedInterestRequests(userId);
                handleResponse(response, 'Failed to load connections');
            } else if (type === 'whoShortlistedMe') {
                const response = await userApi.getWhoShortlistedMe(userId);
                handleResponse(response, 'Failed to load who shortlisted you');
            } else {
                const response = await userApi.getShortlistedMailbox(userId);
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
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [type]);

    useEffect(() => {
        loadProfileData();
    }, [loadProfileData]);

    const handleRemove = (item: ShortlistedProfile) => {
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
    };

    const openProfile = (userId: number) => {
        router.push({
            pathname: '/screens/ProfileDetail',
            params: { userId: userId.toString(), from: type },
        });
    };

    const renderCard = ({ item, index }: { item: ListItem; index: number }) => {
        const viewedAt = (item as ViewedProfile).viewedAt;
        const meta2 = [
            item.age ? `${item.age} yrs` : null,
            item.location,
            (item as ShortlistedProfile).occupation,
        ].filter(Boolean).join(' · ');

        return (
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => openProfile(item.userId)}
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
                    {(item as ShortlistedProfile).degree ? (
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
                            {dayjs(viewedAt).fromNow ? dayjs(viewedAt).format('DD MMM, hh:mm A') : dayjs(viewedAt).format('DD MMM, hh:mm A')}
                        </Text>
                    ) : null}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {type === 'shortlisted' ? (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                handleRemove(item as ShortlistedProfile);
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
    };

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
                            ? 'Upgrade to Silver or above to see who has viewed your profile.'
                            : type === 'connection'
                            ? 'Upgrade to access your matched connections and chat with them.'
                            : 'Upgrade your plan to unlock this feature.'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(root)/screens/PremiumTab' as any)}
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
                    keyExtractor={(item, index) =>
                        `${(item as any).shortlistedId ?? (item as any).interestId ?? item.userId}-${index}`
                    }
                    renderItem={renderCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadProfileData(false);
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
    countText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

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
    name: { fontSize: 15, fontWeight: '700', color: '#111' },
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
    chipText: { fontSize: 9, color: '#4b5563', marginLeft: 3, fontWeight: '500' },
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
        paddingTop: Platform.OS === 'ios' ? 60 : 80,
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
    upgradeTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 8 },
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
    upgradeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    errorIcon: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#fee2e2',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 14,
    },
    errorTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
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
    retryBtnText: { color: '#9c4040', fontSize: 13, fontWeight: '700' },

    emptyIcon: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 18,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8 },
    emptySubtitle: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 19,
        maxWidth: 280,
    },
});
