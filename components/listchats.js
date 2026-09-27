import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import VerifiedBadges from './VerifiedBadges';

const ACCENT = '#1F7FE5';
const RING = '#8b3636'; // the old #9c4040→#7a2d2d ring gradient, flattened (see ChatRow)

// Every row is EXACTLY this tall, which is what lets getItemLayout below skip measuring.
const CARD_HEIGHT = 84;
const CARD_GAP = 10;
const ITEM_HEIGHT = CARD_HEIGHT + CARD_GAP;

const AVATAR_MEN = require('../assets/images/avatarMen.png');
const AVATAR_WOMEN = require('../assets/images/avatarWomen.png');
const AVATAR_DEFAULT = require('../assets/images/defaultAvatar.png');

/**
 * One conversation row.
 *
 * Scrolling 100 conversations was janky because of what each row cost to MOUNT, not because of
 * re-renders (those were already memoised). With removeClippedSubviews + a render window, rows
 * are created and destroyed continuously while you scroll, and every one built:
 *   - a NativeBase Pressable, a NativeBase Avatar and three NativeBase Texts — each resolves the
 *     theme and a style-prop pipeline on mount, several times the cost of the RN primitive;
 *   - a LinearGradient purely to draw a 2.5px avatar ring (a native gradient view per row);
 *   - a fresh inline style object for every element, every render.
 * Now: plain RN primitives, a solid ring, and StyleSheet styles. Visually the same card.
 *
 * Selection mode / delete was removed at the client's request (2026-09-19), which also removes
 * the per-row isSelected/selectionMode props and the long-press handler.
 */
const ChatRow = React.memo(function ChatRow({ item, onRowPress }) {
  const isUnread = item.unreadCount > 0;
  const source = item.profileImage
    ? { uri: item.profileImage }
    : item.gender === 'M' ? AVATAR_MEN : item.gender === 'F' ? AVATAR_WOMEN : AVATAR_DEFAULT;
  const isVerified = item.idVerified || item.educationVerified || item.incomeVerified;

  return (
    <Pressable
      onPress={() => onRowPress(item)}
      android_ripple={RIPPLE}
      style={[st.card, isUnread && st.cardUnread]}
    >
      <View style={st.ring}>
        <Image
          source={source}
          style={st.avatar}
          // Decode to the 52px slot instead of holding the full-resolution photo per row, and
          // no fade — rows remount while scrolling, and a fade-in on each reads as flicker.
          resizeMethod="resize"
          fadeDuration={0}
        />
        {isVerified ? (
          <View style={st.verified}>
            <VerifiedBadges
              idVerified={item.idVerified}
              educationVerified={item.educationVerified}
              incomeVerified={item.incomeVerified}
              mode="compact"
              size="sm"
            />
          </View>
        ) : null}
      </View>

      <View style={st.body}>
        <View style={st.nameRow}>
          <Text numberOfLines={1} style={[st.name, isUnread && st.nameUnread]}>{item.otherUserName}</Text>
          {isUnread ? <View style={st.dot} /> : null}
        </View>
        <Text numberOfLines={1} style={[st.preview, isUnread && st.previewUnread]}>{item.lastMessage}</Text>
      </View>

      <View style={st.meta}>
        <Text style={[st.time, isUnread && st.timeUnread]}>{item.lastMessageTime}</Text>
        {isUnread ? (
          <View style={st.badge}><Text style={st.badgeText}>{item.unreadCount}</Text></View>
        ) : (
          <View style={st.chevron}><Ionicons name="chevron-forward" size={12} color={ACCENT} /></View>
        )}
      </View>
    </Pressable>
  );
});

const RIPPLE = { color: 'rgba(31,127,229,0.10)' };
const keyExtractor = (item) => item.conversationId;
const getItemLayout = (_data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index });

const ListChats = ({ allChats, onPress, chatQuota }) => {
  const [searchText, setSearchText] = useState('');

  // Derived, not mirrored into state: the old version copied allChats into two pieces of state
  // inside an effect, so every live message re-rendered the list twice.
  const data = useMemo(() => {
    const list = allChats || [];
    const q = searchText.trim().toLowerCase();
    return q ? list.filter((c) => (c.otherUserName || '').toLowerCase().includes(q)) : list;
  }, [allChats, searchText]);

  const renderItem = useCallback(({ item }) => <ChatRow item={item} onRowPress={onPress} />, [onPress]);

  return (
    <LinearGradient colors={['#d0dfeb', '#f3f7fa']} style={st.flex}>
      {/* Decorative soft-glow blobs — non-interactive, behind everything. */}
      <View pointerEvents="none" style={st.blobA} />
      <View pointerEvents="none" style={st.blobB} />
      <View pointerEvents="none" style={st.blobC} />

      <View style={st.header}>
        <View style={st.headerRow}>
          <View style={st.titleRow}>
            <View style={st.titleIcon}>
              <MaterialCommunityIcons name="chat-processing" size={18} color="#420001" />
            </View>
            <Text style={st.title}>My Connections</Text>
          </View>
          {chatQuota && !chatQuota.unlimited && chatQuota.total > 0 ? (
            <View style={[st.quota, chatQuota.remaining <= 1 && st.quotaLow]}>
              <Text style={[st.quotaText, chatQuota.remaining <= 1 && st.quotaTextLow]}>
                {chatQuota.used}/{chatQuota.total} chats used
              </Text>
            </View>
          ) : null}
        </View>

        <View style={st.search}>
          <View style={st.searchIcon}><Ionicons name="search" size={16} color={ACCENT} /></View>
          <TextInput
            style={st.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchText('')} style={st.searchClear}>
              <Ionicons name="close-circle" size={18} color="#d1d5db" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {data.length === 0 && searchText.length > 0 ? (
        <View style={st.empty}>
          <Ionicons name="search-outline" size={48} color="#c7d2dd" />
          <Text style={st.emptyTitle}>No matches for "{searchText}"</Text>
          <Text style={st.emptySub}>Try a different name.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          // Fixed-height rows: the list can jump to any offset without measuring what is above
          // it, which is what removes the blank-then-pop while flinging through a long list.
          getItemLayout={getItemLayout}
          contentContainerStyle={st.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={40}
          windowSize={11}
          removeClippedSubviews
        />
      )}
    </LinearGradient>
  );
};

const st = StyleSheet.create({
  flex: { flex: 1 },
  blobA: { position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(66,0,1,0.06)' },
  blobB: { position: 'absolute', top: 160, left: -70, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(246,183,51,0.10)' },
  blobC: { position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(31,127,229,0.07)' },

  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(66,0,1,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontFamily: 'Rubik-Bold', color: '#1f2937' },
  quota: { backgroundColor: '#eef6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  quotaLow: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  quotaText: { fontSize: 11, fontFamily: 'Rubik-Bold', color: ACCENT },
  quotaTextLow: { color: '#dc2626' },

  search: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 22,
    paddingHorizontal: 8, height: 44, marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  searchIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(31,127,229,0.1)', alignItems: 'center', justifyContent: 'center' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14.5, color: '#111827', fontFamily: 'Rubik-Regular', paddingVertical: 0 },
  searchClear: { padding: 6 },

  listContent: { paddingTop: 4, paddingBottom: 110 },

  // height is explicit and the border is ALWAYS 1px (transparent unless unread) — a border that
  // appeared only on unread rows changed their height by 2px and broke getItemLayout's maths.
  card: {
    height: CARD_HEIGHT, marginBottom: CARD_GAP, marginHorizontal: 14, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18,
    borderWidth: 1, borderColor: 'transparent',
    shadowColor: '#420001', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    // Android only: keeps the press ripple inside the rounded corners. On iOS overflow:hidden
    // would clip this view's own shadow, and iOS has no ripple to contain.
    ...Platform.select({ android: { overflow: 'hidden' }, default: {} }),
  },
  cardUnread: { backgroundColor: '#fbfdff', borderColor: 'rgba(246,183,51,0.6)' },

  ring: { width: 60, height: 60, borderRadius: 30, borderWidth: 2.5, borderColor: RING, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  avatar: { width: 51, height: 51, borderRadius: 25.5, backgroundColor: '#eef1f5' },
  verified: { position: 'absolute', bottom: -2, right: -2 },

  body: { flex: 1, marginLeft: 13, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { flexShrink: 1, fontSize: 15.5, letterSpacing: -0.2, color: '#111827', fontFamily: 'Rubik-Medium' },
  nameUnread: { fontFamily: 'Rubik-Bold' },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: ACCENT, marginLeft: 6 },
  preview: { marginTop: 4, fontSize: 12.5, color: '#9ca3af', fontFamily: 'Rubik-Regular' },
  previewUnread: { color: '#374151', fontFamily: 'Rubik-Medium' },

  meta: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 },
  time: { fontSize: 11, color: '#9ca3af', fontFamily: 'Rubik-Regular' },
  timeUnread: { color: ACCENT, fontFamily: 'Rubik-Bold' },
  badge: { marginTop: 7, backgroundColor: ACCENT, borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Rubik-Bold' },
  chevron: { marginTop: 9, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(31,127,229,0.08)', alignItems: 'center', justifyContent: 'center' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 120 },
  emptyTitle: { fontSize: 15, fontFamily: 'Rubik-Bold', color: '#374151', marginTop: 14, textAlign: 'center' },
  emptySub: { fontSize: 12.5, color: '#9ca3af', textAlign: 'center', marginTop: 6 },
});

export default ListChats;
