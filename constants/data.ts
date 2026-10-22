import icons from "./icons";

export const cards = [
  {
    title: "Card 1",
    location: "Location 1",
    price: "$100",
    rating: 4.8,
    category: "house",
    image: null,
  },
  {
    title: "Card 2",
    location: "Location 2",
    price: "$200",
    rating: 3,
    category: "house",
    image: null,
  },
  {
    title: "Card 3",
    location: "Location 3",
    price: "$300",
    rating: 2,
    category: "flat",
    image: null,
  },
  {
    title: "Card 4",
    location: "Location 4",
    price: "$400",
    rating: 5,
    category: "villa",
    image: null,
  },
];

export const featuredCards = [
  {
    title: "Featured 1",
    location: "Location 1",
    price: "$100",
    rating: 4.8,
    image: null,
    category: "house",
  },
  {
    title: "Featured 2",
    location: "Location 2",
    price: "$200",
    rating: 3,
    image: null,
    category: "flat",
  },
];

export const categories = [
  { title: "All", category: "All" },
  { title: "Houses", category: "House" },
  { title: "Condos", category: "Condos" },
  { title: "Duplexes", category: "Duplexes" },
  { title: "Studios", category: "Studios" },
  { title: "Villas", category: "Villa" },
  { title: "Apartments", category: "Apartments" },
  { title: "Townhomes", category: "Townhomes" },
  { title: "Others", category: "Others" },
];

export const settings = [
  {
    title: "My Bookings",
    icon: icons.calendar,
  },
  {
    title: "Payments",
    icon: icons.wallet,
  },
  {
    title: "Profile",
    icon: icons.person,
  },
  {
    title: "Notifications",
    icon: icons.bell,
  },
  {
    title: "Security",
    icon: icons.shield,
  },
  {
    title: "Language",
    icon: icons.language,
  },
  {
    title: "Help Center",
    icon: icons.info,
  },
  {
    title: "Invite Friends",
    icon: icons.people,
  },
];

export const gallery = [
  {
    id: 1,
    image: null,
  },
  {
    id: 2,
    image: null,
  },
  {
    id: 3,
    image: null,
  },
  {
    id: 4,
    image: null,
  },
  {
    id: 5,
    image: null,
  },
  {
    id: 6,
    image: null,
  },
];

// Shared between ProfileDetail.tsx (profile-level reports) and chatscreen.tsx (both profile-level
// and per-message reports) — previously two separate hardcoded lists that had drifted out of sync
// (chatscreen's was missing "Fake Profile"/"Inappropriate Photos" for no reason). Includes the
// matrimony-specific categories real matrimony platforms typically offer beyond generic
// spam/harassment.
export const REPORT_REASONS = [
  'Fake Profile',
  'Inappropriate Photos',
  'Already Married',
  'Underage',
  'Scam / Financial Fraud',
  'Spam',
  'Abuse',
  'Harassment',
  'Others',
];

// ── Public links / deep linking ───────────────────────────────────────────────
// Single source of truth for anything we put in front of a user outside the app
// (WhatsApp shares, invites). The share link used to point at
// `https://vaibhavvivaaha.com` — a DIFFERENT domain from the live site
// (`vaibhavvivaahamatrimony.com`, which is also what EXPO_PUBLIC_API_URL uses),
// so every shared profile link was dead.
export const APP_WEB_ORIGIN = 'https://vaibhavvivaahamatrimony.com';

// Matches `scheme` in app.json. Deep links only resolve to a screen if the path
// mirrors the expo-router route with the (group) segments dropped — so
// app/(root)/screens/ProfileDetail.tsx is reachable at `/screens/ProfileDetail`.
export const APP_SCHEME = 'vaibhavvivaaha';

/**
 * The published legal pages (2026-09-28). The WEBSITE is the source of truth for all legal text
 * (VaibhavVivaahaWeb/src/content/legal.js); the app links to it rather than carrying its own copy,
 * which is how the app's Terms came to claim auto-renewal the product never had.
 */
export const LEGAL_URLS = {
  terms: `${APP_WEB_ORIGIN}/terms-and-conditions`,
  refund: `${APP_WEB_ORIGIN}/refund-policy`,
  privacy: `${APP_WEB_ORIGIN}/privacy-policy`,
  subscription: `${APP_WEB_ORIGIN}/subscription-policy`,
  contact: `${APP_WEB_ORIGIN}/contact-us`,
} as const;

/** Web URL for a profile — safe to send to anyone, app installed or not. */
export const profileWebUrl = (encodedUserId: string) =>
  `${APP_WEB_ORIGIN}/profile/${encodedUserId}`;

/**
 * Direct in-app link. Only opens for users who already have the app installed.
 *
 * Takes the RAW numeric user id, NOT the base64 one used in the web URL above: ProfileDetail
 * forwards its `userId` route param straight to /getProfileDetailWithIntractionStatus, whose
 * controller declares `@PathVariable Long profileUserId`. Passing an encoded id here opens the
 * screen and then fails the fetch.
 */
export const profileDeepLink = (rawUserId: string | number) =>
  `${APP_SCHEME}://screens/ProfileDetail?userId=${encodeURIComponent(String(rawUserId))}`;

export const APP_DOWNLOAD_URL = `${APP_WEB_ORIGIN}/download`;

/**
 * Mother tongue / languages for display.
 *
 * `user_details.languages` is a JSON COLUMN, so the API hands the app the raw text
 * `["Tamil", "English"]` — which is exactly what members were seeing on the profile
 * (client 2026-09-19). Accepts the JSON string, a real array, or plain comma text,
 * and returns `Tamil, English`. Stored casing is inconsistent ("tamil" vs "Tamil"),
 * so each entry's first letter is capitalised.
 */
export const formatLanguageList = (value: any): string => {
  if (value === null || value === undefined) return '';
  let items: any[];
  if (Array.isArray(value)) {
    items = value;
  } else {
    const raw = String(value).trim();
    if (!raw || ['null', 'undefined', '[]', '-'].includes(raw.toLowerCase())) return '';
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        items = Array.isArray(parsed) ? parsed : [raw];
      } catch {
        // Malformed JSON — strip the brackets/quotes rather than printing them.
        items = raw.replace(/^\[|\]$/g, '').split(',').map((s) => s.replace(/["']/g, ''));
      }
    } else {
      items = raw.split(',');
    }
  }
  return items
    .map((i) => String(i ?? '').trim())
    .filter((i) => i && i.toLowerCase() !== 'null')
    .map((i) => i.charAt(0).toUpperCase() + i.slice(1))
    .join(', ');
};

/**
 * Strips everything that isn't a letter or a space from a name field.
 *
 * "Letter" here means ANY script's letter, not just A–Z: members register with
 * Tamil names (client 2026-09-20) and the old `[^A-Za-z\s]` filter silently ate
 * every character they typed, so the field looked broken rather than rejected.
 *
 * ⚠️ `\p{M}` is load-bearing — Tamil vowel signs and the virama (ு ா ்) are
 * COMBINING MARKS, not letters, so `\p{L}` alone would strip them and mangle
 * every word ("முருகன்" → "மரகன").
 *
 * Built via `new RegExp` with a try/catch because Unicode property escapes are
 * a syntax error on an engine that doesn't support them — which would throw at
 * module load, not at call time, and take the whole screen down. The fallback
 * drops ASCII digits and ASCII punctuation and lets every non-ASCII letter
 * through, which is the same intent with a coarser net.
 */
const NAME_STRIP: RegExp = (() => {
  try {
    return new RegExp('[^\\p{L}\\p{M}\\s]', 'gu');
  } catch {
    return /[0-9!-\/:-@[-`{-~]/g;
  }
})();

export const stripNonNameChars = (text: string) =>
  String(text ?? '').replace(NAME_STRIP, '');

// ─── Minimum age to register, by gender (2026-09-28) ─────────────────────────────────────────
// India's legal minimum marriage ages (Prohibition of Child Marriage Act, 2006): 21 for men, 18
// for women. Stated in the Terms (§2) and the Privacy Policy, and applied by TamilMatrimony /
// Matrimony.com. Until this date the app applied 18 to everyone, so an 18-year-old man could
// register on a platform that facilitates marriage — contradicting our own published Terms.
//
// Accepts every gender spelling in use: sign-up 'male'/'female', the edit page 'Male'/'Female',
// the database 'M'/'F'. An unknown or missing gender gets 18 (the lower bound) — sign-up re-checks
// the moment a gender is picked, so this never lets a man under 21 through.
export const MIN_MARRIAGE_AGE = { male: 21, female: 18 } as const;

export function isMaleGender(g?: string | null): boolean {
  const s = String(g ?? '').trim().toLowerCase();
  return s === 'male' || s === 'm';
}

export function minAgeForGender(g?: string | null): number {
  return isMaleGender(g) ? MIN_MARRIAGE_AGE.male : MIN_MARRIAGE_AGE.female;
}

/** Latest date of birth that still meets the rule — used as the date picker's maximumDate. */
export function latestDobForGender(g?: string | null): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAgeForGender(g));
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Completed years on today's date (a birthday later this year has not counted yet). */
export function ageOnDate(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function meetsMinAge(dob: Date | null | undefined, g?: string | null): boolean {
  return !!dob && !isNaN(dob.getTime()) && ageOnDate(dob) >= minAgeForGender(g);
}

export function ageRuleMessage(g?: string | null): string {
  return isMaleGender(g)
    ? 'Men must be at least 21 years old — the legal minimum age for marriage in India.'
    : 'You must be at least 18 years old.';
}
