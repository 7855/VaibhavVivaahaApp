import React from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchProps {
  onSearch?: (text: string) => void;
  placeholder?: string;
  style?: object;
}

const Search: React.FC<SearchProps> = ({ 
  onSearch, 
  placeholder = 'Search...',
  style 
}) => {
  const [search, setSearch] = React.useState('');
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handleClear = () => {
    setSearch('');
    onSearch?.('');
  };

  const animateClear = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color="#666" 
          style={styles.searchIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            onSearch?.(text);
          }}
          underlineColorAndroid="transparent"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              handleClear();
              animateClear();
            }}
            style={styles.clearButton}
          >
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
});

export default Search;