import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, StyleSheet, Keyboard, KeyboardAvoidingView, Platform, Animated, ImageBackground, Modal, FlatList, Alert, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Ionicons, Feather, Fontisto } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Box, NativeBaseProvider, Pressable, Toast } from 'native-base';
import VerifiedBadges from '../../../components/VerifiedBadges';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import userApi from '../api/userApi';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';
import { useAuth } from '../contexts/AuthContext';
import { webSocketService } from '../services/webSocketService';
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
import { buildUpgradeAction, upgradeMessage } from '../utils/upgradeNavigation';
import { REPORT_REASONS } from '@/constants/data';
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

// Extracted out of the FlatList's inline renderItem. That closure lived in a component whose
// state includes `inputText`, so every single keystroke in the message box re-rendered every
// mounted message bubble in the thread. Memoized with stable props, typing no longer touches
// the list at all.
const MessageBubble = React.memo(function MessageBubble({
  item,
  isMyMessage,
  showDateSeparator,
  otherAvatar,
  myAvatar,
  onReport,
}: {
  item: Message;
  isMyMessage: boolean;
  showDateSeparator: boolean;
  otherAvatar: any;
  myAvatar: any;
  onReport: (item: { id: string | number; text: string }) => void;
}) {
  return (
    <View>
      {showDateSeparator && (
        <View style={styles.dateSeparatorContainer}>
          <Text style={styles.dateSeparatorText}>{item.displayDateGroup}</Text>
        </View>
      )}

      <View style={isMyMessage ? styles.messageRightContainer : styles.messageLeftContainer}>
        {!isMyMessage && <Image source={otherAvatar} style={styles.avatar} />}

        <TouchableOpacity
          activeOpacity={isMyMessage ? 1 : 0.7}
          onLongPress={isMyMessage ? undefined : () => onReport({ id: item.id, text: item.text })}
          style={isMyMessage ? styles.messageMetaRight : styles.messageMetaLeft}
        >
          <Text style={isMyMessage ? styles.messageRight : styles.messageLeft}>{item.text}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={isMyMessage ? styles.timestampRight : styles.timestampLeft}>
              {item.timestamp}
            </Text>
            {isMyMessage &&
              (item.isRead ? (
                <Ionicons name="checkmark-done-sharp" size={16} color="#34B7F1" />
              ) : (
                <Ionicons name="checkmark-sharp" size={16} color="gray" />
              ))}
          </View>
        </TouchableOpacity>

        {isMyMessage && <Image source={myAvatar} style={styles.avatar} />}
      </View>
    </View>
  );
});

function ChatScreen() {
  const { userData } = useUserData();
  const popup = usePopup();
  const { userId: authUserId, addChatListener, removeChatListener } = useAuth();
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
  // isLoading only ever reflected the premium/subscription check, which resolves almost
  // instantly since subscriptionData comes from context (already cached app-wide) — so the
  // loading screen disappeared well before the actual conversation content (messages, other
  // user's online status, verification badges) had finished fetching, and the chat screen
  // popped in its real content late/blank-looking right after. This tracks that fetch instead.
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatStatus, setChatStatus] = useState('');
  const [initiatedBy, setInitiatedBy] = useState('');
  const [decryptedUserId, setDecryptedUserId] = useState<string>('');
  const [myProfile, setMyProfile] = useState<string>('');
  const [otherProfile, setOtherProfile] = useState<string>(profileImage || '');
  const [otherUserGender, setOtherUserGender] = useState<string>((route.otherUserGender as string) || '');
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


  // Shared with ProfileDetail.tsx — was previously a separate, out-of-sync list here (missing
  // "Fake Profile"/"Inappropriate Photos" for no reason).
  const reportReasons = REPORT_REASONS.map((r, i) => ({ key: String(i + 1), value: r }));

  // Set only when reporting a specific message (long-press on a bubble) rather than the whole
  // profile via the header menu — null means "reporting the profile itself".
  const [reportedMessage, setReportedMessage] = useState<{ id: string | number; text: string } | null>(null);
  // Blocking defaults to checked for a profile-level report (a decisive action) but unchecked for
  // a single reported message (you might still want to keep chatting after one bad message) —
  // either way it's now an explicit user choice, not a forced side effect of reporting.
  const [reportAlsoBlock, setReportAlsoBlock] = useState(true);

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
    setReportedMessage(null);
    setSelectedReason('');
    setReportAlsoBlock(true);
    setShowReportModal(true);
  };

  const handleReportMessage = useCallback((item: { id: string | number; text: string }) => {
    if (isParent) { blockedForParent('report messages'); return; }
    setReportedMessage(item);
    setSelectedReason('');
    setReportAlsoBlock(false);
    setShowReportModal(true);
  }, [isParent]);

  // Avatar sources resolved once per profile/gender change rather than per rendered bubble.
  const otherAvatarSource = React.useMemo(
    () =>
      profileImage
        ? { uri: profileImage }
        : otherUserGender === 'M'
          ? require('../../../assets/images/avatarMen.png')
          : otherUserGender === 'F'
            ? require('../../../assets/images/avatarWomen.png')
            : require('../../../assets/images/defaultAvatar.png'),
    [profileImage, otherUserGender]
  );

  const myAvatarSource = React.useMemo(
    () =>
      myProfile
        ? { uri: myProfile }
        : userData.gender === 'M'
          ? require('../../../assets/images/avatarMen.png')
          : userData.gender === 'F'
            ? require('../../../assets/images/avatarWomen.png')
            : require('../../../assets/images/defaultAvatar.png'),
    [myProfile, userData.gender]
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMyMessage = item.senderId == decryptedUserId;
      // The list is inverted, so the "next" item is the one below/older.
      const showDateSeparator =
        index === messages.length - 1 ||
        item.displayDateGroup !== messages[index + 1]?.displayDateGroup;

      return (
        <MessageBubble
          item={item}
          isMyMessage={isMyMessage}
          showDateSeparator={showDateSeparator}
          otherAvatar={otherAvatarSource}
          myAvatar={myAvatarSource}
          onReport={handleReportMessage}
        />
      );
    },
    [decryptedUserId, messages, otherAvatarSource, myAvatarSource, handleReportMessage]
  );

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

      const requestBody: Record<string, unknown> = {
        reportedByUserId: storedUserId,
        reportedUserId: parseInt(otherUserId),
        reason: reasonToSend,
        blockUser: reportAlsoBlock,
      };
      if (reportedMessage) {
        requestBody.reportedMessageId = reportedMessage.id;
        requestBody.messageContent = reportedMessage.text;
      }

      await userApi.reportUser(requestBody);
      setShowReportModal(false);

      const message = reportAlsoBlock
        ? 'User reported and blocked successfully.'
        : 'Your report has been submitted. Our team will review it.';
      // Only navigate away when blocking actually happened — the conversation becomes
      // unusable either way, but reporting a single message without blocking should let
      // the user stay right where they were.
      popup.success('Reported', message, reportAlsoBlock ? () => router.navigate('/myChatList') : undefined);
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
  // KeyboardAvoidingView's own 'padding' behavior measures its own onLayout position to decide
  // how much space to reserve, and on this screen that lands short, so we apply the real
  // measured keyboard height as explicit padding instead.
  //
  // ANDROID IS MEASURED, NOT ASSUMED. windowSoftInputMode="adjustResize" is set, but whether
  // Android honours it under edge-to-edge / targetSdk 35 turned out to be unreliable on device:
  // assuming it worked left the input behind the keyboard, and assuming it didn't parked the
  // input about two keyboard-heights up the screen. So instead of guessing, compare the window
  // height now against its keyboard-closed baseline — if the window genuinely shrank, the OS
  // already made room and adding padding would double-compensate; if it didn't, we compensate.
  // Self-correcting, so it behaves on devices/OEMs that differ either way.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // Measured height of the chat container itself, via onLayout. This is ground truth for
  // "did the OS resize us": useWindowDimensions was tried and does NOT reflect the resize under
  // edge-to-edge, and assuming either way was wrong on device (assume-resized → input behind the
  // keyboard; assume-not-resized → input two keyboard-heights up).
  //
  // Safe from feedback: paddingBottom below is applied INSIDE this container, so it never
  // changes the container's own frame height and can't re-trigger this measurement.
  const insets = useSafeAreaInsets();
  const [containerHeight, setContainerHeight] = useState(0);
  const openContainerHeightRef = useRef(0);


  // Baseline = container height while the keyboard is closed.
  useEffect(() => {
    if (keyboardHeight === 0 && containerHeight > openContainerHeightRef.current) {
      openContainerHeightRef.current = containerHeight;
    }
  }, [containerHeight, keyboardHeight]);

  // >100px so a status-/nav-bar shift is never mistaken for a keyboard resize.
  const containerShrankForKeyboard =
    openContainerHeightRef.current > 0 &&
    openContainerHeightRef.current - containerHeight > 100;

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setChatPadding(70); // ✅ Increase padding when keyboard is shown
        setKeyboardHeight(e?.endCoordinates?.height || 0);
        // Diagnostic for the keyboard-offset problem. console is NOT stripped in this project's
        // release builds (no transform-remove-console in babel.config.js), so these numbers show
        // up in `adb logcat` on a real APK — which is the only way to settle whether adjustResize
        // actually applied on a given device. Cheap and invisible to members; leave it.
        console.log('[chat-kb]', JSON.stringify({
          keyboardHeight: e?.endCoordinates?.height,
          containerHeight,
          baseline: openContainerHeightRef.current,
          shrank: openContainerHeightRef.current - containerHeight,
          insetBottom: insets.bottom,
        }));
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setChatPadding(10); // ✅ Increase padding when keyboard is shown
        setKeyboardHeight(0);
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
        // These three are independent of each other. They used to run as a serial await chain,
        // which meant the messages — the entire reason the user opened this screen — only started
        // loading after two unrelated round-trips had finished. allSettled so a failure in the
        // status/verification calls still lets the conversation render.
        const [onlineSettled, profileSettled, conversationSettled] = await Promise.allSettled([
          userApi.getUserOnlineStatus(otherUserId),
          userApi.getProfileDetails(otherUserId),
          userApi.getConversationData(conversationId),
        ]);

        if (onlineSettled.status === 'fulfilled') {
          const onlineStatusResponse = onlineSettled.value;
          setIsOtherUserOnline(onlineStatusResponse.data.data.isOnline);
          const formattedTime = formatLastSeenTime(onlineStatusResponse.data.data.lastSeen);
          setOtherUserLastseenTime(formattedTime);
        }

        // Verification flags for the header shield
        if (profileSettled.status === 'fulfilled') {
          const d = profileSettled.value?.data?.data;
          if (d) {
            setOtherUserVerifications({
              idVerified: d.idVerified === true,
              educationVerified: d.educationVerified === true,
              incomeVerified: d.incomeVerified === true,
            });
            if (d.gender) setOtherUserGender(d.gender);
          }
        } else {
          console.warn('[chatscreen] verification flags fetch failed:', profileSettled.reason?.message);
        }

        if (conversationSettled.status === 'rejected') throw conversationSettled.reason;
        const response = conversationSettled.value;
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

    setContentLoading(true);
    Promise.allSettled([fetchConversation(), fetchConversationStatus()]).finally(() => {
      setContentLoading(false);
    });

  }, [conversationId]);

  // Live delivery: the backend already pushes a WebSocket 'chat_message' event to the receiver
  // on every send (see ChatService.sendChatMessage), but nothing on this screen was ever
  // listening for it — messages only ever showed up on the NEXT full fetch (e.g. re-opening the
  // screen), never live while both sides were already chatting. Re-fetch from the same source of
  // truth used everywhere else in this file (rather than hand-building the message shape from
  // the WS payload, which lacks the DB row id / isRead / displayDateGroup).
  useEffect(() => {
    // AuthContext's userId is loaded asynchronously from AsyncStorage (see its checkUserStatus),
    // separate from decryptedUserId here (derived from UserDataContext). This screen can mount
    // and reach this effect before that async check resolves, in which case addChatListener bails
    // out silently ("Cannot add chat listener: User not logged in") and, without authUserId in the
    // dependency array, never retries — live message delivery would just never attach for that
    // session. Depending on it here makes the effect re-run the moment auth finishes loading.
    if (!authUserId) return;

    const handleIncomingMessage = (data: any) => {
      if (!data || String(data.conversationId) !== String(conversationId)) return;
      userApi.getConversationData(conversationId).then((response) => {
        if (response.data && response.data.data) {
          const formattedMessages = response.data.data.map((msg: any) => ({
            id: msg.id,
            text: msg.message,
            senderId: msg.senderId,
            timestamp: formatDate(msg.createdAt),
            isRead: msg.isRead,
            sender: msg.senderId == decryptedUserId ? 'me' : 'other',
            displayDateGroup: getDisplayDate(msg.createdAt),
          }));
          setMessages(formattedMessages.reverse());
        }
      }).catch((error) => console.error('Error refreshing conversation after live message:', error));

      // markAsRead was previously only ever called once on mount (see the effect above), so a
      // message that arrived live WHILE this screen was already open was shown to the reader but
      // never actually marked read in the DB — the sender's tick stayed single-grey forever and
      // the conversation list badge/bold-text never cleared even though the reader had plainly
      // seen it. Since we're already open and looking at this conversation, mark it read the
      // moment a new message lands; this also triggers the backend's 'message_read' WS push back
      // to the sender, flipping their tick to blue live.
      if (conversationId && decryptedUserId) {
        userApi.markAsRead(parseInt(conversationId), parseInt(decryptedUserId)).catch(() => { });
      }
    };

    addChatListener(handleIncomingMessage);
    return () => removeChatListener();
  }, [conversationId, decryptedUserId, authUserId]);

  // Live read receipts: markMessagesAsRead (called when the OTHER person opens/views this
  // conversation) now also pushes a 'message_read' WS event to us, the original sender — before
  // this, our sent messages' tick only ever flipped from single-grey to double-blue on the next
  // full re-fetch (e.g. leaving and re-opening the screen), never while both were still actively
  // chatting. Uses webSocketService directly since AuthContext's addChatListener is hardcoded to
  // the separate 'chat_message' channel only.
  useEffect(() => {
    const handleReadReceipt = (data: any) => {
      if (!data || String(data.conversationId) !== String(conversationId)) return;
      userApi.getConversationData(conversationId).then((response) => {
        if (response.data && response.data.data) {
          const formattedMessages = response.data.data.map((msg: any) => ({
            id: msg.id,
            text: msg.message,
            senderId: msg.senderId,
            timestamp: formatDate(msg.createdAt),
            isRead: msg.isRead,
            sender: msg.senderId == decryptedUserId ? 'me' : 'other',
            displayDateGroup: getDisplayDate(msg.createdAt),
          }));
          setMessages(formattedMessages.reverse());
        }
      }).catch((error) => console.error('Error refreshing conversation after read receipt:', error));
    };

    webSocketService.addListener('message_read', handleReadReceipt);
    return () => webSocketService.removeListener('message_read');
  }, [conversationId, decryptedUserId]);

  // Online status / last seen has no live push at all on the backend (no WebSocket broadcast
  // on connect/disconnect) — it was only ever fetched once on mount, so it went stale for the
  // whole time two people stayed in an open chat. Lightweight polling is a much smaller change
  // than building a full presence-broadcast system for what only needs to be "reasonably fresh"
  // in a matrimony chat, not real-time-precise.
  useEffect(() => {
    if (!otherUserId) return;
    const pollOnlineStatus = async () => {
      try {
        const onlineStatusResponse = await userApi.getUserOnlineStatus(otherUserId);
        setIsOtherUserOnline(onlineStatusResponse.data.data.isOnline);
        setOtherUserLastseenTime(formatLastSeenTime(onlineStatusResponse.data.data.lastSeen));
      } catch (_) { }
    };
    const intervalId = setInterval(pollOnlineStatus, 15000);
    return () => clearInterval(intervalId);
  }, [otherUserId]);

  const handleSend = async () => {
    if (!isPremium) {
      popup.premiumRequired(
        upgradeMessage('send messages and unlock unlimited chats'),
        buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Send Message' })
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

      // Update local state first for instant UI update. The FlatList is `inverted` and every
      // other place messages get loaded (getConversationData) stores them NEWEST-FIRST
      // (.reverse() after the chronological fetch) — index 0 renders at the visual bottom in an
      // inverted list. Appending here put the new message at the END of the array instead,
      // which rendered at the visual TOP (often off the currently-scrolled-into-view messages)
      // until the next WS-triggered refetch re-sorted everything — that's the "message shows at
      // the top with older ones below it, then corrects itself a couple seconds later" bug.
      setMessages(prev => [newMessage, ...prev]);
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
              `You've used all ${limit} conversations in your plan. ${upgradeMessage('get unlimited chats', 'Classic')}`,
              buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Unlimited Chats', minPlan: 'Classic' })
            );
          } else {
            popup.premiumRequired(
              upgradeMessage('send messages'),
              buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Send Message' })
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
            buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Send Message' })
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



  // NOTE: a second, duplicate keyboard listener pair used to live here, driving an
  // `animatedKeyboardHeight` Animated.Value and a `keyboardHeight` state that NOTHING ever
  // read — so it re-rendered this screen on every keyboard show/hide for no effect, and its
  // state name collided with the real one declared above. Removed.

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
      <ActivityIndicator size="large" color="#420001" />
      <Text style={[styles.loadingText, { marginTop: 14 }]}>Loading conversation...</Text>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );

  const PremiumRequiredScreen = () => (
    <TouchableOpacity
      style={styles.premiumContainer}
      onPress={buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Messaging' })}
    >
      <View style={styles.premiumContent}>
        <Ionicons name="lock-closed" size={40} color="#ec4899" />
        <Text style={styles.premiumTitle}>Premium Required</Text>
        <Text style={styles.premiumText}>
          Upgrade to Premium to send messages and enjoy full features
        </Text>
        <Pressable
          style={styles.upgradeButton}
          onPress={buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Messaging' })}
        >
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </Pressable>
      </View>
    </TouchableOpacity>
  );

  if (isLoading || contentLoading) {
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
                  source={
                    otherProfile
                      ? { uri: otherProfile }
                      : otherUserGender === 'M'
                        ? require('../../../assets/images/avatarMen.png')
                        : otherUserGender === 'F'
                          ? require('../../../assets/images/avatarWomen.png')
                          : require('../../../assets/images/defaultAvatar.png')
                  }
                  style={styles.profileImage}
                  resizeMode="cover"
                />
                <View style={styles.headerTextContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                    <Text style={styles.headerTitle} numberOfLines={1}
                      ellipsizeMode="tail">{otherUserName}</Text>
                    <View style={{ marginLeft: 6, flexShrink: 0 }}>
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
                          <Text style={[styles.item, { fontFamily: 'Rubik-Medium', paddingHorizontal: 0, paddingVertical: 0, marginBottom: 0 }]}>Block</Text>
                          <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                            Hide each other. Reversible.
                          </Text>
                        </View>
                      </MenuOption>

                      <MenuOption onSelect={handleReportUser}>
                        <View style={{ paddingVertical: 4, paddingHorizontal: 6 }}>
                          <Text style={[styles.item, { fontFamily: 'Rubik-Medium', color: '#dc2626', paddingHorizontal: 0, paddingVertical: 0, marginBottom: 0 }]}>Report User</Text>
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
            {/* behavior is left undefined on BOTH platforms; the lift is applied as an explicit
                paddingBottom below instead. Note this only works because the FlatList is bounded
                with flex:1 — an unbounded list overflows this container and pushes the input bar
                off-screen no matter what padding is set here (that was the original bug). */}
            <KeyboardAvoidingView
              behavior={undefined}
              onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
              style={{
                flex: 1,
                // iOS never auto-resizes, so it always needs the measured keyboard height.
                //
                // Android is decided by MEASUREMENT (see containerShrankForKeyboard above): if
                // this container actually got shorter, adjustResize already made room and adding
                // padding would double-compensate; if it didn't, we compensate ourselves. This
                // matters because the app is edge-to-edge (targetSdk 35), where adjustResize is
                // unreliable — which is exactly why it works in Expo Go (different manifest and
                // target SDK) but not in the release build.
                paddingBottom:
                  keyboardHeight === 0
                    ? 0
                    : Platform.OS === 'ios'
                      ? keyboardHeight
                      : containerShrankForKeyboard
                        ? 0
                        // Full keyboard height, NOT keyboardHeight - insets.bottom. Subtracting
                        // the inset assumed the SafeAreaView was still reserving the nav-bar
                        // strip, but with the keyboard up that strip is behind the keyboard and
                        // reserves nothing — so the subtraction ate ~48px, almost exactly the
                        // height of the input bar, leaving only a sliver of it visible.
                        : keyboardHeight,
              }}
            >
              <View style={{ flex: 1 }}>
                {/* Messages */}
                <FlatList
                  data={messages}
                  inverted
                  // flex:1 is REQUIRED, not cosmetic. A FlatList/ScrollView in a flex column
                  // without it is sized by its content rather than bounded by the parent — and
                  // messagesContainer sets flexGrow:1, so the list expanded past the parent and
                  // pushed its sibling (the input bar below) off-screen entirely, with or
                  // without the keyboard open. Bounding the list keeps the input in view and
                  // lets the keyboard paddingBottom above actually shrink the visible area.
                  style={{ flex: 1 }}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={[styles.messagesContainer, { paddingTop: chatPadding }]}
                  keyboardShouldPersistTaps="handled"
                  windowSize={10}
                  initialNumToRender={15}
                  maxToRenderPerBatch={10}
                  removeClippedSubviews={true}
                  renderItem={renderMessage}
                />

                {/* Input */}
                <Animated.View style={[styles.inputContainer, { transform: [{ translateY: inputTranslateY }] }]}>

                  <Image
                    source={
                      myProfile
                        ? { uri: myProfile }
                        : userData.gender === 'M'
                          ? require('../../../assets/images/avatarMen.png')
                          : userData.gender === 'F'
                            ? require('../../../assets/images/avatarWomen.png')
                            : require('../../../assets/images/defaultAvatar.png')
                    }
                    style={styles.avatar}
                  />
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
                    <Text style={{ color: '#007AFF', fontFamily: 'Rubik-Bold' }}>OK</Text>
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
                    <Text style={styles.modalTitle}>{reportedMessage ? 'Report Message' : 'Report User'}</Text>
                    <Text style={styles.modalDescription}>
                      {reportedMessage
                        ? 'Why are you reporting this message?'
                        : 'Are you sure you want to report this user for inappropriate behavior?'}
                    </Text>
                    {reportedMessage ? (
                      <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, color: '#374151', fontStyle: 'italic' }} numberOfLines={3}>
                          &ldquo;{reportedMessage.text}&rdquo;
                        </Text>
                      </View>
                    ) : null}

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

                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}
                      onPress={() => setReportAlsoBlock((v) => !v)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={reportAlsoBlock ? 'checkbox' : 'square-outline'} size={20} color={reportAlsoBlock ? '#dc2626' : '#94a3b8'} />
                      <Text style={{ fontSize: 13, fontFamily: 'Rubik-Medium', color: '#334155', flex: 1 }}>
                        Also block this user
                      </Text>
                    </TouchableOpacity>

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
    fontFamily: 'Rubik-Bold',
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
    justifyContent: 'center',
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
    fontFamily: 'Rubik-Bold',
    color: '#DADADA',
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  lastSeen: {
    fontSize: 12,
    color: '#DADADA',
    opacity: 0.7,
    includeFontPadding: false,
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
    // 'flex-start', NOT 'flex-end'. An inverted list lays its content out in a flipped
    // coordinate space, so 'flex-end' resolves to the VISUAL TOP — which is why a short
    // conversation sat up against the header with a large dead gap above the input, instead
    // of resting just above it the way every chat app does. ('flex-end' is the right value
    // for a NON-inverted chat list; this one is inverted.)
    justifyContent: 'flex-start',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

});

export default ChatScreen;
