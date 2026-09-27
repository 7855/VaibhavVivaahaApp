import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePlanChangeEffect, useSubscription } from '../contexts/subscriptionContext';
import { View, Text, TouchableOpacity, AppState } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ChatList from '@/components/listchats';
import { router, useFocusEffect } from 'expo-router';
import userApi from '../api/userApi';
import { Skeleton, HStack, VStack, Box } from 'native-base';
import { useUserData } from '../contexts/UserDataContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { usePopup } from '../contexts/PopupContext';
import { LinearGradient } from 'expo-linear-gradient';
import { webSocketService } from '../services/webSocketService';

// Must stay byte-identical to ConversationService.LOCKED_PREVIEW on the server, so a row
// patched live from the socket and the same row after a refetch read exactly the same.
const LOCKED_PREVIEW = '\uD83D\uDD12 New message \u2014 upgrade to read';

interface ChatItem {
  id: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  profileImage: string;
  read: boolean;
  conversationId: string;
  otherUserId: string;
  unreadCount?: number;
  gender?: string;
  status?: string;
  idVerified?: boolean;
  educationVerified?: boolean;
  incomeVerified?: boolean;
}

// Skeleton matching the card-based chat list layout (60px avatar ring, name, message, time)
const ChatItemSkeleton = () => (
  <Box
    bg="white"
    borderRadius={18}
    mx={4}
    mb={3}
    py={3}
    px={3}
    shadow={1}
  >
    <HStack alignItems="center" space={3}>
      <Skeleton size="60px" rounded="full" />
      <VStack flex={1} space={2}>
        <Skeleton h={4} w="45%" rounded="sm" />
        <Skeleton h={3} w="75%" rounded="sm" />
      </VStack>
      <VStack space={2} alignItems="flex-end">
        <Skeleton h={3} w={12} rounded="sm" />
        <Skeleton size={5} rounded="full" />
      </VStack>
    </HStack>
  </Box>
);

const ChatListSkeleton = () => (
  <LinearGradient colors={['#d0dfeb', '#f3f7fa']} style={{ flex: 1 }}>
    {/* Header skeleton */}
    <HStack px={5} pt={4} pb={2} alignItems="center">
      <Skeleton size={8} rounded="full" />
      <Skeleton h={5} w="40%" rounded="sm" ml={3} />
    </HStack>
    {/* Search bar skeleton */}
    <Box px={5} mt={2} mb={3}>
      <Skeleton h={11} rounded={22} />
    </Box>
    {/* Chat items */}
    {Array.from({ length: 6 }).map((_, i) => (
      <ChatItemSkeleton key={i} />
    ))}
  </LinearGradient>
);

const MyChatList = () => {
  const { userData } = useUserData();
  const { subscriptionData } = useSubscription() || {};
  // Same shape check chatscreen.tsx uses for the MESSAGE entitlement:
  // true / 'unlimited' / {limit} = can read, false or absent = cannot.
  const m = subscriptionData?.entitlements?.message;
  const canReadMessages =
    m === true || m === 'unlimited' || (typeof m === 'object' && m !== null);
  const { userId: authUserId, addChatListener } = useAuth();
  const popup = usePopup();
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  // Mirror of chatList readable from the WS handler, which needs to know synchronously
  // whether an incoming conversationId is already on screen.
  const chatListRef = useRef<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dataLoadedRef = useRef(false);
  const [chatQuota, setChatQuota] = useState<any>(null);

  // WhatsApp/Telegram-style relative label instead of a flat clock time for every row —
  // today's messages show the time, yesterday's just say "Yesterday", this week shows the
  // weekday, anything older shows a short date. Reads as more premium and is instantly scannable.
  const formatRelativeChatTime = (raw: string): string => {
    if (!raw) return '';
    // 🔴 The server sends UTC with NO timezone marker ('2026-09-19T16:33:14.687'), which JS
    // parses as LOCAL time — so a 10:03 PM IST message read as 4:33 PM, exactly 5h30m out.
    // The chat screen always appended 'Z'; this list never did. Live socket events already
    // carry 'Z' (or an offset), so only add one when there is none.
    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw.trim());
    const d = new Date(hasZone ? raw : raw.trim().replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  useEffect(() => {
    chatListRef.current = chatList;
  }, [chatList]);

  // useCallback: this is passed to every memoised ChatRow. As a plain function it got a new
  // identity on each render, so ONE incoming message re-rendered all 100 rows.
  const handleChatPress = useCallback((item: ChatItem) => {
    // A removed connection keeps its history in the list but cannot be opened — the
    // conversation is DISCONNECTED until an interest is accepted again.
    if (item.status === 'DISCONNECTED') {
      popup.confirm(
        'Not connected',
        `Send an interest first to start a conversation with ${item.otherUserName}. Your earlier messages are kept here.`,
        // ProfileDetail takes the RAW numeric id (§17) — otherUserId already is one.
        () => router.push({ pathname: '/(root)/screens/ProfileDetail', params: { userId: item.otherUserId } }),
        'View',
        'Close'
      );
      return;
    }
    router.push({
      pathname: '/screens/chatscreen',
      params: {
        conversationId: item.conversationId,
        otherUserId: item.otherUserId,
        otherUserName: item.otherUserName,
        profileImage: item.profileImage,
        otherUserGender: item.gender || ''
      }
    });
  }, [popup]);

  const fetchUserDetail = useCallback(async () => {
    try {
      if (!userData.userId) return;

      // Backend expects Base64-encoded userId
      const response = await userApi.userChatList(userData.userId);

      const rawData = response?.data?.data || [];
      const formattedChats = rawData.map((chat: any) => ({
        id: chat.conversationId.toString(),
        otherUserName: chat.otherUserName,
        lastMessage: chat.lastMessage,
        lastMessageTime: formatRelativeChatTime(chat.lastMessageTime),
        profileImage: chat.profileImage,
        read: chat.read,
        conversationId: chat.conversationId.toString(),
        otherUserId: chat.otherUserId.toString(),
        unreadCount: chat.unreadMessageCount,
        gender: chat.gender,
        status: chat.status,
        idVerified: chat.idVerified,
        educationVerified: chat.educationVerified,
        incomeVerified: chat.incomeVerified,
      }));
      setChatList(formattedChats);

      // Fetch conversation quota
      try {
        const quotaRes = await userApi.getConversationQuota(userData.userId);
        if (quotaRes.data?.code === 200) {
          setChatQuota(quotaRes.data.data);
        }
      } catch (_) { }

      dataLoadedRef.current = true;
    } catch (error: any) {
      console.error('API call error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userData.userId]);

  // The server masks each row's last-message preview for a member without the MESSAGE
  // entitlement ("🔒 New message — upgrade to read"). This tab never unmounts, so after an
  // upgrade those masked previews would sit here until some new message happened to patch
  // a row. Refetch when the plan changes.
  usePlanChangeEffect(() => { fetchUserDetail(); });

  // Deleting conversations from this list was removed at the client's request (2026-09-19).
  // userApi.deleteConversation and its endpoint are left in place, simply unused.

  useFocusEffect(
    useCallback(() => {
      fetchUserDetail();
      return () => { };
    }, [fetchUserDetail])
  );

  // The list previously only ever refreshed on focus (leaving this tab and coming back, or
  // entering/exiting a chat) — if two users were both sitting on this conversation list at once,
  // a freshly-sent message never showed up until one of them navigated away and back. Registers
  // the same 'chat_message' WS channel chatscreen.tsx uses; safe to share since AuthContext's
  // slot is only ever held by whichever screen currently has focus — chatscreen registers its own
  // handler when pushed on top (blurring this screen, which unregisters via cleanup below) and
  // releases it on unmount, at which point this screen's own focus effect re-registers here.
  // Guarded on authUserId (AuthContext's own async-loaded state, separate from useUserData's
  // userData.userId) and listed as a dependency — AuthContext.checkUserStatus() reads it from
  // AsyncStorage asynchronously, so on a cold start this tab can gain focus before it resolves.
  // Without the dependency, that first attempt would silently no-op ("Cannot add chat listener:
  // User not logged in") and never retry until the tab lost and regained focus.
  useFocusEffect(
    useCallback(() => {
      if (!authUserId) return;
      // Patch just the affected row from the socket payload instead of refetching the whole
      // list on every inbound message (which re-rendered every card and re-hit two endpoints
      // per message). Only an unknown conversationId — a brand new thread that isn't in the
      // list yet — needs a full refetch to pick up the other user's name/photo/verification.
      const handleIncomingMessage = (data: any) => {
        const incomingId = data?.conversationId != null ? String(data.conversationId) : null;
        const known = !!incomingId && chatListRef.current.some((c) => c.conversationId === incomingId);

        if (!known) {
          // Unknown/missing conversation id — fall back to the full refetch.
          fetchUserDetail();
          return;
        }

        // 🔴 The server masks this preview for a member without the MESSAGE entitlement
        // (ConversationService.LOCKED_PREVIEW) — but that only applies to the REST response.
        // Patching the row from the socket wrote the RAW text, so a member sitting on this
        // list read paid content live, and the mask only appeared once they left the tab and
        // came back (which refetches). Mirror the server's rule here: mask unless they can
        // read, and never mask their own outgoing message.
        const fromMe = data?.senderId != null
          && String(data.senderId) === String(userData.decodedUserId ?? '');
        const preview = (!canReadMessages && !fromMe) ? LOCKED_PREVIEW : data?.message;

        setChatList((prev) => {
          const updated = prev.map((c) =>
            c.conversationId === incomingId
              ? {
                ...c,
                lastMessage: preview ?? c.lastMessage,
                lastMessageTime: data?.timestamp
                  ? formatRelativeChatTime(data.timestamp)
                  : c.lastMessageTime,
                read: false,
                unreadCount: (c.unreadCount || 0) + 1,
              }
              : c
          );
          // The server returns this list newest-first, but patching a row in place left it
          // wherever it was — a new message on an old thread updated the preview while the row
          // stayed buried down the list until the next refetch. Move it to the top instead.
          const hit = updated.find((c) => c.conversationId === incomingId);
          return hit ? [hit, ...updated.filter((c) => c.conversationId !== incomingId)] : updated;
        });
      };
      // Unsubscribes THIS callback only. The old no-argument removeChatListener() deleted
      // whatever was registered for 'chat_message' — and since this blur cleanup can run AFTER
      // the chat screen has already registered its own, it was deleting the open chat's
      // listener: messages stopped appearing inside the very chat you were looking at.
      const offMessage = addChatListener(handleIncomingMessage);
      // Whatever arrived while the socket was down never reached us — refetch once it is back.
      const offReconnect = webSocketService.addListener('connected', () => fetchUserDetail());
      // Focus alone is not enough: this tab keeps focus while the app is in the BACKGROUND, so
      // returning to a phone that slept never re-ran the focus fetch and the list stayed stale.
      const appState = AppState.addEventListener('change', (next) => {
        if (next === 'active') { webSocketService.ensureConnected(); fetchUserDetail(); }
      });
      return () => { offMessage(); offReconnect(); appState.remove(); };
    }, [fetchUserDetail, authUserId])
  );


  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: '#d0dfeb' }}>
      {isLoading ? (
        <ChatListSkeleton />
      ) : chatList.length === 0 ? (
        <LinearGradient colors={['#d0dfeb', '#f3f7fa']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: 'rgba(66,0,1,0.08)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 18,
          }}>
            <Ionicons name="chatbubbles-outline" size={44} color="#420001" />
          </View>
          <Text style={{ fontSize: 18, fontFamily: 'Rubik-Bold', color: '#374151' }}>No conversations yet</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            Start connecting with your matches! Send an interest request and begin a conversation.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(root)/(tabs)/explore' as any)}
            activeOpacity={0.88}
            style={{
              marginTop: 22,
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#420001',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={['#9c4040', '#420001']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingHorizontal: 26, paddingVertical: 12 }}
            >
              <Text style={{ color: '#fff', fontSize: 13.5, fontFamily: 'Rubik-Bold' }}>Explore Matches</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      ) : (
        <ChatList
          allChats={chatList}
          onPress={handleChatPress}
          chatQuota={chatQuota}
        />
      )}
    </SafeAreaView>
  );
};

export default MyChatList;