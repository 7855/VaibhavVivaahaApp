// VVM registration art — ported from RegisterPageDesign/VvmIllustrations.jsx (2026-10-19), cream disc default
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, AccessibilityInfo, Easing } from 'react-native';
import Svg, { Circle, Path, Rect, Ellipse, G } from 'react-native-svg';

const BG = '#FFF3DC', GOLD = '#F6B733', BRASS = '#C98A22', BRASS_HI = '#EFC35F', MAROON = '#420001',
  LEAF = '#2F7D4F', LEAF_HI = '#4A9E68', BLUE = '#1F7FE5', PURPLE = '#7C5DFA', LINE = '#EADFCD', MARIGOLD = '#E8871E';

const curve = (x0, y0, cx, cy, x1, y1, n) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1), u = 1 - t;
    return { x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 };
  });

const Frame = ({ size, bg = BG, children }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Circle cx="60" cy="60" r="60" fill={bg} />
    {children}
  </Svg>
);

const Jasmine = ({ x, y }) => (
  <G>
    <Circle cx={x} cy={y} r={3.6} fill="#fff" stroke="#e5d3ae" strokeWidth="0.8" />
    <Circle cx={x} cy={y} r={1.3} fill={GOLD} />
  </G>
);

export function Lamp({ size = 76, bg }) {
  return (
    <Frame size={size} bg={bg}>
      <Circle cx="60" cy="34" r="19" fill={GOLD} opacity="0.25" />
      <Path d="M60 16c5 8 7 12 7 16a7 7 0 0 1-14 0c0-4 2-8 7-16z" fill={GOLD} />
      <Path d="M60 26c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7z" fill="#fff6dd" />
      <Rect x="34" y="42" width="52" height="5" rx="2.5" fill={BRASS_HI} />
      <Path d="M36 46h48c-2 9-11 15-24 15S38 55 36 46z" fill={BRASS} />
      <Rect x="55" y="60" width="10" height="34" fill={BRASS} />
      <Ellipse cx="60" cy="72" rx="8" ry="3.4" fill={BRASS_HI} />
      <Ellipse cx="60" cy="84" rx="6" ry="2.6" fill={BRASS_HI} />
      <Path d="M40 101c0-6 9-10 20-10s20 4 20 10z" fill={BRASS} />
      <Rect x="34" y="99" width="52" height="6" rx="3" fill={BRASS_HI} />
    </Frame>
  );
}

export function NameCard({ size = 76, bg }) {
  return (
    <Frame size={size} bg={bg}>
      <Path d="M18 28Q60 64 102 28" stroke={LEAF} strokeWidth="1.6" fill="none" />
      {curve(18, 28, 60, 64, 102, 28, 10).map((p, i) => <Jasmine key={i} x={p.x} y={p.y} />)}
      <Rect x="24" y="52" width="72" height="46" rx="12" fill="#fff" stroke={LINE} strokeWidth="1.5" />
      <Circle cx="43" cy="71" r="10" fill="#F7E3B5" />
      <Circle cx="43" cy="68" r="4.4" fill={MAROON} />
      <Path d="M35 79a8 8 0 0 1 16 0z" fill={MAROON} />
      <Rect x="59" y="64" width="30" height="5.5" rx="2.75" fill={MAROON} />
      <Rect x="59" y="75" width="21" height="4.5" rx="2.25" fill={LINE} />
      <Rect x="33" y="88" width="54" height="4.5" rx="2.25" fill={LINE} />
    </Frame>
  );
}

export function Gopuram({ size = 76, bg }) {
  return (
    <Frame size={size} bg={bg}>
      <Rect x="14" y="100" width="92" height="3" rx="1.5" fill={LINE} />
      <Path d="M34 101h40l-3-15H37z" fill={BRASS} />
      <Path d="M38 86h32l-3-14H41z" fill={BRASS_HI} />
      <Path d="M42 72h24l-3-13H45z" fill={BRASS} />
      <Path d="M46 59h16l-2-10H48z" fill={BRASS_HI} />
      <Path d="M47 49h14c0-7-3-10-7-10s-7 3-7 10z" fill={BRASS} />
      <Circle cx="50" cy="37" r="2" fill={GOLD} />
      <Circle cx="54" cy="35" r="2.2" fill={GOLD} />
      <Circle cx="58" cy="37" r="2" fill={GOLD} />
      <Rect x="51" y="79" width="6" height="3" rx="1" fill={MAROON} opacity="0.5" />
      <Rect x="51" y="66" width="6" height="3" rx="1" fill={MAROON} opacity="0.5" />
      <Path d="M49 101v-9a5 5 0 0 1 10 0v9z" fill={MAROON} />
      <Path d="M88 58c-8 0-13 6-13 12 0 9 13 21 13 21s13-12 13-21c0-6-5-12-13-12z" fill={MAROON} />
      <Circle cx="88" cy="70" r="5" fill={GOLD} />
    </Frame>
  );
}

export function Books({ size = 76, bg }) {
  return (
    <Frame size={size} bg={bg}>
      <Rect x="20" y="90" width="54" height="11" rx="2.5" fill={MAROON} />
      <Rect x="24" y="79" width="48" height="11" rx="2.5" fill={BLUE} />
      <Rect x="20" y="68" width="52" height="11" rx="2.5" fill={PURPLE} />
      <Rect x="25" y="70" width="3" height="7" fill="#fff" opacity="0.6" />
      <Rect x="29" y="81" width="3" height="7" fill="#fff" opacity="0.6" />
      <Path d="M48 34l30 13-30 13-30-13z" fill={MAROON} />
      <Path d="M33 54v9c0 4 7 8 15 8s15-4 15-8v-9l-15 7z" fill="#5A0C07" />
      <Path d="M78 47v15" stroke={GOLD} strokeWidth="2.4" />
      <Circle cx="78" cy="64" r="3.2" fill={GOLD} />
      <Rect x="78" y="78" width="28" height="22" rx="5" fill={BRASS} />
      <Path d="M86 78v-4a2.5 2.5 0 0 1 2.5-2.5h7A2.5 2.5 0 0 1 98 74v4" stroke={BRASS} strokeWidth="3" fill="none" />
      <Rect x="78" y="86" width="28" height="3.5" fill={BRASS_HI} />
    </Frame>
  );
}

export function KolamLock({ size = 76, bg }) {
  const dots = [];
  for (let x = 28; x <= 92; x += 16) for (let y = 28; y <= 92; y += 16) if (Math.abs(x - 60) + Math.abs(y - 60) <= 38) dots.push({ x, y });
  return (
    <Frame size={size} bg={bg}>
      <Path d="M60 14Q78 42 106 60Q78 78 60 106Q42 78 14 60Q42 42 60 14Z" fill="none" stroke={BRASS} strokeWidth="2.2" />
      <Path d="M60 30Q72 48 90 60Q72 72 60 90Q48 72 30 60Q48 48 60 30Z" fill="none" stroke={GOLD} strokeWidth="1.6" />
      {dots.map((d, i) => <Circle key={i} cx={d.x} cy={d.y} r="2" fill={BRASS} opacity="0.65" />)}
      <Path d="M50 57v-8a10 10 0 0 1 20 0v8" stroke={MAROON} strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <Rect x="42" y="55" width="36" height="29" rx="7" fill={MAROON} />
      <Circle cx="60" cy="66" r="4" fill={GOLD} />
      <Rect x="58.2" y="67" width="3.6" height="9" rx="1.8" fill={GOLD} />
    </Frame>
  );
}

export function Celebration({ width = 250, bg = BG }) {
  return (
    <Svg width={width} height={width * (150 / 220)} viewBox="0 0 220 150">
      <Path d="M12 18Q110 40 208 18" stroke={BRASS} strokeWidth="2.2" fill="none" />
      {curve(12, 18, 110, 40, 208, 18, 14).map((p, i) =>
        i % 2 ? <Circle key={i} cx={p.x} cy={p.y + 4} r="4" fill={MARIGOLD} />
          : <Path key={i} d={`M${p.x} ${p.y}c5.5 7 5.5 17 0 25c-5.5-8-5.5-18 0-25z`} fill={i % 4 ? LEAF_HI : LEAF} />,
      )}
      <Circle cx="110" cy="95" r="48" fill={bg} />
      <Circle cx="124" cy="99" r="22" stroke={BRASS} strokeWidth="6.5" fill="none" />
      <Circle cx="96" cy="99" r="22" stroke={GOLD} strokeWidth="6.5" fill="none" />
      <Path d="M96 66l6.5 6.5-6.5 7.5-6.5-7.5z" fill="#D8ECFF" stroke="#fff" strokeWidth="1.2" />
      <Path d="M166 62l2.2 5.5 5.5 2.2-5.5 2.2-2.2 5.5-2.2-5.5-5.5-2.2 5.5-2.2z" fill={GOLD} />
      <Path d="M50 74l1.7 4.3 4.3 1.7-4.3 1.7-1.7 4.3-1.7-4.3-4.3-1.7 4.3-1.7z" fill={GOLD} />
      <Path d="M152 124l1.3 3.3 3.3 1.3-3.3 1.3-1.3 3.3-1.3-3.3-3.3-1.3 3.3-1.3z" fill={BRASS} />
    </Svg>
  );
}

export function PetalFall({ count = 12, height = 340 }) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  const seeds = useRef(Array.from({ length: count }, (_, i) => ({ left: `${(i * 89) % 96}%`, delay: (i * 131) % 800, drift: ((i % 3) - 1) * 20 }))).current;

  useEffect(() => {
    let off = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || off) return;
      Animated.parallel(anims.map((a, i) =>
        Animated.timing(a, { toValue: 1, duration: 2400, delay: seeds[i].delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      )).start();
    });
    return () => { off = true; };
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', top: -14, left: seeds[i].left, width: 9, height: 9, borderRadius: 5,
            backgroundColor: i % 3 ? '#fff' : GOLD, borderWidth: 1, borderColor: i % 3 ? '#e6d7b6' : GOLD,
            opacity: a.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) },
              { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, seeds[i].drift] }) },
              { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
