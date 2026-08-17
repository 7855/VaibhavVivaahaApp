import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  StatusBar,
  Alert
} from 'react-native';
// react-native's own SafeAreaView is a NO-OP on Android — it only insets on iOS. This screen is
// registered HEADERLESS in screens/_layout.tsx and the app builds edge-to-edge (targetSdk 35),
// so with the built-in version nothing reserved space for the status bar or the gesture/nav bar
// and the page header + bottom button rendered underneath both. The context version insets on
// both platforms.
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import userApi from '../api/userApi';

const { width } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────
const C = {
  bg: '#F9F6F1',
  cardBg: '#FFFFFF',
  headerBg: '#FFFFFF',
  ink: '#1C1917',
  inkMid: '#57534E',
  inkSoft: '#78716C',
  inkMute: '#A8A29E',
  gold: '#C07D20',
  goldDark: '#92580F',
  goldLight: '#FEF3C7',
  goldBorder: '#F6D589',
  pass: '#15803D',
  passBg: '#DCFCE7',
  passBorder: '#86EFAC',
  fail: '#DC2626',
  failBg: '#FEE2E2',
  failBorder: '#FCA5A5',
  partial: '#C2410C',
  partialBg: '#FFEDD5',
  partialBorder: '#FDBA74',
  border: '#E7E5E4',
  shadow: 'rgba(28,25,23,0.06)',
};

interface PoruthamResult {
  key: string;
  name: string;
  result: string;
  reason: string;
  weight: number;
  score: number;
}

interface MatchResult {
  score: number;
  percentage: number;
  verdict: string;
  totalWeight: number;
  results: PoruthamResult[];
}

interface FormData {
  bride: { name: string; dob: string; tob: string; place: string; star: string; rasi: string; };
  groom: { name: string; dob: string; tob: string; place: string; star: string; rasi: string; };
}

const StarMatchResult = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<MatchResult | null>(null);
  const { formData } = useLocalSearchParams<{ formData: string }>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        let requestData = {
          bride: { name: 'Bride', dob: '1990-01-01', tob: '00:00', place: 'Unknown', star: 'Aswini', rasi: 'mesham' },
          groom: { name: 'Groom', dob: '1990-01-01', tob: '00:00', place: 'Unknown', star: 'Aswini', rasi: 'mesham' },
        };

        if (formData) {
          try {
            requestData = JSON.parse(formData);
          } catch (e) {
            console.error('Error parsing formData:', e);
          }
        }

        const response = await userApi.starMatching(requestData);

        if (response.data?.code === 403 && response.data?.message === 'INTEREST_NOT_APPROVED') {
          Alert.alert('Not connected yet', 'You can check Star Match compatibility once this member accepts your interest.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }

        if (response.data && response.data.data) {
          const apiData = response.data.data;
          setResult({
            score: apiData.score,
            percentage: apiData.percentage,
            totalWeight: apiData.totalWeight,
            verdict: apiData.verdict,
            results: apiData.results || [],
          });
        } else {
          Alert.alert('Error', response.data?.message || 'Failed to fetch compatibility results. Please try again.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      } catch (error) {
        console.error('Error fetching star match data:', error);
        setResult({ score: 0, percentage: 0, totalWeight: 100, verdict: 'ERROR', results: [] });
        Alert.alert('Error', 'Failed to fetch compatibility results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [formData]);

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'PASS': return { text: C.pass, bg: C.passBg, border: C.passBorder };
      case 'FAIL': return { text: C.fail, bg: C.failBg, border: C.failBorder };
      case 'PARTIAL': return { text: C.partial, bg: C.partialBg, border: C.partialBorder };
      default: return { text: C.inkSoft, bg: '#F5F5F4', border: C.border };
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'PASS': return '✓';
      case 'FAIL': return '✗';
      case 'PARTIAL': return '~';
      default: return '?';
    }
  };

  const getPoruthamIcon = (key: string) => {
    const icons: Record<string, string> = {
      nadi: 'water', rajju: 'link-variant', gana: 'account-group', yoni: 'paw',
      mahendra: 'crown', streedhirga: 'gender-female', rasi: 'zodiac-aries',
      rasi_adhipathi: 'star', vasya: 'handshake', dina: 'calendar-heart',
    };
    return icons[key] || 'help-circle';
  };

  const getVerdictLabel = (verdict: string) => {
    if (!verdict) return 'Result';
    return verdict.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  const getVerdictMeta = (pct: number) => {
    if (pct >= 80) return { label: 'Excellent Match', sub: 'A highly auspicious and prosperous union' };
    if (pct >= 60) return { label: 'Good Match', sub: 'A compatible and harmonious alliance' };
    if (pct >= 40) return { label: 'Average Match', sub: 'Compatibility exists with some caution' };
    return { label: 'Low Match', sub: 'Consider consulting an astrologer' };
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 70) return C.pass;
    if (pct >= 40) return C.partial;
    return C.fail;
  };

  const handleShare = async () => {
    if (!result || !formData) return;
    try {
      const parsed: FormData = JSON.parse(formData as string);
      const emoji = (r: string) => r === 'PASS' ? '✅' : r === 'FAIL' ? '❌' : '⚠️';
      const lines = result.results.map(r => `${emoji(r.result)} ${r.name}: ${r.score}/${r.weight}`);
      const message = [
        `🌟 Jathaga Porutham Result`,
        `👰 Bride: ${parsed.bride.name} (${parsed.bride.star} / ${parsed.bride.rasi})`,
        `🤵 Groom: ${parsed.groom.name} (${parsed.groom.star} / ${parsed.groom.rasi})`,
        ``,
        `📊 Score: ${result.score}/${result.totalWeight} Points (${result.percentage}%)`,
        `🏆 Verdict: ${result.verdict}`,
        ``,
        `Detailed Porutham:`,
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
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={s.loadingText}>Analysing compatibility…</Text>
        <Text style={s.loadingHint}>Computing Jathaga Porutham</Text>
      </View>
    );
  }

  const verdictMeta = getVerdictMeta(result.percentage);
  const progressColor = getProgressColor(result.percentage);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.headerBg} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <MaterialIcons name="chevron-left" size={26} color={C.ink} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Jathaga Porutham</Text>
          <Text style={s.headerSub}>Compatibility Analysis</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={s.iconBtn}>
          <MaterialIcons name="share" size={22} color={C.inkMid} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Score Hero */}
        <LinearGradient
          colors={['#FEF9EF', '#FDF4DC', '#F9ECC8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={s.heroCard}
        >
          <View style={s.circleWrap}>
            <LinearGradient
              colors={['#E9A922', '#C07D20', '#92580F']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={s.circleOuter}
            >
              <View style={s.circleInner}>
                <Text style={s.circlePct}>{result.percentage}%</Text>
                <Text style={s.circleLabel}>Match</Text>
              </View>
            </LinearGradient>
            <Text style={s.starDeco}>✦</Text>
          </View>

          <Text style={s.verdictHeading}>{verdictMeta.label}</Text>
          <Text style={s.verdictBody}>{verdictMeta.sub}</Text>

          <View style={s.verdictPill}>
            <Text style={s.verdictPillText}>{getVerdictLabel(result.verdict)}</Text>
          </View>

          <View style={s.summaryBox}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Total Score</Text>
              <Text style={s.summaryScore}>{result.score} / {result.totalWeight} pts</Text>
            </View>
            <View style={s.bar}>
              <View style={[s.barFill, { width: `${(result.score / result.totalWeight) * 100}%` as any, backgroundColor: progressColor }]} />
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryFactors}>{result.results.length} factors checked</Text>
              <Text style={[s.summaryPct, { color: progressColor }]}>{result.percentage}% compatible</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Section header */}
        <View style={s.sectionHead}>
          <View style={s.sectionAccent} />
          <Text style={s.sectionTitle}>Detailed Analysis</Text>
        </View>

        {/* Result cards */}
        <View style={s.cardList}>
          {result.results.map((item) => {
            const sc = getStatusColors(item.result);
            return (
              <View key={item.key} style={s.card}>
                <View style={s.cardBody}>
                  <View style={s.cardTopRow}>
                    <View style={[s.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                      <Text style={[s.badgeText, { color: sc.text }]}>
                        {getStatusEmoji(item.result)} {item.result}
                      </Text>
                    </View>
                    <Text style={s.cardScore}>{item.score} / {item.weight}</Text>
                  </View>
                  <Text style={s.cardName}>{item.name}</Text>
                  <Text style={s.cardReason}>{item.reason}</Text>
                </View>
                <View style={[s.cardIconWrap, { backgroundColor: sc.bg }]}>
                  <MaterialCommunityIcons name={getPoruthamIcon(item.key) as any} size={26} color={sc.text} />
                </View>
                <View style={[s.cardStrip, { backgroundColor: sc.text }]} />
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity
          style={s.footerBtn}
          onPress={() => router.push('/(root)/screens/StarMatch')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="refresh" size={18} color="#FFFBF0" style={{ marginRight: 8 }} />
          <Text style={s.footerBtnText}>Check Another Match</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const SHADOW = {
  shadowColor: C.shadow,
  shadowOpacity: 1,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
};

const s = StyleSheet.create({
  // White (not C.bg) so the safe-area insets match the white header above and white footer
  // below that they sit against — otherwise the cream page colour showed as a seam in the
  // status-bar and nav-bar strips. The scroll body keeps C.bg explicitly, below.
  safe: { flex: 1, backgroundColor: C.headerBg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, gap: 10 },
  loadingText: { fontSize: 16, fontFamily: 'Rubik-Medium', color: C.ink, marginTop: 6 },
  loadingHint: { fontSize: 13, color: C.inkSoft },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.headerBg, paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F4',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Rubik-Bold', color: C.ink },
  headerSub: { fontSize: 12, color: C.inkSoft, marginTop: 1 },
  scroll: { flex: 1, backgroundColor: C.bg },
  heroCard: { alignItems: 'center', paddingTop: 28, paddingBottom: 28, paddingHorizontal: 20 },
  circleWrap: { position: 'relative', marginBottom: 20 },
  circleOuter: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', padding: 6 },
  circleInner: { width: '100%', height: '100%', borderRadius: 80, backgroundColor: '#FFFBF0', justifyContent: 'center', alignItems: 'center' },
  circlePct: { fontSize: 40, fontFamily: 'Rubik-Bold', color: C.goldDark, lineHeight: 44 },
  circleLabel: { fontSize: 12, fontFamily: 'Rubik-Medium', color: C.gold, textTransform: 'uppercase', letterSpacing: 1 },
  starDeco: { position: 'absolute', top: -8, right: -12, fontSize: 22, color: C.gold, opacity: 0.5 },
  verdictHeading: { fontSize: 22, fontFamily: 'Rubik-Bold', color: C.ink, textAlign: 'center', marginBottom: 4 },
  verdictBody: { fontSize: 13, color: C.inkMid, textAlign: 'center', marginBottom: 14, paddingHorizontal: 20 },
  verdictPill: { backgroundColor: C.goldLight, borderRadius: 20, borderWidth: 1, borderColor: C.goldBorder, paddingHorizontal: 16, paddingVertical: 5, marginBottom: 20 },
  verdictPillText: { fontSize: 12, fontFamily: 'Rubik-Bold', color: C.goldDark, textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryBox: { width: '100%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.goldBorder },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryLabel: { fontSize: 12, fontFamily: 'Rubik-Medium', color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryScore: { fontSize: 14, fontFamily: 'Rubik-Bold', color: C.ink },
  summaryFactors: { fontSize: 11, color: C.inkMute },
  summaryPct: { fontSize: 12, fontFamily: 'Rubik-Bold' },
  bar: { height: 8, backgroundColor: '#E7E5E4', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 14, gap: 8 },
  sectionAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: C.gold },
  sectionTitle: { fontSize: 18, fontFamily: 'Rubik-Bold', color: C.ink },
  cardList: { paddingHorizontal: 12, gap: 10 },
  card: { flexDirection: 'row', backgroundColor: C.cardBg, borderRadius: 14, padding: 14, overflow: 'hidden', marginBottom: 10, ...SHADOW },
  cardBody: { flex: 1, marginRight: 10 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontFamily: 'Rubik-Bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardScore: { fontSize: 12, fontFamily: 'Rubik-Medium', color: C.inkMid },
  cardName: { fontSize: 15, fontFamily: 'Rubik-Bold', color: C.ink, marginBottom: 3 },
  cardReason: { fontSize: 12, color: C.inkSoft, lineHeight: 17 },
  cardIconWrap: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  footer: { backgroundColor: C.cardBg, padding: 16, borderTopWidth: 1, borderTopColor: C.border, ...SHADOW },
  footerBtn: { backgroundColor: C.goldDark, height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerBtnText: { fontSize: 15, fontFamily: 'Rubik-Bold', color: '#FFFBF0', letterSpacing: 0.3 },
});

export default StarMatchResult;
