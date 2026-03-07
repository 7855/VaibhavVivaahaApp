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
        <ChevronDown size={16} color="#666" />
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
                <CloseIcon size={24} color="#666" />
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
                  <Text style={styles.optionText}>{item}</Text>
                  {selectedValues.includes(item) && (
                    <View style={styles.checkmarkContainer}>
                      <Check size={20} color="#7C3AED" />
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
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 28,
  },
  buttonText: {
    flex: 1,
    marginRight: 8,
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '80%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
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
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionsListContent: {
    paddingBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionSelected: {
    backgroundColor: '#f8f5ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  checkmarkContainer: {
    width: 24,
    alignItems: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 12,
    backgroundColor: '#fafafa',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MultiSelectDropdown;