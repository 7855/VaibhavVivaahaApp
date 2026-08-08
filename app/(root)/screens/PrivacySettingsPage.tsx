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
          // Create hidden field if it's being hidden — but only if it isn't already hidden.
          // Without this guard, toggling hide on twice (or a double-tap firing the confirm
          // handler twice) inserted a second identical row every time, since createHiddenField
          // has no server-side uniqueness check of its own.
          if (!field) {
            await userApi.createHiddenField(userId, pendingChange.key);
          }
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
        trackColor={{ false: '#e2e8f0', true: '#1F7FE5' }}
        thumbColor={'#fff'}
      />
    </View>
  );

  return (
    <NativeBaseProvider>

      <SafeAreaView edges={['right', 'left', 'top']} className="" style={{ backgroundColor: '#f3f7fa', marginBottom: 0, paddingBottom: 0, marginTop: 0 }}>
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
          <Feather name="shield" size={28} color="#1F7FE5" />
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
            <Feather name="phone" size={20} color="#1F7FE5" />,
            'Mobile Number',
            'Hide your mobile number until you choose to share it',
            privacySettings.mobileNumber,
            'mobileNumber'
          )}
          {renderPrivacyItem(
            <Feather name="image" size={20} color="#1F7FE5" />,
            'Profile Image',
            'Visible only to premium members or connections',
            privacySettings.profileImage,
            'profileImage'
          )}
          {renderPrivacyItem(
            <Feather name="star" size={20} color="#1F7FE5" />,
            'Horoscope Details',
            'Keep your astrological information private',
            privacySettings.horoscope,
            'horoscope'
          )}
          {/* {renderPrivacyItem(
        <Feather name="calendar" size={20} color="#1F7FE5" />,
        'Age Information',
        'Show only age range instead of exact age',
        privacySettings.age,
        'age'
      )}
      {renderPrivacyItem(
        <Feather name="briefcase" size={20} color="#1F7FE5" />,
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
                  <Feather name="shield" size={24} color="#1F7FE5" />
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
  container: { padding: 16, backgroundColor: '#f3f7fa', marginBottom: 16, height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: {
    marginRight: 12,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 999,
  },
  // topbarTitle scale — matches profile.tsx/settingsPage.tsx's page-level title (20px Rubik-Bold,
  // ink, tight tracking) instead of the previous 18px Medium/one-off color.
  headerTitle: { fontSize: 20, fontFamily: 'Rubik-Bold', color: '#0f1724', letterSpacing: -0.4 },
  headerSubtitle: { color: '#64748b', fontSize: 12, fontFamily: 'Rubik-Regular', marginTop: 3 },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#dfecfb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  shieldIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#c8dff5',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTitle: { fontFamily: 'Rubik-Bold', color: '#0f1724', marginBottom: 4 },
  infoDescription: { color: '#475569', marginBottom: 8 },
  bullet: { color: '#1F7FE5', fontSize: 13 },
  // sectionTitle scale — matches profile.tsx's section headers (16px Rubik-Bold, ink, -0.3 tracking)
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
    letterSpacing: -0.3,
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
    borderColor: '#e2e8f0',
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#dfecfb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  // listCardTitle/listCardSub scale — matches settingsPage.tsx's row typography
  title: { fontSize: 15, fontFamily: 'Rubik-Bold', color: '#0f1724', letterSpacing: -0.2 },
  description: { color: '#64748b', fontSize: 12.5, fontFamily: 'Rubik-Regular', marginTop: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    backgroundColor: '#dfecfb',
    padding: 12,
    borderRadius: 50,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  modalText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginVertical: 12 },
  modalActions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1F7FE5',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelText: { color: '#475569', fontFamily: 'Rubik-Bold', fontSize: 13.5 },
  confirmText: { color: '#fff', fontFamily: 'Rubik-Bold', fontSize: 13.5 },
});
