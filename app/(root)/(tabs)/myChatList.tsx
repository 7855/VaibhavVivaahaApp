import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
  const { userId: authUserId, addChatListener, removeChatListener } = useAuth();
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
    const d = new Date(raw);
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

  const handleChatPress = (item: ChatItem) => {
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
  };

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

  // WhatsApp-style multi-select delete (see listchats.js). This now hides the conversation from
  // THIS user's list only — it used to flip a shared flag that wiped the thread from the other
  // person's list too, which let someone send abusive messages and then erase them from the
  // recipient's view. Messages themselves are never deleted, and a new message from either side
  // revives the thread. Runs the deletes in parallel then refetches once.
  const handleDeleteConversations = useCallback(async (conversationIds: string[]) => {
    const results = await Promise.allSettled(
      conversationIds.map((id) => userApi.deleteConversation(id, userData.userId))
    );
    // A rejected promise only covers network/HTTP failures. This backend returns HTTP 200 with
    // the real outcome in res.data.code, so the new 403 ("not a participant") would otherwise be
    // counted as a successful delete and silently disappear.
    const failedCount = results.filter(
      (r) => r.status === 'rejected' || (r as PromiseFulfilledResult<any>).value?.data?.code !== 200
    ).length;
    await fetchUserDetail();
    if (failedCount > 0) {
      popup.error(
        'Some conversations weren\'t deleted',
        `${failedCount} of ${conversationIds.length} couldn't be removed. Please try again.`
      );
    }
  }, [fetchUserDetail, popup, userData.userId]);

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

        setChatList((prev) =>
          prev.map((c) =>
            c.conversationId === incomingId
              ? {
                ...c,
                lastMessage: data?.message ?? c.lastMessage,
                lastMessageTime: data?.timestamp
                  ? formatRelativeChatTime(data.timestamp)
                  : c.lastMessageTime,
                read: false,
                unreadCount: (c.unreadCount || 0) + 1,
              }
              : c
          )
        );
      };
      addChatListener(handleIncomingMessage);
      return () => removeChatListener();
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
          onDeleteConversations={handleDeleteConversations}
        />
      )}
    </SafeAreaView>
  );
};

export default MyChatList;