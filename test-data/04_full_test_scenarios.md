# VaibhavVivaaha — Complete Test Scenarios
> Covers every page · every plan · every caste · male & female  
> Based on full code review of mobile app, backend, and admin panel  
> Last verified: 2026-06-26 against DB planFeatures table + actual frontend gating code

## Key corrections from 2026-06-26 review
| # | Section | Was wrong | Now correct |
|---|---|---|---|
| 1 | TC-HOME-08, TC-PLAN-FREE | "Free plan photos blurred in carousel" | Photo blur removed from swiperprofile.js — all users see photos in home feed |
| 2 | TC-PLAN-STARTER | "Horoscope view: Visible" | **Blocked** — HOROSCOPE_VIEW starts at Classic |
| 3 | TC-PLAN-STARTER | "Chat: Blocked — upgrade to Silver" | **5 messages allowed** (MESSAGE:5 in Starter) |
| 4 | TC-PLAN-STARTER | "Star Match: Works" | **Blocked** — Star Match gate is viewPersonalInfo entitlement, Starter lacks it |
| 5 | TC-PLAN-STARTER | "Notifications: NOT sent" | **Sent** — Starter has NOTIFICATION_ALERT: enabled |
| 6 | TC-PLAN-CLASSIC | "Chat: Blocked — Silver+" | **Works** — Classic has MESSAGE: unlimited |
| 7 | TC-PLAN-CLASSIC | "Voice Call: Allowed (Classic+ gate)" | Button visible to Classic (frontend gate), service request created; VOICE_CALL DB feature starts at Silver |
| 8 | TC-MAIL-07 | "Gold has Shortlisted You tab" | Was a code bug — isGoldPlus computed but never added to routes. **Fixed** in mailBox.tsx |
| 9 | TC-DETAIL-07 | "Star Match: Starter+ can access" | Starter blocked; starts at Classic (BASIC) and Silver+ (FULL) |
| 10 | TC-CHAT-01 | "Starter → Starter: both blocked" | Both can send up to 5 messages (MESSAGE:5) |
| 11 | TC-INT-06 | "Starter blocked from chat" | Starter can send 5 messages before upgrade prompt |

---

---

## Test Accounts Quick Reference

| Caste | Plan | Male Mobile | Female Mobile | PIN |
|---|---|---|---|---|
| VANNIYAR | Free | 9111000001 | 9111000002 | 1234 |
| VANNIYAR | Starter | 9112000001 | 9112000002 | 1234 |
| VANNIYAR | Classic | 9113000001 | 9113000002 | 1234 |
| VANNIYAR | Silver | 9114000001 | 9114000002 | 1234 |
| VANNIYAR | Gold | 9115000001 | 9115000002 | 1234 |
| VANNIYAR | Platinum | 9116000001 | 9116000002 | 1234 |
| NAIDU | Free | 9121000001 | 9121000002 | 1234 |
| NAIDU | Starter | 9122000001 | 9122000002 | 1234 |
| NAIDU | Classic | 9123000001 | 9123000002 | 1234 |
| NAIDU | Silver | 9124000001 | 9124000002 | 1234 |
| NAIDU | Gold | 9125000001 | 9125000002 | 1234 |
| NAIDU | Platinum | 9126000001 | 9126000002 | 1234 |
| AADITRAVIDAR | Free | 9131000001 | 9131000002 | 1234 |
| AADITRAVIDAR | Gold | 9135000001 | 9135000002 | 1234 |
| MUDALIAR | Free | 9141000001 | 9141000002 | 1234 |
| MUDALIAR | Gold | 9145000001 | 9145000002 | 1234 |
| FREECASTEBAR | Free | 9151000001 | 9151000002 | 1234 |
| FREECASTEBAR | Gold | 9155000001 | 9155000002 | 1234 |

---

## 1. LANDING & LOGIN

### TC-AUTH-01: New user (empty storage) sees landing screen
- **Steps:** Fresh install → open app
- **Expected:** Landing screen shows "Get Started" + "Sign In" buttons

### TC-AUTH-02: Approved user auto-routes to home
- **Steps:** Login as 9111000001 (VANNIYAR Free Male), background app, reopen
- **Expected:** Directly enters Home tab (no landing shown)

### TC-AUTH-03: Pending user sees verification screen
- **Setup:** Set `userStatus = 'PENDING'` for a user in DB
- **Steps:** Login with that account
- **Expected:** ProfileUnderVerificationScreen shown, not home tabs

### TC-AUTH-04: Login with wrong PIN
- **Steps:** Enter mobile 9111000001, PIN 9999
- **Expected:** Error toast — wrong credentials, stays on LoginScreen

### TC-AUTH-05: Login with 10-digit mobile + 4-digit PIN validation
- **Steps:** Type 8 digits in mobile → try to tap Sign In
- **Expected:** Sign In button stays disabled until exactly 10 digits entered
- **Steps 2:** Type 3 digits in PIN → try Sign In
- **Expected:** Sign In stays disabled until exactly 4 digits entered

### TC-AUTH-06: Forgot PIN flow
- **Steps:** Tap "Forgot PIN?" → enter mobile → receive OTP → enter OTP → set new PIN
- **Expected:** New PIN saved, redirected to Login, can login with new PIN

---

## 2. PROFILE COMPLETION % (Critical)

> Backend: 14 fields checked. % = completedFields / 14 × 100

### TC-COMP-01: Verify % calculation is correct

| Fields Missing | Expected % | Status Label |
|---|---|---|
| 0 | 100% | STRONG |
| 2 | ~86% | STRONG |
| 5 | ~64% | GOOD |
| 8 | ~43% | BASIC |
| 14 | 0% | BASIC |

- **Steps:** Login as bulk user with partial profile → check profile tab completion ring
- **Expected:** Displayed % matches formula above

### TC-COMP-02: % updates immediately after edit
- **Steps:** Login → note completion % → go to Profile tab → edit Height (was empty) → save → return to home
- **Expected:** Profile completion ring on Home screen updates to higher %
- **Verify on:** Profile tab, Home screen progress ring, ProfileCompletionBar

### TC-COMP-03: Suggestion shows correct next action (priority order)
The suggestion follows this exact priority:
1. Profile photo missing → "Add Profile Photo" (+20%)
2. Horoscope missing → "Add Horoscope" (+15%)
3. Height or Weight missing → "Add Height & Weight" (+10%)
4. Hobbies empty → "Add Your Interests" (+10%)
5. Other missing field → field-specific suggestion (+5%)

- **Test:** Remove photo from test account → verify suggestion = "Add Profile Photo"
- **Test:** Add photo but no horoscope → verify suggestion = "Add Horoscope"
- **Test:** Fill all except hobbies → verify suggestion = "Add Your Interests"

### TC-COMP-04: 100% complete shows celebration badge
- **Steps:** Fill all 14 fields for a test account
- **Expected:** 🎉 badge shown on profile completion component

### TC-COMP-05: Completion % same for Male and Female
- **Login as:** 9111000001 (Male) vs 9111000002 (Female) with same fields filled
- **Expected:** Same % for same number of fields (gender doesn't change formula)

---

## 3. GENDER FILTER — Male sees Female only, Female sees Male only

### TC-GENDER-01: Home feed (VANNIYAR Male)
- **Login as:** 9111000001 (VANNIYAR Male)
- **Check:** Daily Recommendations, New Connections, Near You sections
- **Expected:** ALL profiles shown are Female. Zero Male profiles in any section.

### TC-GENDER-02: Home feed (VANNIYAR Female)
- **Login as:** 9111000002 (VANNIYAR Female)
- **Expected:** ALL profiles shown are Male. Zero Female profiles in any section.

### TC-GENDER-03: Search results respect gender
- **Login as:** 9112000001 (VANNIYAR Starter Male)
- **Go to:** Search → apply no filters → tap Search
- **Expected:** Only Female profiles in results

### TC-GENDER-04: Profile Detail of opposite gender
- **Login as Male → open any profile card**
- **Expected:** Profile shown is Female, bio says correct gender-appropriate details

### TC-GENDER-05: Same test for each caste
Repeat TC-GENDER-01 and 02 for:
- NAIDU Male (9121000001) → should see NAIDU Females
- NAIDU Female (9121000002) → should see NAIDU Males
- AADITRAVIDAR Male (9131000001)
- MUDALIAR Male (9141000001)
- FREECASTEBAR Male (9151000001)

---

## 4. CASTE FILTER — Only same-caste profiles shown

### TC-CASTE-01: VANNIYAR sees only VANNIYAR
- **Login as:** 9111000001 (VANNIYAR)
- **Home feed + Search:** Tap every profile card
- **Expected:** All profiles have Caste = VANNIYAR. No NAIDU, MUDALIAR, etc.

### TC-CASTE-02: NAIDU sees only NAIDU
- **Login as:** 9121000001
- **Expected:** Home feed shows only NAIDU profiles

### TC-CASTE-03: AADITRAVIDAR sees only AADITRAVIDAR
- **Login as:** 9131000001

### TC-CASTE-04: MUDALIAR sees only MUDALIAR
- **Login as:** 9141000001

### TC-CASTE-05: FREECASTEBAR sees only FREECASTEBAR
- **Login as:** 9151000001

### TC-CASTE-06: Caste + Gender combined
- **Login as:** 9121000002 (NAIDU Female)
- **Expected:** Profiles shown = NAIDU Male only (caste AND gender filter both applied)

---

## 5. HOME SCREEN

### TC-HOME-01: All 6 discovery sections load
- **Sections:** Daily Recommendations, New Connections, Near You, Interest Matches, Happy Stories, Banners
- **Expected:** Each section shows up to 7 profiles (or shows empty state gracefully)

### TC-HOME-02: Stats row navigates correctly
| Stat | Expected navigation |
|---|---|
| Matches | ListUser?type=connection |
| Proposals | MailBox tab |
| Views | ListUser?type=viewed |
| Admirers | ListUser tab or like list |

### TC-HOME-03: Notification bell shows unread badge
- **Setup:** Send interest to test account from another account
- **Login as test account**
- **Expected:** Notification bell shows red badge with count

### TC-HOME-04: Badge disappears after opening notifications
- **Steps:** Tap notification bell → view notifications → return to home
- **Expected:** Badge count reduced/cleared

### TC-HOME-05: Daily recommendations timer resets at midnight
- **Expected:** Countdown timer visible on Daily Recommendations header, resets to next midnight

### TC-HOME-06: Refresh button re-fetches all sections
- **Steps:** Pull to refresh OR tap refresh icon
- **Expected:** All 6 API calls fire again, profiles refresh

### TC-HOME-07: Plan badge on profile cards in home feed
- **Login as any user**
- **Expected:** Silver/Gold/Platinum users' cards show colored plan badge
- Silver = silver/grey badge, Gold = gold badge, Platinum = purple/premium badge

### TC-HOME-08: Plan badges on swiper cards
- **Login as any user**
- **Expected:** Silver/Gold/Platinum profile cards show their plan badge in the top-right corner
- **Note:** Photo blur on carousel was removed — all users see profile photos clearly in the home feed. Free users only face restrictions inside ProfileDetail (gallery modal) and in contact info masking (server-side).

---

## 6. MAILBOX

### TC-MAIL-01: Received tab — pending requests show yellow, accepted green, rejected red
- **Setup:** Have interests in all 3 statuses
- **Verify:** Color-coded status badges on each card

### TC-MAIL-02: Accept interest → triggers acceptance notification
- **User A** sends interest to **User B**
- **Login as User B** → Mailbox → Received → Accept
- **Login as User A**
- **Expected:** Push notification "Interest Accepted 🎉" received
- **Expected:** In-app notification in User A's notification screen

### TC-MAIL-03: Reject interest
- **Steps:** Received tab → Reject → confirm
- **Expected:** Card moves to Rejected filter, disappears from Pending

### TC-MAIL-04: Delete sent interest
- **Steps:** Sent tab → Delete icon on a card
- **Expected:** Card removed from list

### TC-MAIL-05: Permissions tab — filter by request type
- **Steps:** Tap "Profile Photo" checkbox → only profile photo requests shown
- **Steps:** Tap "Mobile Number" checkbox → only mobile requests shown

### TC-MAIL-06: Shortlisted tab loads and allows removal
- **Steps:** Open Shortlisted tab → long-press or tap Remove on a card
- **Expected:** Profile removed from shortlist

### TC-MAIL-07: "Shortlisted You" tab — Gold+ only
- **Login as:** 9111000001 (Free) → Mailbox
- **Expected:** Only 3 tabs visible. "Shortlisted You" tab NOT shown.
- **Login as:** 9115000001 (Gold)
- **Expected:** 4th tab "Shortlisted You" IS visible (bug was fixed — routes array now conditionally includes the tab for isGoldPlus) and loads data via `getWhoShortlistedMe` API

### TC-MAIL-08: Chat via ProfileDetail after acceptance (Starter = 5 msgs, Classic+ = unlimited)
- **Login as:** 9111000001 (Free) → Open ProfileDetail of accepted interest
- **Expected:** "Chat Now" button visible but navigates to chatscreen → backend will gate message sending (no MESSAGE feature for Free)
- **Login as:** 9112000001 (Starter) → accepted interest → Chat Now
- **Expected:** Opens chat, can send up to 5 messages; 6th message → upgrade popup
- **Login as:** 9114000001 (Silver) → accepted interest → Chat Now
- **Expected:** Works, unlimited messages

---

## 7. PROFILE TAB

### TC-PROF-01: Profile completion % on profile tab matches home screen
- Compare profile completion % shown on Profile tab vs Home screen
- **Expected:** Same number

### TC-PROF-02: Edit Personal section — height saves correctly
- **Steps:** Profile tab → Personal section → Edit → change Height → Save
- **Expected:** New height displayed in profile, completion % may update

### TC-PROF-03: Edit saves to correct API endpoint
For each section, verify the right API call is made:
| Section | Expected API |
|---|---|
| Personal | PUT /user-details/updatePersonalDetailsByUserDetailId |
| Religious | PUT /user-details/updateReligiousDetailsByUserDetailId |
| Education | PUT /user-details/updateEducationDetailsByUserDetailId |
| Family | PUT /user-details/updateFamilyDetailsByUserDetailId |
| About | PUT /user/updateAboutByUserId |
| Hobbies | PUT /user-details/updateInterestsByUserDetailId |

### TC-PROF-04: Profile image upload
- **Steps:** Tap profile photo → select image from gallery
- **Expected:** Image uploads via multipart POST, new image shown

### TC-PROF-05: Gallery images — upload and long-press delete
- **Steps:** Tap + on gallery → select image → confirm
- **Expected:** Image appears in gallery (up to 3 slots)
- **Steps:** Long-press on gallery image → confirm delete
- **Expected:** Image removed

### TC-PROF-06: Horoscope image — upload/update/delete
- **Steps:** Tap horoscope section → upload image
- **Expected:** Horoscope image saved and shown

### TC-PROF-07: Profile boost button
- **Gold plan (9115000001):** Boost button shows "2 credits"
- **Platinum plan (9116000001):** Boost button shows "5 credits"
- **Free plan (9111000001):** Boost button shows addon price (₹149)
- **When boost active:** 24-hour countdown timer visible on button

### TC-PROF-08: Trust score
- **Setup:** Approve ID verification for test account in admin panel
- **Expected:** Trust score shows 1 point for ID verified
- Complete all 4 verifications → score = 4 points

### TC-PROF-09: PARENT role blocks all edits
- **Setup:** Create family login under Gold account (9115000001)
- **Login with parent mobile + PIN**
- **Expected:**
  - Edit buttons on all sections show "Not Allowed" popup
  - Profile photo upload shows "Not Allowed"
  - Gallery upload shows "Not Allowed"
  - Horoscope upload shows "Not Allowed"

---

## 8. PLAN GATING — Screen-by-Screen

### TC-PLAN-FREE: Free Plan (9111000001 / 9111000002)

> Test credential accounts (9111000001/9111000002) have no subscription row — backend treats them as unsubscribed. Free plan in DB has SEND_REQUEST:3, but only applies if a subscription row exists.

| Feature | Expected |
|---|---|
| Home feed profile photos | Visible (no blur — photo blur removed from carousel) |
| Send interest | Blocked — "NO_ACTIVE_SUBSCRIPTION" (no subscription row for test credentials) |
| Accept interest | Allowed |
| Chat (after accepted interest) | Blocked — upgrade popup (no MESSAGE feature in Free) |
| Shortlist | Blocked — upgrade popup (no SHORTLIST feature in Free) |
| Open full profile detail — hero photo | Visible (no blur on hero image) |
| Tap gallery / photo modal | Blocked — "Upgrade to Starter or above" popup (frontend gate) |
| Mobile/email/horoscope fields | Server-masked (backend returns null/masked for VIEW_PROFILE_DETAILS=LIMITED) |
| Star Match | Blocked — upgrade popup (no viewPersonalInfo entitlement) |
| Request Voice Call | Blocked (no VOICE_CALL feature in Free; frontend: Classic+ gate) |
| WhatsApp share | Hidden (no WHATSAPP_SHARE feature) |
| "Shortlisted You" mailbox tab | Not visible (no WHO_SHORTLISTED_YOU feature) |
| Family Access in settings | Hidden (no FAMILY_LOGIN feature) |
| Advanced search filters | Not accessible (no ADV_SEARCH feature) |
| Notifications from likes | NOT sent (no NOTIFICATION_ALERT feature) |
| Who Viewed Me notification | NOT sent (no WHO_VIEWED feature) |

### TC-PLAN-STARTER: Starter Plan (9112000001 / 9112000002)

| Feature | Expected |
|---|---|
| Send interest | Up to 25 requests (REQ_LIMITED=25) |
| 26th interest request | "INTEREST_LIMIT_EXCEEDED" error popup |
| Full profile photos | Visible — hero photo and gallery modal accessible |
| Horoscope view | **Blocked** — HOROSCOPE_VIEW not in Starter plan (Classic+ only) |
| Shortlist | Works (SHORTLIST: enabled) |
| Chat | **Up to 5 messages** (MESSAGE: 5 per plan duration), NOT blocked entirely |
| Star Match | **Blocked** — upgrade popup (no viewPersonalInfo entitlement; Classic+ needed) |
| Request Voice Call | Blocked — Silver+ only (DB: VOICE_CALL starts at Silver) |
| Advanced search filters | Not accessible (no ADV_SEARCH feature) |
| "Shortlisted You" tab | Not visible (no WHO_SHORTLISTED_YOU feature) |
| Family Access | Not visible (no FAMILY_LOGIN feature) |
| Notifications | **Received** — Starter has NOTIFICATION_ALERT: enabled |
| Who Viewed You | Up to 5 viewers shown (WHO_VIEWED: 5) |

### TC-PLAN-CLASSIC: Classic Plan (9113000001 / 9113000002)

| Feature | Expected |
|---|---|
| Send interest | Up to 15 requests (SEND_REQUEST=15) |
| Advanced search filters (Star, Dosham, Income) | Available (ADV_SEARCH: enabled) |
| Chat | **Works — unlimited messages** (MESSAGE: unlimited in Classic) |
| Request Voice Call | **Blocked** — frontend gate allows Classic+ but DB plan has VOICE_CALL starting at Silver only; frontend currently gates as "not Free and not Starter" so the button IS visible to Classic, and service request IS created (no backend feature check on service request creation) |
| View personal info (mobile/email) | Up to 40 profiles (VIEW_PERSONAL_INFO=40) |
| 41st mobile/email reveal | Server returns masked data |
| Horoscope view | Full (HOROSCOPE_VIEW: enabled) |
| Star Match | BASIC result (STAR_MATCH: BASIC) |
| Notifications | Active (NOTIFICATION_ALERT: enabled) |
| Who Viewed You | Up to 20 viewers shown (WHO_VIEWED: 20) |

### TC-PLAN-SILVER: Silver Plan (9114000001 / 9114000002)

| Feature | Expected |
|---|---|
| Chat | Works — unlimited messages |
| Send interest | Unlimited |
| Voice Call request | Works |
| View personal info | Unlimited |
| Education/ID verified badge on profiles | Shown |
| "Shortlisted You" tab | NOT visible (Gold+ only) |
| WhatsApp share | NOT visible |
| Family Access | NOT visible |
| Who Viewed Me notification | Active (plan has WHO_VIEWED feature) |

### TC-PLAN-GOLD: Gold Plan (9115000001 / 9115000002)

| Feature | Expected |
|---|---|
| "Shortlisted You" 4th mailbox tab | Visible and loads data |
| Family Access in settings | Visible, opens FamilyAccessScreen |
| WhatsApp share on ProfileDetail | Visible in header |
| Income verified badge | Shown on profiles with income_verified=1 |
| Profile boost credits | 2 credits |
| All Silver features | All pass |

### TC-PLAN-PLATINUM: Platinum Plan (9116000001 / 9116000002)

| Feature | Expected |
|---|---|
| Profile boost credits | 5 credits |
| Dedicated RM | Shows in MyRequestsScreen options |
| Family Assisted Matchmaking | Available as request type |
| Speak With Families | Available as request type |
| PaymentScreen with CONTACT mode | Shows RelationshipManagerView |
| Subscription end | ~9999 days from activation |
| All Gold features | All pass |

---

## 9. INTEREST REQUEST — CROSS-PLAN INTERACTIONS

### TC-INT-01: Free → Any plan (should fail)
- **Login as:** 9111000001 (VANNIYAR Free Male)
- **Open any VANNIYAR Female profile**
- **Tap "Send Interest"**
- **Expected:** Error popup — Free plan cannot send interests (NO_ACTIVE_SUBSCRIPTION)

### TC-INT-02: Starter → Free
- **Login as:** 9112000001 (VANNIYAR Starter Male)
- **Send interest to:** 9111000002 (VANNIYAR Free Female)
- **Expected:** Interest sent successfully (PENDING), auto-message sent
- **Login as:** 9111000002 → Mailbox → Received
- **Expected:** Interest appears in Received tab

### TC-INT-03: Starter → Platinum
- **Login as:** 9112000001
- **Send interest to:** 9116000002
- **Expected:** Interest sent (plan of RECEIVER doesn't block sender's ability to send)

### TC-INT-04: Starter hits 25-request limit
- **Send 25 interests from Starter account**
- **Send 26th**
- **Expected:** "INTEREST_LIMIT_EXCEEDED" error popup

### TC-INT-05: Silver (unlimited) sends many interests
- **Login as:** 9114000001
- **Send 30+ interests**
- **Expected:** All succeed, no quota error

### TC-INT-06: Interest → Acceptance → Chat (Starter gets 5 messages, Silver gets unlimited)
- **User A (VANNIYAR Silver Male - 9114000001) sends interest to**
- **User B (VANNIYAR Starter Female - 9112000002)**
- **User B accepts**
- **User A:** Receives "Interest Accepted" push notification
- **User A opens chat** → Works (Silver: unlimited messages)
- **User B opens chat** → Also works but **limited to 5 messages total** (Starter MESSAGE=5). On 6th message → upgrade popup.

### TC-INT-07: Interest between different castes — should NOT be possible
- Discovery shows only same-caste profiles, so this shouldn't occur
- **Verify:** VANNIYAR user cannot even see NAIDU profiles to send interest

### TC-INT-08: Block then send interest
- **User A blocks User B**
- **User B tries to send interest to User A**
- **Expected:** Error — blocked user cannot send interest

---

## 10. CHAT

### TC-CHAT-01: Starter → Starter — both limited to 5 messages
- **Setup:** Starter Male sends interest to Starter Female, Female accepts
- **Male opens chat** → Can send up to 5 messages (MESSAGE=5 per plan duration). NOT blocked entirely.
- **Female opens chat** → Same — up to 5 messages
- **After 5 messages each** → Upgrade popup appears ("upgrade to Classic or above")

### TC-CHAT-02: Silver → Silver — both can chat
- **Setup:** Silver Male (9114000001) sends interest to Silver Female (9114000002), accepted
- **Both open chat** → Messages send/receive in real time

### TC-CHAT-03: Online status shows correctly
- **Open chat when other user is active**
- **Expected:** Online indicator shown (green dot or "Online" text)
- **Other user closes app**
- **Expected:** Shows last seen time

### TC-CHAT-04: Block from within chat
- **Steps:** Open chat → tap ⋮ menu → Block → Confirm
- **Expected:** Navigates back, chat disabled, profile shows as blocked

### TC-CHAT-05: Report from within chat
- **Steps:** ⋮ menu → Report → select reason → Submit
- **Expected:** Report submitted, toast shown

### TC-CHAT-06: WebSocket reconnection
- **Steps:** Start chat → disable WiFi for 5 seconds → re-enable
- **Expected:** Messages delivered, no permanent disconnection

### TC-CHAT-07: PARENT role cannot initiate chat
- **Login as parent account**
- **Try to open any chat**
- **Expected:** "Not Allowed" error popup

---

## 11. NOTIFICATIONS

### TC-NOTIF-01: Interest received → push notification
- **User A (Starter) sends interest to User B (any plan)**
- **Expected:** User B receives push notification: "You've Received an Interest"
- **User B's notification screen:** Entry appears with type = INTEREST

### TC-NOTIF-02: Interest accepted → push to sender
- **User A sends interest, User B accepts**
- **Expected:** User A receives: "Interest Accepted! 🎉 [Name]"

### TC-NOTIF-03: Like notification — gated by plan
- **User A likes User B's profile**
- **If User B is Free/Starter:** NO like notification sent (NOTIFICATIONS feature not in plan)
- **If User B is Silver+:** Like notification sent

### TC-NOTIF-04: Profile viewed notification — gated
- **User A views User B's profile**
- **If User B is Free/Starter:** NO "viewed your profile" notification
- **If User B is Silver+:** WHO_VIEWED notification sent

### TC-NOTIF-05: Chat message notification
- **User A (Silver) sends chat message to User B**
- **Expected:** User B receives push notification with message preview

### TC-NOTIF-06: Payment approved notification (no plan gate)
- **Admin approves payment for any user**
- **Expected:** Push notification sent regardless of current plan

### TC-NOTIF-07: Profile approved notification (no plan gate)
- **Admin approves new user profile**
- **Expected:** Push notification and email sent

### TC-NOTIF-08: All notifications auto-marked read on open
- **Steps:** Have unread notifications → open NotificationScreen
- **Expected:** All marked as read, badge clears on home screen

### TC-NOTIF-09: Notification taps navigate to profile
- **Steps:** Tap an INTEREST notification
- **Expected:** Navigates to the sender's ProfileDetail

### TC-NOTIF-10: Notification for each caste (same rule applies)
- Repeat TC-NOTIF-01 to 05 for NAIDU, AADITRAVIDAR, MUDALIAR, FREECASTEBAR
- **Expected:** Same behavior — notifications follow plan of RECEIVER, not caste

---

## 12. SEARCH & FILTERS

### TC-SEARCH-01: Basic search — caste + gender auto-applied
- **Login as any Male → Search → no filters → Search**
- **Expected:** Only same-caste Female profiles returned

### TC-SEARCH-02: Age range filter
- **Set age 25–30 → Search**
- **Expected:** All results have age 25–30 (calculated from DOB)

### TC-SEARCH-03: Location filter
- **Set city = "Chennai" → Search**
- **Expected:** Only profiles with location = Chennai

### TC-SEARCH-04: Advanced filters locked for Free/Starter
- **Login as Free (9111000001) → Search → Filters**
- **Expected:** Star, Dosham, Income filter disabled or shows upgrade message
- **Login as Classic (9113000001)**
- **Expected:** Star, Dosham, Income filters accessible

### TC-SEARCH-05: Star filter (Classic+)
- **Login as:** 9113000001 → Search → Select Star = "Aswini"
- **Expected:** Only profiles with Nakshatra = Aswini in results

### TC-SEARCH-06: Search by Profile ID
- **Go to Profile ID tab → enter a valid memberId (e.g., PLN11M)**
- **Expected:** That specific profile returned

### TC-SEARCH-07: Saved search — save and reload
- **Apply filters → Save Search → give name → Save**
- **Go to Saved Searches tab → tap saved search**
- **Expected:** Filters repopulate, results load

### TC-SEARCH-08: Search results show plan badges
- **Expected:** Silver/Gold/Platinum profiles in results show colored plan badge

### TC-SEARCH-09: Repeat for each caste
VANNIYAR Female (9111000002) searches → sees only VANNIYAR Males  
NAIDU Male (9121000001) searches → sees only NAIDU Females  
... etc.

---

## 13. PROFILE DETAIL

### TC-DETAIL-01: Free viewer — hero photo visible, gallery blocked
- **Login as Free → open any profile**
- **Expected:** Hero profile photo is visible (no blur)
- **Tap photo / tap gallery icon** → "Upgrade to Starter or above to view all profile photos" popup — gallery modal blocked
- **Mobile/email/horoscope fields** → masked/null (server-side gating, VIEW_PROFILE_DETAILS=LIMITED)

### TC-DETAIL-02: Starter+ viewer — full access to photos
- **Login as Starter (9112000001) → open profile**
- **Expected:** Hero photo clear, gallery modal opens, all photos visible

### TC-DETAIL-03: Hidden profile photo — permission request
- **Setup:** Profile owner hides their photo (Privacy Settings)
- **Viewer opens ProfileDetail**
- **Expected:** "Ask Permission" button shown instead of photo
- **Tap "Ask Permission"** → Request sent
- **Profile owner approves in Mailbox → Permissions tab**
- **Viewer reopens ProfileDetail** → Photo now visible

### TC-DETAIL-04: Interest states transition correctly
| State | Button shown | Enabled? |
|---|---|---|
| No interest | "Send Interest" (blue) | Yes |
| Interest pending (sender) | "Request Pending" (gray) | No (disabled) |
| Interest pending (receiver) | "Accept / Decline" | Yes |
| Interest accepted | "Chat Now" (green) | Yes for Starter+ (5 msg limit), Unlimited for Classic+ |

### TC-DETAIL-05: Shortlist toggle
- **Login as Starter+ → Profile Detail → tap heart icon**
- **Note:** Free users cannot shortlist (no SHORTLIST feature)
- **Expected:** Heart fills (shortlisted), API call made
- **Tap again** → Unfilled (removed)

### TC-DETAIL-06: WhatsApp share — Gold+ only
- **Login as Silver (9114000001) → Profile Detail**
- **Expected:** WhatsApp share button NOT in header
- **Login as Gold (9115000001)**
- **Expected:** WhatsApp share button visible in header

### TC-DETAIL-07: Star Match — premium gate
- **Login as Free → Profile Detail → tap Star Match**
- **Expected:** Upgrade popup shown
- **Login as Starter → tap Star Match**
- **Expected:** Upgrade popup shown (Starter has no viewPersonalInfo entitlement — gate fails)
- **Login as Classic (9113000001) → tap Star Match**
- **Expected:** Opens StarMatch screen — BASIC result (STAR_MATCH: BASIC)
- **Login as Silver+ → tap Star Match**
- **Expected:** Opens StarMatch screen — FULL porutham result (STAR_MATCH: FULL)

### TC-DETAIL-08: Request Voice Call — Classic+ frontend gate (Silver+ DB plan feature)
- **Login as Free or Starter → Profile Detail**
- **Expected:** "Request Voice Call" button NOT visible (frontend hides for Free/Starter)
- **Login as Classic (9113000001)**
- **Expected:** Button visible; tap creates a ServiceRequest (backend has no feature gate on request creation, so Classic can submit despite VOICE_CALL not being in Classic's DB plan features)
- **Login as Silver+ → tap Request Call**
- **Expected:** Works fully (VOICE_CALL: enabled in Silver/Gold/Platinum)
- **Note:** VOICE_CALL DB feature starts at Silver. Frontend gates as "!Free && !Starter". Classic is technically between these — button shows and backend accepts the request.

### TC-DETAIL-09: Report user — 6 reasons available
- **Steps:** ⋮ menu → Report → verify 6 reason options shown → select and submit
- **Expected:** Report created in backend

### TC-DETAIL-10: Profile view count increments
- **User A views User B's profile**
- **Admin panel → User B → View profile stats**
- **Expected:** Visit count incremented by 1

---

## 14. STAR MATCH

### TC-STAR-01: Blocked for Free and Starter plans
- **Login as Free → try Star Match**
- **Expected:** Premium upgrade popup
- **Login as Starter → try Star Match**
- **Expected:** Premium upgrade popup (gate: viewPersonalInfo entitlement, which Starter lacks)
- **Login as Classic (9113000001) → try Star Match**
- **Expected:** Opens Star Match — BASIC result mode
- **Login as Silver+ → try Star Match**
- **Expected:** Opens Star Match — FULL porutham result

### TC-STAR-02: Pre-fill from logged-in user data
- **Login as Classic+ → open Star Match from profile**
- **Expected:** Own birth details pre-filled in Bride/Groom tab

### TC-STAR-03: Pre-fill from viewed profile
- **Open Star Match from a target user's ProfileDetail**
- **Expected:** Target user's star/rasi/DOB pre-filled in opposite tab

### TC-STAR-04: All 27 stars available in dropdown
- **Open star dropdown → count options**
- **Expected:** 27 nakshatras listed (Aswini through Revathi)

### TC-STAR-05: All 12 rasis available
- **Open Rasi dropdown**
- **Expected:** 12 zodiac signs (Mesham through Meenam)

---

## 15. SETTINGS PAGE

### TC-SET-01: Parent role — restricted settings
- **Login as Parent account**
- **Expected:**
  - Banner "You're logged in as [parentName] (Relationship)" shown
  - Privacy Settings hidden
  - Change PIN hidden
  - Family Access hidden
  - Logout still works

### TC-SET-02: Delete account — requires "CONFIRM_DELETE" text
- **Steps:** Settings → Delete Account → type anything other than "CONFIRM_DELETE"
- **Expected:** Confirm button stays disabled
- **Type exactly "CONFIRM_DELETE"**
- **Expected:** Confirm button activates, account deleted on tap

### TC-SET-03: Family Access — Gold+ only
- **Login as Free/Starter/Classic/Silver → Settings**
- **Expected:** "Family Access" option NOT visible
- **Login as Gold (9115000001)**
- **Expected:** "Family Access" option visible

### TC-SET-04: Logout clears all AsyncStorage
- **Login → Logout**
- **Reopen app**
- **Expected:** Landing screen shown (all storage cleared)

### TC-SET-05: FCM token removed on logout
- **After logout, admin panel should not be able to send push to that device**

---

## 16. FAMILY ACCESS (Gold+ only)

### TC-FAM-01: Non-Gold cannot access FamilyAccessScreen
- **Login as Silver → navigate to FamilyAccessScreen directly**
- **Expected:** Lock screen with "Upgrade to Gold+" message

### TC-FAM-02: Create family login — validation
- **Mobile < 10 digits** → Save button disabled
- **PIN < 4 digits** → Save button disabled
- **Valid mobile + PIN** → Creates successfully
- **Success popup** shows name, mobile, PIN

### TC-FAM-03: Duplicate mobile rejected
- **Try to create family login with mobile that already exists in users table**
- **Expected:** Error "MOBILE_EXISTS_AS_MEMBER"

### TC-FAM-04: Parent login uses primary user's data
- **Create family login for Gold Male (9115000001) with parent mobile 9990000001 / PIN 5678**
- **Login with 9990000001 / 5678**
- **Expected:**
  - role = PARENT in AsyncStorage
  - Profile tab shows Gold Male's profile (not parent's own)
  - Matches shown are for Gold Male (same-caste Females)
  - Cannot edit profile

### TC-FAM-05: Revoke family login
- **Gold user → Family Access → Revoke parent**
- **Try logging in with parent mobile**
- **Expected:** Login fails (status = REVOKED)

### TC-FAM-06: Relationship options available
- **Steps:** Open Add Family Member form
- **Expected:** Dropdown shows: Father, Mother, Brother, Sister, Uncle, Aunt, Guardian

---

## 17. PAYMENT FLOW

### TC-PAY-01: QR mode — upload proof
- **Steps:** Go to PremiumTab → select any plan → tap Subscribe → PaymentScreen
- **Expected (if PAYMENT_MODE=QR):** QR code shown with 30-minute countdown
- **Steps:** Enter UTR number → upload screenshot → submit
- **Expected:** "Verification Pending" state shown

### TC-PAY-02: CONTACT mode — RM view
- **Expected (if PAYMENT_MODE=CONTACT):** RelationshipManagerView shown
- **RM name, photo, contact shown**
- **Callback request form submittable**

### TC-PAY-03: Resume pending payment
- **If paymentRequestId exists in route** → Forces QR view even in CONTACT mode

---

## 18. ADMIN PANEL — Test Scenarios

### TC-ADMIN-01: Approve new user profile
- **Register a new test account → admin panel → Verification → Profiles**
- **Expected:** New account shows as PENDING
- **Tap Approve**
- **Expected:**
  - User's status = APPROVED
  - User receives push notification "Profile Approved"
  - User can now login and access the app

### TC-ADMIN-02: Reject user profile with reason
- **Pending profile → Reject → enter reason**
- **Expected:**
  - User status = REJECTED
  - Reason stored in rejectionReason
  - User sees ProfileUnderVerificationScreen with reason

### TC-ADMIN-03: Approve payment → subscription activated
- **Submit payment as test user → admin panel → Payments → filter PENDING**
- **Tap Approve**
- **Expected:**
  - user_subscriptions row created with ACTIVE status
  - User receives push notification "Payment Approved"
  - User's plan badge updates on login

### TC-ADMIN-04: Reject payment with reason
- **Pending payment → Reject → enter reason**
- **Expected:** User notified, payment status = REJECTED

### TC-ADMIN-05: ID verification — approve
- **Upload Aadhaar in app → admin panel → Verification → ID Documents**
- **Expected:** Document appears as PENDING with image preview
- **Tap Approve**
- **Expected:** id_verified = true on user profile
- **Verify in app:** ID verified badge shown on user's ProfileDetail

### TC-ADMIN-06: Education verification — reject with reason
- **Upload degree certificate → admin → Education Documents**
- **Select rejection reason from dropdown** (e.g., "Institution not recognized")
- **Expected:** educationVerified stays false, reason stored

### TC-ADMIN-07: Income verification
- **Upload salary slip → admin → Income Documents → Approve**
- **Expected:** incomeVerified = true
- **In Gold user's ProfileDetail:** Income verified badge shown

### TC-ADMIN-08: Service request — Voice Call flow
- **Classic user creates Voice Call service request**
- **Admin panel → Service Requests → filter by VOICE_CALL**
- **Tap Start** → status = IN_PROGRESS
- **After call → Tap Done** → status = DONE
- **User's MyRequestsScreen:** Shows DONE status with green badge

### TC-ADMIN-09: Send push notification to all users
- **Admin → Notifications → Compose**
- **Audience: All Users → Type: Push → write title + message → Send Now**
- **Expected:** All users with FCM tokens receive push notification

### TC-ADMIN-10: Block a user
- **Admin panel → Users → find user → Block**
- **User tries to login**
- **Expected:** Login fails or app routes to blocked screen

### TC-ADMIN-11: Dashboard stats accuracy
- **Admin → Dashboard**
- **Total Users count** = run `SELECT COUNT(*) FROM users` → should match
- **Pending Approvals** = count of PENDING users → should match
- **Today's Registrations** = users created today

### TC-ADMIN-12: Report a user → admin takes action
- **User A reports User B from chat or profile**
- **Admin panel → Reports → PENDING**
- **Tap "Take Action" → Warn**
- **Expected:** Report status = WARNED, admin note saved

### TC-ADMIN-13: Audit log records admin actions
- **Perform any admin action (approve user, reject payment)**
- **Admin → Audit Logs**
- **Expected:** Entry recorded with admin name, action, module, timestamp

---

## 19. BOOST PROFILE

### TC-BOOST-01: Gold plan — 2 boost credits
- **Login as:** 9115000001
- **Profile tab** → Boost button shows "2 Credits"
- **Tap Boost** → 1 credit consumed, profile shown higher in search results for 24 hours
- **Tap Boost again** → Now shows "1 Credit"
- **Tap Boost again** → No credits, shows addon purchase (₹149)

### TC-BOOST-02: Platinum — 5 credits
- **Login as:** 9116000001
- **Profile tab** → Boost button shows "5 Credits"

### TC-BOOST-03: Boost countdown timer
- **After activating boost**
- **Expected:** 24-hour countdown timer visible on boost button

### TC-BOOST-04: Boost addon purchase (any plan)
- **Login as Starter (9112000001) → Profile tab**
- **Expected:** Boost button shows ₹149 addon option → leads to PaymentScreen

---

## 20. VERIFICATION BADGES

### TC-BADGE-01: ID verified badge appears after admin approval
- **Upload ID → admin approves → other users view this profile**
- **Expected:** ID verified badge (🛡️) shown next to name in ProfileDetail

### TC-BADGE-02: Education verified badge (Silver+ viewers see it)
- **Upload education doc → admin approves**
- **Silver user opens profile** → Education badge shown
- **Free user opens profile** → Education badge shown (badge is about the profile's status, not viewer's plan)

### TC-BADGE-03: Income verified badge (Gold+ viewers only)
- **Profile has income_verified = true**
- **Gold user opens ProfileDetail** → Income verified badge shown
- **Silver user opens ProfileDetail** → Income badge NOT shown (Gold+ gate)

### TC-BADGE-04: Badges on mailbox cards
- **Received/Sent mailbox items from verified users**
- **Expected:** Badge icons shown on the interest request card

---

## 21. PRIVACY SETTINGS

### TC-PRIV-01: Hide profile photo
- **Settings → Privacy → toggle off profile photo**
- **Another user opens ProfileDetail**
- **Expected:** "Ask Permission" button shown instead of photo

### TC-PRIV-02: Hide horoscope
- **Toggle off horoscope → other user views profile**
- **Expected:** Horoscope field shows lock icon "Restricted"

### TC-PRIV-03: Hide mobile number
- **Toggle off mobile → other user views profile**
- **Expected:** Mobile field shows lock icon "Restricted"

---

## 22. PROFILE UNDER VERIFICATION

### TC-PUV-01: PENDING user cannot access home
- **Set userStatus = PENDING in DB**
- **Login**
- **Expected:** ProfileUnderVerificationScreen shown
- **Home tab NOT accessible**

### TC-PUV-02: Rejected user sees rejection reason
- **Admin rejects with reason "Profile photo is unclear"**
- **User logs in**
- **Expected:** ProfileUnderVerificationScreen shows rejection reason text

### TC-PUV-03: After admin approves → user can access home
- **Admin approves pending user**
- **User kills app and relogs**
- **Expected:** Routes to Home tab

---

## 23. HAPPY STORIES & BANNERS

### TC-HAPPY-01: Happy stories load in home
- **Expected:** Horizontally scrollable happy story cards on home screen

### TC-HAPPY-02: Banner images load
- **Expected:** Bottom banners on home load correctly, tap opens linked screen

---

## 24. MY REQUESTS SCREEN

### TC-REQ-01: Service request status badges show correct colors
| Status | Color |
|---|---|
| PENDING | Orange |
| IN_PROGRESS | Blue |
| DONE | Green |
| REJECTED | Red |

### TC-REQ-02: Request types show correct labels
- VOICE_CALL → "Voice Call"
- VIDEO_PROFILE → "Video Profile (30s)"
- FAMILY_LOGIN → "Family / Parent Login"
- SPEAK_FAMILY → "Speak With Families"
- DEDICATED_RM → "Dedicated Relationship Manager"

### TC-REQ-03: Pull to refresh loads new requests
- **Create new request → pull down to refresh**
- **Expected:** New request appears

---

## 25. END-TO-END FLOWS (Full Journey)

### E2E-01: New user full journey (Male VANNIYAR)
1. Register → OTP → PIN setup
2. Admin approves → receives push notification
3. Login → lands on Home → sees VANNIYAR Female profiles
4. Opens Profile → completion bar shows missing fields
5. Fills horoscope, height, weight → completion % increases
6. Purchases Starter plan → admin approves payment
7. Sends interest to 3 VANNIYAR Female profiles
8. One Female accepts → Male receives notification
9. Male upgrades to Silver → Chat unlocked
10. Sends chat message → Female receives notification
11. Star Match from chat screen → full compatibility score

### E2E-02: Parent login flow (Gold Male)
1. Gold Male (9115000001) → Settings → Family Access
2. Adds Father: mobile 9990000001, PIN 5678
3. Father logs in with 9990000001 / 5678
4. App shows Gold Male's profile as PARENT
5. Father browses matches (VANNIYAR Females shown)
6. Father tries to edit profile → "Not Allowed"
7. Father logs out → back to landing

### E2E-03: Admin → User full verification loop
1. User uploads ID document
2. Admin logs in → Verification → ID Documents
3. Approves document
4. User profile now has id_verified = true
5. Other Silver+ users see ID badge on that profile
6. Gold users see income badge (if income also verified)

### E2E-04: Cross-caste isolation check
1. Login NAIDU Male (9121000001)
2. Home feed → All profiles are NAIDU Female ✓
3. Search → All results are NAIDU Female ✓
4. NAIDU Female (9121000002) profile is accessible ✓
5. VANNIYAR Female (9111000002) is NOT in any list ✓

---

## 26. REGRESSION TEST CHECKLIST (Run After Any Code Change)

- [ ] Login works (mobile + PIN)
- [ ] Home feed shows opposite gender, same caste
- [ ] Home feed photos visible without blur (Free users see photos in carousel)
- [ ] Blocked users do NOT appear in home feed (backend filters by requesterId)
- [ ] Free plan gallery modal blocked (upgrade popup when tapping photo)
- [ ] Free plan mobile/email masked on ProfileDetail (server-side)
- [ ] Starter can send interest (up to 25)
- [ ] Starter can send up to 5 chat messages (not fully blocked)
- [ ] Classic can chat (unlimited messages, MESSAGE: unlimited)
- [ ] Star Match gate: Free + Starter → blocked; Classic → accessible (BASIC); Silver+ → accessible (FULL)
- [ ] Silver can chat (unlimited)
- [ ] Silver Voice Call request visible
- [ ] Gold has 4th "Shortlisted You" mailbox tab (isGoldPlus conditional route)
- [ ] Gold has Family Access in settings
- [ ] Parent login blocks all profile edits
- [ ] Profile completion % updates after edit
- [ ] Notifications sent on interest send/accept (all plans with NOTIFICATION_ALERT)
- [ ] Admin can approve user and payment
- [ ] Logout clears storage

---

## Test Execution Order (Recommended)

1. **Setup DB** — run 01_bulk_users.sql + 02_plan_credentials.sql
2. **Admin panel** — approve all plan credential accounts (pending profiles)
3. **Run AUTH tests** — TC-AUTH-*
4. **Run GENDER tests** — TC-GENDER-* (critical baseline)
5. **Run CASTE tests** — TC-CASTE-*
6. **Run COMP tests** — TC-COMP-* (profile completion)
7. **Run each plan gate** — TC-PLAN-FREE through TC-PLAN-PLATINUM
8. **Run cross-plan INT tests** — TC-INT-*
9. **Run NOTIF tests** — TC-NOTIF-*
10. **Run ADMIN tests** — TC-ADMIN-*
11. **Run E2E flows** — E2E-01 through 04
12. **Regression checklist** — before any commit
