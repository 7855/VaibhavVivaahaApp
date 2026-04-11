import { View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tabs from '../screens/SearchTabs';

const ExploreScreen = () => {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Tabs />
      </View>
    </SafeAreaView>
  );
};

export default ExploreScreen;
