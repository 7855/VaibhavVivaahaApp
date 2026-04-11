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
│       │   ├── mailBox.tsx                     # Inbox + Gold+ "Shortlisted You" tab ⭐
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
| id | title    | price ₹ | duration | tagline (Tamil)               |
|----|----------|---------|----------|--------------------------------|
| 1  | Free     | 0       | lifetime | உங்கள் பயணம் தொடங்குகிறது      |
| 2  | Starter  | 199     | 30d      | முதல் அடி எடுங்கள்             |
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
| `SearchResult.tsx` | Legacy result list | — |
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
| **`mailBox.tsx`** ⭐ | TabView: Received / Sent / Permissions / **"Shortlisted You" (Gold+ only)**. Contains `WhoShortlistedMeTab` component locally | Yes |
| `myChatList.tsx` | Conversation list | — |
| `profile.tsx` | Self profile + stats | — |

### 8.3 Auth screens (`app/(root)/(main)/`)
| File | Purpose |
|---|---|
| `_layout.tsx` | Pre-login stack |
| `index.tsx` | Landing / splash |
| `LoginScreen.tsx` ⭐ | Mobile + PIN login. **Persists `userRole`, `familyLoginId`, `parentName`, `relationship` from response** |
| `sign-up.tsx` | Multi-step registration |
| `OTPValidationScreen.tsx` + `otpVerification.tsx` | OTP entry |
| `ChangePinScreen.tsx` | First-time PIN setup |
| `ResetPasswordScreen.tsx` | Forgot PIN flow |
| `SetNewPasswordScreen.tsx` ⭐ | New PIN entry post-OTP |
| `ProfileUnderVerificationScreen.tsx` ⭐ | Shown when user's profile is PENDING admin approval |

### 8.4 Components (`components/`)
| File | Purpose |
|---|---|
| **`swiperprofile.js`** ⭐ | Horizontal carousel of profile cards. **Free viewers see blur overlay + lock icon. Plan badges (Silver/Gold/Platinum) with verified checkmark.** Reads `useSubscription` |
| `ExploreProfileCard.tsx` | Generic profile card used in SearchTabs grid |
| `ExploreTabs.tsx` | Tab bar wrapper |
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
| `editProfileModal.tsx` | Profile edit modal |
| `HappyStoryCard.tsx` | Testimonial card |
| `NotificationCard.tsx` / `NotificationFilter.tsx` / `NotificationHeader.tsx` / `notification.ts` | Notification UI |
| `Search.tsx` | Search bar |
| `SkeletonCard.tsx` | Loading skeleton |
| `FooterMessage.tsx` | Footer text |
| `listchats.js` | Chat list rendering |

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
| **Gold+ "Shortlisted You" mailbox tab** | `app/(root)/(tabs)/mailBox.tsx` `routes` array | `planTitle === 'Gold' \|\| planTitle === 'Platinum'` | Don't append the tab |
| **Family Access settings entry** | `app/(root)/screens/settingsPage.tsx` | `planTitle === 'Gold' \|\| planTitle === 'Platinum'` AND `userRole !== 'PARENT'` | Hide menu item |
| **PARENT scope guard** | `app/(root)/screens/settingsPage.tsx`, `app/(root)/(tabs)/profile.tsx`, `components/tabs.tsx` | `userRole === 'PARENT'` (read from AsyncStorage) | Settings: hide Privacy / Change PIN / Family Access + banner. Profile tab: block About edit button, PersonalDetail/ReligiousDetail/EducationDetail/FamilyDetail edit buttons, profile photo change — all show `popup.error('Not allowed', ...)` instead |
| **Star Match premium check** | `app/(root)/screens/ProfileDetail.tsx`, `settingsPage.tsx` | `!isPremiumValue` / `!planTitle \|\| planTitle === 'Free'` | `popup.premiumRequired(...)` + return |
| **Saved-search premium filter** | `app/(root)/screens/SearchTabs.tsx` `handleUseSearch` | `hasPremiumFeatures && !isPremiumUser` | `popup.premiumRequired(...)` + return |
| **Adv search filter UI** | `app/(root)/screens/SearchTabs.tsx` | `subscriptionData.entitlements.advSearch === true` (sets `isPremiumUser`) | (silent backend degrade in `filterUsers`) |
| **Photo viewer / Horoscope / SecureConnect** | Backend masks fields directly; frontend just renders whatever comes back | (no frontend gate needed) | `mobile`/`email`/`horoscope` are null or masked from server |

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
    /mailBox                       (Gold+ adds 4th "Shortlisted You" tab)
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

## 18. Recent changes log (rolling, newest first)
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
