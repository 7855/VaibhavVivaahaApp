import React, { useState } from 'react';
import { useRemoteContent } from '@/utils/useRemoteContent';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft, ChevronDown, ChevronUp, Search, Heart, Users, Shield, Crown,
  Sparkles, MessageCircle, Settings, HelpCircle, X,
} from 'lucide-react-native';

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}


// Bundled copy. Overridden at runtime by the `FAQ_CONTENT` keyValue row; kept as the fallback
// so this screen can never render empty if the fetch fails.
const FALLBACK_FAQ: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I create a profile?',
    answer: 'To create a profile, download our app and tap "Sign Up". Fill in your basic details, upload photos, and complete your profile information. Make sure to verify your phone number and email for better matches.'
  },
  {
    category: 'Getting Started',
    question: 'What information should I include in my profile?',
    answer: 'Include accurate information about yourself including age, education, profession, family details, and preferences. Add recent photos and write a genuine bio to attract compatible matches.'
  },
  {
    category: 'Matching',
    question: 'How does the matching system work?',
    answer: 'Our advanced matching algorithm considers your preferences for age, location, education, profession, community, and lifestyle choices to suggest compatible profiles.'
  },
  {
    category: 'Matching',
    question: 'Can I filter matches based on my preferences?',
    answer: 'Yes, you can set detailed preferences including age range, height, education, profession, income, location, community, and more to get more relevant matches.'
  },
  {
    category: 'Privacy & Safety',
    question: 'How is my personal information protected?',
    answer: 'We use advanced encryption and security measures to protect your data. You can also control what information is visible to others through privacy settings.'
  },
  {
    category: 'Privacy & Safety',
    question: 'Can I hide my profile from certain people?',
    answer: 'Yes, you can block specific users or hide your profile from people in your contacts. You can also control who can see your phone number and photos.'
  },
  {
    category: 'Communication',
    question: 'How can I contact someone I\'m interested in?',
    answer: 'You can send interest, chat messages, or contact them directly if they have shared their contact information. Premium members get additional communication features.'
  },
  {
    category: 'Communication',
    question: 'What should I do if someone is bothering me?',
    answer: 'You can block and report any user who makes you uncomfortable. Our support team reviews all reports and takes appropriate action to ensure a safe environment.'
  },
  {
    category: 'Premium Features',
    question: 'What are the benefits of premium membership?',
    answer: 'Premium members get unlimited messaging, advanced search filters, see who viewed their profile, get priority customer support, and can contact members directly.'
  },
  {
    category: 'Premium Features',
    question: 'How much does premium membership cost?',
    answer: 'We offer various premium plans starting from affordable monthly subscriptions. Check the upgrade section in settings for current pricing and offers.'
  },
  {
    category: 'Account Management',
    question: 'How can I delete my account?',
    answer: 'You can delete your account from Settings > Account Settings > Delete Account. Please note that this action is irreversible and all your data will be permanently removed.'
  },
  {
    category: 'Account Management',
    question: 'Can I pause my profile temporarily?',
    answer: 'Yes, you can hide your profile temporarily from Settings. Your profile won\'t appear in searches, but your account and data remain intact.'
  }
];

const FAQPage: React.FC = () => {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { content: faqData } = useRemoteContent<FAQItem[]>('FAQ_CONTENT', FALLBACK_FAQ);



  const filteredFAQs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(faqData.map((faq) => faq.category)));

  // Category chips filter alongside the search box. `categories` was already being computed
  // here but never rendered — the list was search-only, which is poor for browsing 12 answers
  // spread across 6 topics.
  const visibleFAQs = filteredFAQs.filter(
    (faq) => !activeCategory || faq.category === activeCategory
  );

  const CATEGORY_META: Record<string, { icon: any; tint: string; soft: string }> = {
    'Getting Started': { icon: Sparkles, tint: '#1F7FE5', soft: '#e8f1fd' },
    'Matching': { icon: Users, tint: '#7c3aed', soft: '#f1ecfe' },
    'Privacy & Safety': { icon: Shield, tint: '#0f9d58', soft: '#e6f6ee' },
    'Communication': { icon: MessageCircle, tint: '#0891b2', soft: '#e3f5f9' },
    'Premium Features': { icon: Crown, tint: '#C59A40', soft: '#fdf3de' },
    'Account Management': { icon: Settings, tint: '#64748b', soft: '#eef2f7' },
  };
  const metaFor = (c: string) =>
    CATEGORY_META[c] || { icon: Heart, tint: '#64748b', soft: '#eef2f7' };

  return (
    // Inset colour matches the HERO's top (#1F7FE5), not the page wash — the safe-area strip
    // sits directly above the hero, so the page colour would draw a seam across the status bar.
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1F7FE5' }} edges={['top']}>
      {/* Light icons — the hero behind the status bar is deep blue. */}
      <StatusBar barStyle="light-content" backgroundColor="#1F7FE5" />
      <LinearGradient
        colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']}
        locations={[0, 0.3, 0.6, 1.0]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero — the deep band carries the header, heading and search so the page has a
              anchored top edge rather than floating text on the gradient wash. */}
          <LinearGradient
            colors={['#1F7FE5', '#1862B8']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backPill}>
                <ArrowLeft size={19} color="#fff" />
              </TouchableOpacity>
              <View style={styles.heroBadge}>
                <HelpCircle size={13} color="#fff" />
                <Text style={styles.heroBadgeText}>Help Centre</Text>
              </View>
            </View>

            <Text style={styles.title}>How can we{'\n'}help you?</Text>
            <Text style={styles.subtitle}>
              {faqData.length} answers · {categories.length} topics
            </Text>
          </LinearGradient>

          {/* Search — overlaps the hero's bottom edge */}
          <View style={[styles.searchPill, searchFocused && styles.searchPillFocused]}>
            <Search size={17} color={searchFocused ? '#1F7FE5' : '#94a3b8'} />
            <TextInput
              placeholder="Search questions"
              placeholderTextColor="#9aa7b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={styles.searchInput}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <TouchableOpacity
              onPress={() => setActiveCategory(null)}
              style={[styles.chip, !activeCategory && styles.chipActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const on = activeCategory === cat;
              const m = metaFor(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(on ? null : cat)}
                  style={[styles.chip, on && { backgroundColor: m.tint, borderColor: m.tint }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.chipText, on && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* FAQ cards */}
          {visibleFAQs.map((faq, index) => {
            const open = expandedItem === index;
            const m = metaFor(faq.category);
            const Icon = m.icon;
            return (
              <View key={`${faq.category}-${index}`} style={[styles.card, open && styles.cardOpen]}>
                <TouchableOpacity
                  onPress={() => setExpandedItem(open ? null : index)}
                  style={styles.cardHead}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconChip, { backgroundColor: m.soft }]}>
                    <Icon size={16} color={m.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.question}>{faq.question}</Text>
                    <Text style={[styles.categoryTag, { color: m.tint }]}>{faq.category}</Text>
                  </View>
                  <View style={[styles.chevron, open && { backgroundColor: m.tint }]}>
                    {open
                      ? <ChevronUp size={15} color="#fff" />
                      : <ChevronDown size={15} color="#64748b" />}
                  </View>
                </TouchableOpacity>

                {open && (
                  <View style={styles.answerWrap}>
                    <View style={[styles.answerBar, { backgroundColor: m.tint }]} />
                    <Text style={styles.answer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {visibleFAQs.length === 0 && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Search size={26} color="#1F7FE5" />
              </View>
              <Text style={styles.emptyTitle}>Nothing matched</Text>
              <Text style={styles.emptyText}>
                Try a different word, or browse a topic above.
              </Text>
            </View>
          )}

          {/* Still stuck → support */}
          <TouchableOpacity
            style={styles.supportCard}
            activeOpacity={0.85}
            onPress={() => router.push('/(root)/screens/HelpSupportPage' as any)}
          >
            <View style={styles.supportIcon}>
              <MessageCircle size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>Still need help?</Text>
              <Text style={styles.supportText}>Talk to our support team</Text>
            </View>
            <ChevronDown size={16} color="#1F7FE5" style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // No horizontal padding on the scroll itself — the hero must run edge to edge.
  scroll: { paddingBottom: 40 },

  hero: {
    paddingHorizontal: 20,
    paddingTop: 10,
    // extra bottom room so the search pill can overlap the hero's lower edge
    paddingBottom: 44,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  backPill: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroBadgeText: {
    fontSize: 11, fontFamily: 'Rubik-Medium', color: '#fff', letterSpacing: 0.2,
  },

  title: {
    fontSize: 30, fontFamily: 'Rubik-Bold', color: '#fff',
    letterSpacing: -0.6, lineHeight: 36, marginTop: 22,
  },
  subtitle: {
    fontSize: 12.5, fontFamily: 'Rubik-Regular',
    color: 'rgba(255,255,255,0.82)', marginTop: 7, letterSpacing: 0.2,
  },

  searchPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 54, borderRadius: 27, backgroundColor: '#fff',
    paddingHorizontal: 18,
    // pulled up over the hero's rounded edge
    marginTop: -27, marginHorizontal: 20,
    shadowColor: '#0f2346', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 5,
  },
  searchPillFocused: {
    borderWidth: 1.5, borderColor: '#1F7FE5',
    shadowColor: '#1F7FE5', shadowOpacity: 0.22, shadowRadius: 14, elevation: 6,
  },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: 'Rubik-Regular',
    color: '#333', paddingVertical: 0,
  },

  chipRow: { paddingLeft: 20, paddingRight: 12, gap: 8, paddingVertical: 18 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#1F7FE5', borderColor: '#1F7FE5' },
  chipText: { fontSize: 12, fontFamily: 'Rubik-Medium', color: '#64748b' },
  chipTextActive: { color: '#fff' },

  card: { marginHorizontal: 20,
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#eef2f7',
    shadowColor: '#1F7FE5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  cardOpen: { borderColor: '#d9e6f7', shadowOpacity: 0.12 },
  cardHead: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
  },
  iconChip: {
    width: 34, height: 34, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  question: {
    fontSize: 14, fontFamily: 'Rubik-Medium', color: '#0f1724', lineHeight: 20,
  },
  categoryTag: {
    fontSize: 10.5, fontFamily: 'Rubik-Medium', marginTop: 3,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  chevron: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },

  answerWrap: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 2,
  },
  answerBar: { width: 3, borderRadius: 2, opacity: 0.35 },
  answer: {
    flex: 1, fontSize: 13, fontFamily: 'Rubik-Regular',
    color: '#475569', lineHeight: 21,
  },

  empty: { marginHorizontal: 20, alignItems: 'center', paddingVertical: 44 },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#e8f1fd',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  emptyText: {
    fontSize: 12.5, fontFamily: 'Rubik-Regular', color: '#94a3b8',
    marginTop: 5, textAlign: 'center',
  },

  supportCard: { marginHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginTop: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  supportIcon: {
    width: 38, height: 38, borderRadius: 14, backgroundColor: '#1F7FE5',
    alignItems: 'center', justifyContent: 'center',
  },
  supportTitle: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  supportText: { fontSize: 12, fontFamily: 'Rubik-Regular', color: '#64748b', marginTop: 2 },
});

export default FAQPage;
