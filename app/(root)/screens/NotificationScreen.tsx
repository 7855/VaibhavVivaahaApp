import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, BellOff, Trash2 } from 'lucide-react-native';
import NotificationCard from '../../../components/NotificationCard';
import { Notification, NotificationFilter, groupOf } from '../../../components/notification';
import { parseServerDate } from '../../../utils/serverDate';
import userApi from '../api/userApi';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';

/**
 * Notifications.
 *
 * ONE header. The screen is registered HEADERLESS and used to draw its own bar AND mount
 * `NotificationHeader`, which drew a second "Notifications" title with Read/Clear under it.
 * "Read" is gone on purpose: every row is marked read the moment this screen opens (below),
 * so the button never had anything left to do.
 *
 * Tapping a row goes where the event happened (see `openTarget`), not to a detail page.
 */

const CHIPS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'message', label: 'Messages' },
  { key: 'interest', label: 'Interests' },
  { key: 'permission', label: 'Permissions' },
  { key: 'activity', label: 'Activity' },
];

function dayLabel(d: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const that = new Date(d); that.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'This week';
  return 'Earlier';
}

const NotificationScreen: React.FC = () => {
  const { userData } = useUserData();
  const popup = usePopup();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const chipRowWidth = useRef(0);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [opening, setOpening] = useState<string | null>(null);
  // Right-edge hint on the filter row: chips overflow the screen, and without a cue nobody
  // knows the last one exists. Shown only while there IS something further right.
  const [moreFilters, setMoreFilters] = useState(false);

  const load = useCallback(async () => {
    const userId = userData.userId;
    if (!userId) return;
    try {
      const res = await userApi.getAllNotifications(userId);
      const rows: any[] = res?.data?.data || [];
      const list: Notification[] = rows.map((r) => ({
        id: String(r.notificationId),
        type: String(r.notificationCategory || '').toUpperCase(),
        title: r.title || '',
        message: r.message || '',
        timestamp: parseServerDate(r.timestamp) ?? new Date(),
        isRead: r.isRead === 'Y',
        senderId: Number(r.senderId) || 0,
        avatar: r.avatar || undefined,
        userName: r.userName || undefined,
        userAge: r.userAge || undefined,
        userLocation: r.userLocation || undefined,
      }));
      setNotifications(list);
      // Opening the screen IS reading it. The unread styling stays for this visit so the new
      // ones still stand out; the server and the bell badge are cleared right away.
      if (list.some((n) => !n.isRead)) {
        userApi.markAllAsReadByReceiverId(userId).catch(() => { /* badge clears next fetch */ });
      }
    } catch (e) {
      console.warn('[notifications] load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userData.userId]);

  useEffect(() => { load(); }, [load]);

  /**
   * Where a tap goes. `senderId` is the OTHER member in the event (message sender, interest
   * sender, the viewer, the member who decided a permission request); 0 means the system.
   * Screens that take a member id take the RAW numeric one (§17).
   */
  const openTarget = async (n: Notification) => {
    const t = n.type;
    const me = Number(userData.decodedUserId);
    const other = n.senderId;

    const openChat = async (fallback: () => void) => {
      if (!me || !other) { fallback(); return; }
      try {
        const res = await userApi.getConversationByUsers(me, other);
        const conv = res?.data?.code === 200 ? res.data.data : null;
        if (conv?.id) {
          router.push({
            pathname: '/screens/chatscreen',
            params: {
              conversationId: String(conv.id), otherUserId: String(other),
              otherUserName: n.userName || '', profileImage: n.avatar || '', otherUserGender: '',
            },
          });
          return;
        }
      } catch { /* fall through */ }
      fallback();
    };
    const toRequests = (tab: 'received' | 'sent' | 'request') =>
      router.push({ pathname: '/(root)/(tabs)/mailBox', params: { initialTab: tab } });
    const toProfile = () => other
      ? router.push({ pathname: '/(root)/screens/ProfileDetail', params: { userId: String(other) } })
      : router.push('/(root)/(tabs)/index' as any);
    const toList = (type: string, title: string) =>
      router.push({ pathname: '/(root)/screens/ListUser', params: { type, title } });

    setOpening(n.id);
    try {
      switch (t) {
        case 'MESSAGE':           await openChat(() => router.push('/(root)/(tabs)/myChatList' as any)); break;
        case 'INTEREST':          toRequests('received'); break;
        case 'INTEREST_ACCEPTED':
        case 'MATCH':             await openChat(() => toRequests('sent')); break;
        case 'MOBILE': case 'HOROSCOPE': case 'PROFILE_IMAGE': case 'BIRTH_TIME':
          // "Asking Permission" = someone asked ME → the Permissions tab. A decision on MY
          // request names the decider → their profile, where the field is now visible.
          if (/asking/i.test(n.title)) toRequests('request'); else toProfile();
          break;
        case 'PROFILE_VIEW':      toList('viewed', 'Who Viewed You'); break;
        case 'LIKE':              toList('whoLikedMe', 'Who Liked You'); break;
        case 'SHORTLIST':         toList('whoShortlistedMe', 'Who Shortlisted You'); break;
        case 'CALL_REQUEST':      toProfile(); break;
        case 'DAILY_MATCH':       router.push('/(root)/(tabs)/explore' as any); break;
        case 'PROFILE_APPROVED':  router.push('/(root)/(tabs)' as any); break; // approved → start browsing matches
        case 'PAYMENT_SUCCESS':
        case 'PAYMENT_REJECTED':
        case 'IMAGE_REJECTED':    router.push('/(root)/(tabs)/profile' as any); break;
        default:                  if (other) toProfile(); else router.push('/(root)/(tabs)/index' as any);
      }
    } finally {
      setOpening(null);
    }
  };

  const remove = async (id: string) => {
    const prev = notifications;
    setNotifications((p) => p.filter((n) => n.id !== id));         // optimistic
    try { await userApi.deleteNotification(id); }
    catch { setNotifications(prev); }
  };

  const clearAll = () => {
    popup.confirm('Clear all notifications?', 'This removes every notification in this list.', async () => {
      try { await userApi.deleteAllNotificationsByReceiverId(userData.userId); setNotifications([]); }
      catch { /* list stays; nothing lost */ }
    });
  };

  const sections = useMemo(() => {
    const rows = filter === 'all' ? notifications : notifications.filter((n) => groupOf(n.type) === filter);
    const order = ['Today', 'Yesterday', 'This week', 'Earlier'];
    const by: Record<string, Notification[]> = {};
    rows.forEach((n) => { const k = dayLabel(n.timestamp); (by[k] ||= []).push(n); });
    return order.filter((k) => by[k]?.length).map((k) => ({ title: k, data: by[k] }));
  }, [notifications, filter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#d0dfeb' }} edges={['top']}>
      <LinearGradient colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']} locations={[0, 0.3, 0.6, 1]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()} hitSlop={8}>
            <ChevronLeft size={20} color="#0f1724" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Loading…' : notifications.length ? `${notifications.length} in your inbox` : 'Nothing yet'}
            </Text>
          </View>
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.roundBtn} onPress={clearAll} hitSlop={8}>
              <Trash2 size={17} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* ONE row, scrollable. Five chips measure ~415pt against ~330pt of usable width on a
            360pt phone, so wrapping them (what this did before) cost a whole second row of
            vertical space on every visit. Horizontal scroll keeps the list where it was. */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            // Fires on scroll AND on first layout, so the hint is right before anyone touches it.
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              setMoreFilters(contentOffset.x + layoutMeasurement.width < contentSize.width - 8);
            }}
            onContentSizeChange={(w) => setMoreFilters(w > chipRowWidth.current + 8)}
            onLayout={(e) => { chipRowWidth.current = e.nativeEvent.layout.width; }}
          >
            {CHIPS.map((c) => {
              const on = filter === c.key;
              return (
                <TouchableOpacity key={c.key} onPress={() => setFilter(c.key)} style={[styles.chip, on && styles.chipOn]}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ⚠ pointerEvents="none" — this sits ON TOP of the last visible chip, and without it
              the overlay would swallow that chip's tap. */}
          {moreFilters && (
            <View style={styles.moreHint} pointerEvents="none">
              <LinearGradient
                colors={['rgba(222,232,241,0)', '#dde8f1']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <ChevronRight size={16} color="#1F7FE5" />
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#1F7FE5" /></View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(n) => n.id}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#1F7FE5" />}
            renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
            renderItem={({ item }) => (
              <View style={{ opacity: opening === item.id ? 0.6 : 1 }}>
                <NotificationCard notification={item} onPress={openTarget} onDelete={remove} />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyRing}><BellOff size={26} color="#1F7FE5" /></View>
                <Text style={styles.emptyTitle}>{filter === 'all' ? "You're all caught up" : 'Nothing here yet'}</Text>
                <Text style={styles.emptyText}>
                  {filter === 'all'
                    ? 'New messages, interests and requests will show up here.'
                    : `No ${CHIPS.find((c) => c.key === filter)?.label.toLowerCase()} notifications.`}
                </Text>
              </View>
            }
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10 },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(15,35,70,0.08)', shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  title: { fontSize: 20, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  subtitle: { fontSize: 12, fontFamily: 'Rubik-Regular', color: '#64748b', marginTop: 1 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingBottom: 8 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipOn: { backgroundColor: '#1F7FE5', borderColor: '#1F7FE5' },
  chipText: { fontSize: 12, fontFamily: 'Rubik-Medium', color: '#475569' },
  moreHint: {
    position: 'absolute', right: 0, top: 0, bottom: 8, width: 34,
    alignItems: 'flex-end', justifyContent: 'center', paddingRight: 4,
  },
  chipTextOn: { color: '#fff' },
  list: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 40, flexGrow: 1 },
  section: { fontSize: 11, fontFamily: 'Rubik-Bold', color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 10, marginBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 40 },
  emptyRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(31,127,229,0.09)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#0f1724', marginBottom: 6 },
  emptyText: { fontSize: 13, fontFamily: 'Rubik-Regular', color: '#64748b', textAlign: 'center', lineHeight: 19 },
});

export default NotificationScreen;
