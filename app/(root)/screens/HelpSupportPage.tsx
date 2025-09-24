import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle, HelpCircle, AlertCircle, MessageCircle, Clock, Phone, Mail, Send, Headphones, ArrowLeft } from 'lucide-react-native';
import { NativeBaseProvider } from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';

const supportCategories = [
  { id: 'technical', label: 'Technical Issues', icon: <AlertCircle size={20} /> },
  { id: 'account', label: 'Account Problems', icon: <HelpCircle size={20} /> },
  { id: 'matching', label: 'Matching Issues', icon: <MessageCircle size={20} /> },
  { id: 'payment', label: 'Payment & Billing', icon: <CheckCircle size={20} /> },
  { id: 'safety', label: 'Safety Concerns', icon: <AlertCircle size={20} /> },
  { id: 'other', label: 'Other', icon: <HelpCircle size={20} /> },
];

const HelpSupportPage: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedCategory && message.trim()) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedCategory('');
        setMessage('');
      }, 3000);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color="#4B5563" />
        </TouchableOpacity>
        <View style={styles.successBox}>
          <View style={styles.successIconWrapper}>
            <CheckCircle size={40} color="#16A34A" />
          </View>
          <Text style={styles.title}>Message Sent Successfully!</Text>
          <Text style={styles.subText}>Thank you for contacting us. Our support team will get back to you within 24 hours.</Text>
          <TouchableOpacity style={styles.submitButton} onPress={() => setSubmitted(false)}>
            <Text style={styles.submitButtonText}>Send Another Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
<NativeBaseProvider>
  <SafeAreaView style={{ flex: 1 }}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // adjust if needed
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
      {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <ArrowLeft size={20} color="#4B5563" />
      </TouchableOpacity> */}

      <Text style={styles.heading}>Help & Support</Text>
      <Text style={styles.subHeading}>We're here to help you</Text>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <MessageCircle size={24} color="#2563EB" />
          <Text style={styles.cardTitle}>Live Chat</Text>
          <Text style={styles.cardText}>Chat with our support team</Text>
          <Text style={styles.cardNote}>Available 24/7</Text>
        </View>
        <View style={styles.card}>
          <Mail size={24} color="#DC2626" />
          <Text style={styles.cardTitle}>Email Support</Text>
          <Text style={styles.cardText}>support@matrimony.com</Text>
          <Text style={styles.cardNote}>Response in 24hrs</Text>
        </View>
        <View style={styles.card}>
          <Phone size={24} color="#16A34A" />
          <Text style={styles.cardTitle}>Phone Support</Text>
          <Text style={styles.cardText}>+1 (555) 123-4567</Text>
          <Text style={styles.cardNote}>Mon-Fri 9AM-6PM</Text>
        </View>
      </View>

      <View style={styles.supportHoursBox}>
        <View style={{position:'absolute',right:5, top:5}}>
        <Clock size={24} color="#FFF" />
        </View>
        <View>
          <Text style={styles.supportHoursTitle}>Support Hours</Text>
          <Text style={styles.supportHoursText}>Mon - Fri: 9 AM - 6 PM</Text>
          <Text style={styles.supportHoursText}>Sat - Sun: 10 AM - 4 PM</Text>
        </View>
      </View>

      <Text style={styles.formTitle}>Send us a message</Text>
      <View style={styles.categoryWrapper}>
        {supportCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryItem, selectedCategory === cat.id && styles.categoryItemSelected]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            {cat.icon}
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>


        <View style={styles.textAreaContainer}>
          <TextInput
            multiline
            numberOfLines={6}
            placeholder="Describe your issue..."
            style={styles.textAreaInput}
            value={message}
            onChangeText={setMessage}
          />
        </View>

      <TouchableOpacity
        style={[styles.submitButton, (!selectedCategory || !message.trim()) && styles.disabledButton]}
        disabled={!selectedCategory || !message.trim()}
        onPress={handleSubmit}
      >
        <Send size={18} color="white" />
        <Text style={styles.submitButtonText}>Send Message</Text>
      </TouchableOpacity>

      <View style={styles.quickHelpBox}>
        <Text style={styles.quickHelpTitle}>Quick Help</Text>
        <Text style={styles.quickHelpItem}>• Profile not showing in search? Ensure your profile is complete and verified.</Text>
        <Text style={styles.quickHelpItem}>• Trouble with payments? Check your payment method and try again.</Text>
        <Text style={styles.quickHelpItem}>• Can't access your account? Reset your password or contact support.</Text>
      </View>
      </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </SafeAreaView>
</NativeBaseProvider>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
  backButton: { marginBottom: 16, width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  subHeading: { color: '#6B7280', marginBottom: 24, fontSize: 12, fontWeight: '500',marginTop:5 },
  cardRow: { marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 12 },
  cardTitle: { fontWeight: '600', marginTop: 8, color: '#111827' },
  cardText: { fontSize: 12, color: '#6B7280' },
  cardNote: { fontSize: 10, fontWeight: '500', color: '#059669', marginTop: 4 },
  supportHoursBox: { backgroundColor: '#F43F5E', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', marginVertical: 20, paddingHorizontal: 15, position:'relative' },
  supportHoursTitle: { fontWeight: '600', color: 'white', marginBottom: 8,fontSize: 15 },
  supportHoursText: { color: '#FEE2E2', fontSize: 14 },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  categoryWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginRight: 8, marginBottom: 8 },
  categoryItemSelected: { backgroundColor: '#FEE2E2', borderColor: '#F43F5E' },
  categoryLabel: { marginLeft: 4, fontSize: 12 },
  keyboardAvoidingView: {
    flex: 0,
  },
  textAreaContainer: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  textAreaInput: {
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#111827',
    height: 120,
    paddingTop: 4,
  },
  submitButton: { flexDirection: 'row', backgroundColor: '#F43F5E', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 8 },
  submitButtonText: { color: 'white', fontWeight: '600' },
  disabledButton: { backgroundColor: '#D1D5DB' },
  successBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  successIconWrapper: { backgroundColor: '#DCFCE7', padding: 20, borderRadius: 50, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subText: { color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  quickHelpBox: { marginTop: 24, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12 },
  quickHelpTitle: { fontWeight: '600', fontSize: 16, marginBottom: 8 },
  quickHelpItem: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
});

export default HelpSupportPage;
