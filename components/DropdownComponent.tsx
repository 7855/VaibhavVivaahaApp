import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
    Actionsheet,
    ActionsheetContent,
    ActionsheetItem,
    ActionsheetItemText,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
    ActionsheetBackdrop,
} from "@/components/ActionSheet"
import { Box, VStack } from 'native-base';
import Ionicons from 'react-native-vector-icons/Ionicons';


type DropdownItem = {
  label: string;
  value: string;
};

type Props = {
  data: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
};

const DropdownComponent: React.FC<Props> = ({ data = [], onSelect }) => {
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (item: DropdownItem) => {
    setSelected(item.label);
    setShowActionsheet(false);
    onSelect?.(item);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.selector} onPress={() => setShowActionsheet(true)}>
        <View style={styles.selectorContent}>
          <Text style={styles.selectorText}>{selected ? selected : 'Select'}</Text>
          <Ionicons
            name={"chevron-down"}
            size={24}
            color="white"
          />
        </View>
      </TouchableOpacity>

      <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent style={styles.contentSty}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <ScrollView  contentContainerStyle={{ paddingBottom: 90 }}>
            {data.map((item) => (
              <ActionsheetItem key={item.value} onPress={() => handleSelect(item)}>
                <Box className="justify-center items-start py-1 w-full px-2">
                  <VStack reversed={true} className="items-start">
                    <Box className="" />
                    <Box className="" />
                    <Box className="justify-center items-start">
                      <Text className="text-lg">{item.label}</Text>
                    </Box>
                  </VStack>
                </Box>
              </ActionsheetItem>
            ))}
          </ScrollView>
        </ActionsheetContent>
      </Actionsheet>
    </View>
  );
};

export default DropdownComponent;

const styles = StyleSheet.create({
  container: {
    padding: 5, 
    paddingLeft: 0
  },
  contentSty: {
    maxHeight: '75%',
    width:'100%',
    backgroundColor: 'white',
    color:'black'
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 8,
    width: '100%',
  },
  selectorContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});

