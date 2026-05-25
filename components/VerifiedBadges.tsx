import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

/**
 * Reusable verification badge renderer.
 *
 * Three display modes to match each surface:
 *
 *  - "compact"  — Single small green shield. Used on dense cards (search results,
 *                 home carousels, mailbox rows, chat list rows). Shows when ANY
 *                 verification flag is true.
 *
 *  - "count"    — Shield + number ("🛡️ 2"). Used when there's a tiny bit more
 *                 room but still space-constrained.
 *
 *  - "full"     — Three separate colored chips (ID ✓ / EDU ✓ / INCOME ✓). Used
 *                 on large surfaces like the chat screen header or list rows
 *                 that have room for multiple chips.
 *
 * All three modes render nothing if the user has no verifications — caller
 * doesn't need to conditionally render around it.
 */
export interface VerifiedBadgesProps {
  idVerified?: boolean | null;
  educationVerified?: boolean | null;
  incomeVerified?: boolean | null;
  mode?: 'compact' | 'count' | 'full';
  size?: 'sm' | 'md';
  /**
   * Shield color preset for compact/count modes.
   *  - 'green'  : default trust green (#10b981)
   *  - 'gold'   : premium gold gradient (#f59e0b) — catchy, stands out on images
   *  - 'blue'   : classic Twitter-style blue (#3b82f6)
   *  - 'pink'   : vivid hot pink (#ec4899)
   */
  color?: 'green' | 'gold' | 'blue' | 'pink';
  style?: any;
}

const COLOR_PRESETS: Record<NonNullable<VerifiedBadgesProps['color']>, { bg: string; border: string }> = {
  green: { bg: '#10b981', border: '#fff' },
  gold:  { bg: '#f59e0b', border: '#fff' },
  blue:  { bg: '#3b82f6', border: '#fff' },
  pink:  { bg: '#ec4899', border: '#fff' },
};

const VerifiedBadges: React.FC<VerifiedBadgesProps> = ({
  idVerified,
  educationVerified,
  incomeVerified,
  mode = 'compact',
  size = 'sm',
  color = 'green',
  style,
}) => {
  const id = idVerified === true;
  const edu = educationVerified === true;
  const inc = incomeVerified === true;
  const count = (id ? 1 : 0) + (edu ? 1 : 0) + (inc ? 1 : 0);

  if (count === 0) return null;

  const iconSize = size === 'sm' ? 10 : 12;
  const pillHeight = size === 'sm' ? 20 : 24;
  const preset = COLOR_PRESETS[color];

  if (mode === 'compact') {
    return (
      <View
        style={[
          styles.shield,
          size === 'md' && styles.shieldMd,
          { backgroundColor: preset.bg, borderColor: preset.border },
          style,
        ]}
      >
        <MaterialCommunityIcons
          name="shield-check"
          size={size === 'sm' ? 12 : 15}
          color="#fff"
        />
      </View>
    );
  }

  if (mode === 'count') {
    return (
      <View style={[styles.countPill, { height: pillHeight, backgroundColor: preset.bg }, style]}>
        <MaterialCommunityIcons name="shield-check" size={iconSize + 2} color="#fff" />
        <Text style={styles.countText}>{count}</Text>
      </View>
    );
  }

  // mode === 'full'
  return (
    <View style={[styles.fullRow, style]}>
      {id ? (
        <View style={[styles.fullChip, { backgroundColor: '#dbeafe' }]}>
          <MaterialCommunityIcons name="shield-check" size={iconSize} color="#1d4ed8" />
          <Text style={[styles.fullChipText, { color: '#1e3a8a' }]}>Govt ID ✓</Text>
        </View>
      ) : null}
      {edu ? (
        <View style={[styles.fullChip, { backgroundColor: '#ede9fe' }]}>
          <MaterialCommunityIcons name="school" size={iconSize} color="#6d28d9" />
          <Text style={[styles.fullChipText, { color: '#4c1d95' }]}>Education ✓</Text>
        </View>
      ) : null}
      {inc ? (
        <View style={[styles.fullChip, { backgroundColor: '#fef3c7' }]}>
          <MaterialCommunityIcons name="briefcase-check" size={iconSize} color="#b45309" />
          <Text style={[styles.fullChipText, { color: '#92400e' }]}>Income ✓</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  shield: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  shieldMd: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 2,
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Rubik-ExtraBold',
  },
  fullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 6,
    columnGap: 6,
  },
  fullChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  fullChipText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
    marginLeft: 4,
  },
});

/**
 * Collapsible verification block with inline-expanding icons.
 *
 * Layout:
 *   Verified
 *   🛡  🎓  💼              ← default: tiny circle icons only
 *
 * When user taps an icon, that icon expands in-place into a pill showing its
 * full label, while the other icons stay small to the right of it:
 *
 *   Verified
 *   [🛡 Govt ID ✓]  🎓  💼    ← tapped shield
 *   🛡  [🎓 Education ✓]  💼  ← tapped education (previous auto-closes)
 *   🛡  🎓  [💼 Income ✓]     ← tapped income
 *
 * Tapping the already-expanded icon collapses everything back.
 *
 * Renders nothing if the user has zero verified items.
 */
export interface VerifiedCollapsibleBlockProps {
  idVerified?: boolean | null;
  educationVerified?: boolean | null;
  incomeVerified?: boolean | null;
  style?: any;
}

type ExpandedKey = 'id' | 'edu' | 'inc' | null;

interface BadgeMeta {
  key: Exclude<ExpandedKey, null>;
  label: string;
  iconName: any;
  earnedBg: string;
  earnedFg: string;
  earned: boolean;
}

// Muted palette used for un-earned badges — keeps the row always rendering
// (3 circles always visible), so verified and non-verified profiles share
// the same vertical rhythm on ProfileDetail.
const UNEARNED_BG = '#f3f4f6';
const UNEARNED_FG = '#9ca3af';
const UNEARNED_TEXT = '#6b7280';

export const VerifiedCollapsibleBlock: React.FC<VerifiedCollapsibleBlockProps> = ({
  idVerified,
  educationVerified,
  incomeVerified,
  style,
}) => {
  const [expandedKey, setExpandedKey] = useState<ExpandedKey>(null);

  // Always-3-entries — earned flag controls whether the circle uses brand color
  // or muted grey. No null return — the block always renders to preserve layout.
  const badges: BadgeMeta[] = [
    {
      key: 'id',
      label: 'Govt ID',
      iconName: 'shield-check',
      earnedBg: '#dbeafe',
      earnedFg: '#1d4ed8',
      earned: idVerified === true,
    },
    {
      key: 'edu',
      label: 'Education',
      iconName: 'school',
      earnedBg: '#ede9fe',
      earnedFg: '#6d28d9',
      earned: educationVerified === true,
    },
    {
      key: 'inc',
      label: 'Income',
      iconName: 'briefcase-check',
      earnedBg: '#fef3c7',
      earnedFg: '#b45309',
      earned: incomeVerified === true,
    },
  ];

  const hasAny = badges.some((b) => b.earned);

  const toggle = (key: ExpandedKey) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return (
    <View style={[collStyles.container, style]}>
      {/* Label — changes with state so the header reflects whether anything is verified */}
      <View style={collStyles.labelRow}>
        <MaterialCommunityIcons
          name={hasAny ? 'check-decagram' : 'shield-outline'}
          size={13}
          color={hasAny ? '#10b981' : '#9ca3af'}
        />
        <Text
          style={[
            collStyles.labelText,
            { color: hasAny ? '#10b981' : '#9ca3af' },
          ]}
        >
          Verification
        </Text>
      </View>

      {/* Inline icon row — expanded icon grows into a pill with label */}
      <View style={collStyles.iconRow}>
        {badges.map((b) => {
          const isExpanded = expandedKey === b.key;
          const bg = b.earned ? b.earnedBg : UNEARNED_BG;
          const fg = b.earned ? b.earnedFg : UNEARNED_FG;
          const labelColor = b.earned ? b.earnedFg : UNEARNED_TEXT;
          const fullLabel = b.earned ? `${b.label} ✓` : `${b.label} · Not verified`;

          return (
            <TouchableOpacity
              key={b.key}
              activeOpacity={0.7}
              onPress={() => toggle(b.key)}
              style={[
                isExpanded ? collStyles.expandedPill : collStyles.miniCircle,
                { backgroundColor: bg },
              ]}
            >
              <MaterialCommunityIcons name={b.iconName} size={14} color={fg} />
              {isExpanded ? (
                <Text style={[collStyles.expandedText, { color: labelColor }]}>
                  {fullLabel}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const collStyles = StyleSheet.create({
  container: {
    // No background / border — sits directly on the parent column
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  },
  labelText: {
    fontSize: 11,
    fontFamily: 'Rubik-ExtraBold',
    color: '#10b981',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  expandedText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
  },
});

export default VerifiedBadges;
