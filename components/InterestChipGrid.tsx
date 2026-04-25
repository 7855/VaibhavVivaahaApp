import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INTEREST_TAGS, getInterestByCode, getInterestTags, InterestTag } from '../constants/interests';

/**
 * Reusable interest chip grid. Supports 3 modes:
 *
 *  1. **Edit mode** (`onToggle` provided) — all 15 tags shown, tappable,
 *     selected ones get a checkmark + colored bg. Used in signup + profile edit.
 *
 *  2. **Display mode** (`readOnly`, no `onToggle`) — only `selected` tags
 *     rendered as colored chips. Matching `highlightCodes` glow gold.
 *     Used in ProfileDetail interests section.
 *
 *  3. **Compact mode** (`compact` + `maxVisible`) — small inline chips
 *     with "+N more" overflow. Used on search result cards.
 */
export interface InterestChipGridProps {
  /** Array of hobby codes the user has selected. */
  selected: string[];
  /** If provided, chips are tappable and this fires on toggle. */
  onToggle?: (code: string) => void;
  /** Codes to highlight in gold (usually the viewer's own hobbies — shows overlap). */
  highlightCodes?: string[];
  /** Display-only, no taps. Only shows selected codes. */
  readOnly?: boolean;
  /** Smaller chip size for card surfaces. */
  compact?: boolean;
  /** Show at most N chips + a "+X more" chip. */
  maxVisible?: number;
  /** Master tag list from DB (via masterData.interestTags). Falls back to hardcoded if not provided. */
  masterTags?: InterestTag[];
  style?: any;
}

const InterestChipGrid: React.FC<InterestChipGridProps> = ({
  selected,
  onToggle,
  highlightCodes,
  readOnly = false,
  compact = false,
  maxVisible,
  masterTags,
  style,
}) => {
  const isEditMode = !!onToggle && !readOnly;
  const highlightSet = new Set(highlightCodes || []);
  const allTags = getInterestTags(masterTags);

  // In edit mode show all tags; in display mode show only selected
  const tagsToShow = isEditMode
    ? allTags
    : allTags.filter((t) => selected.includes(t.code));

  // Apply maxVisible truncation
  const visibleTags = maxVisible && !isEditMode
    ? tagsToShow.slice(0, maxVisible)
    : tagsToShow;
  const overflowCount = maxVisible && !isEditMode
    ? Math.max(0, tagsToShow.length - maxVisible)
    : 0;

  if (!isEditMode && tagsToShow.length === 0) return null;

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      {visibleTags.map((tag) => {
        const isSelected = selected.includes(tag.code);
        const isHighlighted = highlightSet.has(tag.code);

        if (isEditMode) {
          return (
            <TouchableOpacity
              key={tag.code}
              activeOpacity={0.7}
              onPress={() => onToggle!(tag.code)}
              style={[
                styles.chip,
                compact && styles.chipCompact,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              <Text style={styles.chipEmoji}>{tag.emoji}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  compact && styles.chipLabelCompact,
                  isSelected ? styles.chipLabelSelected : styles.chipLabelUnselected,
                ]}
              >
                {tag.label}
              </Text>
              {isSelected ? (
                <Ionicons name="checkmark-circle" size={compact ? 12 : 14} color="#fff" />
              ) : null}
            </TouchableOpacity>
          );
        }

        // Display / compact mode
        return (
          <View
            key={tag.code}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              isHighlighted ? styles.chipHighlighted : styles.chipDisplay,
            ]}
          >
            <Text style={compact ? styles.chipEmojiCompact : styles.chipEmoji}>
              {tag.emoji}
            </Text>
            <Text
              style={[
                styles.chipLabel,
                compact && styles.chipLabelCompact,
                isHighlighted
                  ? styles.chipLabelHighlighted
                  : styles.chipLabelDisplay,
              ]}
            >
              {tag.label}
            </Text>
          </View>
        );
      })}

      {overflowCount > 0 ? (
        <View style={[styles.chip, styles.chipCompact, styles.chipOverflow]}>
          <Text style={styles.chipLabelOverflow}>+{overflowCount} more</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  containerCompact: {
    gap: 4,
  },

  // ── Chip base ──
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  chipCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 3,
  },

  // ── Edit mode states ──
  chipSelected: {
    backgroundColor: '#420001',
  },
  chipUnselected: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // ── Display mode states ──
  chipDisplay: {
    backgroundColor: '#f3f4f6',
  },
  chipHighlighted: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },

  // ── Overflow chip ──
  chipOverflow: {
    backgroundColor: '#e5e7eb',
  },

  // ── Emoji ──
  chipEmoji: {
    fontSize: 14,
  },
  chipEmojiCompact: {
    fontSize: 11,
  },

  // ── Labels ──
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipLabelCompact: {
    fontSize: 10,
    fontWeight: '700',
  },
  chipLabelSelected: {
    color: '#fff',
  },
  chipLabelUnselected: {
    color: '#374151',
  },
  chipLabelDisplay: {
    color: '#374151',
  },
  chipLabelHighlighted: {
    color: '#92400e',
    fontWeight: '700',
  },
  chipLabelOverflow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
  },
});

export default InterestChipGrid;
