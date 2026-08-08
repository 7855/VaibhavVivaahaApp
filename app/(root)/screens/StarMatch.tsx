import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserData } from '../contexts/UserDataContext';
import userApi from '../api/userApi';

const { width: SW } = Dimensions.get('window');

// ─── Premium Palette — Deep Maroon × Saffron Gold ──────────────
const C = {
  // Backgrounds
  bg1: '#12000A',
  bg2: '#1E0010',
  bg3: '#2A0018',
  // Glass surfaces
  glass: 'rgba(255,215,160,0.055)',
  glassBorder: 'rgba(212,175,55,0.28)',
  glassActive: 'rgba(212,175,55,0.14)',
  // Gold scale
  goldBright: '#F5C518',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  goldDeep: '#8B6914',
  goldMuted: 'rgba(212,175,55,0.55)',
  goldFaint: 'rgba(212,175,55,0.15)',
  // Typography
  cream: '#FFF8F0',
  creamMid: 'rgba(255,245,230,0.75)',
  creamSoft: 'rgba(255,235,200,0.45)',
  creamMute: 'rgba(255,225,180,0.3)',
  // Utility
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.72)',
  sheetBg: '#1A0010',
  sheetBorder: 'rgba(212,175,55,0.2)',
};

const StarMatch = () => {
  const { viewedProfile, viewedUserId } = useLocalSearchParams<{ viewedProfile?: string; viewedUserId?: string }>();
  const { userData } = useUserData();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'bride' | 'groom'>('bride');
  const [formData, setFormData] = useState({
    bride: { name: '', dob: '', time: { hour: '12', minute: '00', period: 'AM' }, place: '', star: '', rasi: '' },
    groom: { name: '', dob: '', time: { hour: '12', minute: '00', period: 'AM' }, place: '', star: '', rasi: '' },
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStarModal, setShowStarModal] = useState(false);
  const [showRasiModal, setShowRasiModal] = useState(false);
  const [showPlaceModal, setShowPlaceModal] = useState(false);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];

  const starData = [
    { key: '1', value: 'Aswini' }, { key: '2', value: 'Bharani' }, { key: '3', value: 'Krithikai' },
    { key: '4', value: 'Rohini' }, { key: '5', value: 'Mirugasiridham' }, { key: '6', value: 'Thiruvathirai' },
    { key: '7', value: 'Punarpusam' }, { key: '8', value: 'Poosam' }, { key: '9', value: 'Ayilyam' },
    { key: '10', value: 'Magam' }, { key: '11', value: 'Pooram' }, { key: '12', value: 'Uthiram' },
    { key: '13', value: 'Hastham' }, { key: '14', value: 'Chithirai' }, { key: '15', value: 'Swathi' },
    { key: '16', value: 'Visagam' }, { key: '17', value: 'Anusham' }, { key: '18', value: 'Kettai' },
    { key: '19', value: 'Moolam' }, { key: '20', value: 'Pooradam' }, { key: '21', value: 'Uthiradam' },
    { key: '22', value: 'Thiruvonam' }, { key: '23', value: 'Avittam' }, { key: '24', value: 'Sathayam' },
    { key: '25', value: 'Poorattathi' }, { key: '26', value: 'Uthirattathi' }, { key: '27', value: 'Revathi' },
  ];

  const rasiData = [
    { key: '1', value: 'Mesham' }, { key: '2', value: 'Rishabam' }, { key: '3', value: 'Mithunam' },
    { key: '4', value: 'Kadagam' }, { key: '5', value: 'Simmam' }, { key: '6', value: 'Kanni' },
    { key: '7', value: 'Thulam' }, { key: '8', value: 'Viruchagam' }, { key: '9', value: 'Dhanusu' },
    { key: '10', value: 'Makaram' }, { key: '11', value: 'Kumbam' }, { key: '12', value: 'Meenam' },
  ];

  const tamilNaduDistricts = [
    { key: '1', value: 'Ariyalur' }, { key: '2', value: 'Chengalpattu' }, { key: '3', value: 'Chennai' },
    { key: '4', value: 'Coimbatore' }, { key: '5', value: 'Cuddalore' }, { key: '6', value: 'Dharmapuri' },
    { key: '7', value: 'Dindigul' }, { key: '8', value: 'Erode' }, { key: '9', value: 'Kallakurichi' },
    { key: '10', value: 'Kanchipuram' }, { key: '11', value: 'Kanyakumari' }, { key: '12', value: 'Karur' },
    { key: '13', value: 'Krishnagiri' }, { key: '14', value: 'Madurai' }, { key: '15', value: 'Mayiladuthurai' },
    { key: '16', value: 'Nagapattinam' }, { key: '17', value: 'Namakkal' }, { key: '18', value: 'Nilgiris' },
    { key: '19', value: 'Perambalur' }, { key: '20', value: 'Pudukkottai' }, { key: '21', value: 'Ramanathapuram' },
    { key: '22', value: 'Ranipet' }, { key: '23', value: 'Salem' }, { key: '24', value: 'Sivaganga' },
    { key: '25', value: 'Tenkasi' }, { key: '26', value: 'Thanjavur' }, { key: '27', value: 'Theni' },
    { key: '28', value: 'Thoothukudi' }, { key: '29', value: 'Tiruchirappalli' }, { key: '30', value: 'Tirunelveli' },
    { key: '31', value: 'Tirupathur' }, { key: '32', value: 'Tiruppur' }, { key: '33', value: 'Tiruvallur' },
    { key: '34', value: 'Tiruvannamalai' }, { key: '35', value: 'Tiruvarur' }, { key: '36', value: 'Vellore' },
    { key: '37', value: 'Viluppuram' }, { key: '38', value: 'Virudhunagar' },
  ];

  const findMatchingRasi = (v: string) => rasiData.find(r => r.value.toLowerCase() === v.toLowerCase())?.value || '';
  const findMatchingStar = (v: string) => starData.find(s => s.value.toLowerCase() === v.toLowerCase())?.value || '';

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoadingData(true);
        let viewedData: any = {};
        if (viewedProfile) {
          try { viewedData = JSON.parse(viewedProfile); } catch (e) { }
        }
        let loggedInData: any = {};
        if (userData.userId) {
          try {
            const response = await userApi.getProfileDetailByUserId(userData.userId);
            const profile = response?.data?.data;
            if (profile) {
              const detail = profile.userDetail?.[0];
              let star = '', rasi = '', place = '';
              if (detail) {
                try {
                  const astro = (JSON.parse(detail.astronomicInfo || '[]'))[0] || {};
                  star = astro.star || ''; rasi = astro.moon_sign || '';
                } catch { }
                try { place = (JSON.parse(detail.basicInfo || '{}')).place_of_birth || ''; } catch { }
              }
              loggedInData = {
                name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
                gender: profile.gender || userData.gender || '',
                dob: profile.dob || '', star, rasi, place,
              };
            }
          } catch {
            loggedInData = {
              name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
              gender: userData.gender || '', dob: '', star: '', rasi: '', place: '',
            };
          }
        }
        const lg = loggedInData.gender || '';
        const vg = viewedData.gender || '';
        let brideData: any = {}, groomData: any = {};
        if (lg === 'F') { brideData = loggedInData; groomData = viewedData; }
        else if (lg === 'M') { groomData = loggedInData; brideData = viewedData; }
        else if (vg === 'M') { groomData = viewedData; brideData = loggedInData; }
        else { brideData = viewedData; groomData = loggedInData; }

        setFormData({
          bride: { name: brideData.name || '', dob: brideData.dob || '', time: { hour: '12', minute: '00', period: 'AM' }, place: brideData.place || '', star: findMatchingStar(brideData.star || ''), rasi: findMatchingRasi(brideData.rasi || '') },
          groom: { name: groomData.name || '', dob: groomData.dob || '', time: { hour: '12', minute: '00', period: 'AM' }, place: groomData.place || '', star: findMatchingStar(groomData.star || ''), rasi: findMatchingRasi(groomData.rasi || '') },
        });
      } catch { } finally { setIsLoadingData(false); }
    };
    loadProfileData();
  }, [viewedProfile, userData.userId]);

  const handleStarSelect = (star: string) => { setFormData(p => ({ ...p, [activeTab]: { ...p[activeTab], star } })); setShowStarModal(false); };
  const handleRasiSelect = (rasi: string) => { setFormData(p => ({ ...p, [activeTab]: { ...p[activeTab], rasi } })); setShowRasiModal(false); };
  const handlePlaceSelect = (place: string) => { setFormData(p => ({ ...p, [activeTab]: { ...p[activeTab], place } })); setShowPlaceModal(false); };
  const handleTimeChange = (type: 'hour' | 'minute' | 'period', value: string) => {
    setFormData(p => ({ ...p, [activeTab]: { ...p[activeTab], time: { ...p[activeTab].time, [type]: value } } }));
  };
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dob = selectedDate.toISOString().split('T')[0];
      setFormData(p => ({ ...p, [activeTab]: { ...p[activeTab], dob } }));
      const today = new Date();
      let age = today.getFullYear() - selectedDate.getFullYear();
      const m = today.getMonth() - selectedDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) age--;
      if (age < 18) Alert.alert('Age Restriction', 'Selected age is below 18 years.', [{ text: 'OK' }]);
    }
  };

  const renderTimePicker = () => (
    <View style={s.timePickerContainer}>
      <View style={s.timePickerRow}>
        {/* Hours */}
        <View style={s.timePickerCol}>
          <Text style={s.timePickerLabel}>Hour</Text>
          <ScrollView style={s.timePickerScroll} showsVerticalScrollIndicator={false}>
            {hours.map(h => (
              <TouchableOpacity key={h} style={[s.timeItem, formData[activeTab].time.hour === h && s.timeItemActive]} onPress={() => handleTimeChange('hour', h)}>
                <Text style={[s.timeItemText, formData[activeTab].time.hour === h && s.timeItemTextActive]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Minutes */}
        <View style={s.timePickerCol}>
          <Text style={s.timePickerLabel}>Minute</Text>
          <ScrollView style={s.timePickerScroll} showsVerticalScrollIndicator={false}>
            {minutes.map(m => (
              <TouchableOpacity key={m} style={[s.timeItem, formData[activeTab].time.minute === m && s.timeItemActive]} onPress={() => handleTimeChange('minute', m)}>
                <Text style={[s.timeItemText, formData[activeTab].time.minute === m && s.timeItemTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* AM/PM */}
        <View style={s.timePickerCol}>
          <Text style={s.timePickerLabel}>Period</Text>
          <View style={s.periodWrap}>
            {periods.map(p => (
              <TouchableOpacity key={p} style={[s.periodBtn, formData[activeTab].time.period === p && s.periodBtnActive]} onPress={() => handleTimeChange('period', p)}>
                <Text style={[s.periodText, formData[activeTab].time.period === p && s.periodTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const handleSubmit = async () => {
    const missing: string[] = [];
    if (!formData.bride.name) missing.push("Bride's Full Name");
    if (!formData.bride.dob) missing.push("Bride's Date of Birth");
    if (!formData.bride.place) missing.push("Bride's Place of Birth");
    if (!formData.bride.star) missing.push("Bride's Star");
    if (!formData.bride.rasi) missing.push("Bride's Rasi");
    if (!formData.groom.name) missing.push("Groom's Full Name");
    if (!formData.groom.dob) missing.push("Groom's Date of Birth");
    if (!formData.groom.place) missing.push("Groom's Place of Birth");
    if (!formData.groom.star) missing.push("Groom's Star");
    if (!formData.groom.rasi) missing.push("Groom's Rasi");
    if (missing.length > 0) { Alert.alert('Missing Fields', `Please fill:\n\n${missing.join('\n')}`, [{ text: 'OK' }]); return; }

    const fmt = (t: { hour: string; minute: string; period: string }) => {
      let h = parseInt(t.hour, 10);
      if (t.period === 'PM' && h < 12) h += 12;
      else if (t.period === 'AM' && h === 12) h = 0;
      return `${h.toString().padStart(2, '0')}:${t.minute}`;
    };
    const requestData: any = {
      bride: { name: formData.bride.name, dob: formData.bride.dob, tob: fmt(formData.bride.time), place: formData.bride.place, star: formData.bride.star, rasi: formData.bride.rasi.toLowerCase() },
      groom: { name: formData.groom.name, dob: formData.groom.dob, tob: fmt(formData.groom.time), place: formData.groom.place, star: formData.groom.star, rasi: formData.groom.rasi.toLowerCase() },
    };
    if (viewedUserId) { requestData.requesterUserId = userData.userId; requestData.viewedUserId = viewedUserId; }
    router.push({ pathname: '/(root)/screens/StarMatchResult', params: { formData: JSON.stringify(requestData) } });
  };

  // ─── Loading screen ───────────────────────────────────────────
  if (isLoadingData) {
    return (
      <LinearGradient colors={[C.bg1, C.bg2, C.bg3, C.bg2, C.bg1]} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 32, marginBottom: 16 }}>✦</Text>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={{ marginTop: 14, color: C.cream, fontSize: 15, fontFamily: 'Rubik-Medium', letterSpacing: 0.4 }}>Loading Profile…</Text>
        <Text style={{ marginTop: 4, color: C.creamSoft, fontSize: 12 }}>Preparing your horoscope details</Text>
      </LinearGradient>
    );
  }

  const tab = formData[activeTab];

  // ─── Render ───────────────────────────────────────────────────
  return (
    <LinearGradient colors={[C.bg1, C.bg2, C.bg3, C.bg2, C.bg1]} locations={[0, 0.25, 0.5, 0.75, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialIcons name="chevron-left" size={24} color={C.gold} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerOrnament}>✦  ✦  ✦</Text>
            <Text style={s.headerTitle}>Jathaga Porutham</Text>
            <Text style={s.headerSub}>Star Compatibility Matching</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Gold divider ── */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerGem}>⬥</Text>
          <View style={s.dividerLine} />
        </View>

        {/* ── Premium Tab Switcher ── */}
        <View style={s.tabWrap}>
          <View style={s.tabTrack}>
            {/* Sliding gold pill */}
            <View style={[s.tabPill, activeTab === 'groom' && { left: '50%' }]} />
            <TouchableOpacity style={s.tabBtn} onPress={() => setActiveTab('bride')} activeOpacity={0.8}>
              <Text style={s.tabEmoji}>👰</Text>
              <Text style={[s.tabLabel, activeTab === 'bride' && s.tabLabelActive]}>Bride</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tabBtn} onPress={() => setActiveTab('groom')} activeOpacity={0.8}>
              <Text style={s.tabEmoji}>🤵</Text>
              <Text style={[s.tabLabel, activeTab === 'groom' && s.tabLabelActive]}>Groom</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Glass Info Card ── */}
          <View style={s.glassCard}>

            {/* Person label */}
            <View style={s.personLabel}>
              <View style={s.personLabelLine} />
              <Text style={s.personLabelText}>{activeTab === 'bride' ? '👰  Bride Details' : '🤵  Groom Details'}</Text>
              <View style={s.personLabelLine} />
            </View>

            {/* Full Name */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>✦  FULL NAME</Text>
              <TextInput
                style={s.fieldInput}
                placeholder={`Enter ${activeTab === 'bride' ? "bride" : "groom"}'s name`}
                placeholderTextColor={C.creamMute}
                value={tab.name}
                onChangeText={text => setFormData(p => ({ ...p, [activeTab]: { ...p[activeTab], name: text } }))}
              />
            </View>

            {/* Date of Birth */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>✦  DATE OF BIRTH</Text>
              <TouchableOpacity style={s.fieldButton} onPress={() => setShowDatePicker(true)} activeOpacity={0.75}>
                <Text style={[s.fieldButtonText, !tab.dob && { color: C.creamMute }]}>
                  {tab.dob || 'DD / MM / YYYY'}
                </Text>
                <MaterialIcons name="calendar-today" size={18} color={C.goldMuted} />
              </TouchableOpacity>
            </View>

            {/* Time of Birth */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>✦  TIME OF BIRTH</Text>
              <TouchableOpacity style={s.fieldButton} onPress={() => setShowTimePicker(true)} activeOpacity={0.75}>
                <Text style={s.fieldButtonText}>{`${tab.time.hour} : ${tab.time.minute}  ${tab.time.period}`}</Text>
                <MaterialIcons name="access-time" size={18} color={C.goldMuted} />
              </TouchableOpacity>
            </View>

            {/* Place of Birth */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>✦  PLACE OF BIRTH</Text>
              <TouchableOpacity style={s.fieldButton} onPress={() => setShowPlaceModal(true)} activeOpacity={0.75}>
                <Text style={[s.fieldButtonText, !tab.place && { color: C.creamMute }]}>{tab.place || 'Select District'}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={C.goldMuted} />
              </TouchableOpacity>
            </View>

            {/* Star + Rasi */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={s.fieldLabel}>✦  STAR</Text>
                <TouchableOpacity style={s.fieldButton} onPress={() => setShowStarModal(true)} activeOpacity={0.75}>
                  <Text style={[s.fieldButtonText, !tab.star && { color: C.creamMute }]}>{tab.star || 'Select'}</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color={C.goldMuted} />
                </TouchableOpacity>
              </View>
              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={s.fieldLabel}>✦  RASI</Text>
                <TouchableOpacity style={s.fieldButton} onPress={() => setShowRasiModal(true)} activeOpacity={0.75}>
                  <Text style={[s.fieldButtonText, !tab.rasi && { color: C.creamMute }]}>{tab.rasi || 'Select'}</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color={C.goldMuted} />
                </TouchableOpacity>
              </View>
            </View>

          </View>

          {/* ── Summary chips if both filled ── */}
          {formData.bride.star && formData.groom.star && (
            <View style={s.summaryRow}>
              <View style={s.summaryChip}><Text style={s.summaryChipText}>👰 {formData.bride.star} · {formData.bride.rasi || '—'}</Text></View>
              <Text style={s.summaryX}>⟺</Text>
              <View style={s.summaryChip}><Text style={s.summaryChipText}>🤵 {formData.groom.star} · {formData.groom.rasi || '—'}</Text></View>
            </View>
          )}

          {/* ── Submit Button ── */}
          <TouchableOpacity onPress={handleSubmit} style={s.submitWrap} activeOpacity={0.85}>
            <LinearGradient colors={[C.goldBright, C.gold, C.goldDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitBtn}>
              <Text style={s.submitIcon}>✦</Text>
              <Text style={s.submitText}>Reveal Compatibility</Text>
              <Text style={s.submitIcon}>✦</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* ── Time Picker Modal ── */}
        <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
          <View style={s.overlay}>
            <View style={s.sheet}>
              <View style={s.sheetHandle} />
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>⏱  Time of Birth</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}><MaterialIcons name="close" size={22} color={C.goldMuted} /></TouchableOpacity>
              </View>
              {renderTimePicker()}
              <TouchableOpacity style={s.sheetDoneBtn} onPress={() => setShowTimePicker(false)}>
                <LinearGradient colors={[C.goldBright, C.goldDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sheetDoneInner}>
                  <Text style={s.sheetDoneText}>Confirm</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Date Picker Modal ── */}
        <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
          <View style={s.overlay}>
            <View style={s.sheet}>
              <View style={s.sheetHandle} />
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>📅  Date of Birth</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}><MaterialIcons name="close" size={22} color={C.goldMuted} /></TouchableOpacity>
              </View>
              <DateTimePicker
                value={tab.dob ? new Date(tab.dob) : new Date()}
                mode="date"
                display="spinner"
                textColor={C.cream}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
              <TouchableOpacity style={s.sheetDoneBtn} onPress={() => setShowDatePicker(false)}>
                <LinearGradient colors={[C.goldBright, C.goldDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sheetDoneInner}>
                  <Text style={s.sheetDoneText}>Confirm</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Star Modal ── */}
        <Modal visible={showStarModal} transparent animationType="fade" onRequestClose={() => setShowStarModal(false)}>
          <View style={[s.overlay, { justifyContent: 'center', padding: 20 }]}>
            <View style={s.listSheet}>
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>⭐  Select Star (Nakshatra)</Text>
                <TouchableOpacity onPress={() => setShowStarModal(false)}><MaterialIcons name="close" size={22} color={C.goldMuted} /></TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {starData.map(item => (
                  <TouchableOpacity key={item.key} style={[s.listItem, tab.star === item.value && s.listItemActive]} onPress={() => handleStarSelect(item.value)}>
                    {tab.star === item.value && <Text style={s.listCheckmark}>✦</Text>}
                    <Text style={[s.listItemText, tab.star === item.value && s.listItemTextActive]}>{item.value}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Rasi Modal ── */}
        <Modal visible={showRasiModal} transparent animationType="fade" onRequestClose={() => setShowRasiModal(false)}>
          <View style={[s.overlay, { justifyContent: 'center', padding: 20 }]}>
            <View style={s.listSheet}>
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>🌙  Select Rasi (Moon Sign)</Text>
                <TouchableOpacity onPress={() => setShowRasiModal(false)}><MaterialIcons name="close" size={22} color={C.goldMuted} /></TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {rasiData.map(item => (
                  <TouchableOpacity key={item.key} style={[s.listItem, tab.rasi === item.value && s.listItemActive]} onPress={() => handleRasiSelect(item.value)}>
                    {tab.rasi === item.value && <Text style={s.listCheckmark}>✦</Text>}
                    <Text style={[s.listItemText, tab.rasi === item.value && s.listItemTextActive]}>{item.value}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Place Modal ── */}
        <Modal visible={showPlaceModal} transparent animationType="fade" onRequestClose={() => setShowPlaceModal(false)}>
          <View style={[s.overlay, { justifyContent: 'center', padding: 20 }]}>
            <View style={s.listSheet}>
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>📍  Select District</Text>
                <TouchableOpacity onPress={() => setShowPlaceModal(false)}><MaterialIcons name="close" size={22} color={C.goldMuted} /></TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {tamilNaduDistricts.map(item => (
                  <TouchableOpacity key={item.key} style={[s.listItem, tab.place === item.value && s.listItemActive]} onPress={() => handlePlaceSelect(item.value)}>
                    {tab.place === item.value && <Text style={s.listCheckmark}>✦</Text>}
                    <Text style={[s.listItemText, tab.place === item.value && s.listItemTextActive]}>{item.value}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerOrnament: { fontSize: 10, color: C.goldMuted, letterSpacing: 6, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Rubik-Bold', color: C.cream, letterSpacing: 0.3 },
  headerSub: { fontSize: 11, color: C.creamSoft, marginTop: 2, letterSpacing: 0.5 },

  // ── Divider ──
  divider: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.glassBorder },
  dividerGem: { fontSize: 10, color: C.gold, marginHorizontal: 8 },

  // ── Tab ──
  tabWrap: { paddingHorizontal: 20, marginBottom: 16 },
  tabTrack: {
    flexDirection: 'row', backgroundColor: 'rgba(255,215,160,0.07)',
    borderRadius: 999, padding: 4, position: 'relative',
    borderWidth: 1, borderColor: C.glassBorder,
  },
  tabPill: {
    position: 'absolute', top: 4, left: 4, bottom: 4, width: '50%',
    backgroundColor: C.goldDark, borderRadius: 999,
    shadowColor: C.gold, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, gap: 6, zIndex: 1 },
  tabEmoji: { fontSize: 16 },
  tabLabel: { fontSize: 14, fontFamily: 'Rubik-Medium', color: C.creamSoft },
  tabLabelActive: { color: C.cream, fontFamily: 'Rubik-Bold' },

  // ── Scroll ──
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },

  // ── Glass Card ──
  glassCard: {
    backgroundColor: C.glass,
    borderRadius: 20, borderWidth: 1, borderColor: C.glassBorder,
    padding: 18, marginBottom: 16,
  },
  personLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 8 },
  personLabelLine: { flex: 1, height: 1, backgroundColor: C.goldFaint },
  personLabelText: { fontSize: 12, fontFamily: 'Rubik-Bold', color: C.goldMuted, textTransform: 'uppercase', letterSpacing: 1 },

  // ── Fields ──
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 10, fontFamily: 'Rubik-Bold', color: C.goldMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 7 },
  fieldInput: {
    backgroundColor: C.glassActive, borderWidth: 1, borderColor: C.glassBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: C.cream, fontFamily: 'Rubik-Regular',
  },
  fieldButton: {
    backgroundColor: C.glassActive, borderWidth: 1, borderColor: C.glassBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, height: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  fieldButtonText: { flex: 1, fontSize: 15, color: C.cream, fontFamily: 'Rubik-Regular' },

  // ── Summary chips ──
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  summaryChip: { backgroundColor: C.goldFaint, borderRadius: 20, borderWidth: 1, borderColor: C.glassBorder, paddingHorizontal: 12, paddingVertical: 6 },
  summaryChipText: { fontSize: 11, color: C.creamMid, fontFamily: 'Rubik-Medium' },
  summaryX: { fontSize: 16, color: C.goldMuted },

  // ── Submit ──
  submitWrap: {
    borderRadius: 999, marginBottom: 8,
    shadowColor: C.gold, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  submitBtn: { borderRadius: 999, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitIcon: { fontSize: 16, color: C.bg2 },
  submitText: { fontSize: 17, fontFamily: 'Rubik-Bold', color: C.bg2, letterSpacing: 0.5 },

  // ── Modal overlay ──
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.sheetBg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32,
    borderTopWidth: 1, borderColor: C.sheetBorder,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: 'rgba(212,175,55,0.3)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.sheetBorder },
  sheetTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: C.cream },
  sheetDoneBtn: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  sheetDoneInner: { paddingVertical: 14, alignItems: 'center' },
  sheetDoneText: { color: C.bg2, fontSize: 15, fontFamily: 'Rubik-Bold' },

  // ── List sheet (center modal) ──
  listSheet: {
    backgroundColor: C.sheetBg, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: C.sheetBorder,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.08)',
  },
  listItemActive: { backgroundColor: C.goldFaint },
  listCheckmark: { fontSize: 10, color: C.gold, marginRight: 10, width: 16 },
  listItemText: { fontSize: 15, color: C.creamMid, fontFamily: 'Rubik-Regular' },
  listItemTextActive: { color: C.gold, fontFamily: 'Rubik-Bold' },

  // ── Time Picker ──
  timePickerContainer: { marginTop: 8 },
  timePickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  timePickerCol: { flex: 1, alignItems: 'center' },
  timePickerLabel: { fontSize: 12, color: C.goldMuted, marginBottom: 8, fontFamily: 'Rubik-Medium', textTransform: 'uppercase', letterSpacing: 0.8 },
  timePickerScroll: { maxHeight: 180 },
  timeItem: { paddingVertical: 10, alignItems: 'center', width: '100%' },
  timeItemActive: { backgroundColor: C.goldFaint, borderRadius: 8 },
  timeItemText: { fontSize: 18, color: C.creamSoft },
  timeItemTextActive: { color: C.gold, fontFamily: 'Rubik-Bold' },
  periodWrap: { gap: 8, marginTop: 4 },
  periodBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)' },
  periodBtnActive: { backgroundColor: C.goldFaint, borderColor: C.gold },
  periodText: { fontSize: 14, color: C.creamSoft, fontFamily: 'Rubik-Medium', textAlign: 'center' },
  periodTextActive: { color: C.gold, fontFamily: 'Rubik-Bold' },
});

export default StarMatch;
