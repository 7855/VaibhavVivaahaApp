import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface AgeRangeSelectorProps {
  onAgeRangeChange?: (from: number, to: number) => void;
  initialFromAge?: number;
  initialToAge?: number;
}

const AgeRangeSelector: React.FC<AgeRangeSelectorProps> = ({ 
  onAgeRangeChange,
  initialFromAge = 18,
  initialToAge = 60 
}) => {
   const [fromAge, setFromAge] = useState(initialFromAge);
  const [toAge, setToAge] = useState(initialToAge);

  // Generate age options from 18 to 60
  const ageOptions = Array.from({ length: 43 }, (_, i) => i + 18);

  const handleFromAgeChange = (itemValue: number) => {
  setFromAge(itemValue);
  if (itemValue > toAge) {
    setToAge(itemValue);
    onAgeRangeChange?.(itemValue, itemValue);
  } else {
    onAgeRangeChange?.(itemValue, toAge);
  }
};
const handleToAgeChange = (itemValue: number) => {
  setToAge(itemValue);
  onAgeRangeChange?.(fromAge, itemValue);
};

  // Filter "To" age options based on selected "From" age
  const toAgeOptions = ageOptions.filter(age => age >= fromAge);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Age Range</Text>
      <View style={styles.pickerContainer}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>From</Text>
          <View style={styles.picker}>
<Picker
  selectedValue={fromAge}
  style={{color: "#000000"}}
  itemStyle={{color: "#000000"}}
  onValueChange={handleFromAgeChange}
>
  {ageOptions.map((age) => (
    <Picker.Item key={`from-${age}`} label={age.toString()} value={age} />
  ))}
</Picker>
          </View>
        </View>

        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>To</Text>
          <View style={styles.picker}>
           <Picker
  selectedValue={toAge}
  itemStyle={{color: "#000000"}}
  onValueChange={handleToAgeChange}
  enabled={fromAge <= toAge}
>
  {toAgeOptions.map((age) => (
    <Picker.Item key={`to-${age}`} label={age.toString()} value={age} />
  ))}
</Picker>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
});

export default AgeRangeSelector;