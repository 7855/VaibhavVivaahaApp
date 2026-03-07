import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
const StarMatch = () => {
  const [activeTab, setActiveTab] = useState<'bride' | 'groom'>('bride');
  const [formData, setFormData] = useState({
    bride: {
      name: '',
      dob: '',
      time: { hour: '12', minute: '00', period: 'AM' },
      place: '',
      star: '',
      rasi: ''
    },
    groom: {
      name: '',
      dob: '',
      time: { hour: '12', minute: '00', period: 'AM' },
      place: '',
      star: '',
      rasi: ''
    }
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStarModal, setShowStarModal] = useState(false);
  const [showRasiModal, setShowRasiModal] = useState(false);
  const [showStarPicker, setShowStarPicker] = useState(false);
  const [showRasiPicker, setShowRasiPicker] = useState(false);
  // Data for dropdowns
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')); const periods = ['AM', 'PM'];
  // Star and Rasi data from StarMatchForm.tsx
  const starData = [
    { key: '1', value: 'Aswini' },
    { key: '2', value: 'Bharani' },
    { key: '3', value: 'Krithikai' },
    { key: '4', value: 'Rohini' },
    { key: '5', value: 'Mirugasiridham' },
    { key: '6', value: 'Thiruvathirai' },
    { key: '7', value: 'Punarpusam' },
    { key: '8', value: 'Poosam' },
    { key: '9', value: 'Ayilyam' },
    { key: '10', value: 'Magam' },
    { key: '11', value: 'Pooram' },
    { key: '12', value: 'Uthiram' },
    { key: '13', value: 'Hastham' },
    { key: '14', value: 'Chithirai' },
    { key: '15', value: 'Swathi' },
    { key: '16', value: 'Visagam' },
    { key: '17', value: 'Anusham' },
    { key: '18', value: 'Kettai' },
    { key: '19', value: 'Moolam' },
    { key: '20', value: 'Pooradam' },
    { key: '21', value: 'Uthiradam' },
    { key: '22', value: 'Thiruvonam' },
    { key: '23', value: 'Avittam' },
    { key: '24', value: 'Sathayam' },
    { key: '25', value: 'Poorattathi' },
    { key: '26', value: 'Uthirattathi' },
    { key: '27', value: 'Revathi' }
  ];

  const rasiData = [
    { key: '1', value: 'Mesham' },
    { key: '2', value: 'Rishabam' },
    { key: '3', value: 'Mithunam' },
    { key: '4', value: 'Kadagam' },
    { key: '5', value: 'Simmam' },
    { key: '6', value: 'Kanni' },
    { key: '7', value: 'Thulam' },
    { key: '8', value: 'Viruchagam' },
    { key: '9', value: 'Dhanusu' },
    { key: '10', value: 'Makaram' },
    { key: '11', value: 'Kumbam' },
    { key: '12', value: 'Meenam' }
  ];

  const handleStarSelect = (star: string) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], star }
    }));
    setShowStarModal(false);
  };
  const handleRasiSelect = (rasi: string) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], rasi }
    }));
    setShowRasiModal(false);
  };

  const handleTimeChange = (type: 'hour' | 'minute' | 'period', value: string) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        time: {
          ...prev[activeTab].time,
          [type]: value
        }
      }
    }));
  };
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dob = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], dob }
      }));
      // Check if under 18
      const today = new Date();
      let age = today.getFullYear() - selectedDate.getFullYear();
      const monthDiff = today.getMonth() - selectedDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
        age--;
      }
      if (age < 18) {
        Alert.alert(
          'Age Restriction',
          'Selected age is below 18 years.',
          [{ text: 'OK' }]
        );
      }
    }
  };
  const renderTimePicker = () => (
    <View style={styles.timePickerContainer}>
      <View style={styles.timePickerRow}>
        {/* Hours */}
        <View style={styles.timePickerColumn}>
          <Text style={styles.timePickerLabel}>Hour</Text>
          <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
            {hours.map(hour => (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.timePickerItem,
                  formData[activeTab].time.hour === hour && styles.timePickerItemActive
                ]}
                onPress={() => handleTimeChange('hour', hour)}
              >
                <Text style={[
                  styles.timePickerText,
                  formData[activeTab].time.hour === hour && styles.timePickerTextActive
                ]}>
                  {hour}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Minutes */}
        <View style={styles.timePickerColumn}>
          <Text style={styles.timePickerLabel}>Minute</Text>
          <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
            {minutes.map(minute => (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.timePickerItem,
                  formData[activeTab].time.minute === minute && styles.timePickerItemActive
                ]}
                onPress={() => handleTimeChange('minute', minute)}
              >
                <Text style={[
                  styles.timePickerText,
                  formData[activeTab].time.minute === minute && styles.timePickerTextActive
                ]}>
                  {minute}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* AM/PM */}
        <View style={styles.timePickerColumn}>
          <Text style={styles.timePickerLabel}>Period</Text>
          <View style={styles.periodContainer}>
            {periods.map(period => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  formData[activeTab].time.period === period && styles.periodButtonActive
                ]}
                onPress={() => handleTimeChange('period', period)}
              >
                <Text style={[
                  styles.periodText,
                  formData[activeTab].time.period === period && styles.periodTextActive
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

const handleSubmit = async () => {
  try {
    // Transform the form data to match the required API format
    const formatTime = (time: { hour: string, minute: string, period: string }) => {
      let hour = parseInt(time.hour, 10);
      if (time.period === 'PM' && hour < 12) {
        hour += 12;
      } else if (time.period === 'AM' && hour === 12) {
        hour = 0;
      }
      return `${hour.toString().padStart(2, '0')}:${time.minute}`;
    };

    const requestData = {
      bride: {
        name: formData.bride.name,
        dob: formData.bride.dob,
        tob: formatTime(formData.bride.time),
        place: formData.bride.place,
        star: formData.bride.star,
        rasi: formData.bride.rasi.toLowerCase() // Convert to lowercase if needed
      },
      groom: {
        name: formData.groom.name,
        dob: formData.groom.dob,
        tob: formatTime(formData.groom.time),
        place: formData.groom.place,
        star: formData.groom.star,
        rasi: formData.groom.rasi.toLowerCase() // Convert to lowercase if needed
      }
    };

    console.log("Submitting data:", JSON.stringify(requestData, null, 2));
    
    // Uncomment and use this when you're ready to navigate
    router.push({
      pathname: '/(root)/screens/StarMatchResult',
      params: {
        formData: JSON.stringify(requestData)
      }
    });

    // Here you would typically make your API call
    // const response = await yourApiService.submitMatchRequest(requestData);
    // Handle response...

  } catch (error) {
    console.error('Error submitting form:', error);
    Alert.alert('Error', 'Failed to submit the form. Please try again.');
  }
};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity style={styles.backButton}> */}
          {/* <MaterialIcons name="arrow-back-ios" size={24} color="#0f52ba" /> */}
        {/* </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Star Match</Text>
        {/* <View style={{ width: 24 }} /> */}
      </View>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bride' && styles.activeTab]}
          onPress={() => setActiveTab('bride')}
        >
          <Text style={[styles.tabText, activeTab === 'bride' && styles.activeTabText]}>Bride</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groom' && styles.activeTab]}
          onPress={() => setActiveTab('groom')}
        >
          <Text style={[styles.tabText, activeTab === 'groom' && styles.activeTabText]}>Groom</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Name Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${activeTab}'s name`}
            value={formData[activeTab].name}
            onChangeText={text => setFormData(prev => ({
              ...prev,
              [activeTab]: { ...prev[activeTab], name: text }
            }))}
            placeholderTextColor="#94a3b8"
          />
        </View>
        {/* Date of Birth */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>DATE OF BIRTH</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.inputText, !formData[activeTab].dob && { color: '#94a3b8' }]}>
              {formData[activeTab].dob || 'DD / MM / YYYY'}
            </Text>
            <MaterialIcons name="calendar-today" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        {/* Time of Birth */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>TIME OF BIRTH</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.inputText}>
              {`${formData[activeTab].time.hour} : ${formData[activeTab].time.minute} ${formData[activeTab].time.period}`}
            </Text>
            <MaterialIcons name="access-time" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        {/* Place of Birth */}
        {/* <View style={styles.inputContainer}>
          <Text style={styles.label}>PLACE OF BIRTH</Text>
          <View style={styles.inputWithIcon}>
            <MaterialIcons name="location-on" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingLeft: 40 }]}
              placeholder="Search city or town"
              value={formData[activeTab].place}
              onChangeText={text => setFormData(prev => ({
                ...prev,
                [activeTab]: { ...prev[activeTab], place: text }
              }))}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View> */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>PLACE OF BIRTH</Text>
          <TextInput
            style={styles.input}
            placeholder="Search city or town"
            value={formData[activeTab].place}
            onChangeText={text => setFormData(prev => ({
              ...prev,
              [activeTab]: { ...prev[activeTab], place: text }
            }))}
            placeholderTextColor="#94a3b8"
          />
        </View>
        {/* Star and Rasi Row */}
        <View style={styles.row}>
          {/* Star */}
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>STAR (NAKSHATRA)</Text>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowStarModal(true)}
            >
              <Text style={[styles.inputText, !formData[activeTab].star && { color: '#94a3b8' }]}>
                {formData[activeTab].star || 'Select Star'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          {/* Rasi */}
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.label}>RASI (MOON SIGN)</Text>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowRasiModal(true)}
            >
              <Text style={[styles.inputText, !formData[activeTab].rasi && { color: '#94a3b8' }]}>
                {formData[activeTab].rasi || 'Select Rasi'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <MaterialIcons name="stars" size={24} color="#fff" />
          <Text style={styles.submitButtonText}>Check Compatibility</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time of Birth</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <MaterialIcons name="close" size={24} color="#0f52ba" />
              </TouchableOpacity>
            </View>
            {renderTimePicker()}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <MaterialIcons name="close" size={24} color="#0f52ba" />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={formData[activeTab].dob ? new Date(formData[activeTab].dob) : new Date()}
              mode="date"
              display="spinner"
              textColor="#130057"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Star Selection Modal */}
      <Modal
        visible={showStarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Star (Nakshatra)</Text>
              <TouchableOpacity onPress={() => setShowStarModal(false)}>
                <MaterialIcons name="close" size={24} color="#0f52ba" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {starData.map((star) => (
                <TouchableOpacity
                  key={star.key}
                  style={[
                    styles.modalItem,
                    formData[activeTab].star === star.value && styles.modalItemActive
                  ]}
                  onPress={() => handleStarSelect(star.value)}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData[activeTab].star === star.value && styles.modalItemTextActive
                  ]}>
                    {star.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rasi Selection Modal */}
      <Modal
        visible={showRasiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRasiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Rasi (Moon Sign)</Text>
              <TouchableOpacity onPress={() => setShowRasiModal(false)}>
                <MaterialIcons name="close" size={24} color="#0f52ba" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {rasiData.map((rasi) => (
                <TouchableOpacity
                  key={rasi.key}
                  style={[
                    styles.modalItem,
                    formData[activeTab].rasi === rasi.value && styles.modalItemActive
                  ]}
                  onPress={() => handleRasiSelect(rasi.value)}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData[activeTab].rasi === rasi.value && styles.modalItemTextActive
                  ]}>
                    {rasi.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#420001',
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    padding: 4,
    marginBottom:8
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 999,
  },
  activeTab: {
    backgroundColor: '#420001',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f1a2e',
    height: 56,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#0f1a2e',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: 0,
  },
  submitButton: {
    backgroundColor: '#420001',
    borderRadius: 999,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#0f52ba',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f1a2e',
  },
  timePickerContainer: {
    marginTop: 16,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  timePickerScroll: {
    maxHeight: 200,
  },
  timePickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  timePickerItemActive: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  timePickerText: {
    fontSize: 18,
    color: '#64748b',
  },
  timePickerTextActive: {
    color: '#0f52ba',
    fontWeight: 'bold',
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  periodTextActive: {
    color: '#0f52ba',
  },
  doneButton: {
    backgroundColor: '#0f52ba',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    height: 56,
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  // modalTitle: {
  //   fontSize: 18,
  //   fontWeight: 'bold',
  //   color: '#0f1a2e',
  // },
  modalScrollView: {
    maxHeight: 400,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemActive: {
    backgroundColor: '#f8fafc',
  },
  modalItemText: {
    fontSize: 16,
    color: '#334155',
  },
  modalItemTextActive: {
    color: '#0f52ba',
    fontWeight: '600',
  },
});

export default StarMatch;