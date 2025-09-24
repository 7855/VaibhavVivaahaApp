import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../api/axiosClient';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Feather,
  MaterialIcons,
  FontAwesome,
  Ionicons,
  Entypo,
} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeBaseProvider } from 'native-base';
import userApi from '../api/userApi';

interface PrivacySettings {
  mobileNumber: boolean;
  profileImage: boolean;
  horoscope: boolean;
  profileVisibility: boolean;
  lastSeen: boolean;
  location: boolean;
  profession: boolean;
  age: boolean;
  contactInfo: boolean;
}

interface HiddenField {
  id: number;
  userId: number;
  fieldName: string;
  createdAt: string;
  updatedAt: string;
}

// Type for the response data array
interface HiddenFieldData {
  id: number;
  userId: number;
  fieldName: string;
  createdAt: string;
  updatedAt: string;
}

interface HiddenFieldsResponse {
  code: number;
  status: string;
  message: string;
  data: {
    id: number;
    userId: number;
    fieldName: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

const PrivacySettingsPage: React.FC = () => {
  const navigation = useNavigation();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    mobileNumber: false,
    profileImage: false,
    horoscope: false,
    profileVisibility: true,
    lastSeen: true,
    location: false,
    profession: true,
    age: true,
    contactInfo: false,
  });

  useEffect(() => {
    const loadHiddenFields = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          const decodedUserId = atob(userId);
          const response = await userApi.getHiddenFieldsByUserId(decodedUserId);
          const hiddenFields = response.data.data || [];
          
          // Extract field names from the response
          const fieldNames = hiddenFields.map((field: HiddenFieldData) => field.fieldName);
          
          // Update privacy settings based on hidden fields
          const updatedSettings = {
            ...privacySettings,
            mobileNumber: fieldNames.includes('mobileNumber'),
            profileImage: fieldNames.includes('profileImage'),
            horoscope: fieldNames.includes('horoscope')
          };
          
          setPrivacySettings(updatedSettings);
        }
      } catch (error) {
        console.error('Error loading hidden fields:', error);
      }
    };

    loadHiddenFields();
  }, []);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    key: keyof PrivacySettings;
    value: boolean;
  } | null>(null);

  const handlePrivacyToggle = (setting: keyof PrivacySettings) => {
    const newValue = !privacySettings[setting];
    setPendingChange({ key: setting, value: newValue });
    setModalVisible(true);
  };

  const confirmPrivacyChange = async () => {
    if (pendingChange) {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          console.error('User ID not found in AsyncStorage');
          return;
        }

        const decodedUserId = atob(userId);
        // Get current hidden fields to find the ID if we need to delete
        const response = await userApi.getHiddenFieldsByUserId(decodedUserId);
        const hiddenFields = response.data.data || [];
        const field = hiddenFields.find((f: HiddenFieldData) => f.fieldName === pendingChange.key);

        if (pendingChange.value) {
          // Create hidden field if it's being hidden
          await userApi.createHiddenField(userId, pendingChange.key);
        } else if (field) {
          // Delete hidden field if it's being unhidden
          await userApi.deleteHiddenField(field.id);
        }

        setPrivacySettings((prev) => ({
          ...prev,
          [pendingChange.key]: pendingChange.value,
        }));
        setModalVisible(false);
        setPendingChange(null);
      } catch (error) {
        console.error('Error updating privacy settings:', error);
        // You might want to show an error message to the user
      }
    }
  };

  const cancelPrivacyChange = () => {
    setModalVisible(false);
    setPendingChange(null);
  };

  const renderPrivacyItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    checked: boolean,
    setting: keyof PrivacySettings
  ) => (
    <View style={styles.privacyItem}>
      <View style={styles.iconBox}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        value={checked}
        onValueChange={() => handlePrivacyToggle(setting)}
        trackColor={{ false: '#ccc', true: '#dc2626' }}
        thumbColor={checked ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <NativeBaseProvider>

    <SafeAreaView edges={['right', 'left', 'top']} className="" style={{ backgroundColor: '#130057', marginBottom: 0, paddingBottom: 0, marginTop: 0 }}>
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity> */}
        <View>
          <Text style={styles.headerTitle}>Privacy Settings</Text>
          <Text style={styles.headerSubtitle}>Control what others can see</Text>
        </View>
      </View>

      {/* <View style={styles.infoBox}>
        <View style={styles.shieldIcon}>
          <Feather name="shield" size={28} color="#dc2626" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Why Privacy Settings Matter</Text>
          <Text style={styles.infoDescription}>
            These settings help you manage what others can view in your profile.
            Share only what you're comfortable with.
          </Text>
          <Text style={styles.bullet}>• Build trust gradually</Text>
          <Text style={styles.bullet}>• Protect personal information</Text>
          <Text style={styles.bullet}>• Control visibility when ready</Text>
        </View>
      </View> */}

      {/* Privacy Items */}
      <Text style={styles.sectionTitle}>Profile Information</Text>
      {renderPrivacyItem(
        <Feather name="phone" size={20} color="#dc2626" />,
        'Mobile Number',
        'Hide your mobile number until you choose to share it',
        privacySettings.mobileNumber,
        'mobileNumber'
      )}
      {renderPrivacyItem(
        <Feather name="image" size={20} color="#dc2626" />,
        'Profile Image',
        'Visible only to premium members or connections',
        privacySettings.profileImage,
        'profileImage'
      )}
      {renderPrivacyItem(
        <Feather name="star" size={20} color="#dc2626" />,
        'Horoscope Details',
        'Keep your astrological information private',
        privacySettings.horoscope,
        'horoscope'
      )}
      {/* {renderPrivacyItem(
        <Feather name="calendar" size={20} color="#dc2626" />,
        'Age Information',
        'Show only age range instead of exact age',
        privacySettings.age,
        'age'
      )}
      {renderPrivacyItem(
        <Feather name="briefcase" size={20} color="#dc2626" />,
        'Professional Details',
        'Hide workplace and salary info',
        privacySettings.profession,
        'profession'
      )} */}

      {/* <Text style={styles.sectionTitle}>Activity & Visibility</Text>
      {renderPrivacyItem(
        <Feather name="eye" size={20} color="#ec4899" />,
        'Profile Visibility',
        'Control if your profile appears in results',
        privacySettings.profileVisibility,
        'profileVisibility'
      )}
      {renderPrivacyItem(
        <Feather name="eye-off" size={20} color="#ec4899" />,
        'Last Seen Status',
        'Hide your last active time',
        privacySettings.lastSeen,
        'lastSeen'
      )}
      {renderPrivacyItem(
        <Feather name="map-pin" size={20} color="#ec4899" />,
        'Location',
        'Show only city/state',
        privacySettings.location,
        'location'
      )}
      {renderPrivacyItem(
        <Feather name="user" size={20} color="#ec4899" />,
        'Contact Info',
        'Restrict email and contact info',
        privacySettings.contactInfo,
        'contactInfo'
      )} */}

      {/* Confirmation Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Feather name="shield" size={24} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>Confirm Privacy Change</Text>
            <Text style={styles.modalText}>
              Are you sure you want to update this privacy setting?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={cancelPrivacyChange}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmPrivacyChange}
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </SafeAreaView>
    </NativeBaseProvider>
  );
};

export default PrivacySettingsPage;

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', marginBottom: 16,height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: {
    marginRight: 12,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 999,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { color: '#6b7280',fontSize: 13,marginTop: 3 },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  shieldIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#fee2e2',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTitle: { fontWeight: 'bold', color: '#991b1b', marginBottom: 4 },
  infoDescription: { color: '#b91c1c', marginBottom: 8 },
  bullet: { color: '#dc2626', fontSize: 13 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 10,
    marginBottom: 12,
  },
  privacyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { fontWeight: '600', color: '#111827' },
  description: { color: '#6b7280', fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 50,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  modalText: { color: '#6b7280', textAlign: 'center', marginVertical: 12 },
  modalActions: { flexDirection: 'row', marginTop: 12 },
  cancelBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#374151' },
  confirmText: { color: 'white', fontWeight: 'bold' },
});
