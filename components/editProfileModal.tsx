import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,

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
  Button,
  Box,
  Divider
} from 'native-base';
import { SelectList } from 'react-native-dropdown-select-list';
import DateTimePicker from '@react-native-community/datetimepicker';
import EIcon from '@expo/vector-icons/Entypo';

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
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    
    // Update parent component
    onUpdate(formData);
    
    // Refresh profile data
    if (refreshProfile) {
      refreshProfile();
    }
    
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
              {label}
            </Text>
            <TextInput
              defaultValue={value}
              editable={false}
              style={[styles.input, { backgroundColor: '#f3f4f6' }]}
            />
          </Box>
        );

      case 'Date of Birth':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text fontSize="sm" fontWeight="semibold" mb="1">
              {label}
            </Text>
            <View>
              <TextInput
                placeholder="YYYY-MM-DD"
                defaultValue={value}
                style={styles.input}
                onPressIn={() => setShowDatePicker(true)}
              />
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(value)}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const formattedDate = selectedDate.toISOString().split('T')[0];
                      handleChange(key, formattedDate);
                    }
                  }}
                />
              )}
            </View>
          </Box>
        );

      case 'Marital Status':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
              inputStyles={{ fontSize: 14, color: '#1F2937' }}
            />
          </Box>
        );

      case 'Height':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
              inputStyles={{ fontSize: 14, color: '#1F2937' }}
            />
          </Box>
        );

      case 'Mother Language':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
              inputStyles={{ fontSize: 14, color: '#1F2937' }}
            />
          </Box>
        );

      case 'Physical Status':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
              inputStyles={{ fontSize: 14, color: '#1F2937' }}
            />
          </Box>
        );

      case 'Religion':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
              {label}
            </Text>
            <TextInput
              defaultValue={value}
              editable={false}
              style={[styles.input, { backgroundColor: '#f3f4f6' }]}
            />
          </Box>
        );

      case 'Star':
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
              <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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

      default:
        return (
          <Box key={key} bg="white" p="1" rounded="lg" shadow="lg">
            <Text fontSize="sm" fontWeight="semibold" mb="1">
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
            <Box style={styles.modalContent}>
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                  {section.title}
                </Text>
                <HStack space={5}>
                  <EIcon name="cross" size={28} color="coolGray.600" onPress={onClose} />
                  <EIcon name="check" size={25} color="coolGray.600" onPress={handleSubmit} />
                </HStack>
              </HStack>

              <Divider my={2} height="2px" bg="coolGray.200" />

              <FlatList
                data={Object.entries(formData)}
                keyExtractor={([key]) => key}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              />

              <VStack space={2} mt={2} justifyContent="center" alignItems="center">
                <Button
                  width="50%"
                  onPress={handleSubmit}
                  bg="primary.500"
                  borderRadius="lg"
                  _text={{ color: "white" }}
                  _pressed={{ bg: "primary.600" }}
                >
                  Save Changes
                </Button>
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
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 48,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  inputText: {
    fontSize: 14,
    color: '#1F2937',
  },
  dropdownBox: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1F2937',
  },
});
