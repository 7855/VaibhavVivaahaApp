/**
 * Interest tag types + helpers.
 *
 * The master list is now stored in the `keyValues` DB table under
 * key `interestTags` and loaded on app start via masterService →
 * MasterDataContext. The hardcoded FALLBACK_TAGS below are only
 * used if the DB hasn't been seeded or the context isn't available.
 *
 * To add/remove/rename tags: update the `interestTags` row in the
 * `keyValues` table + the ALLOWED_HOBBY_CODES set in
 * UserDetailService.java. No frontend deploy needed.
 */

export interface InterestTag {
  code: string;
  label: string;
  emoji: string;
}

/** Fallback used before masterData loads or if the DB key is missing. */
export const FALLBACK_INTEREST_TAGS: InterestTag[] = [
  { code: 'food',         label: 'Food',         emoji: '🍕' },
  { code: 'travel',       label: 'Travel',       emoji: '✈️' },
  { code: 'photography',  label: 'Photography',  emoji: '📸' },
  { code: 'music',        label: 'Music',        emoji: '🎵' },
  { code: 'reading',      label: 'Reading',      emoji: '📚' },
  { code: 'cricket',      label: 'Cricket',      emoji: '🏏' },
  { code: 'yoga',         label: 'Yoga',         emoji: '🧘' },
  { code: 'movies',       label: 'Movies',       emoji: '🎬' },
  { code: 'technology',   label: 'Technology',    emoji: '💻' },
  { code: 'fitness',      label: 'Fitness',       emoji: '💪' },
  { code: 'art',          label: 'Art',            emoji: '🎨' },
  { code: 'dance',        label: 'Dance',          emoji: '💃' },
  { code: 'cooking',      label: 'Cooking',        emoji: '🍳' },
  { code: 'gardening',    label: 'Gardening',      emoji: '🌱' },
  { code: 'spirituality', label: 'Spirituality',   emoji: '🙏' },
];

/**
 * Resolve the tag list — prefers masterData from context/AsyncStorage,
 * falls back to hardcoded list. Call this from components that have
 * access to masterData; pass `undefined` or `null` to use the fallback.
 */
export const getInterestTags = (masterDataTags?: InterestTag[] | null): InterestTag[] =>
  (masterDataTags && masterDataTags.length > 0) ? masterDataTags : FALLBACK_INTEREST_TAGS;

// For backward compat — components that imported INTEREST_TAGS still work
export const INTEREST_TAGS = FALLBACK_INTEREST_TAGS;

/** Look up a tag by its code from a given list. */
export const getInterestByCode = (code: string, tags?: InterestTag[] | null): InterestTag | undefined =>
  getInterestTags(tags).find((t) => t.code === code);

/** Get human-readable label for a code. Falls back to the raw code. */
export const getInterestLabel = (code: string, tags?: InterestTag[] | null): string =>
  getInterestByCode(code, tags)?.label || code;

/** Get emoji for a code. Falls back to empty string. */
export const getInterestEmoji = (code: string, tags?: InterestTag[] | null): string =>
  getInterestByCode(code, tags)?.emoji || '';

/** Format a code as "emoji label" e.g. "🍕 Food". */
export const formatInterest = (code: string, tags?: InterestTag[] | null): string => {
  const tag = getInterestByCode(code, tags);
  return tag ? `${tag.emoji} ${tag.label}` : code;
};
