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
  ActivityIndicator
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Swiper from "react-native-swiper";
import { Box, Input, NativeBaseProvider, Text as TextNB, Button as ButtonNB, HStack, FlatList } from "native-base";
import { SafeAreaView } from "react-native-safe-area-context";
import moment from 'moment'; // Import the moment library for date formatting
import { SelectList } from 'react-native-dropdown-select-list'
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';
import { AntDesign } from '@expo/vector-icons';
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { loadMasterData } from "../services/masterService";
import { useMasterData } from "../contexts/MasterDataContext";
import { usePopup } from "../contexts/PopupContext";
type GetstartProps = {
  onStart: () => void;
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

const STEP_LABELS = ['Basic Info', 'Account Setup'];

export default function SignUp({ onStart }: GetstartProps) {
  const popup = usePopup();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [swiperReady, setSwiperReady] = useState(false);
  // Drives the stepper header — the form has no other sense of "where am I" otherwise.
  const [activeStep, setActiveStep] = useState(0);
  const [dob, setDob] = useState(new Date());
  const [dobDisplay, setDobDisplay] = useState("");
  const [mobile, setMobile] = useState("");
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [caste, setCaste] = useState('');
  const { state: masterData, setMasterData } = useMasterData();
  const [educationOptions, setEducationOptions] = useState<Array<{ id: string, value: string }>>([]);
  const [incomeOptions, setIncomeOptions] = useState<Array<{ id: string, value: string, label: string, numericValue: string }>>([]);
  const [employmentOptions, setEmploymentOptions] = useState<Array<{ id: string, value: string, label: string }>>([]);
  const [districtOptions, setDistrictOptions] = useState<Array<{ id: string, value: string }>>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [allCaste, setAllCaste] = useState<any[]>([]);
  const [selectedGender, setSelectedGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [casteList, setCasteList] = useState<CasteOption[]>([]);
  const [employmentStatus, setEmploymentStatus] = useState('');
  // employmentOptions is now managed by the masterData effect
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const swiperRef = useRef<Swiper>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date()); // Spinner value
  const onlyAlphabets = (text: string) => text.replace(/[^A-Za-z\s]/g, '');
  const onlyNumbers = (text: string) => text.replace(/[^0-9]/g, '');
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

  const validateFormData = () => {
    const fieldLabels: Record<string, string> = {
      firstName: 'First Name',
      lastName: 'Last Name',
      dob: 'Date of Birth',
      gender: 'Gender',
      caste: 'Caste',
      mobile: 'Mobile Number',
      age: 'Age',
      email: 'Email',
      education: 'Education',
      occupation: 'Occupation',
      employmentStatus: 'Employment Status',
      selectedCity: 'City / District',
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
      mobile,
      age,
      email,
      education,
      occupation,
      employmentStatus,
      selectedCity,
      pin,
      confirmPin,
    };

    const requiredFields = Object.keys(formData);

    const missingFields = requiredFields
      .filter(
        (field) =>
          formData[field] === null ||
          formData[field] === undefined ||
          formData[field].toString().trim() === ""
      )
      .map(field => fieldLabels[field] || field); // Map field names to labels

    // Add email verification to the missing list if not verified
    if (!emailVerified) {
      missingFields.push('Email Verification');
    }

    if (missingFields.length > 0) {
      popup.warning(
        "Missing Fields",
        `Please fill in the following required fields:\n\n• ${missingFields.join("\n• ")}`
      );
      return false;
    }

    if (formData.pin !== formData.confirmPin) {
      popup.error("Validation Error", "PIN and Confirm PIN do not match!");
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (!Object.keys(masterData || {}).length) {
      loadMasterData(setMasterData);
    }
  }, []);

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
      console.log('sendAuthOtp payload →', { email, purpose: 'registration', firstName });
      const res = await userApi.sendAuthOtp({ email, purpose: 'registration', firstName: firstName || undefined });
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
    // Validate all fields first
    if (!validateFormData()) return;

    // Require email verification before allowing registration
    if (!emailVerified || !verificationToken) {
      popup.warning("Verify Email", "Please verify your email before registering.");
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
      firstName,
      lastName,
      dateOfBirth: dob ? dob.toISOString().split("T")[0] : "",
      mobileNumber: mobile,
      education,
      occupation,
      employingIn: employmentStatus,
      gender: selectedGender.toUpperCase() == "MALE" ? "M" : "F",
      casteId: parseInt(selectedCasteData.id),
      pin,
      location: selectedCity,
      age,
      email,
      verificationToken,
    };

    console.log("payload=====================>", payload);

    try {
      const response = await userApi.createUser(payload);

      if (response.data?.code === 401) {
        popup.error("Registration Failed", "This mobile number is already registered.");
      } else if (response.data?.code === 200) {
        // Store token so subsequent API calls work
        if (response.data.data?.token) {
          await AsyncStorage.setItem('authToken', response.data.data.token);
        }
        if (response.data.data?.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
        }

        popup.success(
          "Account Created",
          "Your profile has been submitted for review. You'll be notified once approved.",
          () => router.replace('/(root)/(main)/LoginScreen')
        );
      } else if (response.data?.code === 400) {
        popup.error("Verification Failed", response.data.message || "Please verify your email and try again.");
      } else {
        popup.error("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      popup.error("Error", "Failed to create account. Please try again.");
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

      if (computedAge < 18) {
        setTimeout(() => popup.warning("Age Restriction", "You must be at least 18 years old to register."), 300);
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

    if (computedAge < 18) {
      setTimeout(() => popup.warning("Age Restriction", "You must be at least 18 years old to register."), 300);
      return;
    }

    setDate(candidate);
    setAge(computedAge.toString());
    setDob(candidate);
    setDobDisplay(moment(candidate).format("DD MMM YYYY"));
  };

  interface CustomModalPickerProps {
    label: string;
    placeholder: string;
    data: { id: string | number; value: string }[];
    selected: string;
    onSelect: (val: string) => void;
  }

  const CustomModalPicker: React.FC<CustomModalPickerProps> = ({
    label,
    placeholder,
    data,
    selected,
    onSelect,
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
          style={styles.inputBox}
          onPress={() => setVisible(true)}
        >
          <TextNB style={{ color: selected ? "#000" : "#999", fontSize: 14, fontFamily: 'Rubik-Regular' }}>
            {selected || placeholder}
          </TextNB>
          <Ionicons name="chevron-down" size={16} color="#0f1724" />
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
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
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

          <Swiper
            showsPagination={false}
            ref={swiperRef}
            loop={false}
            scrollEnabled={false}
            removeClippedSubviews={false}
            onIndexChanged={(index) => setActiveStep(index)}
          >
            {/* Page 1 — Basic Info: identity + contact, up through Education */}
            <View style={{ flex: 1 }}>
              <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 15, paddingTop: 10, paddingBottom: 0 }}
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
                  <HStack space={2} width="100%">
                    {/* First Name Field */}
                    <Box flex={1} style={styles.inputContainer}>
                      <TextNB style={styles.fieldLabel}>First Name</TextNB>
                      <TextInput
                        placeholder="First Name"
                        placeholderTextColor="#999"
                        value={firstName}
                        onChangeText={(t) => {
                          setFirstName(onlyAlphabets(t));
                          if (errors.firstName) {
                            setErrors(prev => ({ ...prev, firstName: '' }));
                          }
                        }}
                        onBlur={() => {
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
                          setLastName(onlyAlphabets(t));
                          if (errors.lastName) {
                            setErrors(prev => ({ ...prev, lastName: '' }));
                          }
                        }}
                        onBlur={() => {
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
                        onPress={() => setShowDatePicker(true)}
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
                          value={date || new Date()}
                          mode="date"
                          display="default"
                          maximumDate={new Date()}
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
                                  value={date || new Date()}
                                  mode="date"
                                  display="spinner"
                                  textColor="#0f1724"
                                  themeVariant="dark"
                                  maximumDate={new Date()}
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
                              onPress={() => setSelectedGender(option.value)}
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

                  {/* Caste */}
                  <CustomModalPicker
                    label="Caste"
                    placeholder="Select Caste"
                    data={casteList}
                    selected={caste}
                    onSelect={(val) => setCaste(val)}
                  />

                  {/* Mobile Number - 10 digits only */}
                  <Box style={styles.inputContainer}>
                    <TextNB style={styles.fieldLabel}>Mobile Number</TextNB>
                    <TextInput
                      placeholder="Enter Mobile Number"
                      placeholderTextColor="#999"
                      value={mobile}
                      onChangeText={(t) => {
                        setMobile(onlyNumbers(t));
                        if (errors.mobile) {
                          setErrors(prev => ({ ...prev, mobile: '' }));
                        }
                      }}
                      onBlur={() => {
                        if (!mobile) {
                          setErrors(prev => ({ ...prev, mobile: 'Mobile number is required' }));
                        } else if (mobile.length !== 10) {
                          setErrors(prev => ({ ...prev, mobile: 'Mobile number must be 10 digits' }));
                        }
                      }}
                      style={[styles.input, errors.mobile && styles.inputError]}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                    {errors.mobile ? (
                      <TextNB style={styles.error}>{errors.mobile}</TextNB>
                    ) : (
                      <TextNB style={styles.hiddenError}> </TextNB>
                    )}
                  </Box>

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
                        <TextNB style={[styles.fieldLabel, { marginBottom: 0 }]}>Email</TextNB>
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
                            if (!email) {
                              setErrors(prev => ({ ...prev, email: 'Email is required' }));
                            } else if (!isValidEmail(email)) {
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

                  {/* Education */}
                  <CustomModalPicker
                    label="Education"
                    placeholder="Select Your Education"
                    data={educationOptions}
                    selected={education}
                    onSelect={(val) => setEducation(val)}
                  />
                </View>
              </KeyboardAwareScrollView>

              {/* Single Next button — this is the first page, nothing to go Back to. */}
              <View style={{ alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
                <ButtonNB style={styles.navPrimaryButton} onPress={() => swiperRef.current?.scrollBy(1)}>
                  <HStack space={2} alignItems="center">
                    <TextNB style={{ color: '#fff', fontSize: 14, fontFamily: 'Rubik-Bold' }}>Next</TextNB>
                    <ArrowRight size={18} color="#fff" />
                  </HStack>
                </ButtonNB>
              </View>
            </View>

            {/* Page 2 — Account Setup: Occupation through PIN. "What are you passionate about"
                (interests) was removed from signup entirely — it already has a full working
                edit path post-signup (Profile tab → Interests & Hobbies), so nothing new needed
                there; requiring it before account creation was unnecessary friction. */}
            <View style={{ flex: 1 }}>
              <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 15, paddingTop: 10, paddingBottom: 0 }}
                enableOnAndroid={true}
                // Was `Platform.OS === 'ios'` — disabled auto-scroll-to-focused-input on
                // Android entirely, so PIN/Confirm PIN (near the bottom of this page) stayed
                // hidden behind the keyboard on Android instead of scrolling into view.
                enableAutomaticScroll={true}
                extraScrollHeight={Platform.OS === 'ios' ? -50 : 20}
                keyboardOpeningTime={0}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                enableResetScrollToCoords={false}
              >
                <View>
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


                  {/* City / District dropdown */}
                  <CustomModalPicker
                    label="City / District"
                    placeholder="Select Your City"
                    data={districtOptions}
                    selected={selectedCity}
                    onSelect={(val) => setSelectedCity(val)}
                  />

                  {/* PIN and Confirm PIN */}
                  <HStack space={2} width="100%">
                    {/* PIN */}
                    <Box flex={0.5} style={styles.inputContainer}>
                      <TextNB style={styles.fieldLabel}>PIN</TextNB>
                      <TextInput
                        placeholder="Enter 4-digit PIN"
                        placeholderTextColor="#999"
                        value={pin}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
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
                        style={[styles.input, errors.pin && styles.inputError]}
                      />
                      {errors.pin ? (
                        <TextNB style={styles.error}>{errors.pin}</TextNB>
                      ) : (
                        <TextNB style={styles.hiddenError}> </TextNB>
                      )}
                    </Box>

                    {/* Confirm PIN */}
                    <Box flex={0.5} style={styles.inputContainer}>
                      <TextNB style={styles.fieldLabel}>Confirm PIN</TextNB>
                      <TextInput
                        placeholder="Confirm 4-digit PIN"
                        placeholderTextColor="#999"
                        value={confirmPin}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
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
                        style={[styles.input, errors.confirmPin && styles.inputError]}
                      />
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
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
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={['#1F7FE5', '#1862b8']}
                    style={styles.createAccountButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <TextNB style={styles.createAccountText}>Create Account</TextNB>
                    <ArrowRight size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Swiper>
        </SafeAreaView>
      </View>
    </NativeBaseProvider>
  );
}


const styles = StyleSheet.create({
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
