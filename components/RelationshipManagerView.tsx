import React, {useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  CheckCircle,
  Check,
  Shield,
  Clock,
  Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import userApi from '../app/(root)/api/userApi';
import { FALLBACK_UPGRADE_PLANS, getActivePlansSync } from '../app/(root)/utils/upgradeNavigation';
import { buildChecklistByPlan, type ChecklistRow } from '../app/(root)/utils/planChecklist';

const FALLBACK_PHONE = '+917904547565';
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Anytime'];

export interface AdminContact {
  phone?: string;
  whatsapp?: string;
  rmName?: string;
  rmTitle?: string;
  rmPhotoUrl?: string;
  callbackHours?: string;
}

interface Props {
  planTitle: string;
  planPrice: string;
  planPeriod: string;
  /** PAYMENT_MODE === 'INFO' — suppress the amount. The plan name and period still show; it is
   *  the price beside a contact-to-buy form that reads as an off-platform purchase funnel. */
  infoOnly?: boolean;
  encodedUserId: string | null;
  defaultName: string;
  defaultMobile: string;
  defaultEmail?: string;
  adminContact: AdminContact | null;
  popupError: (title: string, msg: string) => void;
}

// Gently bobbing chevron for the collapsed feature list's expand affordance — a small,
// continuous "there's more below" hint. Native-driver translateY loop, cheap to run.
const BobbingChevron = () => {
  const bob = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 4, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  return (
    <Animated.View style={{ transform: [{ translateY: bob }] }}>
      <ChevronDown size={16} color="#1F7FE5" strokeWidth={2.5} />
    </Animated.View>
  );
};

const RelationshipManagerView: React.FC<Props> = ({
  planTitle,
  planPrice,
  planPeriod,
  infoOnly = false,
  encodedUserId,
  defaultName,
  defaultMobile,
  defaultEmail,
  adminContact,
  popupError,
}) => {
  const phone = adminContact?.phone || FALLBACK_PHONE;
  const whatsapp = (adminContact?.whatsapp || FALLBACK_PHONE).replace(/\D/g, '');
  const rmName = adminContact?.rmName || 'Our team';
  const rmTitle = adminContact?.rmTitle || 'Relationship Manager';
  const callbackHours = adminContact?.callbackHours || '10 AM – 8 PM (Mon–Sat)';
  // None of the 6 plan tier names are substrings of one another, so a plain `includes` safely
  // matches both a bare title ("Gold", from UpgradePlanScreen) and a duration-suffixed one
  // ("Classic (3 Months)", from PremiumTab.tsx) against the canonical feature list.
  //
  // Searches the live active-plan catalog first, then falls back to the full hardcoded list: an
  // existing Classic subscriber raising a callback about their CURRENT plan must still see its
  // feature list even after the client deactivates Classic for new sales.
  const fallbackFeatures =
    getActivePlansSync().find((p) => planTitle.includes(p.title))?.features ||
    FALLBACK_UPGRADE_PLANS.find((p) => planTitle.includes(p.title))?.features ||
    [];

  // The FULL feature list for this plan, from the real planFeatures matrix — the same source
  // PremiumTab's checklist uses. The 4-bullet marketing copy above is only the fallback for
  // when the matrix call fails; a member choosing a plan through this assisted flow should see
  // everything the plan actually includes, not a sample.
  const [matrixChecklist, setMatrixChecklist] = useState<ChecklistRow[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    userApi.getPlanFeaturesMatrix()
      .then((res) => {
        if (cancelled || res?.data?.code !== 200 || !res.data.data) return;
        const byPlan = buildChecklistByPlan(res.data.data);
        const key = Object.keys(byPlan).find((t) => planTitle.includes(t));
        if (key) setMatrixChecklist(byPlan[key].filter((r) => r.included));
      })
      .catch(() => { /* fallback bullets already cover this */ });
    return () => { cancelled = true; };
  }, [planTitle]);

  const planFeatures = matrixChecklist && matrixChecklist.length > 0
    ? matrixChecklist.map((r) => r.label)
    : fallbackFeatures;

  // Collapsed by default: first 7 features + a fade-out gradient with an expand chevron.
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const COLLAPSED_COUNT = 7;
  const canExpand = planFeatures.length > COLLAPSED_COUNT;
  const visibleFeatures = featuresExpanded ? planFeatures : planFeatures.slice(0, COLLAPSED_COUNT);

  const [name, setName] = useState(defaultName.trim());
  const [mobile, setMobile] = useState(defaultMobile);
  const [bestTime, setBestTime] = useState<string>('Anytime');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      popupError('Name required', 'Please enter your name so we know who to greet.');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      popupError('Mobile required', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setSubmitting(true);
    try {
      const userIdParam = encodedUserId || 'guest';
      const res = await userApi.createCallbackRequest(userIdParam, {
        name: name.trim(),
        mobile: cleanMobile,
        email: defaultEmail || null,
        planInterested: planTitle,
        note: note.trim() || null,
        bestTimeToCall: bestTime,
      });
      if (res?.data?.code === 200 || res?.data?.status === 'SUCCESS') {
        setSubmitted(true);
      } else if (res?.data?.code === 409) {
        // duplicate — still show success, team will reach out
        setSubmitted(true);
      } else {
        popupError('Couldn’t send', res?.data?.message || 'Please try again or contact us directly.');
      }
    } catch (e: any) {
      popupError('Network error', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const callPhone = () => Linking.openURL(`tel:${phone}`);
  const openWhatsApp = () => {
    const msg = encodeURIComponent(`Hi, I'm interested in the ${planTitle} plan. Could you guide me through the next steps?`);
    Linking.openURL(`https://wa.me/${whatsapp}?text=${msg}`);
  };

  if (submitted) {
    return (
      <View style={s.container}>
        <SafeAreaView edges={['top']} style={s.headerSafe}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <ArrowLeft size={22} color="#475569" />
            </TouchableOpacity>
            <View style={s.headerContent}>
              <Text style={s.headerTitle}>Request Sent</Text>
            </View>
          </View>
        </SafeAreaView>
        <View style={s.successWrap}>
          <View style={s.successIconCircle}>
            <CheckCircle size={56} color="#10b981" strokeWidth={2.5} />
          </View>
          <Text style={s.successTitle}>We've received your request</Text>
          <Text style={s.successSubtitle}>
            {rmName} or our team will reach you within 24 hours during {callbackHours}.
          </Text>
          <View style={s.successDivider} />
          <Text style={s.successMeta}>Need to talk now?</Text>
          <View style={s.successActions}>
            <TouchableOpacity onPress={callPhone} style={s.successCallBtn} activeOpacity={0.85}>
              <Phone size={16} color="#fff" strokeWidth={2.5} />
              <Text style={s.successCallText}>Call Now</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openWhatsApp} style={s.successWhatsappBtn} activeOpacity={0.85}>
              <MessageCircle size={16} color="#10b981" strokeWidth={2.5} />
              <Text style={s.successWhatsappText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={s.doneBtn} activeOpacity={0.85}>
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView edges={['top']} style={s.headerSafe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={22} color="#475569" />
          </TouchableOpacity>
          <View style={s.headerContent}>
            <Text style={s.headerTitle}>Premium Assistance</Text>
            <Text style={s.headerSubtitle}>PERSONALIZED HELP</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero card */}
        <LinearGradient
          colors={['#1F7FE5', '#1862B8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
          <View style={s.heroBadge}>
            <Sparkles size={11} color="#1F7FE5" strokeWidth={2.5} />
            <Text style={s.heroBadgeText}>Personalized Service</Text>
          </View>
          <Text style={s.heroTitle}>Talk to a Relationship Manager</Text>
          <Text style={s.heroTagline}>
            Get personalized guidance for your premium membership. {rmName} will help you choose
            the right plan and answer any questions.
          </Text>
          <View style={s.heroRmRow}>
            {adminContact?.rmPhotoUrl ? (
              <Image source={{ uri: adminContact.rmPhotoUrl }} style={s.heroAvatar} />
            ) : (
              <View style={[s.heroAvatar, s.heroAvatarFallback]}>
                <Text style={s.heroAvatarInitial}>
                  {(rmName || 'RM').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={s.heroRmName}>{rmName}</Text>
              <Text style={s.heroRmTitle}>{rmTitle}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Plan summary */}
        <View style={s.planCard}>
          <View style={s.planHeader}>
            <Text style={s.planLabel}>SELECTED PLAN</Text>
          </View>
          <View style={s.planRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.planTitle}>{planTitle}</Text>
              <Text style={s.planPeriod}>{planPeriod}</Text>
            </View>
            {!infoOnly && <Text style={s.planPrice}>{planPrice}</Text>}
          </View>

          {planFeatures.length > 0 && (
            <>
              <View style={s.planFeaturesDivider} />
              <Text style={s.planFeaturesLabel}>WHAT YOU'LL GET</Text>
              <View>
                <View style={s.planFeaturesList}>
                  {visibleFeatures.map((feature, i) => (
                    <View key={i} style={s.planFeatureRow}>
                      <View style={s.planFeatureCheck}>
                        <Check size={11} color="#1F7FE5" strokeWidth={3} />
                      </View>
                      <Text style={s.planFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                {canExpand && !featuresExpanded && (
                  // Fade-out over the last rows + bobbing chevron: "there's more below".
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setFeaturesExpanded(true)}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#ffffff']}
                      style={s.featuresFade}
                      pointerEvents="none"
                    />
                    <View style={s.featuresExpandBar}>
                      <BobbingChevron />
                      <Text style={s.featuresExpandTxt}>
                        {planFeatures.length - COLLAPSED_COUNT} more features
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                {canExpand && featuresExpanded && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setFeaturesExpanded(false)}
                    style={s.featuresExpandBar}
                  >
                    <ChevronUp size={16} color="#94a3b8" strokeWidth={2.5} />
                    <Text style={[s.featuresExpandTxt, { color: '#94a3b8' }]}>Show less</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        {/* Callback form */}
        <View style={s.formCard}>
          <Text style={s.formTitle}>Request a Callback</Text>
          <Text style={s.formSubtitle}>Share your details and we'll call you back.</Text>

          <Text style={s.label}>Your Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#94a3b8"
            style={s.input}
          />

          <Text style={s.label}>Mobile Number</Text>
          <TextInput
            value={mobile}
            onChangeText={(v) => setMobile(v.replace(/[^\d+]/g, ''))}
            placeholder="10-digit mobile number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            maxLength={15}
            style={s.input}
          />

          <Text style={s.label}>Best Time to Call</Text>
          <View style={s.chipsRow}>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot}
                onPress={() => setBestTime(slot)}
                style={[s.chip, bestTime === slot && s.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, bestTime === slot && s.chipTextActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Message <Text style={s.labelOptional}>(optional)</Text></Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Tell us how we can help"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            style={[s.input, s.inputMultiline]}
          />

          <TouchableOpacity
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.85}
            style={s.submitWrap}
          >
            <LinearGradient
              colors={submitting ? ['#94a3b8', '#94a3b8'] : ['#1F7FE5', '#1862B8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.submitBtn}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.submitText}>Request Callback</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>Or contact us directly</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Direct contact */}
        <View style={s.contactCard}>
          <TouchableOpacity onPress={callPhone} style={s.contactRow} activeOpacity={0.7}>
            <View style={[s.contactIcon, { backgroundColor: '#dfecfb' }]}>
              <Phone size={18} color="#1F7FE5" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.contactLabel}>Call us</Text>
              <Text style={s.contactValue}>{phone}</Text>
            </View>
            <Text style={s.contactCta}>Tap to call</Text>
          </TouchableOpacity>

          <View style={s.contactDivider} />

          <TouchableOpacity onPress={openWhatsApp} style={s.contactRow} activeOpacity={0.7}>
            <View style={[s.contactIcon, { backgroundColor: '#dcf0e2' }]}>
              <MessageCircle size={18} color="#10b981" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.contactLabel}>WhatsApp</Text>
              <Text style={s.contactValue}>{phone}</Text>
            </View>
            <Text style={[s.contactCta, { color: '#10b981' }]}>Open chat</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footerInfo}>
          <Clock size={12} color="#64748b" strokeWidth={2} />
          <Text style={s.footerText}>Available {callbackHours}</Text>
        </View>
        <View style={s.footerPrivacy}>
          <Shield size={11} color="#64748b" strokeWidth={2} />
          <Text style={s.footerPrivacyText}>
            Your privacy is our priority — info shared only for assistance.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f7fa' },

  // Header
  headerSafe: { backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  backBtn: { padding: 8, marginRight: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  headerSubtitle: { fontSize: 9, fontFamily: 'Rubik-Medium', color: '#64748b', letterSpacing: 1, marginTop: 1 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },

  // Hero
  heroCard: {
    borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#1F7FE5', shadowOpacity: 0.18, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: '#fff', borderRadius: 100, marginBottom: 10, gap: 4,
  },
  heroBadgeText: { fontSize: 10, fontFamily: 'Rubik-Bold', color: '#1F7FE5' },
  heroTitle: { fontSize: 20, fontFamily: 'Rubik-ExtraBold', color: '#fff', letterSpacing: -0.4, marginBottom: 6 },
  heroTagline: { fontSize: 12, fontFamily: 'Rubik-Regular', color: '#dbeafe', lineHeight: 17, marginBottom: 14 },
  heroRmRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#fff' },
  heroAvatarFallback: { backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  heroAvatarInitial: { fontSize: 15, fontFamily: 'Rubik-Bold', color: '#fff' },
  heroRmName: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#fff' },
  heroRmTitle: { fontSize: 10, fontFamily: 'Rubik-Regular', color: '#dbeafe', marginTop: 1 },

  // Plan summary
  planCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0',
  },
  planHeader: { marginBottom: 8 },
  planLabel: { fontSize: 10, fontFamily: 'Rubik-Medium', color: '#64748b', letterSpacing: 1 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  planPeriod: { fontSize: 11, fontFamily: 'Rubik-Regular', color: '#64748b', marginTop: 2 },
  planPrice: { fontSize: 18, fontFamily: 'Rubik-ExtraBold', color: '#1F7FE5' },
  planFeaturesDivider: { height: 1, backgroundColor: '#f1f5f9', marginTop: 14, marginBottom: 12 },
  planFeaturesLabel: { fontSize: 10, fontFamily: 'Rubik-Medium', color: '#64748b', letterSpacing: 1, marginBottom: 10 },
  planFeaturesList: { gap: 9 },
  // Sits over the bottom ~36px of the collapsed list, fading rows into the card white so the
  // truncation reads as "continues below" rather than an abrupt cut.
  featuresFade: { position: 'absolute', top: -36, left: 0, right: 0, height: 36 },
  featuresExpandBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 6, paddingBottom: 2 },
  featuresExpandTxt: { fontSize: 11.5, fontFamily: 'Rubik-Medium', color: '#1F7FE5' },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  planFeatureCheck: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#dfecfb', alignItems: 'center', justifyContent: 'center',
  },
  planFeatureText: { flex: 1, fontSize: 12.5, fontFamily: 'Rubik-Regular', color: '#334155', lineHeight: 18 },

  // Form
  formCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0',
  },
  formTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  formSubtitle: { fontSize: 12, fontFamily: 'Rubik-Regular', color: '#64748b', marginTop: 3, marginBottom: 14 },
  label: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#475569', marginBottom: 6, marginTop: 10 },
  labelOptional: { fontFamily: 'Rubik-Regular', color: '#94a3b8' },
  input: {
    backgroundColor: '#f8fafc', borderRadius: 10,
    borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, fontFamily: 'Rubik-Regular', color: '#0f1724',
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 100, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  chipActive: { backgroundColor: '#dfecfb', borderColor: '#1F7FE5' },
  chipText: { fontSize: 12, fontFamily: 'Rubik-Medium', color: '#475569' },
  chipTextActive: { color: '#1F7FE5' },

  submitWrap: { marginTop: 18, borderRadius: 12, overflow: 'hidden' },
  submitBtn: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#fff', letterSpacing: 0.2 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#64748b' },

  // Contact
  contactCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  contactIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#64748b' },
  contactValue: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#0f1724', marginTop: 1 },
  contactCta: { fontSize: 11, fontFamily: 'Rubik-Bold', color: '#1F7FE5' },
  contactDivider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 14 },

  // Footer
  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 14 },
  footerText: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#64748b' },
  footerPrivacy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 6 },
  footerPrivacyText: { fontSize: 10, fontFamily: 'Rubik-Regular', color: '#64748b' },

  // Success
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#dcf0e2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 20, fontFamily: 'Rubik-ExtraBold', color: '#0f1724', textAlign: 'center', marginBottom: 8 },
  successSubtitle: { fontSize: 13, fontFamily: 'Rubik-Regular', color: '#475569', textAlign: 'center', lineHeight: 20 },
  successDivider: { width: '60%', height: 1, backgroundColor: '#e2e8f0', marginVertical: 24 },
  successMeta: { fontSize: 12, fontFamily: 'Rubik-Medium', color: '#64748b', marginBottom: 12 },
  successActions: { flexDirection: 'row', gap: 10 },
  successCallBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 100, backgroundColor: '#1F7FE5',
  },
  successCallText: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#fff' },
  successWhatsappBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 100, backgroundColor: '#dcf0e2',
  },
  successWhatsappText: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#10b981' },
  doneBtn: { marginTop: 32, paddingHorizontal: 32, paddingVertical: 11 },
  doneBtnText: { fontSize: 13, fontFamily: 'Rubik-Bold', color: '#64748b' },
});

export default RelationshipManagerView;
