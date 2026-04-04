import React, { useRef, useState, useEffect, SetStateAction } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  Alert,
  Modal
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Swiper from "react-native-swiper";
import { Box, Input, NativeBaseProvider, Text as TextNB, Button as ButtonNB, HStack, Checkbox, FlatList } from "native-base";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from 'react-native';
import { NativeModules } from 'react-native';
import moment from 'moment'; // Import the moment library for date formatting
import { SelectList } from 'react-native-dropdown-select-list'
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import userApi from '../api/userApi';
import { AntDesign } from '@expo/vector-icons';
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { loadMasterData } from "../services/masterService";
import { useMasterData } from "../contexts/MasterDataContext";
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
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  jobPlace?: string;
  currentAddress?: string;
  nativePlace?: string;
  pin?: string;
  confirmPin?: string;
  income?: string;
  educationInDetail?: string
  // Add other error fields as needed
}

export default function SignUp({ onStart }: GetstartProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [swiperReady, setSwiperReady] = useState(false);
  const [dob, setDob] = useState(new Date());
  const [dobDisplay, setDobDisplay] = useState("");
  const [mobile, setMobile] = useState("");
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [caste, setCaste] = useState('');
  const { state: masterData, setMasterData } = useMasterData();
  const [educationOptions, setEducationOptions] = useState<Array<{ id: string, value: string }>>([]);
  const [incomeOptions, setIncomeOptions] = useState<Array<{ id: string, value: string, label: string }>>([]);
  const [employmentOptions, setEmploymentOptions] = useState<Array<{ id: string, value: string, label: string }>>([]);
  const [allCaste, setAllCaste] = useState<any[]>([]);
  const [fatherOccupation, setFatherOccupation] = React.useState("");
  const [motherOccupation, setMotherOccupation] = React.useState("");
  const [selectedComplexion, setSelectedComplexion] = useState<string>('');
  const [jobPlace, setJobPlace] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [casteList, setCasteList] = useState<CasteOption[]>([]);
  const [income, setIncome] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  // employmentOptions is now managed by the masterData effect
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [nativePlace, setNativePlace] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const swiperRef = useRef<Swiper>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [educationInDetail, setEducationInDetail] = useState('');
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
    nativePlace: 'Native Place',
    income: 'Income',
    fatherName: 'Father\'s Name',
    fatherOccupation: 'Father\'s Occupation',
    motherName: 'Mother\'s Name',
    motherOccupation: 'Mother\'s Occupation',
    jobPlace: 'Job Place',
    currentAddress: 'Current Address',
    pin: 'PIN',
    confirmPin: 'Confirm PIN',
    educationInDetail: 'Education in Detail'
  };

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
    nativePlace,
    income,
    fatherName,
    fatherOccupation,
    motherName,
    motherOccupation,
    jobPlace,
    currentAddress,
    pin,
    confirmPin,
    educationInDetail
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

  if (missingFields.length > 0) {
    Alert.alert(
      "Missing Fields",
      `Please fill in the following required fields:\n\n• ${missingFields.join("\n• ")}`
    );
    return false;
  }

  if (formData.pin !== formData.confirmPin) {
    Alert.alert("Validation Error", "PIN and Confirm PIN do not match!");
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

      // Update income options
      if (masterData.annualIncomes) {
        const incOptions = masterData.annualIncomes.map((income: any) => ({
          id: income.id.toString(),
          value: income.amount,
          label: income.amount
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

  const handleFormSubmit = async () => {
    // Validate all fields first
    if (!validateFormData()) return;

    // Find the selected caste data
    const selectedCasteData = allCaste.find((item: any) => item.casteCode === caste);
    if (!selectedCasteData) {
      Alert.alert("No caste selected", "Please select a valid caste.");
      return;
    }

    // Prepare the payload
    const payload = {
      firstName,
      lastName,
      dateOfBirth: dob ? dob.toISOString().split("T")[0] : "",
      mobileNumber: mobile,
      fathersName: fatherName,
      mothersName: motherName,
      fathersOccupation: fatherOccupation,
      mothersOccupation: motherOccupation,
      education,
      occupation,
      jobPlace,
      employingIn: employmentStatus,
      nativePlace,
      currentAddress,
      annualIncome: income,
      gender: selectedGender.toUpperCase() == "MALE" ? "M" : "F",
      casteId: parseInt(selectedCasteData.id),
      pin,
      location: jobPlace,
      age,
      email,
    };

    console.log("payload=====================>", payload);

    try {
      const response = await userApi.createUser(payload);

      if (response.data?.code === 401) {
        Alert.alert("Error", "Given Mobile Number Already Registered.");
      } else if (response.data?.code === 200) {
        Alert.alert("Success", "Account created successfully!", [
          {
            text: "OK",
            onPress: () => router.push("/"),
          },
        ]);
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
    }
  };



  console.log("RNDatePicker module:", NativeModules.RNDatePicker);

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' }
  ];

  // Handler to toggle selection
  const handleSelect = (value: string) => {
    setSelectedComplexion(prev => (prev === value ? '' : value));
  };


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
      const computedAge = calculateAge(selectedDate);

      // 🚫 Underage validation
      if (computedAge < 18) {
        Alert.alert(
          "Age Restriction",
          "You must be at least 18 years old to register."
        );
        return; // ❗ Do NOT update DOB or age
      }
      setDate(selectedDate);
      setDob(selectedDate);
      // Format the date for display
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

  const onDateConfirm = () => {
    const computedAge = calculateAge(tempDate);

    if (computedAge < 18) {
      Alert.alert("Age Restriction", "You must be at least 18 years old to register.");
      return;   // ❌ do not update anything
    }

    setDate(tempDate);
    setAge(computedAge.toString());
    setDob(tempDate);
    setDobDisplay(moment(tempDate).format("DD MMM YYYY"));
    setShowDatePicker(false);
  };



  const amberColor = "#F59E0B";

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
      <View style={{ marginBottom: 15 }}>
        {/* Label */}
        <TextNB style={styles.label}>{label}</TextNB>

        {/* Selected Value Box */}
        <TouchableOpacity
          style={styles.inputBox}
          onPress={() => setVisible(true)}
        >
          <TextNB style={{ color: selected ? "#000" : "#999" }}>
            {selected || placeholder}
          </TextNB>
          <Ionicons name="chevron-down" size={18} color="#130057" />
        </TouchableOpacity>

        {/* Modal */}
        <Modal visible={visible} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <TextNB style={styles.modalTitle}>{label}</TextNB>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Ionicons name="close" size={22} color="#130057" />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.searchBox}>
                <Ionicons
                  name="search"
                  size={18}
                  color="#FFB300"
                  style={{ marginRight: 5 }}
                />
                <TextInput
                  placeholder="Search"
                  value={search}
                  onChangeText={setSearch}
                  style={{
                    flex: 1, height: 40,
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
      <Swiper showsPagination={false} ref={swiperRef} loop={false} scrollEnabled={false} removeClippedSubviews={false}>
        {/* Page 2 - Input */}

        <View style={{ flex: 1 }}>
          <SafeAreaView edges={['right', 'left', 'top']} style={{ backgroundColor: 'whitesmoke', marginBottom: 0, paddingBottom: 0, height: '100%' }} >
            {/* <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="on-drag"
            > */}
            {/* <ScrollView> */}
            <KeyboardAwareScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: 15,
                paddingBottom: 0 // Reduced from 180
              }}
              enableOnAndroid={true}
              enableAutomaticScroll={Platform.OS === 'ios'} // Auto-scroll only on iOS
              extraScrollHeight={Platform.OS === 'ios' ? 30 : 0} // Only add extra space on iOS
              keyboardOpeningTime={0} // Faster keyboard handling
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              enableResetScrollToCoords={false} // Prevents unwanted scrolling
            >
              {/* Your form fields go here */}
              <View style={{ marginBottom: 0 }}>


                <HStack space={2} width="100%">
                  {/* First Name Field */}
                  <Box flex={1} style={styles.inputContainer}>
                    <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                      First Name
                    </TextNB>
                    <TextInput
                      placeholder="Enter First Name"
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
                    <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                      Last Name
                    </TextNB>
                    <TextInput
                      placeholder="Enter Last Name"
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

                {/* DOB with Date Picker */}
                <HStack space={8} width="100%" marginBottom={3}>
                  {/* DOB */}
                  <Box flex={1} style={styles.inputContainer}>
                    <TextNB
                      color="#130057"
                      fontSize={13}
                      marginBottom={1}
                      fontWeight="bold"
                    >
                      Date of Birth <TextNB color="red">*</TextNB>
                    </TextNB>

                    {/* Custom Styled Date Input */}
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1 }]}
                    >
                      <TextNB color={date ? "#000" : "#000"}>
                        {date ? dobDisplay : "Select Date"}
                      </TextNB>

                      <Ionicons name="calendar" size={18} color="#FFB300" />
                    </TouchableOpacity>

                    {/* Modal Picker */}
                    <Modal visible={showDatePicker} transparent animationType="fade">
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
                              textColor="#130057"
                              themeVariant="dark"
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
                              onPress={onDateConfirm}
                              style={{
                                backgroundColor: "#130057",
                                paddingVertical: 10,
                                paddingHorizontal: 15,
                                borderRadius: 8,
                              }}
                            >
                              <TextNB color="#fff" fontWeight="bold">Confirm</TextNB>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Modal>


                  </Box>

                  {/* Gender */}
                  <Box flex={1} style={styles.inputContainer}>
                    <TextNB color="#130057" fontSize={13} marginBottom={3} fontWeight="bold">
                      Gender
                    </TextNB>
                    <Box alignItems="flex-start" width="100%">
                      <HStack space={4} alignItems="start">
                        {genderOptions.map((option) => (
                          <HStack key={option.value} space={2} alignItems="start">
                            <Checkbox
                              value={option.value}
                              isChecked={selectedGender === option.value}
                              onChange={() => setSelectedGender(option.value)}
                              size="sm"
                              colorScheme="black"
                              _checked={{
                                bg: "#130057",
                                borderColor: "#130057",
                              }}
                            />
                            <TextNB fontSize="sm" color="black">
                              {option.label}
                            </TextNB>
                          </HStack>
                        ))}
                      </HStack>
                    </Box>
                  </Box>
                </HStack>



                {/* Caste */}
                <CustomModalPicker
                  label="Caste"
                  placeholder="Select Caste"
                  data={casteList}
                  selected={caste}
                  onSelect={(val) => {
                    const selectedCaste = casteList.find(c => c.id === val);
                    setCaste(selectedCaste?.code || '');
                  }}
                />



                {/* Mobile Number - 10 digits only */}
                <Box style={styles.inputContainer}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                    Mobile Number
                  </TextNB>
                  <TextInput
                    placeholder="Enter Mobile Number"
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
                {/* Age and Email */}
                <HStack space={2} width="100%">
                  {/* Age Field */}
                  <Box flex={0.3} style={styles.inputContainer}>
                    <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                      Age
                    </TextNB>
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
                    <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                      Email
                    </TextNB>
                    <TextInput
                      placeholder="Enter Email"
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
                      style={[styles.input, errors.email && styles.inputError]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {errors.email ? (
                      <TextNB style={styles.error}>{errors.email}</TextNB>
                    ) : (
                      <TextNB style={styles.hiddenError}> </TextNB>
                    )}
                  </Box>
                </HStack>

                {/* 7. Education (single-line) */}
                <CustomModalPicker
                  label="Education"
                  placeholder="Select Your Education"
                  data={educationOptions}
                  selected={education}
                  onSelect={(val) => setEducation(val)}
                />

                {/* Occupation Field */}
                <Box style={styles.inputContainer}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                    Occupation
                  </TextNB>
                  <TextInput
                    placeholder="Enter Your Occupation"
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

                {/* Education In Detail Field */}
                <Box style={styles.inputContainer}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                    Education in Detail
                  </TextNB>
                  <TextInput
                    placeholder="Enter Your Education in Detail"
                    multiline
                    numberOfLines={3}
                    value={educationInDetail}
                    onChangeText={(t) => {
                      setEducationInDetail(onlyAlphanumeric(t));
                      if (errors.educationInDetail) {
                        setErrors(prev => ({ ...prev, educationInDetail: '' }));
                      }
                    }}
                    onBlur={() => {
                      if (!educationInDetail.trim()) {
                        setErrors(prev => ({
                          ...prev,
                          educationInDetail: 'Education details are required'
                        }));
                      }
                    }}
                    style={[
                      styles.input,
                      styles.textArea,
                      errors.educationInDetail && styles.inputError
                    ]}
                    textAlignVertical="top"
                  />
                  {errors.educationInDetail ? (
                    <TextNB style={styles.error}>{errors.educationInDetail}</TextNB>
                  ) : (
                    <TextNB style={styles.hiddenError}> </TextNB>
                  )}
                </Box>
              </View>
            </KeyboardAwareScrollView>
            <View style={{ display: 'flex', alignItems: 'flex-end', marginRight: 25 }}>
              <ButtonNB style={{ marginBottom: 60, marginTop: 0, width: '26%', borderRadius: 20, backgroundColor: '#420001' }} onPress={() => swiperRef.current?.scrollBy(1)}>
                <HStack space={2} alignItems="center">
                  <TextNB color="#fff" fontSize={13} fontWeight={'normal'}>Next</TextNB>
                  <ArrowRight size={20} color="#fff" fontWeight={'semibold'} />
                </HStack>
              </ButtonNB>
            </View>
            {/* </ScrollView> */}
          </SafeAreaView>
        </View>

        {/* Page 3 */}
        <View style={{ flex: 1 }}>
          <SafeAreaView edges={['right', 'left', 'top']} style={{ backgroundColor: 'smokewhite', marginBottom: 0, paddingBottom: 0, height: '100%' }} >
            {/* <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="on-drag"
            > */}
            <KeyboardAwareScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: 15,
                paddingBottom: 0 // Reduced from 180
              }}
              enableOnAndroid={true}
              enableAutomaticScroll={Platform.OS === 'ios'} // Auto-scroll only on iOS
              extraScrollHeight={Platform.OS === 'ios' ? -50 : 0} // Only add extra space on iOS
              keyboardOpeningTime={0} // Faster keyboard handling
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              enableResetScrollToCoords={false} // Prevents unwanted scrolling
            >
            <View >

              {/* 8. Employed In (multiline) */}
              <TextNB color="#130057" fontSize={13} marginBottom={2} fontWeight="bold">
                Employing In
              </TextNB>
              <Box alignItems="flex-start" width="100%" marginBottom={4}>
                <HStack space={4} alignItems="start">
                  {employmentOptions.map((option) => (
                    <HStack key={option.value} space={2} alignItems="start">
                      <Checkbox
                        value={option.value}
                        isChecked={employmentStatus === option.value}
                        onChange={() => setEmploymentStatus(option.value)}
                        size="sm"
                        colorScheme="amber"
                        _checked={{
                          bg: "#130057",
                          borderColor: "#130057"
                        }}
                      />
                      <TextNB fontSize="sm">
                        {option.label}
                      </TextNB>
                    </HStack>
                  ))}
                </HStack>
              </Box>

              {/* 11. Income (annual CTC) (multiline) */}
              {/* <Box style={styles.inputContainer}> */}
              <CustomModalPicker
                label="Annual Income"
                placeholder="Select Your Annual Income"
                data={incomeOptions}
                selected={income}
                onSelect={(val) => {
                  setIncome(val);
                  if (errors.income) {
                    setErrors(prev => ({ ...prev, income: '' }));
                  }
                }}
              />

              {/* Father's Name and Occupation */}
              <HStack space={2} width="100%">
                {/* Father's Name */}
                <Box flex={0.5} style={styles.inputContainer}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                    Father's Name
                  </TextNB>
                  <TextInput
                    placeholder="Enter Father's Name"
                    value={fatherName}
                    onChangeText={(t) => {
                      setFatherName(onlyAlphabets(t));
                      if (errors.fatherName) {
                        setErrors(prev => ({ ...prev, fatherName: '' }));
                      }
                    }}
                    onBlur={() => {
                      if (!fatherName.trim()) {
                        setErrors(prev => ({
                          ...prev,
                          fatherName: "Father's name is required"
                        }));
                      }
                    }}
                    style={[styles.input, errors.fatherName && styles.inputError]}
                  />
                  {errors.fatherName ? (
                    <TextNB style={styles.error}>{errors.fatherName}</TextNB>
                  ) : (
                    <TextNB style={styles.hiddenError}> </TextNB>
                  )}
                </Box>

                  {/* Father's Occupation */}
                  <Box flex={1} style={styles.inputContainer}>
                    <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                      Father's Occupation
                    </TextNB>
                    <TextInput
                      placeholder="Enter Occupation"
                      value={fatherOccupation}
                      onChangeText={(t) => {
                        setFatherOccupation(onlyAlphanumeric(t));
                        if (errors.fatherOccupation) {
                          setErrors(prev => ({ ...prev, fatherOccupation: '' }));
                        }
                      }}
                      onBlur={() => {
                        if (!fatherOccupation.trim()) {
                          setErrors(prev => ({ ...prev, fatherOccupation: "Occupation is required" }));
                        }
                      }}
                      style={[styles.input, errors.fatherOccupation && styles.inputError]}
                    />
                    {errors.fatherOccupation && <TextNB style={styles.error}>{errors.fatherOccupation}</TextNB>}
                  </Box>
                </HStack>


                {/* Mother's Name and Occupation */}
                <HStack space={2} width="100%">
                  {/* Mother's Name */}
                  <Box flex={0.5} style={styles.inputContainer}>
                    <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                      Mother's Name
                    </TextNB>
                    <TextInput
                      placeholder="Enter Mother's Name"
                      value={motherName}
                      onChangeText={(t) => {
                        setMotherName(onlyAlphabets(t));
                        if (errors.motherName) {
                          setErrors(prev => ({ ...prev, motherName: '' }));
                        }
                      }}
                      onBlur={() => {
                        if (!motherName.trim()) {
                          setErrors(prev => ({
                            ...prev,
                            motherName: "Mother's name is required"
                          }));
                        }
                      }}
                      style={[styles.input, errors.motherName && styles.inputError]}
                    />
                    {errors.motherName ? (
                      <TextNB style={styles.error}>{errors.motherName}</TextNB>
                    ) : (
                      <TextNB style={styles.hiddenError}> </TextNB>
                    )}
                  </Box>

                  {/* Mother's Occupation */}
                  <Box flex={1} style={styles.inputContainer}>
                    <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                      Mother's Occupation
                    </TextNB>
                    <TextInput
                      placeholder="Enter Occupation"
                      value={motherOccupation}
                      onChangeText={(t) => {
                        setMotherOccupation(onlyAlphanumeric(t));
                        if (errors.motherOccupation) {
                          setErrors(prev => ({ ...prev, motherOccupation: '' }));
                        }
                      }}
                      onBlur={() => {
                        if (!motherOccupation.trim()) {
                          setErrors(prev => ({ ...prev, motherOccupation: "Occupation is required" }));
                        }
                      }}
                      style={[styles.input, errors.motherOccupation && styles.inputError]}
                    />
                    {errors.motherOccupation && <TextNB style={styles.error}>{errors.motherOccupation}</TextNB>}
                  </Box>
                </HStack>

               <Box style={styles.inputContainer}>
  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
    Job Place
  </TextNB>
  <TextInput
    placeholder="Enter Job Place"
    value={jobPlace}
    onChangeText={(t) => {
      setJobPlace(onlyAlphabets(t));
      if (errors.jobPlace) {
        setErrors(prev => ({ ...prev, jobPlace: '' }));
      }
    }}
    onBlur={() => {
      if (!jobPlace.trim()) {
        setErrors(prev => ({ ...prev, jobPlace: 'Job place is required' }));
      }
    }}
    style={[styles.input, errors.jobPlace && styles.inputError]}
  />
  {errors.jobPlace ? (
    <TextNB style={styles.error}>{errors.jobPlace}</TextNB>
  ) : (
    <TextNB style={styles.hiddenError}> </TextNB>
  )}
</Box>


                {/* 21. Current Address (multiline) */}
                <Box style={styles.inputContainer}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                    Current Address
                  </TextNB>
                  <TextInput
                    placeholder="Enter Your Current Address"
                    value={currentAddress}
                    multiline
                    numberOfLines={3}
                    onChangeText={(t) => {
                      setCurrentAddress(t);
                      if (errors.currentAddress) {
                        setErrors(prev => ({ ...prev, currentAddress: '' }));
                      }
                    }}
                    onBlur={() => {
                      if (!currentAddress.trim()) {
                        setErrors(prev => ({
                          ...prev,
                          currentAddress: 'Current address is required'
                        }));
                      }
                    }}
                    style={[
                      styles.input,
                      styles.textArea,
                      errors.currentAddress && styles.inputError
                    ]}
                    textAlignVertical="top"
                  />
                  {errors.currentAddress ? (
                    <TextNB style={styles.error}>{errors.currentAddress}</TextNB>
                  ) : (
                    <TextNB style={styles.hiddenError}> </TextNB>
                  )}
                </Box>

                {/* 19. Native Place (multiline) */}
               <Box style={styles.inputContainer}>
  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
    Native Place
  </TextNB>
  <TextInput
    placeholder="Enter Native Place"
    value={nativePlace}
    onChangeText={(t) => {
      setNativePlace(onlyAlphabets(t));
      if (errors.nativePlace) {
        setErrors(prev => ({ ...prev, nativePlace: '' }));
      }
    }}
    onBlur={() => {
      if (!nativePlace.trim()) {
        setErrors(prev => ({ ...prev, nativePlace: 'Native place is required' }));
      }
    }}
    style={[styles.input, errors.nativePlace && styles.inputError]}
  />
  {errors.nativePlace ? (
    <TextNB style={styles.error}>{errors.nativePlace}</TextNB>
  ) : (
    <TextNB style={styles.hiddenError}> </TextNB>
  )}
</Box>

              {/* 12. PIN and Confirm PIN */}
              <HStack space={2} width="100%">
                {/* PIN */}
                <Box flex={0.5} style={styles.inputContainer}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                    PIN
                  </TextNB>
                  <TextInput
                    placeholder="Enter 4-digit PIN"
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
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                    Confirm PIN
                  </TextNB>
                  <TextInput
                    placeholder="Confirm 4-digit PIN"
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
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 15,
                marginTop: 0,
                marginBottom: 65,
              }}
            >
              {/* Back Button */}
              <ButtonNB
                style={{
                  width: '26%',
                  borderRadius: 20,
                  backgroundColor: '#420001',
                }}
                onPress={() => swiperRef.current?.scrollBy(-1)} // move to previous page
              >
                <HStack space={1} alignItems="center">
                  <ArrowLeft size={20} color="#fff" />
                  <TextNB color="#fff" fontSize={13} fontWeight={'normal'}>
                    Back
                  </TextNB>
                </HStack>
              </ButtonNB>

              {/* Submit or Next Button */}
              <ButtonNB
                style={{
                  width: '26%',
                  borderRadius: 20,
                  backgroundColor: '#420001',
                }}
                onPress={() => handleFormSubmit()} // or change to submit handler
              >
                <HStack space={1} alignItems="center">
                  <TextNB color="#fff" fontSize={13} fontWeight={'normal'}>
                    Submit
                  </TextNB>
                  {/* <AntDesign name="arrowright" size={20} color="rgba(30,64,175,1.00)" /> */}
                </HStack>
              </ButtonNB>
            </View>

            {/* </ScrollView> */}
          </SafeAreaView>
        </View>


      </Swiper>
    </NativeBaseProvider>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    position: "absolute", // Ensures the image is positioned at the back
  },
  cardContainer: {
    position: "absolute", // Position above the image
    bottom: 0, // Align at the bottom of the screen
    width: "100%", // Full width of the screen
    backgroundColor: "#FF6B6B",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    alignItems: "center",
  },
  dotContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#FFC1C1",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#DADADA",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#DADADA",
    textAlign: "center",
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginBottom: 30
  },
  getStartedButton: {
    borderWidth: 1.5, // Adds a border width
    borderColor: 'white', // Border color is white
    backgroundColor: 'transparent', // Inner background is transparent
    paddingVertical: 10, // Adjust padding as needed
    paddingHorizontal: 20, // Adjust padding as needed
    borderRadius: 20, // Rounded corners, adjust as needed
    alignItems: 'center', // Center the text horizontally
    justifyContent: 'center', // Center the text vertically
  },
  buttonText: {
    color: '#DADADA', // Text color is white
    fontSize: 16, // Adjust font size as needed
    fontWeight: 'medium', // Optional: Make the text bold
  },
  linkText: {
    color: "#DADADA",
    fontSize: 16,
    textDecorationLine: "underline",
    fontStyle: "italic",
  },
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    width: '100%',
    borderRadius: 10,
    borderColor: 'black',
  },
  inputContainer: {
    marginBottom: 0,
  },
  dateinput: {
    height: 40,
    // margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '100%',
    borderRadius: 10,
    borderColor: 'gray',
    color: '#F5F5F5',
    marginBottom: 12,
  },
  box: {
    width: "100%",
    backgroundColor: "#130057", // darker background, for example
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 6,
  },
  dropdownBox: {
    borderWidth: 1,
    borderRadius: 6,
  },
  dropdownText: {
    color: "#FFC107",       // white text for each dropdown item
  },
  label: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#130057",
  },
  inputBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    // borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    // backgroundColor: "#fff",
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
    fontWeight: "bold",
    fontSize: 16,
    color: "#130057",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#130057",
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
    borderColor: 'red',
  },
  error: {
    color: 'red',
    fontSize: 10,
    height: 18,  // Fixed height for error message
    textAlign: 'left',
    paddingLeft: 2,
    marginTop: 0,
  },
  hiddenError: {
    height: 18,  // Same as error height
    opacity: 0,  // Make it invisible
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 10,
  },
});

