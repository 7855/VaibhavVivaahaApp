import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeBaseProvider, Text as NBText, HStack, VStack, useToast } from 'native-base';
import {
  Ionicons,
  MaterialIcons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import MaterialDesignIcons from '@expo/vector-icons/MaterialCommunityIcons';
// import AntDesign from '@expo/vector-icons/AntDesign';

import { router } from 'expo-router';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../api/userApi';

interface PrivacySettings {
  allowMessages?: boolean;
  showProfile?: boolean;
}

const SettingsPage: React.FC = () => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    allowMessages: true,
    showProfile: true,
  });

  const { logout } = useAuth();
  const toast = useToast();

  const handleLogout = useCallback(async () => {
    try {
      const userIdRemove =await AsyncStorage.getItem('userId');
      const fcmToken =await AsyncStorage.getItem('fcmToken');
      console.log("userIdRemove", userIdRemove);
      console.log("fcmToken", fcmToken);

      if (userIdRemove != null && fcmToken != null) {
        const requestBody = {
          userId: userIdRemove,
          fcmToken: fcmToken
        }
        console.log("requestBody", requestBody);
        await userApi.deleteDevice(requestBody);
      }
      await logout();

      toast.show({
        title: 'Logout Successful',
        duration: 2000,
      });
      router.replace('/(root)/(main)');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.show({
        title: 'Logout failed',
        duration: 2000,
      });
    }
  }, [logout, toast]);

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>{icon}</View>
        <View>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View>{rightElement ?? <Ionicons name="chevron-forward" size={20} color="#9ca3af" />}</View>
    </TouchableOpacity>
  );

  return (
    <NativeBaseProvider>
      {/* <SafeAreaView > */}
        <ScrollView>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="settings" size={28} color="white" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
        </View>
      </View>

      {/* Account Settings */}
      <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={styles.sectionIcon}>
          <MaterialDesignIcons name="account-cog" size={16} color="#dc2626" />
        </View>
        <Text style={styles.sectionTitleText}>Account Settings</Text>
      </View>
      <SettingItem
        icon={<MaterialIcons name="security" size={20} color="#e11d48" />}
        title="Privacy Settings"
        subtitle="Control what others can see"
        onPress={() => router.push('/screens/PrivacySettingsPage')}
      />
      <SettingItem
        icon={<Ionicons name="lock-closed" size={20} color="#e11d48" />}
        title="Change PIN"
        subtitle="Update your security PIN"
        onPress={() => router.push('/screens/SettingPageChangePin')}
      />
      <SettingItem
        icon={<MaterialCommunityIcons name="crown" size={20} color="#eab308" />}
        title="Upgrade Now"
        subtitle="Get premium features"
        onPress={() => router.push('/screens/PremiumTab')}
        rightElement={
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        }
      />

      {/* Community Settings */}
      <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={styles.sectionIcon}>
        <MaterialCommunityIcons name="account-group" size={16} color="#dc2626" />
        </View>
        <Text style={styles.sectionTitleText}>Community Settings</Text>
      </View>
      {/* <Text style={styles.sectionTitle}>
        <View style={[styles.sectionIcon, { backgroundColor: '#fce7f3' }]}>
          <Ionicons name="people" size={16} color="#db2777" />
        </View>
        Community Settings
      </Text> */}
      <SettingItem
        icon={<Ionicons name="people" size={20} color="#e11d48" />}
        title="Your Connections"
        subtitle="View and manage connections"
        onPress={() => router.push('/screens/ListUser?type=connection')}
      />
          <SettingItem
            icon={<Ionicons name="eye" size={20} color="#e11d48" />}
            title="Viewed You"
            subtitle="See who viewed your profile"
            onPress={() => router.push('/screens/ListUser?type=viewed')}
          />

          <SettingItem
            icon={<Ionicons name="heart" size={20} color="#e11d48" />}
            title="Shortlisted Profiles"
            subtitle="Your saved profiles"
            onPress={() => router.push('/screens/ListUser?type=shortlisted')}
          />


      {/* Others */}
      <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={styles.sectionIcon}>
        <FontAwesome5 name="cogs" size={16} color="#dc2626" />
        </View>
        <Text style={styles.sectionTitleText}>Others</Text>
      </View>
      {/* <Text style={styles.sectionTitle}>
        <View style={[styles.sectionIcon, { backgroundColor: '#ffedd5' }]}>
          <Ionicons name="help-circle" size={16} color="#f59e0b" />
        </View>
        Others
      </Text> */}
      <SettingItem
        icon={<Ionicons name="alert-circle-sharp" size={20} color="#e11d48" />}
        title="FAQ"
        subtitle="Frequently asked questions"
        onPress={() => router.push('/screens/FAQPage')}
      />
      <SettingItem
        icon={<Ionicons name="help-circle-sharp" size={20} color="#e11d48" />}
        title="Help and Support"
        subtitle="Get help when you need it"
        onPress={() => router.push('/screens/HelpSupportPage')}
      />
      <SettingItem
        icon={<Ionicons name="document-text" size={20} color="#e11d48" />}
        title="Terms and Conditions"
        subtitle="Read our terms"
        onPress={() => router.push('/screens/TermsPage')}
      />
      <SettingItem
        icon={<Ionicons name="log-out" size={20} color="#ef4444" />}
        title="Logout"
        subtitle="Sign out of your account"
        onPress={handleLogout}
        rightElement={<Ionicons name="chevron-forward" size={20} color="#ef4444" />}
      />
      </View>
      </ScrollView>
      {/* </SafeAreaView> */}
    </NativeBaseProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#f43f5e',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    color: '#6b7280',
    fontSize: 13,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 8,
  },
  settingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  premiumBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SettingsPage;
