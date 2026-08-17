// ─────────────────────────────────────────────────────────────
//  HelpSupportPage — contact channels + support hours + ticket form
//  Copy is DB-editable through the `SUPPORT_CONTENT` keyValue row.
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle,
  HelpCircle,
  AlertCircle,
  MessageCircle,
  Clock,
  Phone,
  Mail,
  Send,
  Headphones,
  ChevronRight,
  Users,
  CreditCard,
  Shield,
  Lightbulb,
} from 'lucide-react-native';
import { useRemoteContent } from '@/utils/useRemoteContent';
import userApi from '../api/userApi';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';

// ─── Theme (app blue/ink system — see the auth screens & PremiumTab) ───
const C = {
  ink: '#0f1724',
  slate: '#64748b',
  muted: '#94a3b8',
  accent: '#1F7FE5',
  border: '#e7edf5',
  card: '#ffffff',
  green: '#16A34A',
};
const BG_GRADIENT = ['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa'] as const;
const CTA_GRADIENT = ['#5AA7EF', '#1F7FE5'] as const;
const NAVY_GRADIENT = ['#1c2b3f', '#25384f'] as const;

/**
 * Ticket categories. The `id` is what gets stored on the ticket row and shown in the admin
 * panel, so these deliberately match `components/SupportFAB.tsx`'s ids — the two surfaces
 * create tickets against the same backend and should not produce two vocabularies.
 */
const SUPPORT_CATEGORIES = [
  { id: 'TECHNICAL', label: 'Technical', Icon: AlertCircle },
  { id: 'ACCOUNT', label: 'Account', Icon: HelpCircle },
  { id: 'MATCHING', label: 'Matching', Icon: Users },
  { id: 'PAYMENT', label: 'Payment', Icon: CreditCard },
  { id: 'SAFETY', label: 'Safety', Icon: Shield },
  { id: 'OTHER', label: 'Other', Icon: MessageCircle },
];

/**
 * Support contact details. Overridden at runtime by the `SUPPORT_CONTENT` keyValue row so the
 * client can change a number, an email or the quick-help copy without an app release; these
 * bundled values are the fallback and are what renders if the row is missing.
 */
type QuickHelpItem = { title?: string; text: string };

type SupportContent = {
  email?: string;
  emailNote?: string;
  phone?: string;
  phoneNote?: string;
  whatsapp?: string;
  whatsappNote?: string;
  /** Legacy key from the first seeded row — still honoured as the WhatsApp note fallback. */
  chatNote?: string;
  hoursWeekday?: string;
  hoursWeekend?: string;
  hoursNote?: string;
  quickHelp?: QuickHelpItem[];
};

const FALLBACK_SUPPORT: SupportContent = {
  email: 'support@vaibhavvivaahamatrimony.com',
  emailNote: 'Replies within 24 hours',
  // The real support line (same number RelationshipManagerView falls back to). The previous
  // placeholder here was an unreachable dummy number.
  phone: '+91 79045 47565',
  phoneNote: 'Mon - Fri, 9 AM - 6 PM',
  whatsapp: '+91 79045 47565',
  whatsappNote: 'Quickest way to reach us',
  hoursWeekday: 'Mon - Fri  ·  9 AM - 6 PM',
  hoursWeekend: 'Sat - Sun  ·  10 AM - 4 PM',
  hoursNote: 'Messages sent outside these hours are answered the next working day.',
  quickHelp: [
    { title: 'Profile not showing in search?', text: 'Complete your profile and make sure it has been verified by our team.' },
    { title: 'Trouble with a payment?', text: 'Check your payment method and try again, or request a callback from a relationship manager.' },
    { title: "Can't access your account?", text: 'Reset your PIN from the login screen, or write to us with your registered mobile number.' },
  ],
};

/** Strip formatting so a display number like "+91 79045 47565" still dials/opens WhatsApp. */
const telHref = (v?: string) => `tel:${(v || '').replace(/[^\d+]/g, '')}`;
const waHref = (v?: string) => `https://wa.me/${(v || '').replace(/\D/g, '')}`;

const HelpSupportPage: React.FC = () => {
  const { content: remote } = useRemoteContent<SupportContent>('SUPPORT_CONTENT', FALLBACK_SUPPORT);
  const { userData } = useUserData();
  const popup = usePopup();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState('');
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // A partially-filled keyValue row must not blank out a field, so every value falls back
  // individually rather than the object being swapped wholesale. `chatNote` is the key the
  // first seeded row used for the (now removed) Live Chat card — it is mapped onto the
  // WhatsApp note so that existing row keeps rendering something meaningful unedited.
  const support: SupportContent = useMemo(() => {
    const merged: SupportContent = { ...FALLBACK_SUPPORT, ...(remote || {}) };
    if (remote?.chatNote && !remote?.whatsappNote) merged.whatsappNote = remote.chatNote;
    return merged;
  }, [remote]);

  const channels = useMemo(
    () =>
      [
        support.phone && {
          key: 'phone',
          Icon: Phone,
          tint: '#16A34A',
          label: 'Call us',
          value: support.phone,
          note: support.phoneNote,
          href: telHref(support.phone),
        },
        support.whatsapp && {
          key: 'whatsapp',
          Icon: MessageCircle,
          tint: '#1F7FE5',
          label: 'WhatsApp',
          value: support.whatsapp,
          note: support.whatsappNote,
          href: waHref(support.whatsapp),
        },
        support.email && {
          key: 'email',
          Icon: Mail,
          tint: '#DC2626',
          label: 'Email us',
          value: support.email,
          note: support.emailNote,
          href: `mailto:${support.email}`,
        },
      ].filter(Boolean) as {
        key: string;
        Icon: any;
        tint: string;
        label: string;
        value: string;
        note?: string;
        href: string;
      }[],
    [support]
  );

  const openChannel = async (href: string) => {
    try {
      await Linking.openURL(href);
    } catch {
      popup.error('Could not open', 'No app on this device can handle that action.');
    }
  };

  const canSubmit = !!selectedCategory && !!message.trim() && !sending;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (!userData?.userId) {
      popup.error('Not signed in', 'Please sign in again before sending a message.');
      return;
    }

    const category = SUPPORT_CATEGORIES.find((c) => c.id === selectedCategory);
    setSending(true);
    try {
      // Same endpoint the support chat bubble uses, so the reply lands in the member's
      // existing support conversation instead of disappearing.
      const res = await userApi.createSupportTicket(userData.userId, {
        subject: `${category?.label || 'Support'} — Help & Support`,
        category: selectedCategory,
        message: message.trim(),
      });
      // Business failures come back inside a 200 body (see CLAUDE.md §17) — check the code.
      if (res?.data?.code === 200 && res?.data?.data) {
        setSubmitted(true);
        setSelectedCategory('');
        setMessage('');
      } else {
        popup.error('Could not send', res?.data?.message || 'Please try again in a moment.');
      }
    } catch (e: any) {
      popup.error('Could not send', e?.response?.data?.message || 'Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  // ─── Success state ───────────────────────────────────
  if (submitted) {
    return (
      <View style={styles.flex}>
        <Stack.Screen options={{ title: 'Help & Support' }} />
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.flex} edges={['left', 'right', 'bottom']}>
          <View style={styles.successWrap}>
            <View style={styles.successCard}>
              <View style={styles.successMedallion}>
                <CheckCircle size={34} color={C.green} />
              </View>
              <Text style={styles.successTitle}>Message sent</Text>
              <Text style={styles.successText}>
                Our support team has your message and will reply within 24 hours. You can follow the
                conversation from the support chat bubble on the Settings page.
              </Text>
              <TouchableOpacity
                style={styles.ghostButton}
                activeOpacity={0.85}
                onPress={() => setSubmitted(false)}
              >
                <Text style={styles.ghostButtonText}>Send another message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Main ────────────────────────────────────────────
  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: 'Help & Support' }} />
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.flex} edges={['left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Intro */}
            <View style={styles.intro}>
              <LinearGradient colors={CTA_GRADIENT} style={styles.introIcon}>
                <Headphones size={20} color="#fff" />
              </LinearGradient>
              <View style={styles.flexShrink}>
                <Text style={styles.introTitle}>We're here to help</Text>
                <Text style={styles.introSubtitle}>
                  Reach us directly, or send a message and we'll get back to you
                </Text>
              </View>
            </View>

            {/* Contact channels */}
            <Text style={styles.sectionLabel}>Contact us</Text>
            <View style={styles.channelGroup}>
              {channels.map((ch, i) => (
                <TouchableOpacity
                  key={ch.key}
                  activeOpacity={0.8}
                  style={[styles.channelRow, i < channels.length - 1 && styles.channelDivider]}
                  onPress={() => openChannel(ch.href)}
                >
                  <View style={[styles.channelIcon, { backgroundColor: `${ch.tint}14` }]}>
                    <ch.Icon size={19} color={ch.tint} />
                  </View>
                  <View style={styles.flexShrink}>
                    <Text style={styles.channelLabel}>{ch.label}</Text>
                    <Text style={styles.channelValue} numberOfLines={1}>
                      {ch.value}
                    </Text>
                    {!!ch.note && <Text style={styles.channelNote}>{ch.note}</Text>}
                  </View>
                  <ChevronRight size={18} color={C.muted} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Support hours */}
            <LinearGradient colors={NAVY_GRADIENT} style={styles.hoursCard}>
              <View style={styles.hoursIcon}>
                <Clock size={19} color="#fff" />
              </View>
              <View style={styles.flexShrink}>
                <Text style={styles.hoursTitle}>Support hours</Text>
                {!!support.hoursWeekday && <Text style={styles.hoursRow}>{support.hoursWeekday}</Text>}
                {!!support.hoursWeekend && <Text style={styles.hoursRow}>{support.hoursWeekend}</Text>}
                {!!support.hoursNote && <Text style={styles.hoursNote}>{support.hoursNote}</Text>}
              </View>
            </LinearGradient>

            {/* Message form */}
            <Text style={styles.sectionLabel}>Send us a message</Text>
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>What is it about?</Text>
              <View style={styles.chipWrap}>
                {SUPPORT_CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.85}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedCategory(active ? '' : cat.id)}
                    >
                      <cat.Icon size={14} color={active ? '#fff' : C.slate} />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Your message</Text>
              <View style={[styles.textArea, focused && styles.textAreaFocused]}>
                <TextInput
                  multiline
                  placeholder="Describe your issue in a few lines..."
                  placeholderTextColor={C.muted}
                  style={styles.textAreaInput}
                  value={message}
                  onChangeText={setMessage}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                disabled={!canSubmit}
                onPress={handleSubmit}
                style={styles.ctaWrap}
              >
                <LinearGradient
                  colors={CTA_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.cta, !canSubmit && styles.ctaDisabled]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={17} color="#fff" />
                  )}
                  <Text style={styles.ctaText}>{sending ? 'Sending...' : 'Send message'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Quick help */}
            {!!support.quickHelp?.length && (
              <>
                <Text style={styles.sectionLabel}>Quick help</Text>
                <View style={styles.channelGroup}>
                  {support.quickHelp.map((item, i) => (
                    <View
                      key={i}
                      style={[styles.quickRow, i < support.quickHelp!.length - 1 && styles.channelDivider]}
                    >
                      <View style={styles.quickIcon}>
                        <Lightbulb size={16} color="#B8860B" />
                      </View>
                      <View style={styles.flexShrink}>
                        {!!item.title && <Text style={styles.quickTitle}>{item.title}</Text>}
                        <Text style={styles.quickText}>{item.text}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const CARD_SHADOW = {
  shadowColor: '#1F7FE5',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flex: 1, minWidth: 0 },
  scrollContent: { padding: 16, paddingBottom: 48 },

  // Intro
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  introIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontSize: 17, fontFamily: 'Rubik-Bold', color: C.ink },
  introSubtitle: { fontSize: 12, fontFamily: 'Rubik-Regular', color: C.slate, marginTop: 2, lineHeight: 17 },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    color: C.slate,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Grouped list card (contact channels + quick help)
  channelGroup: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 22,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  channelDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  channelIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  channelLabel: { fontSize: 11, fontFamily: 'Rubik-Medium', color: C.muted, letterSpacing: 0.3 },
  channelValue: { fontSize: 14, fontFamily: 'Rubik-Medium', color: C.ink, marginTop: 1 },
  channelNote: { fontSize: 11, fontFamily: 'Rubik-Regular', color: C.slate, marginTop: 2 },

  // Support hours
  hoursCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    padding: 16,
    marginBottom: 22,
  },
  hoursIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(90,167,239,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursTitle: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#fff', marginBottom: 6 },
  hoursRow: { fontSize: 13, fontFamily: 'Rubik-Regular', color: 'rgba(255,255,255,0.86)', marginBottom: 2 },
  hoursNote: { fontSize: 11, fontFamily: 'Rubik-Regular', color: 'rgba(255,255,255,0.6)', marginTop: 6, lineHeight: 16 },

  // Form
  formCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 22,
    ...CARD_SHADOW,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    color: C.ink,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  fieldLabelSpaced: { marginTop: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#f8fafc',
  },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontSize: 12.5, fontFamily: 'Rubik-Medium', color: C.slate },
  chipTextActive: { color: '#fff' },

  textArea: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textAreaFocused: {
    borderColor: C.accent,
    backgroundColor: '#fff',
    shadowColor: C.accent,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textAreaInput: {
    textAlignVertical: 'top',
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: C.ink,
    height: 120,
    padding: 0,
  },

  ctaWrap: { marginTop: 18 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: '#fff', fontSize: 15, fontFamily: 'Rubik-Medium' },

  // Quick help
  quickRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(246,183,51,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontSize: 13, fontFamily: 'Rubik-Medium', color: C.ink, marginBottom: 2 },
  quickText: { fontSize: 12, fontFamily: 'Rubik-Regular', color: C.slate, lineHeight: 17 },

  // Success
  successWrap: { flex: 1, justifyContent: 'center', padding: 20 },
  successCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  successMedallion: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(22,163,74,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 18, fontFamily: 'Rubik-Bold', color: C.ink, marginBottom: 8 },
  successText: {
    fontSize: 13,
    fontFamily: 'Rubik-Regular',
    color: C.slate,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  ghostButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ghostButtonText: { fontSize: 14, fontFamily: 'Rubik-Medium', color: C.accent },
});

export default HelpSupportPage;
