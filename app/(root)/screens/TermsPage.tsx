import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  ArrowLeft,
  Shield,
  Users,
  FileText,
  AlertTriangle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const TermsPage: React.FC = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color="#4B5563" />
        </TouchableOpacity> */}
        <View>
          <Text style={styles.title}>Terms and Conditions</Text>
          {/* <Text style={styles.subtitle}>Last updated: January 2025</Text> */}
        </View>
      </View>

      {/* Sections */}
      <View style={styles.card}>
        {/* Example section */}
        <Section
          title="1. Introduction"
          icon={<FileText size={16} color="#dc2626" />}
          iconBg="#fee2e2"
          content={[
            `Welcome to our matrimonial service. These Terms and Conditions ("Terms") govern your use of our matrimonial platform, website, and mobile application (collectively, the "Service") operated by [Company Name] ("we," "us," or "our").`,
            `By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.`,
          ]}
        />

        <Section
          title="2. User Accounts"
          icon={<Users size={16} color="#2563eb" />}
          iconBg="#dbeafe"
          content={[
            `2.1 Registration: To access our Service, you must register for an account. You must be at least 18 years old to create an account.`,
            `2.2 Accuracy: You agree to provide accurate, current, and complete information during registration and to update such information as needed.`,
            `2.3 Security: You are responsible for safeguarding your account credentials and for all activities that occur under your account.`,
            `2.4 One Account: You may only maintain one active account at any time.`,
          ]}
        />

        <Section
          title="3. User Conduct"
          icon={<Shield size={16} color="#10b981" />}
          iconBg="#d1fae5"
          content={[
            `You agree not to:`,
            `• Provide false or misleading information`,
            `• Impersonate any person or entity`,
            `• Harass, abuse, or harm other users`,
            `• Post inappropriate or offensive content`,
            `• Solicit money or engage in commercial activities`,
            `• Use automated systems to access the Service`,
            `• Attempt to gain unauthorized access to other accounts`,
          ]}
        />

        <Section
          title="4. Privacy and Data Protection"
          icon={<Shield size={16} color="#8b5cf6" />}
          iconBg="#ede9fe"
          content={[
            `4.1 Data Collection: We collect and process personal information as described in our Privacy Policy.`,
            `4.2 Profile Visibility: Information in your profile may be visible to other users based on your privacy settings.`,
            `4.3 Data Security: We implement appropriate security measures to protect your personal information.`,
            `4.4 Third-party Sharing: We do not sell or rent your personal information to third parties without your consent.`,
          ]}
        />

        <Section
          title="5. Premium Services and Payments"
          icon={<FileText size={16} color="#ca8a04" />}
          iconBg="#fef3c7"
          content={[
            `5.1 Premium Features: We offer premium services that provide additional features and benefits.`,
            `5.2 Payments: Premium services require payment of applicable fees. All fees are non-refundable unless stated otherwise.`,
            `5.3 Automatic Renewal: Premium subscriptions automatically renew unless cancelled before the renewal date.`,
            `5.4 Cancellation: You may cancel your premium subscription at any time through your account settings.`,
          ]}
        />

        <Section
          title="6. Intellectual Property"
          icon={<FileText size={16} color="#6366f1" />}
          iconBg="#e0e7ff"
          content={[
            `6.1 Our Content: The Service and its original content, features, and functionality are owned by us and are protected by copyright, trademark, and other laws.`,
            `6.2 User Content: You retain ownership of content you post, but grant us a license to use, modify, and display it on our platform.`,
            `6.3 Restrictions: You may not reproduce, distribute, or create derivative works of our content without permission.`,
          ]}
        />

        <Section
          title="7. Disclaimer and Limitation of Liability"
          icon={<AlertTriangle size={16} color="#dc2626" />}
          iconBg="#fee2e2"
          content={[
            `7.1 No Guarantee: We do not guarantee that you will find a suitable match through our Service.`,
            `7.2 User Responsibility: You are responsible for your interactions with other users and for verifying the information they provide.`,
            `7.3 Service Availability: We do not guarantee uninterrupted or error-free service.`,
            `7.4 Limitation: Our liability to you is limited to the amount you paid for premium services, if any.`,
          ]}
        />

        <Section
          title="8. Termination"
          icon={<FileText size={16} color="#4b5563" />}
          iconBg="#f3f4f6"
          content={[
            `8.1 By You: You may terminate your account at any time by following the deletion process in your settings.`,
            `8.2 By Us: We may terminate or suspend your account if you violate these Terms or engage in prohibited conduct.`,
            `8.3 Effect: Upon termination, your access to the Service will cease, and we may delete your account and data.`,
          ]}
        />

        <Section
          title="9. Changes to Terms"
          icon={<FileText size={16} color="#f97316" />}
          iconBg="#ffedd5"
          content={[
            `We reserve the right to modify these Terms at any time. We will notify users of significant changes via the Service or email. Your continued use of the Service after changes constitute acceptance of the new Terms.`,
          ]}
        />

        <Section
          title="10. Contact Information"
          icon={<FileText size={16} color="#14b8a6" />}
          iconBg="#ccfbf1"
          content={[
            `If you have any questions about these Terms and Conditions, please contact us at:`,
            `Email: legal@matrimony.com`,
            `Phone: +1 (555) 123-4567`,
            `Address: [Your Company Address]`,
          ]}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By using our Service, you acknowledge that you have read, understood,
          and agree to be bound by these Terms and Conditions.
        </Text>
      </View>
    </ScrollView>
  );
};

const Section = ({
  title,
  icon,
  iconBg,
  content,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  content: string[];
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {content.map((text, index) => (
          <Text key={index} style={styles.sectionText}>
            {text}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    elevation: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionContent: {
    paddingLeft: 40,
    gap: 6,
  },
  sectionText: {
    fontSize: 14,
    color: '#4b5563',
  },
  footer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 48,
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default TermsPage;
