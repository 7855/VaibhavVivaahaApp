# Plan-Gating QA Test Plan

Every checklist item below is tied to an actual `planFeatures` row and the code path that reads it — verified against the live `vvm_db` database and the current backend/frontend source. Where a DB row exists but nothing enforces it, that's called out explicitly.

**Legend:**
- `[DB-enforced]` — checked server-side against `planFeatures`, safe from API bypass
- `[Frontend-only]` — gate is a client-side `planTitle` string check — hides the button, but nothing stops a direct API call
- `[Not enforced]` — DB row exists; no code path reads it anywhere — cosmetic/future
- `[Verify UX]` — works correctly, but confirm the message/copy matches the real reason

## Test accounts

All seeded 2026-05-21, PIN `1234` for every account. Each plan has a male + female pair.

| Plan | Name | UserId | Mobile |
|---|---|---|---|
| Free | VannFree TestMale | 696 | 9111000001 |
| Free | VannFree TestFemale | 697 | 9111000002 |
| Starter | VannStarter TestMale | 698 | 9112000001 |
| Starter | VannStarter TestFemale | 699 | 9112000002 |
| Classic | VannClassic TestMale | 700 | 9113000001 |
| Classic | VannClassic TestFemale | 701 | 9113000002 |
| Silver | VannSilver TestMale | 702 | 9114000001 |
| Silver | VannSilver TestFemale | 703 | 9114000002 |
| Gold | VannGold TestMale | 704 | 9115000001 |
| Gold | VannGold TestFemale | 705 | 9115000002 |
| Platinum | VannPlatinum TestMale | 706 | 9116000001 |
| Platinum | VannPlatinum TestFemale | 707 | 9116000002 |

**Known landmine:** 605 of 657 total users (this seeded batch included) had zero `user_subscriptions` rows until the 2026-07-09 self-healing fix. If testing against a pre-fix DB snapshot, quota checks will silently misbehave.

---

## 1 · Free — ₹0 · lifetime

| Check | Expected | Enforced | Where |
|---|---|---|---|
| Send interest | 3 total, ever (`PLAN_DURATION`) — not per-month | DB-enforced | `UserFeatureUsageService` · `SEND_REQUEST` |
| 4th send attempt | Blocked client-side once quota hits 0; verify a direct API call after 3 sends still 403s | Frontend-only | `ProfileDetail.tsx` `handleSendInterest` checks `quota.remaining`; no hard 403 path confirmed server-side for this exact flow |
| View profile details | `LIMITED` — blurred photo, partial fields | Frontend-only | `swiperprofile.js` blur keyed off `planTitle === 'Free'`, not the DB row |
| Profile view limit | No cap — open profiles freely | Intended | DB row is `0`, read as unlimited by `if (limit > 0)` guard. Resolved 2026-07-09: matches free-tier browsing norms in this vertical, not a bug |
| Contact / mobile / email | Always masked | DB-enforced | No `VIEW_PERSONAL_INFO` row for plan 1 |
| Horoscope | Always masked | DB-enforced | No `HOROSCOPE_VIEW` row for plan 1 |
| Chat / messaging | Cannot open chat at all, even on accepted interest | DB-enforced | `chatscreen.tsx` `isPremium` from `entitlements.message` |
| Basic search | `enabled` | Not enforced | No backend check found |
| Shortlist | Not available | DB-enforced | No `SHORTLIST` row for plan 1 |

## 2 · Starter — ₹499 · 30 days

| Check | Expected | Enforced | Where |
|---|---|---|---|
| Send interest | 25, PLAN_DURATION | DB-enforced | `SEND_REQUEST` = 25 |
| Who Viewed Me | 5, PLAN_DURATION — verify hard-cutoff | DB-enforced | `WHO_VIEWED` |
| View profile details | `FULL` — no blur | Frontend-only | Same `planTitle` check as Free, inverted |
| Profile view limit | 0 in DB, same as Free — unlimited | Intended | Same guard/resolution as Free |
| Chat / messaging | 5 **distinct conversations** total, not 5 messages — replies within an already-started conversation are unlimited | DB-enforced | `ChatService.sendChatMessage` — `countDistinctConversationsBySenderId` vs `maxConversations`. Verify a 6th new conversation is blocked (`CHAT_LIMIT_REACHED`) while replying in any of the first 5 still works |
| Shortlist | `enabled` | DB-enforced | — |
| Contact / horoscope | Still fully masked | DB-enforced | No rows for plan 2 |

## 3 · Classic — ₹999 · 90 days

The most structurally different plan — several features are quotas, not on/off switches.

| Check | Expected | Enforced | Where |
|---|---|---|---|
| Send interest | **60, PLAN_DURATION** (fixed 2026-07-10, local DB only — was 15, lower than Starter's 25, a confirmed downgrade trap). **Live production still has 15 — not yet promoted.** | DB-enforced | `SEND_REQUEST` |
| Reveal Contact | 40 reveals, PLAN_DURATION — per-profile, not per-message | DB-enforced | `UserService.revealContact` + `ProfileDetail.tsx` Reveal Contact button (`planTitle === 'Classic'` branch) |
| Re-open a profile already revealed | Shows mobile immediately, does not consume a 2nd reveal | DB-enforced | `contact_reveals` table dedup — `existsByViewerIdAndRevealedUserId` |
| 41st reveal (quota exhausted) | `CONTACT_VIEW_LIMIT_EXCEEDED` → premium-upgrade popup | DB-enforced | `revealContact` 403 path |
| Horoscope | Visible only if the specific interest is `APPROVED` — plan alone isn't enough | DB-enforced | `getProfileDetailWithIntractionStatus` — `hasHoroscopeAccess && interestAcceptedForHoroscope` |
| Horoscope, interest accepted, still empty | Should read "hasn't added their horoscope yet", not "available after interest accepted" | Verify UX | Fixed 2026-07-09 via `interestStatus === 'APPROVED'` check in `InlineProfileTabs` |
| Chat / messaging | `unlimited` — same as Silver+ | DB-enforced | `MESSAGE` = unlimited for plan 3 |
| Advanced search | `enabled` | DB-enforced | `ADV_SEARCH` |
| Star Match | `BASIC` tier (Silver+ get `FULL`) — verify UI actually shows a reduced result | Not enforced | No backend code references `STAR_MATCH` by code — likely frontend-only |
| Profile boost | 0 credits/month | DB-enforced (hardcoded) | `BoostService.PLAN_BOOST_CREDITS` has no entry for planId 3 → defaults to 0 |

**Test with VannClassic → VannSilver (700 → 703):** send interest, accept from Silver side, view Silver's profile from Classic, tap Reveal Contact, check horoscope message.

## 4 · Silver — ₹2,499 · 90 days

| Check | Expected | Enforced | Where |
|---|---|---|---|
| Send interest | `unlimited` | DB-enforced | `SEND_REQUEST` / `REQ_UNLIMITED` |
| Contact info | `enabled` — visible immediately, no reveal button | DB-enforced | `hasContactAccess = true` path |
| Secure Connect | Phone masked until interest accepted, then full number | DB-enforced | `isSecureConnect` + `interestAccepted` branch |
| Horoscope | Visible once interest accepted | DB-enforced | Same masking logic as Classic, never plan-blocked |
| Chat | `unlimited` | DB-enforced | `chatscreen.tsx`, `ChatService.sendChatMessage` |
| Voice call request | `enabled` for Silver+ | DB-enforced | `ServiceRequestService.createRequest` generic gate |
| Voice call CTA visibility | Shown — but also shown for Starter/Classic who lack the feature | Frontend-only | `ProfileDetail.tsx` gate is `planTitle && planTitle !== 'Free'` — broader than the DB row |
| Verification badges | Silver unlocks ID + education, not income (Gold+) | Not enforced | No backend reference to these codes |
| Star Match | `FULL` tier | Not enforced | Same caveat as Classic |

## 5 · Gold — ₹4,999 · 180 days

| Check | Expected | Enforced | Where |
|---|---|---|---|
| Family Access | `FAMILY_LOGIN enabled` | DB-enforced | `ServiceRequestService` generic gate + `settingsPage.tsx` menu entry |
| Who Shortlisted You | `enabled` | DB-enforced | `ListUser.tsx?type=whoShortlistedMe` |
| WhatsApp share | `enabled` — verify actually gated | Frontend-only | `ProfileDetail.tsx` `handleWhatsAppShare`, `planTitle === 'Gold' \|\| 'Platinum'` — no backend enforcement |
| Profile boost | 2 credits/month | DB-enforced (hardcoded) | `PLAN_BOOST_CREDITS.get(5L) = 2` |
| Video profile request | `enabled` | DB-enforced | Generic `ServiceRequestService` gate |
| Quick Access FAB — Family Access tile | Visible Gold+ only | Frontend-only | `QuickAccessFAB.tsx` `minPlan` filter, defensive re-check on tap |

## 6 · Platinum — ₹9,999 · until marriage

| Check | Expected | Enforced | Where |
|---|---|---|---|
| Dedicated RM request | `enabled`, Platinum-only | DB-enforced | Confirm a Gold account gets `PLAN_UPGRADE_REQUIRED` |
| Family-assisted matchmaking | `enabled`, Platinum-only | DB-enforced | Same as above |
| Speak with families | `enabled`, Platinum-only | DB-enforced | Same as above |
| Profile boost | 5 credits/month | DB-enforced (hardcoded) | `PLAN_BOOST_CREDITS.get(6L) = 5` |
| Everything from Gold | Should all still work identically | Verify UX | Spot-check Family Access, WhatsApp share, Who Shortlisted You |

---

## Cross-plan interaction scenarios

**TC-1 — Mismatched chat access, one side below Silver:** Classic (700) sends to Starter (699), Starter accepts, Classic opens chat (unlimited), Starter opens same conversation → counts as 1 of Starter's 5 allowed distinct conversations; stays open regardless of message count, cap only blocks starting a 6th *different* conversation.

**TC-2 — Both sides below Silver, "matched but mute":** Free (696) sends to Starter (699), Starter accepts → Matches count increments for both (symmetric, unrelated to chat access). Free side: full upgrade wall, cannot open chat. Starter side: chat opens, but talking to a Free account that can never reply is a dead end worth a product question.

**TC-3 — Classic reveal quota is per-viewer, not per-conversation:** Classic (700) reveals Silver (703) — 1 of 40 used. Reveals Gold (705) — 2 of 40 used. Re-opens Silver (703) → shows number immediately, no 3rd reveal consumed. Quota is shared across every profile, not per-profile.

**TC-4 — Re-send after decline vs. re-send after cancel:** Classic (700) sends to Silver (703). Path A: Silver declines → Classic re-sends from profile screen → succeeds, resets same row to PENDING (fixed 2026-07-08). Path B: Classic cancels their own request from "Sent By You" → re-sends → succeeds without a 500 error on `conversations` duplicate-key (fixed 2026-07-09 — this is the one most worth regression-testing, was a server crash).

**TC-5 — Send-quota consumption is independent of outcome:** Free (696) sends all 3 lifetime interests to three different accounts (one PENDING, one REJECTED, one self-cancelled) → Requests remaining = 0 regardless, quota consumed at send time and never refunded.

---

## Recheck: bugs fixed this session (2026-07-08/09)

- [ ] Interest send silently "succeeded" on a duplicate — `handleSendInterest` now checks `res.data.code === 201` before showing success
- [ ] Re-send after decline was blocked forever — now resets the same row to PENDING (TC-4 Path A)
- [ ] `conversations` duplicate-key 500 on re-send after cancel — highest-severity fix, a real server crash (TC-4 Path B)
- [ ] Request quota frozen at plan default, never decrementing — caused by missing `user_subscriptions` rows; backend now self-heals via `ensureActiveSubscription`
- [ ] "Interests & Hobbies" edit was a raw text input that silently failed to save — now a proper multi-select chip grid via `EditInterestsModal.tsx`
- [ ] Android: could not tap anything except the Quick Access FAB — root cause was a second `GestureHandlerRootView`; test Android specifically, never reproduced on iOS
- [ ] Footer nav stuck on "Home" after editing profile data — `VVMFooterNav` now syncs to real navigation state
- [ ] Last item in Received/Sent/Permissions lists hidden behind the floating footer — check with 4+ items in each of the three mailBox tabs
- [ ] Classic Reveal Contact button + accurate horoscope-empty message (see Classic section above and TC-3)

---

## Frontend / DB drift — worth a product decision, not just a test

These aren't bugs so much as places where the DB says one thing and the code enforces something looser or nothing at all.

| Feature | DB says | Code actually does | Risk |
|---|---|---|---|
| Voice Call CTA | Silver+ only (`VOICE_CALL` row starts at plan 4) | Frontend shows the button for anyone above Free — Starter and Classic see it too | Low — backend still rejects server-side, but Starter/Classic users tap a button that always fails |
| Star Match tier (BASIC vs FULL) | Classic = BASIC, Silver+ = FULL | No backend code references `STAR_MATCH` by code at all | Medium — worth confirming the screen actually renders a reduced report for Classic |
| Profile boost credits | `planFeatures.PROFILE_BOOST` per plan | `BoostService` uses a separate hardcoded `Map<Long,Integer>` that happens to match today | Low today, but changing the DB row alone won't change actual credits — the map is the real source of truth |
| All plans' `PROFILE_VIEW_LIMIT` | `0` or no row — unlimited everywhere | Resolved 2026-07-09: intended, not drift | None — code comment corrected, no further action needed |
| Verification badges, high visibility, priority search | Rows exist from Silver up | No backend or frontend reference found to these exact codes | Cosmetic-only for now |
| Classic `SEND_REQUEST`, local vs. live | Local `vvm_db`: **60** (fixed 2026-07-10) | Live `uravugal` RDS: still **15** — fix not yet promoted | Medium — real paying Classic customers are still on the old, worse-than-Starter quota. Exact `UPDATE` statement is in `VaibhavVivaahaApp/CLAUDE.md`'s 2026-07-10 changelog entry |
| **`PremiumTab.tsx` plan data** | Real 6-plan structure in `subscription_plans`/`planFeatures` | **Screen ignores the DB entirely** — hardcoded fictional `MOCK_API_RESPONSE` / `defaultPlans` data. Starter shown at ₹199 (real: ₹499) with "15 interests" copy (real: 25); Classic shown as two duplicate ₹999/₹1,499 duration variants (real: single ₹999/90-day plan) with "50 interest requests" copy (real: was 15, now 60 locally) | **High — this is the actual screen users pay from.** A real, unused endpoint already exists: `userApi.getAllActivePlans()` → `/subscriptionPlans/getAllActivePlans`. Not yet decided whether to wire this screen to it or rewrite the mock data to match reality |

---
Compiled from `vvm_db` (planFeatures, features, subscription_plans, user_subscriptions, contact_reveals, interestRequest tables) and the current `VaibhavVivaahaApp` / `VaibhavVivaahaBackend` source. Re-run the DB queries if plan rows change — this snapshot is only as current as the day it was pulled.
