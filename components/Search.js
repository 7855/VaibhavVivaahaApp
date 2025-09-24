import React, { useState } from 'react';
import { View } from 'react-native';
import { Input, HStack, Icon as NBIcon } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

const Search = ({ onSearch }) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (text) => {
    setSearchText(text);
    onSearch(text);
  };

  return (
    <View>
      <Input
        placeholder="Search chats..."
        value={searchText}
        onChangeText={handleSearch}
        variant="filled"
        InputLeftElement={
          <HStack space={2} alignItems="center">
            <NBIcon as={MaterialIcons} name="search" size="sm" color="gray.400" />
          </HStack>
        }
        _input={{
          fontSize: 'md',
          color: 'coolGray.800',
          _dark: { color: 'warmGray.50' },
          borderRadius: 8,
          height: 48,
          backgroundColor: 'gray.50'
        }}
        _light={{
          backgroundColor: 'white'
        }}
        _dark={{
          backgroundColor: 'gray.800'
        }}
      />
    </View>
  );
};

export default Search;
