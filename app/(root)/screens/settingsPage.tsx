import React, { useCallback, useEffect, useState } from 'react';
import CommonPopup from '../../../components/CommonPopup';
import { usePopup } from '../contexts/PopupContext';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal as RNModal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

import { router, useFocusEffect } from 'expo-router';
import { useUserData } from '../contexts/UserDataContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/subscriptionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import userApi from '../api/userApi';
import SupportFAB from '../../../components/SupportFAB';
import { buildUpgradeAction } from '../utils/upgradeNavigation';

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
  const { userData } = useUserData();
  const popup = usePopup();
  const { subscriptionData } = useSubscription() || {};
  const toast = useToast();

  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);
  const [logoutPopupVisible, setLogoutPopupVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [userRole, setUserRole] = useState<string>('USER');
  const [parentName, setParentName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('');
  const [primaryFirstName, setPrimaryFirstName] = useState<string>('');

  useEffect(() => {
    (async () => {
      const r = await AsyncStorage.getItem('userRole');
      if (r) setUserRole(r);
      const p = await AsyncStorage.getItem('parentName');
      if (p) setParentName(p);
      const rel = await AsyncStorage.getItem('relationship');
      if (rel) setRelationship(rel);
      const fn = await AsyncStorage.getItem('firstName');
      if (fn) setPrimaryFirstName(fn);
    })();
  }, []);
  const isParent = userRole === 'PARENT';

  useFocusEffect(
    useCallback(() => {
      const fetchPaymentStatus = async () => {
        if (userData?.decodedUserId) {
          try {
            const response = await userApi.getPaymentRequestsByUser(userData.userId);
            if (response.data && response.data.code === 200 && response.data.data) {
              setPaymentStatus(response.data.data.status);
              setPaymentRequestId(response.data.data.id?.toString());
            }
          } catch (error) {
            console.log('No pending payment request or error fetching', error);
          }
        }
      };

      fetchPaymentStatus();
    }, [userData?.decodedUserId])
  );

  const performLogout = useCallback(async () => {
    try {
      const userIdRemove = await AsyncStorage.getItem('userId');
      const fcmToken = await AsyncStorage.getItem('fcmToken');

      if (userIdRemove != null && fcmToken != null) {
        const requestBody = {
          userId: userIdRemove,
          fcmToken: fcmToken
        }
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

  const handleLogout = useCallback(() => {
    setLogoutPopupVisible(true);
  }, []);

  const handleDeleteAccount = useCallback(() => {
    setDeleteConfirmText('');
    setDeleteAccountVisible(true);
  }, []);

  const performDeleteAccount = useCallback(async () => {
    try {
      setDeleteAccountLoading(true);
      if (!userData.userId) {
        popup.error('Error', 'User not found. Please log in again.');
        return;
      }
      const res = await userApi.deleteAccount(userData.userId);
      if (res?.data?.code === 200) {
        // Clear everything locally and route to main
        try { await AsyncStorage.clear(); } catch (_) {}
        await logout();
        setDeleteAccountVisible(false);
        popup.success(
          'Account deleted',
          'Your account and all your data have been permanently removed. We\'re sorry to see you go.',
          () => router.replace('/(root)/(main)')
        );
      } else {
        popup.error('Delete failed', res?.data?.message || 'Could not delete account. Please try again.');
      }
    } catch (e: any) {
      popup.error('Delete failed', e?.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setDeleteAccountLoading(false);
    }
  }, [userData.userId, logout, popup]);

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
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.settingTitle} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={{ flexShrink: 0 }}>
        {rightElement ?? <Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
      </View>
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
              <Ionicons name="settings" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
            </View>
          </View>

          {/* Parent / Family Member context card — only visible when logged in as PARENT */}
          {isParent && (
            <LinearGradient
              colors={['#fff7ed', '#fde8cf']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                marginHorizontal: 0,
                marginTop: 2,
                marginBottom: 16,
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderLeftWidth: 3,
                borderLeftColor: '#d4a017',
                shadowColor: '#d4a017',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: '#d4a017',
                  justifyContent: 'center', alignItems: 'center',
                  marginRight: 10,
                }}>
                  <Ionicons name="people" size={15} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#7a2d2d', fontSize: 9, fontFamily: 'Rubik-Bold', letterSpacing: 0.5 }}>
                    FAMILY ACCESS MODE
                  </Text>
                  <Text style={{ color: '#111', fontSize: 13, fontFamily: 'Rubik-Bold', marginTop: 1 }} numberOfLines={1}>
                    {parentName || 'Family Member'}
                    {relationship ? ` · ${relationship}` : ''}
                  </Text>
                  <Text style={{ color: '#7a2d2d', fontSize: 10, marginTop: 1 }} numberOfLines={1}>
                    Helping <Text style={{ fontFamily: 'Rubik-Bold' }}>{primaryFirstName || 'your family'}</Text> find their match
                  </Text>
                </View>
              </View>
            </LinearGradient>
          )}

          {/* Account Settings — hidden entirely for parent sessions */}
          {!isParent && (
            <View style={[styles.sectionTitle, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={styles.sectionIcon}>
                <MaterialDesignIcons name="account-cog" size={16} color="#dc2626" />
              </View>
              <Text style={styles.sectionTitleText}>Account Settings</Text>
            </View>
          )}
          {isParent ? null : (
            <>
              <SettingItem
                icon={<MaterialIcons name="security" size={20} color="#dc2626" />}
                title="Privacy Settings"
                subtitle="Control what others can see"
                onPress={() => router.push('/screens/PrivacySettingsPage')}
              />
              <SettingItem
                icon={<Ionicons name="lock-closed" size={20} color="#dc2626" />}
                title="Change PIN"
                subtitle="Update your security PIN"
                onPress={() => router.push('/screens/SettingPageChangePin')}
              />
              <SettingItem
                icon={<MaterialCommunityIcons name="shield-check" size={20} color="#059669" />}
                title="Trust & Verification"
                subtitle="Email, ID, Education, Income badges"
                onPress={() => router.push('/(root)/screens/TrustVerificationScreen' as any)}
                rightElement={
                  <View style={[styles.premiumBadge, { backgroundColor: '#10b981' }]}>
                    <Text style={styles.premiumText}>Verify</Text>
                  </View>
                }
              />
              {/* Payment / Plan status row — moved from old Premium section */}
              {paymentStatus === 'PENDING' ? (
                <SettingItem
                  icon={<MaterialCommunityIcons name="timer-sand" size={20} color="#f97316" />}
                  title="Your Payment Status"
                  subtitle="Verification in progress"
                  onPress={() => router.push({
                    pathname: '/screens/PaymentScreen',
                    params: {
                      showVerificationOnInit: 'true',
                      paymentRequestId: paymentRequestId || ''
                    }
                  })}
                  rightElement={
                    <View style={[styles.premiumBadge, { backgroundColor: '#f97316' }]}>
                      <Text style={styles.premiumText}>Pending</Text>
                    </View>
                  }
                />
              ) : (paymentStatus === 'APPROVED' || (subscriptionData?.planTitle && subscriptionData.planTitle !== 'Free' && subscriptionData?.endDate && new Date(subscriptionData.endDate) > new Date())) ? (
                <SettingItem
                  icon={<MaterialCommunityIcons name="crown" size={20} color="#f59e0b" />}
                  title="See Your Plan"
                  subtitle={subscriptionData?.planTitle ? `${subscriptionData.planTitle} plan active` : 'View your active subscription'}
                  onPress={() => router.push('/screens/PremiumTab')}
                  rightElement={
                    <View style={[styles.premiumBadge, { backgroundColor: '#10b981' }]}>
                      <Text style={styles.premiumText}>Active</Text>
                    </View>
                  }
                />
              ) : (
                <SettingItem
                  icon={<MaterialCommunityIcons name="crown" size={20} color="#eab308" />}
                  title="Upgrade Now"
                  subtitle="Get premium features"
                  onPress={buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Premium Features' })}
                  rightElement={
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumText}>Premium</Text>
                    </View>
                  }
                />
              )}
              <SettingItem
                  icon={<Ionicons name="people-circle" size={20} color="#d4a017" />}
                  title="Family Access"
                  subtitle="Add a parent / family login"
                  onPress={() => {
                    const isGoldPlus = subscriptionData?.planTitle === 'Gold' || subscriptionData?.planTitle === 'Platinum';
                    if (!isGoldPlus) {
                      // Routes to the generalized upgrade-request picker (see
                      // utils/upgradeNavigation.ts) instead of a self-serve checkout — same
                      // admin-callback flow PaymentScreen uses in CONTACT mode.
                      popup.premiumRequired(
                        'Upgrade to Gold or Platinum to add family members who can help find your match.',
                        buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Family Access', minPlan: 'Gold' })
                      );
                      return;
                    }
                    router.push('/(root)/screens/FamilyAccessScreen' as any);
                  }}
                  rightElement={
                    <View style={[styles.premiumBadge, { backgroundColor: '#d4a017' }]}>
                      <Text style={styles.premiumText}>Gold+</Text>
                    </View>
                  }
                />
            </>
          )}

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
            icon={<MaterialIcons name="stars" size={20} color="#6c5ce7" />}
            title="Star Match"
            subtitle="Check horoscope compatibility"
            onPress={() => {
              if (!subscriptionData?.entitlements?.starMatch) {
                popup.premiumRequired(
                  'Star Match is available from Classic plan onwards. Upgrade to discover your compatibility score!',
                  buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Star Match', minPlan: 'Classic' })
                );
                return;
              }
              router.push('/(root)/screens/StarMatch');
            }}
            rightElement={<MaterialIcons name="chevron-right" size={24} color="#9ca3af" />}
          />
          <SettingItem
            icon={<Ionicons name="people" size={20} color="#dc2626" />}
            title="Your Connections"
            subtitle="View and manage connections"
            onPress={() => router.push('/screens/ListUser?type=connection')}
          />
          <SettingItem
            icon={<Ionicons name="eye" size={20} color="#dc2626" />}
            title="Viewed You"
            subtitle="See who viewed your profile"
            onPress={() => router.push('/screens/ListUser?type=viewed')}
          />

          <SettingItem
            icon={<Ionicons name="heart" size={20} color="#dc2626" />}
            title="Shortlisted Profiles"
            subtitle="Your saved profiles"
            onPress={() => router.push('/screens/ListUser?type=shortlisted')}
          />
          <SettingItem
            icon={<Ionicons name="people" size={20} color="#7c3aed" />}
            title="Who Shortlisted You"
            subtitle="See who saved your profile"
            onPress={() => {
              const isGoldPlus = subscriptionData?.planTitle === 'Gold' || subscriptionData?.planTitle === 'Platinum';
              if (!isGoldPlus) {
                popup.premiumRequired(
                  'Upgrade to Gold or Platinum to see who shortlisted you.',
                  buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Who Shortlisted You', minPlan: 'Gold' })
                );
                return;
              }
              router.push('/screens/ListUser?type=whoShortlistedMe');
            }}
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
            icon={<Ionicons name="alert-circle-sharp" size={20} color="#dc2626" />}
            title="FAQ"
            subtitle="Frequently asked questions"
            onPress={() => router.push('/screens/FAQPage')}
          />
          <SettingItem
            icon={<Ionicons name="help-circle-sharp" size={20} color="#dc2626" />}
            title="Help and Support"
            subtitle="Get help when you need it"
            onPress={() => router.push('/screens/HelpSupportPage')}
          />
          <SettingItem
            icon={<Ionicons name="document-text" size={20} color="#dc2626" />}
            title="Terms and Conditions"
            subtitle="Read our terms"
            onPress={() => router.push('/screens/TermsPage')}
          />
          {!isParent && (
            <SettingItem
              icon={<Ionicons name="ban" size={20} color="#6b7280" />}
              title="Blocked Users"
              subtitle="Manage who you've blocked"
              onPress={() => router.push('/(root)/screens/BlockedUsersScreen' as any)}
            />
          )}
          <SettingItem
            icon={<Ionicons name="log-out" size={20} color="#ef4444" />}
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            rightElement={<Ionicons name="chevron-forward" size={20} color="#ef4444" />}
          />
          {!isParent && (
            <SettingItem
              icon={<MaterialIcons name="delete-forever" size={20} color="#991b1b" />}
              title="Delete Account"
              subtitle="Permanently remove your account and all data"
              onPress={handleDeleteAccount}
              rightElement={<Ionicons name="chevron-forward" size={20} color="#991b1b" />}
            />
          )}
        </View>
      </ScrollView>
      <CommonPopup
        visible={logoutPopupVisible}
        variant="confirm"
        title="Logout?"
        description="Are you sure you want to sign out of your account?"
        dismissable={!logoutLoading}
        onClose={() => !logoutLoading && setLogoutPopupVisible(false)}
        buttons={[
          {
            text: 'Cancel',
            variant: 'secondary',
            onPress: () => setLogoutPopupVisible(false),
          },
          {
            text: 'Logout',
            variant: 'destructive',
            loading: logoutLoading,
            onPress: async () => {
              setLogoutLoading(true);
              await performLogout();
              setLogoutLoading(false);
              setLogoutPopupVisible(false);
            },
          },
        ]}
      />

      {/* Delete Account — typed confirm modal */}
      <RNModal visible={deleteAccountVisible} transparent animationType="fade" onRequestClose={() => !deleteAccountLoading && setDeleteAccountVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }}
        >
          <View style={{
            backgroundColor: '#fff', borderRadius: 20, padding: 22,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
          }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{
                width: 60, height: 60, borderRadius: 30,
                backgroundColor: '#fee2e2',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <MaterialIcons name="delete-forever" size={32} color="#dc2626" />
              </View>
            </View>

            <Text style={{ fontSize: 18, fontFamily: 'Rubik-Bold', color: '#111', textAlign: 'center', marginBottom: 8 }}>
              Delete account permanently?
            </Text>

            <Text style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', marginBottom: 16, lineHeight: 19 }}>
              This will{' '}
              <Text style={{ fontFamily: 'Rubik-Bold', color: '#dc2626' }}>permanently remove</Text>
              {' '}your profile, photos, messages, matches, subscriptions and family logins. This cannot be undone.
            </Text>

            <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#dc2626', marginBottom: 16 }}>
              <Text style={{ fontSize: 11, color: '#991b1b', lineHeight: 16 }}>
                • Your profile will no longer appear in search{'\n'}
                • Chat history will be erased for you and the other party{'\n'}
                • Any active subscription will be forfeited (no refund){'\n'}
                • Linked family logins will be revoked
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: '#4b5563', marginBottom: 6, fontFamily: 'Rubik-Medium' }}>
              Type <Text style={{ color: '#dc2626', fontFamily: 'Rubik-ExtraBold' }}>DELETE</Text> to confirm
            </Text>
            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              style={{
                borderWidth: 1.5, borderColor: deleteConfirmText === 'DELETE' ? '#dc2626' : '#e5e7eb',
                borderRadius: 10, padding: 12, fontSize: 14,
                backgroundColor: '#fafafa', marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                disabled={deleteAccountLoading}
                onPress={() => setDeleteAccountVisible(false)}
                style={{
                  flex: 1, padding: 13, borderRadius: 10,
                  borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center',
                  backgroundColor: '#fff',
                }}
              >
                <Text style={{ color: '#4b5563', fontFamily: 'Rubik-Bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={deleteConfirmText !== 'DELETE' || deleteAccountLoading}
                onPress={performDeleteAccount}
                style={{
                  flex: 1, padding: 13, borderRadius: 10, alignItems: 'center',
                  backgroundColor: deleteConfirmText === 'DELETE' && !deleteAccountLoading ? '#dc2626' : '#fca5a5',
                }}
              >
                {deleteAccountLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontFamily: 'Rubik-Bold' }}>Delete Forever</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </RNModal>

      {/* </SafeAreaView> */}
      <SupportFAB />
    </NativeBaseProvider>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f3f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#1F7FE5',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
  },
  // topbarTitle scale (20px Rubik-Bold, ink, tight letter-spacing) — matches index.tsx/profile.tsx's
  // page-level title convention instead of the previous 22px/near-black one-off.
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    marginTop: 1,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 12,
  },
  // sectionTitle scale (16px Rubik-Bold, ink, -0.3 tracking) — matches profile.tsx's section
  // headers ("Your Matrimony Profile" / "Your Details").
  sectionTitleText: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
    letterSpacing: -0.3,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#fef2f2',
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
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
  // listCardTitle/listCardSub scale — matches profile.tsx's row-card typography (15px Rubik-Bold
  // title, 12.5px Rubik-Regular subtitle) instead of the previous 16px Medium/near-black pairing.
  settingTitle: {
    fontSize: 15,
    fontFamily: 'Rubik-SemiBold',
    color: '#0f1724',
    letterSpacing: -0.2,
  },
  settingSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Rubik-Regular',
    color: '#64748b',
    marginTop: 1,
  },
  premiumBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.2,
  },
});

export default SettingsPage;
