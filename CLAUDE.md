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
| `PremiumTab.tsx` | Plan card list with Tamil taglines + descriptions, Razorpay checkout entry | — |
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
| `HelpSupportPage.tsx` | Contact support | — |
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
| **`RelationshipManagerView.tsx`** ⭐ NEW | Play Store-safe alternative to QR payment screen. Renders inside `PaymentScreen.tsx` when `PAYMENT_MODE='CONTACT'`. Hero card + plan summary + callback request form (name, mobile, time slot, note) + tap-to-call/WhatsApp + success state. |
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
| **Payment mode toggle (Play Store gating)** | `app/(root)/screens/PaymentScreen.tsx` early return | Backend `keyValue.PAYMENT_MODE === 'CONTACT'` (default; cached 5 min in AsyncStorage `paymentModeCache`) | Render `<RelationshipManagerView/>` instead of QR/UPI screen. Existing `paymentRequestId` route param forces QR view regardless (resume in-flight payments). |
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
| **`paymentModeCache`** ⭐ | `app/(root)/screens/PaymentScreen.tsx` | `app/(root)/screens/PaymentScreen.tsx` | JSON `{mode: 'QR'\|'CONTACT', expiresAt: epochMs}`. 5-min TTL. Avoids hitting `/keyValue/PAYMENT_MODE` on every PaymentScreen open. |
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
- **Exactly ONE `GestureHandlerRootView` in the whole app** — it lives in `app/_layout.tsx`, wrapping everything (outermost element, above `SafeAreaProvider`). `QuickAccessFAB.tsx` and `SupportFAB.tsx` used to each wrap their own draggable button in a second, full-screen `GestureHandlerRootView` — this is a known Android bug: a full-screen `GestureHandlerRootView` does NOT reliably honor `pointerEvents="box-none"` there, so it silently swallows every touch on screen except its own content (symptom: "I can't tap anything except the FAB" on Android only, iOS unaffected). Fixed 2026-07-08 by removing the per-component root views and using plain `View` + `GestureDetector` instead, relying on the single app-wide root. **Do not reintroduce a second `GestureHandlerRootView` anywhere** — new draggable/gesture components should just use `GestureDetector` directly.

## 18. Recent changes log (rolling, newest first)
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
