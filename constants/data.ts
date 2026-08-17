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
