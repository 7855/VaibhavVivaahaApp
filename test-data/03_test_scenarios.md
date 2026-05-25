# VaibhavVivaahaApp — Test Scenarios Per Plan

> **All PIN**: `1234`  
> **Format**: mobile + PIN on the Login screen

---

## Test Credential Quick Reference

| Caste | Plan | Mobile (Male) | Mobile (Female) | Subscription Ends |
|---|---|---|---|---|
| VANNIYAR | Free | 9111000001 | 9111000002 | — |
| VANNIYAR | Starter | 9112000001 | 9112000002 | 2026-06-20 |
| VANNIYAR | Classic | 9113000001 | 9113000002 | 2026-08-19 |
| VANNIYAR | Silver | 9114000001 | 9114000002 | 2026-08-19 |
| VANNIYAR | Gold | 9115000001 | 9115000002 | 2026-11-17 |
| VANNIYAR | Platinum | 9116000001 | 9116000002 | 2053-10-05 |
| NAIDU | Free | 9121000001 | 9121000002 | — |
| NAIDU | Starter | 9122000001 | 9122000002 | 2026-06-20 |
| NAIDU | Classic | 9123000001 | 9123000002 | 2026-08-19 |
| NAIDU | Silver | 9124000001 | 9124000002 | 2026-08-19 |
| NAIDU | Gold | 9125000001 | 9125000002 | 2026-11-17 |
| NAIDU | Platinum | 9126000001 | 9126000002 | 2053-10-05 |
| AADITRAVIDAR | Free | 9131000001 | 9131000002 | — |
| AADITRAVIDAR | Starter | 9132000001 | 9132000002 | 2026-06-20 |
| AADITRAVIDAR | Classic | 9133000001 | 9133000002 | 2026-08-19 |
| AADITRAVIDAR | Silver | 9134000001 | 9134000002 | 2026-08-19 |
| AADITRAVIDAR | Gold | 9135000001 | 9135000002 | 2026-11-17 |
| AADITRAVIDAR | Platinum | 9136000001 | 9136000002 | 2053-10-05 |
| MUDALIAR | Free | 9141000001 | 9141000002 | — |
| MUDALIAR | Starter | 9142000001 | 9142000002 | 2026-06-20 |
| MUDALIAR | Classic | 9143000001 | 9143000002 | 2026-08-19 |
| MUDALIAR | Silver | 9144000001 | 9144000002 | 2026-08-19 |
| MUDALIAR | Gold | 9145000001 | 9145000002 | 2026-11-17 |
| MUDALIAR | Platinum | 9146000001 | 9146000002 | 2053-10-05 |
| FREECASTEBAR | Free | 9151000001 | 9151000002 | — |
| FREECASTEBAR | Starter | 9152000001 | 9152000002 | 2026-06-20 |
| FREECASTEBAR | Classic | 9153000001 | 9153000002 | 2026-08-19 |
| FREECASTEBAR | Silver | 9154000001 | 9154000002 | 2026-08-19 |
| FREECASTEBAR | Gold | 9155000001 | 9155000002 | 2026-11-17 |
| FREECASTEBAR | Platinum | 9156000001 | 9156000002 | 2053-10-05 |

---

## Plan 1 — Free

**Login with**: `9111000001` (Male VANNIYAR) or `9111000002` (Female)

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| F-01 | Home screen loads profiles | Login → Home tab | Profile cards visible, **photos blurred** (BlurOverlay + lock icon) |
| F-02 | Send 3 interest requests | Open any 3 profiles → tap Interest button | All 3 succeed |
| F-03 | 4th interest request blocked | Open 4th profile → tap Interest | "Quota exhausted" popup → redirect to PremiumTab |
| F-04 | Profile detail shows LIMITED info | Open any profile → check contact section | Mobile / email / horoscope fields are null / masked |
| F-05 | Photo gallery blocked | Profile detail → tap any photo to expand | `popup.premiumRequired` appears |
| F-06 | MailBox has 3 tabs only | Tap mailBox tab | Tabs: Received / Sent / Permissions — **no "Shortlisted You"** tab |
| F-07 | Family Access hidden in Settings | Settings page | **No "Family Access" menu row** |
| F-08 | Advanced search filters unavailable | Search → filter icon | Star / Dosham / Income / Height filters not shown or disabled |
| F-09 | Plan badges on other users | Scroll home / explore | Silver/Gold/Platinum users show colored badge with ✓ |
| F-10 | Chat blocked | Profile detail → chat icon | Gate fires, premium popup shown |
| F-11 | Shortlist works | Tap heart/shortlist on any profile | Saved without error |
| F-12 | Voice Call CTA hidden | Profile detail header | Voice call button absent |
| F-13 | WhatsApp share hidden | Profile detail header | WhatsApp button absent |

---

## Plan 2 — Starter

**Login with**: `9112000001` / PIN `1234`

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| ST-01 | Send up to 25 interests | Send interests to 25 different profiles | All succeed (REQ_LIMITED = 25) |
| ST-02 | 26th interest blocked | Send 26th interest | Quota popup fires |
| ST-03 | Who Viewed Me — capped at 5 | Notification / profile screen → "who viewed" | Max 5 entries visible |
| ST-04 | Full photos viewable | Open profile detail → tap photo | Photo modal opens normally |
| ST-05 | FULL profile view | Open any profile | Name, age, occupation, education visible |
| ST-06 | Chat limited to 5 messages | Open chat → send 6 messages | 6th message blocked (MESSAGE limit = 5) |
| ST-07 | Advanced search still locked | Search → filter | ADV_SEARCH not in Starter plan — star/dosham filters hidden |
| ST-08 | Shortlist available | Heart icon on profile | Works |
| ST-09 | Contact info still masked | Open profile → Personal tab | Mobile / email not shown (VIEW_PERSONAL_INFO not in Starter) |

---

## Plan 3 — Classic

**Login with**: `9113000001` / PIN `1234`

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| CL-01 | Advanced search filters available | Search → filter | Star, Dosham, Income, Height filters shown and functional |
| CL-02 | Send up to 15 interests | Send 15 interests | All succeed (SEND_REQUEST = 15) |
| CL-03 | 16th interest blocked | 16th send | Quota popup |
| CL-04 | Who Viewed Me — up to 20 | Profile → who viewed | Up to 20 entries |
| CL-05 | View personal info (40 profiles) | Open profile → Personal tab | Mobile / email visible (VIEW_PERSONAL_INFO = 40) |
| CL-06 | 41st personal info reveal blocked | 41st profile contact tab | Server masks or quota error |
| CL-07 | Horoscope visible | Profile → Religious tab | Jathagam / horoscope section shows content |
| CL-08 | Basic Star Match | Profile detail → Star Match CTA | Returns basic compatibility score |
| CL-09 | Unlimited chat | Send 20+ messages in a chat | No block (MESSAGE = unlimited) |
| CL-10 | Daily match alerts | Background push | Morning notification with fresh matches |
| CL-11 | "Shortlisted You" tab absent | MailBox | Only 3 tabs — no 4th tab |
| CL-12 | Profile boost unavailable | Settings or profile page | Boost button absent or credits = 0 |
| CL-13 | Voice Call CTA hidden | Profile detail | Button absent (Silver+) |

---

## Plan 4 — Silver

**Login with**: `9114000001` / PIN `1234`

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| SV-01 | Unlimited interest requests | Send interests beyond 50 | No quota error |
| SV-02 | Full "Who Viewed Me" | Profile → who viewed | All-time list, no cap |
| SV-03 | Personal info unlimited | Open 50+ profiles → Personal tab | Mobile / email always visible |
| SV-04 | Voice Call request CTA visible | Profile detail header | **Call request button shown** (Silver+) |
| SV-05 | Full Star Match | Star Match on profile | Complete porutham / 10-point score |
| SV-06 | Education verified badge | Open a profile with education_verified=1 | Education badge shown |
| SV-07 | ID verified badge | Open profile with id_verified=1 | ID badge shown |
| SV-08 | High visibility in search | Logged-in user appears in search results | Ranks above Starter/Classic users |
| SV-09 | SecureConnect | Personal tab phone number | In-app proxy / masked number |
| SV-10 | "Shortlisted You" tab ABSENT | MailBox | 3 tabs only (Gold+ required) |
| SV-11 | Family Access ABSENT | Settings | No Family Access row (Gold+ only) |
| SV-12 | WhatsApp share ABSENT | Profile detail | No WhatsApp button (Gold+ only) |
| SV-13 | Income verified badge ABSENT | Profile detail | Not shown (Gold+ only) |
| SV-14 | Verify badge on own profile | Own profile card | Silver plan badge + ✓ verification mark visible |

---

## Plan 5 — Gold

**Login with**: `9115000001` / PIN `1234`

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| G-01 | "Shortlisted You" 4th tab | MailBox | **4th tab present**, loads `GET /mailbox/whoShortlistedMe/...` |
| G-02 | Shortlisted You shows shortlisters | Another user shortlists Gold account → check tab | Shortlister listed with photo + name |
| G-03 | Family Access in Settings | Settings → Family Access | Row visible and tappable |
| G-04 | Add family member | FamilyAccessScreen → Add | Form opens: name, relationship chips, mobile, 4-digit PIN |
| G-05 | Family login works | Use parent mobile+PIN to login | `userRole=PARENT` in AsyncStorage; banner shown in settings |
| G-06 | Parent blocked from editing | Login as parent → Settings | Privacy / Change PIN / Family Access hidden; About edit blocked |
| G-07 | WhatsApp share button | Profile detail header | Button visible, tap shares profile link |
| G-08 | Voice Call CTA | Profile detail header | Button visible |
| G-09 | Income verified badge | Profile with income_verified=1 | Gold badge shown |
| G-10 | Profile boost credits = 2 | Profile page → Boost | 2 credits available |
| G-11 | Priority search | Compare Gold vs Silver in search results | Gold user ranked higher |
| G-12 | Video profile request | Profile detail | Request CTA visible |
| G-13 | Who Shortlisted You | MailBox 4th tab | Full list accessible |
| G-14 | All Silver features pass | Run SV-01 through SV-09 | All pass |

---

## Plan 6 — Platinum

**Login with**: `9116000001` / PIN `1234`

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| P-01 | All Gold features pass | Run G-01 through G-13 | All pass |
| P-02 | Boost credits = 5 | Profile page → Boost | 5 credits shown |
| P-03 | Dedicated RM feature | ServiceRequest → DEDICATED_RM type | Request submitted successfully |
| P-04 | Family assisted matchmaking | ServiceRequest → FAMILY_ASSISTED_MATCH | Request submitted |
| P-05 | Speak With Families | ServiceRequest → SPEAK_FAMILY | Request submitted |
| P-06 | Subscription end date | Check AsyncStorage `subscriptionData.endDate` | Year ~2053 (9999 days) |
| P-07 | Payment screen — CONTACT mode | Settings → Upgrade → any plan | Shows RelationshipManagerView (name, mobile, time slot form) |
| P-08 | Payment mode flip to QR | `UPDATE keyValue SET valueColumn='{"mode":"QR"}' WHERE keyColumn='PAYMENT_MODE'` → reopen PaymentScreen | Shows QR/UPI screen after 5-min cache expires |
| P-09 | MyRequestsScreen | Settings → My Requests | All service requests listed with status chips |
| P-10 | Callback request form | RelationshipManagerView → submit | POST to `/callback-request/create/{userId}` succeeds |

---

## Cross-Plan Integration Tests

| ID | Test Case | Accounts | Steps | Expected |
|---|---|---|---|---|
| X-01 | Free sees blur on Silver's profile | Free: 9111000001 / Silver: 9114000001 | Free user opens Silver user's profile card | Photos blurred, lock icon shown |
| X-02 | Silver sees Free's unblurred profile | Silver: 9114000001 / Free: 9111000002 | Silver opens Free profile | No blur |
| X-03 | Gold shortlists Free; Free can't see shortlister | Gold: 9115000001 / Free: 9111000002 | Gold shortlists Free → Free checks mailBox | Free sees no "Shortlisted You" tab |
| X-04 | Interest request end-to-end | Any two accounts | User A sends interest → User B receives in mailBox Received tab → B accepts → connection established | Flow completes |
| X-05 | Expired subscription = Free | Any paid account | Set `status='EXPIRED'` in user_subscriptions → restart app | User treated as Free plan (blur reappears, quota enforced) |
| X-06 | ProfileUnderVerification screen | Any account | Set `userStatus='PENDING'` → login | Redirected to ProfileUnderVerificationScreen |
| X-07 | Rejected profile screen | Any account | Set `userStatus='REJECTED'`, set `rejection_reason='Test rejection'` → login | Rejection reason shown on screen |
| X-08 | Search returns 100+ NAIDU profiles | Any account | Search → filter by NAIDU caste | Returns ~102 results (100 bulk + 2 credential accounts) |
| X-09 | Discovery deck shows multiple castes | Free: 9111000001 | Home screen swipe deck | NAIDU, MUDALIAR, FREECASTEBAR profiles appear in suggestions |
| X-10 | Chat blocked by plan (Free sends to Silver) | Free: 9111000001 / Silver: 9114000001 | Free user taps chat on Silver profile | Gate fires — premium popup shown |

---

## How to Run Tests on Production DB

Run the same two scripts against your production DB:

```bash
# Replace password as appropriate
mysql -u root -p'YOUR_PROD_PASSWORD' YOUR_PROD_DB < test-data/01_bulk_users.sql
mysql -u root -p'YOUR_PROD_PASSWORD' YOUR_PROD_DB < test-data/02_plan_credentials.sql
```

Both scripts are **idempotent** — they check for existing mobile numbers before inserting, so re-running will not create duplicates.

---

## Clean Up Test Data (if needed)

```sql
-- Remove all test-seeded users and their related data
DELETE ud FROM user_details ud
JOIN users u ON ud.userId = u.userId
WHERE u.createdBy = 'test-seed';

DELETE us FROM user_subscriptions us
JOIN users u ON us.userId = u.userId
WHERE u.createdBy = 'test-seed';

DELETE FROM users WHERE createdBy = 'test-seed';
```
