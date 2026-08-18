# CLAUDE.md — VaibhavVivaahaApp (Mobile)

> **READ FIRST.** This is the source of truth for this project. Every Claude Code session must read this file before making changes and **update it before ending**. Stale CLAUDE.md = future session breaks.
>
> Sister docs:
> - `/Users/prodian/Documents/Personal/VaibhavVivaahaBackend/CLAUDE.md` (backend)
> - `/Users/prodian/Documents/Personal/adminpanel/CLAUDE.md` (admin panel)

---

## 1. Purpose
The **Vaibhav Vivaaha Matrimony** mobile app — a React Native / Expo client for browsing matches, sending interests, chatting, managing subscriptions, and (Gold+) granting parents secondary login access. Talks to the Spring Boot backend at `http://10.200.67.116:9100` (configurable).

## 2. Tech stack
- **Expo SDK 54** (`expo`, `expo-router`, `expo-blur`, `expo-image-picker`, `expo-notifications`, `expo-secure-store`, `expo-linear-gradient`, `expo-haptics`, `expo-asset`, `expo-av`, `expo-clipboard`, `expo-constants`, `expo-device`, `expo-file-system`, `expo-font`, `expo-image-manipulator`, `expo-linking`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`, `expo-web-browser`)
- **React Native 0.81.4** + **React 19.1**
- **Expo Router 6** (file-based routing under `app/`)
- **NativeBase 3** + **NativeWind 4** (Tailwind for RN)
- **react-native-tab-view**, **react-native-snap-carousel**, **react-native-deck-swiper**, **react-native-paper**, **react-native-elements**, **react-native-popup-menu**, **react-native-toast-message**, **react-native-alert-notification**, **lucide-react-native**, **@expo/vector-icons**, **react-native-vector-icons**, **react-native-svg**, **react-native-keyboard-aware-scroll-view**, **react-native-safe-area-context**, **react-native-reanimated**, **react-native-gesture-handler**
- **State**: React Context only (no Redux). `AsyncStorage` for persistence
- **HTTP**: `axios` via `app/(root)/api/axiosClient.js` with refresh-token interceptor
- **Realtime**: `sockjs-client` + custom STOMP-ish wrapper in `app/(root)/services/webSocketService.ts`
- **Push**: `expo-notifications` + Firebase via the backend `/pushNotification/updateFcmToken`
- **Payments**: `react-native-razorpay`
- **Forms**: `formik`
- **Date**: `dayjs` + `moment` (both used inconsistently)
- **TypeScript** ~5.9, but several files (`userApi.js`, `swiperprofile.js`, `axiosClient.js`, `tindercard.js`, `notification.ts`, `listchats.js`) are JS

## 3. Repo layout
```
VaibhavVivaahaApp/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout (providers, splash, navigation theme)
│   ├── index.tsx                 # Entry redirect
│   └── (root)/
│       ├── _layout.tsx           # Auth-protected wrapper
│       ├── (main)/               # Pre-login screens
│       │   ├── _layout.tsx
│       │   ├── index.tsx                       # Landing
│       │   ├── LoginScreen.tsx                 # Mobile + PIN login
│       │   ├── sign-up.tsx                     # Signup wizard
│       │   ├── OTPValidationScreen.tsx
│       │   ├── otpVerification.tsx             # (legacy, also used)
│       │   ├── ChangePinScreen.tsx
│       │   ├── ResetPasswordScreen.tsx
│       │   ├── SetNewPasswordScreen.tsx        # ⭐ added recently
│       │   └── ProfileUnderVerificationScreen.tsx ⭐ recently
│       ├── (tabs)/               # Bottom-tab screens (post-login)
│       │   ├── _layout.tsx
│       │   ├── index.tsx                       # Home / discovery
│       │   ├── explore.tsx
│       │   ├── mailBox.tsx                     # Inbox — Received / Sent / Permissions ⭐
│       │   ├── myChatList.tsx                  # Conversations
│       │   └── profile.tsx                     # Self profile
│       ├── api/
│       │   ├── axiosClient.js                  # Axios instance + refresh interceptor
│       │   └── userApi.js                      # 60+ API method bag
│       ├── contexts/
│       │   ├── AuthContext.tsx                 # ⚠️ TWO definitions; only the bottom one is used
│       │   ├── UserDataContext.tsx
│       │   ├── subscriptionContext.tsx
│       │   ├── PopupContext.tsx                # ⭐ premium upsell popup helper
│       │   └── MasterDataContext.tsx           # caste/star/etc master lists
│       ├── services/
│       │   ├── webSocketService.ts             # STOMP wrapper, chat + presence
│       │   └── masterService.tsx
│       └── screens/                            # Stack screens (deep links via router.push)
│           ├── _layout.tsx
│           ├── ProfileDetail.tsx               # ⭐ heavily plan-gated
│           ├── PremiumTab.tsx                  # Plan cards + Tamil taglines
│           ├── PaymentScreen.tsx
│           ├── SearchTabs.tsx                  # ⭐ Search + filter + plan-gated badges
│           ├── SearchResult.tsx
│           ├── chatscreen.tsx
│           ├── settingsPage.tsx                # ⭐ Family Access entry + parent guard
│           ├── PrivacySettingsPage.tsx
│           ├── SettingPageChangePin.tsx
│           ├── NotificationScreen.tsx
│           ├── ListUser.tsx                    # connections / viewed / shortlisted
│           ├── FollowUserList.tsx
│           ├── listProfile.tsx
│           ├── myfavourite.tsx
│           ├── StarMatch.tsx
│           ├── StarMatchResult.tsx
│           ├── HelpSupportPage.tsx
│           ├── FAQPage.tsx
│           ├── TermsPage.tsx
│           ├── MyRequestsScreen.tsx ⭐ NEW    # Service requests list
│           └── FamilyAccessScreen.tsx ⭐ NEW  # Add/list/revoke family logins
├── components/                   # Reusable UI
│   ├── swiperprofile.js          # ⭐ Free blur + plan badges + verified
│   ├── QuickAccessFAB.tsx        # ⭐ NEW Global bottom-left FAB, keyValue-driven grid menu
│   ├── SupportFAB.tsx            # ⭐ Draggable support-chat bubble — mounted ONLY in settingsPage.tsx (not global)
│   ├── ExploreProfileCard.tsx    # Search result card
│   ├── ExploreTabs.tsx
│   ├── ProfileDetailTab.tsx
│   ├── ProfileCompletionBar.tsx
│   ├── ProgressRing.tsx
│   ├── tindercard.js             # Tinder-style swipe deck
│   ├── tabs.tsx
│   ├── PremiumNavBar.tsx ⭐
│   ├── PromotionalPopup.tsx ⭐
│   ├── CommonPopup.tsx ⭐
│   ├── QuickAction.tsx
│   ├── CustomNav.tsx
│   ├── DropdownComponent.tsx
│   ├── MultiSelectDropdown.tsx
│   ├── RangeSelectorModal.tsx
│   ├── AgeRangeSelector.tsx
│   ├── ActionSheet.tsx
│   ├── editProfileModal.tsx
│   ├── HappyStoryCard.tsx
│   ├── NotificationCard.tsx
│   ├── NotificationFilter.tsx
│   ├── NotificationHeader.tsx
│   ├── notification.ts
│   ├── Search.tsx
│   ├── SkeletonCard.tsx
│   ├── FooterMessage.tsx
│   └── listchats.js
├── constants/
│   ├── data.ts                   # static option lists (gender, status, etc.)
│   ├── images.ts                 # asset image imports
│   └── icons.ts                  # icon definitions
├── utils/
│   └── deviceInfo.ts             # FCM token registration + device info
├── usePushNotification.tsx       # FCM registration hook (root level!)
├── assets/                       # images, fonts
├── package.json
├── app.json                      # Expo config
└── tsconfig.json
```

## 4. Build & run
```bash
# install
npm install

# Expo dev (Metro)
npm start                # expo start
npm run ios              # expo run:ios (native build)
npm run android          # expo run:android
npm run web              # expo start --web

# tests
npm test                 # jest (jest-expo preset)
```
**Env vars** (must use `EXPO_PUBLIC_` prefix to be accessible at runtime):
- `EXPO_PUBLIC_API_URL` — HTTP base URL (default `http://10.200.67.116:9100`, hardcoded in `app/(root)/api/axiosClient.js` line 5)
- `EXPO_PUBLIC_WS_URL` — WebSocket URL (default `ws://10.200.67.116:9100`, used by `webSocketService.ts`)

**Brand colors**: primary maroon `#420001`, gold accent `#F6B733`.

## 5. Architecture overview
```
LoginScreen ─→ POST /user/login ─→ stores token + user data in AsyncStorage
                                    │
                                    ↓
                       _layout.tsx wraps app in:
                       ┌──────────────────────────┐
                       │ AuthProvider             │
                       │  UserDataProvider        │
                       │   SubscriptionProvider   │
                       │    PopupProvider         │
                       │     MasterDataProvider   │
                       │      <Children>          │
                       └──────────────────────────┘
                                    │
                            (tabs)/_layout.tsx (bottom tabs)
                            ├── index (Home)
                            ├── mailBox      ← Gold+ adds 4th tab
                            ├── myChatList
                            └── profile

              screens/* are stack-pushed via router.push('/screens/...')

WebSocket connection initialized on login via webSocketService.connect(userId)
```

## 6. Conventions
- **Routing**: Expo Router file-based. Group routes in parens `(main)`, `(tabs)`, `(root)`. Push deep links: `router.push('/screens/ProfileDetail', { params: { userId } })`.
- **Encoded user IDs**: Most API calls take `userData.userId` which is **base64-encoded** in AsyncStorage (the backend returns it that way). Backend decodes via `Base64.getDecoder().decode(...)`.
- **Plan title check**: `subscriptionData?.planTitle === 'Free' | 'Starter' | 'Classic' | 'Silver' | 'Gold' | 'Platinum'` — string match. Free = no subscription / unset.
- **Premium upsell**: use `popup.premiumRequired(message, onUpgrade)` from `PopupContext` → opens a modal that routes to `/(root)/screens/PremiumTab`.
- **Toasts**: `Toast.show({ type: 'success' | 'error', text1, text2 })` from `react-native-toast-message`.
- **Styling**: mix of NativeBase props, NativeWind classes, and inline `StyleSheet.create`. No single convention.
- **TS strictness**: many `any` types in legacy files; new files should be typed.

## 7. Domain model
### Subscription plans (mirrors backend section 7.1)
**Verified against live `vvm_db` 2026-07-09** — Starter's price was stale (documented ₹199, DB has ₹499).

| id | title    | price ₹ | duration | tagline (Tamil)               |
|----|----------|---------|----------|--------------------------------|
| 1  | Free     | 0       | lifetime | உங்கள் பயணம் தொடங்குகிறது      |
| 2  | Starter  | 499     | 30d      | முதல் அடி எடுங்கள்             |
| 3  | Classic  | 999     | 90d      | தெளிவான தேர்வு                 |
| 4  | Silver   | 2499    | 90d      | இதயம் திறக்கும் நேரம்          |
| 5  | Gold     | 4999    | 180d     | தங்க வாழ்க்கை தொடர்புகள்       |
| 6  | Platinum | 9999    | until marriage | திருமணம் வரை நம்மோட உதவி |

### Plan × Feature matrix
See backend `CLAUDE.md` section 7.4 — single source of truth.

## 8. File-by-file inventory
### 8.1 Screens (`app/(root)/screens/`)
| File | Purpose | Plan-gated? |
|---|---|---|
| `_layout.tsx` | Stack navigator config for screens | — |
| **`ProfileDetail.tsx`** ⭐ | Other-user profile view: header, photo carousel (Free blur), Star Match, interest, shortlist, chat, request, **WhatsApp share (Gold+)**, **Voice Call CTA (Silver+)**, **verification badge (Silver+)** | Yes — multiple |
| **`PremiumTab.tsx`** ⭐ | Swipeable single-card-per-plan carousel (real 6 `subscription_plans` rows, dot indicator) with a check/cross entitlement checklist sourced from `/planFeatures/matrix`, tier badges, Razorpay checkout entry. **2026-07-20**: visual redesign to the app's blue/ink theme, then rebuilt again same day from a scrollable list into the swipeable-card layout + real checklist (see changelog, two separate entries) | — |
| `PaymentScreen.tsx` | Manual payment upload + status (PENDING/APPROVED) | — |
| **`SearchTabs.tsx`** ⭐ | Filter modal + result FlatList; **plan badges on results**, Edu/Star/Dosham filters gated by `isPremiumUser` | Yes |
| **`SearchResult.tsx`** ⭐ | Live search-results screen (navigated to from `SearchTabs.tsx`'s `handleSearch`, not legacy). Full-bleed "Gen-Z" photo card per result (gradient scrim, name+age headline, glass-chip meta, gradient tier ribbon, floating gold arrow FAB to `ProfileDetail`) — redesigned 2026-07-14, see changelog | — |
| `chatscreen.tsx` | 1-1 chat (WebSocket) | Yes — backend MESSAGE gate |
| **`settingsPage.tsx`** ⭐ | Settings menu: privacy, change pin, **Family Access (Gold+)**, premium banner, **PARENT scope guard** | Yes |
| `PrivacySettingsPage.tsx` | Hidden field toggles | — |
| `SettingPageChangePin.tsx` | Change PIN form | — |
| `NotificationScreen.tsx` | Notification list | — |
| `ListUser.tsx` | Generic user list (`?type=connection|viewed|shortlisted`) | Yes — Star Match upsell |
| `FollowUserList.tsx` | Followers/following | — |
| `listProfile.tsx` | Legacy profile list | — |
| `myfavourite.tsx` | Favorites view | — |
| `StarMatch.tsx` | Horoscope match form | Yes — premium |
| `StarMatchResult.tsx` | Match results display | — |
| **`HelpSupportPage.tsx`** ⭐ | Contact channels (tap-to-call / WhatsApp / mailto), support hours, and a message form that creates a **real support ticket** (`createSupportTicket`, same endpoint as `SupportFAB`). All copy from the `SUPPORT_CONTENT` keyValue row via `useRemoteContent`, bundled fallback per-field. Redesigned 2026-08-14 | — |
| `FAQPage.tsx` | FAQ accordion | — |
| `TermsPage.tsx` | Terms & privacy | — |
| **`MyRequestsScreen.tsx`** ⭐ NEW | Lists user's `ServiceRequest`s with status chips, pull-to-refresh | — |
| **`FamilyAccessScreen.tsx`** ⭐ NEW | Gold+ gated: list family members, add modal (name + relationship chips + mobile + 4-digit PIN), revoke confirm | Yes — Gold+ |

### 8.2 Tabs (`app/(root)/(tabs)/`)
| File | Purpose | Plan-gated? |
|---|---|---|
| `_layout.tsx` | Bottom tab navigator config | — |
| `index.tsx` | Home / discovery — uses `swiperprofile.js` carousels | — (badges via swiperprofile) |
| `explore.tsx` | Explore feed | — |
| **`mailBox.tsx`** ⭐ | Footer tab labeled **"Request"** (via `VVMFooterNav`, not "Mailbox"). Internal `TabView`: Received / Sent / **Permissions** (restricted-field access requests — key `request`). Accepts `?initialTab=request` ⭐ NEW to deep-link straight into a sub-tab (used by `QuickAccessFAB.tsx`'s "Permission Requests" tile). **No longer has a "Shortlisted You" tab** (removed 2026-07-08 — that view now lives solely at `ListUser?type=whoShortlistedMe`, same screen `profile.tsx`/`settingsPage.tsx` already used, to avoid two different UIs for the same data) | — |
| `myChatList.tsx` | Conversation list | — |
| **`profile.tsx`** ⭐ | Self profile + stats. **2026-07-14**: `formatUserDetails()`/`handleEditUpdate`'s `sectionMap` now also cover Job Place + Education in Detail (`EducationalDetail` section) and Current Address + Native Place (`PersonalDetail` section) — these moved out of signup, see `sign-up.tsx` entry | — |

### 8.3 Auth screens (`app/(root)/(main)/`)
| File | Purpose |
|---|---|
| `_layout.tsx` | Pre-login stack |
| `index.tsx` | Landing / splash |
| **`LoginScreen.tsx`** ⭐ | Mobile + PIN login. **Persists `userRole`, `familyLoginId`, `parentName`, `relationship` from response**. **2026-07-15**: rethemed to the app's blue-gradient look (see changelog) |
| **`sign-up.tsx`** ⭐⭐ | Multi-step registration. **2026-07-14**: Page 3 trimmed — Father's/Mother's Name+Occupation, Job Place, Current Address, Native Place, Annual Income, and Education in Detail removed from required fields (now collected post-signup via Profile tab edit sections). **2026-07-15 — bigger rework**: collapsed to **2 pages** (Page 1 = identity/contact through Education, Page 2 = Occupation → PIN), removed the Interests/"What are you passionate about" step entirely (hobbies already have a full post-signup edit path, no backend change needed), added a real labeled stepper header (persistent above the `Swiper`, not per-page), full-screen blue gradient background, and a from-scratch font pass (every `TextNB` now uses `style={{fontFamily:...}}` instead of NativeBase's buggy prop form — see section 17 landmine). Android DOB picker loop also fixed 2026-07-14 (see changelog) |
| **`OTPValidationScreen.tsx`** ⭐ + `otpVerification.tsx` | OTP entry. **2026-07-14**: copy now branches on email-vs-mobile flow (previously always said "Mobile number" even for email verification). **2026-07-15**: rethemed to match (see changelog). `otpVerification.tsx` remains dead/legacy code, not used |
| **`ChangePinScreen.tsx`** ⭐ | First-time PIN setup. **2026-07-15**: rethemed; removed a duplicate dead `interface ChangePinScreenProps` declaration |
| **`ResetPasswordScreen.tsx`** ⭐ | Forgot PIN flow. **2026-07-15**: rethemed to match (see changelog) |
| `SetNewPasswordScreen.tsx` ⭐ | New PIN entry post-OTP |
| `ProfileUnderVerificationScreen.tsx` ⭐ | Shown when user's profile is PENDING admin approval |

### 8.4 Components (`components/`)
| File | Purpose |
|---|---|
| **`swiperprofile.js`** ⭐ | Horizontal carousel of profile cards. **Free viewers see blur overlay + lock icon. Plan badges (Silver/Gold/Platinum) with verified checkmark.** Reads `useSubscription` |
| **`QuickAccessFAB.tsx`** ⭐ NEW | Global FAB, fixed bottom-left, mounted in root `app/_layout.tsx` (outside `<Stack>` so it overlays every authenticated screen). Tap opens a modal grid panel (3-col, staggered `FadeInUp` entrance via Reanimated) of quick-access tiles. Items come from keyValue `QUICK_ACCESS_MENU` (cached in AsyncStorage `quickAccessMenuCache`, 30-min TTL), with `DEFAULT_QUICK_ACCESS_ITEMS` hardcoded fallback if cache is empty and fetch fails. Each item has a semantic `id` (not a raw route) — a `switch` in `handlePress` maps `id → actual navigation`, so backend/DB content can't break routing. Items filtered client-side by `minPlan` vs `subscriptionData.planTitle` (plan-rank comparison) before rendering |
| **`SupportFAB.tsx`** ⚠️ | Draggable support-chat bubble (ticket-based chat with admin, category picker, unread badge). **Mounted ONLY inside `app/(root)/screens/settingsPage.tsx` as of 2026-07-07** — previously mounted globally in root `app/_layout.tsx`, moved out to free that spot for `QuickAccessFAB.tsx` and reduce clutter of two floating buttons on every screen. Self-contained (own `GestureHandlerRootView`, `Dimensions.get('window')` absolute positioning), so it renders correctly even scoped to a single screen |
| `ExploreProfileCard.tsx` | Generic profile card used in `SearchTabs.tsx`'s `FindPartner` grid (boost badge + shared-interests row) |
| `DiscoveryProfileCard.tsx` ⭐ NEW | Presentational card (full-bleed image, gradient scrim, gold "NEW" ribbon, verified badges) used only by `app/(root)/screens/listProfile.tsx` |
| `ExploreTabs.tsx` ⚠️ **DEAD CODE** | Not imported anywhere. The live "Explore tabs" (Search filter form + All Matches/Newly Added grid) is defined **inline inside `app/(root)/screens/SearchTabs.tsx`** (its own `const ExploreTabs = () => ...` near the bottom of that file) — don't confuse the two when asked to change "the Explore tabs" |
| `ProfileDetailTab.tsx` | Personal/Religious/Educational/Family tab content for ProfileDetail |
| `ProfileCompletionBar.tsx` | Profile % completion meter |
| `ProgressRing.tsx` | SVG ring |
| `tindercard.js` | Swipe deck |
| `tabs.tsx` ⭐ | Custom tab implementation |
| `PremiumNavBar.tsx` ⭐ | Top nav bar shown to premium users |
| `PromotionalPopup.tsx` ⭐ | Promo banner modal |
| `CommonPopup.tsx` ⭐ | Generic modal used by `PopupContext` |
| `QuickAction.tsx` ⭐ | Home screen quick action grid |
| `CustomNav.tsx` | Custom bottom nav |
| `DropdownComponent.tsx` | Generic dropdown |
| `MultiSelectDropdown.tsx` | Multi-select picker |
| `RangeSelectorModal.tsx` | Min/max range slider modal |
| `AgeRangeSelector.tsx` | Age slider |
| `ActionSheet.tsx` | Bottom action sheet |
| `editProfileModal.tsx` | Profile edit modal. `'Current Address'`/`'Education in Detail'` labels get a multiline `TextInput` (added 2026-07-14) instead of falling through to the single-line default case |
| `HappyStoryCard.tsx` | Testimonial card |
| `NotificationCard.tsx` / `NotificationFilter.tsx` / `NotificationHeader.tsx` / `notification.ts` | Notification UI |
| `Search.tsx` | Search bar |
| `SkeletonCard.tsx` | Loading skeleton |
| `FooterMessage.tsx` | Footer text |
| `listchats.js` | Chat list rendering |
| **`RelationshipManagerView.tsx`** ⭐ | Play Store-safe alternative to QR payment screen. Renders inside `PaymentScreen.tsx` when `PAYMENT_MODE='CONTACT'`, and inside `UpgradePlanScreen.tsx`'s plan picker. Hero card + plan summary (**2026-07-20: now includes a "WHAT YOU'LL GET" feature checklist per plan**, sourced from `ALL_UPGRADE_PLANS` in `utils/upgradeNavigation.ts`) + callback request form (name, mobile, time slot, note) + tap-to-call/WhatsApp + success state. |
| **`EditInterestsModal.tsx`** ⭐ NEW | Shared "Edit Your Interests" bottom sheet — `InterestChipGrid` multi-select (min 3) + Save, calls `userApi.updateUserHobbies` with a proper `res.data.code === 200` check. Used by both `profile.tsx` (Interests & Hobbies section) and `components/tabs.tsx` (`FirstRoute`'s profile-edit-tabs flow) — single implementation instead of two. |

### 8.5 Contexts (`app/(root)/contexts/`)
| File | Exports | Notes |
|---|---|---|
| **`AuthContext.tsx`** ⚠️ | `useAuth() → { userId, isOnline, login, logout, sendMessage, addChatListener, removeChatListener }` | **TWO `AuthProvider` definitions in this file. Only the BOTTOM one (line 157+) is exported and used. The top one is dead code.** Persists `userId` to AsyncStorage. Connects WebSocket on login. Clears all AsyncStorage on logout. |
| **`UserDataContext.tsx`** | `useUserData() → { userData, setUserData }` where userData = { userId (base64), decodedUserId, firstName, lastName, gender, location, casteId, isUser, profileImage, mobileNumber, userDetailId, userStatus } | Reads from AsyncStorage on mount |
| **`subscriptionContext.tsx`** | `useSubscription() → { subscriptionData, ... }` where subscriptionData = `{ planTitle, subscriptionId, endDate, entitlements: { advSearch, basicSearch, viewPersonalInfo, reqUnlimited, reqLimited } }` | Persists to AsyncStorage key `subscriptionData` |
| **`PopupContext.tsx`** ⭐ | `usePopup() → { premiumRequired(message, onUpgrade), confirm(...), info(...) }` | Uses `CommonPopup` |
| **`MasterDataContext.tsx`** | caste / star / dosham / education / occupation master lists | Loaded once on app start |

### 8.6 API layer (`app/(root)/api/`)
**`axiosClient.js`** — base URL `process.env.EXPO_PUBLIC_API_URL || 'http://10.200.67.116:9100'`. Interceptors:
- **Request**: injects `Authorization: Bearer ${authToken}` from AsyncStorage
- **Response**: on 401/403 (skip for `/auth/refresh` and `/user/login` and `/auth/*`), queues requests, calls `/auth/refresh` with stored `refreshToken`, replays queued requests with new token. On refresh failure → `forceLogout()` clears AsyncStorage + routes to LoginScreen.

**`userApi.js`** — full method list (60+ methods). Group by domain:

#### Auth / User
- `login(request)` → `POST /user/login`
- `lastSeen(userId)` → marks online
- `getProfileDetails(userId)` → `GET /user/getUserByUserId/{userId}`
- `getProfileDetailByUserId(userId, requesterId)` → `GET /user/getProfileDetailByUserId/{userId}?requesterId=...`
- `getUserConnectionCounts(userId)`
- (signup, OTP, change PIN, reset password methods)

#### Discovery / Search
- `getDailyRecommendation(casteId, gender)`
- `getNewConnections(casteId, gender)`
- `getNearYouProfiles(casteId, gender, location)`
- `getRandomUsers(gender, casteId)`
- `filterUsers(request)` → `POST /user/filterUsers`

#### Mailbox
- `getReceivedRequests(userId)`, `getSentRequests(userId)`, `getRestrictedFieldRequests(userId)`
- `getShortlistedMailbox(userId)` → `GET /mailbox/shortlisted/{userId}`
- **`getWhoShortlistedMe(encodedId, page=0, size=10)`** ⭐ NEW → `GET /mailbox/whoShortlistedMe/{encodedId}?page&size`
- `getPendingReceivedRequests`, `getAcceptedReceivedRequests`, `getRejectedReceivedRequests`
- `updateInterestRequestStatus(id, status)`, `deleteInterestRequest(id)`
- `insertShortlistedProfile(body)`, `deleteShortlistedProfile(id)`, `deleteShortlistedProfileByUsers(encodedId, userId)`, `checkShortlisted(encodedId, userId)`

#### Connections
- `getFollowingList(userId)`, `getFollowersList(userId)`, `unfollowOrRemoveUser(followerId, followingId)`
- `userConnectionCount(userId)`

#### Chat
- `userChatList(userId)` → `GET /conversation/chatlist/{userId}`
- (chat send + history methods)

#### Gallery
- `getUserGalleryImages(userId)`
- `changeGalleryImageActiveStatusByImageId(galleryId)`

#### Subscription / Payment
- (plan list, activate, payment request CRUD)
- **`getPlanFeaturesMatrix()`** ⭐ NEW → `GET /planFeatures/matrix` — reuses the admin "Plan Features" matrix endpoint (no auth gate, same `permitAll()` bucket as `/keyValue/**`); returns `{plans, features, cells}` from the real `features`/`planFeatures` tables. Consumed by `PremiumTab.tsx` to build its real check/cross entitlement checklist per plan (`buildChecklistByPlan()`), instead of hardcoded marketing bullet text.

#### Service Request ⭐ NEW
- **`createServiceRequest(encodedUserId, requestType, note)`** → `POST /service-request/create/{encodedUserId}`
- **`getMyServiceRequests(encodedUserId, page=0, size=10)`** → `GET /service-request/my/{encodedUserId}`

#### Family Login ⭐ NEW
- **`createFamilyLogin(encodedUserId, body)`** → `POST /family-login/create/{encodedUserId}` body `{ parentName, relationship, mobile, email, pin }`
- **`getMyFamilyLogins(encodedUserId)`** → `GET /family-login/mine/{encodedUserId}`
- **`revokeFamilyLogin(encodedUserId, familyLoginId)`** → `DELETE /family-login/{encodedUserId}/{familyLoginId}`

#### Payment Mode + Callback Request ⭐ NEW (Play Store gating)
- **`getPaymentMode()`** → `GET /keyValue/getKeyValueByKey/PAYMENT_MODE` — returns `{mode: 'QR' | 'CONTACT'}`
- **`getAdminContact()`** → `GET /keyValue/getKeyValueByKey/ADMIN_CONTACT` — returns `{phone, whatsapp, rmName, rmTitle, rmPhotoUrl, callbackHours}`
- **`createCallbackRequest(encodedUserId, body)`** → `POST /callback-request/create/{encodedUserId}` body `{ name, mobile, email?, planInterested, note?, bestTimeToCall? }` (encodedUserId may be `'guest'` for unauthed leads)
- **`getMyCallbackRequests(encodedUserId, page=0, size=10)`** → `GET /callback-request/my/{encodedUserId}`

#### Quick Access Menu ⭐ NEW
- **`getQuickAccessMenu()`** → `GET /keyValue/getKeyValueByKey/QUICK_ACCESS_MENU` — returns `{items: [{id, label, icon, color, minPlan, order}]}`. Reuses the fully generic `getKeyValueByKey` backend endpoint (no backend code change needed — just a seeded row, same pattern as `PAYMENT_MODE`). Consumed by `components/QuickAccessFAB.tsx`.

### 8.7 Services (`app/(root)/services/`)
- **`webSocketService.ts`** — `connect(userId)`, `disconnect()`, `sendChatMessagePublic(convId, msg)`, `addChatListenerPublic(cb)`, `removeChatListenerPublic()`, `clearListeners()`. Wraps SockJS + STOMP. `socket` property exposed for null check.
- **`masterService.tsx`** — preload caste/star/dosham/education master lists.

### 8.8 Hooks & utils
- **`usePushNotification.tsx`** (at app root, not under `app/`) — `expo-notifications` registration, FCM token retrieval, posts token to backend `/pushNotification/updateFcmToken`. Wired in root `_layout.tsx`.
- **`utils/deviceInfo.ts`** — `getDeviceId()`, platform helpers.

## 9. API method index
Full enumeration in section 8.6. Cross-reference with backend `CLAUDE.md` section 8.4.

## 10. Plan gating (frontend implementation map)
| Feature | File · element | Gate condition | Action on fail |
|---|---|---|---|
| **Free profile blur** | `components/swiperprofile.js` | `subscriptionData?.planTitle === 'Free'` AND `item.profileImage` | Render `BlurOverlay` with lock icon |
| **Plan badges (search results)** | `components/swiperprofile.js`, `app/(root)/screens/SearchTabs.tsx` | `item.subscriptionTitle ∈ {Silver, Gold, Platinum}` | Render colored badge with verified check |
| **Photo gate (full image modal)** | `app/(root)/screens/ProfileDetail.tsx` `openImageModal()` | `!planTitle \|\| planTitle === 'Free'` | `popup.premiumRequired(...)` + early return |
| **WhatsApp share button** | `app/(root)/screens/ProfileDetail.tsx` header CTA | `planTitle === 'Gold' \|\| planTitle === 'Platinum'` | Hide button entirely |
| **Voice Call request CTA** | `app/(root)/screens/ProfileDetail.tsx` header CTA | `planTitle && planTitle !== 'Free'` | Hide button; if backend returns 403 → `popup.premiumRequired` |
| **Verification badge** | `app/(root)/screens/ProfileDetail.tsx` (next to name) | `userDetails?.subscriptionTitle ∈ {Silver, Gold, Platinum}` | Hide check icon |
| **Family Access settings entry** | `app/(root)/screens/settingsPage.tsx` | `planTitle === 'Gold' \|\| planTitle === 'Platinum'` AND `userRole !== 'PARENT'` | Hide menu item |
| **PARENT scope guard** | `app/(root)/screens/settingsPage.tsx`, `app/(root)/(tabs)/profile.tsx`, `components/tabs.tsx` | `userRole === 'PARENT'` (read from AsyncStorage) | Settings: hide Privacy / Change PIN / Family Access + banner. Profile tab: block About edit button, PersonalDetail/ReligiousDetail/EducationDetail/FamilyDetail edit buttons, profile photo change — all show `popup.error('Not allowed', ...)` instead |
| **Star Match premium check** | `app/(root)/screens/ProfileDetail.tsx`, `settingsPage.tsx` | `!isPremiumValue` / `!planTitle \|\| planTitle === 'Free'` | `popup.premiumRequired(...)` + return |
| **Saved-search premium filter** | `app/(root)/screens/SearchTabs.tsx` `handleUseSearch` | `hasPremiumFeatures && !isPremiumUser` | `popup.premiumRequired(...)` + return |
| **Adv search filter UI** | `app/(root)/screens/SearchTabs.tsx` | `subscriptionData.entitlements.advSearch === true` (sets `isPremiumUser`) | (silent backend degrade in `filterUsers`) |
| **Photo viewer / Horoscope / SecureConnect** | Backend masks fields directly; frontend just renders whatever comes back | (no frontend gate needed) | `mobile`/`email`/`horoscope` are null or masked from server |
| **INFO mode (review-safe, no prices)** | `PremiumTab.tsx`, `UpgradePlanScreen.tsx`, `PaymentScreen.tsx`, `AddOnPaymentScreen.tsx`, `RelationshipManagerView.tsx`, `(tabs)/profile.tsx` boost banner | `PAYMENT_MODE === 'INFO'` | Feature comparison still renders; every ₹ amount and every purchase CTA is suppressed. Routing matches CONTACT. |
| **Payment mode toggle (Play Store gating)** | `app/(root)/screens/PaymentScreen.tsx` early return, AND `utils/upgradeNavigation.ts`'s `resolvePaymentMode()` (decides the destination screen before the user even reaches PaymentScreen) | Backend `keyValue.PAYMENT_MODE === 'CONTACT'` (default; both consumers always fetch fresh as of 2026-07-20, cache is fallback-only) | PaymentScreen renders `<RelationshipManagerView/>` instead of QR/UPI. `buildUpgradeAction(...)` sends Free users to `UpgradePlanScreen` instead of `PremiumTab`. Existing `paymentRequestId` route param forces QR view regardless (resume in-flight payments). |
| **Quick Access FAB items** | `components/QuickAccessFAB.tsx` `visibleItems` | Per-item `minPlan` (from keyValue `QUICK_ACCESS_MENU`) vs `subscriptionData.planTitle`, compared via a plan-rank table (`Free < Starter < Classic < Silver < Gold < Platinum`) | Item is filtered out of the grid entirely (not shown, not just disabled) |
| **Quick Access "Shortlisted You" tile** | `components/QuickAccessFAB.tsx` `handlePress('SHORTLISTED_YOU')` | Defensive re-check of `planTitle` at tap-time (Gold+) even though the item is already `minPlan`-filtered | `popup.premiumRequired(...)` + return, in case cached plan data is stale |
| **Reveal Contact button** | `app/(root)/screens/ProfileDetail.tsx` `InlineProfileTabs` Contact section | `planTitle === 'Classic'` AND mobile came back `null` from the initial fetch (backend: `VIEW_PERSONAL_INFO` planFeatures row = numeric quota, not `enabled`) | Show "Reveal Contact" button → `userApi.revealContact(...)`; Free/Starter (no row at all) still see the flat `PremiumLock` wall; Silver+ (`enabled`) never see this branch since mobile is already populated |

## 11. Auth & roles
### Login flow
1. `LoginScreen.tsx` reads mobile + PIN, calls `userApi.login(request)`.
2. Response payload (success): `{ userId (base64), email, gender, dob, location, mobile, firstName, lastName, profileImage, casteId, isUser, userStatus, role?, familyLoginId?, parentName?, relationship?, token?, refreshToken? }`.
3. LoginScreen persists ALL fields to AsyncStorage, including:
   - **`userRole`** = `response.data.data.role || 'USER'` (will be `'PARENT'` for family logins)
   - **`familyLoginId`**, **`parentName`**, **`relationship`** if present
4. AuthContext.login(userId) → connects WebSocket → routes to `(tabs)/index`.

### Roles
- **`USER`** (default) — full access
- **`PARENT`** — logged in via backend family-login fall-through. Same `userId` (base64) as the child, so all `/user/*` calls operate on the child's data unchanged. Frontend hides Privacy Settings, Change PIN, Family Access in `settingsPage.tsx` and shows a banner "You're logged in as [parentName]".

### Refresh
- `axiosClient.js` handles 401/403 by calling `/auth/refresh` with stored `refreshToken`. On failure → `forceLogout()` → clear AsyncStorage + route to LoginScreen.

## 12. DB schema
N/A — see backend `CLAUDE.md` section 12.

## 13. State management
### Context tree (in `_layout.tsx`)
```
<AuthProvider>
  <UserDataProvider>
    <SubscriptionProvider>
      <PopupProvider>
        <MasterDataProvider>
          <Slot />
        </MasterDataProvider>
      </PopupProvider>
    </SubscriptionProvider>
  </UserDataProvider>
</AuthProvider>
```

### State shapes
- **AuthContext**: `{ userId: string|null, isOnline: boolean, login, logout, sendMessage, addChatListener, removeChatListener }`
- **UserDataContext**: `{ userData: { userId, decodedUserId, firstName, lastName, gender, location, casteId, isUser, profileImage, mobileNumber, userDetailId, userStatus, ... }, setUserData }`
- **subscriptionContext**: `{ subscriptionData: { planTitle, subscriptionId, endDate, entitlements: { advSearch, basicSearch, viewPersonalInfo, reqUnlimited, reqLimited } }, refreshSubscription, clearSubscription }`
- **PopupContext**: `{ premiumRequired(msg, onUpgrade), confirm(...), info(...) }` — global modal manager
- **MasterDataContext**: `{ casteList, starList, doshamList, educationList, occupationList, ... }`

## 14. AsyncStorage keys
| Key | Written by | Read by | Purpose |
|---|---|---|---|
| `userId` | `LoginScreen`, `AuthContext.login` | `UserDataContext`, every API call | Base64-encoded backend userId |
| `authToken` | `LoginScreen`, `axiosClient` refresh | `axiosClient` interceptor | JWT access token |
| `refreshToken` | `LoginScreen`, `axiosClient` refresh | `axiosClient` 401 handler | JWT refresh token |
| `firstName`, `lastName` | `LoginScreen` | `profile.tsx`, `settingsPage.tsx` | Display name |
| `gender` | `LoginScreen` | search filters | M/F |
| `location` | `LoginScreen` | discovery / search | City |
| `casteId` | `LoginScreen` | discovery API calls | Caste filter |
| `isUser` | `LoginScreen` | premium gating fallback | `PU` / `FA` |
| `userStatus` | `LoginScreen` | `_layout.tsx` profile-pending redirect | `PENDING` / `APPROVED` / `REJECTED` |
| `rejectionReason` | `LoginScreen` | `ProfileUnderVerificationScreen` | Admin's rejection text |
| **`userRole`** ⭐ | `LoginScreen` | `settingsPage.tsx` parent guard | `USER` / `PARENT` |
| **`familyLoginId`** ⭐ | `LoginScreen` | `settingsPage.tsx` (audit) | numeric id |
| **`parentName`** ⭐ | `LoginScreen` | `settingsPage.tsx` banner | display |
| **`relationship`** ⭐ | `LoginScreen` | `settingsPage.tsx` banner | display |
| `hasStarted` | `LoginScreen` | `_layout.tsx` first-run flag | `'true'` |
| `profileImage` | `LoginScreen` | profile / chat avatars | URL |
| `subscriptionData` | `subscriptionContext` | `subscriptionContext`, every plan-gated screen | JSON of `{planTitle, subscriptionId, endDate, entitlements}` |
| `fcmToken` | `usePushNotification` | logout cleanup | Firebase token |
| `userData` | `axiosClient.forceLogout` clears it | (legacy — not actively read) | — |
| `mobileNumber` | `LoginScreen` (via UserDataContext) | self profile | — |
| `userDetailId` | `LoginScreen` | profile edit | — |
| `email` | `sign-up`, `ResetPasswordScreen` | reset flows | — |
| `resetPhoneNumber` | `ChangePinScreen` | `ChangePinScreen` form | OTP-based PIN reset |
| `resetEmail` | `ResetPasswordScreen` | `OTPValidationScreen` | OTP-based password reset |
| `deviceId` | `utils/deviceInfo.saveDeviceInfo` | `utils/deviceInfo.updatePushToken` | unique device identifier for push targeting |
| `masterData` | `MasterDataContext` (`loadMasterData`) | dropdowns across forms | JSON cache of caste/star/dosham/education master lists |
| `promo_seen_{bannerId}` | `components/PromotionalPopup` | `components/PromotionalPopup` | tracks `every_open` / `once_per_day` / `once_ever` display frequency |
| **`paymentModeCache`** ⭐ | `PaymentScreen.tsx`, `utils/upgradeNavigation.ts` | `PaymentScreen.tsx`, `utils/upgradeNavigation.ts` | JSON `{mode: 'QR'\|'CONTACT', expiresAt: epochMs}`. 5-min TTL. **Two independent readers of the same key** — `PaymentScreen.tsx` always fetches fresh and only uses this for an optimistic first paint; `upgradeNavigation.ts`'s `resolvePaymentMode()` (used by every `buildUpgradeAction(...)` call) also always fetches fresh as of 2026-07-20 (fixed — it used to trust this cache for up to 5 min without re-checking, which could route users to the wrong upgrade screen for that long after an admin changed the mode) and only falls back to this cache on an actual network error. |
| **`quickAccessMenuCache`** ⭐ NEW | `components/QuickAccessFAB.tsx` | `components/QuickAccessFAB.tsx` | JSON `{items: [...], expiresAt: epochMs}`. 30-min TTL (changes rarely, unlike payment mode). Optimistic read on mount, background refresh, falls back to hardcoded `DEFAULT_QUICK_ACCESS_ITEMS` if cache is empty and the fetch also fails. |

## 15. Navigation
### Expo Router tree
```
/                                 → app/index.tsx (entry redirect)
/(root)
  /(main)                          → pre-login stack
    /                              → landing
    /LoginScreen
    /sign-up
    /OTPValidationScreen
    /otpVerification
    /ChangePinScreen
    /ResetPasswordScreen
    /SetNewPasswordScreen          ⭐
    /ProfileUnderVerificationScreen ⭐
  /(tabs)                          → bottom tabs
    /                              → home/discovery
    /explore
    /mailBox                       (footer tab label is "Request", not "Mailbox")
                                    (?initialTab=request ⭐ NEW — deep-link into the Permissions sub-tab, used by QuickAccessFAB)
    /myChatList
    /profile
  /screens/...                     → stack pushes
    /ProfileDetail?userId=...
    /PremiumTab
    /PaymentScreen
    /SearchTabs
    /chatscreen?conversationId=...
    /settingsPage
    /PrivacySettingsPage
    /SettingPageChangePin
    /NotificationScreen
    /ListUser?type=connection|viewed|shortlisted
    /StarMatch
    /StarMatchResult
    /HelpSupportPage / FAQPage / TermsPage
    /MyRequestsScreen              ⭐ NEW
    /FamilyAccessScreen            ⭐ NEW
```

## 16. Cross-repo contracts
See backend `CLAUDE.md` section 16.

## 17. Known landmines
- **`masterData` is written by TWO independent code paths — both must MERGE, never overwrite.** `MasterProvider` seeds it with `{castes, subcastes}` (from `/caste/*`), while `masterService.loadMasterData()` writes the keyValue bag (`education`, `districts`, `employingIn`, `annualIncomeRegister`, banners…). When `setMasterData` overwrote the stored blob, the two racing writes left AsyncStorage holding only `{castes, subcastes}` — permanently. Fixed 2026-08-09; don't reintroduce a plain `setItem('masterData', payload)`.
- **Never guard a master-data fetch with `if (!Object.keys(masterData).length)`.** That asks "is anything cached", and the `{castes, subcastes}` seed above makes it non-empty, so the fetch is skipped and the keyValue-backed dropdowns stay empty forever. Guard on the specific keys the screen consumes (see `REQUIRED_MASTER_KEYS` in `sign-up.tsx`). This was the actual cause of the "Education / City / Employing In don't bind" bug.
- **`AUDIT_REPORT.md` (repo root) documents unfixed 🔴 security issues.** As of 2026-08-09 the backend runs with security entirely disabled and this app's `axiosClient` sends no auth header (both were commented out before this session). Do not assume any endpoint is protected. Read that report before touching auth, payments, or anything handling contact data.
- **Never hardcode a plan name in upsell copy again.** Displayed plan names must go through `upgradeMessage(...)` / `resolveMinPlanTitle(...)` in `app/(root)/utils/upgradeNavigation.ts`, so retiring or re-activating a plan is a pure `subscription_plans.isActive` DB flip. The `minPlan` argument passed to `buildUpgradeAction` is a *different thing* — it is the real entitlement floor and must stay a fixed tier name. `PLAN_RANK`/`TIER_ORDER`/tier badges must keep ALL 6 tiers even when a tier is retired, or grandfathered subscribers lose their badge and rank comparisons.
- **Subcaste UI hides itself for any caste with zero subcastes** — never render an empty picker. The `subcastes` table was seeded 2026-08-09 with 23 client-supplied names (see backend `seed-subcastes.sql`): Vanniyar 5, Naidu 6, Aadi Dravidar 5, Mudaliar 7, FREECASTEBAR deliberately 0. Never invent additional subcaste names — additions must come from the client.
- **DB indexes are hand-applied, not in version control.** `ddl-auto=update` doesn't create indexes and there's no migration tool — confirmed by letting Hibernate build a schema from scratch: it made the `subcastes` table and `users.subcasteId` column but **0 of the 16 indexes and no FK**. Applied to local `vvm_db` and to production `vaibhavVivaaha` on 2026-08-10 (verified 16/16 indexes with correct columns, FK present, 27 subcaste rows). **Staging and any new environment still need them** — run `VaibhavVivaahaBackend/migration-indexes-simple.sql`, verify with `verify-production.sql`.
- **Two `AuthProvider` definitions** in `app/(root)/contexts/AuthContext.tsx`. The TOP one (`export default { AuthContext, AuthProvider: ... }`) is **dead code**. The BOTTOM one (line 157+) is the real export used via `useAuth()`. Don't edit the wrong one.
- **`userApi.js` is JavaScript**, not TypeScript — no type checking on responses.
- **Base64 user IDs**: `userData.userId` is the base64-encoded form. The decoded numeric is `userData.decodedUserId`. Do NOT mix them up.
- **`isPremiumUser` ≠ `isPremiumValue`** — different state variables in different files. `isPremiumUser` (SearchTabs) is `entitlements.advSearch && entitlements.basicSearch`. `isPremiumValue` (ProfileDetail) is `entitlements.viewPersonalInfo === true`. Both are derived from `subscriptionContext.entitlements`.
- **`AsyncStorage.clear()` on logout** — clears EVERYTHING including any unrelated keys other code may have stored. Be careful adding new keys.
- **`webSocketService.socket` null check** — many places check `if (!webSocketService.socket)` before connecting; the wrapper exposes raw socket for this reason.
- **`react-native-snap-carousel` is deprecated** — used in `swiperprofile.js`. No replacement yet.
- **Two date libraries**: `dayjs` and `moment`. Pick one when adding new code (prefer dayjs).
- **Multiple form/dropdown libraries**: `react-native-element-dropdown`, `react-native-dropdown-picker`, `react-native-dropdown-select-list`. Inconsistent.
- **`usePushNotification.tsx` lives at the repo root** (not under `app/`). Imported as `'../../usePushNotification'` from layout.
- **Backend API URL is hardcoded** to `http://10.200.67.116:9100` in `axiosClient.js`. Override via `EXPO_PUBLIC_API_URL` env var.
- **Stale `userRole` after logout-then-relogin** — make sure LoginScreen always overwrites `userRole` (it does, via `|| 'USER'` fallback).
- **`SupportFAB` is NOT globally mounted anymore** (as of 2026-07-07) — it only renders inside `settingsPage.tsx`. If you're looking for "the floating support chat button" on other screens, it's gone by design; don't re-add it globally without checking with the team first (it was intentionally moved to make room for `QuickAccessFAB.tsx`).
- **Two FABs exist in the codebase now** — `QuickAccessFAB.tsx` (global, bottom-left, fixed) and `SupportFAB.tsx` (settingsPage-only, draggable, bottom-right default). Don't confuse them when debugging "the FAB."
- **`QuickAccessFAB` items use semantic `id`s, not raw routes** — the keyValue `QUICK_ACCESS_MENU` JSON never contains an Expo Router path. Adding a new quick-access item requires a matching `case` in `QuickAccessFAB.tsx`'s `handlePress` switch, not just a DB row.
- **Backend endpoints almost always return HTTP 200 even on business failures** — the `ResultResponse`/`PaginatedResultResponse` pattern sets a `code` field (e.g. `400`, `403`, `404`, `500`) INSIDE the JSON body, but the actual HTTP status Spring sends is still 200 in most controllers (they just `return response;` from a `@PostMapping`/`@GetMapping` method — no `ResponseEntity` with a real status). This means `axios` never rejects on a business failure; you MUST check `res.data.code` / `res.data.status` yourself. Bit us in `handleSendInterest` (silently treated a duplicate-request rejection as success — fixed 2026-07-08) and is the same reason `KeyValueController`'s 404 "not found" never surfaces as a real HTTP error either. When wiring up any new API call, check `res.data.code` explicitly — don't assume "the promise resolved" means "it succeeded."
- **"Native Place" maps to the backend's `permanentAddress` column, not a field named `nativePlace`** — that column was dormant/unused until 2026-07-14, reused instead of adding a new one. See backend `CLAUDE.md` section 17. Don't be confused by the field-name mismatch when reading `profile.tsx`'s `sectionMap.PersonalDetail` (`nativePlace` key) vs. the API response (`d.permanentAddress`).
- **NativeBase `<Text>`'s prop-form `fontFamily="Rubik-X"` silently loses the custom font on Android when paired with a `fontWeight` prop** (even an implicit default one) — our custom font names were never registered as NativeBase theme tokens (`extendTheme` is not used anywhere in this repo), so `useResolvedFontFamily`'s fontWeight-stripping logic never kicks in, and NativeBase merges a `fontWeight` alongside the raw `fontFamily` string; Android then falls back to a system font with synthetic bold, ignoring the real Rubik `.ttf` (see NativeBase GitHub issue #3811). Plain RN `<Text style={{fontFamily:'Rubik-X'}}>` (used everywhere outside auth screens — `SearchTabs.tsx`, `profile.tsx`) never hits this path and renders correctly. **Fixed 2026-07-15** across all 5 pre-login auth screens (`sign-up.tsx`, `LoginScreen.tsx`, `OTPValidationScreen.tsx`, `ChangePinScreen.tsx`, `ResetPasswordScreen.tsx`) by moving every font declaration into a `style` object instead of a bare `fontFamily=`/`fontWeight=` prop. **If you add new `TextNB` (NativeBase Text) usage anywhere, always set the font via `style`, never via the bare prop form.**
- **`interestStatus` gating pattern is now shared by Request Call AND Star Match** — both live in `ProfileDetail.tsx` and require `interestStatus === 'APPROVED'` before proceeding (see 2026-07-15 changelog entry). If you add another "do something with this specific other member" action to this screen, check whether it should follow the same rule before shipping it ungated — it's an easy gap to introduce, since only the plan-tier gate is obvious at a glance.
- **Exactly ONE `GestureHandlerRootView` in the whole app** — it lives in `app/_layout.tsx`, wrapping everything (outermost element, above `SafeAreaProvider`). `QuickAccessFAB.tsx` and `SupportFAB.tsx` used to each wrap their own draggable button in a second, full-screen `GestureHandlerRootView` — this is a known Android bug: a full-screen `GestureHandlerRootView` does NOT reliably honor `pointerEvents="box-none"` there, so it silently swallows every touch on screen except its own content (symptom: "I can't tap anything except the FAB" on Android only, iOS unaffected). Fixed 2026-07-08 by removing the per-component root views and using plain `View` + `GestureDetector` instead, relying on the single app-wide root. **Do not reintroduce a second `GestureHandlerRootView` anywhere** — new draggable/gesture components should just use `GestureDetector` directly.
- **`AuthContext.userId` only ever gets set from ONE place: `checkUserStatus()` at app boot.** `useAuth().login(userId)` is the only other code path that updates it, and until 2026-07-20 nothing called it — `LoginScreen.tsx` wrote `userId`/`authToken` straight to AsyncStorage and never touched `AuthContext`'s in-memory state. Since `QuickAccessFAB.tsx` (and anything else gated on `useAuth().userId`) reads that in-memory state, not storage, a same-session logout→relogin left it stuck at whatever `logout()` last set it to (`null`), hiding the FAB until a full app restart re-ran `checkUserStatus()`. **Fixed** by calling `login(response.data.data.userId)` in `LoginScreen.tsx`'s `handleLogin`. **If you add another entry point that logs a user in** (social login, biometric re-auth, etc.), it must call `useAuth().login(userId)` too, not just write AsyncStorage directly — grep for `.setItem('userId'` if you're unsure whether a flow already does this.
- **`AuthContext.tsx`'s `handleLogout()` calls `AsyncStorage.clear()` without `await`** (fire-and-forget, inside the real/bottom `AuthProvider`, not the dead top one) — found while investigating the FAB bug above; NOT itself the cause of that bug (confirmed: `AuthContext`'s live `userId` state is in-memory and unaffected by a delayed storage wipe), but a real, separate landmine: a user who logs out and relogs in fast enough could have this delayed full wipe fire *after* the new session's fresh `AsyncStorage.setItem()` calls, silently deleting them (userId/authToken/subscriptionData/masterData/quickAccessMenuCache/etc.) while the UI still looks fine off in-memory context state — only surfacing as missing data on some later flow that specifically re-reads AsyncStorage instead of trusting context. Not fixed this session (out of scope for the FAB bug being chased) — if you're debugging "some storage-backed feature randomly breaks after a quick logout→login cycle," check this first. Fix would be adding `await` in front of that `AsyncStorage.clear()` call.
- **`subscriptionContext.tsx` has a `clearSubscription()` but nothing ever calls it** — confirmed while investigating the same bug. Logging out doesn't clear `subscriptionData`, so switching between two different test accounts back-to-back in the same session can leak the previous account's plan (and therefore its feature gating) into the new session until `refreshSubscription()` happens to be called by some other screen. Not fixed this session — flagging since it's adjacent to the AuthContext relogin bug and easy to rediscover independently.
- **`PremiumTab.tsx` has several early `return`s (loading / error / PENDING payment / already-subscribed) before its main JSX** — any new hook (`useState`, `useEffect`, `useSharedValue`, etc.) MUST be declared above all of them, grouped with the component's other top-level hooks. Placing a hook after one of these `if (...) return (...)` blocks passes on the first render (while that branch is active) but throws "Rendered more hooks than during the previous render" / hook-order-mismatch the moment the branch condition changes and the function runs further than before — happened when the carousel's `useSharedValue`/`useAnimatedScrollHandler` were first added right before the main return, past all 4 early-return branches. Fixed by moving them up next to the other `useState` calls at the top of the component.

## 18. Recent changes log (rolling, newest first)
### 2026-08-18 — Last 58 `Vann*/Naidu*/Aadi*/Mudal*/Free* TestMale` accounts renamed
The caste × plan test matrix (696–755) still carried names like `VannSilver TestFemale` and `MudalPlatinum TestMale`. They are all `isActive='N'` so they never reach member search, but they are visible in the admin panel and would be the moment anyone reactivates one. All 58 now have real Tamil names, generated against the full existing-name set so **no name collides with the 322 already in the database**.

⚠️ **The old names encoded caste + plan + gender at a glance, and that is now lost.** The mapping (userId · old name · new name · plan) is saved at **`VaibhavVivaahaBackend/test-accounts-map.txt`** — keep it, or tier-specific testing means looking up the plan for every account. Mobiles are unchanged (`91xxxxxxxx` pattern still encodes caste+tier: `9114000002` = Vanniyar Silver female), so the number remains the quickest way to identify one.

Verified: **zero** accounts remain matching the old test-name patterns.

**All 558 `@vvm.test` email addresses replaced too** (`firstname.lastname@example.in`, de-duplicated with a numeric suffix where a name pair repeats) — the names were fixed but the emails still read `tst16f@vvm.test`, and email is visible on a profile to members with contact access. Zero test-pattern emails remain. `verify-search.py` still 19/19 afterwards.

⚠️ **A raw SQL `UPDATE` does not touch `users.updatedAt`** — there is no `ON UPDATE CURRENT_TIMESTAMP` on that column and Hibernate's `@PreUpdate` only fires for entity saves. So an export taken after one of these bulk renames still shows the *old* `updatedAt`, which makes it look like nothing changed. Re-query the actual columns to confirm a bulk change landed; do not trust the timestamp.

💡 **Row 756 (`Srinivasan p`, 9047499400) is a genuine website lead, not test data** — it comes from `QuickRegisterForm` → `POST /user/createStarterProfile`, which captures name + mobile only, so `lastName`/`casteId`/`email`/`userStatus` are all NULL and it has **no `user_details` row**. It is therefore invisible to search (`filterUsers` inner-joins `user_details`) and harmless for review. **Do not delete it as part of a test-data cleanup** — it is a real prospect. It is currently the only row of this shape.

### 2026-08-18 — Seed pool rebuilt: renamed 78, added 96 signup-parity profiles
After hiding the fake-looking rows (entry below), the surviving pool still read as generated — digit suffixes (`Anjali1`), single-letter surnames (`Divya C`) and a visible cross-product of first/last names. Two passes fixed it:

**1. Renamed all 78 visible seed profiles** to distinct realistic Tamil name pairs (gender-matched, uniqueness enforced in the generator). Originals are in `_bak_users_status_20260818`.

**2. Inserted 96 new profiles with full signup parity**, matching exactly what `UserService.createUser` writes: a `users` row (memberId `UMR%06d` continuing from the live max, Base64 PIN, `isUser='FA'`, `isBlocked='N'`), a `user_details` row, **and the auto-assigned Free `user_subscriptions` row** — that third table is the one a naive seed forgets. Data is deterministic (no RNG, reproducible), spread across castes 1/2/3/4/5 with valid `subcasteId`s per caste, real TN cities, and **normalised star/dosham spellings** so the profiles are actually findable by search. Script kept at `scratchpad/newusers.sql`; every row tagged `createdBy='seed-2026-08-18'`, so the whole batch is one DELETE away from removal.

⚠️ **Three schema traps hit while seeding directly — a straight INSERT is not enough:**
- **`UserEntity.isOnline` is a primitive `boolean` and `view_count` an `Integer`.** Leaving them NULL made Hibernate throw on entity load, so **`/user/login` returned 500** for every seeded profile while the rows looked perfectly fine in SQL. Set `isOnline=0, view_count=0`.
- **`user_subscriptions.autoRenew` is NOT NULL with no default** — the insert fails outright without it (`'N'`).
- **`languages` and `hobbies` are JSON columns**, not varchar; `'Tamil, English'` is rejected with "Invalid JSON text". Also `height` values contain an apostrophe (`5'2"`) which must be escaped.

**Verified against live production, not just SQL:** seeded accounts log in (200 + token), their profile detail renders through `getProfileDetailWithIntractionStatus`, and **`verify-search.py` passes 19/19**.

⚠️ **`verify-search.py`'s `CALLER_ID` was `702`, an account deleted this morning**, which made 9 cases fail with the API returning rows the snapshot excluded. Now `706` (the live demo account). **If the demo account is ever deleted or renumbered, this constant has to move with it** — the failures look like search bugs, not a dead caller.

Final visible pool: **175 profiles (104 F / 71 M, 38 with photos), 167 distinct names, no duplicates, no digits, no test bios.**

### 2026-08-18 — Test profiles hidden ahead of Play review (518 of 598 deactivated)
Google's Deceptive Behavior policy treats fake/padded profiles seriously, and matrimony apps get more scrutiny than most. Production held 598 approved profiles of which **558 had `@vvm.test`-style emails** — essentially the whole dataset is seeded.

Hidden via `users.isActive='N'` (the flag every discovery/search query actually filters on — `UserRepository` uses `u.isActive = :active`; `userStatus` is the approval gate, not a visibility switch). Full prior state backed up to **`_bak_users_status_20260818`** (all 656 rows), so this is one UPDATE away from being undone.
- **58** obviously-fake names (`Vann*`, `*Test*`).
- **460** duplicate-name clones — 40 names repeated ~15× each (fifteen "Sangeetha Kannan"…); kept the lowest `userId` of each.
- **1** `Super Admin` (`isUser='ADM'`) which was appearing in member search.

Result: **80 visible (56 F / 23 M, 38 with photos)**, zero duplicate names, zero profiles whose bio says "Test account… PIN=1234". Demo account 706 explicitly excluded from every statement.

⚠️ **The remaining pool still has tells and could not be cleaned further without emptying the app.** Visible names include digit suffixes (`Anjali1`, `Divya1` — 14 profiles), single-letter surnames (`Divya C`, `Bhavani G` — 37), and a visible cross-product (Ganesh/Karthik/Praveen/Senthil × Raj/Balan/Selvan/Pandiyan). Filtering those out too leaves **42 profiles with just 1 photo between them** — the photos are concentrated in exactly the synthetic-looking rows, so a stricter filter trades "looks seeded" for "looks broken", which is worse at review.

**The real fix is to import the broker campaign data (1,000 Mudaliar + 500 Vanniyar) before submitting** and deactivate the seed set entirely. Renaming the seed rows to look organic was deliberately NOT done — that is polishing synthetic data to read as real members, which is the behaviour the policy targets.

### 2026-08-18 — Play Store demo account prepared (user 706)
Google requires working credentials for a login-gated app. Account 706 was repurposed as the reviewer demo account: **Krish Selva · 6379829750 · PIN 1234 · Platinum to 2053 · APPROVED**, email `selvakrish820@gmail.com`. Verified end-to-end against production: login returns 200 with a token, and the plan resolves to Platinum.

**Why a PREMIUM account, not Free.** With a Free account a reviewer hits `popup.premiumRequired` on nearly every meaningful tap (blurred photos, contact, filters, star match), and in `PAYMENT_MODE=INFO` each one routes to "Contact us to learn about membership" — a dozen off-platform upsell prompts shown to a reviewer, which is the exact pattern INFO mode exists to avoid. Platinum shows zero upsells.

**Why the MALE account (706), not the female one (707).** Discovery is scoped to opposite gender within the member's caste. In caste 1 a male account browses **91 female profiles, 37 with photos**; a female account browses **58 male profiles, only 5 with photos** — a feed of grey placeholders that reads as broken.

⚠️ **The demo profile's About text said `"Test account: Vann Platinum Male. PIN=1234"`** — visible to anyone opening the profile, PIN included. Rewritten as a normal bio. Old values in `/tmp/demo706_backup.txt`.

⚠️ **The account MUST stay `userStatus=APPROVED`.** `/user/login` returns **403 with no token** for PENDING/REJECTED (see section 11), so handing over a fresh signup means the reviewer cannot get past the login screen. Login is mobile + PIN with **no OTP**, so an overseas reviewer needs no SMS — worth stating in the Play Console notes.

⚠️ **`6379829750` was user 195's number, and 195 was deleted.** It was reassigned at the client's explicit instruction, which forecloses restoring 195 under its original number. `users.mobile` has **no unique index** and `UserRepository.findByMobile` returns a single `UserEntity` (not a List), so if 195 is ever restored from the binlog with this number, `findByMobile` throws `IncorrectResultSizeDataAccessException` and **login breaks for the number entirely** — same bug class as `findBetweenUsers`. A restore must renumber first.

🔴 **Unresolved before submission — test data visible to the reviewer:** 58 approved profiles have an About of `"Test account… PIN=1234"`, and 40 names repeat ~15× each (fifteen "Sangeetha Kannan", etc.). For a matrimony app that reads as fake-profile padding under Google's Deceptive Behavior policy. Recommended fix is to blank those bios and drop the `Vann*`/`*Test*` accounts out of APPROVED so they leave search, keeping the realistic-name pool so the feed stays populated.

### 2026-08-18 (later) — New `PAYMENT_MODE=INFO`: feature comparison without prices or buy CTAs
**Why:** `CONTACT` mode hides the UPI/QR checkout, which removes the blatant violation, but the app still showed real prices (₹499–₹9,999) next to a "Continue with this plan" button that funnels into a phone call. Google Play does not only ban off-platform checkout — it bans **leading users toward** a payment method other than Play Billing for digital content, and paid tiers here unlock in-app features (contact reveal, unlimited messaging, advanced search), which is digital content. Price + "call us to buy" is that funnel.

**`PAYMENT_MODE` is now a three-value flag** (`utils/upgradeNavigation.ts` exports the `PaymentMode` type — use it rather than re-declaring the union, which is how `PaymentScreen`/`AddOnPaymentScreen` drifted before):
- `QR` — self-serve UPI/QR checkout.
- `CONTACT` — prices shown, routed to the RM callback form. Payment off-app, admin activates.
- `INFO` ⭐ NEW — plan **features** shown; **no amount and no purchase CTA anywhere**. Routes exactly like CONTACT; only the rendering differs. **Nothing about the admin-activates-the-plan workflow changes.**

Suppressed in INFO across every surface a reviewer can reach: `PremiumTab` (price block → duration only, CTA → "Contact us to learn about membership", trust line → "Verified profiles · Manual verification"), `UpgradePlanScreen` (picker prices + the price passed to the RM view), `RelationshipManagerView` (new `infoOnly` prop hides the amount; plan name and period stay), `PaymentScreen` and `AddOnPaymentScreen` (both render the RM view instead of QR).

⚠️ **The last price leak was not on a payment screen at all** — `(tabs)/profile.tsx`'s Boost banner rendered a `₹149` chip and a `popup.confirm('Buy an extra boost for ₹149?')` straight from the profile page, outside `AddOnPaymentScreen` entirely. A sweep for `₹` across `app/` and `components/` is what found it; grepping only the payment screens would have missed it. In INFO the chip reads "Info" and the confirm becomes an informational popup with no purchase route. **If another add-on is ever sold, sweep for `₹` again — the buy CTA will not necessarily live in a screen with "Payment" in its name.**

⚠️ `PremiumTab`'s `infoOnly` state is declared **with the other top-level hooks**, above that component's four early returns — see the section 17 landmine; a hook added after them throws the moment a branch flips.

**Flip it with:** `UPDATE keyValue SET valueColumn = '{"mode":"INFO"}' WHERE keyColumn = 'PAYMENT_MODE';` — takes effect within 5 minutes (cache TTL) or immediately on next cold start, no rebuild. `CONTACT` and `QR` remain fully working and are a single flip away.

**Verification:** `npx tsc --noEmit` 57, unchanged baseline, zero errors in any of the six touched files.

### 2026-08-18 (later) — Dropped `RECORD_AUDIO` + `SYSTEM_ALERT_WINDOW` (Play Store)
Both were declared in **our own** `AndroidManifest.xml` (not merged in from a library) and neither is used: there is no audio recording anywhere in the app, and VOICE_CALL is a request-a-callback CTA fulfilled by the relationship manager, not in-app calling. Play requires a justification for microphone and draw-over-other-apps access, and an unused sensitive permission is a rejection you get for free. Removed from the manifest and from `app.json`'s `android.permissions` (otherwise a `prebuild` would put `RECORD_AUDIO` straight back). `MODIFY_AUDIO_SETTINGS` was left — it is a normal, unscrutinised permission and `expo-av` may rely on it for playback.

⚠️ **If real in-app voice calling is ever built, `RECORD_AUDIO` returns — and section 4 of the web privacy policy must be updated in the same change**, or the Data safety form and the policy fall out of sync (see `VaibhavVivaahaWeb/CLAUDE.md`, same date). Needs a rebuild; manifest changes do not hot-reload. Backup at `/tmp/AndroidManifest.xml.bak`.

### 2026-08-18 — Promo popup + update prompt switched OFF in production (no app change)
Both are keyValue-driven, so this was a pure DB flip — **no rebuild, effective on the next app launch** (neither component caches; each fetches `getKeyValueByKey` on mount). Previous values saved to `/tmp/popup_backup_20260818.txt`.
- **`promotionalPopupBanner`** → `"enabled": false`. Every other field left intact, so re-enabling is a one-word flip. ⚠️ Its `imageUrl` still points at a **Chennai Super Kings placeholder** and its `buttonAction` was already fixed to `/(root)/screens/PremiumTab` — replace the image before ever turning this back on.
- **`APP_VERSION`** → `latestVersion` and `minimumVersion` **removed**. `ForceUpdateGate` only prompts when one of those is present (`!!parsed.latestVersion`), so their absence is the clean off switch; `iosUrl`/`androidUrl`/`message` are kept so re-enabling means adding one field back. It was firing on every launch because the row advertised `1.0.1` while `app.json` is `1.0.0`. ⚠️ `iosUrl` is still the `id0000000000` placeholder — fix it before re-enabling, or iOS users get sent to a dead App Store page.

### 2026-08-14 — Help & Support redesigned onto the app system; its form was a fake submit
`HelpSupportPage.tsx` already read `SUPPORT_CONTENT`, but visually it predated the blue/ink system entirely — flat white page, a harsh `#F43F5E` "Support Hours" block, `#DADADA`-on-red button text (the same low-contrast bug fixed on the auth screens), and a nested `NativeBaseProvider` (the root already has one). Rebuilt on the shared system: page gradient, 20-radius white cards with the blue-tinted shadow + `#e7edf5` hairline, uppercase 11px section labels, navy `['#1c2b3f','#25384f']` hours banner (same card language as the auth screens' step banner), 52px gradient pill CTA, focus ring on the textarea. Stack title set to "Help & Support" — the screen keeps the shared header, which was rendering blank.

**🔴 The "Send us a message" form never sent anything.** `handleSubmit` only did `setSubmitted(true)` and cleared itself after 3s — no API call at all, so every member who used it believed support had their message. It now creates a real ticket via `userApi.createSupportTicket`, the same endpoint `SupportFAB` uses, with `res.data.code === 200` checked explicitly (§17 landmine). Category ids are the **uppercase ids SupportFAB already uses** (`TECHNICAL`/`ACCOUNT`/`PAYMENT`/`SAFETY`/`OTHER`, plus `MATCHING`) rather than the screen's old lowercase set — `SupportTicket.category` is a free-text String and the admin panel prints it raw, so two vocabularies would have shown up as two category systems in the same admin list.

**Contact cards are now tappable** (`tel:` / `wa.me` / `mailto:`) instead of text you had to retype. The "Live Chat" card was dropped — live chat is `SupportFAB`, which is mounted only on `settingsPage.tsx` and therefore *not* on this screen, so the card advertised something unreachable from where it stood; WhatsApp replaces it. The bundled fallback phone was `+91 90000 00000` — an unreachable dummy — now the real line (`+91 79045 47565`, same number `RelationshipManagerView` falls back to).

`SUPPORT_CONTENT` gained optional `whatsapp`, `whatsappNote`, `hoursNote` and `quickHelp[]` (Quick Help was hardcoded JSX before). Merge is per-field over the bundled copy, so **a partially-filled row can't blank a field**, and the legacy `chatNote` key maps onto `whatsappNote` so the already-seeded production row renders correctly unedited. New `VaibhavVivaahaBackend/seed-support-content-v2.sql` (DELETE-then-INSERT, keyColumn has no unique index) seeds the extended payload — optional, no backend deploy either way.

⚠️ Dropped the `TouchableWithoutFeedback` wrapper that used to wrap the whole ScrollView for keyboard-dismiss; `keyboardShouldPersistTaps="handled"` does the same thing without a full-bleed touch layer over the page (same class as the stranded-backdrop and duplicate-`GestureHandlerRootView` bugs in §17).

**Verification:** `npx tsc --noEmit` 58 (baseline 58), no errors in the touched file; seed JSON parsed to confirm the MySQL `''` escaping is valid.

### 2026-08-13 — 🔴 Permissions filter menu left an invisible backdrop that ate every tap
Client repro: open the Permissions filter, tick some options, switch to a **sub-tab** (Sent By You / Received) — the menu stayed open; switch the **footer** tab — it closed; return to Permissions — **nothing was tappable at all.**

`react-native-popup-menu`'s `<Menu>` tracks its open state internally, independent of React, and it was driven through a ref. Two consequences:
1. The existing close-on-blur only fires on a **bottom-nav** change. Switching the inner `TabView` sub-tab doesn't blur the screen, so the menu survived onto the other tab.
2. Force-closing through the ref while the tab was inactive left the provider's **backdrop mounted** — a full-screen invisible layer that swallowed every touch. That's the dead tab, and it's the same class of bug as the duplicate `GestureHandlerRootView` in section 17: an invisible full-bleed view intercepting input.

**Making the Menu `opened`-controlled was tried first and did NOT fix it** — the stranded layer is `MenuProvider`'s backdrop, not the `<Menu>`'s, so no amount of open/close state on the menu removes it. `MenuProvider` was mounted **inside `RequestsTab`**, i.e. inside a `TabView` scene that stays mounted, so its backdrop lived and persisted there.

Fixed by **dropping `react-native-popup-menu` from this screen entirely**: the filter is now a plain trigger + RN `<Modal>` (same 3 checkboxes, same `handlePrintSelected` wiring). A `Modal` with `visible={false}` unmounts outright and physically cannot strand a touch layer. `MenuProvider` and the whole popup-menu import were removed from `mailBox.tsx`.

**Same screen, separate bug: unchecking every filter still showed the first-checked one.** Each checkbox called `handlePrintSelected({ mobileNumber: val })`, and that helper read the OTHER two values out of the **render closure** — so a toggle could compute against a stale value and leave the first-selected filter applied after everything was unticked. Replaced with a `useEffect` **derived** from all three checkbox states (plus `wholeReceivedData`): an effect keyed on all of them cannot read a stale value, and as a bonus it now re-applies the active filter when the list refetches, which the imperative form silently dropped. `handlePrintSelected` is gone. **Derive list filtering from state; don't push it imperatively from each control's onChange.**

⚠️ **`chatscreen.tsx`, `ProfileDetail.tsx` and `listchats.js` still mount their own `MenuProvider`** and carry the same latent risk — they haven't shown it because they're stack screens that unmount, not persistent tab scenes. If a stuck/untappable screen is ever reported on one of them, this is the first thing to check.

### 2026-08-13 — Gallery id was `galleryId`, not `id`; Change PIN rebuilt properly
**🔴 `img.id` is undefined — `GalleryEntity`'s primary key is `galleryId`.** `/gallery/getAllImagesByUserId` returns the raw entities with no remapping, so every call built a URL like `/gallery/setAsProfileImage/NzA0/undefined` → 400. **The long-press delete had the same bug already** and had been silently calling `changeImageActiveStatus/undefined`. Centralised as `galleryIdOf(img) = img.galleryId ?? img.id` so the two can't drift apart again.

⚠️ **`letterSpacing` on a `TextInput` applies to the PLACEHOLDER too, not just the value.** The PIN fields use `letterSpacing: 8` to space the digits, which stretched "Enter 4-digit PIN" past the pill's width. Fixed by shortening the hints to "Enter PIN" / "Re-enter PIN" **and** making the tracking conditional (`letterSpacing: newPin.length ? 8 : 0`) so the placeholder renders at normal width. Same trap applies to any OTP/PIN input. The page content is also centred now (`alignItems: 'center'` on the container, `width: '100%'` on each field/label/CTA so they don't shrink to content, `alignSelf: 'flex-start'` to keep the back pill left).

**Settings "Change PIN" rebuilt, not patched.** The earlier pass converted the inputs and the header medallion but left the rest of the legacy theme in place — a "sacred divider", four corner-frame decorations, "divine energy patterns", and an elevation-24 card, none of which exist on the auth screens. Rewrote the layout to match `ChangePinScreen` exactly (back pill → 68px logo tile → 26px left-aligned heading + 13px slate subtitle → uppercase 11px labels → 52px white pill inputs with focus ring → 54px gradient CTA). **565 → 269 lines; every piece of logic — `handleSavePin`, `userApi.changePin`, the `resetPhoneNumber` lookup, `isFormValid`, `pinsMatch` — is byte-identical.** Also fixed the CTA label, which was `#DADADA` on a blue gradient — the same low-contrast bug already fixed on the five pre-login screens.

### 2026-08-17 — Age default fixed; dosham normalised on production (both 2026-08-15 flags closed)
**🔴 Age default fixed** — `gatherSearchData`'s untouched-slider fallback in `SearchTabs.tsx` changed `['28','32']` → `['18','60']`, so an untouched age slider now means "no age preference" instead of silently returning only 28–32-year-olds. One-line change; tsc 57 unchanged.

**Dosham normalisation EXECUTED on production** (backup `_bak_user_details_dosham_20260817`, 553 rows) — the client confirmed Kuja = Chevvai/Manglik, which unblocked the whole DATA decision flagged 2026-08-13/15. Mapping applied to `user_details.astroInfo[0].dosham` via `JSON_REPLACE` (verified first: all 609 astroInfo arrays have exactly 1 element, dosham never beyond `$[0]`): `None`×447 → `No Dosham`, `Manglik (Chevvai Dosham)`×55 + `Kuja Dosham`×50 → `Chevvai Dosham`, `Raghu & Kethu`×1 → `Sarpa Dosham` (Rahu–Ketu dosham is traditionally Sarpa dosham — judgement call, flagged to client). Post-state: every stored value matches the `dosham` keyValue dropdown exactly (`No Dosham` 450, `Chevvai Dosham` 105, `Rahu Dosham` 50, `Kethu Dosham` 3, `Sarpa Dosham` 1). Verified live: "No Dosham" search finds 80 profiles in the base scope (was 3). `verify-search.py`'s dosham cases updated from the now-nonexistent `"None"` to `"No Dosham"` (fixed suite, `--real` contract, and pair generators); 19/19 pass. **Education dropdown mismatch deliberately NOT fixed** — client says current education data is test/static; real user data will be imported later and the vocabulary decided against it then. Push-token purge likewise deferred to the same cleanup.

### 2026-08-17 — Support robot → R2; payment QR now DB-swappable
`SupportFAB`'s three `require('supportrobot.png')` call sites now load from the R2 CDN (`SUPPORT_ROBOT` constant) — decorative, rarely seen, harmless failure mode. **Core chrome deliberately stays bundled** (login logo, default avatars, chat background, splash — the splash/notification icons are baked native resources and *cannot* be remote).

`PaymentScreen`'s QR image now resolves from a new **`PAYMENT_QR` keyValue row** (`{"imageUrl": ...}`, seeded in production pointing at R2) so admin can swap the UPI QR without an app release. Bundled `payment_qr.png` remains the fallback: used when the row is absent AND on remote load error (`onError` → `qrLoadFailed`) — the payment screen is the one place an image must never silently fail. ⚠️ The QR fetch is **appended last** in the mount `Promise.all` — inserting it mid-array once shifted `[modeRes, contactRes]` and silently broke admin-contact loading; extra elements beyond the destructure are ignored, middle insertions are not. Also removed a pre-existing duplicate `fontFamily` key in `upiIdText` (tsc 58 → 57).

### 2026-08-15 — 🔴 EXPIRED members kept passing every plan gate; star spellings normalised; Trial plan seeded
**🔴 `findTopByUserIdOrderByCreatedAtDesc` had no status filter** — "latest subscription row regardless of status" — and it is the plan gate for **14 call sites** (contact reveal, voice call, subcaste search in `filterUsers`, interest quotas, ID/education/income verifications, push gating, profile-view limits…). The nightly scheduler only flips `status` to EXPIRED; the row stays newest, so an **expired member kept passing all of those gates until they bought a new plan**. Verified live: **10 production members** currently have a non-ACTIVE latest row and were being treated as subscribed. Fixed with the `findBetweenUsers` pattern: the finder is now a **default method** returning the latest ACTIVE row whose `endDate` hasn't passed (NULL endDate = lifetime; the endDate check also covers the hours between expiry and the 00:00 scheduler run). Same name/signature — no caller changed. The same-named finder on `PaymentRequestRepository` is a different repository, audited and untouched.

**Star spelling normalisation EXECUTED on production** (backup `_bak_user_details_astro_20260815`, 609 rows): 201 rows converted (`Karthigai→Krithikai`, `Mirugashirisham→Mirugasiridham`, `Punarpoosam→Punarpusam`, `Thiruvadhirai→Thiruvathirai`, `Maham→Magam`). Verified: every stored star now resolves via `getStarId` and star search finds the previously-invisible ~250 profiles. This fixed **both** star search and Star Match (`getStarId` returns 0 on unknown names, poisoning the porutham tables). Annual income was normalised the same way earlier (backup `_bak_user_details_income_20260814`): bracket labels → numeric lower bounds; the format-aware backend expression stays as belt-and-braces. **Dosham is still undecided/unfixed** (`None` ×447 vs dropdown "No Dosham"; `Kuja Dosham` unmapped — note Kuja = Chevvai/Manglik, so mapping needs the client's confirmation).

**Trial campaign pack seeded in production** (for the broker-profile calling campaign: ~1,000 Mudaliar + 500 Vanniyar). Plan `Trial`, `isActive='N'` — invisible in the catalog and unpurchasable (verified live: `getAllActivePlans` returns Free/Silver/Gold/Platinum only) but holders get full entitlements, same mechanism as grandfathered retired plans. Features = Silver's 23 minus `REQ_UNLIMITED`/`SECURE_CONNECT`, plus `REQ_LIMITED 25`; overrides `VIEW_PERSONAL_INFO=5` and `SEND_REQUEST=25` per `PLAN_DURATION`; `MESSAGE` unlimited (conversations require mutual acceptance, can't be farmed — deliberately uncapped as the retention hook). Granting = `user_subscriptions` insert with the Trial plan id and a cohort tag in `paymentReference` (`TRIAL-MUDALIAR-2026-08`); expiry/Free-fallback machinery handles the rest untouched. ⚠️ Cosmetic: `VVMWelcomeHeader.resolveTier` only knows the six named tiers, so a Trial member's home-header chip may read "Free" (profile page shows "Trial" correctly); gating unaffected. VOICE_CALL left IN the pack — one DELETE removes it if the RM queue gets swamped.

### 2026-08-15 — Search verification harness + two MORE dropdown/data mismatches (education, star)
**`VaibhavVivaahaBackend/verify-search.py`** — proves `/user/filterUsers` returns the right rows by evaluating every combination twice: once through the live API, once against an in-memory snapshot of the DB built from the **filter contract** (deliberately NOT copied from `UserRepository`, so a query bug can't hide by agreeing with itself). Modes: fixed 19-case suite (~20s) · `--all` singles+pairs (120) · `--deep` +triples (575) · `--sample N` seeded random · **`--real` enumerates the app's actual contract** — always-on gender/casteId/age, income present-or-absent, 5 multi-select fields each in {absent, single, multiple}, photo/horoscope Y/N = **3⁵×2×2×2 = 1,944 combinations**. 40-random smoke of `--real`: all pass. Contracts learned the hard way (each initially looked like an API bug and wasn't): profiles with **no `user_details` row** are excluded (inner join); **NULL dob fails any age filter** (SQL NULL semantics); the server 403s the default `Python-urllib` User-Agent. ⚠️ v1 spawned one remote `mysql` per case — 575 cases took 3 hours and the DB started refusing connections; the single-snapshot rewrite fixed it. Each case still makes one real API call to production.

**🔴 Age default is 28–32, not 18–60.** `gatherSearchData` falls back to `['28','32']` when the user never touches the age slider — so an untouched search silently returns only 28–32-year-olds. Not fixed yet; flagged.

**🔴 Education search can reach only 9 of ~600 profiles.** The search chips come from the `education` keyValue row (`UG, PG, DOCTOR, ENGINEER, TEACHER/PROFESSOR, LAWYER, OTHERS`) but `user_details.degree` stores degree names (`B.Tech` 98, `M.Sc` 92, `M.Tech` 70, `MCA` 68, `MBA` 67, `B.Sc` 66, `B.Com` 62, `B.E` 60…). Only `UG` (2) and `PG` (7) intersect — picking "ENGINEER" matches zero despite 158 B.Tech/B.E profiles.

**🔴 The star spelling drift also corrupts STAR MATCH, not just search.** `PoruthamService.getStarId` resolves a star name against the `star` keyValue list (dropdown spellings) and **returns 0 when not found** — star ids are 1–27, so 0 poisons every downstream table lookup. Members whose stored `astroInfo` star uses a divergent spelling (`Karthigai`, `Mirugashirisham`, `Punarpoosam`, `Thiruvadhirai`, `Maham` — ~250 profiles) get failed or garbage porutham scores. **One data normalisation fixes search AND star match.** (Separately: the July porutham-accuracy audit items look substantially fixed now — NADI uses the correct mirrored 6-star cycle and Stree Dirga uses the traditional ≥13 threshold.)

**🔴 20 of 27 star dropdown values match nothing.** Spelling drift between the `star` keyValue list and `astroInfo` (`Krithikai` vs stored `Karthigai`, `Mirugasiridham` vs `Mirugashirisham`, `Punarpusam` vs `Punarpoosam`, `Thiruvathirai` vs `Thiruvadhirai`…). Only 7 dropdown stars return results. Same disease as dosham — all three (dosham/education/star) need one **DATA decision**: normalise stored values or rewrite the keyValue lists.

### 2026-08-13 — 🔴 Annual-income search matched NOBODY; dosham dropdown doesn't match stored data
Two search filters found broken while verifying a client test case against live production.

**🔴 Income filter never returned a single profile.** `user_details.annualIncome` is a `varchar` holding **bracket labels** — `2-3L`, `7-10L`, `20L+` — for **608 of 609 rows** (one legacy row holds a raw `1800000`). The filter did `CAST(ud.annualIncome AS UNSIGNED)`, which stops at the first non-digit: `7-10L` → **7**, `20L+` → **20**. So a search for ₹3L–₹10L compared `7 BETWEEN 300000 AND 1000000` and excluded everyone. Verified live: **0 results before, 210 after.**

Fixed in `UserRepository` (3 occurrences, both filter queries) with a format-aware expression that keeps the labels intact rather than migrating the data — the app displays those labels, and `profile.tsx`'s `formatAnnualIncome` already depends on them:
```
CASE WHEN ud.annualIncome REGEXP '^[0-9]+$' THEN CAST(ud.annualIncome AS UNSIGNED)
     ELSE CAST(REGEXP_SUBSTR(ud.annualIncome,'^[0-9]+') AS UNSIGNED) * 100000 END
```
Maps `7-10L`→700000, `20L+`→2000000, `1800000`→1800000. ⚠️ It takes the bracket's LOWER bound, so `7-10L` matches a search whose range includes 700000 — the sensible reading of "earns 7–10 lakh".

**🔴 Dosham dropdown values don't exist in the data.** The `dosham` keyValue list offers `No Dosham / Chevvai Dosham / Rahu Dosham / Kethu Dosham / Sarpa Dosham / …`, but `user_details.astroInfo[0].dosham` stores `None` (447), `Manglik (Chevvai Dosham)` (55), `Rahu Dosham` (50), `Kuja Dosham` (50), `No Dosham` (**3**). So picking "No Dosham" matches 3 profiles out of 505 while the 447 that genuinely have none are stored as `None`, and `Kuja Dosham` isn't offered at all. **Not fixed — this is a DATA decision** (normalise `astroInfo` values, or rewrite the keyValue list to the stored labels); flagging rather than guessing which way the client wants it.

**Not bugs, worth knowing:** `profileImageStatus='N'` and `profilesWithHoroscope='N'` mean **"no filter"**, not "without photo/horoscope" — the query only narrows on `'Y'`. And `age` filtering uses `TIMESTAMPDIFF(YEAR, u.dob, CURDATE())`, not the `users.age` varchar column, so a stale `age` value never affects search.

### 2026-08-13 — Connection-flow audit after the interest bug: follow/unfollow had the same trap
Audited every pair-based table for the "single-result finder over a pair that can legitimately have more than one row" shape. Findings from live production:

| table | UNIQUE constraint | duplicates today | verdict |
|---|---|---|---|
| `conversations` | ✅ (user_one_id, user_two_id) — and **all rows normalised**, `user_one_id < user_two_id`, 0 exceptions | 0 | safe |
| `interestRequest` | ✅ (interestSend, interestReceived) — but the REVERSE pair is a second legal row | 1 pair | the bug fixed below |
| `user_connections` | ❌ none | 0 | 🔴 latent, fixed |
| `shortlisted_profiles` | ❌ none | 0 | guarded by check-then-act |
| `userLikes` | ❌ none | 0 | no single-result finder |
| `blockedUsers` | ❌ none | 0 | no single-result finder |

**🔴 `followUser` inserted unconditionally** — no existence check, and `user_connections` has no unique constraint. Two taps on Follow created two rows, after which `findByFollowerIdAndFollowingId` (an `Optional` finder) threw `IncorrectResultSizeDataAccessException` and **unfollow failed with a 500 permanently** — the member could never undo the follow. Fixed on both ends: `followUser` now returns a no-op success if the pair already exists (a repeat follow already satisfies the caller's intent; erroring would be worse UX), and `unfollowUser` uses a new `findAllByFollowerIdAndFollowingId` + `deleteAll`, which also self-heals any pair that already accumulated duplicates.

Note the connection finders are **directional** `(follower, following)` — unlike `findBetweenUsers` they don't OR both directions, so they only break on a true duplicate row, not on a legitimate reverse pair. That's why this was latent rather than already failing.

💡 The three tables with no unique constraint are protected only by application-level check-then-act, which a double-tap or retry can race. Adding `UNIQUE(followerId, followingId)`, `UNIQUE(shortlistedBy, shortlistedUserId)` and `UNIQUE(likedBy, likedTo)` would make it structural — worth doing with the next hand-applied index batch.

### 2026-08-13 — 🔴 Profile Detail blank: `findBetweenUsers` blew up when BOTH members had sent interest
Client repro (Silver 702 → Platinum 707): send interest, cancel it, get an interest back from the other member, cancel the connection — after that the profile simply would not open. Reproduced against live production:

```
GET /user/getProfileDetailWithIntractionStatus/NzAy/707
→ code 500 "Query did not return a unique result: 2 results were returned"
```

`interestRequest` has a unique constraint on **(interestSend, interestReceived)**, so A→B and B→A are two separate rows and both can legitimately exist. Production had exactly that:

```
id=16  702 → 707  REJECTED
id=17  707 → 702  PENDING
```

`findBetweenUsers` matched either direction but was declared `Optional<InterestRequest>`, so Spring threw `IncorrectResultSizeDataAccessException`. The app's `response?.data?.data` was then undefined and the screen rendered blank with no error — the same invisible-failure shape as the chat-list 500.

**Five features gate on this method**, so the pair also lost contact reveal, horoscope view, voice-call requests and star match — not just the profile screen: `UserService` (reveal contact, horoscope, profile detail), `ServiceRequestService` (voice call), `PoruthamService` (star match).

Fixed by splitting it: `findAllBetweenUsers(...)` returns a `List` ordered `updatedAt DESC, id DESC`, and `findBetweenUsers` is now a **default method** that picks an APPROVED row if one exists (if the two are connected, that is the state every caller cares about) and otherwise the most recent. Same name and signature, so no caller changed. ⚠️ **Never declare a two-sided "between users" query as returning a single result** — the reverse-direction row is not a data error, it is normal.

### 2026-08-13 — Saved search dropped Subcaste: the backend controller has a filterKey WHITELIST
The app-side round-trip for saved subcaste was fixed earlier today, but it still didn't persist — because `SaveSearchController.createOrUpdateSavedSearch` maps the incoming `filters` array through a **`switch (key)` whitelist** (`Age`, `Annual Income`, `Dosham`, `Star`, `Education`, `Job Sector`, `profileImageStatus1`, `profilesWithHoroscope`). Anything without a `case` falls through and is **silently discarded** — no error, no log, and the save still returns 200. So the client sent `filterKey: 'Subcaste'` correctly and the backend threw it away.

Added `case "Subcaste"` → `filterMap.put("subcaste", value)`. Lowercase key because `handleUseSearch` does `filter.filterKey.toLowerCase()` before switching. Full round trip verified: app sends `['Gounder / Naicker']` → controller maps to `subcaste` → `buildFiltersFromRequest` joins the list to CSV → restore splits on `,` back into the chip selection.

⚠️ **This switch is the thing to update whenever a new search filter is added on the client.** A missing case is invisible at every layer.

**Production DB needed nothing** — verified live: the subcaste row exists (`Gounder / Naicker`, id 2, VANNIYAR), `SUBCASTE_SEARCH` is seeded (feature id 35), and `planFeatures` grants it to Silver/Gold/Platinum as `enabled`. Backend **deploy** is what's required.

### 2026-08-13 — Chat keyboard on Android: measure the container, don't assume adjustResize
Five passes on this. The decisive clue came from the client: **it works in Expo Go but not in the `./gradlew assembleRelease` APK.** Expo Go runs with its own manifest and target SDK; this app is built `edgeToEdgeEnabled=true` + `targetSdk 35`, and under edge-to-edge Android stops reliably honouring `windowSoftInputMode="adjustResize"` — so the two environments genuinely behave differently and no fixed assumption works for both.

Both assumptions were tried on device and both failed: assume adjustResize does NOT apply → input parked ~2 keyboard-heights up; assume it DOES → input behind the keyboard. Detecting it via `useWindowDimensions` was also tried and does **not** work — the reported window height doesn't reflect the resize under edge-to-edge.

**What works:** measure the chat container itself with `onLayout` and compare against its keyboard-closed baseline (>100px guard so a status-/nav-bar shift isn't mistaken for a keyboard). If the container genuinely shrank, the OS made room and no padding is added; if it didn't, apply the **full `keyboardHeight`**. No feedback loop: the padding is applied *inside* that container, so it never changes the measured frame.

⚠️ **Do not subtract `insets.bottom` from that padding.** It was tried and left only a sliver of the input visible: the subtraction assumes the SafeAreaView is still reserving the nav-bar strip, but with the keyboard up that strip sits behind the keyboard and reserves nothing, so it ate ~48px — almost exactly the height of the input bar.

⚠️ **None of this works without the `flex: 1` on the messages FlatList.** An unbounded list overflows the container and pushes the input off-screen regardless of any padding here. That was the ORIGINAL bug and it is the load-bearing fix; don't remove it while tuning the maths.

A `console.log('[chat-kb]', …)` in the keyboard-show listener prints keyboardHeight / containerHeight / baseline / shrank / insetBottom. `console` is not stripped in this project's release builds (no `transform-remove-console` in `babel.config.js`), so `adb logcat | grep chat-kb` works on a real APK — that is the only way to settle this class of bug on a specific device. Left in deliberately.

**Not installed:** `react-native-keyboard-controller` (Expo SDK 54 pins 1.18.5) is the sanctioned edge-to-edge answer if this ever regresses, but the measurement approach fixed it with no new native dependency.

### 2026-08-13 — Upload feedback: spinner was in the wrong place; primary slot looked like a gallery slot
Client report: adding a gallery photo showed **no loader at all**, and the first "+" tile silently replaced their profile photo instead of adding to the gallery. Two separate causes:
- **The spinner rendered only INSIDE the top avatar**, but `imageUploading` was set by the **gallery** handler too — so adding a gallery photo drew a spinner on the profile picture, which is both the wrong element and completely invisible once the member has scrolled down to the gallery. Replaced with a **centred `Modal` overlay** at the root (`uploadingLabel` state: "Updating profile photo" / "Uploading photo" / "Uploading horoscope"), visible wherever the screen is scrolled. The gallery handler no longer touches `imageUploading` at all, so the avatar spinner now means only "the profile photo is changing".
- **The first tile in that row is the PROFILE slot, not a gallery slot** — it calls `handlePickImage`. It was rendered as an identical dashed "+" square next to the two gallery "+" squares, so tapping it replaced the profile photo when the member meant to add a photo. Now visually distinct: amber border/fill, `account-circle` icon, and the label reads "Profile photo" rather than "Profile". **An identical control for a different action is what caused this — keep the two treatments distinct.**

### 2026-08-13 — FAQ page redesigned onto the app theme
`FAQPage` was on a flat white background with grey cards, unrelated to the blue/ink system everywhere else. Rebuilt on it: the standard `['#d0dfeb'…'#f3f7fa']` gradient + `SafeAreaView edges={['top']}`, 26px `Rubik-Bold` heading, the auth screens' 52px white search pill with the same `#1F7FE5` focus ring (plus a clear-X once text is entered), and white cards at radius 20 with a hairline border and blue-tinted shadow — matching the permission cards restyled earlier the same day.

Each of the 6 categories now has its own icon + tint (`CATEGORY_META`), used consistently in the card's icon chip, the uppercase category tag, the open-state chevron and the accent bar beside the expanded answer, so a card reads as belonging to a topic at a glance.

**`categories` was already being computed and never rendered** — the list was search-only, which is poor for browsing 12 answers across 6 topics. It now drives a horizontal filter-chip row (All + one per category), combined with the existing search via `visibleFAQs`. Added a "Still need help?" card at the end routing to `HelpSupportPage`.

Also swapped `useNavigation()` (react-navigation) for `router.back()` from expo-router, matching the rest of the app; the import was otherwise unused after the header rebuild.

### 2026-08-13 — FAQ / Terms content made DB-editable (no backend deploy)
**Built on the existing `keyValue` table rather than a new `content` table with its own CRUD.** The generic `GET /keyValue/getKeyValueByKey/{key}` endpoint already exists, so this needs **no backend code and no deploy** — just a seeded row — and the admin panel's Configuration page already edits keyValue rows, so there's no new admin screen either. Same pattern as `PAYMENT_MODE` / `QUICK_ACCESS_MENU` / `promotionalPopupBanner`.

New **`utils/useRemoteContent.ts`**: optimistic cache read → keyValue fetch → 6h AsyncStorage cache (`remoteContent_*`), with the **bundled copy as the fallback**. It rejects empty/unparseable payloads rather than accepting them — an empty array would blank a legal or help page, which is strictly worse than slightly stale wording.
- **`FAQPage`** — the hardcoded array was hoisted to module scope as `FALLBACK_FAQ` and the screen now reads `useRemoteContent<FAQItem[]>('FAQ_CONTENT', FALLBACK_FAQ)`. All 13 entries / 6 categories preserved verbatim.
- **`TermsPage`** — its sections are inline JSX carrying React icon components, not data. Rather than mechanically rewriting legal text into an array (easy to mangle), the bundled JSX is left **completely untouched** and only renders remote sections when a `TERMS_CONTENT` row actually exists. ⚠️ Because it's all-or-nothing, **seeding a partial `TERMS_CONTENT` publishes a truncated legal page** — seed the complete terms or leave the row absent.
- `HelpSupportPage` was left alone: it's contact details, which already come from the `ADMIN_CONTACT` keyValue row.

### 2026-08-13 — Permission "sent" cards: two enum bugs behind the unfinished look
Reported as "make the sent cards classy" — two of the three problems were functional:
- **`getRequestBadgeColor` switched on display labels** (`'Horoscope'`) while being called with `request.fieldType` (`'HOROSCOPE'`), so **every badge fell through to the grey default** — while `getRequestIcon` right beside it switched on the enum correctly, leaving a coloured icon sitting in a grey pill. Keyed on the enum now (and case-tolerant).
- **The status read "APPROVED"/"REJECTED" in SCREAMING_CASE.** `charAt(0).toUpperCase() + slice(1)` is a no-op on an already-uppercase enum. Added `getStatusLabel()` → Approved / Declined / Pending.
- Visual: card radius 16→20, blue-tinted shadow + hairline border (matching the app's other cards rather than a neutral black drop on the light gradient), tighter badge pill, and **`#007AFF` → `#1F7FE5` in 4 places** — that's the iOS system blue, not the app accent.

**Boost RM view showed two stacked headers.** `RelationshipManagerView` draws its own "Premium Assistance" header, and `PaymentScreen` avoids the clash by being registered `HEADERLESS` in `screens/_layout.tsx` — but `AddOnPaymentScreen` is not, because its QR path still wants a titled header. Now hides the stack header in the CONTACT branch (and during LOADING, since CONTACT is the shipped default and the header would otherwise flash in and straight back out). Verified `RelationshipManagerView` has its own back button, so hiding the header doesn't strand the member.

### 2026-08-13 — Image uploads hit nginx 413; Profile Boost was an ungated payment surface
**🔴 Uploads failed with a raw nginx `413 Request Entity Too Large`.** Surfaced immediately after the MIME fix below started letting requests actually reach the server. `launchImageLibraryAsync({ quality: 1 })` hands over the camera original (4000px, 5–12MB) and nothing downscaled it, while nginx's default `client_max_body_size` is **1MB**. Added `prepareImageForUpload()` to `utils/uploadFile.ts` — resize to 1600px, JPEG quality 0.7, landing ~150–400KB, still far more resolution than any avatar or gallery tile renders at. Used by all three upload paths. ⚠️ `manipulateAsync` is deprecated in expo-image-manipulator 14 in favour of `useImageManipulator`, but **that replacement is a React hook and cannot be called from an event handler** — the deprecated function is the correct choice here, don't "fix" it. Falls back to the uncompressed asset if manipulation throws.
- **The error was also unreadable.** nginx returns an HTML page, not JSON, so `res.data.message` yielded markup and the console dumped the whole document. `axiosClient` now rewrites a 413 into a proper `{code, status, message}` shape and logs it compactly.
- **And it was unreachable.** axios rejects on 4xx, so a 413 lands in `catch`, not the `code === 200` branch — every upload handler's catch said a generic "Failed to upload", hiding the one actionable fact. All three now surface `e.response.data.message`.
- 💡 Worth raising `client_max_body_size` to ~10M on the server anyway as a backstop.

**🔴 Profile Boost bypassed the Play Store payment gating entirely.** `PaymentScreen` has honoured `PAYMENT_MODE` since 2026-05-06, but `AddOnPaymentScreen` — the Profile Boost purchase — showed the QR/UPI flow **unconditionally**, which is exactly the off-platform-payment surface that flag exists to hide. Now resolves the mode on mount and early-returns `RelationshipManagerView` in CONTACT mode, matching PaymentScreen. `resolvePaymentMode()` was module-private in `upgradeNavigation.ts` and is now exported. **Audited every screen rendering QR/UPI markup — no ungated payment surface remains.**

### 2026-08-13 — Gallery uploads, promo audience, force-update gate, subscription expiry
**🔴 Image uploads could silently fail — the MIME type was derived from the URI.** All three upload paths (`handlePickImage`, `handleGalleryUpload`, `handleAddHoroscope`) did `uri.split('.').pop()` and interpolated the result into the MIME type. When the picked URI has **no extension** — Android routinely returns `content://media/external/images/media/1234` — `split('.')` returns the WHOLE string, producing `type: "image/content://media/…"` and a matching garbage filename, which the server rejects. New **`utils/uploadFile.ts` → `buildImageFilePart(asset, prefix)`** uses the asset's own `mimeType`/`fileName` (both provided by expo-image-picker 17) and only sniffs as a fallback; it returns `null` for anything that isn't JPG/PNG/WEBP/HEIC, which is also **#18's "restrict to image files"**. Pickers switched from the deprecated `MediaTypeOptions.Images` to `mediaTypes: ['images']`. The upload loader (`imageUploading`) already existed and was correct.

**Gallery photo actions (#32).** Gallery images previously had only `onLongPress` → delete, which is undiscoverable. Tapping now opens a sheet: **Set as profile photo / Replace with a new photo / Remove photo**. "Set as profile" uses a **new backend endpoint** `PUT /gallery/setAsProfileImage/{encodedUserId}/{galleryId}` which copies the stored URL onto `users.profileImage` — no re-upload, no second S3 copy, and it verifies the caller owns the gallery row (otherwise anyone could repoint another member's photo).

**Promo banner audience (#20).** `PromotionalPopup` gained an optional `plans` array in its keyValue JSON (e.g. `["Silver","Gold"]`); omit it or leave it empty for "everyone", so **existing banner rows keep working unedited**. ⚠️ The audience check runs **before** `shouldShowPopup`/`markShown` deliberately — marking a banner "seen" for a member who never saw it would permanently suppress it if they later upgrade into the target plan. The effect depends on `planTitle` because `subscriptionData` resolves asynchronously; without that a Gold member could catch a Free-targeted banner in the split second before their plan loads.

**Force update (#30).** New `components/ForceUpdateGate.tsx`, mounted last in `app/_layout.tsx` so its Modal sits above the FAB and offline overlay. Reads the `APP_VERSION` keyValue row: `minimumVersion` is a hard floor (no dismiss, survives Android back), `latestVersion` is a soft nudge with "Maybe later"; omit `minimumVersion` to only ever nudge. Version comparison is **numeric per segment** — a string compare would rank `"1.10.0" < "1.9.0"` and stop prompting exactly when a minor version crosses 9. A failed keyValue fetch never blocks the app.

**Subscription expiry (#29) — backend was already done; the APP was the gap.** `SubscriptionSchedulerService.expireSubscriptions()` has always run nightly at 00:00. But `subscriptionContext` restored `subscriptionData` from AsyncStorage on mount and **never checked `endDate`**, so an expired member kept their old plan's entitlements in the UI indefinitely. Added `isSubscriptionExpired()` (compares to **end-of-day**, so a plan valid "until the 20th" works all of the 20th) which drops the stale blob and falls back to Free. **Also finally wired `clearSubscription()` into logout** — it had existed unused since it was written, so switching accounts on one device leaked the first account's plan and gating into the second.

### 2026-08-13 — Upgrade popup rethemed (affects ~25 upsell call sites, not just chat)
Reported as "the chat list free-member upgrade popup" — but that popup is `popup.premiumRequired(...)` → the shared `CommonPopup`, so retheming it fixes **every** upsell prompt in the app at once. Its `premium`/`locked` variants used the legacy maroon `#420001`, which predates the move to the blue/gold system and read as a different product. Now on the **gold tier language** (`#F6B733 → #C59A40`) that already identifies premium everywhere else (plan badges, Upgrade FAB tile, PremiumTab). Added a `variantGradient` table so the primary button renders a real gradient (falling back to the flat `btnBg` for variants that define none — success/error/warning keep their solid treatment), and a gold star medallion above the title for premium/locked only; an icon on an error or confirm dialog would just add noise. `confirm` also moved off maroon onto the app blue.

**Also:** `chatscreen.tsx` had two upsell strings written as free text ("Upgrade to Premium to send messages…"), bypassing `upgradeMessage()`. Routed through it so displayed plan names stay a pure `subscription_plans` flip — see the upgradeNavigation landmine.

### 2026-08-13 — Profile edit form onto the register form's input system (+ 29 NativeBase font landmines)
`editProfileModal.tsx` used a heavier `#D1D5DB` border, no font family, and a 48px field height, so the profile edit sheet read as a different form system from signup. `input` / `dropdownBox` / `inputText` / `dropdownText` now match `sign-up.tsx`'s `input` spec exactly (44px, radius 12, `#e2e8f0` border, `Rubik-Regular` `#333`, blue-tinted 1px lift). One style change covers all 35 field usages. The three `#f3f4f6` overrides were left alone — those are read-only fields and the grey fill is meaningful.

**🔴 Found 29 instances of the documented NativeBase font landmine in this one file.** Every field label was `<Text fontSize="sm" fontWeight="semibold" fontFamily="Rubik-Medium">` — the exact bare-prop combination that silently drops the custom Rubik font on Android (CLAUDE.md section 17). All 29 moved to `style={{ fontFamily }}`, and the labels were aligned to sign-up's `fieldLabel` (12px uppercase ink) while there. The Save button was a NativeBase `<Button>` whose label went through the **`_text` prop** — NativeBase injects a default `fontWeight` there, which is the same failing combination — so it was replaced with the auth screens' gradient pill CTA (plain `Text` inside a `TouchableOpacity`, avoiding that path entirely). The now-unused `Button` import was removed. **When restyling any NativeBase surface, grep it for `fontFamily="` first — this file had 29 and they were all invisible on Android.**

### 2026-08-13 — Settings "Change PIN" brought onto the auth design system
`SettingPageChangePin.tsx` shared the auth screens' background gradient but nothing else, so it read as a different app from the forgot-PIN flow it mirrors. Converted to the same system:
- **Inputs**: grey-filled 16-radius boxes with an absolutely-positioned icon → white **52px pills** (radius 28, 1px `#e2e8f0` border, `Rubik-Regular`) with an inline icon and the auth screens' focus treatment (`#1F7FE5` border + shadow lift). Added `focusedField` state to drive it.
- ⚠️ The confirm field's mismatch indicator lived on the `TextInput`'s own border, which the pill conversion moves to the wrapper — so it's now `!pinsMatch ? '#dc2626' : (focused ? '#1F7FE5' : '#e2e8f0')`, with **mismatch winning over focus** so the error stays visible while the user is still typing in that field.
- **Eye toggles** were `position: 'absolute'`, which inside the new flex-row pill would let the PIN text run underneath them — converted to flex siblings with `hitSlop`. Their colour was `rgba(31,127,229,0.25)`, effectively invisible; now `#94a3b8` like the auth screens.
- **Header**: replaced the "sacred" medallion (concentric rings, aura halos, sparkle dots) with the same 68px app-icon tile the auth screens use. That ornamental chrome was deliberately dropped from every pre-login screen in the 2026-08-10 redesign; this screen still had it. `Image` had to be added to the `react-native` import — it was resolving to the DOM global and failing as a JSX component.

### 2026-08-13 — Permission inbox keeps decided requests (was: they vanished)
`RequestsTab`'s received list filtered to `status === 'PENDING'`, so the moment a member approved or declined a permission request the card **disappeared entirely** — no record of what they had already decided. (That filter was itself a fix for an earlier bug: the endpoint returns every status, and decided rows kept reappearing with live accept/reject buttons, making the tap look like it did nothing.) Now every status is kept, sorted PENDING-first so the inbox still reads as "action needed first", and `PermissionRow` renders an outcome chip (Approved / Declined / Pending) **in place of** the accept/reject buttons on decided rows — which is what actually stops a decided card from looking actionable. Verified decline sets `REJECTED` via `updateRestrictedFieldStatus` rather than deleting the row, so the declined state genuinely persists.

### 2026-08-13 — Notification identity: names are a paid benefit; permission-notification bugs
**Free members now see "Someone", paid members see the real name.** Added `PushNotificationService.canSeeNamesInNotifications(recipientUserId)` + `nameForRecipient(recipientUserId, realName)` — note it keys off the **recipient's** plan, not the actor's, and **fails closed** (a lookup error yields the anonymous form rather than leaking a name). Applied to the three ungated notifications that carry an identity: chat message, interest accepted, and interest received (the last previously hardcoded `"Someone"` for *everyone*, so paid members never got the name they're paying for). **Deliberately not applied** to profile-view / like / shortlist alerts — those go through the plan-gated `sendPushNotificationToUser`, which only ever reaches Classic+, so there is nothing to mask.

**Two real bugs found in the permission approve/decline notification while here:**
- It looked up **`requestedBy`** — the recipient's *own* user id — so members read "*&lt;your own name&gt;* has accepted your request". Now uses `requestedTo`, the member who actually decided.
- The copy said "your request to view **your** horoscope"; the requester asked to view the **other** member's field. Now "their". (This wording was introduced by the same-day `fieldLabel()` fix — corrected here.)
- Its push body also interpolated the raw `ApprovalStatus` enum ("has been APPROVED"). Rewritten, and switched to `...Direct`: a decision on the member's *own* request is essential, not a plan-gated discovery alert.

**Verification:** backend `./mvnw compile` clean. Needs a deploy.

### 2026-08-13 — Client backlog pass: saved search, privacy loader, FAB gating, logout device cleanup, footer overlap
**Saved search dropped two filters — two unrelated causes.** (a) `gatherSearchData` in `SearchTabs.tsx` **hardcoded** `profilesWithHoroscope: 'N'` (comment: "or based on your filter"). The "Profile with Horoscope only" switch is real state, premium-gated, and already restored by `handleUseSearch` — its value simply never reached the payload, so the filter did nothing on search AND never persisted (`SearchResult` only saves that key when it equals `'Y'`). Now reads `horoscopeOnly`. (b) **Subcaste was never saved at all** — no `filterKey: 'Subcaste'` existed in the save path. Fixed across the round-trip: `SearchTabs` passes subcaste **names** as a separate nav param (deliberately NOT inside `requestBody`, which is POSTed verbatim to `filterUsers` — an unknown property risks the DTO rejecting it), `SearchResult` saves them, `handleUseSearch` gained a `subcaste` case, and `updatedFilters` resets it so stale chips don't survive loading a different search. ⚠️ Subcaste needed its **own** gate in `handleUseSearch`: `SUBCASTE_SEARCH` is Silver+, higher than the `ADV_SEARCH` (Classic+) that `isPremiumUser` represents — folding it into the existing check would let a Classic member load chips the backend then silently ignores for them.

**Privacy toggle had no feedback and swallowed failures.** `confirmPrivacyChange` fires 2–3 sequential API calls (fetch current fields → create or delete) with no loading state, and errors were only `console.error`'d, so a failed toggle looked successful. Added a spinner on Confirm, disabled both buttons in flight, a **re-entrancy guard** (the create/delete chain is not idempotent — a double-tap could insert duplicate hidden-field rows), and a real error popup.

**Quick Access FAB.** Plan-gated tiles were **removed** from the grid, so a Silver member never learned Family Access / Shortlisted You existed — confusing and a wasted upsell. They now render with a lock badge and route to the upgrade prompt on tap (`handlePress(item, locked)`). Separately, the **Upgrade tile is now hidden once the member is on the highest ACTIVE plan** — there is nothing left to sell them. Highest-active comes from `getActivePlansSync()`, not a hardcoded `'Platinum'`, so retiring/adding a tier stays a pure `subscription_plans` flip.

**🔴 Logout never removed the device's push registration — three separate bugs in one path.** (1) `saveDeviceInfo` checked `response.data.status == 200`, but `status` on `ResultResponse` is the STRING enum (`"SUCCESS"`/`"FAILURE"`) and the number lives in `code` — so the comparison was ALWAYS false and **`fcmToken` was never written to AsyncStorage**. (2) `performLogout` was gated on that missing key, so `deleteDevice` never ran. (3) Even if it had, it sent `{ userId, fcmToken }` while `deleteUserDeviceInfo` requires `{ userId, deviceId }` (400 otherwise), and passed the **base64** userId into a backend that does `Long.parseLong` on it. All three fixed; the call now uses `deviceId` + decoded id, checks `res.data.code`, and never blocks sign-out. Net effect: a signed-out phone kept receiving pushes for the account indefinitely.

**Footer / nav-bar overlap (three reports, two causes).** mailBox's lists had `paddingBottom: 100`, but the footer is `height: 68` **plus** `Math.max(insets.bottom, 14) + 4` — ~120 on a gesture-nav device, hence the few clipped pixels. Added **`useFooterClearance()`** exported from `VVMFooterNav` so the padding and the bar height can't drift apart, and applied it to all four mailBox lists; the saved-search list had **no `contentContainerStyle` at all**. The profile edit sheets were a different problem — they're `Modal`s, so the app footer can't overlap them; it's the **device** nav bar, since edge-to-edge lets a Modal draw behind it and both used fixed bottom padding. Now `Math.max(40, insets.bottom + 24)`.

**Also:** removed a leftover debug `Alert.alert("Selected Filters", ...)` in `mailBox.tsx` that fired on **every** permission filter checkbox change (not a confirmation step — it sat next to commented-out `console.log`s), plus its now-unused `Alert` import.

**Verification:** `npx tsc --noEmit` 58 (baseline 59) throughout; backend `./mvnw compile` clean.

### 2026-08-13 — Chat delete made per-user + ownership-checked (cross-repo), notification enum labels, misc
**🔴 Chat delete was a safety hole AND an IDOR.** `inActiveConversationById(id)` set the SHARED `GenericEntity.isActive = N` on the conversation row, so "delete" removed the thread from **both** participants' lists — a member could send abusive messages and then erase them from the recipient's view. The endpoint also took a bare conversation id with **no identity check at all** (`@GetMapping("/inActiveConversationById/{id}")`), so any caller could delete any two strangers' conversation; with `SecurityConfig` still on `permitAll()` that was unauthenticated. Fixed:
- **`Conversation`** gained per-participant `deletedByUserOne` / `deletedByUserTwo` (nullable — pre-existing rows read as "not deleted") plus `isDeletedFor(userId)` / `markDeletedFor(userId)` / `clearDeletedFlags()`.
- **`getUserChatList`** now excludes a conversation only for the participant who deleted it (`COALESCE(...,0) = 1` guards the NULL legacy rows). ⚠️ Commentary deliberately lives in the method Javadoc — **do not put `--` comments inside these native query strings**, Hibernate has previously registered phantom parameters from them and failed the query at startup.
- **`deleteConversationForUser(id, requesterId)`** replaces `inActiveConversationById(id)`; `markDeletedFor` returns false for a non-participant → `403`, without confirming the conversation exists. The endpoint is now `/conversation/inActiveConversationById/{id}/{encodedUserId}` — the extra path segment makes any old client fail loudly (404) rather than silently deleting under the old semantics.
- **`ChatService`** clears both flags on a new message, so a reply revives the thread for both sides (also still resets `isActive` for rows hidden by the old shared-flag behaviour).
- **`chats` rows are never touched** — message history is retained in full for moderation. Deleting is a hide, not an erase.
- App side: `userApi.deleteConversation(conversationId, encodedUserId)` now requires the caller id, and `myChatList`'s failure count checks `res.data.code !== 200` (a `rejected` promise alone would have counted the new 403 as a successful delete — the usual HTTP-200 landmine).

**Permission notifications leaked raw enums.** `RestrictedFieldRequestService` string-concatenated `fieldType` into five member-facing strings, so members read "A member wants to view your PROFILE_IMAGE". Added a `fieldLabel()` helper (PROFILE_IMAGE → "profile image", HOROSCOPE → "horoscope", MOBILE → "mobile number", unknown → lowercased words) used by all five. The app's mailbox screen already mapped these; only the notification path didn't.

**Naming:** profile's stat cell read **"Saved"** but opens *Who Shortlisted You* (Gold+) — the bare word reads as "profiles I saved", which is a different, ungated feature. Renamed to **"Saved You"**. Verified all three whoShortlistedMe entry points (FAB, profile stat cell, profile list card) gate identically at Gold+ — there was no inconsistency, only ambiguous labels.

**Also:** profile-by-ID search placeholder now shows the real member-id shape (`e.g. BLK101F`) — production ids are prefix+number+gender (BLK 500, PLN 60, MID 30, UMR 4). Confirmed **home "Proposals" → Sent tab was already fixed** (`initialTab: 'sent'`, `(tabs)/index.tsx:609`); the client's report predates their rebuild.

**Verification:** `npx tsc --noEmit` 58 (baseline 59), no new errors; backend `./mvnw compile` clean. ⚠️ Needs a backend deploy; Hibernate `ddl-auto=update` will add the two `deleted_by_user_*` columns automatically.

### 2026-08-13 — Android notification icon rendered as a solid white/black blob
**Why:** Client reported the notification showing as a white circle with padding and a tiny logo inside, and a plain black circle in the status bar.

**Two separate causes, both fixed:**
1. **The `expo-notifications` plugin's native config had never been applied to the native project.** There were **no `notification_icon` drawables in `android/app/src/main/res/` and no notification `meta-data` in `AndroidManifest.xml`** — so Android had no small icon to use and fell back to the **launcher icon**, which is a fully opaque square. Android renders it as a filled shape, clipped to a circle: exactly the reported blob. Generated `notification_icon.png` for all five densities (mdpi 24 → xxxhdpi 96) and added the `meta-data` pairs to the manifest (`expo.modules.notifications.*` is what expo-notifications reads; `com.google.firebase.messaging.*` covers anything delivered straight by FCM) plus a `notification_icon_color` entry in `values/colors.xml`. Done **by hand rather than via `npx expo prebuild`**, because this project has hand-maintained native files (`google-services.json`, splash resources, signing) that a prebuild can clobber. ⚠️ **If anyone does run `expo prebuild` later, re-check these survive.**
2. **`app.json` pointed the plugin at `./assets/images/vaibhavsplash.png`** — the full-colour splash logo, verified as `mode: RGB` with **no alpha channel at all**. An Android notification small icon must be a **white silhouette on transparency**: the system discards all colour and keeps only the alpha, then fills that shape with the accent tint. A fully opaque image therefore always becomes a solid blob, no matter what artwork is in it. Generated `assets/images/notification-icon.png` (256×256 RGBA, ~87% transparent) containing **only the lotus mark** — the wordmark is illegible at 24dp — as pure white with a luminance-derived soft alpha, stray specks removed, lightly thickened so the line-art survives downscaling, and repointed `app.json` at it.

**Note on the artwork:** the lotus is intricate multi-petal line-art, and at the real 24dp status-bar size it reads as a lotus-ish dome rather than crisp petals. Several variants were tried (stroke thickening, morphological closing, flood-filling the petal interiors) and all converge at that size — it is a limit of the source artwork, not the processing. A purpose-drawn simplified single-lotus glyph would render sharper if the client ever wants it. **Needs a native rebuild** — drawables and manifest changes do not hot-reload.

### 2026-08-12 — Chat list 500 (invisible), Android keyboard/edge-to-edge fallout, share deep links
**🔴 Chat list was silently empty for EVERY user — a 500 the app rendered as "no conversations".** Client reported that an interest's auto-generated message opened fine from ProfileDetail but the conversation never appeared in the chat list. Verified the data was intact (conversation rows present, `isActive='Y'`, both user joins resolving, messages attached — checked on both `vvm_db` and production `vaibhavVivaaha`), and the raw SQL returned the rows correctly. Then called the live endpoint directly (`GET /conversation/chatlist/NzAy`) and got **`code: 500 — class java.lang.Integer cannot be cast to class java.lang.Boolean`**. Cause: `ConversationService` did a raw `(Boolean) row[5]` on `isRead`. A `bit(1)` column does NOT surface as a consistent Java type — read directly it is usually `Boolean`, but inside a scalar subquery (which is how `isRead`/`lastMessage`/`lastMessageTime` are fetched here) or a `COALESCE` the server can widen it to an integer, and some driver settings return `byte[]`. So it passed locally and threw in production. **The endpoint returns HTTP 200 with the failure only in the body's `code`**, so `response?.data?.data || []` became `[]` and the UI showed an empty state — invisible at every layer. Fixed with an `asBoolean(Object)` helper (handles Boolean / Number / byte[] / "Y"/"1"/"true") now used for `isRead` and the three verified flags. **The `gender` column had already caused this exact class of bug once before** (its comment is still in the file) — treat every native-query column as untyped. ⚠️ Needs a backend deploy; until then the chat list is empty in production.

**🔴 Chat messages rendered out of order — the history query had no ORDER BY.** Client screenshot: a "Hi" sent at 10:19 PM rendered ABOVE the 9:18 PM "Interest request approved" auto-message it was replying to. `ChatRepository.findAllByConversationIdAndIsActive(...)` was a plain Spring Data **derived** query, so the generated SQL had **no `ORDER BY` at all** — row order was whatever the optimizer produced (usually insertion order, but not guaranteed, and liable to shift once an index covers the WHERE clause, which the 2026-08-10 index migration may well have changed). `chatscreen.tsx` then calls `.reverse()` on the result (its FlatList is `inverted`, so index 0 is the visual bottom), which **assumes** strict chronological order — reversing an arbitrary order just yields a different arbitrary order. Fixed with an explicit `@Query ... ORDER BY c.createdAt ASC, c.id ASC`, keeping the method name so no caller changed. `id` is the tiebreaker because `createdAt` collides: a system auto-message and a user message written in the same request land on the same millisecond, and ordering by a non-unique column alone is still non-deterministic. **Verified while here:** the client's send path already prepends correctly (`[newMessage, ...prev]`) for an inverted list; `formatDate` and `getDisplayDate` both do `.replace(' ','T') + 'Z'` so there is no timezone inconsistency; and the other unordered query, `findAllByConversationId`, is only used for `deleteAll` where order is irrelevant. Needs a backend deploy.

**🔴 `edgeToEdgeEnabled=true` + `targetSdk 35` is the shared root cause of several Android-only layout bugs.** Under edge-to-edge Android **stops honouring `windowSoftInputMode="adjustResize"`** (set in the manifest) — the window no longer resizes, the app draws behind the system bars, and the keyboard arrives as an inset the app must apply itself.
- **`chatscreen.tsx` — the input bar was pushed OFF-SCREEN entirely (the actual cause, found after the keyboard fix below still didn't work on a rebuilt APK).** The messages `FlatList` had **no `style={{flex:1}}`**, while its `contentContainerStyle` set `flexGrow: 1`. A FlatList/ScrollView inside a flex column without `flex:1` on the list ITSELF is sized by its content rather than bounded by the parent, so the list expanded past the parent and pushed its sibling (the input bar) out of view — with or without the keyboard open. Shrinking the parent with keyboard padding could never help, because the child was already overflowing it. Also fixed `messagesContainer`'s `justifyContent: 'flex-end'` → `'flex-start'`: an inverted list lays out in a flipped coordinate space, so `flex-end` resolves to the VISUAL TOP, which is why short conversations sat against the header with a dead gap above the input. **`flex-end` is correct for a non-inverted chat list; this one is inverted.**
- **`chatscreen.tsx` — message input stayed behind the keyboard on Android.** The screen already measured the real keyboard height from the OS event but applied it **iOS-only**, on the now-false assumption that `adjustResize` covered Android. Now applied on both, minus `insets.bottom` on Android (the wrapping SafeAreaView already reserves the nav-bar strip, while the OS reports keyboard height from the true screen bottom — without the subtraction the input floats a nav-bar too high). Also **deleted a second, duplicate keyboard listener pair** in the same file that drove an `animatedKeyboardHeight` and a `keyboardHeight` state **nothing ever read** — it re-rendered the screen on every keyboard event for no effect, and its name collided with the real state.
- **`StarMatchResult.tsx` — header and footer hid behind the status/nav bars.** It imported `SafeAreaView` from **`react-native`**, which is a **no-op on Android** (iOS-only). Switched to `react-native-safe-area-context` with explicit `edges`. The screen is registered `HEADERLESS`, so nothing else reserved that space. Inset colour set to the white header/footer colour (not the cream page `bg`) so the strips don't seam; `scroll` keeps `C.bg` explicitly. **Grep for `SafeAreaView` imported from `react-native` before debugging any "content under the system bars on Android" report.**
- **Home (`(tabs)/index.tsx`) status-bar strip** now matches profile: `edges` gained `'top'` (was `['right','left']`, so content slid under the status bar on scroll), and `VVMWelcomeHeader`'s own `paddingTop: insets.top + 8` was removed to avoid double-padding — that header is used **only** on Home, so this is safe.

**Profile hero chips — expiry pill text sat high.** `heroTags` had no `alignItems`, so it defaulted to `stretch` and every chip grew to the tallest sibling. The amber/blue pills re-centre their own text (they set `alignItems` internally) but the plain expiry `View` didn't, pinning its label to the top. Fixed on the row plus explicit centring on the chip.

**WhatsApp share pointed at a dead domain.** It used `https://vaibhavvivaaha.com/...` — a **different domain** from the live site (`vaibhavvivaahamatrimony.com`, what `EXPO_PUBLIC_API_URL` uses), so every shared profile link was broken. Centralised in `constants/data.ts` (`APP_WEB_ORIGIN`, `APP_SCHEME`, `profileWebUrl()`, `profileDeepLink()`, `APP_DOWNLOAD_URL`) and added a deep link. ⚠️ **The web URL keeps the base64 id, but `profileDeepLink` takes the RAW numeric id** — ProfileDetail forwards its `userId` param straight to `/getProfileDetailWithIntractionStatus`, whose controller declares `@PathVariable Long profileUserId`, so an encoded id opens the screen then fails the fetch. Also added `android.intentFilters` (autoVerify, `https://vaibhavvivaahamatrimony.com/profile`) and `ios.associatedDomains` to `app.json` so the https link can open the app — **this requires `/.well-known/assetlinks.json` (Android) and `/.well-known/apple-app-site-association` (iOS) to be hosted on the domain, plus a native rebuild**, otherwise only the `vaibhavvivaaha://` scheme link works.

**Verification:** `npx tsc --noEmit` 58 errors (baseline 59), no new errors in any touched file; backend `./mvnw compile` clean. Also removed trailing whitespace on `spring.datasource.url=${SPRING_DATASOURCE_URL}` in `application.properties` — `java.util.Properties` does not trim trailing whitespace on values, so that would have produced a JDBC URL ending in two spaces.

### 2026-08-12 — Push notifications: chat ungated, projectId fallback, self-healing device registration
**Why:** Client reported push worked in Expo Go but not in the `./gradlew assembleRelease` APK, then set up a Firebase project + service-account key in Expo credentials and it still didn't work.

**Verified the client-side chain is fully correct** — this was NOT an app-config problem. Checked against the actual release APK: `google-services.json` present and applied (`com.google.gms.google-services` plugin at `android/app/build.gradle:185`, classpath in `android/build.gradle:12`), Firebase package `com.vaibhavvivaaha.app` matches `applicationId`, the api_key/project strings are baked into `resources.arsc`, `POST_NOTIFICATIONS` is in the merged release manifest, `minifyEnabled` defaults to false, the production API URL is in the Hermes bundle, and `assets/app.config` carries `extra.eas.projectId`. **Also proved the Expo→FCM path end-to-end** by sending a real push to a stored `ExponentPushToken` and getting both `status: ok` and a delivery receipt `status: ok` — so the service-account key in Expo credentials is correct. The APK the client originally tested was almost certainly built *before* `google-services.json` was added (config file 15:28, first APK containing it 16:05 the same day) — a local release build with no Firebase config genuinely cannot obtain an FCM token on Android, while Expo Go can because Expo Go ships its own Firebase project. **Same class of bug as the splash-logo and duplicate-resource issues: a native config change requires a rebuild, it does not hot-reload.**

**🔴 ROOT CAUSE (found after the client reported a stored token that still didn't deliver): `addPushTokenListener` was overwriting the good Expo token with a raw FCM one.** `usePushNotification.tsx` did `addPushTokenListener((tokenData) => updatePushToken(tokenData.data))`. That listener yields a **`DevicePushToken`** — on Android the **raw FCM token**, NOT an `ExponentPushToken` (confirmed in `expo-notifications/build/TokenEmitter.d.ts`: `PushTokenListener = (token: DevicePushToken) => void`). `saveDeviceInfo` correctly wrote an `ExponentPushToken[...]` at login, then this listener fired seconds later on the Home screen and **UPDATEd the same row** (matched by userId+deviceId) with the raw device token. The backend's `isExpoPushToken()` then returned false, routing to `sendFcmPushNotification` → `FirebaseMessaging.getInstance()` → throws (see below) → silently added to `failedTokens`. This is also why user 195 had both a raw FCM token and an Expo token. **Fixed** by exchanging the rolled device token for an Expo token inside the listener — passing `devicePushToken: tokenData` explicitly to `getExpoPushTokenAsync` so it does NOT internally call `getDevicePushTokenAsync` and re-trigger the listener in a loop (the expo docs warn about exactly that). Added a belt-and-braces guard in `updatePushToken` that refuses to persist any token not starting with `ExponentPushToken`. **Never feed `addPushTokenListener`'s payload straight to the backend.**

**Other defects found and fixed:**
- **Chat messages were plan-gated (🔴 a second, independent delivery bug).** `PushNotificationService` has two entry points: `sendPushNotificationToUser` (gated) and `sendPushNotificationToUserDirect` (no gate). The gate at `PushNotificationService.java:305` skips any user with **no subscription, plan 1 (Free) or plan 2 (Starter)** — and returns **HTTP 200 / SUCCESS** while sending nothing, so the failure is invisible at every layer. Interest-received/accepted already correctly used `...Direct`, but `ChatService.java:186` used the gated variant, so **a Free member never got a "New Message" push**. Switched chat to `...Direct` per the client's stated policy: message + interest sent + interest accepted are essential notifications everyone gets; discovery-style alerts (profile views, likes, shortlists, daily matches) stay plan-gated as the paid upsell. ⚠️ The gate's hardcoded `== 1L || == 2L` is now stale (Starter is retired) and duplicates the `planFeatures` lookup immediately below it — worth collapsing to the feature-matrix check alone.
- **`usePushNotification.tsx` had no `projectId` fallback** — it read only `Constants.expoConfig?.extra?.eas?.projectId`, while `utils/deviceInfo.ts:62` already falls back to `Constants.easConfig?.projectId`. Added the same fallback plus an explicit warn-and-return instead of calling `getExpoPushTokenAsync` with `projectId: undefined`.
- **A single failed registration was permanently unrecoverable.** `saveDeviceInfo` runs **only at login** and has five silent early-return paths (no permission, no projectId, Expo token fetch exhausted its 3 retries, …). `updatePushToken` can't recover it either, because it requires the `deviceId` that only a *successful* `saveDeviceInfo` writes. So one miss meant no token in the DB until the next manual re-login. `usePushNotification` (mounted on Home) now re-registers whenever it holds a token but AsyncStorage has a `userId` and no `deviceId`.
- **`LoginScreen.tsx:130` swallowed the failure entirely** (`.catch(() => { })`) — now logs a warning.

**Not fixed — flagged 🔴:** `FirebaseApp.initializeApp` is **never called anywhere** in the backend and there is no service-account JSON in `src/main/resources`. Any token that isn't an `ExponentPushToken` routes to `sendFcmPushNotification` → `FirebaseMessaging.getInstance()` → throws → silently added to `failedTokens`. Production had a raw APNs token (user 704) and a raw FCM token (user 195) that could never be delivered. Since the app only ever requests Expo tokens now, the cleanest fix is to delete the dead direct-FCM path rather than wire up Firebase Admin; stale non-Expo rows should be purged (`DELETE FROM UserDeviceInformation WHERE fcmToken NOT LIKE 'ExponentPushToken%'`).

**Verification:** `npx tsc --noEmit` 58 errors (down from the 59 baseline), none in the touched files; backend `./mvnw compile` clean. **Both changes need a backend deploy + a fresh APK rebuild to take effect.**

### 2026-08-10 — Contact consent gate, subcaste = Silver+ premium, auth-screens redesign (cross-repo)
**A. Contact reveal now requires an ACCEPTED interest (backend, `UserService.revealContact`).** Client-identified abuse path: buy the cheapest paid plan, use its `VIEW_PERSONAL_INFO` quota (Classic = 40) to harvest phone numbers of members who never accepted anything, leave. Investigation nuance: `getProfileDetailWithIntractionStatus` (the endpoint ProfileDetail actually uses) ALREADY masked mobile to last-4 + nulled email without an approved interest, and horoscope was already consent-gated — **`revealContact` was the one hole**, returning full mobile + email with no consent check at all. Fixed with the same `findBetweenUsers(...) == APPROVED` pattern Voice Call/Star Match/horoscope use, placed BEFORE the quota logic so a blocked attempt doesn't burn a reveal; returns `403 INTEREST_NOT_APPROVED` (a code the app already handles). Verified live: stranger → 403 + no quota spent; accepted partner → 200 + mobile. **No frontend change needed.** Needs backend deploy.

**B. Subcaste search is now a Silver+ premium feature.** New feature code `SUBCASTE_SEARCH` seeded with `planFeatures` rows for plans 4/5/6 only — deliberately a HIGHER gate than `ADV_SEARCH` (Classic+), so it has its own check in `UserService.filterUsers` rather than riding on `hasAdvSearch`. Server silently ignores `subcasteIds` for non-entitled users (matches ADV_SEARCH's silent-degrade behaviour); verified live per tier: Free/Classic → filter ignored, Silver/Gold → applied. App side: `SearchTabs.tsx` gained `canSearchBySubcaste` from `entitlements.subcasteSearch`; non-entitled users see the locked pill → upgrade modal (same treatment as Education). ⚠️ **Production needs the `SUBCASTE_SEARCH` seed insert** (features + planFeatures rows — idempotent SQL in chat/backend CLAUDE.md) **and a backend deploy**, or Silver users will see a lock that never opens.

**C. All 4 pre-login auth screens redesigned** to a dribbble-reference design (`LoginScreen`, `ResetPasswordScreen`, `OTPValidationScreen`, `ChangePinScreen`) — **presentation only, zero logic changes** (verified: diff hunks start after `handleLogin`/`handleContinue`/etc.; every handler, i18n `t()` string, timer, and the OTP email-vs-mobile branch byte-identical). Shared design system: existing app gradient bg; 26px Rubik-Bold left-aligned heading + 13px slate subtitle; **dark navy `#1c2b3f` step-banner card** (radius 20, 42px icon chip on `rgba(90,167,239,0.28)`, white title + translucent subtitle) as the signature element; white pill inputs (radius 28, h52, border `#e7edf5`, icons `#94a3b8`, quiet uppercase 11px labels); pill CTA `LinearGradient ['#5AA7EF','#1F7FE5']` h54 radius 28 (disabled = opacity 0.55); OTP digits in 62px radius-18 boxes (border → `#1F7FE5` when filled); centered 13px `#1F7FE5` Rubik-Medium links. Removed the old ornamental chrome (medallions, corner-frame cards, ring/star decorations). All fonts via `style={{fontFamily}}` (section 17 landmine respected). `npx tsc --noEmit`: 59 before and after.

**D. Five client-reported bugs fixed (later same day).**
- **Send Interest was double-clickable** (`ProfileDetail.tsx` `handleSendInterest`): the flow makes 2–4 sequential calls (quota → subscription → count update → send), so a second tap re-ran the whole chain — duplicate interest requests AND a double-decremented quota. Added a `sendingInterest` re-entrancy guard (released in a `finally` + on the early-return path) and an in-button `ActivityIndicator` + "Sending…" label.
- **Home "Proposals" stat opened the wrong sub-tab**: it pushed `/(tabs)/mailBox` with no params, landing on Received. Backend `UserConnectionService:340` maps `Proposals` → `interestSentCount`, i.e. interests the user SENT, so it now passes `initialTab: 'sent'` → "Sent By You".
- **Splash logo stale in built app** (correct in Expo Go): `app.json`'s expo-splash-screen plugin points at `assets/images/vaibhavsplash.png` (updated Jul 21) but the GENERATED native resources were dated Jul 14 — Expo Go reads the source, the built app reads the baked resources. Regenerated all 5 Android densities (`android/app/src/main/res/drawable-*/splashscreen_logo.png`) and all 3 iOS sizes (`ios/.../SplashScreenLogo.imageset/image{,@2x,@3x}.png`) from the current source at their existing dimensions. **Same class of bug as the APK logo issue** — when a source image changes, generated native copies do NOT auto-refresh; a clean rebuild or manual regeneration is required.
- **🔴 Raw i18n keys visible to users**: `app/(root)/i18n/locales/` is EMPTY and **i18n is never initialised anywhere** (no `initReactI18next`), so every `t()` call rendered its own key as on-screen text (user saw "auth.forgotPassword.title"). Affected **6 screens, 105 calls** — all replaced with real English copy (interpolation and conditional branches preserved), every `useTranslation` import removed. **Do not reintroduce `t()` unless i18n is actually initialised with locale resources.**
- **Android-only card artifact** on the Home stats card (`VVMWelcomeHeader.tsx`) and `ProfileCompletionBar.tsx`: both layered `BlurView` (expo-blur) as an absolute fill. On Android that renders no true backdrop blur — a flat translucent overlay that does NOT clip to the parent's `borderRadius`, painting a hard-edged rectangle inside the rounded card. Made iOS-only with a near-opaque `rgba(255,255,255,0.94)` Android fallback — **the same fix already applied to `VVMFooterNav.tsx`**. ⚠️ Any future `BlurView` inside a rounded container needs this treatment.

**E. Auth screens, second pass** — logo-forward redesign across all 6 pre-login screens (lotus logo in a white circular halo with blue glow, 80px on Login / 64–66px elsewhere; reduced navy banner; focus accent on inputs). `SetNewPasswordScreen.tsx` was still on the old flat `#FDFAFA` theme and is now on the system. **Fixed a latent bug**: `LoginScreen.tsx` had `require('/assets/images/LotusLogo.png')` — an absolute filesystem path — inside a NativeBase `Avatar`; now a correct relative path.

**Dead code confirmed (not deleted):** `components/tabs.tsx` is imported by nothing (same situation as `components/ExploreTabs.tsx`), and `ProfileDetail_backup.tsx` is unreferenced but contains two `BlurView`s inside rounded containers. Both are safe to delete.

**Also this day (earlier entries' context):** production `vaibhavVivaaha` migrated + verified (16 indexes/FK/27 subcaste rows, queries 1–4 all PASS); Starter+Classic retired in production by the client; Android release build fixed (stale generated `assets_images_lotuslogo.jpeg` colliding with the new `.png` — deleted the stale artifact; 141MB APK builds clean; new 1254×1254 logo verified inside the APK); subcaste made REQUIRED at registration with per-caste "Others" escape hatch (NOT on FREE CASTE BAR — it's a caste-level "any caste is fine" choice with no subcastes; requirement is conditional on the caste actually having subcastes, enforced in both app validation and `createUser`).

### 2026-08-09 — Navigation perf pass, DB-driven plan catalog, subcaste feature (cross-repo)
Three client asks in one session. Backend/DB side is in `VaibhavVivaahaBackend/CLAUDE.md` (same date). A full audit of both repos is in **`AUDIT_REPORT.md`** at this repo's root — read it before doing perf or security work; several 🔴 items are documented there but deliberately NOT fixed in this pass (see "Deferred" below).

**A. Navigation / perceived speed.** Tabs were never actually remounting (bottom-tabs v7 is lazy by default and `enableFreeze(true)` is set in `app/_layout.tsx`) — the slowness was refetch storms on focus, app-wide re-renders, and chrome being recomputed per navigation.
- `screens/_layout.tsx` — `showHeader` used to be derived from `useSegments()` and applied to the **whole Stack's** `screenOptions`, so pushing a headerless screen (chatscreen, PaymentScreen…) stripped the header off the screen underneath it *mid-transition*. Now a static `screenOptions` + one `<Stack.Screen options={{headerShown:false}}/>` per headerless screen, and a stable module-level `headerLeft`.
- `(tabs)/_layout.tsx` — deleted the `hasStarted` gate. It rendered a blank `<View/>` on the first frame and, when false, passed `tabBar={undefined}` while the default bar was hidden by `tabBarStyle:{display:'none'}` — i.e. **no footer navigation at all**. Tab bar hoisted to a stable module-level component; added `lazy`, `freezeOnBlur`, `backBehavior="initialRoute"`.
- `components/VVMFooterNav.tsx` — `BlurView` is now iOS-only (Android gets an opaque tint). It was a live render-node blur compositing on every frame of every transition.
- **All 5 context providers** now `useMemo` their value and `useCallback` their functions. They wrap the whole app, so a single popup open/close previously re-rendered every mounted screen.
- `AuthContext.tsx` — fixed a stale closure: the `[]`-dep AppState effect captured the mount-time `userId` (always null), so the background `lastSeen` ping never fired for a user who logged in during the session. Reads a ref now.
- `axiosClient.js` — all logging gated behind `__DEV__`. It was serializing **every API response body** (profiles, chats, OTP flows) on the JS thread during screen loads, and leaking PII to logcat.
- `(tabs)/index.tsx` (Home) — extracted `MidnightCountdown`: a 1s `setInterval` was re-rendering the entire Home tree (5 carousels) every second, forever. De-duplicated `getProfileCompletion` (was fetched 3× on mount across two effects + the widget; `ProfileCompletionBar` is now the single owner and is throttled 30s with an unmount guard), subscription (2×) and unread count (3 call sites). Deleted a dead `fetchHappyStories` whose only consumer is inside a JSX comment. `loadData` collapsed from **3 serial phases to 1 parallel round**. Added a narrow fallback effect so a profile missing `location` still refreshes its plan (de-duplication had otherwise narrowed that coverage).
- `(tabs)/myChatList.tsx` — an incoming WS message used to refetch the whole chat list; now patches the affected row in place.
- `(tabs)/mailBox.tsx` — `TabView` is `lazy`, each sub-tab fetches only when active, `isActive` cleanup on all focus effects, rows extracted to `React.memo`. It previously fired **6 API calls + a full skeleton flash on every focus**, including every return from ProfileDetail.
- `screens/chatscreen.tsx` — the 3 independent mount fetches now run via `Promise.allSettled` (messages used to load *last*, behind two unrelated round-trips). Message bubble extracted to a memoized `MessageBubble`: the inline `renderItem` lived in a component holding `inputText`, so **every keystroke re-rendered every message in the thread**.
- `screens/ListUser.tsx` — 🔴 real bug fixed: "Who Shortlisted You" (a paid Gold+ feature) called the endpoint with no page args, and the backend defaults to `size=10`, so it was **silently capped at 10 people forever** with no load-more and no hint of truncation. Now properly paginated (`onEndReached`, footer spinner, in-flight guard, page reset on refresh). Also: pull-to-refresh no longer blanks the list (`setData([])` now only runs on tab change), and rows are memoized. Only `whoShortlistedMe`/`shortlisted` are paginated backend-side — the other tab types return full lists (`PAGINATED_TYPES`).

**B. Plan catalog is now DB-driven (Starter + Classic being retired).**
`app/(root)/utils/upgradeNavigation.ts` gained a real catalog: `refreshPlanCatalog()` / `initPlanCatalog()` (called from `app/_layout.tsx`) / `getActivePlansSync()` / `isPlanActive()` / `resolveMinPlanTitle()` / `upgradeMessage()` / `useActivePlans()`. Backed by `GET /subscriptionPlans/getAllActivePlans`, cached in AsyncStorage key **`activePlansCache`** (30-min TTL), falling back to `FALLBACK_UPGRADE_PLANS` (renamed from `ALL_UPGRADE_PLANS`) only if network *and* cache both fail.
- `resolveMinPlanTitle(minPlan)` returns the lowest **currently-active** plan ranked ≥ the entitlement floor. With Starter+Classic off, both a `'Starter'` and a `'Classic'` floor display as **Silver**; re-activate them in DB and they display as themselves again. ~25 hardcoded upsell strings across 14 files now route through `upgradeMessage(...)`.
- **`minPlan` arguments and all gating expressions were deliberately left untouched** — they encode the real entitlement floor from the backend planFeatures matrix. Only *display copy* resolves dynamically. `PLAN_RANK`, `TIER_ORDER`, `getTierBadge`/`getTierIcon` still contain all 6 tiers, which is required for grandfathered members.
- `UpgradePlanScreen`, `RelationshipManagerView` and `PremiumTab`'s offline fallback all read the catalog instead of hardcoded arrays. `RelationshipManagerView` falls back to `FALLBACK_UPGRADE_PLANS` so an existing Classic subscriber still sees their own plan's features.
- **Verified live against a running backend**: flipping `isActive` returned `[Free, Silver, Gold, Platinum]`; a grandfathered Classic member (user 700) still resolved full entitlements; buying a retired plan returned `400 SUBSCRIPTION_PLAN_INACTIVE`; buying an active one still returned 200.

**C. Subcaste (new, fully additive).** Backend contract in the backend CLAUDE.md. App side:
- `MasterDataContext` caches the full active-subcaste list and exposes `getSubcastesForCaste(casteId)` / `getCasteName(casteId)` / `getSubcasteName(...)`.
- Wired into: **sign-up** (dependent optional dropdown directly under Caste, reset on caste change, NOT in required validation), **SearchTabs** (**multi-select chips, same interaction/styling as the Education chips** — `pillWrapRow`/`wrapPill`; sends `subcasteIds: number[] | null` in the `filterUsers` body; deliberately NOT premium-gated, since subcaste is a core matching criterion here unlike Education/Star/Dosham which are advanced-search extras), **profile.tsx** (display + edit via ReligiousDetail), **ProfileDetail.tsx**, and `editProfileModal` (a real picker — free text would produce unfilterable typos).
- **Signup Subcaste is disabled, not hidden**: the field always renders; it's greyed + non-tappable until a caste is chosen (hint: "Select a caste first") and for a caste with no subcastes ("No subcastes for this caste"), so the form's shape never shifts. `CustomModalPicker` gained `disabled`/`disabledHint` props and was **hoisted to module scope** — it was defined inside the screen component, so every parent render created a new component type and remounted it (closing an open modal mid-interaction).
- **Signup page split changed**: Education moved from Page 1 to Page 2, so Page 1 = identity/contact ending at Caste → Subcaste, and Page 2 ("Account Setup") = Education → Occupation → PIN. Safe because `validateFormData()` runs once on final submit, not per page — Education is still required, just collected later.
- **Fixed while here:** `profile.tsx` and `ProfileDetail.tsx` both displayed a hardcoded placeholder `Caste: "SC"` for *every* member. They now resolve the real caste name from the master list.
- **2026-08-09 (later same day): the client supplied the real subcaste names and they were seeded** — 23 rows (Vanniyar 5, Naidu 6, Aadi Dravidar 5, Mudaliar 7, FREECASTEBAR none) via the idempotent `VaibhavVivaahaBackend/seed-subcastes.sql`. Verified live: `getAllActiveSubcastes` returns all 23, per-caste endpoint filters correctly, `filterUsers` narrows by subcasteId, cross-caste registration is rejected with 400, and the hide-when-empty guards still cover FREECASTEBAR. The seed must also be run on production/staging (idempotent, safe to re-run).

**Verification:** `npx tsc --noEmit` — **63 errors, down from a 66 baseline**; the normalized diff shows *only removals* (3 pre-existing errors fixed: an undefined `styles.filterButtonText` reference and an invalid `alignItems:'evenly'` in mailBox, and a dead `.fromNow` ternary in ListUser), zero new errors. Backend `./mvnw compile` clean, boots in ~9s with no schema DDL, and `filterUsers` verified backward-compatible (legacy body → 90 rows; `subcasteId:999` → correctly 0).

**Deferred — NOT fixed this pass (see `AUDIT_REPORT.md`):** the backend currently has **all security disabled** (`SecurityConfig` = `anyRequest().permitAll()`, JWT filter unregistered) and the app's `axiosClient` auth/refresh interceptor is commented out; OTPs are returned in API responses; PINs are Base64 not hashed; several IDOR paths (`deleteAccount`, `changePin`, chat history) take identity from client-supplied params. Also unfixed: `.env` is committed, ngrok fallback hosts are baked into the bundle, and there is no query-caching layer (TanStack Query was scoped but not adopted).

### 2026-08-04 — LoginScreen: handle the new PENDING/REJECTED 403 from backend (cross-repo)
**Why:** Backend (`VaibhavVivaahaBackend`, see its own CLAUDE.md) closed a real approval-gate gap — `POST /user/login` now returns HTTP 403 for `PENDING`/`REJECTED` users too, not just `BANNED`/`SUSPENDED` as before, and issues no token either way. This was necessary so a new marketing website (`VaibhavVivaahaWeb`) registering/logging in against the same backend couldn't let unapproved users straight in (previously login always returned 200 with a valid token regardless of approval status, and only this screen's own client-side `userStatus` check — reachable only *after* a successful login — redirected pending/rejected users to `ProfileUnderVerificationScreen`).

**Regression this created, fixed in the same pass**: since a PENDING/REJECTED login no longer returns `code === 200`, `handleLogin`'s old `code === 403` branch (written only for BANNED/SUSPENDED, always showing a generic "Account Blocked" popup) would have swallowed PENDING/REJECTED too — losing the `ProfileUnderVerificationScreen` UX (resubmit button, contact support, status display) entirely for those two cases.

**Fixed (`app/(root)/(main)/LoginScreen.tsx`, `handleLogin`'s `code === 403` branch)**: now checks `response.data.data?.userStatus` — if `PENDING`/`REJECTED`, stores the minimal AsyncStorage fields `ProfileUnderVerificationScreen` reads (`userId`, `firstName`, `userStatus`, `rejectionReason`) from the 403 response body (the backend now populates these even on the blocked path) and navigates there, exactly matching the old pre-fix UX. BANNED/SUSPENDED (no `userStatus` in the 403 data, or a value other than PENDING/REJECTED) still fall through to the original "Account Blocked" popup.

**Verification**: `npx tsc --noEmit` — 66 errors, unchanged baseline, no new errors in `LoginScreen.tsx`.

### 2026-07-20 — Created missing `components/AppText.tsx` (Metro bundling failure across 6 auth screens)
**Why:** iOS bundling failed with `Unable to resolve "../../../components/AppText"` from `ProfileUnderVerificationScreen.tsx`. Grepped the app: `AppText` (a `weight="bold"|"medium"|"regular"` text wrapper) is imported the same way by 6 screens — `ProfileUnderVerificationScreen.tsx`, `OTPValidationScreen.tsx`, `otpVerification.tsx`, `ResetPasswordScreen.tsx`, `ChangePinScreen.tsx`, `SetNewPasswordScreen.tsx` — but the component file itself was never created. Not a bad import to delete; real missing infrastructure that several screens already depend on.

**Fixed**: added `components/AppText.tsx` — thin `Text` wrapper mapping `weight` → `Rubik-Regular`/`Rubik-Medium`/`Rubik-Bold`, set via `style` (not the bare `fontFamily`/`fontWeight` prop, matching the app's existing NativeBase font landmine in section 17) merged with any caller-provided `style`.

**Verification**: `npx tsc --noEmit` — 66 errors (down from 67; the missing-module error is now gone), no new errors introduced.

### 2026-07-20 — PremiumTab: fixed scroll-then-tap CTA, expanded entitlement checklist 11→24 rows, "Reveal Contact" made explicit
**Why:** User reported having to scroll the card before being able to tap "Continue with this plan" — the whole card content (identity, price, description, checklist, CTA, trust line) lived inside one tall `ScrollView`, so on most device heights the button sat below the fold. Separately: the 11-row curated checklist understated how different the plans actually are (`planFeatures` has richer real data than that), and the specific "Reveal Contact" feature (a real, named feature elsewhere in the app — see section 10's Reveal Contact row) wasn't recognizably present under its own name.

**Fixed the scroll structure (`app/(root)/screens/PremiumTab.tsx`, `PlanCard`)** — removed the single outer `ScrollView` per card entirely. The card is now a bounded flex column (`cardPage`/`planCard` both `flex:1`, filling the `Animated.FlatList`'s height, which itself now has `style={{flex:1}}`): identity + price + description render fixed at the top, only the checklist section scrolls internally (`checklistScroll`, `flex:1`), and the CTA button + trust line are pinned at the bottom in normal flex flow — always visible without scrolling, matching the user's "single scroll" ask. The checklist itself still scrolls if it overflows (now likelier since the list grew — see below), but that's an isolated, expected scroll region, not a prerequisite to finding the buy button.

**Expanded `CHECKLIST_ITEMS` from 11 to 24 rows** — pulled in more of the real 31-code `features`/`planFeatures` data (`REQ_UNLIMITED`, `WHO_LIKED`, `WHO_SHORTLISTED_YOU`, `HIGH_VISIBILITY`, `PRIORITY_SEARCH`, `HOROSCOPE_VIEW`, `SECURE_CONNECT`, `VIDEO_PROFILE`, `WHATSAPP_SHARE`, `SPEAK_FAMILY`, `INCOME_VERIFIED_BADGE`, `PROFILE_BOOST`, `FAMILY_ASSISTED_MATCH`) so the tier-to-tier differentiation actually reads as substantial, not a token sample. Two new special-cases in `buildChecklistByPlan()`: `PROFILE_BOOST` only counts as included when its numeric value is `> 0` (Classic/Silver's DB rows are literally `"0"` per month — a non-null cell that still means "not really included," same class of bug as the earlier `VIEW_PROFILE_DETAILS`/`LIMITED` special-case).

**Renamed the `VIEW_PERSONAL_INFO` row label** from "Contact info access" to **"Reveal contact details"** — matches the feature's actual name elsewhere in the app (the "Reveal Contact" button flow documented in section 10) so a user scanning the checklist recognizes it as the same feature, rather than reading as a vaguer, seemingly-missing capability.

**Spacing/type tightened** throughout the card (medallion 48→44px, plan title 21→19, description 13→12.5/lineHeight 20→18, price 36→32, checklist row gap 14→9, icon chip 20→18px, row font 13→12.5) to fit more of the now-longer feature list on screen before the internally-scrolling checklist region needs to scroll at all.

**Verification**: `npx tsc --noEmit` — 67 errors, unchanged baseline; confirmed no duplicate `StyleSheet.create` keys (72 total) and no dangling references to the removed `cardScrollContent` style.

### 2026-07-20 — PremiumTab: reanimated carousel (scroll-linked scale + dash indicator), popular-plan highlight ring, "Pricing" header
**Why:** Follow-up to the reference-matching pass — user pointed at three specific reference elements to replicate more literally (the "Pricing" word as the page heading, the top-right dash/segment swipe indicator instead of centered round dots, a highlighted border around the popular plan) and asked for more animation for a premium feel, encouraging using good judgment beyond just the one reference.

**`app/(root)/screens/PremiumTab.tsx`** — logic/data untouched, presentation + new Reanimated-driven interactions:
- **Header restructured** to match the reference layout: big "Pricing" title (`HERO_TITLE` renamed from "Membership Plans" to "Pricing") on the left, dash-segment swipe indicator anchored top-right in the same row (`headerRow`/`pageTitle`/`dashRow`) — replacing the previous centered row of round dots below the intro. The native Stack header (back button chrome) still reads "Membership Plans" — only the in-page heading changed.
- **New `DashDot` component** — each dash's width/opacity is driven directly off the live carousel scroll position (`useAnimatedStyle` + `interpolate` against a shared `scrollX` value), not the discrete `selectedPlan` state — so the indicator eases smoothly mid-swipe instead of snapping only when a page settles.
- **New `PlanCard` component**, extracted out of the FlatList's inline `renderItem` (Reanimated hooks must live inside a real component, not an inline closure) — every card now has a scroll-linked "carousel focus" effect: the centered card sits at full scale/opacity, neighbors ease back to 0.92 scale / 0.6 opacity as they slide toward the edges (classic centered-carousel treatment, e.g. Airbnb-style listing carousels).
- **Popular-plan highlight ring** (`planCardPopular`) — the card whose `isPopular` flag is true (and isn't also the user's current plan) now gets a 2.5px gold border + matching gold glow shadow, mirroring the reference's yellow outline around its featured "Talent Pro" card. Previously popular plans were only distinguished by the small corner badge, no card-level highlight.
- **Popular badge pulse** — the gold "POPULAR" corner badge now has a subtle, continuous scale pulse (`withRepeat`/`withSequence`/`withTiming`, 1↔1.06 every 700ms) to draw the eye, active only on the popular (non-current) card.
- **Staggered checklist entrance** — each checklist row now fades/slides in with a per-row delay (`FadeInDown.delay(i*45)`) when its card first renders, instead of appearing all at once.
- Switched `FlatList`/plain `View`s to `react-native-reanimated`'s `Animated.FlatList`/`Animated.View` for the animated pieces (same library already used by `QuickAccessFAB.tsx` elsewhere in the app — reanimated v4, uses `Extrapolation` not the deprecated `Extrapolate`).

**Verification**: `npx tsc --noEmit` — 67 errors, unchanged baseline; confirmed zero duplicate `StyleSheet.create` keys and no dangling references to the removed `dotsRow`/`dot`/`dotActive`/`introSection`/`introTitle` styles.

### 2026-07-20 — PremiumTab: unique per-tier identity, real per-day pricing, decluttered header, trust line
**Why:** Follow-up to the reference-matching polish pass (next entry) — user asked for a more distinctive/classy premium feel, an audit for wasted space or unwanted content, and encouraged looking at other good pricing-page patterns beyond the single reference already used.

**Removed as unwanted/redundant:** the small "GOLD"/"SILVER"/etc. tier-name pill that sat next to the plan title — it just repeated text already in the title itself (e.g. a "GOLD" chip beside "Gold"), pure duplication with no added information.

**Added (all data-backed, nothing fabricated):**
- **Per-tier medallion identity** (`identityRow`/`tierMedallion`) — each plan now gets a distinct icon in a tier-gradient circle instead of a text pill: Free→Compass, Starter→Rocket, Classic→Award, Silver→Star, Gold→Crown, Platinum→Gem (`getTierIcon()`). Gives every card a memorable visual identity beyond its name, a common pattern on premium subscription pages (Stripe/Linear-style) that this app's cards previously lacked entirely.
- **Real per-day price framing** (`computePricePerDay()`) — e.g. Starter's ₹499/30 days now also shows "≈ ₹16.6/day" under the price. Computed directly from the plan's actual price ÷ `durationDays` (not a fabricated stat); explicitly skipped for Free (₹0) and Platinum ("until marriage", `durationDays=9999`) where a per-day figure would be meaningless or misleading.
- **Trust line inside every card** (`trustLine`, Shield icon) — "Secure payment · Cancel anytime" under the CTA, reinstating a subtle reassurance signal (the standalone trust-strip from the very first theme pass was dropped when the card carousel was introduced; this puts a lighter version back per-card instead of once at the page level).

**Restructured hierarchy** for a cleaner read: identity (icon + name + tagline) → price (+ per-day) → description → checklist → CTA → trust line — previously title/tier-pill and tagline were split across two different blocks (one before price, one bundled into the price row), which read as slightly disorganized.

**Verification**: `npx tsc --noEmit` — 67 errors, unchanged baseline (confirmed all 6 new lucide icon imports — `Compass`, `Rocket`, `Award`, `Star`, `Gem`, `Shield` — resolve correctly, no missing-export errors). Also caught and removed a duplicate `planTagline` style key left over from the restructure (StyleSheet.create silently lets the later definition win, but only one is needed).

### 2026-07-20 — PremiumTab card polish pass to match reference structure more closely
**Why:** Follow-up to the swipeable-card rebuild (previous entry) — user said the checklist itself was fine, but asked for the card's structural details (badge placement, price layout, divider, button treatment) to match the dribbble reference more literally, in our own color theme.

**`app/(root)/screens/PremiumTab.tsx`** — presentation-only changes to the card, no data/logic changes:
- Corner badge moved from top-left/centered to a top-right pill-with-dot (`cornerBadge`/`cornerBadgeDot`), matching the reference's "Active •" / "Popular •" / "Save 15% •" corner treatment. Computed per-card as one of three states (current plan → green "ACTIVE", `isPopular` → gold "POPULAR", has a real discount → blue "SAVE X%"), falls back to no badge otherwise.
- Price row reordered to match the reference: strikethrough original price → big price → period, all inline on one baseline-aligned row (was: price + separate discount chip, period on its own line below).
- Checklist rows changed from bare `Check`/`X` icons to small filled circle chips (`checkIconWrap` + `checkIconIncluded`/`checkIconExcluded`) — green circle + white check for included, light-grey circle + grey X for excluded — closer to the reference's rounded icon-badge look.
- Divider changed from a solid 1px line to `borderStyle: 'dashed'`, matching the reference's dashed section rule.
- Current-plan button changed from a solid grey disabled-looking button to a proper outline/ghost button (`ghostButton`/`ghostButtonText` — border only, no fill), mirroring the reference's "Cancel" ghost-button state instead of looking like a disabled purchase button.
- Card corner radius increased (20→28) and padding/shadow deepened slightly for a more "premium card" feel matching the reference's rounded phone-card shape.

**Verification**: `npx tsc --noEmit` — 67 errors, unchanged baseline, no new errors.

### 2026-07-20 — Fixed FAB-hidden-after-relogin bug; PremiumTab rebuilt as real DB-driven swipeable plan cards with entitlement checklist
**Why:** Two user reports in the same session: (1) "QuickAccessFAB sometimes doesn't show after I log out and log back in — I have to fully close and reopen the app." (2) "premium plan list page — DB has 6 plans, but the screen shows 10." Both were real bugs, plus the user separately asked to rebuild the plan screen to match a reference design (swipeable single-card-per-plan, full feature checklist with check/cross marks) using our own theme instead of copying it literally.

**Bug 1 — `app/(root)/(main)/LoginScreen.tsx`:** `handleLogin` wrote `userId`/`authToken` etc. straight to AsyncStorage but never called `useAuth().login(userId)`. `AuthContext`'s in-memory `userId` state (which `QuickAccessFAB.tsx` gates on via `if (!userId) return null`) is only ever set once, at app boot inside `checkUserStatus()` — nothing else in the app ever told it a new session started. So logging out (which correctly sets `userId` to `null`, hiding the FAB) followed by a same-session relogin left `AuthContext.userId` stuck at `null` forever, even though storage/UI otherwise looked logged in — only a full app restart re-ran `checkUserStatus()` and picked up the real state. **Fixed**: added `const { login } = useAuth()` and `await login(response.data.data.userId).catch(() => {})` right after the `userId` AsyncStorage write in `handleLogin`. `sign-up.tsx` doesn't auto-login (no direct `userId` write found), so it wasn't affected by this same bug.

**Bug 2 — `app/(root)/screens/PremiumTab.tsx` fetched real plans then discarded them:** `fetchData()` called `userApi.getAllActivePlans()` but never used the response — it always rendered a hardcoded `MOCK_API_RESPONSE` with 10 entries (3 duration variants each for Classic/Silver/Gold, left over from an early prototype). Confirmed via direct DB query that `subscription_plans` has exactly 6 rows (Free/Starter/Classic/Silver/Gold/Platinum, one each, no duration variants — matches CLAUDE.md section 7). **Fixed**: `fetchData()` now actually maps `plansResponse.data.data`; `MOCK_API_RESPONSE` deleted entirely; `defaultPlans` (the offline fallback if the API call fails) trimmed from 10 fabricated duration-variant entries to the real 6.

**Rebuild — plan screen now shows a real entitlement checklist, not marketing bullet text:** Per the user's reference design (a dribbble HR-app pricing mock: dark cards, Annual/Monthly toggle, one plan per screen swiped via dots, full feature list with green check / grey X per row) — three scoping questions were asked and answered before building: (1) use our own blue/ink/gold theme, not the reference's literal dark palette; (2) drop the Annual/Monthly toggle entirely, since `subscription_plans` has only one price per tier and adding real dual pricing was out of scope; (3) match the reference's swipeable single-card-per-plan interaction (not the previous scrollable list).
- **New `userApi.getPlanFeaturesMatrix()`** → `GET /planFeatures/matrix` — reuses the admin "Plan Features" matrix endpoint built earlier this session (`PlanFeaturesController`/`PlanFeaturesService`, no auth gate — confirmed reachable by a regular customer JWT, same `permitAll()` bucket as `/keyValue/**`). Returns `{plans, features, cells}` from the real `features`/`planFeatures` tables (31 real feature codes, e.g. `ADV_SEARCH`, `VIEW_PERSONAL_INFO`, `STAR_MATCH`, `VOICE_CALL`, `FAMILY_LOGIN`, `DEDICATED_RM`).
- **`PremiumTab.tsx`** — added `CHECKLIST_ITEMS`, a curated 11-row subset of those feature codes (chosen for a clean ascending staircase of checkmarks Free→Platinum, since showing all 31 raw codes would be too technical/granular for a member-facing screen) and `buildChecklistByPlan()`, which resolves the matrix's numeric `subscriptionPlanId`/`featureId` cells back to plan titles/feature codes and marks a row "included" if any cell exists for that plan+code — except `VIEW_PROFILE_DETAILS`, special-cased to only count as included when its value is `FULL` (Free's value there is `LIMITED`, which should render as excluded, not included). Old bullet-text `features: string[]` field removed from the `Plan` type entirely, replaced by `checklist: {label, included}[]`.
- **Layout**: replaced the vertical `ScrollView` of stacked plan cards with a horizontal `pagingEnabled` `FlatList` (one plan fills the screen width per page) + a dot-indicator row above it that tracks `selectedPlan` via `onMomentumScrollEnd`. Each card is a nested vertical `ScrollView` (own scroll, no gesture conflict with the parent's horizontal paging since the axes differ) showing: current-plan/popular badge, tier chip, big price (+ strikethrough original + discount badge if the DB row actually has `originalPrice`/`discount` — both are NULL for all 6 rows today, so neither renders currently, which is correct rather than fabricating a fake discount), tagline, description, the check/cross checklist, and a CTA button. The CTA reads the specific plan closed over by that card (`handleUpgradePress(plan)`, refactored from reading a shared `selectedPlan` index) — if `plan.title === subscriptionData?.planTitle` (or Free when no subscription), the button is replaced with a disabled "Your Current Plan" state instead of a purchase action.
- Removed the trust-strip (Shield/CheckCircle/Users icons) added in the earlier theme-only pass this same session — the new compact intro + dot indicator replaced it; can be re-added if wanted.

**Verification**: `npx tsc --noEmit` — 67 total errors (this session's actual current baseline, not the historically-cited 166 — the number has drifted from other unrelated changes over time; confirmed zero new errors in any of the 3 touched files: `LoginScreen.tsx`, `PremiumTab.tsx`, `userApi.js`).

### 2026-07-20 — PremiumTab.tsx full redesign to app theme + RelationshipManagerView plan features
**Why:** The plan-list screen (`PremiumTab.tsx`) still used a standalone pink/rose "matrimony" theme (`#ec4899`/`#fdf2f8`) with emoji-laden copy ("Unlock Premium Matrimony 💕", "💍 Choose Your Matrimony Plan", "💕 Join 1000+ couples...") predating the app's current blue/ink design language — visually inconsistent with `profile.tsx`/`ProfileDetail.tsx`/`explore.tsx` and read as an off-brand paywall rather than part of the same trusted app. User asked for a full redesign matching the established theme, "classy styles which make trust," with unwanted headers/emojis removed.

**`app/(root)/screens/PremiumTab.tsx` — full presentational rewrite, zero business-logic changes** (`fetchPaymentStatus`, `fetchData`'s plan mapping/mock-data fallback, `handleUpgradePress`, the PARENT-role redirect, and the three response states — loading/error, PENDING payment, active-subscription — are all untouched logic, only restyled):
- Replaced the pink hero (floating hearts, `Crown` in an amber circle, emoji heading) with a compact intro: small blue-gradient icon chip + plain heading/subtitle (no emoji) + a 3-item trust strip (Shield "Verified profiles", CheckCircle "Secure payments", Users "Real support team") — trust signals tied to real app features, not fabricated stats (the old commented-out "50K+ Happy Marriages / 95% Success Rate" block was dead code and was deleted, not resurrected, since those numbers were never real).
- Page background changed from a flat white `ScrollView` to the same soft blue `LinearGradient` (`['#d0dfeb','#dde8f1','#e9f0f6','#f3f7fa']`) used on `explore.tsx`/`profile.tsx`, applied consistently across all 4 render states (loading, error, PENDING, active-subscription, and the main plan list) — previously only the plan-list state had any background treatment (pink), the other 3 states used a second, different pink gradient (`['#fdf2f8','#fef7ff','#fff1f2']`).
- Each plan card now shows a small gradient "tier chip" (Free/Starter/Classic/Silver/Gold/Platinum) next to its title, reusing the exact same gradient/text-color pairs as `SearchResult.tsx`'s `getTierBadgeStyle()` — so a plan card here visually matches the tier badge a member later sees on their own profile elsewhere in the app. Added a `getTierKey()`/`getTierBadge()` helper pair (local to this file) since `SearchResult.tsx`'s version isn't exported.
- "POPULAR" badge restyled as a gold gradient chip (`#FFE067→#F6B733`, text `#5E4200`) matching the Gold tier badge language instead of a pink outline; "CURRENT PLAN" (Free) badge restyled neutral slate instead of pink-adjacent grey.
- Selected-plan highlight changed from a pink border/shadow (`#ec4899`) to blue (`#1F7FE5`), matching every other "selected state" in the app (search filters, chips, etc).
- Primary CTA button fixed from a broken-looking `['#1F7FE5', '#8B0000']` (blue-to-dark-red) gradient with low-contrast `#DADADA` text to a proper `['#1F7FE5','#1862b8']` blue gradient with `#fff` text — this `#DADADA`-on-gradient pattern is the same low-contrast bug already fixed on the 5 pre-login auth screens on 2026-07-15 (see that entry's button-text note); button copy changed from "Start Premium Journey" to "Continue with this plan" (removes false urgency framing).
- Removed dead code found while touching this file: the entire commented-out "Premium Features Grid" JSX block, its backing `PremiumFeature` interface, `premiumFeatures` state, `defaultPremiumFeatures` array, and `getIconComponent()` helper — `mappedFeatures` was computed from `userApi.getAllActivePremiumFeatures()` every load but never actually rendered (the only consumer JSX had been commented out) and was silently discarded; the API call itself was removed since fetching it achieved nothing. Also removed the unused `Alert` import.
- `MOCK_API_RESPONSE.heroTitle`/`heroSubtitle` and their state-fallback defaults changed from `"Unlock Premium Matrimony 💕"` / `"Find your soulmate faster with exclusive matrimony features ❤️"` to `"Membership Plans"` / `"Choose a plan built around verified profiles and real relationships"` — no emoji, plainer trust-oriented copy.
- Added `<Stack.Screen options={{ title: '...' }}>` (per-state: "Membership Plans" / "Payment Status" / "Your Membership") — previously this screen had no title at all, just a blank header bar from the shared `screens/_layout.tsx` Stack config (`title: ""` app-wide default), which read as an unfinished/broken header.

**`app/(root)/utils/upgradeNavigation.ts`** — `UpgradePlanOption` interface gained a `features: string[]` field; `ALL_UPGRADE_PLANS`'s 5 paid-tier entries (Starter→Platinum) each got a 4-bullet feature list (same copy as `PremiumTab.tsx`'s plan cards, kept in sync manually since there's no shared backend source yet — see Deferred section).

**`components/RelationshipManagerView.tsx`** (used by `PaymentScreen.tsx` in `PAYMENT_MODE=CONTACT` and by `UpgradePlanScreen.tsx`'s plan picker — the "talk to a Relationship Manager" contact flow) — user pointed out the "Selected Plan" summary card showed only title/period/price with no feature list, so a user requesting a callback had no way to know what the plan actually included. Added a `planFeatures` lookup (`ALL_UPGRADE_PLANS.find(p => planTitle.includes(p.title))?.features`) rendered as a checklist (blue check-circle + text) inside the existing plan-summary card, below a thin divider + "WHAT YOU'LL GET" label — no new card, no layout restructuring, just an additional block within the card already there. The `.includes()` match works for both the bare tier title `UpgradePlanScreen.tsx` passes (e.g. `"Gold"`) and the duration-suffixed one `PremiumTab.tsx`'s `handleUpgradePress` passes (e.g. `"Classic (3 Months)"`), since none of the 6 tier names are substrings of one another.

### 2026-07-20 — Fixed stale PAYMENT_MODE navigation decision + added error visibility
**Why:** User reported that flipping `PAYMENT_MODE` in the admin Configuration page (see adminpanel `CLAUDE.md`) didn't reflect immediately. `PaymentScreen.tsx` itself was already correct (always fetches fresh on mount, cache is optimistic-first-paint only) — the real bug was a **second, independent consumer**: `utils/upgradeNavigation.ts`'s `resolvePaymentMode()`, which decides whether tapping any `popup.premiumRequired(...)` upgrade prompt sends a Free user to the real QR checkout (`PremiumTab`) or the assisted "talk to an RM" picker (`UpgradePlanScreen`) — **before** the user ever reaches `PaymentScreen.tsx`. This function returned an up-to-5-minute-old cached value and never re-checked the network at all if the cache was still "valid," so an admin's mode change could leave users routed to the stale destination for up to 5 minutes — and since the destination screen differs entirely (not just its content), `PaymentScreen.tsx`'s own correct fresh-fetch logic never even got a chance to run.

**`app/(root)/utils/upgradeNavigation.ts`** — `resolvePaymentMode()` now always calls `userApi.getPaymentMode()` fresh; the cache is only consulted as a fallback if the network call itself throws (previously any failure defaulted straight to `CONTACT` — now it prefers the last known-good cached value first, only falling back to `CONTACT` if there's no cache either). Added `console.warn` at every silent-failure branch.

**`app/(root)/screens/PaymentScreen.tsx`** — same error-visibility fix: every silent-failure branch in its own payment-mode fetch (network error, missing/malformed `valueColumn`) now logs via `console.warn` instead of quietly defaulting to `CONTACT` with no trace. This screen's actual fetch logic was already correct (always fetches fresh on mount); it just had no way to diagnose *why* a fetch failed if it ever did.

**Not fixed / no other consumers found**: grepped the whole app for `PAYMENT_MODE`/`paymentModeCache`/`getPaymentMode` — only these two files (`PaymentScreen.tsx`, `upgradeNavigation.ts`) actually read it; `PremiumTab.tsx`/`UpgradePlanScreen.tsx` only reference it in comments.

**Verification**: `npx tsc --noEmit` — 166 total, unchanged baseline, no new errors.

### 2026-07-20 — Report/block flow overhaul: optional block-on-report, message-level reporting, unified reasons
**Why:** User asked whether report/block matched standard matrimonial-platform behavior. Found: reporting a profile silently force-blocked the user with no way to opt out and no disclosure; `ProfileDetail.tsx` and `chatscreen.tsx` had two different, out-of-sync report-reason lists (chat's was missing Fake Profile/Inappropriate Photos); there was no way to report a specific abusive chat message, only whole profiles. See backend `CLAUDE.md`'s matching entry for the API-side changes this depends on.

**New: `constants/data.ts`** — added `REPORT_REASONS`, a single shared list (`Fake Profile, Inappropriate Photos, Already Married, Underage, Scam / Financial Fraud, Spam, Abuse, Harassment, Others`) replacing the two separate hardcoded arrays. Added the matrimony-specific categories (Already Married, Underage, Scam/Financial Fraud) that neither old list had.

**`app/(root)/screens/ProfileDetail.tsx`** — report modal now has an explicit "Also block this user" checkbox (defaults checked — reporting a whole profile is already a decisive action), replacing the old forced/silent block. `handleReportSubmit` sends `blockUser` and the success toast now says whether blocking actually happened.

**`app/(root)/screens/chatscreen.tsx`**:
- Uses the same shared `REPORT_REASONS` list (was its own shorter, inconsistent array).
- **New: per-message reporting.** Long-pressing any message bubble from the other person (not your own sent messages) opens the same report modal pre-filled with that message's id/text, sent as `reportedMessageId`/`messageContent`. The "Also block" checkbox defaults **unchecked** here (unlike the profile-report flow) — reporting one bad message in an otherwise fine conversation shouldn't silently end it.
- On submit, only navigates back to `/myChatList` when blocking actually happened — a message report without blocking now leaves the user right where they were instead of always kicking them out of the chat.

**Not changed**: `BlockedUsersScreen.tsx`'s unblock flow was already correct (confirmed during the audit — deleting the block row is the only side effect needed, since all visibility/search/messaging gates re-derive live from the block table).

**Verification**: `npx tsc --noEmit` — 166 total errors, same as the established baseline, zero new errors in any touched file.

### 2026-07-15 — Star Match now requires mutual interest approval (cross-repo) + porutham calculation audit
**Why:** User asked whether Star Match should be usable against another member without that member having accepted an interest request first — it shouldn't be, same as Voice Call already requires. Investigation confirmed this was a genuine, undocumented gap: `handleStarMatch` in `ProfileDetail.tsx` only checked plan tier (`isPremiumValue`), never `interestStatus`, unlike `handleRequestCall` right next to it.

**Frontend (`app/(root)/screens/ProfileDetail.tsx`):** `handleStarMatch` now early-returns with `popup.info('Not connected yet', ...)` when `interestStatus !== 'APPROVED'`, mirroring `handleRequestCall`'s pattern exactly. The "Match Score" button gets the same visual lock treatment as "Request Call" (greyed icon/text + "Available after they accept your interest" subtext, `disabled` when locked) via a new `matchLocked` local. This only applies to the **profile-initiated** flow (has a `viewedUserId`) — the standalone horoscope-utility flow (`settingsPage.tsx`/`QuickAccessFAB.tsx`, no target member) is untouched and remains fully unrestricted, since there's no other app member's consent to check there.

**Frontend (`app/(root)/screens/StarMatch.tsx`):** `handleSubmit`'s `requestData` payload now includes `requesterUserId` (the logged-in user's base64 `userData.userId`) and `viewedUserId` (forwarded from route params) — but **only when `viewedUserId` was present** in this screen's own route params to begin with, so the standalone flow's payload is unchanged (no new fields at all).

**Frontend (`app/(root)/screens/StarMatchResult.tsx`):** now explicitly checks `response.data.code === 403 && response.data.message === 'INTEREST_NOT_APPROVED'` before falling through to the success-path rendering — previously any non-2xx-shaped body (`response.data.data` missing) left the screen stuck on "Analyzing compatibility..." forever, since `result` never got set and there was no other check to catch it. Same explicit-message handling now covers any other backend failure shape too (falls back to `response.data.message` in an alert + `router.back()`), not just this one case — reinforces the "always check `res.data.code`" landmine in section 17.

**Backend (`VaibhavVivaahaBackend` — see its own CLAUDE.md for full detail):** `MatchRequestDto` gained optional `requesterUserId`/`viewedUserId` fields; `PoruthamService.evaluate()` checks `InterestRequestRepository.findBetweenUsers(...)` + `ApprovalStatus.APPROVED` at the top, **only when both ids are present**, returning `403`/`INTEREST_NOT_APPROVED` otherwise — same conditional-gate shape as `ServiceRequestService.createRequest`'s existing `VOICE_CALL` check.

**Separate finding (not yet fixed, flagged for the user to prioritize) — the porutham calculation itself has real accuracy bugs**, discovered while investigating this task: `utils/StarInfo.java`'s `NADI` table (30% of total weight — the single biggest factor) is badly wrong, assigning 21 of 27 nakshatras to "Antya" nadi via a lazy `for` loop instead of the real repeating 3-star cycle, so Nadi Porutham (and therefore most of the overall score) is essentially meaningless for any pair where either star index is ≥ 7. `YONI` table (8% weight) doesn't follow the real per-nakshatra classical assignment at all and includes 3 non-existent yoni animals ("Crow", "Eagle", "Pig" — not part of the real 14-animal system). `GANA` table (10% weight) has 3 wrong entries (indices 4, 6, 10). `PoruthamService.checkRasiAdhipathi`'s planetary friend/enemy table (5% weight) has several inversions vs. the standard Vedic Naisargika Maitri table (e.g. Mercury/Moon friendship and enmity are swapped, Mars/Venus enmity is backwards, Jupiter/Saturn enmity is wrong). `checkVasya` (3% weight) is an explicit stub — its own comment says "sample pairs; expand as needed," only 2 hardcoded rasi pairs instead of the real vasya-group system. `checkStreeDirga` (6% weight)'s own comment says "simplified rule used earlier" — uses a `diff >= 7` threshold instead of the traditional `diff >= 13`. Altogether, well over half of the 100-point weight is computed from data that's either wrong or a stub. This was NOT fixed this session — surfaced to the user for prioritization since correcting it means sourcing/verifying accurate reference tables, not a quick patch.

### 2026-07-15 — Four bugfixes: search-results Alert→popup, StarMatchResult dead-code cleanup, profile.tsx NaN income + stale-refresh race, ProfileDetail default-avatar/expand-button
**`app/(root)/screens/SearchTabs.tsx`** — converted all remaining native `Alert.alert` calls to the shared `usePopup()` system for Android/iOS visual consistency (this app already standardized on `CommonPopup`/`PopupContext`, but this file still had leftover `Alert.alert` usage): `handleSearch`'s error paths, `handleProfileIdSearch`'s "Please enter a profile ID" / **"No profile found with this ID"** (the originally-reported case) / catch-block error, and `handleDelete`'s saved-search delete confirmation (rewritten as `popup.show({...})` with manual `popup.hide()` calls in each button's `onPress`, since `show()` — unlike the `success`/`error`/`confirm` convenience helpers — doesn't auto-close). Removed the now-unused `Alert` import.

**`app/(root)/screens/StarMatchResult.tsx`** — removed ~491 lines of dead commented-out code (an old dark-purple `#0d0b1a`/`#6c5ce7` theme version of this screen sitting above the live component) plus an unused `ApiResponse` interface and `getResultIcon` function. The live component was already fully on the app's blue theme; no visual change, pure cleanup.

**`app/(root)/(tabs)/profile.tsx`** — two bugs: (1) Annual Income showed `NaN` for most real profiles because `user_details.annualIncome` mixes plain numeric strings (older rows, e.g. `"400000"`) and bracket-label strings most profiles actually carry (e.g. `"5-7L"`, `"20L+"`) — `Number("5-7L")` is `NaN`. Added a `formatAnnualIncome()` helper that only currency-formats purely-numeric values, otherwise shows the bracket label as-is. (2) Editing a profile section and saving didn't reliably show the new data — `components/editProfileModal.tsx`'s `handleSubmit` called `onUpdate(formData)` (which internally awaits the save, then calls `refreshProfile`) but *also* fired its own separate, unsequenced `refreshProfile()` call immediately, racing the in-flight save; the earlier-fired (stale, pre-save) GET could land after the correct post-save one and silently overwrite fresh state. Fixed by removing the premature duplicate call — `handleEditUpdate`'s own sequencing was already correct.

**`app/(root)/screens/ProfileDetail.tsx`** — two bugs on the other-user profile view: (1) default gendered avatar images (square, 500x500/512x512) were center-cropped by the hero image frame's `resizeMode="cover"` (correct for real, already-portrait-cropped photos, but not for these near-full-bleed square illustrations) — clipped hair/shoulders and looked off-center. Fixed by switching only the default-avatar branch to `resizeMode="contain"` inside a neutral-fill `View`; real-photo and blurred-restricted-photo branches untouched. (2) The photo-expand button stayed tappable even when a profile had no real photo, opening a blank/broken image modal. Added a `hasProfileImage` guard: `openImageModal()` early-returns when there's no real photo, and the expand button is visually dimmed (`opacity: 0.4`) + `disabled` in that case.

### 2026-07-15 — Rethemed all 5 pre-login auth screens to the app's blue-gradient look + font-bug fix
**Why:** These screens (sign-up, login, OTP, change-PIN, forgot-PIN) predated the app's current blue-accent design language and still used a flat `#F5F5F5` background, a maroon/navy `#130057`/`#5C1A1B` palette, and leftover "Sacred"/"Divine" decorative naming from an earlier theme pass — visually inconsistent with every other screen in the app. Separately, custom Rubik fonts weren't actually rendering on Android for any of these screens at all.

**Font bug (see section 17 landmine) — fixed across all 5 screens:** NativeBase's `<Text fontFamily="Rubik-Bold">` prop form silently loses the custom font on Android when a `fontWeight` is also present (even an implicit default), because our Rubik font names were never registered as NativeBase theme tokens. Moved every font declaration to `style={{fontFamily:...}}` instead.

**Theme pass — same recolor applied to `sign-up.tsx`, `LoginScreen.tsx`, `OTPValidationScreen.tsx`, `ChangePinScreen.tsx`, `ResetPasswordScreen.tsx`:**
- Background: flat `#F5F5F5` → the same soft blue gradient used app-wide (`explore.tsx`'s `['#d0dfeb','#dde8f1','#e9f0f6','#f3f7fa']`)
- Titles: oversized/wrong-weight (`22-28px`, `Rubik-Medium`/`-ExtraBold`, maroon/blue) → unified `20px Rubik-Bold, #0f1724` ink — `Rubik-ExtraBold` is reserved app-wide for the brand wordmark only (`VVMWelcomeHeader.tsx`)
- Subtitles: `14-16px Rubik-Medium` (one used an `opacity: 0.9` hack instead of a real muted color) → `12-13px Rubik-Regular, #64748b`
- Field labels: navy `#130057`, `letterSpacing: 1` → ink `#0f1724`, `letterSpacing: 0.3`
- Inputs: navy-tinted bg/border/text (`rgba(19,0,87,...)`) → white bg, `#e2e8f0` border, `#333`/`Rubik-Regular` text, `#999` placeholders
- Icons: navy → blue accent `#1F7FE5` (neutral `#94a3b8` for show/hide-password toggles)
- Primary buttons: several passed a **flat, non-gradient color pair** to `LinearGradient` (`['#1F7FE5','#1F7FE5']` or a triple-repeated single color) → real gradients (`['#1F7FE5','#1862b8']`); button text was `#DADADA` (low contrast on a blue background) → `#fff`
- Error text: `#f44336` → `#dc2626` (app's standard error red)
- Ghost/secondary buttons (Back, Forgot PIN, Resend): navy-tinted borders/text → neutral `#e2e8f0` border / `#475569` slate, or blue `#1F7FE5` for tappable links — consistent link styling across all 5 screens now

**Alignment bugs found and fixed while touching these screens:**
- **Loading-state button text had a stray `marginLeft` copy-pasted from the icon+text pattern used in the non-loading state** — but the loading branch has no icon, so the margin just pushed the text off-center for no reason. Found and fixed in `OTPValidationScreen.tsx` ("Verifying Code..."), `ChangePinScreen.tsx` ("Securing PIN..."), and `ResetPasswordScreen.tsx` ("Sending Code...") — same copy-paste bug in all three.
- `ResetPasswordScreen.tsx`'s loading-state button text was `18px` vs. the non-loading state's `16px` — text size visibly jumped when toggling loading; unified to `16px`.
- `ChangePinScreen.tsx` had two identical, back-to-back `interface ChangePinScreenProps` declarations — removed the duplicate. Also removed a dangling `textShadowRadius: 4` on the title with no `textShadowColor`/`textShadowOffset` set (had no visible effect either way).

**`sign-up.tsx` — additional structural changes beyond the theme pass:**
- **Collapsed 3 pages → 2**: Page 1 = First/Last Name, DOB, Gender, Caste, Mobile, Age, Email+Verify, Education (ends at Education). Page 2 = Occupation, Employing In, City/District, PIN/Confirm PIN. The old Page 3 (post-2026-07-14 trim) only had 4 fields left and didn't need its own page.
- **Removed the Interests/"What are you passionate about" step entirely** — no backend change needed: hobbies were already tracked in `calculateProfileCompletion` (a `hobbies` entry + `HOBBIES` next-action already existed) and already have a full post-signup edit path (`userApi.updateUserHobbies` via `EditInterestsModal` in `profile.tsx`). The `selectedInterests` state, the min-3-selected gate, and the follow-up `updateUserHobbies` call after `createUser` were all removed from the signup flow.
- **Added a real labeled stepper** ("Basic Info" / "Account Setup") — two circular nodes + connector line, checkmarked when a step is completed — replacing a plain anonymous progress bar. Lives in a persistent header above the `Swiper` (title/subtitle/"Sign In" link included) so none of it scrolls away with the page content, and reduced the excessive top padding that used to sit above "Create your account."
- **Removed the logo**; moved "Sign In" out of a corner button into a plain-language "Already have an account? **Sign In**" line under the subtitle.
- **Fixed the Android keyboard-avoiding bug**: both pages had `enableAutomaticScroll={Platform.OS === 'ios'}`, which disabled auto-scroll-to-focused-input on Android entirely (`enableOnAndroid` alone only resizes the view for the keyboard, it doesn't scroll to the field) — Email (page 1) and PIN/Confirm PIN (page 2) stayed hidden behind the keyboard on Android. Enabled on both platforms now.
- **DOB + Gender row**: originally wrapped (Male/Female pills didn't fit once a selected pill gained a checkmark icon). Fixed with an uneven flex split (DOB narrower, Gender wider: `flex={1}` vs `flex={1.35}`) plus a tighter-padding pill variant (`optionPillCompact`) used only here, and gave the pills an explicit `height: 44` to match DOB's input box (previously content-driven, visibly shorter).
- **Every field label unified** to one shared style (`fieldLabel`: `12px`, `Rubik-Bold`, uppercase, black, `letterSpacing: 0.3`) — `CustomModalPicker`'s dropdown labels (Caste, Education, City/District) previously used a separate, inconsistent `13px` style; that dead style was removed. Placeholder/typed text stays normal-case, `14px`, `Rubik-Regular` — including the dropdown's selected-value text and the DOB date-display text, which previously had no explicit font at all (silently rendering in the system font, not Rubik).
- Added `placeholderTextColor="#999"` explicitly to every `TextInput` — previously relied on the OS default placeholder color, which looked visibly different (mismatched shade) from `CustomModalPicker`'s custom-styled `#999` placeholder text next to it.

### 2026-07-14 — Moved 9 fields out of required signup into post-signup profile completion (cross-repo)
**Why:** `sign-up.tsx` asked for 23 fields across Page 2 + Page 3 before a user could even see their profile — flagged as too much friction for initial registration, likely a source of drop-off. Agreed to keep only core identity fields required at signup (name, DOB, gender, caste, mobile, age, email+verify, education, occupation, Employment Status, City/District, PIN) and move the rest to the existing post-signup profile-completion flow. Backend `CLAUDE.md` has the matching entry (same date) for the API/DB side.

**`sign-up.tsx`**: removed JSX + required-field validation for Father's Name, Father's Occupation, Mother's Name, Mother's Occupation, Job Place, Current Address, Native Place, Annual Income, and Education in Detail (the last one physically lived on Page 2, not Page 3, despite being one of these "deferred" fields). Page 3 is now just Employing In + City/District + PIN/Confirm PIN, plus a one-line note ("You can add family, address & income details later from your profile"). `validateFormData()` and the `userApi.createUser(payload)` body both trimmed to match; `location` now comes straight from `selectedCity` (previously `selectedCity || jobPlace`). Removed the now-unused state/error plumbing for all 9 fields.

**`profile.tsx`**: `formatUserDetails()` and `handleEditUpdate`'s `sectionMap` extended so these fields are editable post-signup — 5 of the 9 (Father's/Mother's Name+Occupation, Annual Income) already had a full working edit path via `FamilyDetail`/`EducationalDetail`, so only Job Place + Education in Detail (added to the `EducationalDetail` section) and Current Address + Native Place (added to the `PersonalDetail` section, newly displayed as read-only rows too) needed wiring. No new `userApi.js` methods needed — reuses `updateEducationInfo`/`updateProfile`.

**`editProfileModal.tsx`**: `'Current Address'` and `'Education in Detail'` labels now get a multiline `TextInput` instead of the generic single-line default.

**Not changed on the frontend**: no new AsyncStorage keys, no new routes, no new API methods — this was a trim + rewire, not a new feature build.

### 2026-07-14 — Two signup/OTP bugfixes: Android DOB picker loop, email-verify OTP mislabeling
**Bug 1 — DOB picker looked like it reopened after "Confirm" (Android only):** `sign-up.tsx`'s date picker mounted `RNDateTimePicker` inside a hand-built `<Modal>` + "Confirm" button — an iOS-only-correct pattern. On Android, mounting `RNDateTimePicker` always pops the OS's own native dialog regardless of `display` mode, and that dialog auto-dismisses itself on selection; the app's own wrapping `Modal` stayed mounted underneath afterward, showing as an apparently blank popup, and tapping its leftover Confirm button while it re-rendered looked like the picker reopening. **Fixed**: split by `Platform.OS` — Android renders `RNDateTimePicker` directly (no wrapping Modal) and resolves everything off `onChange`'s `event.type === 'set'`, no separate confirm step; iOS keeps the original spinner+Modal+Confirm pattern. `onDateConfirm` now takes an optional date override so the Android path can pass the freshly-picked value directly instead of relying on `tempDate` state (which wouldn't have committed yet in the same tick). Also removed a dead duplicate `DateTimePicker` import.

**Bug 2 — Email "Verify" button misaligned:** was `position:'absolute', top:-4` relative to the whole label+input `Box`, so it floated near the "Email" label rather than the input row. **Fixed**: replaced with a flex row pairing the label and the Verify/Change pill — aligned by layout instead of a magic offset.

**Bug 3 — OTP screen always said "Mobile number" even for email verification:** `OTPValidationScreen.tsx`'s subtitle was hardcoded to "4-Digit code sent to your Mobile number" + a masked phone built from `phoneNumberState`, a state variable that was declared but **never populated** (always fell back to `------`). Every actual caller (`sign-up.tsx`'s email verify, `ResetPasswordScreen.tsx`) navigates here with an `email` param, not a phone number. **Fixed**: added `isEmailFlow = !!email` branch + a `maskEmail()` helper; subtitle now correctly reads "...to your email" + masked email when applicable.

### 2026-07-14 — SearchResult.tsx: full redesign of the search-results card (two passes)
**Why:** User asked for the search-results list (reached from `SearchTabs.tsx`'s Search button) to be redesigned, first to match the app's blue-accent theme, then — after feedback that it "wasn't good" — into a bolder, "Gen-Z" full-bleed photo-card style closer to Tinder/Hinge/Bumble.

**Pass 1 (blue reskin, boxed card):** recolored the whole screen (header, Save/Edit pills, upgrade banner, Save-Search modal) from maroon/gold to `#1F7FE5` blue + ink/slate neutrals; bigger photo (108×140) with a bottom age/height scrim, tier badge moved to a ribbon on the photo corner, meta rows (location/job/income) given tinted icon-dots, "View Profile" turned into a blue gradient pill.

**Pass 2 (final, full-bleed card) — superseded pass 1's card layout:** the whole card is now the photo (`ImageBackground`, `aspectRatio 0.98`, 26px radius) — no more photo-beside-text box. Name+age is a large (22px) bold white headline on a bottom gradient scrim; height/location/job/income are "frosted glass" pill chips (translucent white, thin border) over the scrim instead of a flat icon+text list; tier badge is now a gradient metallic "sticker" chip top-left on the photo; the CTA is a floating gold circular arrow FAB bottom-right overlapping the photo edge (mirrors the same FAB pattern already used by `components/DiscoveryProfileCard.tsx`, for cross-screen consistency) instead of a text button. All original data fields (name, age, height, city, job, income, tier, verified badges) are still present — repositioned, not dropped. `getTierBadgeStyle()` now returns `{gradient, textColor}` instead of `{badge, text}` StyleSheet refs, to feed the new gradient chip.

### 2026-07-14 — SearchTabs.tsx "Filters" page header + spacing polish
Small iterative round on the Filters screen (reached via the Explore tab): added a page title (initially "Filters", then a hero-style "Find Your Match" headline + gradient `SlidersHorizontal` icon badge + subtitle, then left-aligned + shrunk per feedback — final: icon-left, title+subtitle stacked beside it, left-aligned, 16.5px title / 11.5px subtitle). Fixed a double-spacing bug where `rangeSection`'s own top margin/padding stacked on top of `filterContent`'s header-to-first-field gap for the Age Range field specifically (36px total instead of 24px) — added a `rangeSectionFirst` override, applied only to Age Range (Annual Income's `rangeSection` still needs its own gap since it follows the Education row, not a header).

### 2026-07-09 — Explore grid: fixed invisible cards + real card/background redesign
**Why:** The prior pass (below) fixed the grid's layout hack but kept `ExploreProfileCard`'s old flat-black-scrim look and a flat white scene background — user reported the design looked unchanged, and separately that switching `cardWrapper` from `width:'49%'` to `flex:1` made cards render with zero width (data looked "not bound") because the FlatList's parent (`sceneTab`) has `alignItems:'center'` with no defined width, so `flex:1` children had nothing to flex against.

**Fix 1 (bug):** `FindPartner`'s `<FlatList>` in `SearchTabs.tsx` now has an explicit `style={{ width: '100%' }}` — gives the flex-based 2-column grid a definite width to divide, restoring visible cards. Data/API calls were never broken; this was purely a rendering-width regression from the layout-hack fix.

**Fix 2 (real design upgrade) — `components/ExploreProfileCard.tsx` rewritten:** same prop interface, same boost-badge/verified-badge/shared-interests features, no logic changes — visual only:
- Card: `aspectRatio: 0.74` portrait shape (was fixed `height: 250`), `borderRadius: 20`, maroon-tinted shadow — matches the `DiscoveryProfileCard` family used in `listProfile.tsx` so both grids in the app now look like a matched set
- Scrim: layered maroon-tinted translucent bands (`rgba(66,0,1,...)` → `rgba(35,0,1,0.92)`) replacing the old flat `rgba(0,0,0,0.5)` block — moodier, more premium
- Job/location rows: small `MaterialCommunityIcons`/`Ionicons` + text (was plain gray `Text` lines)
- Boost badge: gold pill with flash icon (was plain amber background, no icon)
- Added a gold circular "view" arrow FAB bottom-right, same as `DiscoveryProfileCard`
- Interest tags: gold-tinted (`rgba(246,183,51,0.28)`) to match brand instead of the old amber-orange

**Fix 3 (background):** `FindPartner`'s per-tab scene (`sceneTab`, both the loading-skeleton branch and the loaded-grid branch) changed from a flat opaque `#FFFFFF` to a soft `LinearGradient` (`#EAF3FB → #F7FAFD`) — previously this flat white silently covered up the pretty blue gradient background that `explore.tsx` already renders behind everything.

**Fix 4 (pre-existing overlap, fixed while touching this code):** the plan-tier badge overlay (Platinum/Gold/Silver pill, rendered in `SearchTabs.tsx` as a sibling of `<ExploreProfileCard>`, not inside it) used to sit at `top:8, left:8` — the exact same corner as the card's own internal boost badge, so a boosted Gold-plan profile would show two overlapping badges. Moved the external plan badge to `top:40, right:10` (just below the verified-shield corner) to clear both.

### 2026-07-09 — Visual-only redesign pass: shared screens header, listProfile.tsx, Explore grid (SearchTabs.tsx)
**Why:** User feedback across several rounds: the shared stack header used flat brand maroon which read as harsh/not subtle and made the back button nearly invisible; the profile-grid screen reached from "New Connections"/"Daily Recommendation" etc. used a dated 2-column grid with a negative-margin overlap hack; the Explore tab's "All Matches"/"Newly Added" grid used the same dated overlap hack plus a plain-text empty state. Explicit constraint each round: presentation only, no logic/navigation changes, verify nothing was removed.

**`app/(root)/screens/_layout.tsx`** — shared `Stack.screenOptions` re-themed to match the home page's actual palette (`components/VVMWelcomeHeader.tsx`, which uses no maroon at all): `headerStyle.backgroundColor: '#F3F7FA'` (light blue-gray, sourced from the home gradient), `headerTintColor: '#1F7FE5'` (the same blue used for the active tab in `VVMFooterNav`), title text `#0f1724`. `CustomBackButton` recolored to match (`#1F7FE5` chevron + "Back" text, `Rubik-Medium`). Went through two iterations — flat maroon first (rejected as "not subtle"), then this light-surface + blue-accent version — before landing here.

**`app/(root)/screens/listProfile.tsx`** — fully rewritten presentation layer (all 4 `fetchProfiles()` switch cases, `useUserData`/`useLocalSearchParams` usage, and the `router.push('/screens/ProfileDetail', {userId})` navigation left byte-for-byte behavioral). Added a `LIST_META` map (title/subtitle/empty-state copy per `type`), branded loading/empty states, and a proper flexbox `gap`-based FlatList grid. `SafeAreaView edges` trimmed to `['left','right']` (was double-reserving top safe-area space on top of the Stack header, causing a visible gap).

**New: `components/DiscoveryProfileCard.tsx`** — presentational-only card (full-bleed image, maroon gradient scrim, gold "NEW" ribbon, verified-badge chip, gold arrow FAB) used by `listProfile.tsx` only.

**Important correction / landmine discovered this round:** `components/ExploreTabs.tsx` is **dead code** — nothing imports it (verified via project-wide grep). The actual "Explore" tab (`app/(root)/(tabs)/explore.tsx`) renders `Tabs` imported from `../screens/SearchTabs`, and the live `ExploreTabs` component — including the `Search` filter form and the `FindPartner` component with the "All Matches"/"Newly Added" nested `TabView` — is defined **inline inside `app/(root)/screens/SearchTabs.tsx`** (search for `const ExploreTabs = () =>` near the bottom of that file). An earlier pass in this same session mistakenly redesigned `components/ExploreTabs.tsx` before catching this; that redesign is harmless (the file still isn't imported anywhere) but delivered no user-visible change. **If "the Explore tabs" ever need touching again, edit `SearchTabs.tsx`, not `components/ExploreTabs.tsx`.**

**`app/(root)/screens/SearchTabs.tsx`** (the real target) — the `Search` filter form (By Criteria/By Profile ID/Saved Search, age/income/education/star/dosham filters) was already using the app's blue accent (`#1F7FE5`) and a clean card layout, so it was left alone. Fixed only the `FindPartner` component's grid and chrome, preserving every handler/state/API call (`userApi.getAllCasteProfilesByGender`, `userApi.getNewConnections`, `router.push('/screens/ProfileDetail', {userId})`) verbatim — kept `ExploreProfileCard` as-is (it has boost-badge + shared-interests features `DiscoveryProfileCard` doesn't, so swapping cards would have silently dropped those):
- `containerProfle`/`rowProfile`/`cardWrapper` styles: replaced the old `width:'49%'` + `marginBottom:-30` negative-margin overlap hack with a proper `gap`-based FlatList grid
- Empty state (`ListEmptyComponent`) for both "All Matches" and "Newly Added": was plain gray text, now icon (Ionicons, blue-tinted circle) + title + subtitle, matching the pattern used in `listProfile.tsx`
- Inner tab bar indicator (`indicatorTab`): was a flat full-height block fill; now an inset rounded pill (`height:'82%'`, `marginHorizontal:6`, `borderRadius:14`) for a more modern look, same blue (`#1F7FE5`)
- Cleanup found while touching this file (both zero-risk, confirmed via `git diff` that no handler/state/JSX logic changed): `FlatList` was imported from `native-base` (incompatible generic typing, caused `TS2786`/`TS6229`) — switched to `FlatList` from `react-native`; and a genuinely dead, shadowed duplicate of `containerProfle`/`rowProfile`/`cardWrapper` (an earlier definition in the same `StyleSheet.create` object, silently overridden by a later one per JS object-literal semantics) was removed, along with the `TS1117` duplicate-key errors it caused. `npx tsc --noEmit` error count dropped from 187 to 179 project-wide; no new errors introduced.

### 2026-07-09 — Classic "Reveal Contact" button + accurate horoscope-empty message
**Why:** A Classic-plan viewer reported seeing "premium members only" for a Silver profile's contact info despite having an accepted interest, plus a misleading "Horoscope available after interest accepted" message on a profile where interest genuinely was already accepted. Verified against the live DB with the test pair `VannClassic TestMale` (700) → `VannSilver TestFemale` (703):
- `interestRequest` row 700↔703: `acceptStatus = APPROVED` — confirmed accepted
- `user_details.horoscope` for 703: `NULL` — the profile genuinely has no horoscope uploaded; not a masking bug
- `planFeatures` for Classic's `VIEW_PERSONAL_INFO`: `40` (a **quota** — 40 contact reveals per plan duration), NOT `enabled` like Silver+. The backend (`UserService.revealContact`, already fully implemented — checks/increments `contact_reveals` + `user_feature_usage`) correctly requires an explicit reveal action per profile; an accepted interest does NOT bypass this, it only affects how much of the number shows once access is granted.

**Root cause:** `ProfileDetail.tsx`'s Contact section had no UI for the Classic reveal flow at all — whenever `mobile` came back `null` it always rendered the same flat `<PremiumLock message="Upgrade to view contact details" />`, indistinguishable from what Free/Starter see. A working `revealContact` call existed elsewhere (`ProfileDetailTab.tsx`), but that component is only used for viewing **your own** profile (via `components/tabs.tsx`), not other users' — so it never helped here.

**Fixed (`InlineProfileTabs` inside `ProfileDetail.tsx`):**
- New `planTitle` and `interestStatus` props passed down from the parent
- Contact section: added a `planTitle === 'Classic'` branch — a "Reveal Contact" button calling `userApi.revealContact(currentUserId, profileDetailId)`. On success shows the number + `X of 40 contact reveals left`; on `CONTACT_VIEW_LIMIT_EXCEEDED` or other 403s, shows `popup.premiumRequired(...)`. Free/Starter still see the original flat upgrade wall (correct for them — they have no `VIEW_PERSONAL_INFO` row at all)
- Horoscope section: the empty-state message now checks `interestStatus === 'APPROVED'` — shows "This member hasn't added their horoscope yet" when genuinely no data, vs. the original "Horoscope available after interest accepted" only when still actually gated

### 2026-07-09 — Five bugfixes: conversation-crash on re-send, footer desync, stale lists, layout overflow
**1. Backend crash on re-sending interest after canceling (not just declining):** `InterestRequestService.createInterestRequest` (see 2026-07-08 entry below) only reused the existing `Conversation` row when resending after a REJECTED `InterestRequest`. But `deleteInterestRequest` (used by "Sent By You" → cancel) deletes only the `InterestRequest` row, leaving the `Conversation` behind. Re-sending after a *cancel* then took the "fresh insert" path and tried to INSERT a second `Conversation` for the same pair → `SqlExceptionHelper: Duplicate entry '...' for key 'conversations.UK...'` (500, surfaced to the user as an error popup after the 2026-07-08 fix that made us actually check `res.data.code`). **Fixed** in `VaibhavVivaahaBackend` by checking for an existing `Conversation` directly (regardless of the `InterestRequest` path taken) before deciding insert-vs-reuse — see backend `CLAUDE.md`.

**2. Home page profile-completion nudge button overflowing its card on Android** (`components/ProfileCompletionBar.tsx`): the action button's text (`nextAction.title`, e.g. "Add profile photo") had no `flexShrink`/`numberOfLines`, so on narrower widths it pushed past the card's rounded edge instead of truncating. Fixed: `numberOfLines={1}` + `ellipsizeMode="tail"` on the text, `flexShrink: 1` + `flex: 1` + `minWidth: 0` on the button so it takes remaining space and shrinks, `flexShrink: 0` on the progress-ring section and the `+N%` badge so they stay fixed-size.

**3. "Sent By You" tab showed stale data** (`app/(root)/(tabs)/mailBox.tsx` `SentTab`): fetched via `useEffect(() => {...}, [])` — once on mount, never again. Since tab scenes stay mounted across navigation, sending a second interest elsewhere and returning showed the old list. Switched to `useFocusEffect` so it refetches every time the mailBox screen regains focus.

**4. Footer nav stuck highlighting "Home" while the actual screen was Profile** (`components/VVMFooterNav.tsx`): `const [active, setActive] = useState<TabKey>(activeTab)` only seeds the initial value — `active` never re-syncs if the `activeTab` prop changes for any reason other than a tab tap (`handleTab`). If the `<Tabs>` navigator in `_layout.tsx` ever remounts (its render is gated by a `hasStarted` state that toggles via `useFocusEffect`) while its own navigation state briefly reads index 0, `VVMFooterNav` seeds to `'home'` and never corrects itself even once the real route settles on Profile. Fixed: added a `useEffect(() => setActive(activeTab), [activeTab])` to keep it in sync with the true source of truth.

**5. Last item hidden behind the floating footer nav in mailBox list tabs** (`app/(root)/(tabs)/mailBox.tsx`): none of the three `FlatList`s (Received, Sent By You, Permissions) had a `contentContainerStyle` accounting for `VVMFooterNav`'s height (~68px + safe-area inset, absolute-positioned). There was already a `listContent` style defined (`paddingBottom: 16`) but it was dead code — never actually applied to any `FlatList`, and the padding was too small anyway. Fixed: bumped it to `paddingBottom: 100` (matching the existing `scrollContent` convention elsewhere in this file) and wired `contentContainerStyle={styles.listContent}` into all three `FlatList`s.

### 2026-07-08 — Fixed Interests & Hobbies edit: was a raw text input, and silently didn't save
**Why:** Tapping "Edit" on the Profile screen's "Interests & Hobbies" section routed through the generic `EditProfileModal` via `handleEdit(personalDetail?.[4])`. That modal's `renderItem` switch has no case for the `_hobbies` key (an array, not a string), so it fell to the `default` case and rendered a plain `TextInput` with the array coerced to a comma string — not a multi-select. Worse, `handleEditUpdate`'s `sectionMap`/`apiMap` (keyed by section title: `PersonalDetail`, `ReligiousDetail`, `EducationalDetail`, `FamilyDetail`) had **no `InterestsDetail` entry**, so `if (formatter && apiFn)` was false and the whole save silently no-op'd — no API call, no error, modal just closed and nothing changed. A working multi-select chip implementation already existed, but only inside `components/tabs.tsx`'s separate profile-edit-tabs flow, not the main Profile screen.

**New file:** `components/EditInterestsModal.tsx` — extracted/shared version of that working implementation: `InterestChipGrid` (multi-select, min 3 required) + Save button calling `userApi.updateUserHobbies`, now with a proper `res.data.code === 200` check (the original in `tabs.tsx` didn't check this either — see the "always HTTP 200" landmine in section 17).

**Modified:**
- `app/(root)/(tabs)/profile.tsx` — "Interests & Hobbies" `SectionCard`'s edit button now opens `EditInterestsModal` directly instead of routing through `handleEdit`/`EditProfileModal`
- `components/tabs.tsx` — `FirstRoute`'s inline ~100-line duplicate modal replaced with `<EditInterestsModal>`; removed the now-unused `savingInterests` state (the shared component manages its own saving state)

**Not changed:** `EditProfileModal`'s `sectionMap`/`apiMap` still has no `InterestsDetail` entry — this is now moot since interests never route through it, but don't accidentally wire `InterestsDetail` back through `handleEdit` in future work.

### 2026-07-08 — Removed `allowsEditing` from all image pickers (Android crop-screen bug)
**Why:** On Android, `ImagePicker.launchImageLibraryAsync({ allowsEditing: true, ... })` opens the **device's own OS-level crop screen** (not something this app renders) — on many OEM skins (MIUI, One UI, etc.) that screen renders without visible Done/Cancel buttons, especially combined with a forced `aspect` ratio, completely blocking the upload flow. Reported as: profile-photo picker opens gallery, picks image, no way to confirm/cancel afterward.

**Modified — removed `allowsEditing: true` and `aspect` from every `launchImageLibraryAsync` call (picks the raw image, no forced crop step):**
- `app/(root)/(tabs)/profile.tsx` — `handlePickImage` (profile photo), `handleGalleryUpload` (gallery), `handleAddHoroscope` (horoscope)
- `components/tabs.tsx` — `handleAddPhoto`, `handleAddHoroscope`, `handleUpdateHoroscope` (same flows, different implementation used by the profile edit tabs)

**Not touched** (already `allowsEditing: false`): `PaymentScreen.tsx`, `IncomeVerificationScreen.tsx`. **Not touched** (dead code): `profile_backup.tsx`.

**If per-photo cropping is wanted back later**, don't re-add `allowsEditing` — instead pick with editing off and run the result through `expo-image-manipulator` (already a project dependency) for an in-app crop UI we control, rather than relying on the OS's inconsistent cropper.

### 2026-07-08 — Interest request bugfixes: silent-failure on send, and re-send after decline
**Why:** A test between two accounts showed a sent interest request never appearing in the receiver's "Received" tab. Root cause: `handleSendInterest` in `ProfileDetail.tsx` called `userApi.sendInterestRequest(...)` and unconditionally set `interestStatus('PENDING')` without checking the response body's `code` — this backend always returns HTTP 200 even on business failures, so a `{code: 400, message: "Interest request already exists"}` response (the backend's duplicate-pair check, which didn't consider status — any PENDING/APPROVED/**REJECTED** row blocked a new one forever) was silently treated as success by the UI.

**Frontend (`app/(root)/screens/ProfileDetail.tsx`):**
- `handleSendInterest` now checks `res.data.code === 201` before updating UI state; shows `popup.error(...)` with the backend's actual message otherwise (all 3 call sites — unlimited quota, quota-tracked, and no-quota fallback — refactored into one `sendInterest()` helper to avoid tripling the fix)
- `canSend` now also allows sending when `interestStatus === 'REJECTED'` (previously only `NONE`/`''`/`null`) — matches the button's own label logic (`interestButtonConfig`'s `default` case already showed "Send Interest" for REJECTED, but `canSend` silently no-op'd the tap)

**Backend (`VaibhavVivaahaBackend` — see its own CLAUDE.md for full detail):** `InterestRequestService.createInterestRequest` now allows re-sending after a decline by resetting the existing row back to PENDING (a DB unique constraint on `(interestSend, interestReceived)` forbids inserting a second row) — only blocks if the existing row is PENDING or APPROVED.

**Product decision (user-confirmed):** re-sending an interest request after a prior decline is now allowed, indefinitely (no cooldown). If a cooldown is wanted later, add a timestamp check in `createInterestRequest`.

### 2026-07-08 — Quick Access FAB redesign (CSK-style stack) + Shortlisted-You consolidation
**Why:** The first cut of `QuickAccessFAB.tsx` used a static bottom-sheet grid card. The user wanted it to match a reference app's (CSK) actual home-page FAB: draggable, snapping to screen edges, with the sub-menu popping open as a vertical stack of standalone circular buttons (not a grid-in-a-card), opening upward or downward depending on which half of the screen the FAB currently sits in. Separately, "Shortlisted You" existed in two different places with two different implementations (`mailBox.tsx`'s Gold+ 4th tab, and `ListUser.tsx?type=whoShortlistedMe` used by `profile.tsx`/`settingsPage.tsx`) — consolidated to the one already-working `ListUser` screen and removed the duplicate.

**`components/QuickAccessFAB.tsx` rewritten:**
- Now draggable with the exact same mechanics as `SupportFAB.tsx` (`Gesture.Race(tap, pan)`, edge-snap on release via `withSpring`, position persisted to AsyncStorage — new key `quickAccessFabPosition`, separate from `SupportFAB`'s `supportFabPosition`)
- **Pan gesture is disabled while the menu is open** (`.enabled(!open)`) — dragging the FAB while its stack is showing would desync the anchor position from the drawn items; users must close the menu (tap the X) before repositioning it
- Sub-menu is now a vertical stack of standalone 50px circles (no enclosing white card), each with its own white pill label — sizes/gaps (50px circle, 14px between items, 12px from the FAB, 80ms stagger) taken directly from the CSK reference's `.fab-item`/`.fab-menu` CSS
- Open direction is computed fresh each time the FAB is tapped: FAB in the top half of the screen → stack opens downward (`FadeInDown`); bottom half → opens upward (`FadeInUp`). This mirrors CSK's `fabOpenFromTop = fabCenterY < midpoint` logic exactly
- Label side flips based on which edge the FAB is snapped to (labels always extend toward screen center, never off-screen) — mirrors CSK's `.fab-on-left` flip
- **Android-only overlap bug fixed**: the stack items' "opens upward" case originally used `bottom: SCREEN_H - fabAnchor.y + ...`, which depends on the container's actual rendered height matching the `Dimensions.get('window').height` constant. That drifted enough on some Android devices (status/nav bar handling differs from the assumption) to visually overlap the FAB. Fixed by computing every item's position via `top`, anchored directly off `fabAnchor.y` — the exact same coordinate basis the FAB itself uses via `transform: translateY` — so both are always consistent regardless of the container's true height.

**Shortlisted-You consolidation:**
- `app/(root)/(tabs)/mailBox.tsx` — removed the `WhoShortlistedMeTab` component and the Gold+ 4th "Shortlisted You" tab entirely (along with the now-unused `isGoldPlus` variable). `mailBox.tsx` is back to exactly 3 sub-tabs: Received / Sent By You / Permissions
- `components/QuickAccessFAB.tsx` — `SHORTLISTED_YOU` tile now routes to `router.push({ pathname: '/(root)/screens/ListUser', params: { type: 'whoShortlistedMe', title: 'Who Shortlisted You' } })`, the same destination `profile.tsx` and `settingsPage.tsx` already use, instead of the old `mailBox?initialTab=whoShortlisted` deep link
- `userApi.getWhoShortlistedMe` is unchanged and still used — just by `ListUser.tsx` exclusively now, not `mailBox.tsx`
- No `QUICK_ACCESS_MENU` keyValue JSON change needed — the `SHORTLISTED_YOU` item `id` is unchanged, only its internal navigation target moved

### 2026-07-07 — Global Quick Access FAB + SupportFAB relocation
**Why:** Several genuinely useful screens had poor discoverability — `myfavourite.tsx` and the "Permissions"/"Shortlisted You" sub-tabs of the `mailBox.tsx` ("Request" footer tab) were effectively hidden behind multiple taps or swipes, especially for first-time users. A global, dynamically-configurable "Quick Access" FAB solves this without an app-store release for future changes to the item list (content lives in the `keyValue` table). Moved `SupportFAB` out of the global root layout into `settingsPage.tsx` only, to avoid two competing floating buttons on every screen.

**New files:**
- `components/QuickAccessFAB.tsx` — global FAB, fixed bottom-left, opens a modal grid panel of quick-access tiles (staggered `FadeInUp` entrance via `react-native-reanimated`). Items sourced from keyValue `QUICK_ACCESS_MENU`, cached in AsyncStorage (`quickAccessMenuCache`, 30-min TTL), hardcoded `DEFAULT_QUICK_ACCESS_ITEMS` fallback. Each item has a semantic `id`; `handlePress` maps `id → navigation` via `switch` (not a raw DB-stored route). Items filtered client-side by `minPlan` vs `subscriptionData.planTitle`.

**Modified:**
- `app/_layout.tsx` — removed global `<SupportFAB />`, mounted `<QuickAccessFAB />` in its place (same position in the provider tree, outside `<Stack>`)
- `app/(root)/screens/settingsPage.tsx` — added `<SupportFAB />` at the end of its render tree (self-contained, own `GestureHandlerRootView`, so it works fine scoped to one screen)
- `app/(root)/(tabs)/mailBox.tsx` — added `useLocalSearchParams<{initialTab}>()` + a `useEffect` that jumps the `TabView` to the matching route index on mount, so `?initialTab=request` or `?initialTab=whoShortlisted` deep-links straight into that sub-tab
- `app/(root)/api/userApi.js` — added `getQuickAccessMenu()`

**New endpoint:** none — reuses the existing generic `GET /keyValue/getKeyValueByKey/{key}` (see backend `CLAUDE.md`), just a new seeded row for key `QUICK_ACCESS_MENU`.

**New AsyncStorage key:** `quickAccessMenuCache`

**Default Quick Access items (seeded, admin can edit via `keyValue` row without an app release):**
1. Upgrade (→ `PremiumTab`)
2. Star Match (→ `StarMatch`, entitlement-gated popup)
3. Family Access (Gold+, → `FamilyAccessScreen`)
4. My Favourites (→ `myfavourite`, previously an orphan/unreachable screen)
5. Permission Requests (→ `mailBox?initialTab=request`)
6. Shortlisted You (Gold+, → `ListUser?type=whoShortlistedMe` — see 2026-07-08 entry below)

**Deploy steps:**
1. No backend deploy needed (generic keyValue endpoint already exists)
2. Seed the `QUICK_ACCESS_MENU` row (see `VaibhavVivaahaBackend/seed-quick-access-menu.sql` if created, or run the equivalent `INSERT ... ON DUPLICATE KEY UPDATE` manually)
3. To change the FAB's items later: update the `valueColumn` JSON for `QUICK_ACCESS_MENU` in the `keyValue` table — no app release required, picked up within 30 min (cache TTL) or immediately on next cold start after cache expiry

### 2026-05-06 — Payment mode toggle (Play Store gating)
**Why:** Google Play Store may reject apps that show direct off-platform payment for digital subscriptions (QR/UPI). Strategy: gate the QR view behind a backend feature flag, ship with `CONTACT` mode (a "Talk to a Relationship Manager" callback flow) for review, then flip to `QR` once approved.

**New files:**
- `components/RelationshipManagerView.tsx` — hero + plan summary + callback form + tap-to-call/WhatsApp + success state
- `VaibhavVivaahaBackend/.../models/CallbackRequest.java`, `repositories/CallbackRequestRepository.java`, `services/CallbackRequestService.java`, `controllers/CallbackRequestController.java`
- `VaibhavVivaahaBackend/seed-payment-mode.sql` — seed rows for `PAYMENT_MODE` and `ADMIN_CONTACT` keyValue entries

**Modified:**
- `app/(root)/screens/PaymentScreen.tsx` — fetches `PAYMENT_MODE` keyValue on mount, caches in AsyncStorage 5 min, early-returns `<RelationshipManagerView/>` when mode is CONTACT. Existing QR/verification views untouched. `paymentRequestId` route param forces QR mode (so resuming pending payments still works).
- `app/(root)/api/userApi.js` — added `getPaymentMode`, `getAdminContact`, `createCallbackRequest`, `getMyCallbackRequests`

**New endpoints:**
- `GET /keyValue/getKeyValueByKey/PAYMENT_MODE` — returns `{mode: 'QR'\|'CONTACT'}`
- `GET /keyValue/getKeyValueByKey/ADMIN_CONTACT` — returns `{phone, whatsapp, rmName, rmTitle, rmPhotoUrl, callbackHours}`
- `POST /callback-request/create/{encodedUserId}` — body `{name, mobile, email?, planInterested, note?, bestTimeToCall?}`
- `GET /callback-request/my/{encodedUserId}` — paginated user's own callback requests
- `GET /callback-request/admin/list` + `POST /callback-request/admin/{id}/status` — admin list + status update

**New AsyncStorage key:** `paymentModeCache`

**Deploy steps:**
1. Deploy backend (Hibernate auto-creates `callback_requests` table)
2. Run `seed-payment-mode.sql` to insert default keyValue rows (mode = `CONTACT`)
3. Submit app to Play Store; users see RM view
4. After approval: `UPDATE keyValue SET valueColumn = '{"mode":"QR"}' WHERE keyColumn = 'PAYMENT_MODE'` — existing app users transition to QR view within 5 min (cache TTL)

### 2026-04-09 — Deeper PARENT scope guard + edit-modal cleanup
- `components/tabs.tsx` — `FirstRoute` reads `userRole` from AsyncStorage, blocks all section-edit entry points (`PersonalDetail`, `ReligiousDetail`, `EducationalDetail`, `FamilyDetail`) with `popup.error('Not allowed', ...)` for parent sessions
- `components/tabs.tsx` — wrong `Alert.alert('Image updated successfully')` after a text-section save replaced with `popup.success('Updated', '{section} updated successfully.')` using dynamic section label map
- `components/tabs.tsx` — error fallback now uses `popup.error` instead of `Alert.alert`
- `app/(root)/(tabs)/profile.tsx` — About edit button + `handlePickImage` profile photo flow both now block parent sessions with `popup.error` (prevents the earlier bug where a parent logged in and successfully called `POST /user-details/updateAboutByUserId`)

### 2026-04-08 — Subscription matrix + Family Login (Option A)
**New screens**:
- `app/(root)/screens/MyRequestsScreen.tsx` — service requests list with status chips
- `app/(root)/screens/FamilyAccessScreen.tsx` — Gold+ family member management

**Modified screens**:
- `app/(root)/(main)/LoginScreen.tsx` — persists `userRole`, `familyLoginId`, `parentName`, `relationship`
- `app/(root)/(tabs)/mailBox.tsx` — added `WhoShortlistedMeTab` component + Gold+ 4th tab via `useMemo` route conditional
- `app/(root)/screens/ProfileDetail.tsx` — verification badge next to name, WhatsApp share (Gold+), Voice Call request CTA (Silver+), photo gate in `openImageModal`
- `app/(root)/screens/SearchTabs.tsx` — plan badge overlay on result cards
- `app/(root)/screens/settingsPage.tsx` — Family Access menu entry (Gold+), PARENT scope guard with banner
- `app/(root)/screens/PremiumTab.tsx` — Tamil taglines + plan descriptions, Bronze→Classic rename, friendly feature labels
- `components/swiperprofile.js` — Free blur overlay, plan colored badges, verified checkmark

**New API methods (`app/(root)/api/userApi.js`)**:
- `getWhoShortlistedMe(encodedId, page, size)`
- `createServiceRequest(encodedUserId, requestType, note)`
- `getMyServiceRequests(encodedUserId, page, size)`
- `createFamilyLogin(encodedUserId, body)`
- `getMyFamilyLogins(encodedUserId)`
- `revokeFamilyLogin(encodedUserId, familyLoginId)`
- `getProfileDetailByUserId(userId, requesterId)` — added optional second arg

**New AsyncStorage keys**: `userRole`, `familyLoginId`, `parentName`, `relationship`

**Doc refresh 2026-04-08 (post-write)**: backfilled `constants/` directory, brand colors, `EXPO_PUBLIC_WS_URL`, plus AsyncStorage keys missed in v1: `email`, `resetPhoneNumber`, `resetEmail`, `deviceId`, `masterData`, `promo_seen_{bannerId}`.

## 19. Deferred / not implemented
- **Real in-app voice/video calling UI** — only the request CTA exists; backend handles via ServiceRequest.
- **Parent-mode hard lockdown** — only `settingsPage.tsx` enforces the PARENT scope guard. `ProfileDetail` "Edit" buttons, `PaymentScreen`, etc. could also check `userRole === 'PARENT'` and hide. Currently relies on the parent simply not seeing the entry points.
- **OTP for parent login creation** — currently the primary user just types a PIN and shares it out-of-band. No SMS to parent.
- **Multi-parent limit** — Gold/Platinum can add unlimited family logins. Add a `MAX_FAMILY_LOGINS` cap if abused.

## 20. Session protocol
1. **READ this CLAUDE.md FIRST.** It is the source of truth for this project.
2. **READ the matching CLAUDE.md in sibling repos** when your change crosses the frontend/backend/admin boundary:
   - `/Users/prodian/Documents/Personal/VaibhavVivaahaApp/CLAUDE.md` (this file)
   - `/Users/prodian/Documents/Personal/VaibhavVivaahaBackend/CLAUDE.md`
   - `/Users/prodian/Documents/Personal/adminpanel/CLAUDE.md`
3. **Make your changes.**
4. **UPDATE this file before ending the session** — add new screens (section 8.1), new API methods (section 8.6), new AsyncStorage keys (section 14), new gates (section 10), new contexts (section 8.5), or routes (section 15). Append a new dated entry to **section 18** describing what changed and why.
5. **If you add a new plan-gated UI element**:
   - Add it to section 10 with the gate condition
   - If it consumes a new backend endpoint, also document in section 16 cross-repo contracts (and the backend's `CLAUDE.md` needs the matching update)
6. **Stale CLAUDE.md = future session breaks.** Don't skip the update.
