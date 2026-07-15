# Tester Bucket List — Chat, Mailbox, Privacy & Recent Fixes

Companion to `05_plan_gating_qa.md` (that doc is plan/quota-matrix specific; this one covers everything else touched in the most recent round of fixes — chat, mailbox, privacy/permissions, contact reveal, and UI redesigns). Same test accounts apply.

**Legend:**
- `[ ]` — needs a fresh check
- **Bug fixed** — what was actually broken before, so you know what "wrong" looks like if it regresses
- **Repro** — the exact two-account flow to run

## Test accounts (same as `05_plan_gating_qa.md`)

| Plan | Name | UserId | Mobile |
|---|---|---|---|
| Free | VannFree TestMale / TestFemale | 696 / 697 | 9111000001 / 02 |
| Starter | VannStarter TestMale / TestFemale | 698 / 699 | 9112000001 / 02 |
| Classic | VannClassic TestMale / TestFemale | 700 / 701 | 9113000001 / 02 |
| Silver | VannSilver TestMale / TestFemale | 702 / 703 | 9114000001 / 02 |
| Gold | VannGold TestMale / TestFemale | 704 / 705 | 9115000001 / 02 |
| Platinum | VannPlatinum TestMale / TestFemale | 706 / 707 | 9116000001 / 02 |

PIN `1234` for all. **VannClassic TestMale (700)** currently has 58/60 send requests used and 39/40 contact reveals used (seeded for quota-exhaustion testing) — don't "fix" this by resetting it, it's intentional test data.

---

## 1 · Interest requests / connections

- [ ] Cancel a **PENDING** sent request (Sent By You tab, X icon) → removes instantly, no confirmation popup
- [ ] Cancel an **APPROVED** connection (X icon on an already-accepted item) → **must** show a confirmation popup ("Remove this connection? ... This can't be undone.") before doing anything
  - **Bug fixed:** this used to delete instantly with no warning, same as cancelling a pending request
- [ ] After confirming removal of an approved connection with **no messages ever exchanged** → the conversation also disappears from both sides' chat list
- [ ] After confirming removal of an approved connection **with real messages exchanged** → the conversation is preserved (chat history not lost), only the "connection" status changes
- [ ] Send interest → other side **declines** → sender can send again later and it works (not blocked by "already exists")
  - **Repro:** 700 → 703, decline from 703, re-send from 700's ProfileDetail screen

## 2 · Mailbox — Received / Sent By You / Permissions tabs

All three tabs should refetch automatically when you switch away and back — **not** just on first load.

- [ ] Received tab: send a new interest from another test account, without touching the receiver's app switch to another bottom tab and back to Request → new request appears without needing an app restart
- [ ] Sent By You tab: same check — send from elsewhere, switch tabs, confirm it shows up
- [ ] Permissions tab: same check for a new permission request (see section 3)
- [ ] Permissions tab — tap the ✓ (accept) or ✗ (decline) icon on a request → **must actually work**, no error
  - **Bug fixed:** this used to throw a 400 error ("...For input string: undefined") on every tap — button did nothing
- [ ] Permissions tab — tap ✗ (decline) → **must** show a confirmation popup before declining
- [ ] After accepting or declining a permission request → **it disappears from the list immediately** (don't need to leave and come back)
  - **Bug fixed:** the item used to stay in the list showing the same accept/reject buttons even after being decided
- [ ] Declining a permission request → the **requester** gets a notification saying it was declined (previously only approvals notified)

## 3 · Privacy settings / restricted-field permission requests

Owner side: Settings → Privacy — toggle "hide mobile number" / "hide profile photo" / "hide horoscope".

- [ ] Toggle a field ON twice in a row (or double-tap fast) → only **one** row should be created, not a duplicate
- [ ] Viewer side: profile photo hidden by owner → shows **blurred photo** + dark overlay + "Ask Permission" button (not a plain sharp photo, not a plain placeholder with no overlay)
- [ ] Viewer side: mobile hidden by owner → Contact section shows "Ask Permission" card (lock icon), not the raw number
- [ ] Tap "Ask Permission" (mobile or horoscope) → button changes to "Permission requested" (hourglass icon)
- [ ] **Leave the profile screen and come back** → button should still say "Permission requested", not reset to "Ask Permission"
  - **Bug fixed:** this used to reset to "Tap to request access" every time you reopened the screen, and tapping it again silently failed
- [ ] Owner declines the permission request → viewer's button reverts to "Ask Permission" (tappable again), **not** stuck showing "Permission requested" forever
- [ ] Viewer re-requests after a decline → works (doesn't say "already exists")
- [ ] Owner **approves** a mobile/photo/horoscope permission request → viewer's profile view of that owner **actually unlocks** that field (real photo/number/horoscope shows, not still blurred/locked)
  - **Bug fixed:** approving used to just send a notification and update a DB status — nothing ever actually unlocked for the viewer. This was a real gap, worth double-checking carefully
  - **Repro:** 703 asks 698 for mobile → 698 approves from Permissions tab → 703 reopens 698's profile → mobile should show

## 4 · Contact Reveal & Horoscope (Classic plan)

- [ ] As a Classic viewer (700 or 701) open a profile with contact hidden → Contact section shows **"Reveal Contact & Horoscope"** button (not "Reveal Contact")
- [ ] Tap it → mobile number shows immediately; if you also have an **accepted interest** with that profile, horoscope shows too in the same tap
- [ ] If interest is **not yet accepted** → tapping reveal still unlocks contact, and shows a message explaining horoscope needs an accepted interest first (not silent, not showing a broken/blank horoscope box)
- [ ] If interest **is accepted** but the profile genuinely has no horoscope uploaded → shows "This member hasn't added their horoscope yet" — **not** the reveal button again, and not the "available after interest accepted" message
- [ ] Same "Reveal Contact & Horoscope" button also appears directly in the **Horoscope section** if it's the one still locked — tapping either button (Contact section or Horoscope section) does the same combined reveal
- [ ] Reveal count decrements correctly — check "X of 40 remaining" updates after each new profile revealed
- [ ] Re-opening a **previously revealed** profile shows the number immediately, doesn't consume a 2nd reveal

### Profile tab — Contact Reveals card

- [ ] Classic plan: Profile tab shows a "Contact Reveals" card with a progress bar and "X of 40 remaining"
- [ ] Free / Starter plan: card does **not** appear at all
- [ ] Silver+ plan: card does **not** appear (unlimited, nothing to track)
- [ ] When remaining ≤ ~10% of total (e.g. 3 or fewer left) → card shows a pink "RUNNING LOW" badge and pink progress bar/border
- [ ] Tap the card → opens a list of every profile whose contact you've revealed, showing their name/photo, **mobile number**, and when it was revealed
  - Use VannClassic TestMale (700) for this — already has 39 reveals seeded

## 5 · Chat screen

- [ ] iOS: open keyboard while typing a message → input box stays visible above the keyboard, not hidden behind it
- [ ] Two accounts in the same chat at once: Account A sends a message → Account B sees it appear live, without needing to leave and reopen the chat
- [ ] Account B reads the message while actively in the chat → Account A's tick on that message turns from single grey to double **blue** live, without leaving the chat
- [ ] Go back to the conversation list after reading messages → unread badge/bold text clears (doesn't stay showing unread)
- [ ] Online / "last seen" status updates within ~15 seconds of the other person actually going online/offline
- [ ] If the other person has no profile photo → shows the correct gendered default avatar (not a broken image or the wrong gender's avatar), in the header, in message bubbles, and in the input bar
- [ ] Header: name + online status center-aligned with the profile photo, doesn't overlap the 3-dot menu icon (check specifically on Android)

## 6 · Conversation list (footer tab "Chat"/"My Connections")

- [ ] Search bar filters the list by name as you type; clearing it shows everyone again
- [ ] Sending yourself a message from another account while sitting on this screen → new message and updated "last message" text appear live, without switching tabs
- [ ] Unread conversations show bold name/message + a small blue dot + a blue unread-count badge; read conversations are plain gray
- [ ] Swipe a conversation left → red delete button appears, tapping it removes the row
- [ ] Timestamps read like WhatsApp: today shows a time, yesterday shows "Yesterday", this week shows a weekday name, older shows a date — not always a raw clock time
- [ ] Verified badge (shield icon) shows on the avatar corner for verified users

## 7 · "Who Liked You" (home page)

- [ ] Home page → tap the "Likes" (heart) stat → opens a real list of who liked you, **not** a "Coming soon" popup
- [ ] Free plan: tapping it shows an upgrade wall ("Upgrade to Starter or above...")
- [ ] Starter: shows up to 5 likers; Classic: up to 20; Silver+: unlimited — verify the cap actually applies if you have more likes than the limit

## 8 · Push notifications

- [ ] On a real device build (**not** Expo Go) — a received push notification shows the app's own logo, not the Expo Go icon
- [ ] In Expo Go on Android: no red error screen about "push notifications removed from Expo Go" should interrupt normal use (functionality is expected to be unavailable there — just shouldn't throw a scary error banner)

---

## Known, deliberately-not-fixed items (don't report these as new bugs)

- **Horoscope still requires an accepted interest even for Classic's combined reveal** — this is an intentional privacy rule, not a bug. Flagged to the product owner as a possible future change, not implemented.
- **`findTopByUserIdOrderByCreatedAtDesc` subscription-lookup pattern** exists in ~11 backend service methods beyond the one already fixed (`ChatService`). If you hit a "false upgrade required" popup on a plan that should have access (especially after a plan renewal), note exactly which action/screen — this is a known fragile pattern, not yet swept everywhere.
- **`PremiumTab.tsx` (the plans/pricing screen) shows hardcoded mock data**, not the real database prices/limits (see `05_plan_gating_qa.md` for details) — pricing-page inaccuracies here are a known, separate, larger item.
