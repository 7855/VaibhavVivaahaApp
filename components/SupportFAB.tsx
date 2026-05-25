// ─────────────────────────────────────────────────────────────
//  SupportFAB.tsx — Draggable floating support chat button
//  Snap-to-edge · Boundary constraints · Position persistence
//  Compact chat card with ticket-based conversations
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  StyleSheet, Dimensions, Modal, KeyboardAvoidingView,
  Platform, ActivityIndicator, Keyboard, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Headphones, X, Send, AlertCircle, HelpCircle,
  CreditCard, Shield, MessageCircle, ChevronDown, Bot,
} from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, withDelay,
  runOnJS, Easing, interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../app/(root)/contexts/AuthContext';
import { useUserData } from '../app/(root)/contexts/UserDataContext';
import { usePathname } from 'expo-router';
import userApi from '../app/(root)/api/userApi';
import dayjs from 'dayjs';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FAB_SIZE = 72;
const DRAG_THRESHOLD = 6;
const EDGE_MARGIN = 12;
const FOOTER_HEIGHT = 82;
const CARD_HEIGHT = 420;
const CARD_MARGIN = 16;
const SNAP_CONFIG = { damping: 18, stiffness: 200, mass: 0.8 };
const STORAGE_KEY = 'supportFabPosition';

const CATEGORIES = [
  { id: 'TECHNICAL', label: 'Technical', Icon: AlertCircle },
  { id: 'ACCOUNT', label: 'Account', Icon: HelpCircle },
  { id: 'PAYMENT', label: 'Payment', Icon: CreditCard },
  { id: 'SAFETY', label: 'Safety', Icon: Shield },
  { id: 'OTHER', label: 'Other', Icon: MessageCircle },
];

// ─── Message Bubble ────────────────────────────────────
const Bubble = ({ item }: { item: any }) => {
  const isUser = item.senderType === 'USER';
  return (
    <View style={[bub.row, isUser ? bub.rowRight : bub.rowLeft]}>
      <View style={[bub.bubble, isUser ? bub.bubbleUser : bub.bubbleAdmin]}>
        <Text style={[bub.text, isUser ? bub.textUser : bub.textAdmin]}>
          {item.message}
        </Text>
        <Text style={[bub.time, isUser ? bub.timeUser : bub.timeAdmin]}>
          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
        </Text>
      </View>
    </View>
  );
};

// ─── Main Component ────────────────────────────────────
const SupportFAB: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { userData } = useUserData();
  const pathname = usePathname();

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [catHint, setCatHint] = useState(false);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [showTicketList, setShowTicketList] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [fabOnRight, setFabOnRight] = useState(true);
  const [showCloud, setShowCloud] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<any>(null);

  // ─── Track keyboard ──────────────────────────
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // ─── Cloud show/hide cycle (3s on, every 30s) ──
  useEffect(() => {
    setShowCloud(true);
    const hideTimer = setTimeout(() => setShowCloud(false), 3000);
    const interval = setInterval(() => {
      setShowCloud(true);
      setTimeout(() => setShowCloud(false), 3000);
    }, 30000);
    return () => { clearTimeout(hideTimer); clearInterval(interval); };
  }, []);

  // ─── Show cloud on tab/screen change ──
  useEffect(() => {
    setShowCloud(true);
    const t = setTimeout(() => setShowCloud(false), 3000);
    return () => clearTimeout(t);
  }, [pathname]);

  // Drag state
  const translateX = useSharedValue(SCREEN_W - FAB_SIZE - EDGE_MARGIN);
  const translateY = useSharedValue(SCREEN_H - insets.bottom - FOOTER_HEIGHT - FAB_SIZE - 20);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const totalDist = useSharedValue(0);
  const isDragging = useSharedValue(0);
  const floatY = useSharedValue(0);
  const shadowScale = useSharedValue(1);

  // ─── Floating bounce animation (restart when chat closes) ────
  const startFloatAnimation = useCallback(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ), -1, true,
    );
    shadowScale.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ), -1, true,
    );
  }, []);

  useEffect(() => {
    startFloatAnimation();
  }, []);

  useEffect(() => {
    if (!chatOpen) {
      // Restart animation when chat closes
      floatY.value = 0;
      shadowScale.value = 1;
      setTimeout(() => startFloatAnimation(), 100);
    }
  }, [chatOpen]);

  const minY = insets.top + 10;
  const maxY = SCREEN_H - insets.bottom - FOOTER_HEIGHT - FAB_SIZE - 10;
  const minX = EDGE_MARGIN;
  const maxX = SCREEN_W - FAB_SIZE - EDGE_MARGIN;

  // ─── Load saved position ─────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) {
        try {
          const { x, y } = JSON.parse(val);
          translateX.value = Math.max(minX, Math.min(x, maxX));
          translateY.value = Math.max(minY, Math.min(y, maxY));
          setFabOnRight(x + FAB_SIZE / 2 > SCREEN_W / 2);
        } catch {}
      }
    });
  }, []);

  // ─── Poll unread count ───────────────────────────
  useEffect(() => {
    if (!userData?.userId) return;
    const poll = () => {
      userApi.getSupportUnreadCount(userData.userId)
        .then((res: any) => {
          if (res.data?.code === 200) setUnreadCount(res.data.data || 0);
        })
        .catch(() => {});
    };
    poll();
    pollRef.current = setInterval(poll, 60000);
    return () => clearInterval(pollRef.current);
  }, [userData?.userId]);

  // ─── Save position ──────────────────────────────
  const savePosition = useCallback((x: number, y: number) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
    setFabOnRight(x + FAB_SIZE / 2 > SCREEN_W / 2);
  }, []);

  // ─── Open chat ──────────────────────────────────
  const openChat = useCallback(async () => {
    setChatOpen(true);
    setUnreadCount(0);
    setShowTicketList(false);
    if (!userData?.userId) return;
    setLoading(true);
    try {
      // Fetch active ticket
      const res = await userApi.getActiveSupportTicket(userData.userId);
      if (res.data?.code === 200 && res.data.data) {
        setActiveTicket(res.data.data.ticket);
        setMessages(res.data.data.messages || []);
      } else {
        setActiveTicket(null);
        setMessages([]);
      }
      // Fetch all tickets for history
      const allRes = await userApi.getMySupportTickets(userData.userId, 0, 20);
      if (allRes.data?.code === 200) {
        setAllTickets(allRes.data.data || []);
      }
    } catch {
      setActiveTicket(null);
      setMessages([]);
    }
    setLoading(false);
  }, [userData?.userId]);

  // ─── Send message ───────────────────────────────
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !userData?.userId || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    Keyboard.dismiss();

    try {
      if (activeTicket) {
        const res = await userApi.replyToSupportTicket(
          activeTicket.id, userData.userId, { message: text }
        );
        if (res.data?.code === 200 && res.data.data) {
          setMessages(res.data.data.messages || []);
        }
      } else {
        if (!selectedCategory) {
          setInputText(text);
          setSending(false);
          setCatHint(true);
          setTimeout(() => setCatHint(false), 3000);
          return;
        }
        const res = await userApi.createSupportTicket(userData.userId, {
          subject: selectedCategory + ' Support',
          category: selectedCategory,
          message: text,
        });
        if (res.data?.code === 200 && res.data.data) {
          setActiveTicket(res.data.data.ticket);
          setMessages(res.data.data.messages || []);
        }
      }
    } catch {}
    setSending(false);
  }, [inputText, activeTicket, selectedCategory, userData?.userId, sending]);

  // ─── Start new topic ────────────────────────────
  const handleNewTopic = useCallback(() => {
    setShowTicketList(false);
    setActiveTicket(null);
    setMessages([]);
    setSelectedCategory('');
    setInputText('');
    setCatHint(false);
  }, []);

  // ─── Switch to a specific ticket ──────────────
  const handleSwitchTicket = useCallback(async (ticket: any) => {
    setShowTicketList(false);
    setLoading(true);
    try {
      const res = await userApi.getTicketMessages(ticket.id);
      if (res.data?.code === 200) {
        setActiveTicket(ticket);
        setMessages(res.data.data || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  // ─── Refresh messages when chat is open ─────────
  useEffect(() => {
    if (!chatOpen || !activeTicket?.id) return;
    const iv = setInterval(async () => {
      try {
        const res = await userApi.getTicketMessages(activeTicket.id);
        if (res.data?.code === 200) setMessages(res.data.data || []);
      } catch {}
    }, 15000);
    return () => clearInterval(iv);
  }, [chatOpen, activeTicket?.id]);

  // ─── Gestures ───────────────────────────────────
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(openChat)();
    });

  const panGesture = Gesture.Pan()
    .minDistance(DRAG_THRESHOLD)
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      isDragging.value = 1;
    })
    .onUpdate((e) => {
      const newX = Math.max(minX, Math.min(startX.value + e.translationX, maxX));
      const newY = Math.max(minY, Math.min(startY.value + e.translationY, maxY));
      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      isDragging.value = 0;
      const snapX = translateX.value + FAB_SIZE / 2 < SCREEN_W / 2
        ? minX : maxX;
      translateX.value = withSpring(snapX, SNAP_CONFIG);
      translateY.value = withSpring(translateY.value, SNAP_CONFIG);
      runOnJS(savePosition)(snapX, translateY.value);
    });

  const composedGesture = Gesture.Race(tapGesture, panGesture);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + (isDragging.value ? 0 : floatY.value) },
      { scale: isDragging.value ? 1.1 : 1 },
    ],
  }));

  // Chat animation
  const chatScale = useSharedValue(0);
  const chatOpacity = useSharedValue(0);

  useEffect(() => {
    if (chatOpen) {
      chatOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
      chatScale.value = withSpring(1, { damping: 20, stiffness: 300, mass: 0.6 });
    } else {
      chatOpacity.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) });
      chatScale.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) });
    }
  }, [chatOpen]);

  const chatAnimStyle = useAnimatedStyle(() => ({
    opacity: chatOpacity.value,
    transform: [
      { scale: chatScale.value },
      { translateY: interpolate(chatScale.value, [0, 1], [30, 0]) },
    ],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: chatOpacity.value,
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: isDragging.value ? 0.6 : shadowScale.value },
    ],
    opacity: isDragging.value ? 0.15 : interpolate(shadowScale.value, [0.7, 1], [0.3, 0.15]),
  }));

  // Don't render if not logged in
  if (!userId) return null;

  const cardAbove = translateY.value > SCREEN_H / 2;

  return (
    <>
      {/* ── FAB Button (3D) ── */}
      <GestureHandlerRootView style={S.fabRoot}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[S.fab, fabStyle]}>
            {/* Speech cloud */}
            {showCloud && !chatOpen && (
              <View style={[
                S.fabCloud,
                fabOnRight ? S.fabCloudLeft : S.fabCloudRight,
              ]}>
                <Text style={[S.fabCloudText, unreadCount > 0 && S.fabCloudTextAlert]} numberOfLines={1}>
                  {unreadCount > 0 ? 'New reply!' : 'Need help?'}
                </Text>
                <View style={[
                  S.fabCloudCaret,
                  fabOnRight ? S.fabCloudCaretLeft : S.fabCloudCaretRight,
                ]} />
              </View>
            )}
            {/* Robot image */}
            <View style={S.fabGrad}>
              <Image
                source={require('../assets/images/supportrobot.png')}
                style={S.fabGif}
              />
            </View>
            {/* Ground shadow */}
            <Animated.View style={[S.fabShadow, shadowStyle]} />
            {unreadCount > 0 && (
              <View style={S.badge}>
                <Text style={S.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {/* ── Tooltip Chat Bubble (no Modal — pure animated overlay) ── */}
      {chatOpen && (
        <>
          {/* Backdrop */}
          <Animated.View style={[S.backdrop, backdropAnimStyle]} pointerEvents="auto">
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setChatOpen(false)} />
          </Animated.View>

          {/* Tooltip card */}
          <Animated.View style={[
            S.tooltip,
            { bottom: (keyboardHeight > 0 ? keyboardHeight + 10 : insets.bottom + FOOTER_HEIGHT + FAB_SIZE + 12), right: 14 },
            chatAnimStyle,
          ]}>
            {/* Caret */}
            <View style={S.tooltipCaret} />

            {/* Header */}
            <View style={S.ttHeader}>
              <View style={S.ttHeaderLeft}>
                <View style={S.ttAvatarWrap}>
                  <Image source={require('../assets/images/supportrobot.png')} style={S.ttAvatar} />
                  <View style={S.ttOnlineDot} />
                </View>
                <View style={S.ttHeaderText}>
                  <Text style={S.ttTitle}>VVM Support</Text>
                  <Text style={S.ttStatus}>
                    {activeTicket ? `Ticket #${activeTicket.id}` : 'Online · Reply in ~10 min'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setChatOpen(false)} style={S.ttClose}>
                <X size={18} color="#64748b" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={S.ttDivider} />

            {loading ? (
              <View style={S.loadingWrap}>
                <ActivityIndicator size="small" color="#1F7FE5" />
                <Text style={S.loadingText}>Loading...</Text>
              </View>
            ) : (
              <>
                {/* Category chips (new ticket) */}
                {!activeTicket && messages.length === 0 && (
                  <View style={S.catWrap}>
                    <Text style={S.catLabel}>Pick a topic to get started</Text>
                    <View style={S.catRow}>
                      {CATEGORIES.map(cat => {
                        const active = selectedCategory === cat.id;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            style={[S.catChip, active && S.catChipActive]}
                            onPress={() => { setSelectedCategory(cat.id); setCatHint(false); }}
                            activeOpacity={0.7}
                          >
                            <cat.Icon size={12} color={active ? '#fff' : '#64748b'} strokeWidth={2} />
                            <Text style={[S.catChipText, active && S.catChipTextActive]}>
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {catHint && (
                      <Text style={S.catHintText}>⬆ Please select a topic first</Text>
                    )}
                  </View>
                )}

                {/* Ticket switcher bar */}
                {activeTicket && !showTicketList && (
                  <View style={S.switchBar}>
                    <TouchableOpacity onPress={() => setShowTicketList(true)} style={S.switchBtn} activeOpacity={0.7}>
                      <ChevronDown size={12} color="#64748b" strokeWidth={2} />
                      <Text style={S.switchBtnText}>
                        Ticket #{activeTicket.id}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNewTopic} style={S.newTopicBtn} activeOpacity={0.7}>
                      <Text style={S.newTopicText}>+ New</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Ticket list (switch between tickets) */}
                {showTicketList && (
                  <View style={S.ticketListWrap}>
                    <View style={S.ticketListHeader}>
                      <Text style={S.ticketListTitle}>Your conversations</Text>
                      <TouchableOpacity onPress={() => setShowTicketList(false)}>
                        <X size={16} color="#64748b" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={allTickets}
                      keyExtractor={(item) => item.id?.toString()}
                      style={{ maxHeight: 180 }}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[S.ticketItem, activeTicket?.id === item.id && S.ticketItemActive]}
                          onPress={() => handleSwitchTicket(item)}
                          activeOpacity={0.7}
                        >
                          <View style={S.ticketItemLeft}>
                            <View style={[S.ticketDot, { backgroundColor: item.status === 'CLOSED' ? '#94a3b8' : '#22c55e' }]} />
                            <View style={{ flex: 1 }}>
                              <Text style={S.ticketItemTitle} numberOfLines={1}>
                                Ticket #{item.id}
                              </Text>
                              <Text style={S.ticketItemSub} numberOfLines={1}>
                                {item.subject || 'Support Request'}
                              </Text>
                            </View>
                          </View>
                          <Text style={S.ticketItemStatus}>{item.status}</Text>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <Text style={S.ticketEmptyText}>No previous conversations</Text>
                      }
                    />
                    <TouchableOpacity onPress={handleNewTopic} style={S.newTopicFullBtn} activeOpacity={0.7}>
                      <MessageCircle size={14} color="#fff" strokeWidth={2} />
                      <Text style={S.newTopicFullText}>Start New Conversation</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Messages */}
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={(item, i) => item.id?.toString() || i.toString()}
                  renderItem={({ item }) => <Bubble item={item} />}
                  style={S.msgList}
                  contentContainerStyle={S.msgContent}
                  onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={S.emptyWrap}>
                      <Image source={require('../assets/images/supportrobot.png')} style={S.emptyBot} />
                      <Text style={S.emptyTitle}>
                        {activeTicket ? 'Continue the conversation' : 'Hi there! 👋'}
                      </Text>
                      <Text style={S.emptyText}>
                        {activeTicket ? 'Type below to reply' : 'Pick a topic and send us a message'}
                      </Text>
                    </View>
                  }
                />

                {/* Input */}
                <View style={S.ttInputBar}>
                  <TextInput
                    style={S.ttInput}
                    placeholder={activeTicket ? 'Reply...' : 'Type your message...'}
                    placeholderTextColor="#94a3b8"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[S.ttSendBtn, (!inputText.trim() || sending) && S.ttSendBtnOff]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || sending}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Send size={15} color="#fff" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </>
      )}
    </>
  );
};

// ─── Bubble Styles ─────────────────────────────────
const bub = StyleSheet.create({
  row: { marginVertical: 4, paddingHorizontal: 14 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 10 },
  bubbleUser: { backgroundColor: '#162336', borderBottomRightRadius: 6 },
  bubbleAdmin: { backgroundColor: '#f1f5f9', borderBottomLeftRadius: 6 },
  text: { fontSize: 14, fontFamily: 'Rubik-Regular', lineHeight: 21 },
  textUser: { color: '#fff' },
  textAdmin: { color: '#1e293b' },
  time: { fontSize: 10, fontFamily: 'Rubik-Regular', marginTop: 5 },
  timeUser: { color: 'rgba(255,255,255,0.55)', textAlign: 'right' },
  timeAdmin: { color: '#94a3b8' },
});

// ─── Main Styles ───────────────────────────────────
const S = StyleSheet.create({
  fabRoot: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
    zIndex: 9990,
  },
  fab: {
    position: 'absolute',
    top: 0, left: 0,
    width: FAB_SIZE, height: FAB_SIZE,
  },
  fab3dShadow: {
    position: 'absolute', top: 4, left: 1, right: -1,
    width: FAB_SIZE, height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#0d3b6e',
    opacity: 0.4,
  },
  fab3dMid: {
    position: 'absolute', top: 2, left: 0.5, right: -0.5,
    width: FAB_SIZE, height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#1255a0',
    opacity: 0.6,
  },
  fabCloud: {
    position: 'absolute',
    top: -2,
    backgroundColor: '#0f1724',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 10,
    ...Platform.select({
      ios: { shadowColor: '#0f1724', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  fabCloudLeft: {
    right: FAB_SIZE - 10,
  },
  fabCloudRight: {
    left: FAB_SIZE - 10,
  },
  fabCloudText: {
    fontSize: 10,
    fontFamily: 'Rubik-Medium',
    color: '#fff',
  },
  fabCloudTextAlert: {
    color: '#ef4444',
  },
  fabCloudCaret: {
    position: 'absolute',
    bottom: 6,
    width: 10,
    height: 10,
    backgroundColor: '#0f1724',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    ...Platform.select({
      ios: { shadowColor: '#0f1724', shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  fabCloudCaretLeft: {
    right: -4,
  },
  fabCloudCaretRight: {
    left: -4,
  },
  fabGrad: {
    width: FAB_SIZE, height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  fabGif: {
    width: FAB_SIZE + 10, height: FAB_SIZE + 10,
    resizeMode: 'contain',
  },
  fabShadow: {
    position: 'absolute',
    bottom: 4,
    left: (FAB_SIZE - FAB_SIZE * 0.3) / 2,
    width: FAB_SIZE * 0.3,
    height: 4,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: '#EF4444', borderWidth: 2.5, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontFamily: 'Rubik-Bold', color: '#fff', lineHeight: 12 },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 9989,
  },

  // Tooltip
  tooltip: {
    position: 'absolute',
    width: SCREEN_W - 28,
    maxHeight: SCREEN_H * 0.55,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 9991,
    ...Platform.select({
      ios: { shadowColor: '#0f1724', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 30 },
      android: { elevation: 14 },
    }),
  },
  tooltipCaret: {
    position: 'absolute', bottom: -8, right: 30,
    width: 16, height: 16,
    backgroundColor: '#fff',
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
    ...Platform.select({
      ios: { shadowColor: '#0f1724', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },

  // Header
  ttHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  ttHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  ttAvatarWrap: { position: 'relative' },
  ttAvatar: { width: 38, height: 38, borderRadius: 19, resizeMode: 'cover' },
  ttOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff',
  },
  ttHeaderText: { flex: 1 },
  ttTitle: { fontSize: 15, fontFamily: 'Rubik-Bold', color: '#0f1724', letterSpacing: -0.2 },
  ttStatus: { fontSize: 11, fontFamily: 'Rubik-Regular', color: '#94a3b8', marginTop: 1 },
  ttClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  ttDivider: { height: 1, backgroundColor: '#f1f5f9' },

  // Loading
  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  loadingText: { fontSize: 12, fontFamily: 'Rubik-Medium', color: '#94a3b8', marginTop: 8 },

  // Categories
  catWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  catLabel: { fontSize: 12, fontFamily: 'Rubik-Medium', color: '#475569', marginBottom: 8 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0',
    backgroundColor: '#fafbfc',
  },
  catChipActive: { backgroundColor: '#0f1724', borderColor: '#0f1724' },
  catChipText: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#64748b' },
  catChipTextActive: { color: '#fff' },
  catHintText: {
    fontSize: 11, fontFamily: 'Rubik-Medium', color: '#ef4444',
    marginTop: 8,
  },
  // Switcher bar
  switchBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12,
  },
  switchBtnText: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#64748b' },
  newTopicBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#eff6ff', borderRadius: 12,
  },
  newTopicText: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#1F7FE5' },

  // Ticket list
  ticketListWrap: { paddingHorizontal: 12, paddingVertical: 10 },
  ticketListHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketListTitle: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#1e293b' },
  ticketItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 10, marginBottom: 4,
  },
  ticketItemActive: { backgroundColor: '#eff6ff' },
  ticketItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  ticketDot: { width: 8, height: 8, borderRadius: 4 },
  ticketItemTitle: { fontSize: 12, fontFamily: 'Rubik-Medium', color: '#1e293b' },
  ticketItemSub: { fontSize: 10, fontFamily: 'Rubik-Regular', color: '#94a3b8', marginTop: 1 },
  ticketItemStatus: { fontSize: 9, fontFamily: 'Rubik-Medium', color: '#94a3b8', textTransform: 'uppercase' },
  ticketEmptyText: { fontSize: 12, fontFamily: 'Rubik-Regular', color: '#94a3b8', textAlign: 'center', paddingVertical: 16 },
  newTopicFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, marginTop: 8,
    backgroundColor: '#0f1724', borderRadius: 12,
  },
  newTopicFullText: { fontSize: 12, fontFamily: 'Rubik-Medium', color: '#fff' },

  // Messages
  msgList: { flex: 1, minHeight: 100 },
  msgContent: { paddingVertical: 8 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emptyBot: { width: 56, height: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontFamily: 'Rubik-Bold', color: '#1e293b', marginBottom: 3 },
  emptyText: {
    fontSize: 12, fontFamily: 'Rubik-Regular', color: '#94a3b8',
    textAlign: 'center', paddingHorizontal: 24, lineHeight: 17,
  },

  // Input
  ttInputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  ttInput: {
    flex: 1, minHeight: 38, maxHeight: 72,
    backgroundColor: '#f8fafc', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9,
    fontSize: 13, fontFamily: 'Rubik-Regular', color: '#0f1724',
    borderWidth: 1, borderColor: '#e8ecf0',
  },
  ttSendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#0f1724',
    alignItems: 'center', justifyContent: 'center',
  },
  ttSendBtnOff: { backgroundColor: '#cbd5e1' },
});

export default SupportFAB;
