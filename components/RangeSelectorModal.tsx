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
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}><X size={25}  /></Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  centeredModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    height:'50%',
    // maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#130001',
  },
  closeButton: {
    color: '#420001',
    fontSize: 18,
    fontWeight: 'bold',
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
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    color: '#130001',
  },
  pickerItem: {
    color: '#130001',
  },
  applyButton: {
    backgroundColor: '#420001',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#DADADA',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RangeSelectorModal;