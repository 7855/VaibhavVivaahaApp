import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useUserData } from '../contexts/UserDataContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { usePopup } from '../contexts/PopupContext';
import userApi from '../api/userApi';
import { buildUpgradeAction } from '../utils/upgradeNavigation';

type FamilyLogin = {
  id: number;
  parentName: string;
  relationship?: string;
  mobile: string;
  email?: string;
  status: string;
  lastLoginAt?: string;
};

const RELATIONSHIPS = ['Father', 'Mother', 'Brother', 'Sister', 'Uncle', 'Aunt', 'Guardian'];

const FamilyAccessScreen = () => {
  const { userData } = useUserData();
  const { subscriptionData } = useSubscription();
  const popup = usePopup();
  const [list, setList] = useState<FamilyLogin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form
  const [parentName, setParentName] = useState('');
  const [relationship, setRelationship] = useState('Father');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');

  const planTitle = subscriptionData?.planTitle;
  const isGoldPlus = planTitle === 'Gold' || planTitle === 'Platinum';

  const load = useCallback(async () => {
    try {
      if (!userData.userId) return;
      const res = await userApi.getMyFamilyLogins(userData.userId);
      if (res.data.code === 200) setList(res.data.data || []);
      else setList([]);
    } catch (e) {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [userData.userId]);

  useEffect(() => { load(); }, [load]);

  const showApiError = (code: string | undefined, fallback: string) => {
    switch (code) {
      case 'MOBILE_EXISTS_AS_MEMBER':
        popup.error(
          'Mobile already registered',
          `${mobile} is already registered as a Vaibhav Vivaaha member account. Please use a different mobile number for your family member.`
        );
        break;
      case 'MOBILE_EXISTS_AS_FAMILY':
        popup.error(
          'Mobile already in use',
          `${mobile} is already registered as a family login (possibly for another member). Please use a different mobile number.`
        );
        break;
      case 'EMAIL_EXISTS_AS_MEMBER':
        popup.error(
          'Email already registered',
          `${email} is already registered as a Vaibhav Vivaaha member account. Please use a different email address or leave it blank.`
        );
        break;
      default:
        popup.error('Could not create family login', fallback);
    }
  };

  const handleCreate = async () => {
    if (!parentName.trim() || !mobile.trim() || !pin.trim()) {
      popup.error('Missing details', 'Name, mobile and PIN are all required.');
      return;
    }
    if (mobile.length !== 10) {
      popup.error('Invalid mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      popup.error('Invalid PIN', 'PIN must be exactly 4 digits.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await userApi.createFamilyLogin(userData.userId!, {
        parentName, relationship, mobile, email, pin,
      });
      if (res.data.code === 200) {
        const createdName = parentName;
        const createdMobile = mobile;
        const createdPin = pin;
        // close + reset first
        setShowAdd(false);
        setParentName(''); setMobile(''); setEmail(''); setPin('');
        load();
        popup.success(
          'Family login created!',
          `${createdName} can now log in with mobile ${createdMobile} and PIN ${createdPin}. Share these credentials with them.`
        );
      } else if (res.data.code === 403) {
        popup.premiumRequired(
          'Family Access is available on Gold and Platinum plans. Upgrade to invite a parent or family member.',
          buildUpgradeAction({ planTitle, featureName: 'Family Access', minPlan: 'Gold' })
        );
      } else {
        showApiError(res.data.message, res.data.message || 'Something went wrong. Please try again.');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      showApiError(msg, 'Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = (item: FamilyLogin) => {
    popup.confirm(
      'Revoke access?',
      `${item.parentName} (${item.mobile}) will no longer be able to log in to Vaibhav Vivaaha.`,
      async () => {
        try {
          const res = await userApi.revokeFamilyLogin(userData.userId!, item.id);
          if (res.data.code === 200) {
            popup.success('Access revoked', `${item.parentName} can no longer log in.`);
            load();
          } else {
            popup.error('Could not revoke', res.data.message || 'Please try again.');
          }
        } catch {
          popup.error('Could not revoke', 'Network error. Please try again.');
        }
      },
      'Revoke',
      'Cancel'
    );
  };

  if (!isGoldPlus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Family Access</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="lock-closed" size={64} color="#d4a017" />
          <Text style={styles.lockText}>Family Access is a Gold/Platinum feature</Text>
          <Text style={styles.lockSub}>Let your parents securely view your matches and shortlist on their own phone.</Text>
          <TouchableOpacity style={styles.upgradeBtn} onPress={buildUpgradeAction({ planTitle, featureName: 'Family Access', minPlan: 'Gold' })}>
            <Text style={styles.upgradeText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Family Access</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle" size={26} color="#9c4040" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Add a family member who can log in with their own mobile number to view and manage your matches on their phone.
      </Text>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#9c4040" /></View>
      ) : list.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No family members added yet</Text>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => setShowAdd(true)}>
            <Text style={styles.upgradeText}>+ Add Family Member</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {list.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.parentName}</Text>
                <Text style={styles.cardMeta}>{item.relationship || '—'} · {item.mobile}</Text>
                {item.email ? <Text style={styles.cardMeta}>{item.email}</Text> : null}
                {item.lastLoginAt ? (
                  <Text style={styles.cardMetaSmall}>Last login: {new Date(item.lastLoginAt).toLocaleString()}</Text>
                ) : (
                  <Text style={styles.cardMetaSmall}>Never logged in</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleRevoke(item)} style={styles.revokeBtn}>
                <Ionicons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add modal — keyboard-aware + tap-outside-to-dismiss */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAdd(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
                style={{ width: '100%' }}
              >
                <View style={styles.modalCard}>
                  {/* Drag handle */}
                  <View style={styles.dragHandle} />

                  {/* Header with gradient icon */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <LinearGradient
                        colors={['#d4a017', '#b8860b']}
                        style={styles.modalIcon}
                      >
                        <Ionicons name="people" size={20} color="#fff" />
                      </LinearGradient>
                      <View>
                        <Text style={styles.modalTitle}>Add Family Member</Text>
                        <Text style={styles.modalSubtitle}>Give a parent access to your matches</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.closeBtn}>
                      <Ionicons name="close" size={22} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    automaticallyAdjustKeyboardInsets
                    contentContainerStyle={{ paddingBottom: 8 }}
                  >
                    {/* Name */}
                    <Text style={styles.label}>FAMILY MEMBER'S NAME</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="person-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={parentName}
                        onChangeText={setParentName}
                        placeholder="e.g. Ramesh Kumar"
                        placeholderTextColor="#9ca3af"
                        returnKeyType="next"
                      />
                    </View>

                    {/* Relationship */}
                    <Text style={styles.label}>RELATIONSHIP</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 16, marginHorizontal: -4 }}
                      contentContainerStyle={{ paddingHorizontal: 4 }}
                      keyboardShouldPersistTaps="handled"
                    >
                      {RELATIONSHIPS.map((r) => (
                        <TouchableOpacity
                          key={r}
                          onPress={() => { Keyboard.dismiss(); setRelationship(r); }}
                          style={[styles.chip, relationship === r && styles.chipActive]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, relationship === r && styles.chipTextActive]}>{r}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Mobile */}
                    <Text style={styles.label}>MOBILE NUMBER</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="call-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                      <Text style={styles.countryCode}>+91</Text>
                      <TextInput
                        style={[styles.input, { paddingLeft: 4 }]}
                        value={mobile}
                        onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ''))}
                        placeholder="10-digit mobile"
                        placeholderTextColor="#9ca3af"
                        keyboardType="phone-pad"
                        maxLength={10}
                        returnKeyType="next"
                      />
                    </View>

                    {/* Email */}
                    <Text style={styles.label}>EMAIL <Text style={styles.optional}>(optional)</Text></Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="mail-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="parent@email.com"
                        placeholderTextColor="#9ca3af"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                      />
                    </View>

                    {/* PIN */}
                    <Text style={styles.label}>4-DIGIT PIN</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { letterSpacing: 8, fontSize: 18, fontFamily: 'Rubik-Medium' }]}
                        value={pin}
                        onChangeText={(t) => setPin(t.replace(/[^0-9]/g, ''))}
                        placeholder="••••"
                        placeholderTextColor="#d1d5db"
                        secureTextEntry
                        keyboardType="number-pad"
                        maxLength={4}
                        returnKeyType="done"
                        onSubmitEditing={handleCreate}
                      />
                    </View>
                    <Text style={styles.pinHint}>Share this PIN with your family member to log in</Text>

                    {/* Info box */}
                    <View style={styles.infoBox}>
                      <Ionicons name="information-circle" size={16} color="#9c4040" style={{ marginTop: 1 }} />
                      <Text style={styles.infoText}>
                        Your family member can log in on the same Vaibhav Vivaaha app using their mobile and this PIN. They'll be able to view your matches but cannot edit your profile or make payments.
                      </Text>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                      disabled={submitting}
                      onPress={handleCreate}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={submitting ? ['#9ca3af', '#9ca3af'] : ['#9c4040', '#7a2d2d']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitGradient}
                      >
                        {submitting ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                            <Text style={styles.submitText}>Create Family Login</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 12 }} />
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  title: { fontSize: 18, fontFamily: 'Rubik-Medium', color: '#111' },
  subtitle: { fontSize: 13, color: '#6b7280', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 12, color: '#6b7280', fontSize: 15 },
  lockText: { marginTop: 12, fontSize: 16, fontFamily: 'Rubik-Medium', color: '#111' },
  lockSub: { marginTop: 8, fontSize: 13, color: '#6b7280', textAlign: 'center' },
  upgradeBtn: { marginTop: 20, backgroundColor: '#9c4040', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  upgradeText: { color: '#fff', fontFamily: 'Rubik-Bold' },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  cardName: { fontSize: 15, fontFamily: 'Rubik-Medium', color: '#111' },
  cardMeta: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  cardMetaSmall: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  revokeBtn: { padding: 4 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  dragHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center', marginVertical: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  modalIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: { fontSize: 17, fontFamily: 'Rubik-Bold', color: '#111' },
  modalSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  closeBtn: { padding: 4 },
  label: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6,
    marginTop: 4,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.5,
  },
  optional: { fontFamily: 'Rubik-Regular', textTransform: 'none', color: '#9ca3af' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    marginBottom: 14,
  },
  inputIcon: { marginRight: 8 },
  countryCode: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#4b5563',
    marginRight: 6,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    color: '#111',
  },
  pinHint: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#9c4040', borderColor: '#9c4040' },
  chipText: { fontSize: 13, color: '#4b5563', fontFamily: 'Rubik-Medium' },
  chipTextActive: { color: '#fff', fontFamily: 'Rubik-Bold' },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fef3f2',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#9c4040',
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#7a2d2d',
    marginLeft: 8,
    lineHeight: 16,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#9c4040',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: { color: '#fff', fontFamily: 'Rubik-Bold', fontSize: 15 },
  helperText: { marginTop: 12, fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 16 },
});

export default FamilyAccessScreen;
