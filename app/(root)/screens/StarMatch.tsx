import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserData } from '../contexts/UserDataContext';
import userApi from '../api/userApi';

// ─── Royal palette — midnight navy × antique gold ─────────────────────────────
// Shared with StarMatchResult.tsx so the two screens read as one ceremony.
export const ROYAL = {
  navy0: '#070D1F',
  navy1: '#0C1631',
  navy2: '#13224A',
  navy3: '#1B2D5E',
  goldLight: '#F3DA8C',
  gold: '#D4AF37',
  goldDeep: '#A8852C',
  goldLine: 'rgba(212,175,55,0.38)',
  goldFaint: 'rgba(212,175,55,0.12)',
  goldGlow: 'rgba(212,175,55,0.55)',
  cream: '#FBF6EA',
  creamMid: 'rgba(251,246,234,0.78)',
  creamSoft: 'rgba(251,246,234,0.5)',
  creamMute: 'rgba(251,246,234,0.32)',
  fill: 'rgba(255,255,255,0.05)',
  fillActive: 'rgba(212,175,55,0.10)',
  danger: '#F08A8A',
  overlay: 'rgba(3,7,20,0.78)',
};
const C = ROYAL;

// The Tamil 10-porutham method needs exactly two facts per person: birth star and rasi.
export const STAR_LIST = [
  'Aswini', 'Bharani', 'Krithikai', 'Rohini', 'Mirugasiridham', 'Thiruvathirai',
  'Punarpusam', 'Poosam', 'Ayilyam', 'Magam', 'Pooram', 'Uthiram',
  'Hastham', 'Chithirai', 'Swathi', 'Visagam', 'Anusham', 'Kettai',
  'Moolam', 'Pooradam', 'Uthiradam', 'Thiruvonam', 'Avittam', 'Sathayam',
  'Poorattathi', 'Uthirattathi', 'Revathi',
];

export const RASI_LIST = [
  'Mesham', 'Rishabam', 'Mithunam', 'Kadagam', 'Simmam', 'Kanni',
  'Thulam', 'Viruchigam', 'Dhanusu', 'Magaram', 'Kumbam', 'Meenam',
];

const norm = (s: string) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

// The edit page stores "Vrichigam" / "Dhanushu" / "Makaram"; older rows carry other
// spellings. Map every known spelling onto the picker's canonical name so a saved moon
// sign always prefills. The server accepts all of these too.
const RASI_ALIASES: Record<string, string> = {
  mesha: 'Mesham', aries: 'Mesham',
  rishabha: 'Rishabam', vrishabha: 'Rishabam', taurus: 'Rishabam',
  mithuna: 'Mithunam', gemini: 'Mithunam',
  katagam: 'Kadagam', kataka: 'Kadagam', karka: 'Kadagam', cancer: 'Kadagam',
  simham: 'Simmam', simha: 'Simmam', leo: 'Simmam',
  kanya: 'Kanni', virgo: 'Kanni',
  thula: 'Thulam', tula: 'Thulam', libra: 'Thulam',
  vrichigam: 'Viruchigam', viruchagam: 'Viruchigam', vrischikam: 'Viruchigam', scorpio: 'Viruchigam',
  dhanushu: 'Dhanusu', dhanus: 'Dhanusu', dhanu: 'Dhanusu', sagittarius: 'Dhanusu',
  makaram: 'Magaram', makara: 'Magaram', capricorn: 'Magaram',
  kumba: 'Kumbam', kumbha: 'Kumbam', aquarius: 'Kumbam',
  meena: 'Meenam', pisces: 'Meenam',
};
const STAR_ALIASES: Record<string, string> = {
  karthigai: 'Krithikai', kiruthigai: 'Krithikai',
  mirugashirisham: 'Mirugasiridham', mirugasritam: 'Mirugasiridham',
  thiruvadhirai: 'Thiruvathirai', punarpoosam: 'Punarpusam', maham: 'Magam',
};

export const findMatchingRasi = (v: string) => {
  const k = norm(v);
  if (!k) return '';
  return RASI_LIST.find(r => norm(r) === k) || RASI_ALIASES[k] || '';
};
export const findMatchingStar = (v: string) => {
  const k = norm(v);
  if (!k) return '';
  return STAR_LIST.find(s => norm(s) === k) || STAR_ALIASES[k] || '';
};

type Person = { name: string; star: string; rasi: string };
type Side = 'bride' | 'groom';
type PickerTarget = { side: Side; field: 'star' | 'rasi' } | null;

const StarMatch = () => {
  const { viewedProfile, viewedUserId } = useLocalSearchParams<{ viewedProfile?: string; viewedUserId?: string }>();
  const { userData } = useUserData();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formData, setFormData] = useState<{ bride: Person; groom: Person }>({
    bride: { name: '', star: '', rasi: '' },
    groom: { name: '', star: '', rasi: '' },
  });
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoadingData(true);
        let viewedData: any = {};
        if (viewedProfile) {
          try { viewedData = JSON.parse(viewedProfile); } catch { }
        }
        let loggedInData: any = {};
        if (userData.userId) {
          try {
            const response = await userApi.getProfileDetailByUserId(userData.userId);
            const profile = response?.data?.data;
            if (profile) {
              const detail = profile.userDetail?.[0];
              let star = '', rasi = '';
              if (detail) {
                try {
                  const astro = (JSON.parse(detail.astronomicInfo || '[]'))[0] || {};
                  star = astro.star || ''; rasi = astro.moon_sign || '';
                } catch { }
              }
              loggedInData = {
                name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
                gender: profile.gender || userData.gender || '',
                star, rasi,
              };
            }
          } catch {
            loggedInData = {
              name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
              gender: userData.gender || '', star: '', rasi: '',
            };
          }
        }
        // Sides are assigned by GENDER, not by which profile was opened: a female viewer's
        // own details land in Bride and the viewed man's in Groom.
        const lg = loggedInData.gender || '';
        const vg = viewedData.gender || '';
        let brideData: any = {}, groomData: any = {};
        if (lg === 'F') { brideData = loggedInData; groomData = viewedData; }
        else if (lg === 'M') { groomData = loggedInData; brideData = viewedData; }
        else if (vg === 'M') { groomData = viewedData; brideData = loggedInData; }
        else { brideData = viewedData; groomData = loggedInData; }

        setFormData({
          bride: { name: brideData.name || '', star: findMatchingStar(brideData.star || ''), rasi: findMatchingRasi(brideData.rasi || '') },
          groom: { name: groomData.name || '', star: findMatchingStar(groomData.star || ''), rasi: findMatchingRasi(groomData.rasi || '') },
        });
      } catch { } finally { setIsLoadingData(false); }
    };
    loadProfileData();
  }, [viewedProfile, userData.userId]);

  const setField = (side: Side, key: keyof Person, value: string) =>
    setFormData(p => ({ ...p, [side]: { ...p[side], [key]: value } }));

  const isComplete = (p: Person) => !!(p.star && p.rasi);
  const allComplete = isComplete(formData.bride) && isComplete(formData.groom);

  const handleSubmit = () => {
    if (!allComplete) {
      // Missing fields are outlined in place instead of a system alert; the first
      // incomplete card is scrolled into view.
      setShowErrors(true);
      scrollRef.current?.scrollTo({ y: isComplete(formData.bride) ? 380 : 0, animated: true });
      return;
    }
    const requestData: any = {
      bride: { name: formData.bride.name.trim() || 'Bride', star: formData.bride.star, rasi: formData.bride.rasi },
      groom: { name: formData.groom.name.trim() || 'Groom', star: formData.groom.star, rasi: formData.groom.rasi },
    };
    if (viewedUserId) { requestData.requesterUserId = userData.userId; requestData.viewedUserId = viewedUserId; }
    router.push({ pathname: '/(root)/screens/StarMatchResult', params: { formData: JSON.stringify(requestData) } });
  };

  const pickerList = picker?.field === 'star' ? STAR_LIST : RASI_LIST;
  const pickerValue = picker ? formData[picker.side][picker.field] : '';

  const renderPersonCard = (side: Side) => {
    const p = formData[side];
    const isBride = side === 'bride';
    const done = isComplete(p);
    const starMissing = showErrors && !p.star;
    const rasiMissing = showErrors && !p.rasi;
    return (
      <View style={s.card}>
        <LinearGradient colors={[C.goldFaint, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.cardSheen} pointerEvents="none" />
        <View style={s.cardHead}>
          <View style={s.monogram}>
            <MaterialCommunityIcons name={isBride ? 'face-woman' : 'face-man'} size={22} color={C.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{isBride ? 'Bride' : 'Groom'}</Text>
            <Text style={s.cardSub}>{isBride ? 'Counted from her star' : 'Counted to his star'}</Text>
          </View>
          <View style={[s.statusChip, done && s.statusChipDone]}>
            <MaterialCommunityIcons name={done ? 'check' : 'circle-outline'} size={12} color={done ? C.navy0 : C.goldDeep} />
            <Text style={[s.statusChipText, done && s.statusChipTextDone]}>{done ? 'Ready' : 'Pending'}</Text>
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Name <Text style={s.labelOptional}>optional</Text></Text>
          <View style={s.inputWrap}>
            <MaterialCommunityIcons name="account-outline" size={19} color={C.goldDeep} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder={isBride ? "Bride's name" : "Groom's name"}
              placeholderTextColor={C.creamMute}
              value={p.name}
              maxLength={50}
              onChangeText={text => setField(side, 'name', text)}
            />
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Birth star · Natchathiram</Text>
          <TouchableOpacity style={[s.select, starMissing && s.selectError]} onPress={() => setPicker({ side, field: 'star' })} activeOpacity={0.8}>
            <MaterialCommunityIcons name="star-four-points-outline" size={19} color={C.goldDeep} style={s.inputIcon} />
            <Text style={[s.selectText, !p.star && s.selectPlaceholder]}>{p.star || 'Choose star'}</Text>
            <MaterialIcons name="expand-more" size={22} color={C.gold} />
          </TouchableOpacity>
          {starMissing && <Text style={s.errorText}>Select the birth star</Text>}
        </View>

        <View style={[s.field, { marginBottom: 2 }]}>
          <Text style={s.label}>Rasi · Moon sign</Text>
          <TouchableOpacity style={[s.select, rasiMissing && s.selectError]} onPress={() => setPicker({ side, field: 'rasi' })} activeOpacity={0.8}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={19} color={C.goldDeep} style={s.inputIcon} />
            <Text style={[s.selectText, !p.rasi && s.selectPlaceholder]}>{p.rasi || 'Choose rasi'}</Text>
            <MaterialIcons name="expand-more" size={22} color={C.gold} />
          </TouchableOpacity>
          {rasiMissing && <Text style={s.errorText}>Select the rasi</Text>}
        </View>
      </View>
    );
  };

  if (isLoadingData) {
    return (
      <LinearGradient colors={[C.navy0, C.navy2, C.navy0]} style={s.loading}>
        <StatusBar barStyle="light-content" />
        <View style={s.loadingRing}>
          <ActivityIndicator size="large" color={C.gold} />
        </View>
        <Text style={s.loadingTitle}>Preparing the horoscopes</Text>
        <Text style={s.loadingSub}>Reading the saved star and rasi</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[C.navy0, C.navy1, C.navy2, C.navy1]} locations={[0, 0.3, 0.7, 1]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="arrow-back-ios-new" size={18} color={C.gold} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.eyebrow}>Tamil 10-porutham</Text>
            <Text style={s.title}>Thirumana Porutham</Text>
          </View>
          <View style={{ width: 42 }} />
        </View>

        <View style={s.rule}>
          <View style={s.ruleLine} />
          <View style={s.ruleGem} />
          <View style={s.ruleLine} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[s.scroll, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderPersonCard('bride')}

          <View style={s.joiner}>
            <View style={s.joinerLine} />
            <View style={s.joinerBadge}>
              <MaterialCommunityIcons name="infinity" size={16} color={C.gold} />
            </View>
            <View style={s.joinerLine} />
          </View>

          {renderPersonCard('groom')}

          <View style={s.note}>
            <MaterialCommunityIcons name="information-outline" size={15} color={C.goldDeep} />
            <Text style={s.noteText}>
              Only the birth star and rasi are needed. Date, time and place of birth do not affect the ten poruthams.
            </Text>
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) + 4 }]}>
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.88} style={[s.ctaWrap, !allComplete && s.ctaWrapMuted]}>
            <LinearGradient colors={[C.goldLight, C.gold, C.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}>
              <MaterialCommunityIcons name="shield-star-outline" size={20} color={C.navy0} />
              <Text style={s.ctaText}>Check Porutham</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.footerHint}>
            {allComplete ? 'Both horoscopes are ready' : 'Fill the star and rasi for both to continue'}
          </Text>
        </View>

        <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setPicker(null)}>
            <TouchableOpacity activeOpacity={1} onPress={() => { }} style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <View style={s.sheetHandle} />
              <View style={s.sheetHead}>
                <View>
                  <Text style={s.sheetEyebrow}>{picker?.side === 'bride' ? 'Bride' : 'Groom'}</Text>
                  <Text style={s.sheetTitle}>{picker?.field === 'star' ? 'Birth star' : 'Rasi'}</Text>
                </View>
                <TouchableOpacity onPress={() => setPicker(null)} style={s.sheetClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="close" size={20} color={C.gold} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
                {pickerList.map((item, i) => {
                  const active = pickerValue === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[s.row, active && s.rowActive]}
                      onPress={() => { if (picker) setField(picker.side, picker.field, item); setPicker(null); }}
                      activeOpacity={0.8}
                    >
                      <View style={[s.rowIndex, active && s.rowIndexActive]}>
                        <Text style={[s.rowIndexText, active && s.rowIndexTextActive]}>{i + 1}</Text>
                      </View>
                      <Text style={[s.rowText, active && s.rowTextActive]}>{item}</Text>
                      {active && <MaterialCommunityIcons name="check-circle" size={20} color={C.gold} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
};

const s = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: C.goldLine, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  loadingTitle: { color: C.cream, fontSize: 17, fontFamily: 'Rubik-Medium', letterSpacing: 0.3 },
  loadingSub: { color: C.creamSoft, fontSize: 12.5, marginTop: 6, fontFamily: 'Rubik-Regular' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 },
  backBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.goldLine, backgroundColor: C.fill, justifyContent: 'center', alignItems: 'center', paddingLeft: 2 },
  headerCenter: { flex: 1, alignItems: 'center' },
  eyebrow: { fontSize: 10.5, fontFamily: 'Rubik-Medium', color: C.gold, letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 3 },
  title: { fontSize: 22, fontFamily: 'Rubik-Bold', color: C.cream, letterSpacing: 0.2 },

  rule: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 60, marginTop: 10, marginBottom: 14, gap: 10 },
  ruleLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.goldLine },
  ruleGem: { width: 7, height: 7, backgroundColor: C.gold, transform: [{ rotate: '45deg' }] },

  scroll: { paddingHorizontal: 18 },

  card: { backgroundColor: C.fill, borderRadius: 22, borderWidth: 1, borderColor: C.goldLine, padding: 18, overflow: 'hidden' },
  cardSheen: { position: 'absolute', left: 0, right: 0, top: 0, height: 90 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  monogram: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: C.gold, backgroundColor: C.goldFaint, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontFamily: 'Rubik-Bold', color: C.cream, letterSpacing: 0.3 },
  cardSub: { fontSize: 11.5, fontFamily: 'Rubik-Regular', color: C.creamSoft, marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.goldLine, backgroundColor: 'transparent' },
  statusChipDone: { backgroundColor: C.gold, borderColor: C.gold },
  statusChipText: { fontSize: 10.5, fontFamily: 'Rubik-Bold', color: C.goldDeep, letterSpacing: 0.8, textTransform: 'uppercase' },
  statusChipTextDone: { color: C.navy0 },

  field: { marginBottom: 14 },
  label: { fontSize: 10.5, fontFamily: 'Rubik-Medium', color: C.gold, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 },
  labelOptional: { color: C.creamMute, letterSpacing: 0.4, textTransform: 'none', fontFamily: 'Rubik-Regular' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 14, borderWidth: 1, borderColor: C.goldLine, backgroundColor: C.fillActive, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15.5, color: C.cream, fontFamily: 'Rubik-Regular', paddingVertical: 0 },
  select: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 14, borderWidth: 1, borderColor: C.goldLine, backgroundColor: C.fillActive, paddingHorizontal: 14 },
  selectError: { borderColor: C.danger },
  selectText: { flex: 1, fontSize: 15.5, color: C.cream, fontFamily: 'Rubik-Medium' },
  selectPlaceholder: { color: C.creamMute, fontFamily: 'Rubik-Regular' },
  errorText: { fontSize: 11.5, color: C.danger, fontFamily: 'Rubik-Regular', marginTop: 6, marginLeft: 2 },

  joiner: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, paddingHorizontal: 40, gap: 12 },
  joinerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.goldLine },
  joinerBadge: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.goldLine, backgroundColor: C.navy1, justifyContent: 'center', alignItems: 'center' },

  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 18, paddingHorizontal: 6 },
  noteText: { flex: 1, fontSize: 12, color: C.creamSoft, fontFamily: 'Rubik-Regular', lineHeight: 18 },

  footer: { paddingHorizontal: 18, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.goldLine, backgroundColor: 'rgba(7,13,31,0.92)' },
  ctaWrap: { borderRadius: 16, shadowColor: C.gold, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  ctaWrapMuted: { shadowOpacity: 0.15, elevation: 2, opacity: 0.92 },
  cta: { height: 58, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { fontSize: 16.5, fontFamily: 'Rubik-Bold', color: C.navy0, letterSpacing: 0.8 },
  footerHint: { textAlign: 'center', fontSize: 11.5, color: C.creamSoft, fontFamily: 'Rubik-Regular', marginTop: 10 },

  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.navy1, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, borderTopWidth: 1, borderColor: C.goldLine },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: C.goldLine, alignSelf: 'center', marginBottom: 14 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.goldLine },
  sheetEyebrow: { fontSize: 10.5, fontFamily: 'Rubik-Medium', color: C.gold, letterSpacing: 1.6, textTransform: 'uppercase' },
  sheetTitle: { fontSize: 19, fontFamily: 'Rubik-Bold', color: C.cream, marginTop: 2 },
  sheetClose: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.goldLine, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 12, marginTop: 2 },
  rowActive: { backgroundColor: C.fillActive },
  rowIndex: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: C.goldLine, justifyContent: 'center', alignItems: 'center' },
  rowIndexActive: { backgroundColor: C.gold, borderColor: C.gold },
  rowIndexText: { fontSize: 11.5, fontFamily: 'Rubik-Medium', color: C.creamSoft },
  rowIndexTextActive: { color: C.navy0, fontFamily: 'Rubik-Bold' },
  rowText: { flex: 1, fontSize: 15.5, color: C.creamMid, fontFamily: 'Rubik-Regular' },
  rowTextActive: { color: C.cream, fontFamily: 'Rubik-Bold' },
});

export default StarMatch;
