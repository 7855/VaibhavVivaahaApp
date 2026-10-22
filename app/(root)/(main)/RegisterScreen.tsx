/**
 * New registration flow (2026-10-19) — reached ONLY from LoginScreen's "Sign Up" link.
 * The old `sign-up.tsx` is untouched and still routable.
 *
 * Stages:  start (profile-for · name · WhatsApp number)  →  verify (6-digit code, inline)
 *          →  welcome (the pending sections, resumable)   →  step 0..3  →  done
 * Everything typed is kept in AsyncStorage (`registerDraft`), so closing the app and
 * reopening lands on the welcome/resume screen with the same place. The account itself is
 * created at the LAST step with the exact `createUser` payload the old page sends.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Platform, Image,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Keyboard, BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import userApi from '../api/userApi';
import { usePopup } from '../contexts/PopupContext';
import { useMasterData } from '../contexts/MasterDataContext';
import { loadMasterData } from '../services/masterService';
import { stripNonNameChars, latestDobForGender, meetsMinAge, ageRuleMessage, ageOnDate } from '../../../constants/data';
// @ts-ignore — plain JSX module
import { NameCard, Gopuram, Books } from '../../../components/RegisterArt';

/* ---------- theme: brand maroon #420001 + gold #F6B733, jasmine-cream surface, extra colours per step ---------- */
const T = {
  plum: '#2A0004', crimson: '#420001', crimsonHi: '#7A120B', rose: '#8E1138',
  mari: '#F6B733', mari2: '#E0961C', cream: '#FFF8EE', cream2: '#FBEFD9', line: '#F0DDC6',
  ink: '#2A1226', mute: '#7A6670', ph: '#B9A9AF', teal: '#0FA3A3', teal2: '#0B8484',
  violet: '#7C5DFA', violet2: '#5B3FE0', err: '#DC2626', white: '#FFFFFF',
};
// Hero per step alternates between the two brand looks (client, 2026-10-19):
// steps 1 & 3 = maroon, step 2 = amber. (The PIN step was removed the same day — the PIN is
// chosen on the number page — so there are three steps.)
const MAROON = { a: '#7A120B', b: '#420001', deep: '#2A0004' };
const AMBER = { a: '#D9822B', b: '#B85C12', deep: '#7A3A05' };
const STEP_THEMES = [
  { ...MAROON, Art: NameCard },
  { ...AMBER, Art: Gopuram },
  { ...MAROON, Art: Books },
];
const DRAFT_KEY = 'registerDraft';
const OTP_LEN = 6;
const RESEND_SECS = 30;
const MOBILE_RE = /^[6-9]\d{9}$/;

const PROFILE_FOR = [
  { id: 'Myself', label: 'Myself', ta: 'எனக்கு' },
  { id: 'Son', label: 'Son', ta: 'மகன்', gender: 'M' },
  { id: 'Daughter', label: 'Daughter', ta: 'மகள்', gender: 'F' },
  { id: 'Brother', label: 'Brother', ta: 'சகோதரர்', gender: 'M' },
  { id: 'Sister', label: 'Sister', ta: 'சகோதரி', gender: 'F' },
  { id: 'Relative', label: 'Relative', ta: 'உறவினர்' },
  { id: 'Friend', label: 'Friend', ta: 'நண்பர்' },
];
const STEPS = [
  { title: 'About you', hint: 'Date of birth & gender', mins: '1 min' },
  { title: 'Community & place', hint: 'Caste, subcaste, district', mins: '1 min' },
  { title: 'Education & work', hint: 'Studies and job', mins: '1 min' },
];
const REQUIRED_MASTER_KEYS = ['education', 'districts', 'employingIn'];
// Caste names as the member should read them: "English / Tamil". Keyed by the DB casteName
// (upper-case, as `castes.casteName` stores it); anything unknown falls back to title case.
const CASTE_DISPLAY: Record<string, string> = {
  VANNIYAR: 'Vanniyar / வன்னியர்',
  NAIDU: 'Naidu / நாயுடு',
  AADITRAVIDAR: 'Adi Dravidar / ஆதி திராவிடர்',
  MUDALIAR: 'Mudaliar / முதலியார்',
  FREECASTEBAR: 'Free Caste Bar / சாதி தடை இல்லை',
  'FREE CASTE BAR': 'Free Caste Bar / சாதி தடை இல்லை',
};
// Education codes are stored as-is (UG / PG / DOCTOR / …); only the shown label is friendlier.
const EDU_DISPLAY: Record<string, string> = {
  UG: 'UG (Bachelor\'s)', PG: 'PG (Master\'s)', DOCTOR: 'Doctor', ENGINEER: 'Engineer',
  'TEACHER/PROFESSOR': 'Teacher / Professor', LAWYER: 'Lawyer', OTHERS: 'Others',
};
const eduDisplay = (code: string) => EDU_DISPLAY[String(code || '').toUpperCase()] || String(code || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const casteDisplay = (name: string) => {
  const key = String(name || '').trim().toUpperCase();
  if (CASTE_DISPLAY[key]) return CASTE_DISPLAY[key];
  return key.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

type Stage = 'start' | 'verify' | 'welcome' | 'step' | 'done';
type Draft = {
  profileFor: string; firstName: string; lastName: string; mobile: string;
  mobileVerificationToken: string; verifiedMobile: string;
  gender: string; dob: string; casteId: string; subcasteId: string; district: string;
  education: string; occupation: string; employingIn: string;
  doneSteps: number[]; stage: Stage; step: number;
  // server side (new flow): the INCOMPLETE row's id + the token that authorises step/complete
  userId: string; registrationToken: string;
  // LoginScreen sets this when a PIN login met REGISTRATION_INCOMPLETE: the server already has
  // the name + profile-for, so the Start page only asks the member to re-verify the number.
  resume?: boolean;
  // Set by LoginScreen when a number + PIN login resumed an unfinished registration: the ONLY
  // draft this screen restores. Sign Up itself always starts fresh (client, 2026-10-19).
  fromLogin?: boolean;
};
const EMPTY: Draft = {
  profileFor: '', firstName: '', lastName: '', mobile: '', mobileVerificationToken: '', verifiedMobile: '',
  gender: '', dob: '', casteId: '', subcasteId: '', district: '', education: '', occupation: '', employingIn: '',
  doneSteps: [], stage: 'start', step: 0, userId: '', registrationToken: '', resume: false,
};
/** Turns the server's resume payload (verify-mobile-otp / login-with-otp `registration`) into a draft. */
export function draftFromRegistration(reg: any, mobile: string): Partial<Draft> {
  const dr = reg?.draft || {};
  const doneSteps: number[] = Array.isArray(dr.doneSteps) ? dr.doneSteps.map(Number) : [];
  return {
    userId: reg?.userId || '', registrationToken: reg?.registrationToken || '',
    firstName: reg?.firstName || '', lastName: reg?.lastName || '', profileFor: reg?.profileFor || '',
    mobile, verifiedMobile: mobile, mobileVerificationToken: 'server',
    gender: dr.gender || '', dob: dr.dob || '', casteId: dr.casteId ? String(dr.casteId) : '', subcasteId: dr.subcasteId ? String(dr.subcasteId) : '',
    district: dr.district || '', education: dr.education || '', occupation: dr.occupation || '', employingIn: dr.employingIn || '',
    doneSteps, stage: 'welcome', step: 0,
  };
}
export const REGISTER_DRAFT_KEY = DRAFT_KEY;
const pad2 = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fromISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDate = (s: string) => (s ? fromISO(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const possessive = (pf: string) => (pf === 'Myself' ? 'your' : pf === 'Relative' || pf === 'Friend' ? `your ${pf.toLowerCase()}'s` : `your ${pf.toLowerCase()}'s`);

/* ---------- stateless pieces (module level so they never remount while typing) ---------- */
const Kolam = ({ color = 'rgba(255,255,255,0.18)' }: { color?: string }) => {
  const dots: { x: number; y: number }[] = [];
  for (let x = 10; x < 440; x += 22) for (let y = 8; y < 260; y += 22) dots.push({ x, y });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">{dots.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r="1.2" fill={color} />)}</Svg>
    </View>
  );
};
// Sits INSIDE the ScrollView above the hero: when the member pulls the page down past the
// top, the hero's own colour shows instead of the cream page background.
const Bleed = ({ color }: { color: string }) => <View pointerEvents="none" style={[s.bleed, { backgroundColor: color }]} />;
const ErrLine = ({ text }: { text?: string }) => (text ? <View style={s.errRow}><Ionicons name="alert-circle" size={14} color={T.err} /><Text style={s.errText}>{text}</Text></View> : null);
// "12/50" under a capped text field (client: the limit exists, so show it). Hidden while the
// error line is showing so the two never stack; turns red at the cap.
const Count = ({ n, max, error }: { n: number; max: number; error?: string }) => (error || n === 0 ? null : <Text style={[s.count, n >= max && { color: T.err }]}>{n}/{max}</Text>);
const Label = ({ t }: { t: string }) => <Text style={s.lab}>{t}</Text>;
/** A text field whose WHOLE box focuses the input (the TextInput alone is only as wide as its text). */
type FieldProps = Omit<React.ComponentProps<typeof TextInput>, 'style'> & { bad?: boolean; ok?: boolean; left?: React.ReactNode; right?: React.ReactNode; style?: any; inputStyle?: any };
const Field = React.forwardRef<TextInput, FieldProps>(({ bad, ok, left, right, style, inputStyle, ...rest }, ref) => {
  const inner = useRef<TextInput | null>(null);
  const setRef = (r: TextInput | null) => { inner.current = r; if (typeof ref === 'function') ref(r); else if (ref) (ref as any).current = r; };
  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inner.current?.focus()} style={[s.ctrl, bad && s.ctrlBad, ok && s.ctrlOk, style]}>
      {left}
      <TextInput ref={setRef} placeholderTextColor={T.ph} {...rest} style={[s.input, { flex: 1, minWidth: 0 }, inputStyle]} />
      {right}
    </TouchableOpacity>
  );
});

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  // Clearance for the Android navigation bar / iOS home indicator under the CTA + footer line.
  const bottomPad = Math.max(insets.bottom, 16) + 24;
  const popup = usePopup();
  const { state: masterData, setMasterData, getSubcastesForCaste } = useMasterData();

  const [d, setD] = useState<Draft>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState('');
  const [otpErr, setOtpErr] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showPin2, setShowPin2] = useState(false);
  const [sheet, setSheet] = useState<{ title: string; options: { id: string; label: string }[]; onPick: (id: string) => void; search?: boolean } | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date(2000, 0, 1));
  const [castes, setCastes] = useState<{ id: string; label: string }[]>([]);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const lastRef = useRef<TextInput | null>(null);
  const mobileRef = useRef<TextInput | null>(null);

  const set = (k: keyof Draft, v: any) => setD((p) => ({ ...p, [k]: v }));
  const clearErr = (k: string) => setErrors((e) => (e[k] ? { ...e, [k]: '' } : e));

  /* ---------- draft: restore on mount, save on every change ---------- */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (raw) {
          const saved = { ...EMPTY, ...JSON.parse(raw) } as Draft;
          // Only the hand-off from a number + PIN login is restored (it carries the server's
          // saved sections). Anything else — a half-typed form, a verified number from an
          // earlier session, a finished registration — is dropped: Sign Up always starts fresh,
          // and an unfinished registration is continued by SIGNING IN with the number and PIN.
          if (saved.fromLogin && saved.registrationToken) {
            saved.fromLogin = false;
            if (saved.stage !== 'step') saved.stage = 'welcome';
            setD(saved);
          } else {
            await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
          }
        }
      } catch { /* a bad draft is ignored */ }
      setLoaded(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded || d.stage === 'done') return; // never write a completed registration back
    const t = setTimeout(() => AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(d)).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [d, loaded]);

  /* ---------- master data (same keys + guard as sign-up.tsx) ---------- */
  useEffect(() => {
    if (REQUIRED_MASTER_KEYS.some((k) => !Array.isArray(masterData?.[k]))) {
      loadMasterData(setMasterData).catch((e: any) => console.warn('[register] master data', e?.message));
    }
  }, [masterData, setMasterData]);
  useEffect(() => {
    const fromCache = Array.isArray(masterData?.castes) ? masterData.castes : null;
    if (fromCache?.length) {
      setCastes(fromCache.filter((c: any) => c.isActive === 'Y' || c.isActive === undefined).map((c: any) => ({ id: String(c.id), label: casteDisplay(c.casteName) })));
      return;
    }
    userApi.getAllCaste().then((res: any) => {
      const rows = (res?.data?.data || []).filter((c: any) => c.isActive === 'Y');
      setCastes(rows.map((c: any) => ({ id: String(c.id), label: casteDisplay(c.casteName) })));
    }).catch(() => {});
  }, [masterData]);
  const subcastes = useMemo<{ id: string; label: string }[]>(() => (getSubcastesForCaste?.(d.casteId ? Number(d.casteId) : null) || []).map((sc: any) => ({ id: String(sc.id), label: sc.subcasteName })), [getSubcastesForCaste, d.casteId]);
  const educations = useMemo<{ id: string; label: string }[]>(() => (masterData?.education || []).map((e: any) => ({ id: e.degree, label: eduDisplay(e.degree) })), [masterData]);
  const employing = useMemo<{ id: string; label: string }[]>(() => (masterData?.employingIn || []).map((e: any) => ({ id: e.value, label: e.label })), [masterData]);
  const districts = useMemo<{ id: string; label: string }[]>(() => (masterData?.districts || []).map((x: any) => ({ id: x.value, label: x.value })), [masterData]);

  /* ---------- derived ---------- */
  const pf = PROFILE_FOR.find((p) => p.id === d.profileFor);
  const autoGender = pf?.gender || '';
  const gender = autoGender || d.gender;
  const needsGender = !!d.profileFor && !autoGender;
  const firstName = d.firstName.trim();
  const theme = STEP_THEMES[d.step] || STEP_THEMES[0];

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  /* ---------- hardware back ---------- */
  useFocusEffect(useCallback(() => {
    const onBack = () => {
      if (sheet) { setSheet(null); return true; }
      if (d.stage === 'verify') { set('stage', 'start'); return true; }
      if (d.stage === 'step') { if (d.step > 0) { set('step', d.step - 1); } else { set('stage', 'welcome'); } return true; }
      if (d.stage === 'welcome' || d.stage === 'done') { router.replace('/(root)/(main)/LoginScreen'); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [d.stage, d.step, sheet]));

  /* ---------- stage: start ---------- */
  const startErrors = () => {
    const e: Record<string, string> = {};
    if (!d.resume) {
    if (!d.profileFor) e.profileFor = 'Profile created for is required';
    if (!firstName) e.firstName = 'First name is required'; else if (firstName.length < 2) e.firstName = 'First name is too short';
    if (!d.lastName.trim()) e.lastName = 'Last name is required'; else if (d.lastName.trim().length < 2) e.lastName = 'Last name is too short';
    }
    if (!d.mobile) e.mobile = 'Mobile number is required'; else if (d.mobile.length !== 10) e.mobile = 'Mobile number must be 10 digits'; else if (!MOBILE_RE.test(d.mobile)) e.mobile = 'Mobile number must start with 6, 7, 8 or 9';
    if (!d.resume) {
      if (!pin) e.pin = 'PIN is required'; else if (pin.length !== 4) e.pin = 'PIN must be 4 digits';
      if (!pin2) e.pin2 = 'Please confirm the PIN'; else if (pin2 !== pin) e.pin2 = 'PINs do not match';
    }
    return e;
  };
  const sendCode = async (resend = false) => {
    if (!resend) {
      const e = startErrors(); setErrors(e);
      if (Object.keys(e).length) return;
      // Already verified this exact number earlier in this draft → skip the code.
      if (d.mobileVerificationToken && d.verifiedMobile === d.mobile) { set('stage', 'welcome'); return; }
    }
    setBusy(true);
    try {
      const res = await userApi.sendMobileOtp({ mobile: d.mobile, purpose: 'registration' });
      const code = res.data?.code;
      if (code === 200) {
        setOtp(''); setOtpErr(''); setCooldown(RESEND_SECS); // resend wipes the old digits too
        if (!resend) set('stage', 'verify');
        setTimeout(() => otpRefs.current[0]?.focus(), 350);
      } else if (code === 409) {
        popup.warning('Already registered', res.data?.message || 'This number already has an account. Please sign in instead.');
      } else if (code === 429) {
        popup.warning('Please wait', 'Too many codes requested. Try again after 10 minutes.');
      } else {
        popup.error('Could not send', res.data?.message || 'We could not send the WhatsApp code. Please try again.');
      }
    } catch (err: any) {
      const code = err?.response?.data?.code ?? err?.response?.status;
      if (code === 409) popup.warning('Already registered', err?.response?.data?.message || 'This number already has an account. Please sign in instead.');
      else if (code === 429) popup.warning('Please wait', 'Too many codes requested. Try again after 10 minutes.');
      else popup.error('Could not send', 'Please check your connection and try again.');
    } finally { setBusy(false); }
  };

  /* ---------- stage: verify ---------- */
  const onOtpDigit = (i: number, t: string) => {
    const digits = t.replace(/\D/g, '');
    if (digits.length > 1) { // paste
      const v = digits.slice(0, OTP_LEN); setOtp(v); setOtpErr('');
      otpRefs.current[Math.min(v.length, OTP_LEN - 1)]?.focus();
      if (v.length === OTP_LEN) verifyCode(v);
      return;
    }
    const arr = otp.padEnd(OTP_LEN, ' ').split('');
    arr[i] = digits || ' ';
    const v = arr.join('').replace(/\s+$/, '').replace(/ /g, '');
    setOtp(v); setOtpErr('');
    if (digits && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
    if (v.length === OTP_LEN) verifyCode(v);
  };
  // After a wrong/expired code: empty the boxes and put the cursor back in the first one.
  const clearOtpBoxes = () => { setOtp(''); setTimeout(() => otpRefs.current[0]?.focus(), 150); };
  const verifyCode = async (code = otp) => {
    if (code.length !== OTP_LEN) { setOtpErr('Enter the 6-digit code'); return; }
    setBusy(true); Keyboard.dismiss();
    try {
      const res = await userApi.verifyMobileOtp({ mobile: d.mobile, otp: code, purpose: 'registration' });
      const token = res.data?.data?.verificationToken;
      if (res.data?.code === 200 && token) {
        // An unfinished registration for this number (any phone) comes back with its draft.
        const reg = res.data?.data?.registration;
        // A PIN typed on the Start page must reach the server even when the number already has
        // an unfinished row (one started before the PIN moved here): register/start RESUMES that
        // row and stores the PIN. Only the no-PIN resume mode takes the server's draft directly.
        if (reg?.registrationToken && (d.resume || !pin)) { setD((p) => ({ ...p, ...draftFromRegistration(reg, p.mobile), resume: false })); return; }
        if (d.resume) {
          // Came from "Finish your registration" but the server holds nothing for this number
          // (different number typed, or the row was completed elsewhere): fall back to a normal start.
          setD((p) => ({ ...p, resume: false, stage: 'start', mobileVerificationToken: token, verifiedMobile: p.mobile }));
          popup.info('Tell us who you are', 'We could not find an unfinished registration for this number. Fill in your name to continue — the number is already verified.');
          return;
        }
        // Otherwise create the INCOMPLETE account row now, so the member can resume anywhere.
        const st = await userApi.registerStart({ firstName, lastName: d.lastName.trim(), profileFor: d.profileFor, mobile: d.mobile, mobileVerificationToken: token, pin });
        const sd = st.data?.data;
        if (st.data?.code === 200 && sd?.registrationToken) {
          // A resumed row brings back its saved steps (doneSteps + answers); a fresh one is empty.
          setD((p) => ({ ...p, ...draftFromRegistration(sd, p.mobile), firstName: p.firstName, lastName: p.lastName, profileFor: p.profileFor, resume: false }));
        } else if (st.data?.code === 409) {
          popup.warning('Already registered', 'This number already has an account. Please sign in instead.');
        } else {
          setOtpErr(st.data?.message || 'Could not start the registration. Please try again.');
        }
      } else {
        const m = String(res.data?.message || '');
        setOtpErr(/invalid/i.test(m) ? 'That code is not right. Check WhatsApp and try again.' : m || 'That code is not right. Check WhatsApp and try again.');
        clearOtpBoxes();
      }
    } catch { setOtpErr('Could not verify. Please check your connection.'); }
    finally { setBusy(false); }
  };

  /* ---------- steps ---------- */
  const stepErrors = (i: number) => {
    const e: Record<string, string> = {};
    if (i === 0) {
      if (needsGender && !d.gender) e.gender = 'Select the gender';
      if (!d.dob) e.dob = 'Select the date of birth';
      else if (!meetsMinAge(fromISO(d.dob), gender)) e.dob = ageRuleMessage(gender);
    }
    if (i === 1) {
      if (!d.casteId) e.casteId = 'Select the caste';
      if (subcastes.length > 0 && !d.subcasteId) e.subcasteId = 'Select the subcaste (or Others)';
      if (!d.district) e.district = 'Select the district';
    }
    if (i === 2) {
      if (!d.education) e.education = 'Select the education';
      if (!d.occupation.trim()) e.occupation = 'Occupation is required'; else if (d.occupation.trim().length < 2) e.occupation = 'Occupation is too short';
      if (!d.employingIn) e.employingIn = 'Select where they are employed';
    }
    return e;
  };
  const nextStep = async () => {
    const e = stepErrors(d.step); setErrors(e);
    if (Object.keys(e).length) return;
    const done = Array.from(new Set([...d.doneSteps, d.step]));
    if (d.step < STEPS.length - 1) {
      setD((p) => ({ ...p, doneSteps: done, step: p.step + 1 }));
      saveStepOnServer(done);
      return;
    }
    await createAccount(done);
  };
  // Best-effort: the local draft is the fallback; a failed save never blocks the member.
  const saveStepOnServer = (done: number[]) => {
    if (!d.userId || !d.registrationToken) return;
    userApi.registerStep({
      userId: d.userId, registrationToken: d.registrationToken, doneSteps: done,
      draft: { firstName, lastName: d.lastName.trim(), profileFor: d.profileFor, gender, dob: d.dob, casteId: d.casteId, subcasteId: d.subcasteId,
               district: d.district, education: d.education, occupation: d.occupation.trim(), employingIn: d.employingIn },
    }).then((r: any) => {
      if (r.data?.code === 403) reverify('Your session expired. Please verify your number again — your answers are saved.');
    }).catch(() => {});
  };
  const reverify = (msg: string) => {
    setD((p) => ({ ...p, mobileVerificationToken: '', verifiedMobile: '', registrationToken: '', stage: 'start' }));
    popup.warning('Verify again', msg);
  };
  const createAccount = async (done: number[]) => {
    const payload = {
      firstName, lastName: d.lastName.trim(), dateOfBirth: d.dob, mobileNumber: d.mobile,
      education: d.education, occupation: d.occupation.trim(), employingIn: d.employingIn,
      gender, casteId: parseInt(d.casteId, 10), subcasteId: d.subcasteId ? Number(d.subcasteId) : null,
      pin, location: d.district, age: String(ageOnDate(fromISO(d.dob))),
      email: null, verificationToken: null, mobileVerificationToken: d.mobileVerificationToken,
      profileFor: d.profileFor || null,
    };
    setBusy(true);
    try {
      const res = d.userId && d.registrationToken
        ? await userApi.registerComplete({ userId: d.userId, registrationToken: d.registrationToken, ...payload })
        : await userApi.createUser(payload);
      const code = res.data?.code;
      if (code === 200) {
        await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
        await AsyncStorage.setItem('lastLoginMobile', d.mobile).catch(() => {});
        // Straight to the under-review screen (client): the same keys LoginScreen's PENDING
        // branch writes, so that screen renders exactly as it does after a PIN login.
        const created = res.data?.data || {};
        const uid = created.userId ? String(created.userId) : (d.userId || '');
        const encoded = /^\d+$/.test(uid) ? btoa(uid) : uid;
        if (encoded) await AsyncStorage.setItem('userId', encoded).catch(() => {});
        await AsyncStorage.multiSet([['firstName', firstName], ['lastName', d.lastName.trim()], ['userStatus', 'PENDING']]).catch(() => {});
        await AsyncStorage.removeItem('rejectionReason').catch(() => {});
        setD((p) => ({ ...p, doneSteps: done, stage: 'done' }));
        router.replace('/(root)/(main)/ProfileUnderVerificationScreen');
      } else if (code === 401 || code === 409) {
        popup.error('Already registered', res.data?.message || 'An account with these details already exists. Please sign in.');
      } else if (code === 403 && /MOBILE_NOT_VERIFIED|REGISTRATION_TOKEN_INVALID/i.test(res.data?.message || '')) {
        // Session/token no longer valid (another phone verified since, or the 30-min OTP token
        // lapsed on the old path) — back through the code, keeping every answer.
        reverify('Please verify your number again — your answers are saved.');
      } else {
        popup.error('Could not create account', res.data?.message || 'Something went wrong. Please try again.');
      }
    } catch (err: any) {
      if (err?.code === 'ECONNABORTED') popup.warning('Taking too long', 'The account may still have been created. Please try signing in first before registering again.');
      else popup.error('Could not create account', 'Please check your connection and try again.');
    } finally { setBusy(false); }
  };

  /* ---------- pieces (module-level components below; these only bind screen state) ---------- */
  const Hero = ({ colors, children, art: ArtC, pill, onBack, title, subtitle }: any) => (
    <LinearGradient colors={colors} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={[s.hero, { paddingTop: insets.top + 8 }]}>
      <Bleed color={colors[0]} />
      <Kolam />
      <View style={s.glow} />
      <View style={s.brandRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Ionicons name="chevron-back" size={20} color={T.white} /></TouchableOpacity>
        ) : (
          <Image source={require('../../../assets/images/LotusLogo.png')} style={s.mark} resizeMode="cover" />
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>{title || 'Vaibhav Vivaaha'}</Text>
          <Text style={s.brandTa}>{subtitle || 'நம்ம வீட்டு திருமணம்'}</Text>
        </View>
        {pill ? <View style={s.pill}><Text style={s.pillText}>{pill}</Text></View> : null}
      </View>
      {children}
      {ArtC ? <View style={s.medal}><ArtC size={56} bg="#FFF3DC" /></View> : null}
    </LinearGradient>
  );
  const Err = ({ k }: { k: string }) => <ErrLine text={errors[k]} />;
  const Select = ({ k, value, placeholder, title, options, onPick, search }: any) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => { Keyboard.dismiss(); setSheet({ title, options, onPick, search }); }} style={[s.ctrl, errors[k] && s.ctrlBad]}>
      <Text style={[s.ctrlText, !value && s.phText]} numberOfLines={1}>{value || placeholder}</Text>
      <Ionicons name="chevron-down" size={18} color={T.mute} />
    </TouchableOpacity>
  );
  const Cta = ({ label, onPress, colors, textColor = T.plum, disabled }: any) => (
    <TouchableOpacity onPress={onPress} disabled={disabled || busy} activeOpacity={0.85} style={[s.ctaWrap, (disabled || busy) && { opacity: 0.6 }]}>
      <LinearGradient colors={colors || [T.mari, T.mari2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cta}>
        {busy ? <ActivityIndicator color={textColor} /> : (<><Text style={[s.ctaText, { color: textColor }]}>{label}</Text><Ionicons name="arrow-forward" size={18} color={textColor} /></>)}
      </LinearGradient>
    </TouchableOpacity>
  );

  if (!loaded) return <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={T.crimson} /></View>;

  /* ================= START ================= */
  if (d.stage === 'start') return (
    <View style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: bottomPad }} overScrollMode="always">
          <Hero colors={[T.crimsonHi, T.crimson, T.plum]}>
            <Text style={s.h2}>{d.resume ? 'Welcome back,\nlet\u2019s pick up where you left off' : "Let's begin,\nwho is this profile for?"}</Text>
            <Text style={s.heroP}>{d.resume ? 'Verify your WhatsApp number once more and we will reopen the sections you have not finished.' : "Three details to start. You can finish the rest any time — we'll keep your place."}</Text>
            <View style={[s.pill, { alignSelf: 'flex-start', marginTop: 10 }]}><Ionicons name="time-outline" size={12} color={T.white} /><Text style={s.pillText}> about 2 minutes</Text></View>
          </Hero>
          <View style={s.body}>
            {!d.resume && (<>
            <Label t="Name" />
            {/* Each name in its own column so its error line sits directly under its own box. */}
            <View style={[s.row2, { alignItems: 'flex-start' }]}>
              <View style={{ flex: 1 }}>
                <Field bad={!!errors.firstName} value={d.firstName} onChangeText={(t) => { set('firstName', stripNonNameChars(t).replace(/^\s+/, '').replace(/\s{2,}/g, ' ').slice(0, 50)); clearErr('firstName'); }} placeholder="First name" maxLength={50} autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => lastRef.current?.focus()} blurOnSubmit={false}
                  onBlur={() => { const v = d.firstName.trim(); set('firstName', v); setErrors((e) => ({ ...e, firstName: !v ? 'First name is required' : v.length < 2 ? 'First name is too short' : '' })); }} />
                <Err k="firstName" />
                <Count n={d.firstName.length} max={50} error={errors.firstName} />
              </View>
              <View style={{ flex: 1 }}>
                <Field ref={lastRef} bad={!!errors.lastName} value={d.lastName} onChangeText={(t) => { set('lastName', stripNonNameChars(t).replace(/^\s+/, '').replace(/\s{2,}/g, ' ').slice(0, 50)); clearErr('lastName'); }} placeholder="Last name" maxLength={50} autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => mobileRef.current?.focus()} blurOnSubmit={false}
                  onBlur={() => { const v = d.lastName.trim(); set('lastName', v); setErrors((e) => ({ ...e, lastName: !v ? 'Last name is required' : v.length < 2 ? 'Last name is too short' : '' })); }} />
                <Err k="lastName" />
                <Count n={d.lastName.length} max={50} error={errors.lastName} />
              </View>
            </View>
            </>)}
            <Label t="WhatsApp number" />
            <Field ref={mobileRef} bad={!!errors.mobile} ok={!!d.mobileVerificationToken && d.verifiedMobile === d.mobile} left={<Text style={s.cc}>+91</Text>}
              right={d.mobileVerificationToken && d.verifiedMobile === d.mobile ? <View style={s.okChip}><Ionicons name="checkmark" size={13} color={T.teal2} /><Text style={s.okChipText}>Verified</Text></View> : null}
              value={d.mobile} onChangeText={(t) => { set('mobile', t.replace(/\D/g, '').slice(0, 10)); clearErr('mobile'); }} keyboardType="phone-pad" placeholder="98765 43210" maxLength={10} returnKeyType="done"
              onBlur={() => setErrors((e) => ({ ...e, mobile: !d.mobile ? 'Mobile number is required' : d.mobile.length !== 10 ? 'Mobile number must be 10 digits' : !MOBILE_RE.test(d.mobile) ? 'Mobile number must start with 6, 7, 8 or 9' : '' }))} />
            <Err k="mobile" />
            {!d.resume && (<>
              <Label t="Choose a 4-digit PIN" />
              <Text style={s.pinHint}>You will sign in with this number and PIN — on any phone, even before the profile is finished.</Text>
              <Field bad={!!errors.pin} left={<Ionicons name="keypad-outline" size={18} color={T.mute} style={{ marginRight: 8 }} />}
                right={<TouchableOpacity onPress={() => setShowPin((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name={showPin ? 'eye-outline' : 'eye-off-outline'} size={20} color={T.mute} /></TouchableOpacity>}
                value={pin} onChangeText={(t) => { setPin(t.replace(/\D/g, '').slice(0, 4)); clearErr('pin'); clearErr('pin2'); }} keyboardType="number-pad" secureTextEntry={!showPin} placeholder="4 digits" inputStyle={{ letterSpacing: pin ? 8 : 0 }} maxLength={4}
                  onBlur={() => setErrors((e) => ({ ...e, pin: !pin ? 'PIN is required' : pin.length !== 4 ? 'PIN must be 4 digits' : '' }))} />
              <Err k="pin" />
              <Label t="Confirm PIN" />
              <Field bad={!!errors.pin2} ok={pin.length === 4 && pin === pin2} left={<Ionicons name="keypad-outline" size={18} color={T.mute} style={{ marginRight: 8 }} />}
                right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{pin.length === 4 && pin === pin2 ? <Ionicons name="checkmark-circle" size={20} color={T.teal} /> : null}<TouchableOpacity onPress={() => setShowPin2((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name={showPin2 ? 'eye-outline' : 'eye-off-outline'} size={20} color={T.mute} /></TouchableOpacity></View>}
                value={pin2} onChangeText={(t) => { setPin2(t.replace(/\D/g, '').slice(0, 4)); clearErr('pin2'); }} keyboardType="number-pad" secureTextEntry={!showPin2} placeholder="4 digits" inputStyle={{ letterSpacing: pin2 ? 8 : 0 }} maxLength={4}
                  onBlur={() => setErrors((e) => ({ ...e, pin2: !pin2 ? 'Please confirm the PIN' : pin2 !== pin ? 'PINs do not match' : '' }))} />
              <Err k="pin2" />
            <Label t="This profile is for" />
            <View style={s.tiles}>
              {PROFILE_FOR.map((p) => {
                const on = d.profileFor === p.id;
                return (
                  <TouchableOpacity key={p.id} onPress={() => { set('profileFor', p.id); set('gender', ''); clearErr('profileFor'); }} activeOpacity={0.85} style={[s.tile, on && s.tileOn]}>
                    <View style={[s.tileIco, on && s.tileIcoOn]}><Ionicons name={p.gender === 'F' ? 'female' : p.gender === 'M' ? 'male' : p.id === 'Myself' ? 'person' : 'people'} size={15} color={on ? T.white : T.crimson} /></View>
                    <Text style={[s.tileLabel, on && s.tileLabelOn]}>{p.label}</Text>
                    <Text style={[s.tileTa, on && s.tileTaOn]}>{p.ta}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Err k="profileFor" />
            </>)}
            <View style={s.assure}>
              <View style={s.assureIco}><Ionicons name="logo-whatsapp" size={20} color="#1E9E58" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.assureTitle}>The code arrives on WhatsApp</Text>
                <Text style={s.assureText}>No SMS or email needed. Your number stays private until both families connect.</Text>
              </View>
            </View>
          </View>
          <Cta label={d.mobileVerificationToken && d.verifiedMobile === d.mobile ? 'Continue' : 'Send code & continue'} onPress={() => sendCode(false)} />
          <Text style={s.foot} onPress={() => router.replace('/(root)/(main)/LoginScreen')} suppressHighlighting>
            Already a member? <Text style={s.footLink}>Sign in</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );

  /* ================= VERIFY ================= */
  if (d.stage === 'verify') return (
    <View style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: bottomPad }} overScrollMode="always">
          <Hero colors={[T.crimsonHi, T.crimson, T.plum]} onBack={() => set('stage', 'start')} title="Verify your number" subtitle="WhatsApp code">
            <Text style={s.h2}>Check WhatsApp,{'\n'}{firstName}</Text>
            <Text style={s.heroP}>We sent a 6-digit code to <Text style={{ fontFamily: 'Rubik-Bold', color: T.white }}>+91 {d.mobile}</Text>. Tap <Text style={{ fontFamily: 'Rubik-Bold', color: T.white }}>Copy code</Text> in the message and paste it here.</Text>
          </Hero>
          <View style={s.body}>
            <Label t="6-digit code" />
            <View style={s.otpRow}>
              {Array.from({ length: OTP_LEN }).map((_, i) => (
                <TextInput key={i} ref={(r) => { otpRefs.current[i] = r; }} value={otp[i] || ''} onChangeText={(t) => onOtpDigit(i, t)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key !== 'Backspace') return;
                    setOtpErr('');
                    if (otp[i]) { setOtp(otp.slice(0, i)); return; }
                    if (i > 0) { setOtp(otp.slice(0, i - 1)); otpRefs.current[i - 1]?.focus(); }
                  }}
                  keyboardType="number-pad" maxLength={i === 0 ? OTP_LEN : 1} textContentType="oneTimeCode" autoComplete={i === 0 ? 'sms-otp' : 'off'}
                  style={[s.otpBox, otp[i] && s.otpBoxOn, otpErr && s.ctrlBad]} />
              ))}
            </View>
            {otpErr ? <View style={s.errRow}><Ionicons name="alert-circle" size={14} color={T.err} /><Text style={s.errText}>{otpErr}</Text></View> : null}
            <View style={s.otpFoot}>
              <Text style={s.footSmall}>Wrong number? <Text style={s.footLink} onPress={() => set('stage', 'start')}>Change</Text></Text>
              <TouchableOpacity disabled={cooldown > 0 || busy} onPress={() => sendCode(true)}><Text style={[s.footLink, (cooldown > 0 || busy) && { color: T.mute }]}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}</Text></TouchableOpacity>
            </View>
            <View style={s.tip}><Ionicons name="lock-closed-outline" size={16} color="#7A4B00" /><Text style={s.tipText}>Verifying your number saves your place. If you close the app now, enter the same number later and you'll continue from where you stopped.</Text></View>
          </View>
          <Cta label="Verify" onPress={() => verifyCode()} colors={[T.teal, T.teal2]} textColor={T.white} disabled={otp.length !== OTP_LEN} />
          <Text style={s.foot}>By continuing you agree to our Terms & Privacy Policy</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );

  /* ================= WELCOME / RESUME ================= */
  if (d.stage === 'welcome') {
    const doneCount = 1 + d.doneSteps.length;
    const next = STEPS.findIndex((_, i) => !d.doneSteps.includes(i));
    const nextIdx = next === -1 ? STEPS.length - 1 : next;
    return (
      <View style={s.root}>
        <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} overScrollMode="always">
          <Hero colors={[T.crimsonHi, T.crimson, T.plum]} onBack={() => router.replace('/(root)/(main)/LoginScreen')}>
            <View style={[s.pill, s.pillTeal, { alignSelf: 'flex-start', marginTop: 10 }]}><Ionicons name="checkmark" size={12} color={T.white} /><Text style={s.pillText}> Number verified</Text></View>
            <Text style={s.h2}>Welcome, {firstName}!{'\n'}<Text style={{ fontFamily: 'Rubik-Medium', fontSize: 20, opacity: 0.9 }}>நல்வரவு</Text></Text>
            <Text style={s.heroP}>Finish {possessive(d.profileFor)} profile to start seeing matches. {doneCount} of {STEPS.length + 1} done.</Text>
            <View style={s.prog}>{Array.from({ length: STEPS.length + 1 }).map((_, i) => <View key={i} style={[s.progSeg, i < doneCount && s.progOn]} />)}</View>
          </Hero>
          <View style={s.body}>
            <View style={[s.stepRow, s.stepDone]}>
              <View style={[s.stepIco, { backgroundColor: T.teal }]}><Ionicons name="checkmark" size={20} color={T.white} /></View>
              <View style={{ flex: 1 }}><Text style={s.stepTitle}>Your number</Text><Text style={s.stepHint}>+91 {d.verifiedMobile} · verified on WhatsApp</Text></View>
              <View style={[s.stChip, { backgroundColor: '#D8F3EA' }]}><Text style={[s.stChipText, { color: '#0B7A5A' }]}>Done</Text></View>
            </View>
            {STEPS.map((st, i) => {
              const done = d.doneSteps.includes(i); const isNext = i === nextIdx && !done; const th = STEP_THEMES[i];
              return (
                <TouchableOpacity key={st.title} activeOpacity={0.85} onPress={() => setD((p) => ({ ...p, stage: 'step', step: i }))} style={[s.stepRow, done && s.stepDone, isNext && s.stepNow]}>
                  <LinearGradient colors={done ? [T.teal, T.teal2] : [th.a, th.b]} style={s.stepIco}>{done ? <Ionicons name="checkmark" size={20} color={T.white} /> : <Text style={s.stepNum}>{i + 1}</Text>}</LinearGradient>
                  <View style={{ flex: 1 }}><Text style={s.stepTitle}>{st.title}</Text><Text style={s.stepHint}>{st.hint}</Text></View>
                  <View style={[s.stChip, done && { backgroundColor: '#D8F3EA' }, isNext && { backgroundColor: T.mari }]}><Text style={[s.stChipText, done && { color: '#0B7A5A' }, isNext && { color: T.plum }]}>{done ? 'Done' : isNext ? 'Next' : st.mins}</Text></View>
                </TouchableOpacity>
              );
            })}
          </View>
          <Cta label={`Continue · ${STEPS[nextIdx].title}`} onPress={() => setD((p) => ({ ...p, stage: 'step', step: nextIdx }))} />
          <Text style={s.foot}>Leave any time — we save every step.</Text>
        </ScrollView>
      </View>
    );
  }

  /* ================= STEP ================= */
  const i = d.step; const Art = theme.Art;
  const question = i === 0 ? (d.profileFor === 'Myself' ? 'A little about you' : `A little about ${possessive(d.profileFor).replace(/'s$/, '')}`)
    : i === 1 ? (firstName ? `Where is ${firstName}'s family from?` : 'Where is the family from?')
    : i === 2 ? (d.profileFor === 'Myself' ? 'What do you do?' : `What does ${firstName} do?`) : 'Last step — lock it down';
  const sub = i === 0 ? 'We use this to show the right matches and apply the age rule.' : i === 1 ? 'We show families from your own community first.' : i === 2 ? 'Most families look at this before anything else.' : `You will use this PIN every time you sign in with ${d.mobile}.`;
  const subcasteLabel = subcastes.find((x) => x.id === d.subcasteId)?.label || '';
  const casteLabel = castes.find((x) => x.id === d.casteId)?.label || '';
  const employingLabel = employing.find((x) => x.id === d.employingIn)?.label || '';
  const dobMax = latestDobForGender(gender);
  const dobValue = d.dob ? fromISO(d.dob) : (tempDate > dobMax ? dobMax : tempDate);
  const onDatePicked = (ev: any, date?: Date) => {
    if (Platform.OS === 'android') { setShowDate(false); if (ev?.type !== 'set' || !date) return; set('dob', toISO(date)); clearErr('dob'); return; }
    if (date) setTempDate(date);
  };
  return (
    <View style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: bottomPad }} overScrollMode="always">
          <Hero colors={[theme.a, theme.b, theme.deep]} onBack={() => (i > 0 ? set('step', i - 1) : set('stage', 'welcome'))} title={`Step ${i + 1} of ${STEPS.length}`} subtitle={STEPS[i].title} pill="Saved ✓" art={Art}>
            <Text style={s.h2}>{question}</Text>
            <Text style={s.heroP}>{sub}</Text>
            <View style={s.prog}>{STEPS.map((_, k) => <View key={k} style={[s.progSeg, k <= i && s.progOn]} />)}</View>
            <View style={{ height: 14 }} />
          </Hero>
          <View style={[s.body, { paddingTop: 30 }]}>
            {i === 0 && (<>
              {needsGender && (<>
                <Label t="Gender" />
                <View style={s.row2}>
                  {[{ id: 'M', l: 'Male', ta: 'ஆண்' }, { id: 'F', l: 'Female', ta: 'பெண்' }].map((g) => {
                    const on = d.gender === g.id;
                    return (<TouchableOpacity key={g.id} onPress={() => { set('gender', g.id); clearErr('gender'); clearErr('dob'); }} activeOpacity={0.85} style={[s.tile, s.tileWide, on && s.tileOn]}>
                      <View style={[s.tileIco, on && s.tileIcoOn]}><Ionicons name={g.id === 'F' ? 'female' : 'male'} size={15} color={on ? T.white : T.crimson} /></View>
                      <View><Text style={[s.tileLabel, on && s.tileLabelOn]}>{g.l}</Text><Text style={[s.tileTa, on && s.tileTaOn]}>{g.ta}</Text></View>
                    </TouchableOpacity>);
                  })}
                </View>
                <Err k="gender" />
              </>)}
              {!needsGender && d.profileFor && <View style={s.autoNote}><Ionicons name="information-circle-outline" size={15} color={theme.deep} /><Text style={[s.tipText, { color: theme.deep }]}>Gender set to {gender === 'F' ? 'Female' : 'Male'} from "{d.profileFor}".</Text></View>}
              <Label t="Date of birth" />
              <TouchableOpacity activeOpacity={0.8} onPress={() => { Keyboard.dismiss(); setTempDate(dobValue); setShowDate(true); }} style={[s.ctrl, errors.dob && s.ctrlBad]}>
                <Ionicons name="calendar-outline" size={18} color={T.mute} />
                <Text style={[s.ctrlText, { flex: 1, marginLeft: 8 }, !d.dob && s.phText]}>{d.dob ? fmtDate(d.dob) : 'Select date'}</Text>
                {d.dob ? <Text style={s.ageChip}>{ageOnDate(fromISO(d.dob))} yrs</Text> : null}
              </TouchableOpacity>
              <Err k="dob" />
              <View style={s.tip}><Ionicons name="shield-checkmark-outline" size={16} color="#7A4B00" /><Text style={s.tipText}>{ageRuleMessage(gender)}</Text></View>
            </>)}
            {i === 1 && (<>
              <Label t="Caste" />
              <Select k="casteId" value={casteLabel} placeholder="Select caste" title="Caste" options={castes} onPick={(id: string) => { setD((p) => ({ ...p, casteId: id, subcasteId: '' })); clearErr('casteId'); }} />
              <Err k="casteId" />
              {subcastes.length > 0 && (<>
                <Label t="Subcaste" />
                <View style={s.chips}>
                  {subcastes.map((sc) => { const on = d.subcasteId === sc.id; return (
                    <TouchableOpacity key={sc.id} onPress={() => { set('subcasteId', sc.id); clearErr('subcasteId'); }} style={[s.chip, on && { backgroundColor: theme.a, borderColor: theme.a }]}><Text style={[s.chipText, on && { color: T.white }]}>{sc.label}</Text></TouchableOpacity>); })}
                </View>
                <Err k="subcasteId" />
              </>)}
              <Label t="District" />
              <Select k="district" value={d.district} placeholder="Select district" title="District" options={districts} search onPick={(id: string) => { set('district', id); clearErr('district'); }} />
              <Err k="district" />
              <View style={s.tip}><Ionicons name="bulb-outline" size={16} color="#7A4B00" /><Text style={s.tipText}>Not sure of the subcaste? Pick Others — it can be changed later from the profile.</Text></View>
            </>)}
            {i === 2 && (<>
              <Label t="Highest education" />
              <Select k="education" value={d.education ? eduDisplay(d.education) : ''} placeholder="Select education" title="Highest education" options={educations} onPick={(id: string) => { set('education', id); clearErr('education'); }} />
              <Err k="education" />
              <Label t="Occupation" />
              <Field bad={!!errors.occupation} value={d.occupation} onChangeText={(t) => { set('occupation', t.replace(/^\s+/, '').replace(/\s{2,}/g, ' ').slice(0, 60)); clearErr('occupation'); }} placeholder="e.g. Software engineer" maxLength={60} autoCapitalize="sentences"
                  onBlur={() => { const v = d.occupation.trim(); set('occupation', v); setErrors((e) => ({ ...e, occupation: !v ? 'Occupation is required' : v.length < 2 ? 'Occupation is too short' : '' })); }} />
              <Err k="occupation" />
              <Label t="Employed in" />
              <Select k="employingIn" value={employingLabel} placeholder="Select" title="Employed in" options={employing} onPick={(id: string) => { set('employingIn', id); clearErr('employingIn'); }} />
              <Err k="employingIn" />
            </>)}
          </View>
          <Cta label={i === STEPS.length - 1 ? 'Finish & send for verification' : 'Save & continue'} onPress={nextStep} colors={[theme.a, theme.b]} textColor={T.white} />
          <Text style={s.foot}>{i < STEPS.length - 1 ? `Next · ${STEPS[i + 1].title}` : 'By continuing you agree to our Terms & Privacy Policy'}</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* date picker */}
      {showDate && Platform.OS === 'android' && <DateTimePicker value={dobValue} mode="date" display="default" maximumDate={dobMax} minimumDate={new Date(1950, 0, 1)} onChange={onDatePicked} />}
      {showDate && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible onRequestClose={() => setShowDate(false)}>
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowDate(false)}>
            <TouchableOpacity activeOpacity={1} style={s.sheetBox} onPress={() => {}}>
              <View style={s.sheetHead}><Text style={s.sheetTitle}>Date of birth</Text><TouchableOpacity onPress={() => setShowDate(false)}><Ionicons name="close" size={22} color={T.mute} /></TouchableOpacity></View>
              <DateTimePicker value={tempDate > dobMax ? dobMax : tempDate} mode="date" display="spinner" maximumDate={dobMax} minimumDate={new Date(1950, 0, 1)} onChange={onDatePicked} themeVariant="light" textColor={T.ink} />
              <TouchableOpacity onPress={() => { set('dob', toISO(tempDate > dobMax ? dobMax : tempDate)); clearErr('dob'); setShowDate(false); }} style={[s.cta, { marginHorizontal: 0, backgroundColor: T.crimson }]}><Text style={[s.ctaText, { color: T.white }]}>Confirm</Text></TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* select sheet */}
      <Modal transparent animationType="slide" visible={!!sheet} onRequestClose={() => setSheet(null)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setSheet(null)}>
          <TouchableOpacity activeOpacity={1} style={[s.sheetBox, { maxHeight: '75%' }]} onPress={() => {}}>
            <View style={s.sheetHead}><Text style={s.sheetTitle}>{sheet?.title}</Text><TouchableOpacity onPress={() => setSheet(null)}><Ionicons name="close" size={22} color={T.mute} /></TouchableOpacity></View>
            <FlatList data={sheet?.options || []} keyExtractor={(it) => it.id} keyboardShouldPersistTaps="handled" renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { sheet?.onPick(item.id); setSheet(null); }} style={s.sheetRow}><Text style={s.sheetRowText}>{item.label}</Text><Ionicons name="chevron-forward" size={16} color={T.ph} /></TouchableOpacity>
            )} ListEmptyComponent={<Text style={[s.foot, { paddingVertical: 24 }]}>Loading…</Text>} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF8EE' },
  bleed: { position: 'absolute', top: -800, left: 0, right: 0, height: 800 },
  hero: { paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'visible' },
  glow: { position: 'absolute', right: -30, top: -30, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(246,183,51,0.28)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // The lotus logo (gold on maroon) sits flush on the maroon hero; a gold hairline marks the tile.
  mark: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(246,183,51,0.55)', backgroundColor: '#420001' },
  backBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: 'Rubik-Bold', fontSize: 15, color: '#fff' },
  brandTa: { fontFamily: 'Rubik-Regular', fontSize: 10.5, color: 'rgba(255,255,255,0.8)' },
  h2: { fontFamily: 'Rubik-ExtraBold', fontSize: 22, color: '#fff', lineHeight: 27, marginTop: 12 },
  heroP: { fontFamily: 'Rubik-Regular', fontSize: 12.5, color: 'rgba(255,255,255,0.86)', lineHeight: 18, marginTop: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillTeal: { backgroundColor: 'rgba(15,163,163,0.35)', borderColor: 'rgba(15,163,163,0.7)' },
  pillText: { fontFamily: 'Rubik-Medium', fontSize: 11.5, color: '#fff' },
  prog: { flexDirection: 'row', gap: 6, marginTop: 12 },
  progSeg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.28)' },
  progOn: { backgroundColor: '#F6B733' },
  medal: { position: 'absolute', right: 22, bottom: -26, width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  body: { paddingHorizontal: 20, paddingTop: 6 },
  lab: { fontFamily: 'Rubik-Bold', fontSize: 11, letterSpacing: 0.6, color: '#7A6670', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '23%', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0DDC6', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  tileWide: { width: undefined, flex: 1, flexDirection: 'row', gap: 10, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center' },
  tileOn: { backgroundColor: '#420001', borderColor: '#420001', shadowColor: '#420001', shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  tileIco: { width: 26, height: 26, borderRadius: 9, backgroundColor: '#FBEFD9', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  tileIcoOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tileLabel: { fontFamily: 'Rubik-Medium', fontSize: 12, color: '#2A1226', textAlign: 'center' },
  tileLabelOn: { color: '#fff' },
  tileTa: { fontFamily: 'Rubik-Regular', fontSize: 9.5, color: '#7A6670', marginTop: 2, textAlign: 'center' },
  tileTaOn: { color: 'rgba(255,255,255,0.8)' },
  row2: { flexDirection: 'row', gap: 10 },
  ctrl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0DDC6', borderRadius: 16, height: 54, paddingHorizontal: 14 },
  ctrlBad: { borderColor: '#DC2626' },
  ctrlOk: { borderColor: '#0FA3A3', backgroundColor: '#F0FBFA' },
  ctrlText: { fontFamily: 'Rubik-Regular', fontSize: 15, color: '#2A1226' },
  phText: { color: '#B9A9AF' },
  input: { fontFamily: 'Rubik-Regular', fontSize: 15, color: '#2A1226', paddingVertical: 0 },
  cc: { fontFamily: 'Rubik-SemiBold', fontSize: 15, color: '#7A6670', paddingRight: 10, marginRight: 10, borderRightWidth: 1, borderRightColor: '#F0DDC6' },
  okChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#DDF5F3', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  okChipText: { fontFamily: 'Rubik-SemiBold', fontSize: 11.5, color: '#0B8484' },
  ageChip: { fontFamily: 'Rubik-SemiBold', fontSize: 12, color: '#0B8484', backgroundColor: '#DDF5F3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  count: { fontFamily: 'Rubik-Regular', fontSize: 11, color: '#9A8C92', textAlign: 'right', marginTop: 4 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  errText: { fontFamily: 'Rubik-Regular', fontSize: 12, color: '#DC2626' },
  assure: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0DDC6', borderRadius: 16, padding: 12, marginTop: 16 },
  assureIco: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E6F8EE', alignItems: 'center', justifyContent: 'center' },
  assureTitle: { fontFamily: 'Rubik-SemiBold', fontSize: 13, color: '#2A1226' },
  assureText: { fontFamily: 'Rubik-Regular', fontSize: 11.5, color: '#7A6670', marginTop: 2, lineHeight: 16 },
  ctaWrap: { marginHorizontal: 20, marginTop: 18, borderRadius: 18, shadowColor: '#E0961C', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  cta: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontFamily: 'Rubik-Bold', fontSize: 16 },
  foot: { fontFamily: 'Rubik-Regular', fontSize: 11.5, color: '#7A6670', textAlign: 'center', marginTop: 12, paddingHorizontal: 20 },
  footSmall: { fontFamily: 'Rubik-Regular', fontSize: 12.5, color: '#7A6670' },
  footLink: { fontFamily: 'Rubik-Bold', color: '#420001' },
  otpRow: { flexDirection: 'row', gap: 8 },
  otpBox: { flex: 1, height: 56, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0DDC6', textAlign: 'center', fontFamily: 'Rubik-SemiBold', fontSize: 22, color: '#2A1226' },
  otpBoxOn: { borderColor: '#0FA3A3', backgroundColor: '#F0FBFA' },
  otpFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  tip: { flexDirection: 'row', gap: 8, backgroundColor: '#FFF3D9', borderWidth: 1, borderColor: '#F3D28A', borderRadius: 14, padding: 11, marginTop: 16 },
  pinHint: { fontFamily: 'Rubik-Regular', fontSize: 12, color: T.mute, marginTop: -4, marginBottom: 8, lineHeight: 17 },
  tipText: { flex: 1, fontFamily: 'Rubik-Regular', fontSize: 12, color: '#7A4B00', lineHeight: 17 },
  autoNote: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0DDC6', borderRadius: 18, padding: 12, marginTop: 10 },
  stepDone: { borderColor: '#BFE9DF', backgroundColor: '#F3FBF8' },
  stepNow: { borderColor: '#F6B733', shadowColor: '#F6B733', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  stepIco: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontFamily: 'Rubik-Bold', fontSize: 16, color: '#fff' },
  stepTitle: { fontFamily: 'Rubik-SemiBold', fontSize: 14, color: '#2A1226' },
  stepHint: { fontFamily: 'Rubik-Regular', fontSize: 11.5, color: '#7A6670', marginTop: 1 },
  stChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#FBEFD9' },
  stChipText: { fontFamily: 'Rubik-SemiBold', fontSize: 11, color: '#7A6670' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0DDC6' },
  chipText: { fontFamily: 'Rubik-Medium', fontSize: 13, color: '#2A1226' },
  overlay: { flex: 1, backgroundColor: 'rgba(42,18,38,0.45)', justifyContent: 'flex-end' },
  sheetBox: { backgroundColor: '#FFF8EE', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 16, paddingBottom: 28 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sheetTitle: { fontFamily: 'Rubik-Bold', fontSize: 16, color: '#2A1226' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0DDC6' },
  sheetRowText: { fontFamily: 'Rubik-Regular', fontSize: 15, color: '#2A1226' },
});
