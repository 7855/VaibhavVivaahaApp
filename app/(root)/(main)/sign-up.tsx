import React, { useRef, useState, useEffect } from "react";
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
type GetstartProps = {
  onStart: () => void;
};

type CasteOption = {
  key: string;
  value: string;
  label: string;
};

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
const employmentOptions = [
  { label: 'Government', value: 'GOVT' },
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Self Employment', value: 'SELF' },
  // { label: 'Unemployed', value: 'unemployed' }
];
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



  const validateFormData = () => {
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
    };

    const requiredFields = Object.keys(formData);

    const missingFields = requiredFields.filter(
      (field) =>
        formData[field] === null ||
        formData[field] === undefined ||
        formData[field].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      Alert.alert(
        "Missing Fields",
        `Please fill all required fields: ${missingFields.join(", ")}`
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
    const fetchCasteList = async () => {
      try {
        setLoading(true);
        const response = await userApi.getAllCaste();
        if (response.data && response.data.data) {
          console.log("response.data.data", response.data.data);

          // Filter only active castes
          const activeCastes = response.data.data.filter((caste: any) => caste.isActive === 'Y');
          setAllCaste(activeCastes);
          // Add a placeholder option
          const casteOptions = activeCastes.map((caste: any) => ({
            key: caste.id.toString(),
            value: caste.casteCode,
            label: caste.casteName,
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

  const occupationList = [
    { id: 1, name: "Doctor" },
    { id: 2, name: "Engineer" },
    { id: 3, name: "Teacher" },
    { id: 4, name: "Lawyer" },
    { id: 5, name: "Accountant" },
    { id: 6, name: "Nurse" },
    { id: 7, name: "Software Developer" },
    { id: 8, name: "Civil Servant" },
    { id: 9, name: "Farmer" },
    { id: 10, name: "Entrepreneur" },
    { id: 11, name: "Architect" },
    { id: 12, name: "Journalist" },
    { id: 13, name: "Pharmacist" },
    { id: 14, name: "Chartered Accountant (CA)" },
    { id: 15, name: "Researcher" },
    { id: 16, name: "Scientist" },
    { id: 17, name: "Designer" },
    { id: 18, name: "Human Resources (HR) Manager" },
    { id: 19, name: "Marketing Manager" },
    { id: 20, name: "Sales Executive" },
    { id: 21, name: "Graphic Designer" },
    { id: 22, name: "Web Developer" },
    { id: 23, name: "Data Analyst" },
    { id: 24, name: "Business Analyst" },
    { id: 25, name: "Consultant" },
    { id: 26, name: "Banker" },
    { id: 27, name: "Pilot" },
    { id: 28, name: "Air Hostess / Flight Attendant" },
    { id: 29, name: "Police Officer" },
    { id: 30, name: "Firefighter" },
    { id: 31, name: "Chef" },
    { id: 32, name: "Hotel Manager" },
    { id: 33, name: "Artist" },
    { id: 34, name: "Musician" },
    { id: 35, name: "Actor/Actress" },
    { id: 36, name: "Photographer" },
    { id: 37, name: "Event Planner" },
    { id: 38, name: "Fitness Trainer" },
    { id: 39, name: "Social Worker" },
    { id: 40, name: "Psychologist" },
    { id: 41, name: "Librarian" },
    { id: 42, name: "Translator" },
    { id: 43, name: "Interpreter" },
    { id: 44, name: "Content Writer" },
    { id: 45, name: "Copywriter" },
    { id: 46, name: "Digital Marketer" },
    { id: 47, name: "SEO Specialist" },
    { id: 48, name: "Public Relations (PR) Officer" },
    { id: 49, name: "Real Estate Agent" },
    { id: 50, name: "Retail Manager" },
    { id: 51, name: "Logistics Manager" },
    { id: 52, name: "Supply Chain Manager" },
    { id: 53, name: "Operations Manager" },
    { id: 54, name: "Project Manager" },
    { id: 55, name: "Quality Assurance (QA) Engineer" },
    { id: 56, name: "Network Administrator" },
    { id: 57, name: "System Administrator" },
    { id: 58, name: "Graphic Illustrator" },
    { id: 59, name: "Animator" },
    { id: 60, name: "Video Editor" },
    { id: 61, name: "Data Scientist" },
    { id: 62, name: "Machine Learning Engineer" },
    { id: 63, name: "AI Specialist" },
    { id: 64, name: "Blockchain Developer" },
    { id: 65, name: "Cybersecurity Analyst" },
    { id: 66, name: "Ethical Hacker" },
    { id: 67, name: "UX/UI Designer" },
    { id: 68, name: "Content Strategist" },
    { id: 69, name: "Social Media Manager" },
    { id: 70, name: "Customer Support Representative" },
    { id: 71, name: "Call Center Agent" },
    { id: 72, name: "Receptionist" },
    { id: 73, name: "Administrator" }
  ];

  const educationList = [
    {
      "id": 1,
      "degree": "Bachelor of Arts (BA)"
    },
    {
      "id": 2,
      "degree": "Bachelor of Science (BSc)"
    },
    {
      "id": 3,
      "degree": "Bachelor of Commerce (BCom)"
    },
    {
      "id": 4,
      "degree": "Bachelor of Engineering (BE)"
    },
    {
      "id": 5,
      "degree": "Bachelor of Technology (BTech)"
    },
    {
      "id": 6,
      "degree": "Bachelor of Business Administration (BBA)"
    },
    {
      "id": 7,
      "degree": "Bachelor of Computer Applications (BCA)"
    },
    {
      "id": 8,
      "degree": "Bachelor of Education (BEd)"
    },
    {
      "id": 9,
      "degree": "Bachelor of Pharmacy (BPharm)"
    },
    {
      "id": 10,
      "degree": "Bachelor of Architecture (BArch)"
    },
    {
      "id": 11,
      "degree": "Master of Arts (MA)"
    },
    {
      "id": 12,
      "degree": "Master of Science (MSc)"
    },
    {
      "id": 13,
      "degree": "Master of Commerce (MCom)"
    },
    {
      "id": 14,
      "degree": "Master of Business Administration (MBA)"
    },
    {
      "id": 15,
      "degree": "Master of Computer Applications (MCA)"
    },
    {
      "id": 16,
      "degree": "Master of Technology (MTech)"
    },
    {
      "id": 17,
      "degree": "Master of Engineering (ME)"
    },
    {
      "id": 18,
      "degree": "Master of Education (MEd)"
    },
    {
      "id": 19,
      "degree": "Doctor of Philosophy (PhD)"
    },
    {
      "id": 20,
      "degree": "Doctor of Medicine (MD)"
    }
  ]

  const jobPlaceList = [
    { id: 1, name: 'Chennai' },
    { id: 2, name: 'Bengaluru' },
    { id: 3, name: 'Hyderabad' },
    { id: 4, name: 'Mumbai' },
    { id: 5, name: 'Kolkata' },
    { id: 6, name: 'Pune' },
    { id: 7, name: 'Coimbatore' },
    { id: 8, name: 'Madurai' },
    { id: 9, name: 'Delhi' },
    { id: 10, name: 'Ahmedabad' },
  ];

  const occupationData = occupationList.map((item) => ({
    key: item.id.toString(),
    value: item.name,
  }));

  const educationData = educationList.map((item) => ({
    key: item.id.toString(),
    value: item.degree,
  }));

  const jobPlaceData = jobPlaceList.map((item) => ({
    key: item.id.toString(),
    value: item.name,
  }));

  const annualIncomes = [
    100000,
    200000,
    300000,
    400000,
    500000,
    600000,
    700000,
    800000,
    900000,
    1000000,
    1200000,
    1400000,
    1600000,
    1800000,
    2000000
  ];

  const incomeOptions = annualIncomes.map(amount => ({
    key: amount.toString(),
    value: amount.toString(),
    label: `₹${amount.toLocaleString()}`
  }));


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
      setDate(selectedDate);
      setDob(selectedDate);
      // Format the date for display
      const formattedDate = moment(selectedDate).format('DD MMM YYYY');
      setDobDisplay(formattedDate);
    }
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
            <View style={{ padding: 15 }}>

              <HStack space={2} width="100%">
                <Box flex={1}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">First Name</TextNB>
                  <Box width="100%">
                    <TextInput
                      placeholder="Enter First Name"
                      onChangeText={setFirstName}
                      defaultValue={firstName}
                      style={styles.input}
                    />
                  </Box>
                </Box>
                <Box flex={1}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">Last Name</TextNB>
                  <Box width="100%">
                    <TextInput
                      placeholder="Enter Last Name"
                      onChangeText={setLastName}
                      defaultValue={lastName}
                      style={styles.input}
                    />
                  </Box>
                </Box>
              </HStack>

            {/* DOB with Date Picker */}
            <HStack space={8} width="100%">
  {/* DOB */}
  <Box flex={1} >
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
      style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between",borderWidth:1 }]}
    >
      <TextNB color={date ? "#000" : "#999"} fontSize={14}>
        {date ? date.toDateString() : "Select Date"}
      </TextNB>
      <Ionicons name="calendar" size={18} color="#FFB300" />
    </TouchableOpacity>

    {/* Modal Picker */}
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
          padding: 20,
          alignItems: "center",
          height: 300,
          justifyContent: "center",
        }}
      >
        <RNDateTimePicker
          value={date || new Date()}
          mode="date"
          display="spinner"
          textColor="#130057"
          themeVariant="dark"
          style={{ backgroundColor:'#fff' }}
          onChange={(event, selectedDate) => {
            if (event.type === "set" && selectedDate) {
              handleDateChange(event, selectedDate);
            }
            setShowDatePicker(false);
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
          onPress={() => setShowDatePicker(false)}
          style={{
            backgroundColor: "#130057",
            paddingVertical: 10,
            paddingHorizontal: 25,
            borderRadius: 8,
          }}
        >
          <TextNB color="#fff" fontWeight="bold">Close</TextNB>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>


  </Box>

  {/* Gender */}
  <Box flex={1}>
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
                onSelect={(val) => setCaste(val)}
              />



              {/* Mobile Number - 10 digits only */}
              <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">Mobile Number</TextNB>
              <Box alignItems="center" width="100%">
                <TextInput
                  placeholder="Enter Mobile Number"
                  keyboardType="numeric"
                  maxLength={10}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, "");
                    setMobile(numericText);
                  }}
                  style={styles.input}
                />
              </Box>

              {/* Age and Email */}
              <HStack space={2} width="100%">
                <Box flex={0.3}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">Age</TextNB>
                  <Box width="100%">
                    <TextInput
                      placeholder="Enter Age"
                      keyboardType="numeric"
                      maxLength={3}
                      onChangeText={setAge}
                      defaultValue={age}
                      style={styles.input}
                    />
                  </Box>
                </Box>
                <Box flex={0.7}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">Email</TextNB>
                  <Box width="100%">
                    <TextInput
                      placeholder="Enter Email"
                      keyboardType="email-address"
                      onChangeText={setEmail}
                      defaultValue={email}
                      style={styles.input}
                    />
                  </Box>
                </Box>
              </HStack>

              {/* 7. Education (single-line) */}
<CustomModalPicker
  label="Education"
  placeholder="Select Your Education"
  data={educationData}
  selected={education}
  onSelect={(val) => setEducation(val)}
/>



              {/* 9. Occupation (single-line) */}
<CustomModalPicker
  label="Occupation"
  placeholder="Select Your Occupation"
  data={occupationData}
  selected={occupation}
  onSelect={(val) => setOccupation(val)}
/>




              {/* 8. Employed In (multiline) */}
              <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
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



              {/* 19. Native Place (multiline) */}
              <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">
                Native Place
              </TextNB>
              <Box alignItems="center" width="100%">
                <TextInput
                  placeholder="Enter Your Native Place"
                  multiline
                  numberOfLines={3}
                  onChangeText={setNativePlace}
                  defaultValue={nativePlace}
                  style={styles.input}
                />
              </Box>

            </View>
            <View style={{ display: 'flex', alignItems: 'flex-end', marginRight: 25 }}>
              <ButtonNB style={{ marginBottom: 50, marginTop: 0, width: '28%', borderRadius: 20, backgroundColor: '#130057' }} onPress={() => swiperRef.current?.scrollBy(1)}>
                <HStack space={2} alignItems="center">
                  <TextNB color="#fff" fontSize={15} fontWeight={'semibold'}>Next</TextNB>
                  <AntDesign name="arrowright" size={20} color="#fff" fontWeight={'semibold'} />
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
            <View style={{ padding: 15 }}>

              {/* 11. Income (annual CTC) (multiline) */}
              <CustomModalPicker
                label="Annual Income"
                placeholder="Select Your Annual Income"
                data={incomeOptions}
                selected={income}
                onSelect={(val) => setIncome(val)}
              />


              {/* Father's Name */}
              <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">Father's Name</TextNB>
              <Box alignItems="center" width="100%">
                <TextInput
                  placeholder="Enter Father's Name"
                  onChangeText={setFatherName}
                  defaultValue={fatherName}
                  style={styles.input}
                />
              </Box>

              {/* Father's Occupation */}
           
              <CustomModalPicker
                label="Father's Occupation"
                placeholder="Select Father's Occupation"
                data={occupationData}
                selected={fatherOccupation}
                onSelect={(val) => setFatherOccupation(val)}
              />

              {/* Mother's Name */}
              <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">Mother's Name</TextNB>
              <Box alignItems="center" width="100%">
                <TextInput
                  placeholder="Enter Mother's Name"
                  onChangeText={setMotherName}
                  defaultValue={motherName}
                  style={styles.input}
                />
              </Box>



              {/* Mother's Occupation */}
              <CustomModalPicker
                label="Mother's Occupation"
                placeholder="Select Mother's Occupation"
                data={occupationData}
                selected={motherOccupation}
                onSelect={(val) => setMotherOccupation(val)}
              />

              {/* 10. Job Place (multiline) */}
              <CustomModalPicker
                label="Job Place"
                placeholder="Select Job Place"
                data={jobPlaceData}
                selected={jobPlace}
                onSelect={(val) => setJobPlace(val)}
              />


              {/* 21. Current Address (multiline) */}
              <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">Current Address</TextNB>
              <Box alignItems="center" width="100%">
                <TextInput
                  placeholder="Enter Your Current Address"
                  multiline
                  numberOfLines={3}
                  onChangeText={setCurrentAddress}
                  defaultValue={currentAddress}
                  style={styles.input}
                />
              </Box>



              {/* 12. PIN and Confirm PIN */}
              <HStack space={2} width="100%">
                <Box flex={1}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">PIN</TextNB>
                  <Box width="100%">
                    <TextInput
                      placeholder="Enter PIN"
                      keyboardType="numeric"
                      secureTextEntry
                      onChangeText={setPin}
                      defaultValue={pin}
                      style={styles.input}
                    />
                  </Box>
                </Box>
                <Box flex={1}>
                  <TextNB color="#130057" fontSize={13} marginBottom={1} fontWeight="bold">Confirm PIN</TextNB>
                  <Box width="100%">
                    <TextInput
                      placeholder="Confirm PIN"
                      keyboardType="numeric"
                      secureTextEntry
                      onChangeText={setConfirmPin}
                      defaultValue={confirmPin}
                      style={styles.input}
                    />
                  </Box>
                </Box>
              </HStack>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 25,
                marginTop: 20,
                marginBottom: 50,
              }}
            >
              {/* Back Button */}
              <ButtonNB
                style={{
                  width: '28%',
                  borderRadius: 20,
                  backgroundColor: '#130057',
                }}
                onPress={() => swiperRef.current?.scrollBy(-1)} // move to previous page
              >
                <HStack space={1} alignItems="center">
                  <AntDesign name="arrowleft" size={20} color="#fff" />
                  <TextNB color="#fff" fontSize={15} fontWeight={'semibold'}>
                    Back
                  </TextNB>
                </HStack>
              </ButtonNB>

              {/* Submit or Next Button */}
              <ButtonNB
                style={{
                  width: '28%',
                  borderRadius: 20,
                  backgroundColor: '#130057',
                }}
                onPress={() => handleFormSubmit()} // or change to submit handler
              >
                <HStack space={1} alignItems="center">
                  <TextNB color="#fff" fontSize={15} fontWeight={'semibold'}>
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
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
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
    color: 'white', // Text color is white
    fontSize: 16, // Adjust font size as needed
    fontWeight: 'medium', // Optional: Make the text bold
  },
  linkText: {
    color: "#fff",
    fontSize: 16,
    textDecorationLine: "underline",
    fontStyle: "italic",
  },
  input: {
    height: 40,
    // margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '100%',
    borderRadius: 10,
    borderColor: 'black',
    // color: '#',
    marginBottom: 12,
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
});

