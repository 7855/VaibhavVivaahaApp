// components/RangeSelectorModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Eye, X } from 'lucide-react-native';

interface RangeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  initialFrom: number;
  initialTo: number;
  onApply: (from: number, to: number) => void;
  formatValue?: (value: number) => string;
}

const RangeSelectorModal: React.FC<RangeSelectorModalProps> = ({
  visible,
  onClose,
  title,
  min,
  max,
  step = 1,
  unit = '',
  initialFrom,
  initialTo,
  onApply,
  formatValue = (val) => val.toString(),
}) => {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  // Update local state when initial props change
// In RangeSelectorModal.tsx
useEffect(() => {
  if (visible) {
    setFrom(initialFrom);
    setTo(initialTo);
  }
}, [visible, initialFrom, initialTo]);

  const options = Array.from(
    { length: Math.floor((max - min) / step) + 1 },
    (_, i) => min + i * step
  );

  const toOptions = options.filter(opt => opt >= from);

  const handleApply = () => {
    onApply(from, to);
    onClose();
  };

return (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.centeredModalOverlay}>
      <View style={styles.centeredModalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={18} color="#475569" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.pickersContainer}>
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>From</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={from}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(value) => {
                  setFrom(value);
                  if (value > to) {
                    setTo(value);
                  }
                }}
              >
                {options.map((value) => (
                  <Picker.Item 
                    key={`from-${value}`} 
                    label={`${formatValue(value)}${unit}`} 
                    value={value} 
                  />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>To</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={to}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={setTo}
                enabled={from <= to}
              >
                {toOptions.map((value) => (
                  <Picker.Item 
                    key={`to-${value}`} 
                    label={`${formatValue(value)}${unit}`} 
                    value={value} 
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);
};

const styles = StyleSheet.create({
  centeredModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.45)',
    padding: 20,
  },
  centeredModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    height: '50%',
    shadowColor: 'rgba(15,35,70,0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
    color: '#1F7FE5',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  picker: {
    color: '#0f1724',
  },
  pickerItem: {
    color: '#0f1724',
  },
  applyButton: {
    backgroundColor: '#1F7FE5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1F7FE5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  applyButtonText: {
    color: '#fff',
    fontFamily: 'Rubik-Bold',
    fontSize: 15,
  },
});

export default RangeSelectorModal;