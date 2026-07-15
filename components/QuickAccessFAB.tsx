// ─────────────────────────────────────────────────────────────
//  QuickAccessFAB.tsx — Global "Quick Access" floating menu
//  Draggable · snap-to-edge · position persistence (same
//  mechanics as SupportFAB.tsx) · panel opens top-to-bottom or
//  bottom-to-top depending on where the FAB currently sits.
//  Items driven by keyValue "QUICK_ACCESS_MENU", cached in
//  AsyncStorage, hardcoded fallback if the fetch fails.
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInUp, FadeInDown, FadeOutUp, FadeOutDown,
  useSharedValue, useAnimatedStyle, withSpring, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  LayoutGrid, X, Crown, Star, Users, Heart, Lock, BookmarkCheck,
} from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../app/(root)/contexts/AuthContext';
import { useSubscription } from '../app/(root)/contexts/subscriptionContext';
import { usePopup } from '../app/(root)/contexts/PopupContext';
import userApi from '../app/(root)/api/userApi';
import { buildUpgradeAction } from '../app/(root)/utils/upgradeNavigation';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const FAB_SIZE = 60;
const DRAG_THRESHOLD = 6;
const EDGE_MARGIN = 12;
const FOOTER_HEIGHT = 82; // clears VVMFooterNav, mirrors SupportFAB's own constant
const ITEM_SIZE = 50;      // matches CSK reference's .fab-item circle size
const ITEM_GAP = 14;       // matches CSK's .fab-item margin-bottom
const STACK_GAP = 12;      // matches CSK's .fab-menu margin-bottom/top (gap from main FAB)
const LABEL_GAP = 12;      // gap between circle and its tooltip-style label
const LABEL_HEIGHT = 28;   // fixed height so the label can be vertically centered against its circle precisely
const SNAP_CONFIG = { damping: 18, stiffness: 200, mass: 0.8 };
const STORAGE_POSITION_KEY = 'quickAccessFabPosition';

const CACHE_KEY = 'quickAccessMenuCache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes — quick access items change rarely

// Plan hierarchy mirrors CLAUDE.md section 7 — used for minPlan gating
const PLAN_RANK: Record<string, number> = {
  Free: 0, Starter: 1, Classic: 2, Silver: 3, Gold: 4, Platinum: 5,
};

const ICON_MAP: Record<string, any> = {
  crown: Crown,
  star: Star,
  users: Users,
  heart: Heart,
  lock: Lock,
  'bookmark-check': BookmarkCheck,
};

type QuickAccessItem = {
  id: string;
  label: string;
  icon: string;
  color: string;
  minPlan: string | null;
  order: number;
};

// Backup data — used until the keyValue fetch resolves, and if it fails entirely
const DEFAULT_QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  { id: 'PREMIUM', label: 'Upgrade', icon: 'crown', color: '#F6B733', minPlan: null, order: 1 },
  { id: 'STAR_MATCH', label: 'Star Match', icon: 'star', color: '#420001', minPlan: null, order: 2 },
  { id: 'FAMILY_ACCESS', label: 'Family Access', icon: 'users', color: '#420001', minPlan: 'Gold', order: 3 },
  { id: 'FAVOURITES', label: 'My Favourites', icon: 'heart', color: '#F6B733', minPlan: null, order: 4 },
  { id: 'PERMISSION_REQUESTS', label: 'Permission Requests', icon: 'lock', color: '#420001', minPlan: null, order: 5 },
  { id: 'SHORTLISTED_YOU', label: 'Shortlisted You', icon: 'bookmark-check', color: '#F6B733', minPlan: 'Gold', order: 6 },
];

function isPlanAtLeast(planTitle: string | null | undefined, minPlan: string | null | undefined) {
  if (!minPlan) return true;
  const current = PLAN_RANK[planTitle || 'Free'] ?? 0;
  const required = PLAN_RANK[minPlan] ?? 0;
  return current >= required;
}

const QuickAccessFAB = () => {
  const { userId } = useAuth() || {};
  const { subscriptionData } = useSubscription() || {};
  const popup = usePopup();
  const insets = useSafeAreaInsets();

  const [open, setOpen] = useState(false);
  const [fabAnchor, setFabAnchor] = useState({ x: EDGE_MARGIN, y: SCREEN_H - insets.bottom - FOOTER_HEIGHT - FAB_SIZE - 24 });
  const [items, setItems] = useState<QuickAccessItem[]>(DEFAULT_QUICK_ACCESS_ITEMS);

  // ─── Drag bounds (identical approach to SupportFAB.tsx) ───
  const minY = insets.top + 10;
  const maxY = SCREEN_H - insets.bottom - FOOTER_HEIGHT - FAB_SIZE - 10;
  const minX = EDGE_MARGIN;
  const maxX = SCREEN_W - FAB_SIZE - EDGE_MARGIN;

  const translateX = useSharedValue(EDGE_MARGIN);
  const translateY = useSharedValue(SCREEN_H - insets.bottom - FOOTER_HEIGHT - FAB_SIZE - 24);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const isDragging = useSharedValue(0);

  // ─── Load saved position ───
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_POSITION_KEY).then((val) => {
      if (val) {
        try {
          const { x, y } = JSON.parse(val);
          const clampedX = Math.max(minX, Math.min(x, maxX));
          const clampedY = Math.max(minY, Math.min(y, maxY));
          translateX.value = clampedX;
          translateY.value = clampedY;
        } catch {
          // corrupt stored position — keep default
        }
      }
    });
  }, []);

  const savePosition = useCallback((x: number, y: number) => {
    AsyncStorage.setItem(STORAGE_POSITION_KEY, JSON.stringify({ x, y }));
  }, []);

  // ─── Load quick access items (cache → fetch → hardcoded fallback) ───
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached?.expiresAt > Date.now() && Array.isArray(cached?.items) && cached.items.length) {
            if (!cancelled) setItems(cached.items);
          }
        }
      } catch (e) {
        // corrupt cache — fall through to hardcoded default already in state
      }

      try {
        const res = await userApi.getQuickAccessMenu();
        const raw = res?.data?.data?.valueColumn;
        const parsed = raw ? JSON.parse(raw) : null;
        const fetched: QuickAccessItem[] | null =
          Array.isArray(parsed?.items) && parsed.items.length ? parsed.items : null;

        if (fetched) {
          const sorted = [...fetched].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          if (!cancelled) setItems(sorted);
          await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ items: sorted, expiresAt: Date.now() + CACHE_TTL })
          );
        }
      } catch (e) {
        // network/parse failure — keep whatever is already showing (cache or hardcoded default)
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => isPlanAtLeast(subscriptionData?.planTitle, item.minPlan)),
    [items, subscriptionData?.planTitle]
  );

  // ─── Tap toggles the panel; capture the FAB's current spot so the
  //     panel can anchor to it and pick an open direction ───
  const handleFabTap = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        setFabAnchor({ x: translateX.value, y: translateY.value });
      }
      return !prev;
    });
  }, []);

  // ─── Gestures (same pattern as SupportFAB.tsx: race tap vs pan) ───
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleFabTap)();
  });

  const panGesture = Gesture.Pan()
    .minDistance(DRAG_THRESHOLD)
    .enabled(!open) // disabled while the menu is open — dragging then would desync it from the stacked items
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      isDragging.value = 1;
    })
    .onUpdate((e) => {
      translateX.value = Math.max(minX, Math.min(startX.value + e.translationX, maxX));
      translateY.value = Math.max(minY, Math.min(startY.value + e.translationY, maxY));
    })
    .onEnd(() => {
      isDragging.value = 0;
      const snapX = translateX.value + FAB_SIZE / 2 < SCREEN_W / 2 ? minX : maxX;
      translateX.value = withSpring(snapX, SNAP_CONFIG);
      translateY.value = withSpring(translateY.value, SNAP_CONFIG);
      runOnJS(savePosition)(snapX, translateY.value);
    });

  const composedGesture = Gesture.Race(tapGesture, panGesture);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: isDragging.value ? 1.1 : 1 },
    ],
  }));

  const handlePress = useCallback((item: QuickAccessItem) => {
    setOpen(false);
    switch (item.id) {
      case 'PREMIUM':
        buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Premium Features' })();
        break;
      case 'STAR_MATCH':
        if (!subscriptionData?.entitlements?.starMatch) {
          popup.premiumRequired(
            'Star Match is available from Classic plan onwards. Upgrade to discover your compatibility score!',
            buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Star Match', minPlan: 'Classic' })
          );
          return;
        }
        router.push('/(root)/screens/StarMatch' as any);
        break;
      case 'FAMILY_ACCESS':
        router.push('/(root)/screens/FamilyAccessScreen' as any);
        break;
      case 'FAVOURITES':
        // myfavourite.tsx is a dead-end screen with hardcoded mock people/photos/locations —
        // never wired to any real API. The actual working "favourites" feature is the
        // Shortlisted list (same screen SHORTLISTED_YOU-style tiles already use).
        router.push({ pathname: '/(root)/screens/ListUser', params: { type: 'shortlisted' } } as any);
        break;
      case 'PERMISSION_REQUESTS':
        router.push({ pathname: '/(root)/(tabs)/mailBox', params: { initialTab: 'request' } } as any);
        break;
      case 'SHORTLISTED_YOU':
        if (!isPlanAtLeast(subscriptionData?.planTitle, 'Gold')) {
          popup.premiumRequired(
            'Upgrade to Gold to see who shortlisted your profile.',
            buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Who Shortlisted You', minPlan: 'Gold' })
          );
          return;
        }
        router.push({ pathname: '/(root)/screens/ListUser', params: { type: 'whoShortlistedMe', title: 'Who Shortlisted You' } } as any);
        break;
      default:
        break;
    }
  }, [subscriptionData, popup]);

  // Hidden pre-login (no userId yet) — same guard SupportFAB uses
  if (!userId) return null;

  // FAB sits in the bottom half of the screen → stack opens UPWARD (bottom-to-top).
  // FAB sits in the top half → stack opens DOWNWARD (top-to-bottom).
  const panelAbove = fabAnchor.y > SCREEN_H / 2;
  const fabCenterX = fabAnchor.x + FAB_SIZE / 2;
  const fabOnLeft = fabCenterX < SCREEN_W / 2;
  const EnterAnim = panelAbove ? FadeInUp : FadeInDown;
  const ExitAnim = panelAbove ? FadeOutDown : FadeOutUp;

  return (
    <>
      <View style={styles.fabRoot} pointerEvents="box-none">
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.fab, fabStyle]}>
            {open ? <X size={26} color="#fff" /> : <LayoutGrid size={24} color="#fff" />}
          </Animated.View>
        </GestureDetector>
      </View>

      {open && (
        <>
          <View style={styles.backdrop} pointerEvents="auto">
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOpen(false)} />
          </View>

          {visibleItems.map((item, idx) => {
            const IconComp = ICON_MAP[item.icon] || LayoutGrid;
            // Always position via `top`, anchored directly off fabAnchor.y — same coordinate
            // basis the FAB itself uses (transform: translateY). Using `bottom` here would
            // depend on the container's actual rendered height matching our SCREEN_H
            // constant, which drifts on some Android devices (status/nav bar handling) and
            // caused the stack to overlap the FAB when it drifted enough.
            const distanceFromFab = STACK_GAP + idx * (ITEM_SIZE + ITEM_GAP);
            const itemTop = Math.round(panelAbove
              ? fabAnchor.y - distanceFromFab - ITEM_SIZE
              : fabAnchor.y + FAB_SIZE + distanceFromFab);
            // Circle is positioned on its own, independent of the label — this guarantees it
            // stays exactly centered under/over the FAB regardless of how wide the label text
            // is. (Previously the circle+label shared one row whose width depended on the
            // label, which could throw the circle's centering off by half the label's width.)
            const circleLeft = Math.round(fabCenterX - ITEM_SIZE / 2);
            const labelTop = itemTop + ITEM_SIZE / 2 - LABEL_HEIGHT / 2;

            return (
              <React.Fragment key={item.id}>
                <Animated.View
                  entering={EnterAnim.delay(idx * 80).duration(300).springify().damping(15)}
                  exiting={ExitAnim.duration(150)}
                  style={[styles.itemCircleWrap, { top: itemTop, left: circleLeft }]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handlePress(item)}
                    style={[styles.itemCircle, { backgroundColor: item.color || '#420001' }]}
                  >
                    <IconComp size={22} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View
                  entering={EnterAnim.delay(idx * 80).duration(300).springify().damping(15)}
                  exiting={ExitAnim.duration(150)}
                  style={[
                    styles.itemLabelWrap,
                    { top: labelTop },
                    fabOnLeft
                      ? { left: circleLeft + ITEM_SIZE + LABEL_GAP }
                      : { right: SCREEN_W - circleLeft + LABEL_GAP },
                  ]}
                >
                  <Text style={styles.itemLabelText} numberOfLines={1}>{item.label}</Text>
                </Animated.View>
              </React.Fragment>
            );
          })}
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  fabRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9980,
    elevation: 9980,
  },
  fab: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#420001',
    borderWidth: 2,
    borderColor: '#F6B733',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 9979,
    elevation: 9979,
  },
  // Circle and label are independently positioned floating elements — no enclosing
  // card, matching the CSK reference's standalone .fab-item buttons. Positioning them
  // separately (rather than as one row) keeps the circle's center mathematically fixed
  // regardless of the label's text length.
  itemCircleWrap: {
    position: 'absolute',
    zIndex: 9981,
  },
  itemCircle: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  itemLabelWrap: {
    position: 'absolute',
    height: LABEL_HEIGHT,
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 9981,
  },
  itemLabelText: {
    fontSize: 12,
    fontFamily: 'Rubik-SemiBold',
    color: '#1e293b',
  },
});

export default React.memo(QuickAccessFAB);
