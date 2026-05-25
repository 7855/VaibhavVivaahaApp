import React, { useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
  Easing,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Theme ────────────────────────────────────────────────────────────────────
// Card bg: deep maroon. Active: gold circle + maroon icon. Inactive: soft white.
const CARD_BG      = "#420001";   // maroon card
const ACTIVE_BG    = "#F6B733";   // gold active circle
const ACTIVE_ICON  = "#420001";   // maroon icon inside gold circle
const ACTIVE_LABEL = "#F6B733";   // gold label
const INACTIVE_IC  = "rgba(255,255,255,0.60)";  // soft white icon
const INACTIVE_LB  = "rgba(255,255,255,0.50)";  // softer white label

// ─── Layout ───────────────────────────────────────────────────────────────────
const CARD_H     = 66;
const BOTTOM_GAP = 10;   // reduced — less bottom space
const ICON_BOX   = 38;   // active circle size

// ─── Tab definitions ──────────────────────────────────────────────────────────
interface TabDef {
  route: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFill: keyof typeof Ionicons.glyphMap;
}

const TABS: TabDef[] = [
  { route: "index", label: "Home", icon: "home-outline", iconFill: "home" },
  { route: "explore", label: "Explore", icon: "compass-outline", iconFill: "compass" },
  { route: "myChatList", label: "Chat", icon: "chatbubble-ellipses-outline", iconFill: "chatbubble-ellipses" },
  { route: "mailBox", label: "Request", icon: "heart-outline", iconFill: "heart" },
  { route: "profile", label: "Profile", icon: "person-outline", iconFill: "person" },
];

// ─── Tab ──────────────────────────────────────────────────────────────────────
const Tab = React.memo<{
  cfg: TabDef;
  isFocused: boolean;
  onPress: () => void;
}>(({ cfg, isFocused, onPress }) => {
  /**
   * Only ONE animated value — scale on the icon box.
   * useNativeDriver: true → UI thread, zero JS jank.
   * Colors/backgrounds snap instantly (no animation) — fast & clean.
   */
  /**
   * Inactive stays at scale 1 always — full size, no shrinking.
   * Active does a quick pop: springs from 0.82 → 1 on focus.
   * This gives a satisfying press feel without making inactive items small.
   */
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    scale.stopAnimation();
    if (isFocused) {
      // Pop: snap down then spring back to 1
      scale.setValue(0.82);
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Inactive always full size — no shrink
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.slot}
    >
      {/* Icon box — full size always, maroon bg only when active */}
      <Animated.View
        style={[
          styles.iconBox,
          isFocused ? styles.iconBoxActive : styles.iconBoxInactive,
          { transform: [{ scale }] },
        ]}
      >
        <Ionicons
          name={isFocused ? cfg.iconFill : cfg.icon}
          size={isFocused ? 19 : 22}
          color={isFocused ? ACTIVE_ICON : INACTIVE_IC}
        />
      </Animated.View>

      {/* Label — full size, color snaps instantly */}
      <Text
        numberOfLines={1}
        style={[styles.label, isFocused ? styles.labelOn : styles.labelOff]}
      >
        {cfg.label}
      </Text>

      {/* Gold dot under active label */}
      {isFocused && <View style={styles.dot} />}
    </TouchableOpacity>
  );
});

// ─── Nav Bar ──────────────────────────────────────────────────────────────────
const PremiumNavBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const safe = Math.max(insets.bottom, 0);

  const press = (route: any, index: number) => {
    const isFocused = state.index === index;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate({
        name: route.name,
        params: route.params,
        merge: true,
      } as any);
    }
  };

  // No shell wrapper — card is absolutely positioned just like original CustomNav.
  // This eliminates any background leaking from a container view entirely.
  return (
    <View style={[styles.card, { bottom: BOTTOM_GAP + safe }]}>
      {state.routes.map((route, index) => {
        if (["_sitemap", "+not-found"].includes(route.name)) return null;
        const cfg = TABS.find((t) => t.route === route.name);
        if (!cfg) return null;
        return (
          <Tab
            key={route.key}
            cfg={cfg}
            isFocused={state.index === index}
            onPress={() => press(route, index)}
          />
        );
      })}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Floating maroon pill card
  card: {
    position: "absolute",
    left: "5%",
    right: "5%",
    height: CARD_H,
    borderRadius: CARD_H / 2,
    backgroundColor: CARD_BG,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 14,
  },

  // Equal-width flex slot
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: CARD_H,
    paddingVertical: 8,
    gap: 2,           // tight gap between icon and label
  },

  // Icon container — fixed size, alignment never shifts
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: ICON_BOX / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: {
    backgroundColor: ACTIVE_BG,      // gold circle
    shadowColor: ACTIVE_BG,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  iconBoxInactive: {
    backgroundColor: "transparent",
  },

  // Label
  label: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    textTransform: "capitalize",
  },
  labelOn: {
    color: ACTIVE_LABEL,    // gold
    fontFamily: "Rubik-Bold",
  },
  labelOff: {
    color: INACTIVE_LB,     // soft white
    fontFamily: "Rubik-Medium",
  },

  // Gold dot under active label
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACTIVE_BG,
  },
});

export default PremiumNavBar;
