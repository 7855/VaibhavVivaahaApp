// ─────────────────────────────────────────────────────────────────────────────
//  profileSections.ts — ONE place that knows how the profile is split into
//  editable sections, and where each profile-completion field lives.
//
//  Two consumers:
//   • the profile tab and EditProfileSection both turn the raw
//     /user/getUserByUserId payload into per-section form values with
//     formatProfileSections() — it used to live only in profile.tsx, which meant
//     the editor could ONLY be opened from that tab (it needed the values handed
//     over as a route param). Now the editor can load itself, so Home's
//     "Add Height & Weight" can open it directly.
//   • the completion widget + the guided "Complete your profile" flow map the
//     backend's missingFields / nextAction onto a destination
//     (resolveCompletionTarget → navigateToCompletionTarget).
//
//  The field keys below are the backend's `requiredFields` names in
//  UserDetailService.calculateProfileCompletion — keep them in sync.
// ─────────────────────────────────────────────────────────────────────────────

import { requestProfileFocus } from './profileRefresh';

export type SectionKey = 'PersonalDetail' | 'ReligiousDetail' | 'EducationalDetail' | 'FamilyDetail';

export type CompletionTarget =
  | { kind: 'section'; section: SectionKey; field?: string }
  | { kind: 'photo' }
  | { kind: 'horoscope' }
  | { kind: 'interests' };

export type ProfileSection = { section: string; data: Record<string, any> };

/**
 * Raw profile payload → the four editable sections (plus InterestsDetail).
 * Pure: the caste name resolver is passed in because it lives in MasterDataContext.
 */
export function formatProfileSections(
  data: any,
  getCasteName?: (id: any) => string | undefined,
): ProfileSection[] {
  if (!data?.userDetail?.length) return [];
  const d = data.userDetail[0];
  // Per-field tolerant parse: one malformed JSON column must never blank the
  // whole profile. familyInfo/astronomicInfo arrive as an ARRAY on old rows
  // and an OBJECT on new signups — accept both.
  const safeParse = (raw: any, fallback: any) => {
    try { const v = typeof raw === 'string' ? JSON.parse(raw) : raw; return v ?? fallback; }
    catch { return fallback; }
  };
  const firstOf = (v: any) => (Array.isArray(v) ? v[0] || {} : (v && typeof v === 'object' ? v : {}));
  const basic = firstOf(safeParse(d.basicInfo, {}));
  const astro = firstOf(safeParse(d.astronomicInfo, []));
  const fam = firstOf(safeParse(d.familyInfo, []));
  return [
    { section: 'PersonalDetail', data: { 'First Name': data.firstName || '-', 'Last Name': data.lastName || '-', Gender: data.gender === 'M' ? 'Male' : 'Female', 'Date of Birth': data.dob || '-', Height: d.height || '-', Weight: d.weight || '-', 'Physical Status': basic.physical_status || '-', 'Marital Status': basic.marital_status || '-', 'Mother Language': basic.mother_language || 'Not specified', 'Mobile Number': data.mobile || '-', Email: data.email || '-', 'Current Address': d.presentAddress || '-', 'Native Place': d.permanentAddress || '-', 'Place of Birth': basic.place_of_birth || '-' } },
    // Caste resolves from the cached caste master list; Subcaste is optional and falls
    // back to the same "-" placeholder every other empty field uses.
    { section: 'ReligiousDetail', data: { Religion: 'Hindu', Caste: getCasteName?.(data.casteId) || '-', Subcaste: data.subcasteName || '-', Star: astro.star || '-', 'Moon Sign': astro.moon_sign || '-', Lagnam: astro.lagnam || '-', Dosham: astro.dosham || '-', 'Birth Time': astro.birth_time || '' } },
    { section: 'EducationalDetail', data: { Education: d.degree || '-', Occupation: d.occupation || '-', 'Employing In': d.employedAt === 'GOVT' ? 'Government' : d.employedAt === 'PRIVATE' ? 'Private' : 'Self', 'Annual Income': d.annualIncome ? d.annualIncome + '' : '-', 'Job Place': d.jobPlace || '-', 'Education in Detail': d.educationInDetail || '-' } },
    { section: 'FamilyDetail', data: { 'Family Type': (fam.family_type ?? fam.familyType)?.trim?.() || '-', 'Family Status': fam.family_status?.trim() || '-', 'Fathers Name': fam.father?.trim() || '-', 'Fathers Occupation': fam.father_occupation?.trim() || '-', 'Mothers Name': fam.mother?.trim() || '-', 'Mothers Occupation': fam.mother_occupation?.trim() || '-', 'No of Siblings': fam.no_of_siblings?.toString() || '-', 'No of Brothers': fam.no_of_brother?.toString() || '-', 'No of Sisters': fam.no_of_sister?.toString() || '-', 'Sister Married': fam.sister_married?.trim() || '-', 'Brother Married': fam.brother_married?.trim() || '-' } },
    { section: 'InterestsDetail', data: (() => { try { const h = d?.hobbies; const arr = typeof h === 'string' ? JSON.parse(h) : h; return { _hobbies: Array.isArray(arr) ? arr : [] }; } catch { return { _hobbies: [] }; } })() },
  ];
}

// ── Where each completion field lives ────────────────────────────────────────
// `field` is the EditProfileSection form label to scroll to. Fields with no
// `field` are read-only on the editor (gender, caste) or not editable in-app at
// all (location) — the section still opens so the member sees the lock reason.
const S = (section: SectionKey, field?: string): CompletionTarget => ({ kind: 'section', section, field });

export const FIELD_TARGET: Record<string, CompletionTarget> = {
  profileImage: { kind: 'photo' },
  horoscope: { kind: 'horoscope' },
  hobbies: { kind: 'interests' },

  firstName: S('PersonalDetail', 'First Name'),
  lastName: S('PersonalDetail', 'Last Name'),
  dateOfBirth: S('PersonalDetail', 'Date of Birth'),
  gender: S('PersonalDetail'),
  height: S('PersonalDetail', 'Height'),
  weight: S('PersonalDetail', 'Weight'),
  maritalStatus: S('PersonalDetail', 'Marital Status'),
  motherLanguage: S('PersonalDetail', 'Mother Language'),
  currentAddress: S('PersonalDetail', 'Current Address'),
  nativePlace: S('PersonalDetail', 'Native Place'),
  location: S('PersonalDetail'),

  caste: S('ReligiousDetail'),
  star: S('ReligiousDetail', 'Star'),
  moonSign: S('ReligiousDetail', 'Moon Sign'),
  lagnam: S('ReligiousDetail', 'Lagnam'),
  dosham: S('ReligiousDetail', 'Dosham'),
  birthTime: S('ReligiousDetail', 'Birth Time'),

  education: S('EducationalDetail', 'Education'),
  occupation: S('EducationalDetail', 'Occupation'),
  employedAt: S('EducationalDetail', 'Employing In'),
  annualIncome: S('EducationalDetail', 'Annual Income'),
  jobPlace: S('EducationalDetail', 'Job Place'),
  educationInDetail: S('EducationalDetail', 'Education in Detail'),

  familyType: S('FamilyDetail', 'Family Type'),
  familyStatus: S('FamilyDetail', 'Family Status'),
  fatherName: S('FamilyDetail', 'Fathers Name'),
  fatherOccupation: S('FamilyDetail', 'Fathers Occupation'),
  motherName: S('FamilyDetail', 'Mothers Name'),
  motherOccupation: S('FamilyDetail', 'Mothers Occupation'),
  // Siblings is derived from brothers + sisters on the editor, so land on the first input.
  numberOfSiblings: S('FamilyDetail', 'No of Brothers'),
  noOfBrothers: S('FamilyDetail', 'No of Brothers'),
  noOfSisters: S('FamilyDetail', 'No of Sisters'),
  brotherMarried: S('FamilyDetail', 'Brother Married'),
  sisterMarried: S('FamilyDetail', 'Sister Married'),
};

/** Member-facing label for a missing field (used by the guided flow's step subtitles). */
export const FIELD_LABEL: Record<string, string> = {
  profileImage: 'Profile photo', horoscope: 'Horoscope', hobbies: 'Interests',
  firstName: 'First name', lastName: 'Last name', dateOfBirth: 'Date of birth', gender: 'Gender',
  height: 'Height', weight: 'Weight', maritalStatus: 'Marital status', motherLanguage: 'Mother tongue',
  currentAddress: 'Current address', nativePlace: 'Native place', location: 'District',
  caste: 'Caste', star: 'Star', moonSign: 'Moon sign', lagnam: 'Lagnam', dosham: 'Dosham', birthTime: 'Birth time',
  education: 'Education', occupation: 'Occupation', employedAt: 'Employing in', annualIncome: 'Annual income',
  jobPlace: 'Job place', educationInDetail: 'Education in detail',
  familyType: 'Family type', familyStatus: 'Family status', fatherName: "Father's name",
  fatherOccupation: "Father's occupation", motherName: "Mother's name", motherOccupation: "Mother's occupation",
  numberOfSiblings: 'Siblings', noOfBrothers: 'Brothers', noOfSisters: 'Sisters',
  brotherMarried: 'Brothers married', sisterMarried: 'Sisters married',
};

// The backend groups several fields under one nextAction key. Listed in the
// order the editor shows them, so "first still-missing" is also "topmost".
const ACTION_FIELDS: Record<string, string[]> = {
  PROFILE_IMAGE: ['profileImage'],
  HOROSCOPE: ['horoscope'],
  HOBBIES: ['hobbies'],
  HEIGHT_WEIGHT: ['height', 'weight'],
  HEIGHT: ['height'],
  WEIGHT: ['weight'],
  WORK_INCOME: ['annualIncome', 'jobPlace', 'educationInDetail'],
  ADDRESS: ['currentAddress', 'nativePlace'],
  FAMILY_DETAILS: ['fatherName', 'fatherOccupation', 'motherName', 'motherOccupation'],
};

const FIELD_KEYS_LOWER: Record<string, string> = Object.fromEntries(
  Object.keys(FIELD_TARGET).map((k) => [k.toLowerCase(), k]),
);

/**
 * nextAction (+ the missingFields list the same response carries) → destination.
 * Prefers the action `key` the server now sends; falls back to title keywords
 * for a jar built before the key existed; finally to the first missing field.
 */
export function resolveCompletionTarget(
  action: { key?: string; title?: string } | null | undefined,
  missingFields: string[] = [],
): CompletionTarget {
  const missing = new Set(missingFields);
  const firstMissingOf = (fields: string[]) => fields.find((f) => missing.has(f)) ?? fields[0];

  const key = String(action?.key || '').toUpperCase();
  if (key && ACTION_FIELDS[key]) {
    return FIELD_TARGET[firstMissingOf(ACTION_FIELDS[key])];
  }
  // createDefaultNextAction keys are the field name upper-cased ("MARITALSTATUS").
  if (key && FIELD_KEYS_LOWER[key.toLowerCase()]) {
    return FIELD_TARGET[FIELD_KEYS_LOWER[key.toLowerCase()]];
  }

  const t = String(action?.title || '').toLowerCase();
  if (t.includes('photo')) return FIELD_TARGET.profileImage;
  if (t.includes('horoscope')) return FIELD_TARGET.horoscope;
  if (t.includes('interest') || t.includes('hobb')) return FIELD_TARGET.hobbies;
  if (t.includes('height')) return FIELD_TARGET[firstMissingOf(['height', 'weight'])];
  if (t.includes('weight')) return FIELD_TARGET.weight;
  if (t.includes('work') || t.includes('income') || t.includes('job')) return FIELD_TARGET[firstMissingOf(ACTION_FIELDS.WORK_INCOME)];
  if (t.includes('address')) return FIELD_TARGET[firstMissingOf(ACTION_FIELDS.ADDRESS)];
  if (t.includes('family')) return FIELD_TARGET[firstMissingOf(ACTION_FIELDS.FAMILY_DETAILS)];

  for (const f of missingFields) if (FIELD_TARGET[f]) return FIELD_TARGET[f];
  return S('PersonalDetail');
}

/**
 * Opens the destination. Section targets open the full-page editor directly
 * (it loads its own values now); photo / horoscope / interests live on the
 * profile tab, which reads the one-shot focus request on its next focus and
 * scrolls + opens the control. (A route param was tried first: re-pushing an
 * already-mounted tab did not re-deliver it, so the second tap did nothing.)
 */
export function navigateToCompletionTarget(
  router: { push: (to: any) => void },
  target: CompletionTarget,
  extra: Record<string, string> = {},
): void {
  if (target.kind === 'section') {
    router.push({
      pathname: '/(root)/screens/EditProfileSection',
      params: { section: target.section, ...(target.field ? { focus: target.field } : {}), ...extra },
    });
    return;
  }
  requestProfileFocus(target.kind);
  router.push({ pathname: '/(root)/(tabs)/profile', params: extra });
}

// ── Guided flow ──────────────────────────────────────────────────────────────
export type CompletionStep = {
  id: string;
  title: string;
  emoji: string;
  target: CompletionTarget;
  /** Backend field keys still missing in this step (empty = done). */
  missing: string[];
};

const STEP_ORDER: { id: string; title: string; emoji: string; target: CompletionTarget }[] = [
  { id: 'photo', title: 'Profile photo', emoji: '📷', target: { kind: 'photo' } },
  { id: 'PersonalDetail', title: 'Personal details', emoji: '👤', target: S('PersonalDetail') },
  { id: 'EducationalDetail', title: 'Education & career', emoji: '💼', target: S('EducationalDetail') },
  { id: 'ReligiousDetail', title: 'Religious details', emoji: '🕉️', target: S('ReligiousDetail') },
  { id: 'FamilyDetail', title: 'Family details', emoji: '👨‍👩‍👧‍👦', target: S('FamilyDetail') },
  { id: 'horoscope', title: 'Horoscope', emoji: '🔮', target: { kind: 'horoscope' } },
  { id: 'interests', title: 'Interests & hobbies', emoji: '🎨', target: { kind: 'interests' } },
];

const stepIdOf = (t: CompletionTarget) => (t.kind === 'section' ? t.section : t.kind);

/**
 * missingFields → every step in display order, each carrying the fields it still
 * needs. Steps with nothing missing are returned too (marked done) so the flow
 * can show "4 of 7" honestly rather than hiding finished work.
 */
export function buildCompletionSteps(missingFields: string[] = []): CompletionStep[] {
  const byStep: Record<string, string[]> = {};
  for (const f of missingFields) {
    const target = FIELD_TARGET[f];
    if (!target) continue;
    const id = stepIdOf(target);
    (byStep[id] ||= []).push(f);
  }
  return STEP_ORDER.map((s) => {
    const missing = byStep[s.id] || [];
    // Point the editor at the topmost missing field of that section.
    const first = missing[0] ? FIELD_TARGET[missing[0]] : undefined;
    const target: CompletionTarget =
      s.target.kind === 'section' && first?.kind === 'section' && first.field
        ? { kind: 'section', section: s.target.section, field: first.field }
        : s.target;
    return { ...s, target, missing };
  });
}
