import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import ChatList from '@/components/listchats';
import { router, useFocusEffect } from 'expo-router';
import userApi from '../api/userApi';
import { NativeBaseProvider } from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const MyChatList = () => {
  const [chatList, setChatList] = useState<ChatItem[]>([]);

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
      const fetchUserDetail = async () => {
        try {
          const storedUserId = await AsyncStorage.getItem('userId');
          if (!storedUserId) return;
  
          const decodedUserId = atob(storedUserId); // Assuming it's base64 encoded
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
        } catch (error: any) {
          console.error('API call error:', error);
        }
      };
  
      fetchUserDetail();
  
      return () => {};
    }, [])
  );
  

  return (
    <NativeBaseProvider>
      <SafeAreaView  edges={["top"]} style={{ flex: 1 , backgroundColor:'#F5F5F5'}}>
        <ChatList 
          allChats={chatList}
          onPress={handleChatPress}
        />
      </SafeAreaView>
    </NativeBaseProvider>
  );
};

export default MyChatList;