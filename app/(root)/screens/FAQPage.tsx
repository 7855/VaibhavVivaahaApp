import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ChevronDown, ChevronUp, Search, Heart, Users, Shield, Crown } from 'lucide-react-native';

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

const FAQPage: React.FC = () => {
  const navigation = useNavigation();
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqData: FAQItem[] = [
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


  const filteredFAQs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(faqData.map((faq) => faq.category)));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Getting Started':
        return <Heart size={16} color="#e11d48" />;
      case 'Matching':
        return <Users size={16} color="#db2777" />;
      case 'Privacy & Safety':
        return <Shield size={16} color="#7c3aed" />;
      case 'Premium Features':
        return <Crown size={16} color="#d97706" />;
      default:
        return <Heart size={16} color="#6b7280" />;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity> */}
        <View>
          <Text style={styles.title}>Frequently Asked Questions</Text>
          <Text style={styles.subtitle}>Find answers to common questions</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          placeholder="Search FAQs..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
        />
      </View>

      {/* FAQ Items */}
      {filteredFAQs.map((faq, index) => (
        <View key={index} style={styles.faqCard}>
          <TouchableOpacity
            onPress={() => setExpandedItem(expandedItem === index ? null : index)}
            style={styles.faqHeader}
          >
            <View style={styles.faqLeft}>
              <View style={styles.iconCircle}>{getCategoryIcon(faq.category)}</View>
              <View>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqCategory}>{faq.category}</Text>
              </View>
            </View>
            {expandedItem === index ? (
              <ChevronUp size={16} color="#9ca3af" />
            ) : (
              <ChevronDown size={16} color="#9ca3af" />
            )}
          </TouchableOpacity>
          {expandedItem === index && (
            <View style={styles.faqAnswerContainer}>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          )}
        </View>
      ))}

      {filteredFAQs.length === 0 && (
        <View style={styles.noResults}>
          <Search size={32} color="#9ca3af" />
          <Text style={styles.noResultsTitle}>No results found</Text>
          <Text style={styles.noResultsText}>Try searching with different keywords</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9fafb'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    marginRight: 12,
    elevation: 2
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 12
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14
  },
  faqCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    width: '100%'
  },
  faqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    marginRight: 8,
    width: '80%'
  },
  faqCategory: {
    fontSize: 12,
    color: '#9ca3af'
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  faqAnswer: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20
  },
  noResults: {
    alignItems: 'center',
    marginTop: 40
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12
  },
  noResultsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4
  }
});

export default FAQPage;
