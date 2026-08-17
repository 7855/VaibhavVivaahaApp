# VVM Full-Stack Audit Report

Audit date: 2026-08-08. Frontend: `/Users/prodian/Documents/Personal/VaibhavVivaahaApp` (Expo SDK 54, expo-router 6, RN 0.81.4). Backend: `/Users/prodian/Documents/Personal/VaibhavVivaahaBackend` (Spring Boot, MySQL `vvm_db`).

Severity legend: 🔴 CRITICAL · 🟠 HIGH · 🟡 MEDIUM · ⚪ LOW

---

## Phase 0 — Project map

### Frontend structure (verified on disk)
- **Routing**: expo-router 6 file-based. `app/_layout.tsx` (providers + `QuickAccessFAB`) → `app/(root)/_layout.tsx` (auth wrapper) → `(main)/` pre-login stack, `(tabs)/` bottom tabs (index, explore, mailBox, myChatList, profile), `screens/` stack pushes (~30 screens).
- **API client**: `app/(root)/api/axiosClient.js` (Bearer injection + refresh-token interceptor), `app/(root)/api/userApi.js` (~130 methods, JS untyped).
- **State**: 5 React Contexts (`AuthContext`, `UserDataContext`, `subscriptionContext`, `PopupContext`, `MasterDataContext`) + AsyncStorage.
- **Realtime**: `app/(root)/services/webSocketService.ts` (SockJS/STOMP-ish).

### Backend structure (verified on disk)
- 40 controllers, 44 services, 43 JPA entities/repositories under `com.uravugal.matrimony`, ~254 endpoint mappings.
- Config: `SecurityConfig`, `JwtAuthenticationFilter`, `RateLimiter`, `GlobalExceptionHandler`, WebSocket configs. No Flyway/Liquibase — schema via `spring.jpa.hibernate.ddl-auto=update` (`application.properties:5`).

### Screen → endpoint map (primary calls)
| Screen | Endpoints |
|---|---|
| (tabs)/index (Home) | `GET /user/getDailyShuffledUsersByCaste/{casteId}/{gender}`, `GET /user/getTop30NewUsers/…`, `GET /user/getUserDetailByCasteIdAndLocation/…`, `GET /user-details/getProfileCompletion/{userId}`, `GET /notifications/getUnreadNotificationCount/{userId}` |
| (tabs)/explore → SearchTabs | `POST /user/filterUsers`, `GET /user/getUserDetailByCasteId/…`, `GET /user/getTop30NewUsers/…`, saved-search CRUD |
| (tabs)/mailBox | `GET /mailbox/received|sent|pending-received|accepted-received|rejected/{userId}`, `GET /restrictedFieldRequest/getRestrictedRequestsById/…`, `GET /mailbox/updateInterestRequestStatus/{id}/{status}` |
| (tabs)/myChatList | `GET /conversation/chatlist/{userId}` |
| (tabs)/profile | `GET /user/getUserByUserId/{userId}`, `GET /gallery/getAllImagesByUserId/…`, `GET /user-details/getProfileCompletion/…`, update-* endpoints |
| screens/ProfileDetail | `GET /user/getProfileDetailByUserId/{userId}?requesterId=`, `GET /interestRequest/checkInterestStatus/…`, `POST /interestRequest/sendInterestRequest/…`, `GET /mailbox/checkShortlisted/…`, `POST /view/viewedProfile/…`, `GET /block/checkBlockedByBlockedId/…` |
| screens/chatscreen | `GET /chat/conversation/{conversationId}`, `POST /chat/send`, `POST /chat/mark-as-read/…` + WebSocket |
| screens/PremiumTab | `GET /subscriptionPlans/getAllActivePlans`, `GET /planFeatures/matrix` |
| screens/PaymentScreen | `GET /keyValue/getKeyValueByKey/PAYMENT_MODE`, `POST /paymentrequest/create`, `GET /paymentrequest/getPaymentRequestsByUser/…` |
| screens/NotificationScreen | `GET /notifications/getAllNotifications/{userId}`, mark/delete endpoints |
| screens/ListUser | `GET /view/getProfileViewers/…`, `GET /mailbox/whoShortlistedMe/…`, `GET /interestRequest/getAcceptedInterestRequests/…` |
| Auth screens | `POST /user/login`, `POST /user/createUser`, `POST /auth/send-otp|verify-otp|forgot-password|reset-password`, `POST /user/sendOtp|verifyOtp|changePin` |

### DB schema summary (dumped live from `vvm_db`)
43 tables, all InnoDB, **all utf8mb4_0900_ai_ci** ✅ (Tamil-safe). 657 users / 516 user_details / 220 chats — small today, so every perf problem below is latent but will bite at scale.

Key tables: `users` (auth + profile core: otp INT, otp_created_at, pin, password, refresh_token, userStatus enum), `user_details` (JSON columns astroInfo/basicInfo/familyInfo/hobbies + FK to users — the **only** FK in the whole schema), `chats`, `conversations` (unique user_one_id+user_two_id), `interestRequest` (unique interestSend+interestReceived), `notifications`, `viewedProfile`, `user_subscriptions`, plus verification/subscription/support tables.

---

## Phase 4 (DB portion) — directly verified findings

### 🔴 DB-1: Virtually no secondary indexes — every hot query is a full table scan  ✅ **FIXED 2026-08-09**
Evidence — `information_schema.statistics` dump: `chats`, `notifications`, `viewedProfile`, `user_subscriptions`, `shortlisted_profiles`, `blockedUsers`, `contact_reveals`(partial) have **only** PRIMARY keys. `users` has only PRIMARY + unique(memberId).

`EXPLAIN` (run live) confirms table scans on all 6 hottest queries:
- `SELECT * FROM chats WHERE conversationId=? AND isActive='Y'` → **Table scan on chats** (used by `ChatRepository.java:38,73` and unread counts at `:18,28`)
- `SELECT * FROM notifications WHERE receiverId=? ORDER BY createdAt DESC` → **Table scan + filesort** (`NotificationRepository.java:17`)
- `SELECT * FROM users WHERE casteId=? AND isActive='Y' AND isUser!='ADM' ORDER BY RAND()` → **Table scan + sort by rand()** (`UserRepository.java:30`)
- `viewedProfile WHERE userIdValue=?` → table scan (`ViewedProfileRepository.java:11`)
- `user_subscriptions WHERE userId=? AND status='ACTIVE'` → table scan
- `interestRequest WHERE interestReceived=?` → table scan (unique index only covers `interestSend` prefix)

**Applied 2026-08-09** — 13 indexes created; re-ran EXPLAIN and all hot queries now do index lookups instead of table scans:
`chats` cost 26 → 0.7 · `notifications` 28.6 → 3.85 (filesort eliminated, reverse index scan) · `interestRequest` 16.6 → 0.35 · `user_subscriptions` 7.1 → 0.35.

**DDL applied** (column names corrected against the live schema — `blockedUsers` uses `blockedByUserId`/`blockedUserId`, `shortlisted_profiles` uses `shortlistedBy`/`shortlistedUserId`):
```sql
ALTER TABLE chats ADD INDEX idx_chats_conv (conversationId, isActive, isRead);
ALTER TABLE notifications ADD INDEX idx_notif_receiver (receiverId, createdAt);
ALTER TABLE users ADD INDEX idx_users_discovery (casteId, gender, isActive, userStatus);
ALTER TABLE viewedProfile ADD INDEX idx_viewed_user (userIdValue), ADD INDEX idx_viewed_by (viewedBy);
ALTER TABLE user_subscriptions ADD INDEX idx_usub_user (userId, status);
ALTER TABLE interestRequest ADD INDEX idx_ir_received (interestReceived);
ALTER TABLE blockedUsers ADD INDEX idx_block_by (blockedBy), ADD INDEX idx_block_id (blockedId);
```

### 🟠 DB-2: `ORDER BY RAND()` in discovery queries
`repositories/UserRepository.java:30,38,41` — three JPQL queries end in `ORDER BY RAND()` (daily shuffle / random users / ten shuffled). MySQL must materialize + sort the whole filtered set per request; O(n log n) per call, kills the matches feed at scale and makes pagination non-deterministic (duplicates/gaps between pages). Java-side seeded `Collections.shuffle(…, new Random(seed))` already exists at `UserService.java:450,1725` and `DailyMatchScheduler.java:144` — the right pattern. **Fix**: replace `ORDER BY RAND()` with `ORDER BY u.userId` + seeded shuffle of a bounded page, or a keyset/seeded-hash ordering (`ORDER BY MD5(CONCAT(userId, :seed))` equivalent) for deterministic pagination.

### 🟠 DB-3: No foreign keys anywhere except `user_details.userId`
Verified via `SHOW CREATE TABLE` on chats/notifications/viewedProfile/user_subscriptions/interestRequest — zero FK constraints (only `user_details` has one). Orphan rows are possible in every relationship table (e.g. chats for deleted conversations, interest rows for deleted users — and `/user/deleteAccount` exists). **Fix**: add FKs where data is already clean; at minimum add app-level cascade deletes in `deleteAccount`.

### ⚪ DB-4: Charset — PASS
All 43 tables and all string columns are `utf8mb4` / `utf8mb4_0900_ai_ci` (verified via information_schema query returning zero non-utf8mb4 columns). Tamil text is safe end-to-end at the DB layer.

### 🟡 DB-5: Schema managed by `ddl-auto=update` with no migrations
`application.properties:5` — no Flyway/Liquibase. Hibernate `update` never drops/renames and can't add the indexes above. Index DDL must be applied manually (script provided in DB-1).

---

*(Phases 1–3 and backend-code portion of Phase 4 are appended below as their audits complete.)*

---

## Phase 1 — Navigation audit

Navigator: expo-router ~6.0.5 over @react-navigation v7 (`package.json:31-34,54`). Tabs are lazy by default and never remount on switch; `enableFreeze(true)` is set at `app/_layout.tsx:17`. The problems are refetch-on-focus storms and config-level flicker, not remounting.

### Navigation map
```
app/_layout.tsx            providers + <Stack headerShown:false> + global QuickAccessFAB
├── app/index.tsx          one-shot AsyncStorage auth check → <Redirect>
└── app/(root)/_layout.tsx plain <Stack> — NO auth guard (see NAV-1)
    ├── (main)/            pre-login stack (9 screens)
    ├── (tabs)/            <Tabs> custom bar VVMFooterNav; gated by hasStarted state
    │   ├── index (Home)  ├── explore  ├── myChatList  ├── mailBox (inner TabView ×3)  └── profile
    └── screens/           stack pushes (~21 screens), slide_from_right 300ms
```

### 🔴 NAV-1: No auth protection on `(root)` layout — deep links bypass login
`app/(root)/_layout.tsx:7-13` is a plain `<Stack>`; the only auth gate is the one-shot check in `app/index.tsx:10-37`, which runs only when `/` renders. Any deep link or push-notification route landing directly in `(tabs)`/`screens` skips authentication entirely. **Fix**: auth guard (redirect when no userId) inside `app/(root)/_layout.tsx`.

### 🔴 NAV-2: mailBox fires 6 API calls on every tab focus, all sub-tabs at once
`react-native-tab-view` at `mailBox.tsx:1423` has no `lazy` prop → all 3 scenes mounted; each scene's `useFocusEffect` keys off the whole screen's focus: ReceivedTab `mailBox.tsx:326-341` (3 calls via Promise.all), SentTab `:569-578` (1), RequestsTab `:752-756` (2). Every return from ProfileDetail = 6 requests + skeleton flash (`setLoading(true)` at `:330`). **Fix**: `<TabView lazy>`, fetch only for the active sub-tab, silent refresh when data exists.

### 🟠 NAV-3: Home re-renders whole tree every second
`index.tsx:330-334` — 1s `setInterval(updateCountdown)` setting top-level `timeLeft` state; consumer is a single Text at `:819`. Whole Home (5 snap-carousel shelves + gradients) re-renders 60×/min. **Fix**: extract `<MidnightCountdown/>` owning its own state.

### 🟠 NAV-4: `getProfileCompletion` fetched 3× on Home mount, 2× per focus
`index.tsx:250-258` (focus), `index.tsx:295-310` (mount), and `components/ProfileCompletionBar.tsx:32-45` (focus) all hit the same endpoint. **Fix**: single owner (the widget).

### 🟠 NAV-5: Profile tab — 5 uncached calls on every focus, no cleanup
`profile.tsx:232-240` `Promise.allSettled` of 5 stats calls on each focus with no throttle (sibling profile fetch at `:202-206` IS throttled) and no `isActive` guard → stale-wins races. **Fix**: same `lastFetchRef` throttle + active flag.

### 🟠 NAV-6: `screens/_layout.tsx` global header flicker
`screens/_layout.tsx:6-14` computes `showHeader` from the deepest segment and applies it to the whole Stack's `screenOptions` — pushing chatscreen hides SearchTabs' header mid-transition; inline `headerLeft` factory at `:28`. **Fix**: static `screenOptions` + per-screen `<Stack.Screen options>`.

### 🟠 NAV-7: `hasStarted` gate can render tabs with no footer at all
`(tabs)/_layout.tsx:28-47`: `hasStarted===null` → blank frame; `false` → `tabBar={undefined}` while the default bar is hidden by `tabBarStyle:{display:'none'}` (`:45`) → no navigation UI; inline tabBar closure recreated per context change. **Fix**: unconditional stable tabBar component.

### 🟠 NAV-8: Focus-fetchers without cleanup (stale setState) — 7 sites
`mailBox.tsx:326,569,752`; `profile.tsx:232`; `settingsPage.tsx:85`; `ProfileCompletionBar.tsx:32`; (`sign-up.tsx:300` benign). Correct pattern already exists at `index.tsx:234-265`. Count: **7**.

### 🟡 NAV-9: JSON.stringify'd objects as router params (3 sites)
`ProfileDetail.tsx:838`, `StarMatch.tsx:248`, `SearchTabs.tsx:360-362`. Small today; breaks deep-link restore if they grow. Pass IDs instead.

### 🟡 NAV-10: In-tab auth fallback uses `router.push` (back returns into "protected" Home) and its condition skips `null` userId — `index.tsx:338-343`. Moot once NAV-1 fixed.

### 🟡 NAV-11: Jank contributors
Always-on `BlurView` in tab bar (`VVMFooterNav.tsx:127`, costly on Android); inline tabBar/headerLeft closures; `onStatRefresh` inline closure with 7 calls (`index.tsx:568-592`); full-res images in 260px mailBox cards (`mailBox.tsx:471,1646`); deprecated `react-native-snap-carousel` on 5 Home shelves.

### ⚪ NAV-12: Back behaviour — no BackHandler listeners anywhere (only a NativeBase polyfill at `app/_layout.tsx:1-6`); Android back uses navigator defaults. No leaks. Set `backBehavior="initialRoute"` explicitly.

### Target tab config
Stable module-level `FooterTabBar` component; `<Tabs screenOptions={{headerShown:false, lazy:true, freezeOnBlur:true}} backBehavior="initialRoute">`; drop the `hasStarted` gate; mailBox `TabView lazy` + per-sub-tab fetching.

---

## Phase 2 — Fast fetching

**Caching/dedup: none.** No query library (grep `react-query|tanstack|swr` → nothing). Only ad-hoc TTLs: `profile.tsx:24` (30s), `QuickAccessFAB.tsx:49` (30m), `paymentModeCache` (5m), `MasterDataContext` (AsyncStorage). No in-flight dedup anywhere.

- 🔴 F-1 Home `index.tsx`: ~11 requests on cold mount; `getProfileCompletion` fetched 2× (`:250-258` + `:295-310`), subscription 2× (`:354` + `:423-426`), unread count 3 call sites (`:240,406,577`); dead `fetchHappyStories` (`:270-280`) feeds JSX that is commented out (`:1108-1161`).
- 🔴 F-2 Waterfall: `SearchTabs.tsx:605-616` fetches 8 keyValue configs **serially in a for-loop** (~1.6s at 200ms RTT). `getAllKeyValues()` already exists (`userApi.js:430`).
- 🔴 F-3 Pagination: zero `onEndReached` in the whole app. "Who Shortlisted You" (paid Gold+ feature) silently capped at 10 rows forever (`ListUser.tsx` calls `getWhoShortlistedMe(userId)` → default `page=0,size=10` at `userApi.js:90`). Chat thread refetched in full on every send/receive/read (`chatscreen.tsx:560,600,749`).
- 🟠 F-4 Waterfalls: `chatscreen.tsx:468-493` (3 serial independent calls, messages load last); `index.tsx:354→385→405` (3 sequential phases, independent).
- 🟠 F-5 Over-fetch: `ListUser.tsx:42-58` list DTO includes `mobile`/`email` never rendered for most types; Home fetches 30-item lists to render 7 (`index.tsx:398-403`).
- 🟠 F-6 Lists: full-res image URLs into 55–150px slots (`swiperprofile.js:103`, `mailBox.tsx:471`, `listchats.js:76`). keyExtractor ✅ everywhere; windowing ✅; `getItemLayout` only on PremiumTab.
- 🟠 F-7 Pull-to-refresh nukes list: `ListUser.tsx` `loadProfileData` clears `setData([])` before fetch; mailBox Received flashes skeleton on every focus (`mailBox.tsx:330`).
- 🟠 F-8 `myChatList.tsx:194-197`: full chat-list refetch per incoming WS message.
- 🟡 F-9 `ProfileDetail.tsx:367-378`: fetches 50 service requests per profile visit to answer one boolean.

## Phase 3 — Leaks & mistakes (counts)

- 🔴 M-1 **JWT disabled client-side**: `axiosClient.js:17-33` — auth header injection and the entire refresh/forceLogout interceptor commented out; every request goes out unauthenticated (pairs with backend S1).
- 🔴 M-2 **PII logging**: `axiosClient.js:37` logs **every API response body** (profiles, chats, OTP flows) to console/logcat; `SettingPageChangePin.tsx:47` logs change-PIN response. 73 active console.logs; 9 log sensitive data (`index.tsx:519`, `usePushNotification.tsx:36-37,88`, `listProfile.tsx:91`, `chatscreen.tsx:422`, `sign-up.tsx:273`, `SearchTabs.tsx:1495-1502`).
- 🔴 M-3 **`.env` committed to git** (verified `git ls-files`); ngrok fallback hosts baked in: `axiosClient.js:5` and `webSocketService.ts:13` (`bf66-3-110-153-18.ngrok-free.app` — recycled ngrok domain = exfil hazard). `AddOnPaymentScreen.tsx:25` hardcodes UPI handle.
- 🔴 M-4 **AppState stale closure**: `AuthContext.tsx:161-176` — `[]`-dep effect captures mount-time `handleAppStateChange` with `userId=null` → background `lastSeen` never fires for same-session logins.
- 🟠 M-5 Contexts: **5 of 5 providers** recreate `value` object per render (`AuthContext.tsx:292` — 7 unmemoized functions; `subscriptionContext.tsx:104-108`; `UserDataContext.tsx:129`; `MasterDataContext.tsx:45`; `PopupContext.tsx:138`) — a popup open/close re-renders the whole app tree.
- 🟠 M-6 List rows: 6 lists with inline non-memoized renderItem (`chatscreen.tsx:1046` — every keystroke re-renders every message bubble; `mailBox.tsx:465,617,1157`; `ListUser.tsx`; `NotificationScreen.tsx:286`). Reference-correct impl exists: `listchats.js:29`.
- 🟠 M-7 WebSocket: single-slot listener map (`webSocketService.ts:20,192`) — any third `chat_message` consumer silently evicts others; reconnect timer not cancelable (`:115-120`).
- 🟡 M-8 Timers: 16/16 effect-registered subscriptions have cleanup ✅; 10 untracked handler-scope setTimeouts, 6 setState-after-unmount risks (`HelpSupportPage.tsx:26`, `AddOnPaymentScreen.tsx:75`, `PaymentScreen.tsx:309`, `LoginScreen.tsx:40` dead sim path, `SupportFAB.tsx:106`).
- 🟡 M-9 AbortController: **0 usages**; exactly 1 fetch site has an `isActive` guard (`index.tsx:234-265`).
- 🟡 M-10 Silent catches: **46**; worst: like/unlike (`ProfileDetail.tsx:630-633`), payment-screen plan resolution (`UpgradePlanScreen.tsx:50-53`).

## Phase 4 — Backend (code)

- 🔴 S-1 **All security off**: `SecurityConfig.java:33-38` — `anyRequest().permitAll()`, JWT filter never registered. Entire API anonymous.
- 🔴 S-2 **No role checks**: zero `@PreAuthorize`/`hasRole` in codebase; `/admin/**` (approve users, grant subscriptions `AdminService.java:603-612`, overwrite profiles) open to anyone; even with JWT on, normal users could call admin APIs.
- 🔴 S-3 **IDOR everywhere**: requester identity is client-supplied. `getUserById` returns raw entity with mobile/email (`UserService.java:283-288`); `GET /user/getAllUsers` dumps the whole users table (`:263`); masking keyed off client `requesterId` param (`UserService.java:322`); `revealContact` charges any spoofed viewer (`UserController.java:424-437`); **`DELETE /user/deleteAccount/{id}` lets anyone wipe any account** (`UserService.java:1327-1384`); **`POST /user/changePin` changes any user's PIN with only their mobile number** (`UserService.java:141-168`); chat history by sequential conversationId with no participant check (`ChatController.java:35-46`); `POST /chat/send` trusts body `senderId`.
- 🔴 S-4 **PINs Base64 "encrypted"** (`EncryptionUtils.java:6-12`), admin API returns the stored PIN (`UserRepository.java:304` + `AdminService.java:215`); only reset flow BCrypts.
- 🔴 S-5 Mass assignment: `POST /user/saveOrUpdateUser(@RequestBody UserEntity)` (`UserController.java:74-85`) — attacker-settable `isUser` role, `userStatus`, `pin`.
- 🔴 S-6 **OTP returned in HTTP responses** (`AuthService.java:115-119` "DEV MODE", `UserService.java:126`); mobile-OTP flow has no expiry (`UserService.java:184` equality only), no rate limit; 4-digit `Random` OTPs; verify endpoints unlimited-attempt brute-forceable.
- 🔴 S-7 Hardcoded JWT secret default in code (`JwtUtil.java:18`), no `jwt.secret` in properties; live R2/Razorpay/Zeptomail secrets committed (`application.properties:24-46`, git-tracked).
- 🔴 L-1 `UserService.java:883` `System.out.println("User request: " + request)` — signup PIN + full PII to stdout.
- 🟠 S-8 CORS `*` (`SecurityConfig.java:46-49`). 🟠 S-9 Approval gate only at login — PENDING/REJECTED profiles still served by discovery/filter/getUserById (`UserRepository.java:73-74,195-196,341-342`). 🟠 S-11 RateLimiter unbounded map, only guards 2 auth endpoints; login has no rate limit (`RateLimiter.java:13`).
- 🔴 P-1 N+1 at serialization: `UserEntity.userDetail` `@OneToMany` (`UserEntity.java:141-143`) serialized on every list endpoint (OSIV on) → 31 queries per 30-card response + leaks full user_details (horoscope/family/income) into discovery payloads.
- 🟠 P-2 Mailbox: 2 queries/row in `.map()` ×6 loops (`InterestRequestService.java:102-107` et al). 🟠 P-3 hobby matching queries user_details per candidate for whole caste (`UserService.java:1710-1714`). 🟠 P-4 admin list enrichment loops (`AdminService.java:932-940,1071-1077`).
- 🟠 T-2 Unbounded endpoints: `getAllUsers` (`findAll()`), `filterUsers` (no LIMIT), full chat history, admin dashboard calls `findAll()` ×3 (`AdminService.java:649-666`).
- 🟡 T-1 Zero `@Transactional(readOnly=true)`. 🟡 C-1 No Hikari tuning/compression/OSIV-off. 🟠 R-1 `ORDER BY RAND()` ×3 (see DB-2). 🟠 memberId generation race (`UserService.java:1024-1036`, dup `AdminService.java:519-527`).
- SQL injection: none found (all parameterized). ✅

## VVM checkpoints status

| Checkpoint | Status |
|---|---|
| Zeptomail OTP: expiry, single-use, rate-limited | ⚠️ PARTIAL — `/auth` flow: 5-min expiry + single-use ✅ (`AuthService.java:149-165`) but verify not rate-limited, OTP echoed in response (S-6). Mobile `/user` flow: ❌ no expiry, no rate limit, OTP in response |
| Mobile numbers trusted without OTP verification | ❌ FLAGGED — `changePin` trusts bare mobile (account takeover, S-3) |
| call_requests: valid transitions, no phone before approval | ✅ transitions constrained (`ServiceRequestService.java:240`); phone only in admin listing — but admin path is unauthenticated today (S-1/S-2) |
| Admin approval gate on every profile endpoint | ❌ only at login/refresh (S-9) |
| Recommendations: no ORDER BY RAND | ❌ 3 queries (DB-2/R-1) |
| Tamil utf8mb4 end-to-end | ✅ DB fully utf8mb4 (DB-4) |

## Top-10 quick wins (≤1h each)

1. Re-enable JWT: uncomment filter registration + route rules (`SecurityConfig.java:33-38`) and client header injection (`axiosClient.js:17-33`).
2. Delete OTP echo lines (`AuthService.java:117`, `UserService.java:126`) + `System.out.println` of signup request (`UserService.java:883`).
3. `__DEV__`-gate/remove response-body logger (`axiosClient.js:27-37`).
4. Replace ngrok fallbacks with prod host; `git rm --cached .env` + gitignore.
5. Apply the index DDL script (DB-1).
6. Parallelize SearchTabs keyValue fetches (`Promise.all`).
7. Delete dead happyStories fetch + dedupe Home's duplicate fetches.
8. Memoize the 5 context values.
9. `.requestMatchers("/admin/**").hasRole("ADM")` once JWT is on.
10. Hikari/compression properties block (C-1).

Structural: identity-from-JWT refactor across all controllers (S-3); BCrypt migration (S-4); DTO projections for discovery lists (P-1); TanStack Query adoption; pagination + thumbnails; Flyway.

*(Phase 5 fix implementation deferred at user request — see conversation 2026-08-09.)*

---

# IMPLEMENTATION LOG — 2026-08-09

Work delivered against this report plus two additional client asks (DB-driven plan retirement, subcaste feature). Full narrative in each repo's `CLAUDE.md` (2026-08-09 entry). **Nothing was committed** — all changes are in the working tree for review, alongside pre-existing uncommitted work.

## Fixed
| ID | Item | Verification |
|---|---|---|
| DB-1 | 13 indexes on hot tables | `EXPLAIN`: chats 26→0.7, notifications 28.6→3.85 (filesort gone), interestRequest 16.6→0.35, user_subscriptions 7.1→0.35 |
| C-1 | HikariCP sizing/timeouts + gzip | `Content-Encoding: gzip` confirmed on a live response |
| NAV-2 | mailBox 6-calls-per-focus + skeleton flash | `TabView lazy`, per-sub-tab fetching, `isActive` cleanup, memoized rows |
| NAV-3 | Home re-rendering every second | Countdown extracted to its own component |
| NAV-4 | `getProfileCompletion` ×3 | Single owner (`ProfileCompletionBar`), 30s throttle + unmount guard |
| NAV-5/8 | Uncached focus fetches, stale-setState races | Throttles + `isActive` guards |
| NAV-6 | Stack-wide `headerShown` flicker | Static `screenOptions` + per-screen options |
| NAV-7 | `hasStarted` gate could render **no footer nav** | Gate deleted; stable module-level tab bar; `lazy`/`freezeOnBlur`/`backBehavior` |
| NAV-11 | Android BlurView compositing every frame | iOS-only BlurView |
| F-1/F-4 | Home: 11 requests, 3 serial phases, dead fetch | One parallel round; duplicates and dead `fetchHappyStories` removed |
| F-2 | SearchTabs 8 serial keyValue calls (~1.6s) | Parallelized |
| F-3 | **"Who Shortlisted You" silently capped at 10** (paid feature) | Real pagination: `onEndReached`, footer spinner, in-flight guard, page reset on refresh |
| F-7 | Pull-to-refresh blanked the list | `setData([])` only on tab change |
| F-8 | Full chat-list refetch per incoming message | Patches the affected row |
| M-2 | Response-body logging (PII → logcat) | All axios logging behind `__DEV__` |
| M-4 | AppState stale closure (`lastSeen` never fired) | Ref-based |
| M-5 | 5/5 contexts recreating value each render | `useMemo` + `useCallback` |
| M-6 | Non-memoized list rows (chat re-rendered per keystroke) | `MessageBubble`, `ProfileRow`, mailBox rows memoized |
| — | 3 latent bugs found in committed code | `styles.filterButtonText` undefined and `alignItems:'evenly'` invalid (mailBox); dead `.fromNow` ternary (ListUser) |

**Result:** `npx tsc --noEmit` **63 errors, down from 66** — normalized diff shows only removals, zero new errors. Backend compiles, boots in ~9s with no schema DDL.

## Added
- **DB-driven plan catalog** — retiring/re-activating a plan is now purely `UPDATE subscription_plans SET isActive=...`. ~25 hardcoded upsell strings across 14 files resolve through `resolveMinPlanTitle()`. Backend refuses to create a subscription on a retired plan (`SUBSCRIPTION_PLAN_INACTIVE`) while grandfathered members keep full entitlements. Verified live in both directions.
- **Subcaste** — `subcastes` table + `users.subcasteId`, two endpoints, filter support in both search queries, and UI in signup / search / profile / profile-detail / edit-modal. Table intentionally empty; all UI hides itself until real data is seeded. `filterUsers` verified backward-compatible.
- Also fixed: `profile.tsx` and `ProfileDetail.tsx` displayed a hardcoded `Caste: "SC"` for every member.

## NOT fixed — still open
All 🔴 security findings stand: backend `SecurityConfig` is `anyRequest().permitAll()` with the JWT filter unregistered (S-1/S-2); the app's auth/refresh interceptor is commented out (M-1); OTPs are returned in API responses (S-6); PINs are Base64, not hashed (S-4); IDOR on `deleteAccount`/`changePin`/chat history (S-3); secrets and `.env` are committed (S-7/M-3); ngrok fallback hosts are in the bundle. Also open: N+1 serialization (P-1), unbounded endpoints (T-2), `ORDER BY RAND()` (DB-2/R-1), approval gate not enforced on discovery (S-9), no query-caching layer, no thumbnail images, no migrations.

**Production action required:** the 13 indexes exist only in local `vvm_db`. Hibernate cannot recreate them and there is no migration tool — apply the DB-1 DDL to every environment by hand.
