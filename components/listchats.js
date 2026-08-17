import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, Text as NBText, HStack, Avatar } from 'native-base';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from 'react-native-popup-menu';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import VerifiedBadges from './VerifiedBadges';
import { usePopup } from '../app/(root)/contexts/PopupContext';

// Avatar ring gradient — same brand pairing used on the profile-card family
// (ListUser.tsx, DiscoveryProfileCard.tsx) so the chat list reads as part of
// the same visual system instead of a plain, flat message-app list.
const AVATAR_RING = ['#9c4040', '#7a2d2d'];
const ACCENT = '#1F7FE5';

// Defined at module scope and wrapped in React.memo — this is the actual fix for selection
// feeling slow. Previously every row's JSX was an inline closure over `selectedIds`, so tapping
// ONE row re-rendered the entire visible list on every tap (selectedIds is a new Set each time,
// and an inline renderItem forces FlatList to redraw every mounted cell). Now each row only
// receives a plain `isSelected` boolean + stable callback props, so React.memo can correctly
// skip re-rendering every row except the one whose own selected state actually changed.
const ChatRow = React.memo(function ChatRow({ item, isSelected, selectionMode, onRowPress, onRowLongPress }) {
  const isUnread = item.unreadCount > 0;

  return (
    <Pressable
      onPress={() => onRowPress(item)}
      onLongPress={() => onRowLongPress(item.conversationId)}
      delayLongPress={350}
      _pressed={{ opacity: 0.85 }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isSelected ? '#eaf2fb' : (isUnread ? '#fbfdff' : '#fff'),
        borderRadius: 18,
        marginHorizontal: 14,
        marginBottom: 10,
        paddingVertical: 11,
        paddingHorizontal: 12,
        shadowColor: '#420001',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isUnread ? 0.14 : 0.07,
        shadowRadius: 8,
        elevation: isUnread ? 4 : 2,
        borderWidth: isSelected ? 1.5 : (isUnread ? 1 : 0),
        borderColor: isSelected ? ACCENT : 'rgba(246,183,51,0.6)',
      }}>
        {/* Avatar with gradient ring — same treatment as the profile card family. In selection
            mode a corner badge overlays it (checkmark when selected, empty ring otherwise)
            instead of adding a separate checkbox column, so the card layout never shifts when
            entering/leaving selection mode. */}
        <View style={{ position: 'relative' }}>
          <LinearGradient
            colors={isSelected ? ['#1F7FE5', '#1862b8'] : AVATAR_RING}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 60, height: 60, borderRadius: 30,
              padding: 2.5, justifyContent: 'center', alignItems: 'center',
              opacity: selectionMode && !isSelected ? 0.55 : 1,
            }}
          >
            <Avatar
              size="55px"
              borderWidth={2}
              borderColor="#fff"
              // Forwarded to the underlying RN <Image>: on Android this makes Fresco decode the
              // bitmap down to the 55px slot instead of keeping the full-resolution profile photo
              // in memory for every row of the conversation list.
              _image={{ resizeMode: 'cover', resizeMethod: 'resize' }}
              source={
                item.profileImage
                  ? { uri: item.profileImage }
                  : item.gender === 'M'
                  ? require('../assets/images/avatarMen.png')
                  : item.gender === 'F'
                  ? require('../assets/images/avatarWomen.png')
                  : require('../assets/images/defaultAvatar.png')
              }
            />
          </LinearGradient>
          {selectionMode ? (
            <View style={{ position: 'absolute', top: -2, left: -2 }}>
              {isSelected ? (
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: ACCENT, borderWidth: 2, borderColor: '#fff',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="checkmark" size={13} color="#fff" />
                </View>
              ) : (
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: '#fff', borderWidth: 2, borderColor: '#cbd5e1',
                }} />
              )}
            </View>
          ) : (item.idVerified || item.educationVerified || item.incomeVerified) ? (
            <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
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

        {/* Name + last message */}
        <View style={{ flex: 1, marginLeft: 13, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NBText
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontSize: 15.5,
                letterSpacing: -0.2,
                color: '#111827',
                fontFamily: isUnread ? 'Rubik-Bold' : 'Rubik-Medium',
              }}
            >
              {item.otherUserName}
            </NBText>
            {isUnread ? <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: ACCENT, marginLeft: 6 }} /> : null}
          </View>
          <NBText
            numberOfLines={1}
            style={{
              marginTop: 4,
              fontSize: 12.5,
              color: isUnread ? '#374151' : '#9ca3af',
              fontFamily: isUnread ? 'Rubik-Medium' : 'Rubik-Regular',
            }}
          >
            {item.lastMessage}
          </NBText>
        </View>

        {/* Time + unread count */}
        <View style={{ alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 }}>
          <NBText style={{
            fontSize: 11,
            color: isUnread ? ACCENT : '#9ca3af',
            fontFamily: isUnread ? 'Rubik-Bold' : 'Rubik-Regular',
          }}>
            {item.lastMessageTime}
          </NBText>
          {isUnread ? (
            <View style={{
              marginTop: 7,
              backgroundColor: ACCENT,
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              paddingHorizontal: 5,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <NBText style={{ color: '#fff', fontSize: 10, fontFamily: 'Rubik-Bold' }}>
                {item.unreadCount}
              </NBText>
            </View>
          ) : !selectionMode ? (
            <View style={{
              marginTop: 9, width: 22, height: 22, borderRadius: 11,
              backgroundColor: 'rgba(31,127,229,0.08)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="chevron-forward" size={12} color={ACCENT} />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

// Deliberately plain: a TouchableOpacity/Pressable card in a stock FlatList, no per-row entering
// animation, no swipe gesture library. The "Contact Reveals" list (ListUser.tsx) uses exactly
// this recipe and stays smooth scrolling/tapping through dozens of rows — the previous version
// of this file used Reanimated entrance animations + react-native-swipe-list-view's JS-driven
// swipe gesture on every row, which is what made scrolling and tapping feel heavy once an
// account had 50+ conversations. Deleting is now WhatsApp-style instead of swipe: long-press (or
// the header's ⋮ menu → Select) enters a multi-select mode instead.
const ListChats = ({ allChats, onPress, chatQuota, onDeleteConversations }) => {
  const popup = usePopup();
  const [listData, setListData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  // Read inside stable callbacks without making them depend on (and change identity with)
  // selectionMode — keeps onRowPress/onRowLongPress referentially stable across re-renders so
  // ChatRow's React.memo actually holds.
  const selectionModeRef = useRef(false);
  useEffect(() => { selectionModeRef.current = selectionMode; }, [selectionMode]);

  // myChatList.tsx is a bottom-tab screen — Expo Router tabs never unmount on navigation, so
  // leaving mid-selection (switching to another tab, or opening a chat) and coming back left
  // selectionMode/selectedIds exactly as they were. Reset on blur so returning to this tab always
  // starts fresh, matching WhatsApp (it never remembers a stale selection either).
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectionMode(false);
        setSelectedIds(new Set());
      };
    }, [])
  );

  const handleSearch = (text) => {
    setSearchText(text);
    if (!text) {
      setFilteredData(listData);
      return;
    }
    const filtered = listData.filter(item =>
      item.otherUserName.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(filtered);
  };

  useEffect(() => {
    if (allChats) {
      setListData(allChats);
      // Re-apply any active search text against the fresh data instead of
      // blindly replacing it — otherwise a live refresh (new message arriving)
      // while the user has typed a search would silently clear their filter.
      if (searchText) {
        setFilteredData(
          allChats.filter(item => item.otherUserName.toLowerCase().includes(searchText.toLowerCase()))
        );
      } else {
        setFilteredData(allChats);
      }
      // Drop any selected ids that no longer exist (e.g. after a delete completes and the
      // parent's allChats refreshes) so the count/selection never goes stale.
      setSelectedIds(prev => {
        const validIds = new Set(allChats.map(c => c.conversationId));
        const next = new Set([...prev].filter(id => validIds.has(id)));
        return next.size === prev.size ? prev : next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allChats]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelected = useCallback((conversationId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(conversationId)) next.delete(conversationId);
      else next.add(conversationId);
      return next;
    });
  }, []);

  // Stable across every render (empty deps) — reads selectionMode via a ref instead of taking it
  // as a dependency, which is what lets ChatRow's memoization actually skip untouched rows.
  const handleRowPress = useCallback((item) => {
    if (selectionModeRef.current) {
      toggleSelected(item.conversationId);
    } else {
      onPress(item);
    }
  }, [onPress, toggleSelected]);

  const handleRowLongPress = useCallback((conversationId) => {
    setSelectionMode(true);
    setSelectedIds(new Set([conversationId]));
  }, []);

  const handleSelectMenuPress = useCallback(() => {
    setSelectionMode(true);
  }, []);

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    popup.confirm(
      count === 1 ? 'Delete this conversation?' : `Delete ${count} conversations?`,
      'This removes it from your conversation list. If you or the other person message again, it reappears.',
      () => {
        onDeleteConversations?.([...selectedIds]);
        exitSelectionMode();
      },
      'Delete',
      'Cancel'
    );
  };

  const renderItem = useCallback(({ item }) => (
    <ChatRow
      item={item}
      isSelected={selectedIds.has(item.conversationId)}
      selectionMode={selectionMode}
      onRowPress={handleRowPress}
      onRowLongPress={handleRowLongPress}
    />
  ), [selectedIds, selectionMode, handleRowPress, handleRowLongPress]);

  return (
    <MenuProvider skipInstanceCheck>
      <LinearGradient colors={['#d0dfeb', '#f3f7fa']} style={{ flex: 1 }}>
        {/* Decorative soft-glow blobs — purely visual depth, non-interactive, sit behind
            everything so they never intercept taps or shift layout. */}
        <View pointerEvents="none" style={{ position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(66,0,1,0.06)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', top: 160, left: -70, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(246,183,51,0.10)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(31,127,229,0.07)' }} />

        {/* Header */}
        <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }}>
          {selectionMode ? (
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space={3}>
                <TouchableOpacity onPress={exitSelectionMode} style={{ padding: 4 }}>
                  <Ionicons name="close" size={22} color="#1f2937" />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontFamily: 'Rubik-Bold', color: '#1f2937' }}>
                  {selectedIds.size} selected
                </Text>
              </HStack>
              <TouchableOpacity
                onPress={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: selectedIds.size === 0 ? '#f1f5f9' : '#fef2f2',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="trash-outline" size={19} color={selectedIds.size === 0 ? '#cbd5e1' : '#dc2626'} />
              </TouchableOpacity>
            </HStack>
          ) : (
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space={2}>
                <View style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: 'rgba(66,0,1,0.08)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <MaterialCommunityIcons name="chat-processing" size={18} color="#420001" />
                </View>
                <Text style={{ fontSize: 19, fontFamily: 'Rubik-Bold', color: '#1f2937' }}>My Connections</Text>
              </HStack>
              <HStack alignItems="center" space={2}>
                {chatQuota && !chatQuota.unlimited && chatQuota.total > 0 && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: chatQuota.remaining <= 1 ? '#fef2f2' : '#eef6ff',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: chatQuota.remaining <= 1 ? '#fecaca' : '#bfdbfe',
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontFamily: 'Rubik-Bold',
                      color: chatQuota.remaining <= 1 ? '#dc2626' : ACCENT,
                    }}>
                      {chatQuota.used}/{chatQuota.total} chats used
                    </Text>
                  </View>
                )}
                {listData.length > 0 && (
                  <Menu>
                    <MenuTrigger customStyles={{ triggerWrapper: { padding: 6 } }}>
                      <Ionicons name="ellipsis-vertical" size={20} color="#1f2937" />
                    </MenuTrigger>
                    <MenuOptions customStyles={{
                      optionsContainer: {
                        borderRadius: 12,
                        marginTop: 26,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 5,
                      },
                    }}>
                      <MenuOption onSelect={handleSelectMenuPress}>
                        <HStack alignItems="center" space={2} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#1f2937" />
                          <Text style={{ fontSize: 14, fontFamily: 'Rubik-Medium', color: '#1f2937' }}>Select</Text>
                        </HStack>
                      </MenuOption>
                    </MenuOptions>
                  </Menu>
                )}
              </HStack>
            </HStack>
          )}

          {/* Search bar */}
          {!selectionMode && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 22,
              paddingHorizontal: 8,
              height: 44,
              marginTop: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}>
              <View style={{
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: 'rgba(31,127,229,0.1)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="search" size={16} color={ACCENT} />
              </View>
              <TextInput
                style={{ flex: 1, marginLeft: 8, fontSize: 14.5, color: '#111827', fontFamily: 'Rubik-Regular' }}
                placeholder="Search conversations..."
                placeholderTextColor="#9ca3af"
                value={searchText}
                onChangeText={handleSearch}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')} style={{ padding: 6 }}>
                  <Ionicons name="close-circle" size={18} color="#d1d5db" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* List */}
        {filteredData.length === 0 && searchText.length > 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 120 }}>
            <Ionicons name="search-outline" size={48} color="#c7d2dd" />
            <Text style={{ fontSize: 15, fontFamily: 'Rubik-Bold', color: '#374151', marginTop: 14, textAlign: 'center' }}>
              No matches for "{searchText}"
            </Text>
            <Text style={{ fontSize: 12.5, color: '#9ca3af', textAlign: 'center', marginTop: 6 }}>
              Try a different name.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.conversationId}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            windowSize={7}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
          />
        )}
      </LinearGradient>
    </MenuProvider>
  );
};

export default ListChats;
