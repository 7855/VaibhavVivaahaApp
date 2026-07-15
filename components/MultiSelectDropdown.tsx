// In MultiSelectDropdown.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, Platform } from 'react-native';
import { Check, X as CloseIcon, ChevronDown } from 'lucide-react-native';

// ... rest of your imports and interface
interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}
const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues = [],
  onSelect,
  placeholder = 'Select options'
}) => {
  const [visible, setVisible] = useState(false);

  const toggleItem = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(item => item !== value)
      : [...selectedValues, value];
    onSelect(newSelected);
  };

  const displayText = selectedValues.length 
    ? selectedValues.join(', ') 
    : placeholder;

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setVisible(true)}
      >
        <Text
          style={[
            styles.buttonText,
            !selectedValues.length && styles.placeholderText
          ]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <ChevronDown size={16} color="#1F7FE5" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Education</Text>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.closeButton}
              >
                <CloseIcon size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    selectedValues.includes(item) && styles.optionSelected
                  ]}
                  onPress={() => toggleItem(item)}
                >
                  <Text style={[styles.optionText, selectedValues.includes(item) && styles.optionTextSelected]}>{item}</Text>
                  {selectedValues.includes(item) && (
                    <View style={styles.checkmarkContainer}>
                      <Check size={18} color="#1F7FE5" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
              contentContainerStyle={styles.optionsListContent}
            />
            
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 28,
  },
  buttonText: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#0f1724',
  },
  placeholderText: {
    color: '#94a3b8',
    fontFamily: 'Rubik-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(15,35,70,0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionsListContent: {
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  optionSelected: {
    backgroundColor: '#dfecfb',
  },
  optionText: {
    fontSize: 14.5,
    fontFamily: 'Rubik-Medium',
    color: '#334155',
    flex: 1,
  },
  optionTextSelected: {
    color: '#1F7FE5',
    fontFamily: 'Rubik-Bold',
  },
  checkmarkContainer: {
    width: 24,
    alignItems: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 14,
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#475569',
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
  },
  applyButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1F7FE5',
    borderRadius: 10,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  applyButtonText: {
    color: '#fff',
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
  },
});

export default MultiSelectDropdown;