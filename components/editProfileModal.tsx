import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Box,
  Divider
} from 'native-base';
import { LinearGradient } from 'expo-linear-gradient';
import { SelectList } from 'react-native-dropdown-select-list';
import DateTimePicker from '@react-native-community/datetimepicker';
import EIcon from '@expo/vector-icons/Entypo';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { usePopup } from '../app/(root)/contexts/PopupContext';
import { useUserData } from '../app/(root)/contexts/UserDataContext';
import { useMasterData } from '../app/(root)/contexts/MasterDataContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  section?: {
    title: string;
    data: Record<string, string>;
  };
  onUpdate: (updatedData: Record<string, string>) => void;
  refreshProfile?: () => void;
}

const stars = [
  "Aswini", "Bharani", "Kiruthigai", "Rohini", "Mirugasritam",
  "Thiruvathirai", "Punarpoosam", "Poosam", "Ayilyam", "Maham",
  "Puram", "Uthiram", "Hastham", "Chithirai", "Swathi",
  "Visagam", "Anusham", "Kettai", "Moolam", "Puradam",
  "Uthiradham", "Thiruvonam", "Avittam", "Sadayam", "Puratathi",
  "Uthiratathi", "Revathi"
];

const moonsigns = [
  "Mesham", "Rishabam", "Mithunam", "Kadagam", "Simmam",
  "Kanni", "Thulam", "Vrichigam", "Dhanushu", "Makaram",
  "Kumbam", "Meenam"
];

const doshams = [
  "Manglik (Chevvai Dosham)",
  "Raghu & Kethu",
  "Manglik (Chevvai Dosham) and Raghu & Kethu",
  "None"
];

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


const educationList = [
  "Bachelor of Arts (BA)",
  "Bachelor of Science (BSc)",
  "Bachelor of Commerce (BCom)",
  "Bachelor of Engineering (BE)",
  "Bachelor of Technology (BTech)",
  "Bachelor of Business Administration (BBA)",
  "Bachelor of Computer Applications (BCA)",
  "Bachelor of Education (BEd)",
  "Bachelor of Pharmacy (BPharm)",
  "Bachelor of Architecture (BArch)",
  "Master of Arts (MA)",
  "Master of Science (MSc)",
  "Master of Commerce (MCom)",
  "Master of Business Administration (MBA)",
  "Master of Computer Applications (MCA)",
  "Master of Technology (MTech)",
  "Master of Engineering (ME)",
  "Master of Education (MEd)",
  "Doctor of Philosophy (PhD)",
  "Doctor of Medicine (MD)"
];

const occupationList = [
  "Doctor",
  "Engineer",
  "Teacher",
  "Lawyer",
  "Accountant",
  "Nurse",
  "Software Developer",
  "Civil Servant",
  "Farmer",
  "Entrepreneur",
  "Architect",
  "Journalist",
  "Pharmacist",
  "Chartered Accountant (CA)",
  "Researcher",
  "Scientist",
  "Designer",
  "Human Resources (HR) Manager",
  "Marketing Manager",
  "Sales Executive",
  "Graphic Designer",
  "Web Developer",
  "Data Analyst",
  "Business Analyst",
  "Consultant",
  "Banker",
  "Pilot",
  "Air Hostess / Flight Attendant",
  "Police Officer",
  "Firefighter",
  "Chef",
  "Hotel Manager",
  "Artist",
  "Musician",
  "Actor/Actress",
  "Photographer",
  "Event Planner",
  "Fitness Trainer",
  "Social Worker",
  "Psychologist",
  "Librarian",
  "Translator",
  "Interpreter",
  "Content Writer",
  "Copywriter",
  "Digital Marketer",
  "SEO Specialist",
  "Public Relations (PR) Officer",
  "Real Estate Agent",
  "Retail Manager",
  "Logistics Manager",
  "Supply Chain Manager",
  "Operations Manager",
  "Project Manager",
  "Quality Assurance (QA) Engineer",
  "Network Administrator",
  "System Administrator",
  "Graphic Illustrator",
  "Animator",
  "Video Editor",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Specialist",
  "Blockchain Developer",
  "Cybersecurity Analyst",
  "Ethical Hacker",
  "UX/UI Designer",
  "Content Strategist",
  "Social Media Manager",
  "Customer Support Representative",
  "Call Center Agent",
  "Receptionist",
  "Administrator",
  "House Maker"
];

const familyTypes = [
  "Traditional",
  "Moderate",
  "Liberal",
  "Nuclear",
  "Joint",
  "Diploma"
];

const familyStatuses = [
  "Middle Class",
  "Lower Middle Class",
  "Upper Middle Class",
  "Rich"
];

const siblingNumbers = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10"
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  section,
  onUpdate,
  refreshProfile,
}) => {
  const popup = usePopup();
  // This sheet sits flush against the bottom of the screen and the app is built edge-to-edge, so
  // without the inset the "Save Changes" button renders behind the device nav bar.
  const insets = useSafeAreaInsets();
  const { userData } = useUserData();
  const { getSubcastesForCaste } = useMasterData() || {};
  // Subcastes for the logged-in user's own caste. Empty today (the subcastes table is unseeded),
  // which is exactly why the 'Subcaste' case below hides the field rather than rendering an
  // empty picker the user can't do anything with.
  const subcasteOptions = React.useMemo(
    () => getSubcastesForCaste?.(userData?.casteId) || [],
    [getSubcastesForCaste, userData?.casteId]
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date()); // iOS spinner's in-progress value

  useEffect(() => {
    if (section?.data) {
      setFormData(section.data);
      setIsLoading(false);
    }
  }, [section]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({});
      setIsLoading(true);
    }
  }, [isOpen]);


  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    if (!section) return;

    // onUpdate (profile.tsx's handleEditUpdate) already awaits the save API call and THEN
    // calls refreshProfile itself once the save actually resolves. Calling refreshProfile()
    // again here — synchronously, before the save has even completed — fired a second,
    // unsequenced GET that raced the post-save one. Whichever response landed last simply
    // overwrote state, so on a normal mobile network the stale pre-save GET could easily
    // finish after the correct post-save one, silently reverting the screen to old data.
    onUpdate(formData);

    // Close the modal
    onClose();
  };

  if (!section || isLoading) return null;

  const renderItem = ({ item }: { item: [string, string] }) => {
    const [key, value] = item;
    const label = key;

    switch (label) {
      case 'Gender':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <TextInput
              defaultValue={value}
              editable={false}
              style={[styles.input, { backgroundColor: '#f3f4f6' }]}
            />
          </Box>
        );

      case 'Date of Birth': {
        // Mirrors sign-up.tsx's DOB picker exactly (same platform split, same validation, same
        // visual pattern) so editing your DOB later looks and behaves like setting it at signup.
        const parsedDate = value ? new Date(value) : null;
        const hasValidDate = !!parsedDate && !isNaN(parsedDate.getTime());
        const displayDate = hasValidDate ? moment(parsedDate).format('DD MMM YYYY') : '';

        const commitDate = (candidate: Date) => {
          if (candidate > new Date()) {
            popup.warning('Invalid Date', 'Date of birth cannot be a future date.');
            return;
          }
          const today = new Date();
          let age = today.getFullYear() - candidate.getFullYear();
          const monthDiff = today.getMonth() - candidate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < candidate.getDate())) age--;
          if (age < 18) {
            popup.warning('Age Restriction', 'You must be at least 18 years old.');
            return;
          }
          handleChange(key, candidate.toISOString().split('T')[0]);
        };

        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            >
              <Text style={{ color: hasValidDate ? '#130001' : '#999', fontSize: 14, fontFamily: 'Rubik-Regular' }}>
                {displayDate || 'Select Date'}
              </Text>
              <Ionicons name="calendar" size={18} color="#1F7FE5" />
            </TouchableOpacity>

            {/* Android: native dialog pops directly, no wrapping Modal — see sign-up.tsx's own
                comment for why double-wrapping this in a Modal causes a "picker reopens" bug. */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={hasValidDate ? (parsedDate as Date) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (event.type === 'set' && selectedDate) {
                    commitDate(selectedDate);
                  }
                }}
              />
            )}

            {/* iOS: inline spinner needs our own Modal + Confirm step to commit the value. */}
            {Platform.OS === 'ios' && (
              <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <View style={{ backgroundColor: '#fff', borderRadius: 12, width: '85%', overflow: 'hidden' }}>
                    <View style={{ padding: 0, alignItems: 'center', height: 250, justifyContent: 'center' }}>
                      <DateTimePicker
                        value={tempDate || (hasValidDate ? (parsedDate as Date) : new Date())}
                        mode="date"
                        display="spinner"
                        textColor="#0f1724"
                        themeVariant="dark"
                        maximumDate={new Date()}
                        style={{ backgroundColor: '#fff' }}
                        onChange={(event, selectedDate) => {
                          if (selectedDate) setTempDate(selectedDate);
                        }}
                      />
                    </View>
                    <View style={{ backgroundColor: '#fff', paddingVertical: 10, alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowDatePicker(false);
                          commitDate(tempDate);
                        }}
                        style={{ backgroundColor: '#1F7FE5', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 }}
                      >
                        <Text style={{ color: '#fff', fontFamily: 'Rubik-Bold' }}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </Box>
        );
      }

      case 'Marital Status':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={['Never Married', 'Married', 'Divorced', 'Separated', 'Widowed'].map(option => ({
                key: option,
                value: option
              }))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 }}
              dropdownStyles={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 }}
              inputStyles={{ fontSize: 14, color: '#130001' }}
            />
          </Box>
        );

      case 'Weight':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <TextInput
              placeholder={label}
              value={value}
              // Numbers only — no letters, no special characters.
              onChangeText={(text: string) => handleChange(key, text.replace(/[^0-9]/g, ''))}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={3}
            />
          </Box>
        );

      case 'Height':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label} "f.t"
            </Text>
            <SelectList
              data={Array.from({ length: 51 }, (_, i) => ({
                key: (3 + i * 0.1).toFixed(1),
                value: (3 + i * 0.1).toFixed(1)
              }))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 }}
              dropdownStyles={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 }}
              inputStyles={{ fontSize: 14, color: '#130001' }}
            />
          </Box>
        );

      case 'Mother Language':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={['Tamil', 'English', 'Malayalam', 'Telugu'].map(lang => ({
                key: lang,
                value: lang
              }))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 }}
              dropdownStyles={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 }}
              inputStyles={{ fontSize: 14, color: '#130001' }}
            />
          </Box>
        );

      case 'Physical Status':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={['Normal', 'Handicapped'].map(option => ({
                key: option,
                value: option
              }))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 }}
              dropdownStyles={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 }}
              inputStyles={{ fontSize: 14, color: '#130001' }}
            />
          </Box>
        );

      case 'Religion':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <TextInput
              defaultValue={value}
              editable={false}
              style={[styles.input, { backgroundColor: '#f3f4f6' }]}
            />
          </Box>
        );

      case 'Caste':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <TextInput
              defaultValue={value}
              editable={false}
              style={[styles.input, { backgroundColor: '#f3f4f6' }]}
            />
          </Box>
        );

      // Subcaste must be a picker, never free text — a typo'd subcaste would be unfilterable in
      // search. When the user's caste has no subcastes configured the field is hidden entirely
      // rather than showing an empty dropdown that leads nowhere.
      case 'Subcaste': {
        if (!subcasteOptions.length) return null;
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={subcasteOptions.map((sc: any) => ({
                key: String(sc.id),
                value: sc.subcasteName,
              }))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={value ? { key: value, value } : undefined}
              placeholder="Select subcaste"
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );
      }

      case 'Star':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={stars.map(star => ({ key: star, value: star } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'Moon Sign':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={moonsigns.map(sign => ({ key: sign, value: sign } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'Dosham':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={doshams.map(dosham => ({ key: dosham, value: dosham } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'Education':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={educationList.map(edu => ({ key: edu, value: edu } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'Occupation':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={occupationList.map(occ => ({ key: occ, value: occ } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'Employing In':
        const employmentOptions = [
          { key: 'Private', value: 'Private' },
          { key: 'Government', value: 'Government' },
          { key: 'Self Employment', value: 'Self Employment' }
        ];

        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              setSelected={(val: string) => handleChange(key, val)}
              data={employmentOptions}
              save="value"
              defaultOption={{ key: value, value: value }}
              search={false}
              boxStyles={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 }}
              dropdownStyles={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 }}
              inputStyles={{ fontSize: 14 }}
            />
          </Box>
        );

      case 'Annual Income':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={annualIncomes.map(income => ({ key: income, value: income } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'Family Type':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={familyTypes.map(type => ({ key: type, value: type } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'Family Status':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={familyStatuses.map(status => ({ key: status, value: status } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'Fathers Occupation':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={occupationList.map(occ => ({ key: occ, value: occ } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'Mothers Occupation':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={occupationList.map(occ => ({ key: occ, value: occ } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'No of Siblings':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <SelectList
              data={siblingNumbers.map(num => ({ key: num, value: num } as const))}
              setSelected={(val: string) => handleChange(key, val)}
              save="value"
              defaultOption={{ key: value, value: value }}
              boxStyles={styles.input}
              inputStyles={styles.inputText}
              dropdownStyles={styles.dropdownBox}
              dropdownTextStyles={styles.dropdownText}
            />
          </Box>
        );

      case 'First Name':
      case 'Last Name':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <TextInput
              placeholder={label}
              value={value}
              // Letters only — no spaces, no special characters. Controlled (value, not
              // defaultValue) so a blocked character never visibly appears even for a frame.
              onChangeText={(text: string) => handleChange(key, text.replace(/[^A-Za-z]/g, ''))}
              style={styles.input}
              autoCapitalize="words"
            />
          </Box>
        );

      case 'Current Address':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <TextInput
              placeholder={label}
              defaultValue={value}
              onChangeText={(text: string) => handleChange(key, text)}
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              multiline
              numberOfLines={3}
            />
          </Box>
        );

      case 'Education in Detail':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg" mb="3">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <TextInput
              placeholder={label}
              value={value}
              // Letters, numbers and spaces only — no special characters/symbols. Numbers stay
              // allowed (years like 2019, percentages like 85), unlike Name/Job Place.
              onChangeText={(text: string) => handleChange(key, text.replace(/[^A-Za-z0-9\s]/g, ''))}
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              multiline
              numberOfLines={3}
            />
          </Box>
        );

      case 'Job Place':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <TextInput
              placeholder={label}
              value={value}
              // Letters and spaces only — no special characters or digits, same rule as
              // First/Last Name but allowing spaces since place names can be multi-word.
              onChangeText={(text: string) => handleChange(key, text.replace(/[^A-Za-z\s]/g, ''))}
              style={styles.input}
            />
          </Box>
        );

      case 'No of Brothers':
      case 'No of Sisters':
      case 'Brother Married':
      case 'Sister Married':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <TextInput
              placeholder={label}
              value={value}
              // Numbers only — no letters, no special characters. Controlled so a blocked
              // character never visibly appears, same pattern as First/Last Name above.
              // Capped to a single digit (0-9) — nobody has 10+ siblings in the same category.
              onChangeText={(text: string) => handleChange(key, text.replace(/[^0-9]/g, ''))}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={1}
            />
          </Box>
        );

      default:
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text mb="1" style={{ fontSize: 12, fontFamily: 'Rubik-Bold', color: '#0f1724', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {label}
            </Text>
            <TextInput
              placeholder={label}
              defaultValue={value}
              onChangeText={(text: string) => handleChange(key, text)}
              style={styles.input}
            />
          </Box>
        );
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Box style={styles.modalContainer}>
            <Box style={[styles.modalContent, { paddingBottom: Math.max(16, insets.bottom + 16) }]}>
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                {/* Font via style, not the bare fontFamily/fontWeight props — see the NativeBase
                    landmine in CLAUDE.md section 17 (Android drops the custom font otherwise). */}
                <Text style={{ fontSize: 16, fontFamily: 'Rubik-Bold', color: '#0f1724' }}>
                  {section.title}
                </Text>
                <EIcon name="cross" size={28} color="#6b7280" onPress={onClose} />
              </HStack>

              <Divider my={2} height="2px" bg="coolGray.200" />

              <FlatList
                data={Object.entries(formData)}
                keyExtractor={([key]) => key}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              />

              {/* Gradient pill CTA, matching the register/login primary button. Was a NativeBase
                  <Button> whose label went through the `_text` prop — NativeBase injects a default
                  fontWeight there, which is the same combination that silently drops the custom
                  Rubik font on Android (CLAUDE.md section 17). A plain Text inside a
                  TouchableOpacity avoids that path entirely. */}
              <VStack space={2} mt={3} justifyContent="center" alignItems="center">
                <TouchableOpacity
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  style={{ width: '100%' }}
                >
                  <LinearGradient
                    colors={['#5AA7EF', '#1F7FE5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 52,
                      borderRadius: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#1F7FE5',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.22,
                      shadowRadius: 10,
                      elevation: 3,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Rubik-Bold', letterSpacing: 0.2 }}>
                      Save Changes
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </VStack>
            </Box>
          </Box>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditProfileModal;

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    width: '100%',
    maxHeight: '80%',
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Matches the register form's field spec exactly (sign-up.tsx `input`): same border, radius,
  // typography and blue-tinted lift. These fields previously used a heavier #D1D5DB border and
  // no font family, so the profile edit sheet read as a different form system from signup.
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
  inputText: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#333',
  },
  dropdownBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#333',
  },
});
