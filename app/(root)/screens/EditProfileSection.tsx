// ─────────────────────────────────────────────────────────────────────────────
//  EditProfileSection.tsx — full-page editor for ONE profile section.
//
//  Replaces the old bottom-sheet `components/editProfileModal.tsx` (client
//  2026-09-09). The sheet had three structural problems a restyle couldn't fix:
//    · its Save button sat under the keyboard, and focusing Current Address
//      opened/closed the IME (a text input at the bottom of a bottom-sheet has
//      no scroll range — the same class of bug as the Help & Support textarea),
//    · it drew its own control system (SelectList, grey boxes) unrelated to the
//      register form, so the two read as different products, and
//    · its dropdowns were HARDCODED arrays that had drifted from the keyValue
//      master lists the register form uses — the recurring vocabulary-mismatch
//      bug (star/dosham/education/income). Picking "None" for Dosham here wrote
//      a value the search dropdown no longer offers.
//
//  This screen is a normal route, so the keyboard behaves like every other form,
//  and it renders the REGISTER form's controls (styles + CustomModalPicker) fed
//  by the SAME master data, so what you pick at signup is what you can pick here.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ChevronLeft } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import userApi from '../api/userApi';
import { useUserData } from '../contexts/UserDataContext';
import { useMasterData } from '../contexts/MasterDataContext';
import { loadMasterData } from '../services/masterService';
import { usePopup } from '../contexts/PopupContext';
import { stripNonNameChars } from '../../../constants/data';
import { markProfileDirty } from '@/utils/profileRefresh';
import { formatProfileSections } from '@/utils/profileSections';

const BG_GRADIENT = ['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa'] as const;
const CTA_GRADIENT = ['#1F7FE5', '#1862b8'] as const;

// ─── Field spec ──────────────────────────────────────────────────────────────
type Kind = 'text' | 'multiline' | 'digits' | 'picker' | 'date' | 'time' | 'readonly';

type Field = {
  /** Display label — MUST match the key used by profile.tsx's formatUserDetails. */
  label: string;
  kind: Kind;
  /** Max characters accepted while typing (client ask: every input is capped). */
  max?: number;
  /** Registration collects this field, so it may not be blanked here. */
  required?: boolean;
  /** Rendered but not editable (identity fields that need admin/support to change). */
  locked?: string;
  /** Names: letters + single internal spaces, no leading space. */
  nameRules?: boolean;
  /** Where a picker's options come from. */
  options?: string;
  keyboard?: 'default' | 'numeric' | 'email-address';
  /** Helper line under the input — for a free-text field whose expected shape isn't obvious. */
  hint?: string;
};

const SECTIONS: Record<string, { title: string; fields: Field[] }> = {
  PersonalDetail: {
    title: 'Personal Details',
    fields: [
      { label: 'First Name', kind: 'text', max: 50, required: true, nameRules: true },
      { label: 'Last Name', kind: 'text', max: 50, required: true, nameRules: true },
      // Readonly on purpose: update-personal-info has no gender field, so an
      // editable control here would silently discard the change. Gender also
      // scopes every discovery query, so it is a support-desk change, not a
      // free self-edit.
      { label: 'Gender', kind: 'readonly', locked: 'Contact support to change' },
      { label: 'Date of Birth', kind: 'date', required: true },
      { label: 'Height', kind: 'picker', options: 'height' },
      { label: 'Weight', kind: 'digits', max: 3 },
      { label: 'Physical Status', kind: 'picker', options: 'physical' },
      { label: 'Marital Status', kind: 'picker', options: 'marital' },
      { label: 'Mother Language', kind: 'picker', options: 'language' },
      // Readonly, like Gender above: mobile is the login identity and the number the team
      // calls to verify a profile, and email is the other login identity — both are
      // support-desk changes. Shown here so a member can SEE them without hunting, and so
      // the lock is explicit rather than the field simply being absent.
      { label: 'Mobile Number', kind: 'readonly', locked: 'Contact support to change' },
      { label: 'Email', kind: 'readonly', locked: 'Contact support to change' },
      { label: 'Current Address', kind: 'multiline', max: 200 },
      { label: 'Native Place', kind: 'text', max: 100 },
      // Place of BIRTH, distinct from Native Place (the family's home town): it pairs with
      // birth time for horoscope matching. Same letters-only rule as a name — a town is
      // never digits or punctuation — so the server never receives junk it cannot match.
      { label: 'Place of Birth', kind: 'text', max: 100, nameRules: true },
    ],
  },
  ReligiousDetail: {
    title: 'Religious Details',
    fields: [
      { label: 'Religion', kind: 'readonly', locked: 'Set at registration' },
      { label: 'Caste', kind: 'readonly', locked: 'Contact support to change' },
      // Client 2026-09-09: subcaste is locked here. It drives match scoping and
      // was silently re-saving the whole personal-info payload to persist (it
      // lives on the users row, not the astro JSON) — a change worth routing
      // through support rather than a free self-edit.
      { label: 'Subcaste', kind: 'readonly', locked: 'Contact support to change' },
      { label: 'Star', kind: 'picker', options: 'star' },
      { label: 'Moon Sign', kind: 'picker', options: 'moonsign' },
      { label: 'Dosham', kind: 'picker', options: 'dosham' },
      // Wheel picker, same control Star Match uses for time of birth — one consistent way to
      // enter a time, and it guarantees a parseable value for horoscope matching. Stored as
      // "hh:mm A" ("10:45 PM"); free text typed by earlier builds still displays fine.
      { label: 'Birth Time', kind: 'time', hint: 'Used for horoscope matching' },
    ],
  },
  EducationalDetail: {
    title: 'Education & Career',
    fields: [
      { label: 'Education', kind: 'picker', options: 'education', required: true },
      // A free-text field at registration, so it stays free text here — it used
      // to be a 70-entry hardcoded dropdown that could not represent what the
      // member actually typed when they signed up.
      { label: 'Occupation', kind: 'text', max: 60, required: true },
      { label: 'Employing In', kind: 'picker', options: 'employing', required: true },
      { label: 'Annual Income', kind: 'picker', options: 'income' },
      { label: 'Job Place', kind: 'text', max: 100 },
      { label: 'Education in Detail', kind: 'multiline', max: 200 },
    ],
  },
  FamilyDetail: {
    title: 'Family Details',
    fields: [
      { label: 'Family Type', kind: 'picker', options: 'familyType' },
      { label: 'Family Status', kind: 'picker', options: 'familyStatus' },
      { label: 'Fathers Name', kind: 'text', max: 50, nameRules: true },
      { label: 'Fathers Occupation', kind: 'text', max: 50 },
      { label: 'Mothers Name', kind: 'text', max: 50, nameRules: true },
      { label: 'Mothers Occupation', kind: 'text', max: 50 },
      { label: 'No of Brothers', kind: 'digits', max: 2 },
      { label: 'Brother Married', kind: 'digits', max: 2 },
      { label: 'No of Sisters', kind: 'digits', max: 2 },
      { label: 'Sister Married', kind: 'digits', max: 2 },
    ],
  },
};

// Static option lists that have no keyValue row of their own.
const STATIC_OPTIONS: Record<string, string[]> = {
  gender: ['Male', 'Female'],
  physical: ['Normal', 'Handicapped'],
  marital: ['Never Married', 'Married', 'Divorced', 'Separated', 'Widowed'],
  language: ['Tamil', 'English', 'Malayalam', 'Telugu', 'Kannada', 'Hindi'],
  moonsign: ['Mesham', 'Rishabam', 'Mithunam', 'Kadagam', 'Simmam', 'Kanni',
    'Thulam', 'Vrichigam', 'Dhanushu', 'Makaram', 'Kumbam', 'Meenam'],
  familyType: ['Nuclear', 'Joint'],
  familyStatus: ['Lower Middle Class', 'Middle Class', 'Upper Middle Class', 'Rich'],
  height: Array.from({ length: 51 }, (_, i) => (3 + i * 0.1).toFixed(1)),
};

const cleanValue = (v?: string) =>
  !v || v === '-' || v === 'Not specified' ? '' : v;

// Letters of ANY script + spaces — Tamil names included (client 2026-09-20).
// Covers First/Last/Fathers/Mothers Name via each field's `nameRules` flag.
const nameInput = (t: string, max: number) =>
  stripNonNameChars(t).replace(/^\s+/, '').replace(/\s{2,}/g, ' ').slice(0, max);

/**
 * Whitespace rule shared by EVERY text field (client 2026-09-09: "end space and
 * starting space restriction for all the inputs").
 *
 * A LEADING space is refused as it is typed. A trailing one cannot be — you have
 * to be able to type a space to start the next word — so it is trimmed on blur
 * and again at submit. Multi-line fields keep their newlines; single-line ones
 * collapse runs of spaces.
 */
const textInput = (t: string, max?: number, multiline = false) => {
  let v = t.replace(/^[^\S\n]+/, '');
  v = multiline ? v.replace(/[^\S\n]{2,}/g, ' ') : v.replace(/\s{2,}/g, ' ');
  return max ? v.slice(0, max) : v;
};

// ─── Register-form picker (same control the signup form uses) ────────────────
const Picker: React.FC<{
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  invalid?: boolean;
}> = ({ label, value, options, onSelect, invalid }) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TouchableOpacity
        style={[st.inputBox, invalid && st.inputError]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={{ color: value ? '#000' : '#999', fontSize: 14, fontFamily: 'Rubik-Regular' }}>
          {value || `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#0f1724" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={st.overlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={22} color="#0f1724" />
              </TouchableOpacity>
            </View>
            <View style={st.searchBox}>
              <Ionicons name="search" size={18} color="#1F7FE5" style={{ marginRight: 5 }} />
              <TextInput
                placeholder="Search"
                placeholderTextColor="#999"
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, height: 40, fontSize: 14, fontFamily: 'Rubik-Regular', padding: 5 }}
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item, i) => item || String(i)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={st.option}
                  onPress={() => { onSelect(item); setVisible(false); setSearch(''); }}
                >
                  <Text style={{ fontFamily: 'Rubik-Regular', color: '#0f1724' }}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={st.optionEmpty}>No matches</Text>}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

// Same 18+ rule as registration (sign-up.tsx). The backend's update-personal-info
// enforces it too and answers 400, but without this the member could pick an
// under-18 date and only learn it was invalid after pressing Save.
const MIN_AGE = 18;
const latestAllowedDob = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  d.setHours(23, 59, 59, 999);
  return d;
};
const ageOn = (dob: Date) => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

export default function EditProfileSection() {
  // `data`  — the section's current values, handed over by the profile tab so the
  //           page paints instantly. OPTIONAL since 2026-09-26: without it the page
  //           loads its own values, so Home's completion nudge (and the guided
  //           "Complete your profile" flow) can open a section directly.
  // `focus` — a field label to scroll to and highlight on open ("Height").
  // `flow`  — "2/4" when opened by the guided flow; shown as "Step 2 of 4".
  const params = useLocalSearchParams<{ section?: string; data?: string; focus?: string; flow?: string }>();
  const sectionKey = String(params.section || '');
  const spec = SECTIONS[sectionKey];

  const { userData } = useUserData();
  const { state: masterData, setMasterData, getCasteName } = useMasterData() as any;
  const popup = usePopup();

  // null = still loading (self-load mode). A param-fed page is ready at mount.
  const [initial, setInitial] = useState<Record<string, string> | null>(() => {
    if (params.data === undefined || params.data === null || params.data === '') return null;
    try { return JSON.parse(String(params.data)) as Record<string, string>; }
    catch { return {}; }
  });
  const [loadError, setLoadError] = useState(false);
  const [loadNonce, setLoadNonce] = useState(0);

  useEffect(() => {
    if (initial !== null) return;
    if (!userData?.userId) return;
    let alive = true;
    setLoadError(false);
    (async () => {
      try {
        const res = await userApi.getProfileDetails(userData.userId);
        const raw = res?.data?.data;
        const section = formatProfileSections(raw, getCasteName).find((x) => x.section === sectionKey);
        if (!alive) return;
        if (!raw || !section) { setLoadError(true); return; }
        setInitial(section.data as Record<string, string>);
      } catch (e: any) {
        console.warn('[edit-section] self-load failed:', e?.message);
        if (alive) setLoadError(true);
      }
    })();
    return () => { alive = false; };
    // getCasteName is stable enough for a one-shot load; re-running on it would refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, userData?.userId, sectionKey, loadNonce]);

  const [form, setForm] = useState<Record<string, string>>({});
  // Fill the form the moment values exist — at mount for a param-fed page, after
  // the fetch for a self-loaded one.
  useEffect(() => {
    if (!initial) return;
    const out: Record<string, string> = {};
    Object.entries(initial).forEach(([k, v]) => { out[k] = cleanValue(String(v ?? '')); });
    setForm(out);
  }, [initial]);

  // `focus` → scroll to that field and pulse it once the values are on screen.
  const scrollRef = useRef<any>(null);
  const fieldY = useRef<Record<string, number>>({});
  const [highlight, setHighlight] = useState<string | null>(null);
  const focusLabel = String(params.focus || '');
  // "2/4" from the guided flow → "Step 2 of 4 · " prefix on the subtitle.
  const flowMatch = /^(\d+)\/(\d+)$/.exec(String(params.flow || ''));
  const flowLabel = flowMatch ? `Step ${flowMatch[1]} of ${flowMatch[2]} · ` : '';
  useEffect(() => {
    if (!initial || !focusLabel) return;
    // Layout for the fields lands a frame or two after the form fills.
    const t1 = setTimeout(() => {
      const y = fieldY.current[focusLabel];
      if (typeof y === 'number') scrollRef.current?.scrollToPosition?.(0, Math.max(0, y - 12), true);
      setHighlight(focusLabel);
    }, 350);
    const t2 = setTimeout(() => setHighlight(null), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [initial, focusLabel]);
  const wrapStyle = (label: string) => [st.fieldWrap, highlight === label && st.fieldWrapFocused];
  const onFieldLayout = (label: string) => (e: any) => { fieldY.current[label] = e.nativeEvent.layout.y; };
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(new Date());

  // The pickers are only as good as the cached keyValue lists. Guard on the
  // SPECIFIC keys this screen consumes, never on "is masterData non-empty" —
  // the caste seed makes it non-empty while the keyValue lists are still absent,
  // which is exactly how the register form's dropdowns once stayed blank forever.
  React.useEffect(() => {
    const md: any = masterData || {};
    const missing = ['education', 'employingIn', 'annualIncomeRegister', 'star', 'dosham']
      .some((k) => !Array.isArray(md[k]));
    if (missing) loadMasterData(setMasterData).catch(() => { /* pickers fall back to empty */ });
  }, [masterData, setMasterData]);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const insets = useSafeAreaInsets();
  // Set the instant a save succeeds, so the confirm-on-exit prompt doesn't fire
  // on the way out of a successful save (the form is dirty vs. its ORIGINAL data
  // at that point, but nothing is actually unsaved).
  const [saved, setSaved] = useState(false);

  const baseline = useMemo(() => {
    const out: Record<string, string> = {};
    Object.entries(initial || {}).forEach(([k, v]) => { out[k] = cleanValue(String(v ?? '')).trim(); });
    return out;
  }, [initial]);

  const isDirty = useMemo(() => {
    if (saved) return false;
    const keys = new Set([...Object.keys(baseline), ...Object.keys(form)]);
    for (const k of Array.from(keys)) {
      if ((baseline[k] || '').trim() !== (form[k] || '').trim()) return true;
    }
    return false;
  }, [baseline, form, saved]);

  const set = useCallback((k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => (p[k] ? { ...p, [k]: '' } : p));
  }, []);

  /** Leaving with edits in flight asks first — Discard vs Keep editing. */
  const attemptLeave = useCallback(() => {
    if (!isDirty) { router.back(); return; }
    popup.confirm(
      'Leave without saving?',
      'You have unsaved changes on this page. If you leave now they will be lost.',
      () => router.back(),
      'Leave',
      'Cancel',
    );
  }, [isDirty, popup]);

  // Android hardware back has to be intercepted too, or it walks straight out
  // past the prompt the back pill shows.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!isDirty) return false;   // let the OS pop normally
        attemptLeave();
        return true;                  // handled — hold the screen
      });
      return () => sub.remove();
    }, [isDirty, attemptLeave])
  );

  // Options resolved from the SAME keyValue master lists the register form reads,
  // so the two forms can never offer different vocabularies for the same field.
  const optionsFor = useCallback((src?: string): string[] => {
    if (!src) return [];
    if (STATIC_OPTIONS[src]) return STATIC_OPTIONS[src];
    const md: any = masterData || {};
    switch (src) {
      case 'education':
        return (md.education || []).map((e: any) => e.degree).filter(Boolean);
      case 'employing':
        return (md.employingIn || []).map((e: any) => e.label || e.value).filter(Boolean);
      case 'income': {
        const list = md.annualIncomeRegister || md.annualIncome || [];
        return list.map((i: any) => i.label || i.amount).filter(Boolean);
      }
      case 'star':
        return (md.star || []).map((x: any) => x.name || x.value).filter(Boolean);
      case 'dosham':
        return (md.dosham || []).map((x: any) => x.name || x.value).filter(Boolean);
      default:
        return [];
    }
  }, [masterData]);

  const pickDob = (label: string, picked: Date) => {
    if (picked > new Date()) {
      setTimeout(() => popup.warning('Invalid Date', 'Date of birth cannot be a future date.'), 300);
      return;
    }
    if (ageOn(picked) < MIN_AGE) {
      setTimeout(() => popup.warning('Age Restriction', `You must be at least ${MIN_AGE} years old.`), 300);
      return;
    }
    set(label, moment(picked).format('YYYY-MM-DD'));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    spec.fields.forEach((f) => {
      if (f.kind === 'readonly') return;
      const v = (form[f.label] || '').trim();
      // Client: every field the registration form collects is mandatory here —
      // a member may not blank out data they had to provide to sign up.
      if (f.required && !v) e[f.label] = `${f.label} is required`;
      if (f.nameRules && v && v.length < 2) e[f.label] = `${f.label} is too short`;
      if (f.kind === 'date' && v) {
        const dob = moment(v, ['YYYY-MM-DD', 'DD/MM/YYYY'], true);
        if (dob.isValid() && ageOn(dob.toDate()) < MIN_AGE) {
          e[f.label] = `You must be at least ${MIN_AGE} years old`;
        }
      }
    });

    // Married counts can't exceed the sibling counts they're drawn from.
    const pairs: [string, string, string][] = [
      ['Brother Married', 'No of Brothers', 'brothers'],
      ['Sister Married', 'No of Sisters', 'sisters'],
    ];
    pairs.forEach(([marriedKey, totalKey, word]) => {
      const married = parseInt(form[marriedKey] || '', 10);
      const total = parseInt(form[totalKey] || '', 10);
      if (Number.isFinite(married) && Number.isFinite(total) && married > total) {
        e[marriedKey] = `You have ${total} ${word} — married cannot be more`;
      }
    });

    setErrors(e);
    if (Object.keys(e).length) {
      popup.error('Please check the form', Object.values(e)[0]);
      return false;
    }
    return true;
  };

  const buildPayload = (userId: string) => {
    const d = form;
    // Every value is trimmed at the boundary — blur covers the normal path, but
    // a member can hit Save straight from the keyboard without blurring first.
    const c = (k: string) => cleanValue(d[k]).trim();
    switch (sectionKey) {
      case 'PersonalDetail':
        return {
          userId,
          firstName: c('First Name'), lastName: c('Last Name'),
          dateOfBirth: c('Date of Birth'),
          height: c('Height'), weight: c('Weight'),
          physicalStatus: c('Physical Status'), maritalStatus: c('Marital Status'),
          motherLanguage: c('Mother Language'),
          currentAddress: c('Current Address'), nativePlace: c('Native Place'),
          placeOfBirth: c('Place of Birth'),
        };
      case 'ReligiousDetail':
        return { userId, star: c('Star'), moonSign: c('Moon Sign'), dosham: c('Dosham'), birthTime: c('Birth Time') };
      case 'EducationalDetail':
        return {
          userId,
          education: c('Education'), occupation: c('Occupation'),
          employedAt: c('Employing In') === 'Private' ? 'PRIVATE'
            : c('Employing In') === 'Government' ? 'GOVT'
            : c('Employing In').startsWith('Self') ? 'SELF'
            : c('Employing In') === 'Unemployed' ? 'UNEMPLOYED' : '',
          annualIncome: c('Annual Income'),
          jobPlace: c('Job Place'), educationInDetail: c('Education in Detail'),
        };
      case 'FamilyDetail':
        return {
          userId,
          house: c('Family Type'), familyStatus: c('Family Status'),
          fatherName: c('Fathers Name'), fatherOccupation: c('Fathers Occupation'),
          motherName: c('Mothers Name'), motherOccupation: c('Mothers Occupation'),
          noOfBrothers: c('No of Brothers'), noOfSisters: c('No of Sisters'),
          noOfBrothersMarried: c('Brother Married'), noOfSistersMarried: c('Sister Married'),
          // Derived, never asked for separately: it used to be its own dropdown
          // that could disagree with the brother/sister counts beside it.
          noOfSiblings: String(
            (parseInt(c('No of Brothers') || '0', 10) || 0) +
            (parseInt(c('No of Sisters') || '0', 10) || 0)
          ),
        };
      default:
        return { userId };
    }
  };

  const API: Record<string, (p: any) => Promise<any>> = {
    PersonalDetail: userApi.updateProfile,
    ReligiousDetail: userApi.updateAstroInfo,
    EducationalDetail: userApi.updateEducationInfo,
    FamilyDetail: userApi.updateFamilyInfo,
  };

  const handleSave = async () => {
    if (saving) return;
    if (!userData?.userId) {
      popup.error('Not signed in', 'Please sign in again.');
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await API[sectionKey]?.(buildPayload(userData.userId));
      // Business failures ride inside a 200 body — always read res.data.code.
      if (res?.data?.code !== 200) {
        popup.error('Could not update', res?.data?.message || 'Please try again.');
        return;
      }
      markProfileDirty();
      setSaved(true); // suppress the unsaved-changes prompt on the way out
      popup.success('Updated', `${spec.title} saved.`, () => router.back());
    } catch (err: any) {
      console.warn('[edit-section] save failed:', err?.message);
      popup.error('Could not update', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!spec) {
    return (
      <View style={st.flex}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={st.flex} edges={['top', 'left', 'right']}>
          <View style={st.pageHeader}>
            <TouchableOpacity onPress={() => router.back()} style={st.backPill}>
              <ChevronLeft size={20} color="#0f1724" />
            </TouchableOpacity>
            <Text style={st.pageTitle}>Edit</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Rubik-Regular', color: '#64748b' }}>
              This section can&apos;t be edited.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const renderField = (f: Field) => {
    const value = form[f.label] || '';
    const err = errors[f.label];

    if (f.kind === 'readonly') {
      return (
        <View key={f.label} style={wrapStyle(f.label)} onLayout={onFieldLayout(f.label)}>
          <Text style={st.fieldLabel}>{f.label}</Text>
          <View style={[st.inputBox, st.inputBoxDisabled]}>
            <Text style={{ color: '#64748b', fontSize: 14, fontFamily: 'Rubik-Regular' }}>
              {value || '—'}
            </Text>
            <Ionicons name="lock-closed-outline" size={15} color="#94a3b8" />
          </View>
          {!!f.locked && <Text style={st.hint}>{f.locked}</Text>}
        </View>
      );
    }

    if (f.kind === 'picker') {
      return (
        <View key={f.label} style={wrapStyle(f.label)} onLayout={onFieldLayout(f.label)}>
          <Text style={st.fieldLabel}>
            {f.label}{f.required ? <Text style={st.req}> *</Text> : null}
          </Text>
          <Picker
            label={f.label}
            value={value}
            options={optionsFor(f.options)}
            onSelect={(v) => set(f.label, v)}
            invalid={!!err}
          />
          <Text style={err ? st.error : st.errorHidden}>{err || ' '}</Text>
        </View>
      );
    }

    if (f.kind === 'date') {
      const parsed = value ? moment(value, ['YYYY-MM-DD', 'DD/MM/YYYY'], true) : null;
      return (
        <View key={f.label} style={wrapStyle(f.label)} onLayout={onFieldLayout(f.label)}>
          <Text style={st.fieldLabel}>
            {f.label}{f.required ? <Text style={st.req}> *</Text> : null}
          </Text>
          <TouchableOpacity
            style={[st.inputBox, !!err && st.inputError]}
            activeOpacity={0.7}
            onPress={() => {
              // The picker's value must not sit past its maximumDate, so clamp a stored
              // (possibly legacy under-18) date to the latest allowed one.
              const max = latestAllowedDob();
              const start = parsed?.isValid() ? parsed.toDate() : new Date(2000, 0, 1);
              setTempDate(start > max ? max : start);
              setShowDate(true);
            }}
          >
            <Text style={{ color: value ? '#000' : '#999', fontSize: 14, fontFamily: 'Rubik-Regular' }}>
              {parsed?.isValid() ? parsed.format('DD MMM YYYY') : 'Select date'}
            </Text>
            <Ionicons name="calendar-outline" size={16} color="#0f1724" />
          </TouchableOpacity>
          <Text style={err ? st.error : st.errorHidden}>{err || ' '}</Text>

          {showDate && Platform.OS === 'android' && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              maximumDate={latestAllowedDob()}
              onChange={(event, selected) => {
                setShowDate(false);
                if (event.type === 'set' && selected) pickDob(f.label, selected);
              }}
            />
          )}
          {showDate && Platform.OS === 'ios' && (
            <Modal transparent animationType="slide" visible onRequestClose={() => setShowDate(false)}>
              {/* Tapping the dark area closes without choosing. The sheet itself sits inside a
                  second Touchable with activeOpacity 1 so a tap ON it never bubbles up and
                  dismisses the picker mid-scroll. */}
              <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={() => setShowDate(false)}>
                <TouchableOpacity style={st.dateSheet} activeOpacity={1} onPress={() => { }}>
                  <View style={st.sheetHeader}>
                    <Text style={st.sheetTitle}>{f.label}</Text>
                    <TouchableOpacity onPress={() => setShowDate(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close" size={22} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    // The sheet behind this is white, so pin the wheel light regardless of the
                    // phone's dark-mode setting — otherwise iOS renders white-on-white.
                    themeVariant="light"
                    textColor="#0f1724"
                    maximumDate={latestAllowedDob()}
                    onChange={(_e, selected) => selected && setTempDate(selected)}
                  />
                  <TouchableOpacity
                    style={st.dateConfirm}
                    onPress={() => {
                      setShowDate(false);
                      pickDob(f.label, tempDate);
                    }}
                  >
                    <Text style={st.dateConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          )}
        </View>
      );
    }

    if (f.kind === 'time') {
      // Accepts what previous builds may have typed free-hand, so an existing value still
      // opens the wheel at the right time instead of resetting to now.
      const parsed = value ? moment(value, ['hh:mm A', 'h:mm A', 'HH:mm', 'H:mm'], false) : null;
      const openPicker = () => {
        const base = new Date();
        if (parsed?.isValid()) base.setHours(parsed.hours(), parsed.minutes(), 0, 0);
        setTempTime(base);
        setShowTime(true);
      };
      const commit = (d: Date) => set(f.label, moment(d).format('hh:mm A'));
      return (
        <View key={f.label} style={wrapStyle(f.label)} onLayout={onFieldLayout(f.label)}>
          <Text style={st.fieldLabel}>
            {f.label}{f.required ? <Text style={st.req}> *</Text> : null}
          </Text>
          <TouchableOpacity style={[st.inputBox, !!err && st.inputError]} activeOpacity={0.7} onPress={openPicker}>
            <Text style={{ color: value ? '#000' : '#999', fontSize: 14, fontFamily: 'Rubik-Regular' }}>
              {parsed?.isValid() ? parsed.format('hh:mm A') : (value || 'Select time')}
            </Text>
            <Ionicons name="time-outline" size={16} color="#0f1724" />
          </TouchableOpacity>
          <View style={st.metaRow}>
            <Text style={err ? st.error : (f.hint ? st.fieldHint : st.errorHidden)} numberOfLines={1}>
              {err || f.hint || ' '}
            </Text>
          </View>

          {showTime && Platform.OS === 'android' && (
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="default"
              is24Hour={false}
              onChange={(event, selected) => {
                setShowTime(false);
                if (event.type === 'set' && selected) commit(selected);
              }}
            />
          )}
          {showTime && Platform.OS === 'ios' && (
            <Modal transparent animationType="slide" visible onRequestClose={() => setShowTime(false)}>
              <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={() => setShowTime(false)}>
                <TouchableOpacity style={st.dateSheet} activeOpacity={1} onPress={() => { }}>
                  <View style={st.sheetHeader}>
                    <Text style={st.sheetTitle}>{f.label}</Text>
                    <TouchableOpacity onPress={() => setShowTime(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close" size={22} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempTime}
                    mode="time"
                    display="spinner"
                    themeVariant="light"
                    textColor="#0f1724"
                    onChange={(_e, selected) => selected && setTempTime(selected)}
                  />
                  <TouchableOpacity style={st.dateConfirm} onPress={() => { setShowTime(false); commit(tempTime); }}>
                    <Text style={st.dateConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          )}
        </View>
      );
    }

    const isMulti = f.kind === 'multiline';
    return (
      <View key={f.label} style={wrapStyle(f.label)} onLayout={onFieldLayout(f.label)}>
        <Text style={st.fieldLabel}>
          {f.label}{f.required ? <Text style={st.req}> *</Text> : null}
        </Text>
        <TextInput
          value={value}
          onChangeText={(t) => {
            if (f.nameRules) return set(f.label, nameInput(t, f.max || 50));
            if (f.kind === 'digits') return set(f.label, t.replace(/[^0-9]/g, '').slice(0, f.max || 2));
            set(f.label, textInput(t, f.max, isMulti));
          }}
          // Trailing whitespace can only be removed once the member stops typing.
          onBlur={() => set(f.label, value.trim())}
          placeholder={`Enter ${f.label}`}
          placeholderTextColor="#999"
          keyboardType={f.kind === 'digits' ? 'numeric' : 'default'}
          multiline={isMulti}
          textAlignVertical={isMulti ? 'top' : 'center'}
          maxLength={f.max}
          style={[st.input, isMulti && st.inputMulti, !!err && st.inputError]}
        />
        <View style={st.metaRow}>
          {/* The hint takes the error's slot while there is no error, so adding one never
              changes the field's height (the layout here is fixed-height on purpose). */}
          <Text style={err ? st.error : (f.hint ? st.fieldHint : st.errorHidden)} numberOfLines={1}>
            {err || f.hint || ' '}
          </Text>
          {!!f.max && f.kind !== 'digits' && (
            <Text style={st.counter}>{value.length}/{f.max}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={st.flex}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={st.flex} edges={['top', 'left', 'right']}>
        <View style={st.pageHeader}>
          <TouchableOpacity
            onPress={attemptLeave}
            style={st.backPill}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={20} color="#0f1724" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={st.pageTitle}>{spec.title}</Text>
            <Text style={st.pageSub}>{flowLabel}Fields marked * are required</Text>
          </View>
        </View>

        {/* KeyboardAwareScrollView with the register form's proven props — a plain
            ScrollView is the one pattern on this codebase whose IME closes itself. */}
        <KeyboardAwareScrollView
          ref={scrollRef}
          style={st.flex}
          contentContainerStyle={st.scrollContent}
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={Platform.OS === 'ios' ? 30 : 45}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableResetScrollToCoords={false}
        >
          {initial === null ? (
            loadError ? (
              <View style={st.loadState}>
                <Text style={st.loadText}>Could not load this section.</Text>
                <TouchableOpacity style={st.retryBtn} onPress={() => setLoadNonce((n) => n + 1)}>
                  <Text style={st.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={st.loadState}>
                <ActivityIndicator size="small" color="#1F7FE5" />
                <Text style={st.loadText}>Loading your details…</Text>
              </View>
            )
          ) : spec.fields.map(renderField)}
        </KeyboardAwareScrollView>

        {/* Save sits outside the scroll so the keyboard never buries it — the
            single biggest complaint about the old bottom-sheet editor. */}
        {/* The SafeAreaView deliberately excludes the bottom edge so the scroll
            can run to the screen edge — which leaves THIS row to reserve the
            gesture/nav-bar strip itself. Without the inset the Save button sat
            under the Android navigation bar. */}
        <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleSave} disabled={saving || initial === null}>
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[st.cta, (saving || initial === null) && { opacity: 0.6 }]}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={st.ctaText}>Save Changes</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  flex: { flex: 1 },
  pageHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
  },
  backPill: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e7edf5',
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { fontSize: 17, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  pageSub: { fontSize: 11.5, fontFamily: 'Rubik-Regular', color: '#64748b', marginTop: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },

  fieldWrap: { marginBottom: 2 },
  // Pulse for the field the completion nudge pointed at — negative margin keeps
  // the input itself exactly where it was; only the tint spills out around it.
  fieldWrapFocused: {
    backgroundColor: 'rgba(31,127,229,0.09)', borderRadius: 14,
    marginHorizontal: -8, paddingHorizontal: 8, paddingTop: 6,
  },
  loadState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  loadText: { fontSize: 13, fontFamily: 'Rubik-Regular', color: '#64748b' },
  retryBtn: { marginTop: 4, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7edf5' },
  retryText: { fontSize: 13, fontFamily: 'Rubik-Medium', color: '#1F7FE5' },
  fieldLabel: {
    color: '#0f1724', fontSize: 12, marginBottom: 5,
    fontFamily: 'Rubik-Bold', textTransform: 'uppercase', letterSpacing: 0.3,
  },
  req: { color: '#dc2626' },
  hint: { fontSize: 10.5, fontFamily: 'Rubik-Regular', color: '#94a3b8', marginTop: 3, marginBottom: 10 },

  input: {
    height: 44, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
    width: '100%', borderRadius: 12, borderColor: '#e2e8f0',
    backgroundColor: '#ffffff', fontSize: 14, fontFamily: 'Rubik-Regular', color: '#333',
  },
  inputMulti: { height: 92, paddingTop: 12 },
  inputBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#ffffff', height: 44,
  },
  inputBoxDisabled: { backgroundColor: '#f1f5f9' },
  inputError: { borderColor: '#dc2626', borderWidth: 1.5 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  error: { color: '#dc2626', fontSize: 10.5, fontFamily: 'Rubik-Regular', height: 16, paddingLeft: 2 },
  errorHidden: { height: 16, opacity: 0 },
  counter: { fontSize: 10.5, fontFamily: 'Rubik-Regular', color: '#94a3b8' },
  fieldHint: { flex: 1, fontSize: 10.5, fontFamily: 'Rubik-Regular', color: '#94a3b8' },

  footer: {
    // paddingBottom comes from the safe-area inset at the call site — setting it
    // here as well would only be overridden.
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#e7edf5', backgroundColor: 'rgba(243,247,250,0.96)',
  },
  cta: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 15, fontFamily: 'Rubik-Bold', letterSpacing: 0.3 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 15, borderTopRightRadius: 15,
    height: '80%', padding: 15,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { fontFamily: 'Rubik-Bold', fontSize: 16, color: '#0f1724' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#1F7FE5',
    borderRadius: 8, paddingHorizontal: 10, marginBottom: 10,
  },
  option: { padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  optionEmpty: { padding: 16, textAlign: 'center', color: '#94a3b8', fontFamily: 'Rubik-Regular' },

  dateSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 15, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  dateConfirm: {
    backgroundColor: '#1F7FE5', borderRadius: 24, height: 46,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  dateConfirmText: { color: '#fff', fontFamily: 'Rubik-Bold', fontSize: 14 },
});
