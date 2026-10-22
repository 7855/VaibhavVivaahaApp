import React, { useRef, useState, useEffect, SetStateAction } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
  Keyboard
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Swiper from "react-native-swiper";
import { Box, Input, NativeBaseProvider, Text as TextNB, Button as ButtonNB, HStack, FlatList } from "native-base";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import moment from 'moment'; // Import the moment library for date formatting
import { SelectList } from 'react-native-dropdown-select-list'
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { AntDesign } from '@expo/vector-icons';
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { loadMasterData } from "../services/masterService";
import { useMasterData } from "../contexts/MasterDataContext";
import { usePopup } from "../contexts/PopupContext";
import { stripNonNameChars, minAgeForGender, meetsMinAge, latestDobForGender, ageRuleMessage } from '../../../constants/data';
type GetstartProps = {
  onStart: () => void;
};

interface CustomModalPickerProps {
  label: string;
  placeholder: string;
  data: { id: string | number; value: string }[];
  selected: string;
  onSelect: (val: string) => void;
  /** Renders the field greyed out and non-tappable. Used for dependent fields (e.g. Subcaste
   *  before a Caste is chosen) so the control stays visible instead of vanishing. */
  disabled?: boolean;
  /** Shown in place of the placeholder while disabled, to say WHY it can't be used yet. */
  disabledHint?: string;
}

const CustomModalPicker: React.FC<CustomModalPickerProps> = ({
  label,
  placeholder,
  data,
  selected,
  onSelect,
  disabled = false,
  disabledHint,
}) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filteredData = data.filter((item) =>
    item.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Label */}
      <TextNB style={styles.fieldLabel}>{label}</TextNB>

      {/* Selected Value Box */}
      <TouchableOpacity
        style={[styles.inputBox, disabled && styles.inputBoxDisabled]}
        onPress={() => setVisible(true)}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <TextNB style={{ color: disabled ? "#b0b7c3" : selected ? "#000" : "#999", fontSize: 14, fontFamily: 'Rubik-Regular' }}>
          {disabled ? (disabledHint || placeholder) : (selected || placeholder)}
        </TextNB>
        <Ionicons name="chevron-down" size={16} color={disabled ? "#b0b7c3" : "#0f1724"} />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <TextNB style={styles.modalTitle}>{label}</TextNB>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={22} color="#0f1724" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Ionicons
                name="search"
                size={18}
                color="#1F7FE5"
                style={{ marginRight: 5 }}
              />
              <TextInput
                placeholder="Search"
                placeholderTextColor="#999"
                value={search}
                onChangeText={setSearch}
                style={{
                  flex: 1, height: 40,
                  fontSize: 14,
                  fontFamily: 'Rubik-Regular',
                  padding: 5,
                }}
              />
            </View>

            {/* List */}
            <FlatList
              data={filteredData}
              keyExtractor={(item, index) => item.value || index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                    setSearch("");
                  }}
                >
                  <TextNB>{item.value}</TextNB>
                </TouchableOpacity>
              )}
            />

          </View>
        </View>
      </Modal>
    </View>
  );
};

type CasteOption = {
  id: string;
  value: string;
  label: string;
  code: string;
};
interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  occupation?: string;
  pin?: string;
  confirmPin?: string;
  // Add other error fields as needed
}

const STEP_LABELS = ['About you', 'Life & PIN'];
const PROFILE_FOR = ['Myself', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative/Friend'].map((v) => ({ id: v, value: v }));
const DRAFT_KEY = 'signupDraft';

export default function SignUp({ onStart }: GetstartProps) {
  const popup = usePopup();
  // The SafeAreaView below deliberately omits the 'bottom' edge (the Swiper needs the full
  // height), so the page-nav buttons sat under Android's gesture bar / nav buttons on devices
  // with a bottom inset. Pad by the real inset instead of a fixed 28.
  const insets = useSafeAreaInsets();
  const navBottomPad = Math.max(28, insets.bottom + 16);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [swiperReady, setSwiperReady] = useState(false);

  // Keyboard headroom — MEASURED, not assumed. Same technique as chatscreen.tsx
  // (section 18, 2026-08-13), which is the only approach that proved reliable on
  // device.
  //
  // PIN/Confirm PIN are the last elements in page 2's scroll view and the footer
  // CTA sits outside it, so with no bottom padding there is no scroll range left
  // and they cannot be lifted above the keyboard (a ScrollView cannot scroll past
  // its own content end).
  //
  // How much to add is NOT guessable: windowSoftInputMode="adjustResize" is set,
  // but under edge-to-edge / targetSdk 36 whether Android honours it varies by
  // device. Assuming it applied leaves the field behind the keyboard; assuming it
  // did not double-compensates and parks the form far too high. Earlier attempts
  // here used a fixed 260→130 spacer and then a 60%-of-keyboard fudge — both were
  // per-device guesses. So: compare the container's height now against its
  // keyboard-closed baseline. If it genuinely shrank, the OS already made room and
  // we add nothing; if it did not, we add the full measured keyboard height.
  //
  // Safe from feedback: the padding is applied to the scroll view's CONTENT, which
  // never changes the measured container's own frame, so it cannot re-trigger this.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const openContainerHeightRef = useRef(0);

  // Baseline = container height while the keyboard is closed.
  useEffect(() => {
    if (keyboardHeight === 0 && containerHeight > openContainerHeightRef.current) {
      openContainerHeightRef.current = containerHeight;
    }
  }, [containerHeight, keyboardHeight]);

  // >100px so a status-/nav-bar shift is never mistaken for a keyboard resize.
  const containerShrankForKeyboard =
    openContainerHeightRef.current > 0 &&
    openContainerHeightRef.current - containerHeight > 100;

  // The Next/Back row sits OUTSIDE the scroll view, so the keyboard covers it
  // first — only the remainder actually eats into the scrollable viewport.
  // Padding the full keyboard height (what this used to do) left a visible dead
  // band of ~90px under the last field once you scrolled down. Measured, not
  // guessed: navRowHeight comes from the row's own onLayout.
  const [navRowHeight, setNavRowHeight] = useState(0);
  const kbSpacer =
    keyboardHeight === 0
      ? 0
      : containerShrankForKeyboard
        ? 0
        : Math.max(0, keyboardHeight - navRowHeight);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e?.endCoordinates?.height || 0);
        // Same diagnostic as chatscreen's [chat-kb]: console is not stripped in
        // release here, so `adb logcat | grep signup-kb` settles on a real APK
        // whether adjustResize applied on a given device.
        console.log('[signup-kb]', JSON.stringify({
          keyboardHeight: e?.endCoordinates?.height,
          containerHeight,
          baseline: openContainerHeightRef.current,
          shrank: openContainerHeightRef.current - containerHeight,
        }));
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, [containerHeight]);
  // Drives the stepper header — the form has no other sense of "where am I" otherwise.
  const [activeStep, setActiveStep] = useState(0);
  const [dob, setDob] = useState(new Date());
  const [dobDisplay, setDobDisplay] = useState("");
  const [mobile, setMobile] = useState("");
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [caste, setCaste] = useState('');
  const [subcaste, setSubcaste] = useState('');
  const { state: masterData, setMasterData, getSubcastesForCaste } = useMasterData();
  const [educationOptions, setEducationOptions] = useState<Array<{ id: string, value: string }>>([]);
  const [incomeOptions, setIncomeOptions] = useState<Array<{ id: string, value: string, label: string, numericValue: string }>>([]);
  const [employmentOptions, setEmploymentOptions] = useState<Array<{ id: string, value: string, label: string }>>([]);
  const [districtOptions, setDistrictOptions] = useState<Array<{ id: string, value: string }>>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [allCaste, setAllCaste] = useState<any[]>([]);
  const [selectedGender, setSelectedGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [casteList, setCasteList] = useState<CasteOption[]>([]);
  const [employmentStatus, setEmploymentStatus] = useState('');
  // employmentOptions is now managed by the masterData effect
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [age, setAge] = useState('');
  const [profileFor, setProfileFor] = useState('');
  const [email, setEmail] = useState('');
  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  // Mobile verified on WhatsApp (2026-10-14) — same shape as the email pair.
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileVerificationToken, setMobileVerificationToken] = useState<string | null>(null);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);

  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // Arrived from PhoneStartScreen (2026-10-16): the number is already verified on WhatsApp,
  // and a website lead's name comes along for prefill.
  const startParams = useLocalSearchParams<{ mobile?: string; mobileVerificationToken?: string; leadName?: string; profileFor?: string }>();
  useEffect(() => {
    const m = String(startParams.mobile || '');
    const t = String(startParams.mobileVerificationToken || '');
    if (m && t) {
      setMobile(m);
      setMobileVerificationToken(t);
      setMobileVerified(true);
    }
    const ln = String(startParams.leadName || '').trim();
    if (ln) {
      const [f, ...rest] = ln.split(/\s+/);
      setFirstName((v) => v || f);
      if (rest.length) setLastName((v) => v || rest.join(' '));
    }
    const pf = String(startParams.profileFor || '').trim();
    if (pf) setProfileFor((v) => v || pf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Draft: everything but the PIN, restored when the member comes back mid-way.
  const draftLoaded = useRef(false);
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.firstName) setFirstName((v) => v || d.firstName);
          if (d.lastName) setLastName((v) => v || d.lastName);
          if (d.email) setEmail((v) => v || d.email);
          if (d.selectedGender) setSelectedGender((v) => v || d.selectedGender);
          if (d.caste) setCaste((v) => v || d.caste);
          if (d.subcaste) setSubcaste((v) => v || d.subcaste);
          if (d.education) setEducation((v) => v || d.education);
          if (d.occupation) setOccupation((v) => v || d.occupation);
          if (d.selectedCity) setSelectedCity((v) => v || d.selectedCity);
          if (d.profileFor) setProfileFor((v) => v || d.profileFor);
          if (d.dob && d.dobDisplay) { setDob(new Date(d.dob)); setDobDisplay((v) => v || d.dobDisplay); }
          if (d.employmentStatus) setEmploymentStatus((v) => v || d.employmentStatus);
        }
      } catch { /* a bad draft is just ignored */ }
      draftLoaded.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!draftLoaded.current) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({
        firstName, lastName, email, selectedGender, caste, subcaste, education, occupation, selectedCity, profileFor,
        dob: dobDisplay ? dob.toISOString() : '', dobDisplay, employmentStatus,
      })).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, email, selectedGender, caste, subcaste, education, occupation, selectedCity, profileFor, dobDisplay, employmentStatus]);
  const [submitting, setSubmitting] = useState(false);
  const swiperRef = useRef<Swiper>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date()); // Spinner value
  // Letters of ANY script + spaces. Tamil names are allowed (client 2026-09-20);
  // digits and symbols are still rejected as they're typed. See constants/data.ts.
  const onlyAlphabets = stripNonNameChars;
  // Names: letters + single internal spaces only. A leading space is dropped as
  // it's typed and repeated spaces collapse; the trailing one is trimmed on blur
  // and again at submit (you must be able to type a space to start a surname).
  const nameInput = (text: string, max = 50) =>
    onlyAlphabets(text).replace(/^\s+/, '').replace(/\s{2,}/g, ' ').slice(0, max);
  const onlyNumbers = (text: string) => text.replace(/[^0-9]/g, '');
  // Indian mobile: exactly 10 digits, starting 6–9. A 9-digit number used to slip
  // through (only the blur hint checked length) and that account could then never
  // sign in by mobile — the login screen requires 10 digits.
  const isValidMobile = (m: string) => /^[6-9]\d{9}$/.test(m);
  const noSpecialChars = (text: string) => text.replace(/[^A-Za-z0-9\s]/g, '');
  const onlyAlphanumeric = (text: string) => text.replace(/[^A-Za-z0-9\s]/g, '');
  const isValidEmail = (email: string) => {
    // Allows alphanumeric, ., _, -, + before @
    // Followed by @
    // Then alphanumeric and . for domain
    // Must have at least one . after @
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };
  const [errors, setErrors] = useState<FormErrors>({});

  // Subcaste is optional and strictly dependent on the selected caste. The `subcastes` table is
  // empty today, so this resolves to [] for every caste and the field below never renders —
  // signup looks and behaves exactly as it did before.
  const selectedCasteId = React.useMemo(
    () => allCaste.find((c: any) => c.casteName === caste || c.casteCode === caste)?.id ?? null,
    [allCaste, caste]
  );
  const subcasteOptions = React.useMemo(
    () => (getSubcastesForCaste?.(selectedCasteId) || []).map((sc: any) => ({
      id: String(sc.id),
      value: sc.subcasteName,
    })),
    [getSubcastesForCaste, selectedCasteId]
  );

  // Live gate for the Create Account button — mirrors validateFormData() so the
  // button can only be pressed once the whole form is actually submittable.
  const isFormComplete =
    !!firstName.trim() &&
    !!lastName.trim() &&
    !!dob &&
    !!selectedGender &&
    // Gender-aware minimum age (men 21, women 18). Uses the module-level helper, NOT the
    // component's calculateAge — that const is declared further down, so calling it here would
    // throw on every render.
    !!dobDisplay && meetsMinAge(dob, selectedGender) &&
    !!caste &&
    (subcasteOptions.length === 0 || !!subcaste) &&
    isValidMobile(mobile) &&
    !!String(age).trim() &&
    // Email is optional (2026-10-16); when given it must be verified.
    (email.trim() === '' || (isValidEmail(email) && emailVerified && !!verificationToken)) &&
    mobileVerified &&
    !!mobileVerificationToken &&
    !!education &&
    !!occupation.trim() &&
    !!employmentStatus &&
    !!selectedCity &&
    /^\d{4}$/.test(pin) &&
    pin === confirmPin;

  const validateFormData = () => {
    const fieldLabels: Record<string, string> = {
      firstName: 'First Name',
      lastName: 'Last Name',
      dob: 'Date of Birth',
      gender: 'Gender',
      caste: 'Caste',
      subcaste: 'Subcaste',
      mobile: 'Mobile Number',
      age: 'Age',
      email: 'Email',
      education: 'Education',
      occupation: 'Occupation',
      employmentStatus: 'Employment Status',
      selectedCity: 'District',
      pin: 'PIN',
      confirmPin: 'Confirm PIN',
    };

    // Father's/Mother's Name+Occupation, Job Place, Current Address, Native Place, Annual
    // Income, and Education in Detail are no longer required at signup — they're collected
    // later via the post-signup profile-completion flow (Family/Education/Personal edit
    // sections on the Profile tab), which already has working save paths for them.
    const formData: any = {
      firstName,
      lastName,
      dob,
      gender: selectedGender,
      caste,
      subcaste,
      mobile,
      age,
      education,
      occupation,
      employmentStatus,
      selectedCity,
      pin,
      confirmPin,
    };

    // Subcaste is required only for castes that actually have one. Castes with a real list all
    // include an "Others" option, so nobody is forced to guess — but a caste-level choice like
    // FREE CASTE BAR ("any caste is fine") has no subcastes at all, and demanding one there would
    // make the form impossible to submit. Mirrors the same rule on the backend's createUser.
    const requiredFields = Object.keys(formData).filter(
      (field) => field !== 'subcaste' || subcasteOptions.length > 0
    );

    const missingFields = requiredFields
      .filter(
        (field) =>
          formData[field] === null ||
          formData[field] === undefined ||
          formData[field].toString().trim() === ""
      )
      .map(field => fieldLabels[field] || field); // Map field names to labels

    // Email is optional; if one was typed it must be valid and verified.
    if (email.trim() && (!isValidEmail(email) || !emailVerified)) {
      missingFields.push('Email Verification');
    }

    if (missingFields.length > 0) {
      popup.warning(
        "Missing Fields",
        `Please fill in the following required fields:\n\n• ${missingFields.join("\n• ")}`
      );
      return false;
    }

    if (!isValidMobile(mobile)) {
      popup.error("Invalid Mobile Number", "Please enter a valid 10-digit mobile number.");
      return false;
    }

    if (!meetsMinAge(dob, selectedGender)) {
      popup.warning("Age Restriction", ageRuleMessage(selectedGender));
      return false;
    }

    if (!/^\d{4}$/.test(pin)) {
      popup.error("Invalid PIN", "PIN must be exactly 4 digits.");
      return false;
    }

    if (formData.pin !== formData.confirmPin) {
      popup.error("Validation Error", "PIN and Confirm PIN do not match!");
      return false;
    }

    return true;
  };

  // The dropdown lists this screen actually needs out of the keyValue bag.
  // The old guard was `if (!Object.keys(masterData).length)` — "is there ANYTHING cached" — which
  // silently broke Education / City / Employing In: MasterProvider seeds the same `masterData`
  // cache with just `{castes, subcastes}` (from /caste/*, not keyValue), so on any launch where
  // that landed first the object was non-empty and this fetch was skipped entirely, leaving those
  // three lists undefined forever. Check for the specific keys instead.
  const REQUIRED_MASTER_KEYS = ['education', 'districts', 'employingIn', 'annualIncomeRegister'];
  const masterFetchAttempted = useRef(false);

  useEffect(() => {
    const missing = REQUIRED_MASTER_KEYS.some((k) => !Array.isArray(masterData?.[k]));
    // The ref stops a failed/partial response from re-triggering this on every masterData change.
    if (missing && !masterFetchAttempted.current) {
      masterFetchAttempted.current = true;
      loadMasterData(setMasterData).catch((e: any) =>
        console.warn('[sign-up] Failed to load master data:', e?.message || e)
      );
    }
  }, [masterData]);

  // Update dropdown options when masterData changes
  useEffect(() => {
    if (masterData) {
      // Update education options
      if (masterData.education) {
        const eduOptions = masterData.education.map((edu: any) => ({
          id: edu.id.toString(),
          value: edu.degree
        }));
        setEducationOptions(eduOptions);
      }

      // Update income options — use annualIncomeRegister for registration (simple list)
      const incSource = masterData.annualIncomeRegister || masterData.annualIncome || masterData.annualIncomes;
      if (incSource) {
        const incOptions = incSource.map((income: any) => ({
          id: income.id.toString(),
          value: income.label || income.amount?.toString() || '',
          numericValue: income.value || income.amount?.toString() || ''
        }));
        setIncomeOptions(incOptions);
      }

      // Update employment options
      if (masterData.employingIn) {
        const empOptions = masterData.employingIn.map((emp: any) => ({
          id: emp.value,
          value: emp.value,
          label: emp.label || emp.value
        }));
        console.log("Employment options:", empOptions);
        setEmploymentOptions(empOptions);
      }

      // Update district/city options
      if (masterData.districts) {
        const distOptions = masterData.districts.map((d: any) => ({
          id: d.id.toString(),
          value: d.value,
        }));
        setDistrictOptions(distOptions);
      }
    }
  }, [masterData]);

  useEffect(() => {
    const fetchCasteList = async () => {
      try {
        setLoading(true);
        const response = await userApi.getAllCaste();
        if (response.data && response.data.data) {
          console.log("response.data.data", response.data.data);

          // Filter only active castes and format for CustomModalPicker
          const activeCastes = response.data.data.filter((caste: any) => caste.isActive === 'Y');
          setAllCaste(activeCastes);

          // Format for CustomModalPicker
          const casteOptions = activeCastes.map((caste: any) => ({
            id: caste.id.toString(),
            value: caste.casteName,
            label: caste.casteName,
            code: caste.casteCode
          }));

          console.log("casteOptions==================================>", casteOptions);
          setCasteList(casteOptions);
        }
      } catch (error) {
        console.error('Error fetching caste list:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCasteList();
  }, []);

  const logFormData = (formData: any) => {
    console.log('Form Data:', JSON.stringify(formData, null, 2));
  };

  // ===== Email verification =====
  const handleVerifyEmail = async () => {
    if (!isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
      return;
    }
    try {
      setSendingEmailOtp(true);
      console.log('sendAuthOtp payload →', { email, purpose: 'registration' });
      // Full name in the greeting — registration OTP is the one mail sent before
      // a user row exists, so the name has to travel with the request.
      const otpName = [firstName, lastName].filter(Boolean).join(' ').trim();
      const res = await userApi.sendAuthOtp({ email, purpose: 'registration', firstName: otpName || undefined });
      if (res.data?.code === 200) {
        popup.success(
          'OTP Sent',
          `A verification code has been sent to ${email}. Please check your inbox.`,
          () => {
            router.push({
              pathname: '/(root)/(main)/OTPValidationScreen',
              params: { email, purpose: 'registration' },
            });
          }
        );
      } else if (res.data?.code === 409) {
        popup.warning('Email Already Registered', res.data.message || 'This email is already registered. Please login instead.');
      } else {
        popup.error('Error', res.data?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('sendAuthOtp error:', err);
      popup.error('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyMobile = async () => {
    if (!isValidMobile(mobile)) {
      setErrors(prev => ({ ...prev, mobile: 'Please enter a valid 10-digit mobile number' }));
      return;
    }
    try {
      setSendingMobileOtp(true);
      const res = await userApi.sendMobileOtp({ mobile, purpose: 'registration' });
      if (res.data?.code === 200) {
        popup.success(
          'Code Sent on WhatsApp',
          `We've sent a 6-digit code on WhatsApp to +91 ${mobile}. Tap Copy Code in the message and paste it on the next screen.`,
          () => {
            router.push({
              pathname: '/(root)/(main)/OTPValidationScreen',
              params: { mobile, purpose: 'registration' },
            });
          }
        );
      } else if (res.data?.code === 409) {
        popup.warning('Mobile Already Registered', res.data.message || 'This mobile number is already registered. Please login instead.');
      } else if (res.data?.code === 429) {
        popup.warning('Please wait', res.data.message || 'Too many codes requested. Please try again after 10 minutes.');
      } else {
        popup.error('Error', res.data?.message || 'Failed to send the WhatsApp code. Please try again.');
      }
    } catch (err: any) {
      const code = err?.response?.data?.code ?? err?.response?.status;
      if (code === 409) popup.warning('Mobile Already Registered', 'This mobile number is already registered. Please login instead.');
      else if (code === 429) popup.warning('Please wait', 'Too many codes requested. Please try again after 10 minutes.');
      else popup.error('Error', 'Failed to send the WhatsApp code. Please try again.');
    } finally {
      setSendingMobileOtp(false);
    }
  };

  // Back from the OTP screen with a WhatsApp-verified mobile
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const token = await AsyncStorage.getItem('mobileVerificationToken');
        const verifiedMobile = await AsyncStorage.getItem('verifiedMobile');
        if (token && verifiedMobile && verifiedMobile === mobile) {
          setMobileVerificationToken(token);
          setMobileVerified(true);
          await AsyncStorage.multiRemove(['mobileVerificationToken', 'verifiedMobile']);
        }
      })();
    }, [mobile])
  );

  // When user returns from OTP screen, check if they verified their email
  useFocusEffect(
    React.useCallback(() => {
      const checkVerification = async () => {
        const token = await AsyncStorage.getItem('emailVerificationToken');
        const verifiedEmail = await AsyncStorage.getItem('verifiedEmail');
        if (token && verifiedEmail && verifiedEmail === email) {
          setVerificationToken(token);
          setEmailVerified(true);
          // Clear so user doesn't auto-verify if they change email
          await AsyncStorage.removeItem('emailVerificationToken');
          await AsyncStorage.removeItem('verifiedEmail');
        }
      };
      checkVerification();
    }, [email])
  );

  const handleFormSubmit = async () => {
    if (submitting) return;
    // Validate all fields first
    if (!validateFormData()) return;

    // Require email verification before allowing registration
    if (email.trim() && (!emailVerified || !verificationToken)) {
      popup.warning("Verify Email", "Please verify your email, or clear it to register without one.");
      return;
    }
    if (!mobileVerified || !mobileVerificationToken) {
      popup.warning("Verify Mobile", "Please verify your mobile number on WhatsApp before registering.");
      return;
    }

    // Find the selected caste data
    const selectedCasteData = allCaste.find((item: any) => item.casteName === caste || item.casteCode === caste);
    if (!selectedCasteData) {
      popup.warning("No caste selected", "Please select a valid caste.");
      return;
    }

    // Prepare the payload — Father's/Mother's Name+Occupation, Job Place, Current Address,
    // Native Place, Annual Income, and Education in Detail are collected later via the
    // post-signup profile-completion flow instead, so they're simply omitted here.
    const payload = {
      // Trimmed at the boundary too: blur handles the common case, but a member
      // can submit straight from the keyboard without ever blurring the field.
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dob ? dob.toISOString().split("T")[0] : "",
      mobileNumber: mobile,
      education,
      occupation,
      employingIn: employmentStatus,
      gender: selectedGender.toUpperCase() == "MALE" ? "M" : "F",
      casteId: parseInt(selectedCasteData.id),
      // Optional — null whenever the caste has no subcastes (today: always) or the user
      // skipped the field. Never sent as a name; the backend expects the numeric id.
      subcasteId: subcaste
        ? (Number(subcasteOptions.find((opt: { id: string; value: string }) => opt.value === subcaste)?.id) || null)
        : null,
      pin,
      location: selectedCity,
      age,
      email: email.trim() || null,
      verificationToken: email.trim() ? verificationToken : null,
      mobileVerificationToken,
      profileFor: profileFor || null,
    };

    console.log("payload=====================>", payload);

    setSubmitting(true);
    try {
      const response = await userApi.createUser(payload);

      if (response.data?.code === 401 || response.data?.code === 409) {
        // 401 = mobile taken, 409 = email taken (new backend gate) — either way
        // an account with these details exists: send them to sign in.
        popup.error("Already Registered", response.data.message || "An account with these details already exists. Please sign in instead.");
      } else if (response.data?.code === 200) {
        // Store token so subsequent API calls work
        if (response.data.data?.token) {
          await AsyncStorage.setItem('authToken', response.data.data.token);
        }
        if (response.data.data?.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
        }

        // Not dismissable: a backdrop tap used to close the popup WITHOUT running
        // the OK handler, stranding the member on a register form whose account
        // already exists. OK (and Android back) is now the only way out → login.
        // Registration done: drop the local draft and remember the number for the phone-first screen.
        AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
        AsyncStorage.setItem('lastLoginMobile', mobile).catch(() => {});
        const goToLogin = () => {
          popup.hide();
          setTimeout(() => router.replace('/(root)/(main)/LoginScreen'), 100);
        };
        popup.show({
          title: "Account Created",
          description: "Your profile has been submitted for review. You'll be notified once approved.",
          variant: 'success',
          dismissable: false,
          buttons: [{ text: 'Go to Login', variant: 'primary', onPress: goToLogin }],
        });
      } else if (response.data?.code === 400) {
        popup.error("Verification Failed", response.data.message || "Please verify your email and try again.");
      } else {
        popup.error("Error", "Something went wrong. Please try again.");
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      // A TIMEOUT here does not mean the account wasn't created — the server may
      // have finished after the app gave up (the reported "failed but created in
      // background"). Guide the member to try LOGGING IN before re-registering.
      const timedOut = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
      popup.error(
        timedOut ? "Taking Too Long" : "Error",
        timedOut
          ? "The network is slow. Your account may still have been created — please try SIGNING IN with your mobile and PIN before registering again."
          : "Failed to create account. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };



  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' }
  ];

  React.useEffect(() => {
    // Wait one frame so layout is stable before showing Swiper
    requestAnimationFrame(() => {
      setSwiperReady(true);
    });
  }, []);

  if (!swiperReady) return null; // Prevent flicker on first mount

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setOpen(false);
    if (selectedDate) {
      if (selectedDate > new Date()) {
        setTimeout(() => popup.warning("Invalid Date", "Date of birth cannot be a future date."), 300);
        return;
      }

      const computedAge = calculateAge(selectedDate);

      if (computedAge < minAgeForGender(selectedGender)) {
        setTimeout(() => popup.warning("Age Restriction", ageRuleMessage(selectedGender)), 300);
        return;
      }
      setDate(selectedDate);
      setDob(selectedDate);
      const formattedDate = moment(selectedDate).format('DD MMM YYYY');
      setDobDisplay(formattedDate);
    }
  };

  const calculateAge = (dob: any) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();

    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Accepts an optional override so the Android picker (which hands back the picked date
  // directly in its onChange, with no separate "Confirm" step) can pass it straight through
  // instead of relying on `tempDate` state, which wouldn't have committed yet in the same tick.
  const onDateConfirm = (pickedDate?: Date) => {
    const candidate = pickedDate || tempDate;

    // Always close the picker first
    setShowDatePicker(false);

    if (candidate > new Date()) {
      setTimeout(() => popup.warning("Invalid Date", "Date of birth cannot be a future date."), 300);
      return;
    }

    const computedAge = calculateAge(candidate);

    if (computedAge < minAgeForGender(selectedGender)) {
      setTimeout(() => popup.warning("Age Restriction", ageRuleMessage(selectedGender)), 300);
      return;
    }

    setDate(candidate);
    setAge(computedAge.toString());
    setDob(candidate);
    setDobDisplay(moment(candidate).format("DD MMM YYYY"));
  };


  // DOB and Gender sit side by side, so either can be filled first. Choosing Male after a date
  // that made the member 18–20 must not leave a now-invalid date on the form: clear it and say
  // why, rather than letting the member find out only at Create Account.
  const onGenderPick = (value: string) => {
    setSelectedGender(value);
    if (dobDisplay && !meetsMinAge(dob, value)) {
      setDobDisplay('');
      setAge('');
      setTimeout(() => popup.warning("Age Restriction", ageRuleMessage(value)), 300);
    }
  };

  // The picker cannot scroll past the latest valid birth date for the chosen gender (18 until a
  // gender is chosen). Its `value` must never sit beyond `maximumDate`, so clamp it.
  const dobMax = latestDobForGender(selectedGender);
  const clampToMax = (d?: Date | null) => (!d || d > dobMax ? dobMax : d);

  return (
    <NativeBaseProvider>
      <View style={{ flex: 1 }}>
        {/* Full-screen theme gradient — previously there was none at all on this screen (plain
            white), and a separate bug made the step-bar render unprotected above the notch,
            which together read as "a blue sliver above the status bar, white everywhere else."
            Same soft blue gradient already used on explore.tsx for visual consistency. */}
        <LinearGradient
          colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
          locations={[0, 0.3, 0.6, 1.0]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView
          edges={['top', 'left', 'right']}
          style={{ flex: 1 }}
          // Ground truth for "did the OS resize us for the keyboard". useWindowDimensions
          // does NOT reflect the resize under edge-to-edge — measurement is the only
          // reliable signal (same finding as chatscreen.tsx).
          onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
        >
          {/* Persistent header — title/subtitle/Sign-In/stepper live OUTSIDE the Swiper so they
              stay fixed on screen across both pages instead of scrolling away with the fields. */}
          <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
            <TextNB style={styles.headerTitle}>Create your account</TextNB>
            <TextNB style={styles.headerSubtitle}>Find your perfect match — start your journey</TextNB>
            <TouchableOpacity
              onPress={() => router.replace('/(root)/(main)/LoginScreen')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}
            >
              <TextNB style={styles.signInPrompt}>Already have an account?{' '}</TextNB>
              <TextNB style={styles.signInLink}>Sign In</TextNB>
            </TouchableOpacity>

            {/* Real stepper — two labeled nodes joined by a connector, filled/checked as the
                user advances, instead of a plain anonymous progress bar. */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 18 }}>
              {STEP_LABELS.map((label, i) => (
                <React.Fragment key={label}>
                  <View style={{ alignItems: 'center', width: 78 }}>
                    <View style={[
                      styles.stepNode,
                      i < activeStep ? styles.stepNodeDone : i === activeStep ? styles.stepNodeActive : styles.stepNodeUpcoming,
                    ]}>
                      {i < activeStep ? (
                        <Ionicons name="checkmark" size={15} color="#fff" />
                      ) : (
                        <TextNB style={[styles.stepNodeText, i === activeStep && styles.stepNodeTextActive]}>
                          {i + 1}
                        </TextNB>
                      )}
                    </View>
                    <TextNB
                      style={[styles.stepLabel, i <= activeStep && styles.stepLabelActive]}
                      numberOfLines={1}
                    >
                      {label}
                    </TextNB>
                  </View>
                  {i < STEP_LABELS.length - 1 && (
                    <View style={[styles.stepConnector, i < activeStep && styles.stepConnectorDone]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* overflow:hidden — react-native-swiper lays its pages out in a
              horizontal scroller sized at mount; when the keyboard changes the
              container height the pages can visually bleed into each other
              (client: "1st page 2nd page overlapping while keyboard opens").
              Clipping the wrapper makes that structurally impossible. */}
          <View style={{ flex: 1, overflow: 'hidden' }}>
          <Swiper
            showsPagination={false}
            ref={swiperRef}
            loop={false}
            scrollEnabled={false}
            removeClippedSubviews={false}
            onIndexChanged={(index) => setActiveStep(index)}
          >
            {/* Page 1 — Basic Info: identity + contact, ending at Caste/Subcaste */}
            <View style={{ flex: 1 }}>
              <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 15, paddingTop: 10, paddingBottom: kbSpacer }}
                enableOnAndroid={true}
                // Was `Platform.OS === 'ios'` — disabled auto-scroll-to-focused-input on Android
                // entirely (enableOnAndroid alone only resizes the view for the keyboard, it
                // doesn't scroll to the field), so Email's lower position on this page stayed
                // hidden behind the keyboard on Android.
                enableAutomaticScroll={true}
                extraScrollHeight={Platform.OS === 'ios' ? 30 : 20}
                keyboardOpeningTime={0}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                enableResetScrollToCoords={false}
              >
                <View>
                  <CustomModalPicker
                    label="Profile for"
                    placeholder="Who is this profile for?"
                    data={PROFILE_FOR}
                    selected={profileFor}
                    onSelect={(val: string) => setProfileFor(val)}
                  />

                  <HStack space={2} width="100%">
                    {/* First Name Field */}
                    <Box flex={1} style={styles.inputContainer}>
                      <TextNB style={styles.fieldLabel}>First Name</TextNB>
                      <TextInput
                        placeholder="First Name"
                        placeholderTextColor="#999"
                        value={firstName}
                        onChangeText={(t) => {
                          setFirstName(nameInput(t));
                          if (errors.firstName) {
                            setErrors(prev => ({ ...prev, firstName: '' }));
                          }
                        }}
                        onBlur={() => {
                          setFirstName((v) => v.trim());
                          if (!firstName.trim()) {
                            setErrors(prev => ({ ...prev, firstName: 'First name is required' }));
                          } else if (firstName.trim().length < 2) {
                            setErrors(prev => ({ ...prev, firstName: 'First name is too short' }));
                          }
                        }}
                        style={[styles.input, errors.firstName && styles.inputError]}
                      />
                      {errors.firstName ? (
                        <TextNB style={styles.error}>{errors.firstName}</TextNB>
                      ) : (
                        <TextNB style={styles.hiddenError}> </TextNB>
                      )}
                    </Box>

                    {/* Last Name Field */}
                    <Box flex={1} style={styles.inputContainer}>
                      <TextNB style={styles.fieldLabel}>Last Name</TextNB>
                      <TextInput
                        placeholder="Last Name"
                        placeholderTextColor="#999"
                        value={lastName}
                        onChangeText={(t) => {
                          setLastName(nameInput(t));
                          if (errors.lastName) {
                            setErrors(prev => ({ ...prev, lastName: '' }));
                          }
                        }}
                        onBlur={() => {
                          setLastName((v) => v.trim());
                          if (!lastName.trim()) {
                            setErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
                          } else if (lastName.trim().length < 2) {
                            setErrors(prev => ({ ...prev, lastName: 'Last name is too short' }));
                          }
                        }}
                        style={[styles.input, errors.lastName && styles.inputError]}
                      />
                      {errors.lastName ? (
                        <TextNB style={styles.error}>{errors.lastName}</TextNB>
                      ) : (
                        <TextNB style={styles.hiddenError}> </TextNB>
                      )}
                    </Box>
                  </HStack>

                  {/* DOB with Date Picker — back in a shared row with Gender, but with an
                      uneven flex split (DOB narrower, Gender wider) plus tighter pill padding,
                      so Male/Female always fit on one line even once a checkmark icon is added
                      to the selected pill. Equal 50/50 flex previously left Gender too little
                      room and wrapped Male/Female to a second line. */}
                  <HStack space={2} width="100%" marginBottom={3} alignItems="flex-start">
                    <Box flex={1} style={styles.inputContainer}>
                      <TextNB style={styles.fieldLabel}>
                        Date of Birth <TextNB style={{ color: 'red' }}>*</TextNB>
                      </TextNB>

                      {/* Custom Styled Date Input */}
                      <TouchableOpacity
                        onPress={() => { setTempDate(clampToMax(date)); setShowDatePicker(true); }}
                        style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1 }]}
                      >
                        <TextNB style={{ color: '#000', fontSize: 14, fontFamily: 'Rubik-Regular' }}>
                          {date ? dobDisplay : "Select Date"}
                        </TextNB>

                        <Ionicons name="calendar" size={18} color="#1F7FE5" />
                      </TouchableOpacity>

                      {/* Android has no inline "spinner" mode — mounting <RNDateTimePicker> always
                          pops the OS's own native dialog, which auto-dismisses itself as soon as
                          the user picks a value or cancels. Wrapping it in our own <Modal> + a
                          hand-built "Confirm" button (the iOS pattern below) double-stacked two
                          dialogs on Android: the native one closed on selection, but our Modal
                          stayed mounted underneath showing an effectively blank card, and tapping
                          its leftover Confirm button while the picker was still being re-rendered
                          is what looked like the picker "reopening". Fix: on Android, render the
                          picker directly (no wrapping Modal) only while `showDatePicker` is true,
                          and resolve everything from onChange's own `event.type` — there's no
                          separate confirm step, matching how every native Android date field works. */}
                      {Platform.OS === 'android' && showDatePicker && (
                        <RNDateTimePicker
                          value={clampToMax(date)}
                          mode="date"
                          display="default"
                          maximumDate={dobMax}
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (event.type === 'set' && selectedDate) {
                              onDateConfirm(selectedDate);
                            }
                          }}
                        />
                      )}

                      {/* iOS: no native dialog — the spinner renders inline, so it needs our own
                          Modal + Confirm button to commit the picked value. */}
                      {Platform.OS === 'ios' && (
                        <Modal
                          visible={showDatePicker}
                          transparent
                          animationType="fade"
                          onRequestClose={() => setShowDatePicker(false)}
                        >
                          <View
                            style={{
                              flex: 1,
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor: "rgba(0,0,0,0.5)",
                            }}
                          >
                            {/* Card wrapper */}
                            <View
                              style={{
                                backgroundColor: "#fff",
                                borderRadius: 12,
                                width: "85%",
                                overflow: "hidden", // important for spinner visibility
                              }}
                            >
                              {/* Picker container without backgroundColor */}
                              <View
                                style={{
                                  padding: 0,
                                  alignItems: "center",
                                  height: 250,
                                  justifyContent: "center",
                                }}
                              >
                                <RNDateTimePicker
                                  value={clampToMax(date)}
                                  mode="date"
                                  display="spinner"
                                  textColor="#0f1724"
                                  themeVariant="dark"
                                  maximumDate={dobMax}
                                  style={{ backgroundColor: '#fff' }}
                                  onChange={(event, selectedDate) => {
                                    if (selectedDate) {
                                      setTempDate(selectedDate);   // only store temp value
                                    }
                                  }}
                                />
                              </View>

                              {/* Footer button */}
                              <View
                                style={{
                                  backgroundColor: "#fff",
                                  paddingVertical: 10,
                                  alignItems: "center",
                                }}
                              >
                                <TouchableOpacity
                                  onPress={() => onDateConfirm()}
                                  style={{
                                    backgroundColor: "#1F7FE5",
                                    paddingVertical: 10,
                                    paddingHorizontal: 15,
                                    borderRadius: 8,
                                  }}
                                >
                                  <TextNB style={{ color: '#fff', fontFamily: 'Rubik-Bold' }}>Confirm</TextNB>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </Modal>
                      )}
                    </Box>

                    {/* Gender — wider flex share than DOB since it needs to fit two pills. */}
                    <Box flex={1.35} style={styles.inputContainer}>
                      <TextNB style={styles.fieldLabel}>Gender</TextNB>
                      {/* Plain TouchableOpacity pills instead of NativeBase Checkbox — NativeBase's
                          styled-system recomputes each Checkbox's theme/style object on every
                          parent re-render, which is what made selecting a gender feel laggy before
                          the tap visibly registered. Also matches the ring-select pill pattern
                          already used for single-select options elsewhere in the app (SearchTabs). */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {genderOptions.map((option) => {
                          const selected = selectedGender === option.value;
                          return (
                            <TouchableOpacity
                              key={option.value}
                              onPress={() => onGenderPick(option.value)}
                              activeOpacity={0.8}
                              style={[styles.optionPillCompact, selected && styles.optionPillSelected]}
                            >
                              {selected && <Ionicons name="checkmark" size={13} color="#1F7FE5" style={{ marginRight: 3 }} />}
                              <TextNB style={[styles.optionPillText, selected && styles.optionPillTextSelected]}>
                                {option.label}
                              </TextNB>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </Box>
                  </HStack>

                  {/* Age + Email — moved directly under the DOB/Gender row on
                      2026-08-23. It used to sit below Mobile near the bottom of the
                      page, where tapping Email on Android opened the keyboard over the
                      field itself. Higher up the form there is far less to scroll past,
                      so the focused input stays visible. Age is auto-derived from DOB,
                      so it also now sits next to the field that produces it. */}
                  {/* Age and Email */}
                  <HStack space={2} width="100%" alignItems="flex-start">
                    {/* Age Field */}
                    <Box flex={0.3} style={styles.inputContainer}>
                      <View style={{ height: 18, justifyContent: 'center', marginBottom: 6 }}>
                        <TextNB style={[styles.fieldLabel, { marginBottom: 0 }]}>Age</TextNB>
                      </View>
                      <TextInput
                        placeholder=""
                        keyboardType="numeric"
                        maxLength={3}
                        value={age}
                        onChangeText={setAge}
                        style={[styles.input, { backgroundColor: "#f1f1f1" }]}
                        editable={false}
                      />
                      <TextNB style={styles.hiddenError}> </TextNB>
                    </Box>

                    {/* Email Field */}
                    <Box flex={0.7} style={styles.inputContainer}>
                      {/* Label + Verify/Change share one row, both plain text (no button chrome) so
                          this row's height matches Age's plain-label row exactly — the two inputs
                          now start at the same Y instead of Email sitting lower because its old
                          button-styled pill was taller than a line of text. */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 18, marginBottom: 6 }}>
                        <TextNB style={[styles.fieldLabel, { marginBottom: 0 }]}>Email (optional)</TextNB>
                        {emailVerified ? (
                          <TouchableOpacity
                            onPress={() => {
                              setEmailVerified(false);
                              setVerificationToken(null);
                            }}
                          >
                            <TextNB style={{ color: '#f59e0b', fontSize: 12.5, fontFamily: 'Rubik-Bold' }}>Change</TextNB>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={handleVerifyEmail}
                            disabled={!isValidEmail(email) || sendingEmailOtp}
                          >
                            {sendingEmailOtp ? (
                              <ActivityIndicator size="small" color="#1F7FE5" />
                            ) : (
                              <TextNB style={{ color: !isValidEmail(email) ? '#9ca3af' : '#1F7FE5', fontSize: 12.5, fontFamily: 'Rubik-Bold' }}>
                                Verify
                              </TextNB>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          placeholder="Enter Email"
                          placeholderTextColor="#999"
                          value={email}
                          onChangeText={(t) => {
                            setEmail(t);
                            if (errors.email) {
                              setErrors(prev => ({ ...prev, email: '' }));
                            }
                          }}
                          onBlur={() => {
                            if (email && !isValidEmail(email)) {
                              setErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
                            }
                          }}
                          editable={!emailVerified}
                          style={[
                            styles.input,
                            errors.email && styles.inputError,
                            emailVerified && { backgroundColor: '#f0fdf4', borderColor: '#86efac', paddingRight: 36 },
                          ]}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                        {emailVerified && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#16a34a"
                            style={{ position: 'absolute', right: 10, top: 10 }}
                          />
                        )}
                      </View>
                      {errors.email ? (
                        <TextNB style={styles.error}>{errors.email}</TextNB>
                      ) : (
                        <TextNB style={styles.hiddenError}> </TextNB>
                      )}
                    </Box>
                  </HStack>

                  {/* Mobile Number - 10 digits only, verified on WhatsApp like the email */}
                  <Box style={styles.inputContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 18, marginBottom: 6 }}>
                      <TextNB style={[styles.fieldLabel, { marginBottom: 0 }]}>Mobile Number</TextNB>
                      {mobileVerified ? (
                        <TouchableOpacity
                          onPress={() => {
                            setMobileVerified(false);
                            setMobileVerificationToken(null);
                          }}
                        >
                          <TextNB style={{ color: '#f59e0b', fontSize: 12.5, fontFamily: 'Rubik-Bold' }}>Change</TextNB>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={handleVerifyMobile}
                          disabled={!isValidMobile(mobile) || sendingMobileOtp}
                        >
                          {sendingMobileOtp ? (
                            <ActivityIndicator size="small" color="#1F7FE5" />
                          ) : (
                            <TextNB style={{ color: !isValidMobile(mobile) ? '#9ca3af' : '#1F7FE5', fontSize: 12.5, fontFamily: 'Rubik-Bold' }}>
                              Verify on WhatsApp
                            </TextNB>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={{ position: 'relative' }}>
                    <TextInput
                      placeholder="Enter Mobile Number"
                      placeholderTextColor="#999"
                      value={mobile}
                      editable={!mobileVerified}
                      onChangeText={(t) => {
                        setMobile(onlyNumbers(t));
                        if (errors.mobile) {
                          setErrors(prev => ({ ...prev, mobile: '' }));
                        }
                      }}
                      onBlur={() => {
                        if (!mobile) {
                          setErrors(prev => ({ ...prev, mobile: 'Mobile number is required' }));
                        } else if (!isValidMobile(mobile)) {
                          setErrors(prev => ({ ...prev, mobile: mobile.length !== 10
                            ? 'Mobile number must be 10 digits'
                            : 'Enter a valid mobile number' }));
                        }
                      }}
                      style={[
                        styles.input,
                        errors.mobile && styles.inputError,
                        mobileVerified && { backgroundColor: '#f0fdf4', borderColor: '#86efac', paddingRight: 36 },
                      ]}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                    {mobileVerified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#16a34a"
                        style={{ position: 'absolute', right: 10, top: 10 }}
                      />
                    )}
                    </View>
                    {errors.mobile ? (
                      <TextNB style={styles.error}>{errors.mobile}</TextNB>
                    ) : (
                      <TextNB style={styles.fieldHint}>
                        {mobileVerified
                          ? 'Verified on WhatsApp.'
                          : 'Your WhatsApp number — we send a code there to verify it, and our team calls it to verify your profile.'}
                      </TextNB>
                    )}
                  </Box>

                  {/* Caste */}
                  <CustomModalPicker
                    label="Caste"
                    placeholder="Select Caste"
                    data={casteList}
                    selected={caste}
                    onSelect={(val) => {
                      setCaste(val);
                      // A subcaste belongs to exactly one caste — a leftover selection from the
                      // previous caste would be invalid (and the backend rejects it).
                      setSubcaste('');
                    }}
                  />

                  {/* Subcaste — dependent on Caste and REQUIRED. Always visible so the form's
                      shape doesn't shift as the user fills it in; disabled (greyed, non-tappable)
                      until a caste is chosen. Requiring it is only safe because every caste has an
                      "Others" option for members who don't know theirs — see the seed data. */}
                  <CustomModalPicker
                    label="Subcaste"
                    placeholder="Select Subcaste"
                    data={subcasteOptions}
                    selected={subcaste}
                    onSelect={(val) => setSubcaste(val)}
                    disabled={subcasteOptions.length === 0}
                    disabledHint={
                      !caste
                        ? 'Select a caste first'
                        : 'No subcastes for this caste'
                    }
                  />



                </View>
              </KeyboardAwareScrollView>

              {/* Single Next button — this is the first page, nothing to go Back to. */}
              <View
                onLayout={(e) => setNavRowHeight(e.nativeEvent.layout.height)}
                style={{ alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 12, paddingBottom: navBottomPad }}
              >
                <ButtonNB style={styles.navPrimaryButton} onPress={() => swiperRef.current?.scrollBy(1)}>
                  <HStack space={2} alignItems="center">
                    <TextNB style={{ color: '#fff', fontSize: 14, fontFamily: 'Rubik-Bold' }}>Next</TextNB>
                    <ArrowRight size={18} color="#fff" />
                  </HStack>
                </ButtonNB>
              </View>
            </View>

            {/* Page 2 — Account Setup: Education + Occupation through PIN. "What are you passionate about"
                (interests) was removed from signup entirely — it already has a full working
                edit path post-signup (Profile tab → Interests & Hobbies), so nothing new needed
                there; requiring it before account creation was unnecessary friction. */}
            <View style={{ flex: 1 }}>
              <KeyboardAwareScrollView
                style={{ flex: 1 }}
                // ⚠️ paddingBottom is load-bearing, not cosmetic. PIN/Confirm PIN are the
                // LAST elements in this scroll view and the footer CTA sits OUTSIDE it, so
                // with paddingBottom:0 there was nothing below them to scroll into — a
                // ScrollView cannot scroll past its own content end, so the fields stayed
                // under the keyboard however aggressive enableAutomaticScroll was. The
                // spacer gives the scroll somewhere to go. Same root cause as the chat
                // input bug (section 18, 2026-08-12): under edge-to-edge the app must make
                // room itself, and it can only do that if the room exists.
                contentContainerStyle={{ padding: 15, paddingTop: 10, paddingBottom: kbSpacer }}
                enableOnAndroid={true}
                // Was `Platform.OS === 'ios'` — disabled auto-scroll-to-focused-input on
                // Android entirely, so PIN/Confirm PIN (near the bottom of this page) stayed
                // hidden behind the keyboard on Android instead of scrolling into view.
                enableAutomaticScroll={true}
                extraScrollHeight={Platform.OS === 'ios' ? -50 : 45}
                keyboardOpeningTime={0}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                enableResetScrollToCoords={false}
              >
                <View>
                  {/* Education — moved here from Page 1 so Page 1 ends at Caste/Subcaste
                      (identity + contact) and Page 2 carries the "what you do" fields. */}
                  <CustomModalPicker
                    label="Education"
                    placeholder="Select Your Education"
                    data={educationOptions}
                    selected={education}
                    onSelect={(val) => setEducation(val)}
                  />

                  {/* Occupation Field */}
                  <Box style={styles.inputContainer}>
                    <TextNB style={styles.fieldLabel}>Occupation</TextNB>
                    <TextInput
                      placeholder="Enter Your Occupation"
                      placeholderTextColor="#999"
                      value={occupation}
                      onChangeText={(t) => {
                        setOccupation(onlyAlphabets(t));
                        if (errors.occupation) {
                          setErrors(prev => ({ ...prev, occupation: '' }));
                        }
                      }}
                      onBlur={() => {
                        if (!occupation.trim()) {
                          setErrors(prev => ({
                            ...prev,
                            occupation: 'Occupation is required'
                          }));
                        }
                      }}
                      style={[styles.input, errors.occupation && styles.inputError]}
                    />
                    {errors.occupation ? (
                      <TextNB style={styles.error}>{errors.occupation}</TextNB>
                    ) : (
                      <TextNB style={styles.hiddenError}> </TextNB>
                    )}
                  </Box>

                  {/* Employing In */}
                  <TextNB style={[styles.fieldLabel, { marginBottom: 8 }]}>Employing In</TextNB>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {employmentOptions.map((option) => {
                      const selected = employmentStatus === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => setEmploymentStatus(option.value)}
                          activeOpacity={0.8}
                          style={[styles.optionPill, selected && styles.optionPillSelected]}
                        >
                          {selected && <Ionicons name="checkmark" size={14} color="#1F7FE5" style={{ marginRight: 4 }} />}
                          <TextNB style={[styles.optionPillText, selected && styles.optionPillTextSelected]}>
                            {option.label}
                          </TextNB>
                        </TouchableOpacity>
                      );
                    })}
                  </View>


                  {/* District dropdown */}
                  <CustomModalPicker
                    label="District"
                    placeholder="Select Your District"
                    data={districtOptions}
                    selected={selectedCity}
                    onSelect={(val) => setSelectedCity(val)}
                  />

                  {/* PIN and Confirm PIN */}
                  <HStack space={2} width="100%">
                    {/* PIN */}
                    <Box flex={0.5} style={styles.inputContainer}>
                      <TextNB style={styles.fieldLabel}>PIN</TextNB>
                      <View style={styles.pinRow}>
                      <TextInput
                        placeholder="Enter 4-digit PIN"
                        placeholderTextColor="#999"
                        value={pin}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry={!showPin}
                        onChangeText={(t) => {
                          setPin(onlyNumbers(t));
                          if (errors.pin) {
                            setErrors(prev => ({ ...prev, pin: '' }));
                          }
                        }}
                        onBlur={() => {
                          if (!pin) {
                            setErrors(prev => ({
                              ...prev,
                              pin: 'PIN is required'
                            }));
                          } else if (pin.length !== 4) {
                            setErrors(prev => ({
                              ...prev,
                              pin: 'PIN must be 4 digits'
                            }));
                          }
                        }}
                        style={[styles.input, styles.pinInput, errors.pin && styles.inputError]}
                      />
                      <TouchableOpacity
                        style={styles.eyeBtn}
                        onPress={() => setShowPin(v => !v)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name={showPin ? 'eye-outline' : 'eye-off-outline'} size={19} color="#94a3b8" />
                      </TouchableOpacity>
                      </View>
                      {errors.pin ? (
                        <TextNB style={styles.error}>{errors.pin}</TextNB>
                      ) : (
                        <TextNB style={styles.hiddenError}> </TextNB>
                      )}
                    </Box>

                    {/* Confirm PIN */}
                    <Box flex={0.5} style={styles.inputContainer}>
                      <TextNB style={styles.fieldLabel}>Confirm PIN</TextNB>
                      <View style={styles.pinRow}>
                      <TextInput
                        placeholder="Confirm 4-digit PIN"
                        placeholderTextColor="#999"
                        value={confirmPin}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry={!showConfirmPin}
                        onChangeText={(t) => {
                          setConfirmPin(onlyNumbers(t));
                          if (errors.confirmPin) {
                            setErrors(prev => ({ ...prev, confirmPin: '' }));
                          }
                        }}
                        onBlur={() => {
                          if (!confirmPin) {
                            setErrors(prev => ({
                              ...prev,
                              confirmPin: 'Please confirm your PIN'
                            }));
                          } else if (confirmPin !== pin) {
                            setErrors(prev => ({
                              ...prev,
                              confirmPin: 'PINs do not match'
                            }));
                          }
                        }}
                        style={[styles.input, styles.pinInput, errors.confirmPin && styles.inputError]}
                      />
                      <TouchableOpacity
                        style={styles.eyeBtn}
                        onPress={() => setShowConfirmPin(v => !v)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name={showConfirmPin ? 'eye-outline' : 'eye-off-outline'} size={19} color="#94a3b8" />
                      </TouchableOpacity>
                      </View>
                      {errors.confirmPin ? (
                        <TextNB style={styles.error}>{errors.confirmPin}</TextNB>
                      ) : (
                        <TextNB style={styles.hiddenError}> </TextNB>
                      )}
                    </Box>
                  </HStack>
                </View>
              </KeyboardAwareScrollView>

              {/* Fresh footer design for the final step — a compact circular Back button beside
                  a full-width gradient "Create Account" CTA, distinct from page 1's simple
                  right-aligned Next pill (both pages used to share the same two-30%-pill row). */}
              <View
                onLayout={(e) => setNavRowHeight(e.nativeEvent.layout.height)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: navBottomPad }}
              >
                <TouchableOpacity
                  onPress={() => swiperRef.current?.scrollBy(-1)}
                  activeOpacity={0.8}
                  style={styles.circleBackButton}
                >
                  <ArrowLeft size={20} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFormSubmit()}
                  activeOpacity={0.88}
                  disabled={!isFormComplete || submitting}
                  style={{ flex: 1, opacity: isFormComplete ? 1 : 0.5 }}
                >
                  <LinearGradient
                    colors={['#1F7FE5', '#1862b8']}
                    style={styles.createAccountButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <TextNB style={styles.createAccountText}>Create Account</TextNB>
                        <ArrowRight size={18} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Swiper>
          </View>
        </SafeAreaView>
      </View>
    </NativeBaseProvider>
  );
}


const styles = StyleSheet.create({
  // Helper line under a field (e.g. Mobile: "our team will call to verify").
  // Sits in the same slot the error text uses, so showing it never shifts layout.
  fieldHint: {
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
    color: '#64748b',
    marginTop: 3,
    lineHeight: 14,
  },
  input: {
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    borderRadius: 12,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#333',
    shadowColor: '#1F7FE5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Eye overlays the input's right edge; paddingRight keeps the 4 digits and
  // the placeholder from ever running underneath it.
  pinInput: {
    flex: 1,
    paddingRight: 36,
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 2,
  },
  // Persistent header text — NativeBase's <Text> prop-form `fontFamily="Rubik-Bold"` combined
  // with a `fontWeight` prop collides on Android (NativeBase issue #3811): since our custom
  // font names aren't registered NativeBase theme tokens, the resolver never strips the
  // auto-injected fontWeight, and Android falls back to a system font with synthetic bold,
  // silently ignoring the real Rubik file. Passing fontFamily via `style` (not as a bare prop)
  // sidesteps that resolution path entirely — matches how the rest of the app already does it.
  // Matches profile.tsx / index.tsx's type scale: Rubik-ExtraBold is reserved app-wide for the
  // brand wordmark only (VVMWelcomeHeader) — every other "biggest heading" (profile hero name,
  // section titles) uses Rubik-Bold instead.
  headerTitle: {
    color: '#0f1724',
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 5,
    fontFamily: 'Rubik-Regular',
  },
  signInPrompt: {
    color: '#6b7280',
    fontSize: 12.5,
    fontFamily: 'Rubik-Medium',
  },
  signInLink: {
    color: '#1F7FE5',
    fontSize: 12.5,
    fontFamily: 'Rubik-Bold',
  },
  // Matches profile.tsx's field-label tier (detailLabel: 10 / Rubik-Medium / uppercase) instead
  // of the previous 13 / Rubik-Bold, which was its own one-off convention not used anywhere
  // else in the app.
  // Every field label — regular text inputs and CustomModalPicker dropdowns alike — shares
  // this one style: small, uppercase, black, bold. Placeholder/value text stays normal-case
  // and un-bolded (see `input` and CustomModalPicker's selected-value text) so labels read as
  // clearly distinct from what the user actually types or picks.
  fieldLabel: {
    color: '#0f1724',
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'Rubik-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Stepper
  stepNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepNodeDone: {
    backgroundColor: '#1F7FE5',
    borderColor: '#1F7FE5',
  },
  stepNodeActive: {
    backgroundColor: '#1F7FE5',
    borderColor: '#1F7FE5',
  },
  stepNodeUpcoming: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
  },
  stepNodeText: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
    color: '#94a3b8',
  },
  stepNodeTextActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 10.5,
    fontFamily: 'Rubik-Medium',
    color: '#94a3b8',
    marginTop: 4,
  },
  stepLabelActive: {
    color: '#1F7FE5',
    fontFamily: 'Rubik-Bold',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#cbd5e1',
    marginTop: 13,
    marginHorizontal: -6,
  },
  stepConnectorDone: {
    backgroundColor: '#1F7FE5',
  },
  // Page 1's Next button (solid primary pill)
  navPrimaryButton: {
    width: '32%',
    borderRadius: 24,
    backgroundColor: '#1F7FE5',
    paddingVertical: 12,
    shadowColor: '#1F7FE5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  // Page 2's fresh footer — circular ghost Back + full-width gradient Create Account
  circleBackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 26,
    shadowColor: '#1F7FE5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createAccountText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  // Tighter padding variant used only for Gender, since it shares a row with DOB (Employing
  // In gets the full row width elsewhere and can afford the roomier `optionPill` padding).
  // Matches `input`'s fixed height (44) so the Gender pills sit exactly as tall as DOB's date
  // box in the same row — previously this had no explicit height, so its content-driven size
  // (~34px) looked visibly shorter than DOB's box next to it.
  optionPillCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  optionPillSelected: {
    borderColor: '#1F7FE5',
    backgroundColor: '#eaf2fc',
  },
  optionPillText: {
    fontSize: 13.5,
    fontFamily: 'Rubik-Medium',
    color: '#475569',
  },
  optionPillTextSelected: {
    color: '#1F7FE5',
    fontFamily: 'Rubik-Bold',
  },
  inputBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#ffffff",
    height: 44,
    shadowColor: "#1F7FE5",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  // Dependent fields (Subcaste before a Caste is picked) stay visible but read as inert —
  // flat grey fill, no shadow, muted border.
  inputBoxDisabled: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    shadowOpacity: 0,
    elevation: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: "80%",
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: 'Rubik-Bold',
    fontSize: 16,
    color: "#0f1724",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#1F7FE5",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  option: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  inputError: {
    borderColor: '#dc2626',
    borderWidth: 1.5,
  },
  error: {
    color: 'red',
    fontSize: 10,
    height: 14,  // Fixed height for error message
    textAlign: 'left',
    paddingLeft: 2,
    marginTop: 0,
  },
  hiddenError: {
    height: 14,  // Same as error height
    opacity: 0,  // Make it invisible
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 10,
  },
});
