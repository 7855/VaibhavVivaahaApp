# Search Filter — Test Plan

Every expected number below was **computed from your local `vvm_db` and verified against the running API** on 2026-08-12. If a run disagrees with these numbers, it is a real regression (or your data changed — re-run the SQL in §6 to recompute).

---

## 1. How search works (read first — most "bugs" turn out to be these rules)

Four things are applied **automatically**, before any filter you set:

| Rule | Effect |
|---|---|
| **Caste-scoped** | You only ever see members of **your own caste**. A Vanniyar user never sees Mudaliar profiles. |
| **Opposite gender** | Male searcher → female results, and vice versa. |
| **Must have a completed profile** | Both queries `INNER JOIN user_details`. A user row without a `user_details` row is **invisible to search**. This is why the pool is 95, not 136. |
| **Blocked users removed** | Anyone you blocked (or who blocked you) is excluded. |

⚠️ **This last one explains an off-by-one you WILL see.** Test account **702 has blocked user 707**. So every 702 result is exactly 1 lower than a raw SQL count whenever 707 would have qualified. Account 700 has no blocks and returns the full pool. Not a bug.

---

## 2. Test accounts (local DB)

| User | Name | Mobile | PIN | Gender | Caste | Plan | Use for |
|---|---|---|---|---|---|---|---|
| 26 | Sneha | 9076543217 | **1111** | F | Vanniyar | **Free** | Non-premium gating |
| 700 | VannClassic | 9113000001 | **1234** | M | Vanniyar | **Classic** | Adv search yes / subcaste **no** |
| 702 | VannSilver | 9114000001 | **1234** | M | Vanniyar | **Silver** | Full filters incl. subcaste |
| 43 | Selva G | 63798297500 | *(bcrypt — use your own)* | M | Vanniyar | **Gold** | Same as Silver |
| 706 | VannPlatinum | 9116000001 | **1234** | M | Vanniyar | **Platinum** | Same as Silver |

Searching as 700/702/706 → the pool is **Vanniyar females** (95 searchable).

---

## 3. Core scenarios — ✅ all verified against the live API

Log in as **702 (Silver)** unless stated. In the app: **Explore → filters → Search**.

| # | Input (what you set in the UI) | Expected result | Verified |
|---|---|---|---|
| S1 | No filters at all | **94** profiles | ✅ |
| S2 | Age 20–30 | **40** | ✅ |
| S3 | Subcaste = Padayachi | **30** (13 Padayachi **+ 17 Others**) | ✅ |
| S4 | Subcaste = Padayachi + Palli | **43** | ✅ |
| S5 | Photo only = ON | **39** | ✅ |
| S6 | Horoscope only = ON | **40** | ✅ |
| S7 | City = Chennai | **39** | ✅ |
| S8 | Education = M.Sc | **19** | ✅ |
| S9 | Age 20–30 **+** Chennai **+** Padayachi | **4** | ✅ |

**S9 is the important one** — it proves filters combine with AND. If it returns more than 4, filters are being dropped.

### Subcaste distribution (searchable Vanniyar females)

| Subcaste | id | Count |
|---|---|---|
| Padayachi | 1 | 13 |
| Gounder / Naicker | 2 | 12 |
| Palli | 3 | 14 |
| Kandar | 4 | 18 |
| Mazhavarayar / Kachirayar | 5 | 21 |
| **Others** | 32 | **17** |

---

## 4. Subcaste behaviour — the rules to check carefully

**"Others" always rides along, ranked last.** Searching Padayachi returns Padayachi profiles **first**, then all 17 "Others" profiles at the end. Rationale: an "Others" member may actually *be* Padayachi and simply didn't specify.

| # | Test | Expected |
|---|---|---|
| S11 | Search 1 subcaste, scroll to the bottom | Exact matches first, then "Others" — **never interleaved** |
| S12 | Search Padayachi — check no Palli/Kandar appears | Only Padayachi + Others |
| S13 | Search "Others" itself | Returns the 17 Others profiles |
| S14 | **No** subcaste selected | All subcastes appear, "Others" **not** pushed to the bottom (S1 ordering unchanged) |

**S14 matters** — it proves the ranking only activates when filtering, and normal search ordering (boost → plan tier) is untouched.

---

## 5. Plan gating — subcaste search is **Silver+**

| # | Log in as | Action | Expected | Verified |
|---|---|---|---|---|
| S10 | **700 (Classic)** | Send subcaste filter | **Filter ignored → 95** (all subcastes) | ✅ |
| S15 | **26 (Free)** | Open filters | Subcaste row shows 🔒 → tapping opens upgrade popup | |
| S16 | **700 (Classic)** | Open filters | Subcaste 🔒 (Classic has adv-search but **not** subcaste) | |
| S17 | **702 / 706** | Open filters | Subcaste chips fully usable | |

S10 is the security check: even if someone calls the API directly, the server **silently drops** `subcasteIds` for a non-entitled user rather than honouring it.

---

## 6. Recompute expectations if your data changes

```sql
-- Baseline pool (change gender/casteId for other searchers)
SELECT COUNT(*) FROM users u JOIN user_details ud ON ud.userId=u.userId
WHERE u.casteId=1 AND u.gender='F' AND u.isActive='Y' AND u.isUser<>'ADM';

-- Per-subcaste counts
SELECT s.subcasteName, COUNT(*) FROM users u
JOIN user_details ud ON ud.userId=u.userId JOIN subcastes s ON s.id=u.subcasteId
WHERE u.casteId=1 AND u.gender='F' AND u.isActive='Y' AND u.isUser<>'ADM'
GROUP BY s.subcasteName;

-- Blocks that will skew a searcher's counts
SELECT * FROM blockedUsers WHERE blockedByUserId=<searcher> OR blockedUserId=<searcher>;
```

### Test any scenario directly against the API

```bash
curl -s -X POST http://localhost:9100/user/filterUsers \
  -H "Content-Type: application/json" \
  -d '{"userId":702,"gender":"F","casteId":1,"minAge":20,"maxAge":30,"subcasteIds":[1]}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print('count:',len(d.get('data') or []))"
```

`userId` is the **numeric** id (not base64) for this endpoint.

---

## 7. Spot-check profiles (Padayachi, Vanniyar female)

| userId | Name | City | Degree | Age |
|---|---|---|---|---|
| 3 | Swetha1 | Coimbatore | MBA | 32 |
| 4 | Lakshmi1 | Salem | B.Tech | 33 |
| 10 | Harini1 | Chennai | MCA | 33 |
| 185 | Kaviya | Chennai | PG | — |

Use these to verify a specific profile appears/disappears as filters change. E.g. **user 10** should appear for "Chennai + Padayachi" but **not** for "Coimbatore + Padayachi".

---

## 8. Known real issues to watch for (not filter bugs)

- **User 185 has `age = NULL`.** Rows with a null DOB are excluded by any age filter. If a member complains they're not appearing, check their DOB first.
- **41 of 136 caste-1 females have no `user_details`** and are invisible to search entirely. That's a data-completeness issue, not a filter fault.
- Education/Star/Dosham filters need **Classic+**; subcaste needs **Silver+**. Different tiers — easy to conflate when testing.
