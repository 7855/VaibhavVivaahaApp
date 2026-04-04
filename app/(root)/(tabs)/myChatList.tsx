import React, { useCallback, useRef, useState } from 'react';
import ChatList from '@/components/listchats';
import { router, useFocusEffect } from 'expo-router';
import userApi from '../api/userApi';
import { Skeleton, HStack, VStack, Box } from 'native-base';
import { useUserData } from '../contexts/UserDataContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatItem {
  id: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  profileImage: string;
  read: boolean;
  conversationId: string;
  otherUserId: string;
}

// Skeleton matching chat list item layout (55px avatar, name, message, time)
const ChatItemSkeleton = () => (
  <Box pl={4} pr={5} py={3} borderBottomWidth={0.3} borderColor="coolGray.200">
    <HStack alignItems="center" space={3}>
      <Skeleton size="55px" rounded="full" />
      <VStack flex={1} space={2}>
        <Skeleton h={4} w="45%" rounded="sm" />
        <Skeleton h={3} w="75%" rounded="sm" />
        <Skeleton h={3} w="50%" rounded="sm" />
      </VStack>
      <VStack space={2} alignItems="flex-end">
        <Skeleton h={3} w={12} rounded="sm" />
        <Skeleton size={6} rounded="full" />
      </VStack>
    </HStack>
  </Box>
);

const ChatListSkeleton = () => (
  <Box bg="white" flex={1}>
    {/* Header skeleton */}
    <HStack px={4} mt={3} mb={2} alignItems="center">
      <Skeleton size={7} rounded="full" />
      <Skeleton h={5} w="40%" rounded="sm" ml={2} />
    </HStack>
    {/* Search bar skeleton */}
    <Box px={3} mt={1} mb={2}>
      <Skeleton h={10} rounded="lg" />
    </Box>
    {/* Chat items */}
    {Array.from({ length: 6 }).map((_, i) => (
      <ChatItemSkeleton key={i} />
    ))}
  </Box>
);

const MyChatList = () => {
  const { userData } = useUserData();
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dataLoadedRef = useRef(false);

  const handleChatPress = (item: ChatItem) => {
    router.push({
      pathname: '/screens/chatscreen',
      params: {
        conversationId: item.conversationId,
        otherUserId: item.otherUserId,
        otherUserName: item.otherUserName,
        profileImage: item.profileImage
      }
    });
  };

  useFocusEffect(
    useCallback(() => {
      // Skip if data already loaded (avoid re-fetch on every tab switch)
      if (dataLoadedRef.current) return;

      const fetchUserDetail = async () => {
        try {
          if (!userData.userId) return;

          const decodedUserId = userData.decodedUserId;
          const response = await userApi.userChatList(decodedUserId);

          const rawData = response?.data?.data || [];
          const formattedChats = rawData.map((chat: any) => ({
            id: chat.conversationId.toString(),
            otherUserName: chat.otherUserName,
            lastMessage: chat.lastMessage,
            lastMessageTime: new Date(chat.lastMessageTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            profileImage: chat.profileImage,
            read: chat.read,
            conversationId: chat.conversationId.toString(),
            otherUserId: chat.otherUserId.toString(),
            unreadCount: chat.unreadMessageCount
          }));
          setChatList(formattedChats);
          dataLoadedRef.current = true;
        } catch (error: any) {
          console.error('API call error:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserDetail();

      return () => { };
    }, [userData.userId])
  );


  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      {isLoading ? (
        <ChatListSkeleton />
      ) : (
        <ChatList
          allChats={chatList}
          onPress={handleChatPress}
        />
      )}
    </SafeAreaView>
  );
};

export default MyChatList;