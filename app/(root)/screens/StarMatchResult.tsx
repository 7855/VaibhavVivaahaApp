import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  StatusBar,
  Alert,
} from 'react-native';
// react-native's own SafeAreaView is a NO-OP on Android — it only insets on iOS. This screen is
// registered HEADERLESS in screens/_layout.tsx and the app builds edge-to-edge, so the
// context version is required for the status bar and nav bar to be reserved on both platforms.
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import userApi from '../api/userApi';
import { ROYAL } from './StarMatch';

// Navy hero + cream body: the same ceremony as the form screen, with a light surface where
// ten cards of text have to be read.
const C = {
  ...ROYAL,
  page: '#F6F1E6',
  card: '#FFFDF8',
  cardLine: '#E9DFC8',
  ink: '#1A1F2E',
  inkMid: '#4A5062',
  inkSoft: '#767C8C',
  inkMute: '#A3A8B5',
  pass: '#1E7A46', passBg: '#E4F4EA', passLine: '#BFE3CC',
  mid: '#A8621B', midBg: '#FBEEDC', midLine: '#F1D5AE',
  fail: '#B93838', failBg: '#FBE6E6', failLine: '#F2C2C2',
};

type Grade = 'UTHAMAM' | 'MADHIMAM' | 'ADHAMAM' | 'UNKNOWN';

interface PoruthamResult {
  key: string;
  name: string;
  result: string;      // PASS / PARTIAL / FAIL / UNKNOWN (older jar)
  reason: string;
  weight: number;
  score: number;
  grade?: Grade;
  points?: number;
  essential?: boolean;
  counted?: boolean;
}

interface MatchResult {
  points: number;          // out of 10 (Uthamam 1, Madhimam ½)
  total: number;           // 10
  verdict: string;
  verdictNote: string;
  doshams: string[];
  essentialsPassed: number;
  essentialsTotal: number;
  uthamam: number;
  madhimam: number;
  adhamam: number;
  results: PoruthamResult[];
  extras: PoruthamResult[];
  brideStar: string; groomStar: string; brideRasi: string; groomRasi: string;
}

interface FormData {
  bride: { name: string; star: string; rasi: string };
  groom: { name: string; star: string; rasi: string };
}

// The five "mukkiya" poruthams a Tamil astrologer looks at first.
const ESSENTIAL_KEYS = ['dina', 'gana', 'yoni', 'rasi', 'rajju'];

const PORUTHAM_META: Record<string, { icon: string; about: string }> = {
  dina: { icon: 'calendar-heart', about: 'Health, prosperity and a life free of want' },
  gana: { icon: 'account-group-outline', about: 'Temperament and nature of the two people' },
  mahendra: { icon: 'crown-outline', about: 'Children and lasting affection' },
  streedhirga: { icon: 'flower-outline', about: 'The bride\'s long life and well-being' },
  yoni: { icon: 'paw-outline', about: 'Physical and intimate compatibility' },
  rasi: { icon: 'moon-waning-crescent', about: 'Harmony between the two moon signs' },
  rasi_adhipathi: { icon: 'star-four-points-outline', about: 'Friendship between the lords of the two rasis' },
  vasya: { icon: 'handshake-outline', about: 'Mutual attraction and understanding' },
  rajju: { icon: 'link-variant', about: 'Longevity of the marriage — the deciding porutham' },
  vedhai: { icon: 'shield-alert-outline', about: 'Absence of afflicting stars between the two' },
  nadi: { icon: 'water-outline', about: 'North Indian factor, shown for information only' },
};

const gradeOf = (r: PoruthamResult): Grade => {
  if (r.grade) return r.grade;
  if (r.result === 'PASS') return 'UTHAMAM';
  if (r.result === 'PARTIAL') return 'MADHIMAM';
  if (r.result === 'FAIL') return 'ADHAMAM';
  return 'UNKNOWN';
};
const pointsOf = (r: PoruthamResult) => typeof r.points === 'number' ? r.points : gradeOf(r) === 'UTHAMAM' ? 1 : gradeOf(r) === 'MADHIMAM' ? 0.5 : 0;
const fmtPts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const StarMatchResult = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [names, setNames] = useState<{ bride: string; groom: string }>({ bride: 'Bride', groom: 'Groom' });
  const { formData } = useLocalSearchParams<{ formData: string }>();

  useEffect(() => {
    const fetchData = async () => {
      let requestData: any = null;
      try { requestData = formData ? JSON.parse(formData) : null; } catch { }
      if (!requestData?.bride?.star || !requestData?.groom?.star) {
        Alert.alert('Missing details', 'Both stars are needed to check porutham.', [{ text: 'OK', onPress: () => router.back() }]);
        setIsLoading(false);
        return;
      }
      setNames({ bride: requestData.bride.name || 'Bride', groom: requestData.groom.name || 'Groom' });
      try {
        const response = await userApi.starMatching(requestData);
        const body = response.data;

        if (body?.code === 403 && body?.message === 'INTEREST_NOT_APPROVED') {
          Alert.alert('Not connected yet', 'You can check Star Match compatibility once this member accepts your interest.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }
        // HTTP 200 with the failure in the body (§17) — check the code, not just the promise.
        if (body?.code !== 200 || !body?.data) {
          Alert.alert('Could not check porutham', body?.message || 'Please try again.', [{ text: 'OK', onPress: () => router.back() }]);
          return;
        }

        const d = body.data;
        const results: PoruthamResult[] = (d.results || []).filter((r: PoruthamResult) => r.counted !== false);
        const extras: PoruthamResult[] = d.extras || [];
        // Older jar (weighted model) has no points — derive a 0-10 count from the rows so
        // the screen still reads sensibly until the deploy.
        const derivedPoints = results.reduce((acc, r) => acc + pointsOf(r), 0);
        const points = typeof d.poruthamPoints === 'number' ? d.poruthamPoints : derivedPoints;
        const essentials = results.filter(r => (r.essential ?? ESSENTIAL_KEYS.includes(r.key)));
        setResult({
          points,
          total: d.totalPoruthams || results.length || 10,
          verdict: d.verdict || '',
          verdictNote: d.verdictNote || '',
          doshams: d.doshams || [],
          essentialsPassed: typeof d.essentialsPassed === 'number' ? d.essentialsPassed : essentials.filter(r => pointsOf(r) > 0).length,
          essentialsTotal: typeof d.essentialsTotal === 'number' ? d.essentialsTotal : essentials.length,
          uthamam: d.uthamamCount ?? results.filter(r => gradeOf(r) === 'UTHAMAM').length,
          madhimam: d.madhimamCount ?? results.filter(r => gradeOf(r) === 'MADHIMAM').length,
          adhamam: d.adhamamCount ?? results.filter(r => gradeOf(r) === 'ADHAMAM').length,
          results,
          extras,
          brideStar: d.brideStar || requestData.bride.star, groomStar: d.groomStar || requestData.groom.star,
          brideRasi: d.brideRasi || requestData.bride.rasi, groomRasi: d.groomRasi || requestData.groom.rasi,
        });
      } catch (error) {
        console.error('Error fetching star match data:', error);
        Alert.alert('Could not check porutham', 'Please check your connection and try again.', [{ text: 'OK', onPress: () => router.back() }]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [formData]);

  const gradeStyle = (g: Grade) => {
    switch (g) {
      case 'UTHAMAM': return { text: C.pass, bg: C.passBg, line: C.passLine, label: 'Uthamam', icon: 'check' as const };
      case 'MADHIMAM': return { text: C.mid, bg: C.midBg, line: C.midLine, label: 'Madhimam', icon: 'tilde' as const };
      case 'ADHAMAM': return { text: C.fail, bg: C.failBg, line: C.failLine, label: 'Adhamam', icon: 'close' as const };
      default: return { text: C.inkSoft, bg: '#EFEBE2', line: C.cardLine, label: 'Unknown', icon: 'help' as const };
    }
  };

  const verdictMeta = (v: string, doshams: string[]) => {
    if (v.startsWith('EXCELLENT')) return { label: 'Excellent Match', color: C.goldLight };
    if (v.startsWith('GOOD')) return { label: 'Good Match', color: C.goldLight };
    if (v.startsWith('FAIR')) return { label: 'Fair Match', color: '#F2C77A' };
    if (doshams.length || v.startsWith('NOT')) return { label: 'Not Recommended', color: C.danger };
    return { label: v ? v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Result', color: C.cream };
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      const mark = (r: PoruthamResult) => ({ UTHAMAM: '✓', MADHIMAM: '~', ADHAMAM: '✗', UNKNOWN: '?' }[gradeOf(r)]);
      const lines = result.results.map(r => `${mark(r)} ${r.name}: ${gradeStyle(gradeOf(r)).label}`);
      const message = [
        `Thirumana Porutham`,
        `Bride: ${names.bride} — ${result.brideStar} / ${result.brideRasi}`,
        `Groom: ${names.groom} — ${result.groomStar} / ${result.groomRasi}`,
        ``,
        `${fmtPts(result.points)} of ${result.total} poruthams`,
        `${verdictMeta(result.verdict, result.doshams).label}${result.doshams.length ? ` (${result.doshams.join(', ')})` : ''}`,
        ``,
        ...lines,
        ``,
        `Checked via Vaibhav Vivaaha Matrimony`,
      ].join('\n');
      await Share.share({ message });
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading || !result) {
    return (
      <LinearGradient colors={[C.navy0, C.navy2, C.navy0]} style={s.loading}>
        <StatusBar barStyle="light-content" />
        <View style={s.loadingRing}><ActivityIndicator size="large" color={C.gold} /></View>
        <Text style={s.loadingTitle}>Counting the ten poruthams</Text>
        <Text style={s.loadingSub}>From the bride's star to the groom's</Text>
      </LinearGradient>
    );
  }

  const vm = verdictMeta(result.verdict, result.doshams);
  const essentials = result.results.filter(r => r.essential ?? ESSENTIAL_KEYS.includes(r.key));
  const others = result.results.filter(r => !(r.essential ?? ESSENTIAL_KEYS.includes(r.key)));
  const ringPct = Math.max(0, Math.min(1, result.points / result.total));

  const renderRow = (item: PoruthamResult, muted = false) => {
    const g = gradeOf(item);
    const gs = gradeStyle(g);
    const meta = PORUTHAM_META[item.key] || { icon: 'help-circle-outline', about: '' };
    return (
      <View key={item.key} style={[s.card, muted && { opacity: 0.8 }]}>
        <View style={[s.cardStrip, { backgroundColor: gs.text }]} />
        <View style={[s.cardIcon, { backgroundColor: gs.bg, borderColor: gs.line }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={22} color={gs.text} />
        </View>
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
            <View style={[s.badge, { backgroundColor: gs.bg, borderColor: gs.line }]}>
              <MaterialCommunityIcons name={gs.icon} size={11} color={gs.text} />
              <Text style={[s.badgeText, { color: gs.text }]}>{gs.label}</Text>
            </View>
          </View>
          <Text style={s.cardReason}>{item.reason}</Text>
          {!!meta.about && <Text style={s.cardAbout}>{meta.about}</Text>}
        </View>
      </View>
    );
  };

  const SectionHead = ({ title, sub, gold }: { title: string; sub: string; gold?: boolean }) => (
    <View style={s.sectionHead}>
      <View style={[s.sectionGem, !gold && { backgroundColor: C.inkMute }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.sectionTitle}>{title}</Text>
        <Text style={s.sectionSub}>{sub}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[C.navy0, C.navy1, C.navy2]} style={{ paddingTop: insets.top }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.hdrBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="arrow-back-ios-new" size={18} color={C.gold} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.eyebrow}>Tamil 10-porutham</Text>
            <Text style={s.title}>Thirumana Porutham</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={s.hdrBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="ios-share" size={19} color={C.gold} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <LinearGradient colors={[C.navy2, C.navy1, C.navy0]} style={s.hero}>
          <View style={s.pairRow}>
            <View style={s.pairCol}>
              <View style={s.pairIcon}><MaterialCommunityIcons name="face-woman" size={18} color={C.gold} /></View>
              <Text style={s.pairName} numberOfLines={1}>{names.bride}</Text>
              <Text style={s.pairStar}>{result.brideStar}</Text>
              <Text style={s.pairRasi}>{result.brideRasi}</Text>
            </View>
            <View style={s.pairJoin}><MaterialCommunityIcons name="infinity" size={16} color={C.gold} /></View>
            <View style={s.pairCol}>
              <View style={s.pairIcon}><MaterialCommunityIcons name="face-man" size={18} color={C.gold} /></View>
              <Text style={s.pairName} numberOfLines={1}>{names.groom}</Text>
              <Text style={s.pairStar}>{result.groomStar}</Text>
              <Text style={s.pairRasi}>{result.groomRasi}</Text>
            </View>
          </View>

          {/* Score ring: a gold arc whose length is the point share, over a faint full ring. */}
          <View style={s.ringWrap}>
            <View style={s.ringTrack} />
            <View style={[s.ringFill, { borderColor: C.gold, opacity: 0.25 + ringPct * 0.75 }]} />
            <View style={s.ringInner}>
              <Text style={s.ringPts}>{fmtPts(result.points)}<Text style={s.ringOf}> / {result.total}</Text></Text>
              <Text style={s.ringLabel}>poruthams</Text>
            </View>
          </View>

          <Text style={[s.verdict, { color: vm.color }]}>{vm.label}</Text>
          {!!result.verdictNote && <Text style={s.verdictNote}>{result.verdictNote}</Text>}

          {result.doshams.length > 0 && (
            <View style={s.doshamRow}>
              {result.doshams.map(d => (
                <View key={d} style={s.doshamPill}>
                  <MaterialCommunityIcons name="alert-outline" size={13} color={C.danger} />
                  <Text style={s.doshamText}>{d}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={s.counters}>
            {[
              { n: result.uthamam, l: 'Uthamam', c: C.goldLight },
              { n: result.madhimam, l: 'Madhimam', c: '#F2C77A' },
              { n: result.adhamam, l: 'Adhamam', c: C.danger },
              { n: `${result.essentialsPassed}/${result.essentialsTotal}`, l: 'Essential', c: result.essentialsPassed === result.essentialsTotal ? C.goldLight : '#F2C77A' },
            ].map((x, i) => (
              <React.Fragment key={x.l}>
                {i > 0 && <View style={s.counterDivider} />}
                <View style={s.counter}>
                  <Text style={[s.counterNum, { color: x.c }]}>{x.n}</Text>
                  <Text style={s.counterLbl}>{x.l}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        <SectionHead gold title="Essential poruthams" sub="Dina · Gana · Yoni · Rasi · Rajju — the five checked first" />
        <View style={s.list}>{essentials.map(r => renderRow(r))}</View>

        <SectionHead title="Other poruthams" sub="Mahendra · Stree Dheerga · Rasi Adhipathi · Vasiya · Vedhai" />
        <View style={s.list}>{others.map(r => renderRow(r))}</View>

        {result.extras.length > 0 && (
          <>
            <SectionHead title="For information" sub="Not one of the ten Tamil poruthams — not counted above" />
            <View style={s.list}>{result.extras.map(r => renderRow(r, true))}</View>
          </>
        )}

        <Text style={s.disclaimer}>
          Counted from the bride's star and rasi to the groom's, the Tamil way. A traditional guide — please confirm with your family astrologer before deciding.
        </Text>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) + 4 }]}>
        <TouchableOpacity style={s.ctaWrap} onPress={() => router.back()} activeOpacity={0.88}>
          <LinearGradient colors={[C.navy2, C.navy1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}>
            <MaterialCommunityIcons name="refresh" size={19} color={C.gold} />
            <Text style={s.ctaText}>Check Another Match</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: C.goldLine, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  loadingTitle: { color: C.cream, fontSize: 17, fontFamily: 'Rubik-Medium', letterSpacing: 0.3 },
  loadingSub: { color: C.creamSoft, fontSize: 12.5, marginTop: 6, fontFamily: 'Rubik-Regular' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12 },
  hdrBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.goldLine, backgroundColor: C.fill, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  eyebrow: { fontSize: 10.5, fontFamily: 'Rubik-Medium', color: C.gold, letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 3 },
  title: { fontSize: 20, fontFamily: 'Rubik-Bold', color: C.cream, letterSpacing: 0.2 },

  hero: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 26, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 22 },
  pairCol: { flex: 1, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: C.goldLine, backgroundColor: C.fill, paddingVertical: 12, paddingHorizontal: 8 },
  pairIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: C.goldLine, backgroundColor: C.goldFaint, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  pairName: { fontSize: 12, fontFamily: 'Rubik-Medium', color: C.creamMid, marginBottom: 2 },
  pairStar: { fontSize: 15, fontFamily: 'Rubik-Bold', color: C.cream },
  pairRasi: { fontSize: 11.5, color: C.creamSoft, marginTop: 1 },
  pairJoin: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: C.goldLine, justifyContent: 'center', alignItems: 'center' },

  ringWrap: { width: 172, height: 172, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  ringTrack: { position: 'absolute', width: 172, height: 172, borderRadius: 86, borderWidth: 6, borderColor: C.goldFaint },
  ringFill: { position: 'absolute', width: 172, height: 172, borderRadius: 86, borderWidth: 6 },
  ringInner: { width: 144, height: 144, borderRadius: 72, backgroundColor: C.navy0, borderWidth: 1, borderColor: C.goldLine, justifyContent: 'center', alignItems: 'center' },
  ringPts: { fontSize: 42, fontFamily: 'Rubik-Bold', color: C.goldLight, lineHeight: 48 },
  ringOf: { fontSize: 18, fontFamily: 'Rubik-Medium', color: C.gold },
  ringLabel: { fontSize: 10.5, fontFamily: 'Rubik-Medium', color: C.gold, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 },
  verdict: { fontSize: 24, fontFamily: 'Rubik-Bold', textAlign: 'center', letterSpacing: 0.3, marginBottom: 6 },
  verdictNote: { fontSize: 13, color: C.creamMid, textAlign: 'center', lineHeight: 19, paddingHorizontal: 10, marginBottom: 14 },
  doshamRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 14 },
  doshamPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(240,138,138,0.5)', backgroundColor: 'rgba(240,138,138,0.12)', paddingHorizontal: 12, paddingVertical: 6 },
  doshamText: { fontSize: 12, fontFamily: 'Rubik-Bold', color: C.danger, letterSpacing: 0.3 },
  counters: { flexDirection: 'row', alignItems: 'center', width: '100%', borderRadius: 16, borderWidth: 1, borderColor: C.goldLine, backgroundColor: C.fill, paddingVertical: 12 },
  counter: { flex: 1, alignItems: 'center' },
  counterNum: { fontSize: 19, fontFamily: 'Rubik-Bold' },
  counterLbl: { fontSize: 9.5, fontFamily: 'Rubik-Medium', color: C.creamSoft, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3 },
  counterDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: C.goldLine },

  sectionHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 12, gap: 12 },
  sectionGem: { width: 8, height: 8, backgroundColor: C.gold, transform: [{ rotate: '45deg' }] },
  sectionTitle: { fontSize: 17, fontFamily: 'Rubik-Bold', color: C.ink, letterSpacing: 0.2 },
  sectionSub: { fontSize: 11.5, color: C.inkSoft, marginTop: 2 },
  list: { paddingHorizontal: 14, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardLine, padding: 14, paddingLeft: 18, overflow: 'hidden', gap: 12 },
  cardStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardIcon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardName: { flex: 1, fontSize: 15, fontFamily: 'Rubik-Bold', color: C.ink },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 10.5, fontFamily: 'Rubik-Bold', letterSpacing: 0.4 },
  cardReason: { fontSize: 12.5, color: C.inkMid, lineHeight: 18 },
  cardAbout: { fontSize: 11, color: C.inkMute, marginTop: 3 },
  disclaimer: { fontSize: 11.5, color: C.inkMute, textAlign: 'center', paddingHorizontal: 28, marginTop: 22, lineHeight: 17 },

  footer: { paddingHorizontal: 18, paddingTop: 12, backgroundColor: C.page, borderTopWidth: 1, borderTopColor: C.cardLine },
  ctaWrap: { borderRadius: 16, borderWidth: 1, borderColor: C.goldLine, overflow: 'hidden' },
  cta: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { fontSize: 16, fontFamily: 'Rubik-Bold', color: C.goldLight, letterSpacing: 0.6 },
});

export default StarMatchResult;
