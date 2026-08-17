// Shared per-plan feature checklist, built from the REAL `features`/`planFeatures` tables via
// GET /planFeatures/matrix (same data the admin "Plan Features" page edits). Extracted from
// PremiumTab.tsx so RelationshipManagerView (the PAYMENT_MODE=CONTACT flow) can show the same
// full, truthful feature list instead of a hardcoded 4-bullet marketing sample — a member
// deciding on a plan through the assisted flow deserves the same information as one on the
// self-serve plan page.

export interface ChecklistRow {
  label: string;
  included: boolean;
}

// A curated, ordered subset of the real feature codes. `VIEW_PROFILE_DETAILS` and
// `PROFILE_BOOST` are special-cased in `buildChecklistByPlan()` (see its comment) since a raw
// non-null cell value isn't the same as "meaningfully included" for those two.
export const CHECKLIST_ITEMS: { code: string; label: string }[] = [
  { code: 'BASIC_SEARCH', label: 'Basic search filters' },
  { code: 'ADV_SEARCH', label: 'Advanced search filters' },
  { code: 'VIEW_PROFILE_DETAILS', label: 'Full profile details' },
  { code: 'REQ_UNLIMITED', label: 'Unlimited interest requests' },
  { code: 'MESSAGE', label: 'Direct messaging' },
  { code: 'VIEW_PERSONAL_INFO', label: 'Reveal contact details' },
  { code: 'WHO_VIEWED', label: 'See who viewed you' },
  { code: 'WHO_LIKED', label: 'See who liked you' },
  { code: 'WHO_SHORTLISTED_YOU', label: 'See who shortlisted you' },
  { code: 'VERIFY_BADGE', label: 'Verified profile badge' },
  { code: 'HIGH_VISIBILITY', label: 'Higher visibility in search' },
  { code: 'PRIORITY_SEARCH', label: 'Priority placement in search' },
  { code: 'HOROSCOPE_VIEW', label: 'Horoscope view' },
  { code: 'STAR_MATCH', label: 'Star match compatibility' },
  { code: 'SECURE_CONNECT', label: 'SecureConnect masked calling' },
  { code: 'VOICE_CALL', label: 'In-app voice call' },
  { code: 'VIDEO_PROFILE', label: 'Video profile' },
  { code: 'WHATSAPP_SHARE', label: 'WhatsApp profile share' },
  { code: 'FAMILY_LOGIN', label: 'Family / parent login' },
  { code: 'SPEAK_FAMILY', label: 'Speak directly with families' },
  { code: 'INCOME_VERIFIED_BADGE', label: 'Income verified badge' },
  { code: 'PROFILE_BOOST', label: 'Monthly profile boost' },
  { code: 'DEDICATED_RM', label: 'Dedicated relationship manager' },
  { code: 'FAMILY_ASSISTED_MATCH', label: 'Family-assisted matchmaking' },
];

// Builds { planTitle: ChecklistRow[] } from the raw `/planFeatures/matrix` response
// ({ plans, features, cells }) — cells only carry numeric ids, so this resolves them back to
// plan titles / feature codes first.
export function buildChecklistByPlan(
  matrix: { plans?: any[]; features?: any[]; cells?: any[] }
): Record<string, ChecklistRow[]> {
  const featureIdToCode: Record<number, string> = {};
  (matrix.features || []).forEach((f: any) => { featureIdToCode[f.id] = f.code; });

  const planIdToTitle: Record<number, string> = {};
  (matrix.plans || []).forEach((p: any) => { planIdToTitle[p.id] = p.title; });

  const valuesByPlan: Record<string, Record<string, string>> = {};
  (matrix.cells || []).forEach((cell: any) => {
    const title = planIdToTitle[cell.subscriptionPlanId];
    const code = featureIdToCode[cell.featureId];
    if (!title || !code) return;
    if (!valuesByPlan[title]) valuesByPlan[title] = {};
    valuesByPlan[title][code] = cell.limitValue;
  });

  const result: Record<string, ChecklistRow[]> = {};
  Object.keys(valuesByPlan).forEach((title) => {
    result[title] = CHECKLIST_ITEMS.map(({ code, label }) => {
      const value = valuesByPlan[title][code];
      let included: boolean;
      if (code === 'VIEW_PROFILE_DETAILS') {
        included = value === 'FULL'; // Free's LIMITED shouldn't render as a checkmark
      } else if (code === 'PROFILE_BOOST') {
        included = Number(value) > 0; // Classic/Silver have a "0 per month" row — that's really "no boost"
      } else {
        included = value != null;
      }
      return { label, included };
    });
  });
  return result;
}
