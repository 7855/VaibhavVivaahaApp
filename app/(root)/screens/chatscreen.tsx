import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, StyleSheet, Keyboard, KeyboardAvoidingView, Platform, Animated, ImageBackground, Modal, FlatList, Alert, TouchableWithoutFeedback } from 'react-native';
import { Ionicons, Feather, Fontisto } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Box, NativeBaseProvider, Pressable, Toast } from 'native-base';
import VerifiedBadges from '../../../components/VerifiedBadges';
import { SafeAreaView } from 'react-native-safe-area-context';
import userApi from '../api/userApi';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';
import base64 from 'react-native-base64';

import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from 'react-native-popup-menu';
import { SelectList } from 'react-native-dropdown-select-list';
import { useSubscription } from '../contexts/subscriptionContext';
// Remove this import since we're not using Checkbox anymore
interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  isRead: boolean;
  sender: string;
  displayDateGroup: string;
}

interface ChatScreenParams {
  otherUserId: string;
  otherUserName: string;
  profileImage: string;
  conversationId: string;
}

function ChatScreen() {
  const { userData } = useUserData();
  const popup = usePopup();
  const router = useRouter();
  const navigation = useNavigation();
  const route = useLocalSearchParams();
  const conversationId = route.conversationId as string;
  const otherUserName = route.otherUserName as string;
  const profileImage = route.profileImage as string;
  const otherUserId = route.otherUserId as string;

  const [conversationData, setConversationData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatStatus, setChatStatus] = useState('');
  const [initiatedBy, setInitiatedBy] = useState('');
  const [decryptedUserId, setDecryptedUserId] = useState<string>('');
  const [myProfile, setMyProfile] = useState<string>('');
  const [otherProfile, setOtherProfile] = useState<string>(profileImage || '');
  const animatedKeyboardHeight = useRef(new Animated.Value(0)).current;
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [chatPadding, setChatPadding] = useState(10);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    (async () => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const role = await AsyncStorage.getItem('userRole');
      setIsParent(role === 'PARENT');
    })();
  }, []);

  const blockedForParent = (action: string) => {
    popup.error(
      'Not allowed',
      `Family members cannot ${action}. This action must come from the primary account holder.`
    );
  };
  const [selectedReason, setSelectedReason] = useState('');
  const [isShortlisted, setIsShortlisted] = useState(false);
  const { subscriptionData } = useSubscription();

  useEffect(() => {
    if (subscriptionData && subscriptionData.entitlements) {
      // console.log("subscriptionData======>", subscriptionData);
      // console.log("subscriptionData.entitlements:", subscriptionData.entitlements);

      const hasPremiumAccess =
        subscriptionData.entitlements.message === true ||
        subscriptionData.entitlements.message === 'unlimited' ||
        (typeof subscriptionData.entitlements.message === 'object' && subscriptionData.entitlements.message !== null);

      // MESSAGE entitlement: true/unlimited/object{limit} = can chat, false = blocked
      setIsPremium(hasPremiumAccess);
    } else {
      // console.log("No subscription data or entitlements found");
      setIsPremium(false);
    }
    // console.log("hasPremiumAccess ===>", isPremiumUser);
    setIsLoading(false)
  }, [subscriptionData]);



  useEffect(() => {
    const checkShortlistedStatus = async () => {
      try {
        const response = await userApi.checkIfShortlisted(userData.userId, otherUserId);
        setIsShortlisted(response.data.data); // Access the nested data property
      } catch (error) {
        console.error('Error checking shortlisted status:', error);
        setIsShortlisted(false); // Set to false on error to show "Shortlist" option
      }
    };

    checkShortlistedStatus();
  }, [otherUserId]);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByOtherUser, setIsBlockedByOtherUser] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [otherUserLastseenTime, setOtherUserLastseenTime] = useState('');
  const [otherUserVerifications, setOtherUserVerifications] = useState<{
    idVerified?: boolean;
    educationVerified?: boolean;
    incomeVerified?: boolean;
  }>({});
  const [blockedId, setBlockedId] = useState('');


  const [reportReasons, setReportReasons] = useState([
    { key: '1', value: 'Spam' },
    { key: '2', value: 'Abuse' },
    { key: '3', value: 'Harassment' },
    { key: '4', value: 'Others' },
  ]);

  const handleBlockUser = () => {
    if (isParent) { blockedForParent('block other users'); return; }
    popup.confirm(
      'Block User',
      "Are you sure you want to block this user? You won't be able to chat or view each other's profiles.",
      async () => {
        try {
          if (!userData.userId) {
            console.warn('User ID not found in storage');
            return;
          }

          const requestBody = {
            blockedByUserId: userData.userId,
            blockedUserId: parseInt(otherUserId),
          };

          await userApi.blockUser(requestBody);

          popup.success('Blocked', 'User blocked successfully.', () => router.back());
        } catch (error) {
          console.error('Error blocking user:', error);
          popup.error('Error', 'Failed to block user. Please try again.');
        }
      },
      'Block',
      'Cancel'
    );
  };

  const handleReportUser = async () => {
    if (isParent) { blockedForParent('report other users'); return; }
    setShowReportModal(true);
  };

  const handleUnblockUser = async () => {

    try {




      // Call the unblockUser API
      await userApi.deleteBlockedUser(blockedId);

      // Show success message
      popup.success('Unblocked', 'User unblocked successfully.');

      // Navigate back to chat list
      router.navigate('/myChatList');
    } catch (error) {
      console.error('Error unblocking user:', error);
      popup.error('Error', 'Failed to unblock user. Please try again.');
    }

  };

  const handleShortlistUser = async () => {
    try {
      if (!userId || !otherUserId) {
        console.warn('User IDs not available');
        return;
      }
      const storedUserId = userData.userId;
      const decodedUserId = userData.decodedUserId;

      await userApi.insertShortlistedProfile({
        shortlistedBy: parseInt(decodedUserId),
        shortlistedUserId: parseInt(otherUserId),
        note: 'Interesting profile, want to know more'
      });

      setIsShortlisted(true);
      popup.success('Shortlisted', 'User has been added to your shortlist.');
    } catch (error) {
      console.error('Error shortlisting user:', error);
      popup.error('Error', 'Failed to shortlist user.');
    }
  };

  const handleUnshortlistUser = async () => {
    try {
      if (!userId || !otherUserId) {
        console.warn('User IDs not available');
        return;
      }
      const storedUserId = userData.userId;

      await userApi.deleteShortlistedProfileByUsers(storedUserId, parseInt(otherUserId));
      setIsShortlisted(false);
      popup.success('Removed', 'User removed from your shortlist.');
    } catch (error) {
      console.error('Error unshortlisting user:', error);
      popup.error('Error', 'Failed to remove user from shortlist.');
    }
  };

  // Report User Modal
  const handleReportSubmit = async () => {
    const reasonToSend = selectedReason;

    if (!reasonToSend) {
      popup.warning('Select a reason', 'Please select or enter a reason for reporting.');
      return;
    }

    try {
      const storedUserId = userData.userId;
      if (!storedUserId) {
        console.warn('User ID not found in storage');
        return;
      }

      const requestBody = {
        reportedByUserId: storedUserId,
        reportedUserId: parseInt(otherUserId),
        reason: reasonToSend
      };

      await userApi.reportUser(requestBody);

      popup.success('Reported', 'User reported successfully. Our team will review.', () =>
        router.navigate('/myChatList')
      );
    } catch (error) {
      console.error('Error reporting user:', error);
      popup.error('Error', 'Failed to report user. Please try again.');
    }
  };



  useEffect(() => {
    const checkBlockedStatus = async () => {
      const storedUserId = userData.userId;
      if (storedUserId) {
        const checkBlocked = await userApi.checkBlockedByBlockedId(
          storedUserId,
          parseInt(otherUserId)
        );

        if (checkBlocked.data.data) {
          setBlockedId(checkBlocked.data.data.id)
          const decodedUserId = base64.decode(storedUserId);


          if (checkBlocked.data.data?.blockedByUserId === parseInt(decodedUserId)) {
            setIsBlockedByMe(true);
            setIsBlockedByOtherUser(false);

          } else {
            setIsBlockedByMe(false);
            setIsBlockedByOtherUser(true);
          }
        }

      }
    };

    checkBlockedStatus();
  }, []);

  // Set profile images from route params
  useEffect(() => {
    if (profileImage) {
      setOtherProfile(profileImage);
    }
  }, [profileImage]);


  const formatDate = (datetime: string) => {
    if (!datetime) return '';

    // Append 'Z' to treat as UTC and replace space with 'T'
    const isoFormatted = datetime.replace(' ', 'T') + 'Z';

    const date = new Date(isoFormatted);

    if (isNaN(date.getTime())) return '';

    // Convert to local time (e.g., IST or whatever user's device uses)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };


  const inputTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        Animated.timing(inputTranslateY, {
          toValue: -e.endCoordinates.height + 275,
          duration: 200,
          useNativeDriver: true,
        }).start();
        setChatPadding(70); // ✅ Increase padding when keyboard is shown

      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(inputTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        setChatPadding(10); // ✅ Increase padding when keyboard is shown

      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);





  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedUserId = userData.userId;
        if (userData.profileImage) {
          setMyProfile(userData.profileImage);
        }
        if (storedUserId) {
          // Decode the base64 encoded userId
          const decoded = atob(storedUserId);
          setUserId(storedUserId);
          setDecryptedUserId(decoded);
          console.log('Decoded userId:', decoded);

          if (conversationId) {
            const resp = await userApi.markAsRead(parseInt(conversationId), parseInt(decoded));
            // console.log("resp=======================>", resp.data);

          }

        }
      } catch (error) {
        console.error('Error loading userId:', error);
      }
    };
    loadUserId();
  }, []);

  const formatLastSeenTime = (lastSeen: string): string => {
    const now = new Date();
    const seenDate = new Date(lastSeen);

    const sameDay =
      now.toDateString() === seenDate.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      yesterday.toDateString() === seenDate.toDateString();

    const timeString = seenDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (sameDay) {
      return `today at ${timeString}`;
    } else if (isYesterday) {
      return `yesterday at ${timeString}`;
    } else {
      const weekday = seenDate.toLocaleDateString('en-US', { weekday: 'long' });
      return `${weekday} at ${timeString}`;
    }
  };



  useEffect(() => {
    const fetchConversation = async () => {
      try {
        // Fetch other user's online status
        const onlineStatusResponse = await userApi.getUserOnlineStatus(otherUserId);
        // console.log('Other user online status:', onlineStatusResponse.data.data.isOnline);
        // console.log('Other user online status:', onlineStatusResponse.data.data.lastSeen);

        setIsOtherUserOnline(onlineStatusResponse.data.data.isOnline);
        const formattedTime = formatLastSeenTime(onlineStatusResponse.data.data.lastSeen);
        setOtherUserLastseenTime(formattedTime);

        // Fetch verification flags once for the header shield
        try {
          const profileRes = await userApi.getProfileDetails(otherUserId);
          const d = profileRes?.data?.data;
          if (d) {
            setOtherUserVerifications({
              idVerified: d.idVerified === true,
              educationVerified: d.educationVerified === true,
              incomeVerified: d.incomeVerified === true,
            });
          }
        } catch (_) {}
        const response = await userApi.getConversationData(conversationId);
        if (response.data && response.data.data) {
          // Get conversation data
          // console.log("response.data.data=======================>", response.data.data);

          // Format messages
          const formattedMessages = response.data.data.map((msg: any) => ({
            id: msg.id,
            text: msg.message,
            senderId: msg.senderId,
            timestamp: formatDate(msg.createdAt),
            isRead: msg.isRead,
            sender: msg.senderId == decryptedUserId ? 'me' : 'other',
            displayDateGroup: getDisplayDate(msg.createdAt),
          }));

          // console.log("formattedMessages=======================>", formattedMessages);

          setMessages(formattedMessages.reverse());
        }
      } catch (error: any) {
        console.error('Error fetching conversation:', error);
      }
    };

    const fetchConversationStatus = async () => {
      try {
        const response = await userApi.getConversationStatusById(conversationId);
        if (response.data && response.data.data) {
          // Get conversation data
          // console.log("response.data.data=======111111111111111================>", response.data.data);

          setChatStatus(response.data.data.status);
          setInitiatedBy(response.data.data.initiatedBy);
          // const conversation = response.data.data;
          // console.log("conversation====2111===================>", conversation);

        }
      } catch (error: any) {
        console.error('Error fetching conversation:', error);
      }
    };

    fetchConversation();
    fetchConversationStatus();

  }, [conversationId]);

  const handleSend = async () => {
    if (!isPremium) {
      popup.premiumRequired(
        'Upgrade to Premium to send messages and unlock unlimited chats.',
        () => router.push('/(root)/screens/PremiumTab')
      );
      return;
    }
    if (!inputText.trim()) return;

    try {

      // Block check
      if (isBlockedByMe) {
        setStatusMessage("Please unblock the user before starting a conversation.");
        setShowStatusModal(true);
        return; // Prevent sending
      }

      if (isBlockedByOtherUser) {
        setStatusMessage("You cannot send a message because the user has blocked you.");
        setShowStatusModal(true);
        return; // Prevent sending
      }


      if (chatStatus === 'PENDING') {
        // console.log("initiatedBy", initiatedBy);
        // console.log("decryptedUserId", decryptedUserId);

        if (decryptedUserId == initiatedBy) {
          setStatusMessage("Your request is still pending. Please wait for the user’s approval.");
        } else {
          setStatusMessage("Please accept the request to continue the chat.");
        }
        setShowStatusModal(true);
        return; // Prevent sending
      }

      // Format the new message with a unique ID
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        senderId: decryptedUserId,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        isRead: false,
        sender: 'me'
      };

      // Update local state first for instant UI update
      setMessages(prev => [...prev, newMessage]);
      setInputText('');

      // console.log("inputText=======================>", inputText);


      // Send to API
      try {
        const sendRes = await userApi.updateUserConversation({
          conversationId: parseInt(conversationId),
          senderId: parseInt(decryptedUserId),
          message: inputText,
          isRead: false
        });

        // Backend returns HTTP 200 but with code 403 in body for plan gates
        const resData = sendRes?.data;
        if (resData?.code === 403) {
          // Revert optimistic update
          setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));

          if (resData?.message === 'CHAT_LIMIT_REACHED') {
            const limit = resData?.data?.limit || 5;
            popup.premiumRequired(
              `You've used all ${limit} conversations in your plan. Upgrade to Classic or above for unlimited chats.`,
              () => router.push('/(root)/screens/PremiumTab' as any)
            );
          } else {
            popup.premiumRequired(
              'Upgrade your plan to send messages.',
              () => router.push('/(root)/screens/PremiumTab' as any)
            );
          }
          return;
        }
      } catch (error: any) {
        console.error('Error sending message:', error);
        // Revert the optimistic update if API call fails
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));

        // Handle HTTP-level errors (actual 403 from server)
        const errData = error?.response?.data;
        if (errData?.message === 'CHAT_LIMIT_REACHED' || errData?.message === 'PLAN_UPGRADE_REQUIRED') {
          popup.premiumRequired(
            errData?.message === 'CHAT_LIMIT_REACHED'
              ? `You've used all ${errData?.data?.limit || 5} conversations. Upgrade for unlimited chats.`
              : 'Upgrade your plan to send messages.',
            () => router.push('/(root)/screens/PremiumTab' as any)
          );
          return;
        }
        popup.error('Send failed', 'Unable to send message. Please try again.');
      }

      // Refresh messages
      const response = await userApi.getConversationData(conversationId);
      if (response.data && response.data.data) {
        const formattedMessages = response.data.data.map((msg: any) => ({
          id: msg.id,
          text: msg.message,
          senderId: msg.senderId,
          timestamp: formatDate(msg.createdAt),
          isRead: msg.isRead,
          sender: msg.senderId == decryptedUserId ? 'me' : otherUserName,
          displayDateGroup: getDisplayDate(msg.createdAt),
        }));
        setMessages(formattedMessages.reverse());
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Revert the optimistic update if API call fails
      setMessages(prev => prev.filter(msg => msg.text !== inputText));
    }
  };



  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardShowListener = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillShow', onKeyboardShow)
      : Keyboard.addListener('keyboardDidShow', onKeyboardShow);

    const keyboardHideListener = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', onKeyboardHide)
      : Keyboard.addListener('keyboardDidHide', onKeyboardHide);

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const onKeyboardShow = (e: any) => {
    Animated.timing(animatedKeyboardHeight, {
      toValue: e.endCoordinates.height,
      duration: e.duration || 250,
      useNativeDriver: false,
    }).start();
  };

  const onKeyboardHide = (e: any) => {
    Animated.timing(animatedKeyboardHeight, {
      toValue: 0,
      duration: e.duration || 250,
      useNativeDriver: false,
    }).start();
  };

  const getDisplayDate = (rawDate: string) => {
    const msgDate = new Date(rawDate.replace(' ', 'T') + 'Z');
    const now = new Date();

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    // Today
    if (isSameDay(msgDate, now)) {
      return "Today";
    }

    // Yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(msgDate, yesterday)) {
      return "Yesterday";
    }

    // Older
    return msgDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePrintSelected = () => {
  }

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

  if (isLoading) {
    return <NativeBaseProvider>
      <LoadingScreen />
    </NativeBaseProvider>
  }

  if (!isPremium) {
    return <NativeBaseProvider>
      <PremiumRequiredScreen />
    </NativeBaseProvider>
  }

  return (

    <NativeBaseProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#075E54' }}>
        <MenuProvider>

          <ImageBackground
            source={require('../../../assets/images/whatsappBG.png')}
            style={{ flex: 1 }}
            imageStyle={{ resizeMode: 'cover' }}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#DADADA" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerContent}
                activeOpacity={0.7}
                onPress={() => router.push(`/screens/ProfileDetail?userId=${otherUserId}`)}
              >
                <Image
                  source={otherProfile ? { uri: otherProfile } : require('../../../assets/images/defaultAvatar.png')}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
                <View style={styles.headerTextContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.headerTitle} numberOfLines={1}
                      ellipsizeMode="tail">{otherUserName}</Text>
                    <View style={{ marginLeft: 6 }}>
                      <VerifiedBadges
                        idVerified={otherUserVerifications.idVerified}
                        educationVerified={otherUserVerifications.educationVerified}
                        incomeVerified={otherUserVerifications.incomeVerified}
                        mode="compact"
                        size="sm"
                      />
                    </View>
                  </View>
                  {!isBlockedByOtherUser && (
                    isOtherUserOnline ? (
                      <Text style={styles.lastSeen}>Online</Text>
                    ) : (
                      <Text style={styles.lastSeen}>last seen {otherUserLastseenTime}</Text>
                    )
                  )}
                </View>
              </TouchableOpacity>

              {/* Side menu option  */}
              <Menu>
                <MenuTrigger
                  customStyles={{
                    TriggerTouchableComponent: TouchableOpacity,
                    triggerWrapper: { width: 20 }
                  }}
                >
                  <Fontisto name="more-v-a" size={18} color="#DADADA" />
                </MenuTrigger>

                <MenuOptions
                  customStyles={{
                    optionsContainer: {
                      backgroundColor: 'white',
                      borderRadius: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      elevation: 5,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      alignSelf: 'center',
                      marginTop: 30,
                      width: '40%',
                    },
                  }}
                >
                  {/* Show UNBLOCK if user has blocked */}
                  {isBlockedByOtherUser ? (
                    // Optionally show a disabled state or nothing
                    <MenuOption disabled>
                      <Text style={[styles.item, { color: 'grey' }]}>
                        Blocked (No actions available)
                      </Text>
                    </MenuOption>
                  ) : isBlockedByMe ? (
                    <MenuOption onSelect={handleUnblockUser}>
                      <Text style={styles.item}>Unblock</Text>
                    </MenuOption>
                  ) : (
                    <>
                      {isShortlisted ? (
                        <MenuOption onSelect={handleUnshortlistUser}>
                          <Text style={styles.item}>Unshortlist</Text>
                        </MenuOption>
                      ) : (
                        <MenuOption onSelect={handleShortlistUser}>
                          <Text style={styles.item}>Shortlist</Text>
                        </MenuOption>
                      )}

                      <MenuOption onSelect={handleBlockUser}>
                        <View style={{ paddingVertical: 4, paddingHorizontal: 6 }}>
                          <Text style={[styles.item, { fontWeight: '600', paddingHorizontal: 0, paddingVertical: 0, marginBottom: 0 }]}>Block</Text>
                          <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                            Hide each other. Reversible.
                          </Text>
                        </View>
                      </MenuOption>

                      <MenuOption onSelect={handleReportUser}>
                        <View style={{ paddingVertical: 4, paddingHorizontal: 6 }}>
                          <Text style={[styles.item, { fontWeight: '600', color: '#dc2626', paddingHorizontal: 0, paddingVertical: 0, marginBottom: 0 }]}>Report User</Text>
                          <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                            Flag for moderator review. Anonymous.
                          </Text>
                        </View>
                      </MenuOption>

                      {/* <MenuOption onSelect={handlePrintSelected}>
                        <Text style={styles.item}>Delete</Text>
                      </MenuOption> */}
                    </>
                  )}
                </MenuOptions>
              </Menu>

              {/* </TouchableOpacity> */}

            </View>

            {/* Chat and Input */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <View style={{ flex: 1 }}>
                {/* Messages */}
                <FlatList
                  data={messages}
                  inverted
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={[styles.messagesContainer, { paddingTop: chatPadding }]}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item, index }) => {
                    const isMyMessage = item.senderId == decryptedUserId;
                    const showDateSeparator =
                      index === messages.length - 1 || item.displayDateGroup !== messages[index + 1]?.displayDateGroup;

                    return (
                      <View key={`message-${item.id}`}>
                        {showDateSeparator && (
                          <View style={styles.dateSeparatorContainer}>
                            <Text style={styles.dateSeparatorText}>{item.displayDateGroup}</Text>
                          </View>
                        )}

                        <View style={isMyMessage ? styles.messageRightContainer : styles.messageLeftContainer}>
                          {!isMyMessage && (
                            <Image source={profileImage ? { uri: profileImage } : require('../../../assets/images/defaultAvatar.png')} style={styles.avatar} />
                          )}

                          <View style={isMyMessage ? styles.messageMetaRight : styles.messageMetaLeft}>
                            <Text style={isMyMessage ? styles.messageRight : styles.messageLeft}>{item.text}</Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={isMyMessage ? styles.timestampRight : styles.timestampLeft}>
                                {item.timestamp}
                              </Text>
                              {isMyMessage &&
                                (item.isRead ? (
                                  <Ionicons name="checkmark-done-sharp" size={16} color="gray" />
                                ) : (
                                  <Ionicons name="checkmark-sharp" size={16} color="gray" />
                                ))}
                            </View>
                          </View>

                          {isMyMessage && (
                            <Image source={myProfile ? { uri: myProfile } : require('../../../assets/images/defaultAvatar.png')} style={styles.avatar} />
                          )}
                        </View>
                      </View>
                    );
                  }}
                />

                {/* Input */}
                <Animated.View style={[styles.inputContainer, { transform: [{ translateY: inputTranslateY }] }]}>

                  <Image source={myProfile ? { uri: myProfile } : require('../../../assets/images/defaultAvatar.png')} style={styles.avatar} />
                  <View style={styles.inputFieldWrapper}>
                    <TextInput
                      placeholder="Message"
                      value={inputText}
                      onChangeText={setInputText}
                      placeholderTextColor="#648772"
                      style={styles.textInput}
                    />
                    <View style={styles.iconWrapper}>
                      <TouchableOpacity onPress={handleSend}>
                        <Ionicons name="send" size={20} color="#648772" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              </View>
            </KeyboardAvoidingView>

            {/* Modal */}
            <Modal
              visible={showStatusModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowStatusModal(false)}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    backgroundColor: 'white',
                    padding: 20,
                    borderRadius: 12,
                    maxWidth: '80%',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#130001',
                      marginBottom: 20,
                      textAlign: 'center',
                    }}
                  >
                    {statusMessage}
                  </Text>
                  <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                    <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

          </ImageBackground>
        </MenuProvider>
        {showReportModal && (
          <Modal
            visible={showReportModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowReportModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowReportModal(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Report User</Text>
                    <Text style={styles.modalDescription}>
                      Are you sure you want to report this user for inappropriate behavior?
                    </Text>

                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Box alignItems="center" width="100%" marginBottom={5}>
                      <SelectList
                        setSelected={(val: string) => {
                          setSelectedReason(val)
                        }}
                        data={reportReasons}
                        save="value"
                        placeholder="Select Reason"
                        boxStyles={styles.input}
                        inputStyles={styles.inputTextstyle}
                        dropdownStyles={styles.dropdownBox}
                        searchPlaceholder="Search"
                        searchicon={<Ionicons name="search" size={17} />}
                        arrowicon={<Ionicons name="chevron-down" size={17} />}
                        closeicon={<Ionicons name="close" size={17} />}
                      />
                    </Box>

                    <View style={styles.modalButtons}>
                      <Pressable
                        style={[styles.cancelButton, { flex: 1, marginRight: 10 }]}
                        onPress={() => setShowReportModal(false)}
                      >
                        <Text style={[styles.buttonText, { color: '#130001' }]}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.reportButton, { flex: 1 }]}
                        onPress={handleReportSubmit}
                      >
                        <Text style={styles.buttonText}>Report</Text>
                      </Pressable>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}





      </SafeAreaView>
    </NativeBaseProvider>



  );
}

const styles = StyleSheet.create({
  container: { height: '100%' },
  menuTitle: {
    fontWeight: 'bold',
    marginBottom: 15,
  },
  item: {
    paddingVertical: 7,
    paddingHorizontal: 6,
    marginBottom: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: '#075E54',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginBottom: 10

  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#DADADA',
    marginTop: 4,
    marginBottom: 2,
    // flex: 1, // Takes up available space
    // overflow: 'hidden', 
  },
  lastSeen: {
    fontSize: 12,
    color: '#DADADA',
    opacity: 0.7,
  },
  messageLeft: {
    backgroundColor: '#FFFFFF',
    color: '#111714',
    padding: 12,
    borderRadius: 10,
    width: '100%'
  },
  timestampLeft: {
    color: '#111714',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 10,
  },
  timestampRight: {
    color: '#111714',
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 10,
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageRightContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    alignItems: 'flex-end',
  },
  messageLeftContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'flex-end',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 0 },
  messageMetaRight: { maxWidth: '75%', alignItems: 'flex-end', marginRight: 8 },
  messageMetaLeft: { maxWidth: '75%', alignItems: 'flex-start', marginLeft: 8 },
  name: { color: '#648772', fontSize: 13, marginBottom: 5 },
  messageRight: {
    backgroundColor: '#418FEB',
    color: '#DADADA',
    padding: 12,
    borderRadius: 10
  },
  // messageLeft: { 
  //   backgroundColor: '#fff', 
  //   color: '#111714',
  //   padding: 12, 
  //   borderRadius: 10 
  // },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#f0f4f2',
    backgroundColor: '#fff',
    marginBottom: 0,
    // paddingBottom: 25,
  },
  inputFieldWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f4f2',
    borderRadius: 10,
    alignItems: 'center',
    paddingRight: 10,

  },
  textInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    color: '#111714',
  },
  iconWrapper: { flexDirection: 'row', gap: 10 },
  dateSeparatorContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    backgroundColor: '#dcdcdc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#555',
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    maxWidth: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#130001',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: '#130001',
    marginBottom: 20,
    textAlign: 'center',
  },
  reasonLabel: {
    fontSize: 14,
    color: '#130001',
    marginBottom: 10,
  },
  dropdownContainer: {
    width: '100%',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  reportButton: {
    backgroundColor: '#418FEB',
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 14,
    color: '#DADADA',
  },
  dropdownBox: {
    borderWidth: 1,
    borderRadius: 6,
  },
  inputTextstyle: {
    fontSize: 14,
    // padding: 10,
  },
  input: {
    // height: '100%',
    // margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '100%',
    borderRadius: 10,
    borderColor: 'gray',
    color: '#F5F5F5',
    // marginBottom: 12,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    color: '#dc2626',
    textAlign: 'center',
  },
  premiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  premiumContent: {
    alignItems: 'center',
    padding: 20,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#130001',
    marginBottom: 10,
  },
  premiumText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: '#ec4899',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#DADADA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

});

export default ChatScreen;
