import { View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeBaseProvider } from 'native-base';
import Tabs from '@/components/ExploreTabs';

const ExploreScreen = () => {
  return (
    <NativeBaseProvider>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Tabs />
        </View>
      </SafeAreaView>
    </NativeBaseProvider>
  );
};

export default ExploreScreen;