import { View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Box, Heading, Pressable, Text as NBText, HStack, VStack, Spacer, Avatar } from 'native-base';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Entypo, MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import Search from '@/components/Search';
import { Grid3X3, Eye, Heart, MessageCircle, Users, Star, Bookmark } from 'lucide-react-native';

const ListChats = ({ allChats, onPress }) => {
  // Using allChats as the data source
  // console.log("received data =================>", allChats);

  const [listData, setListData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const handleSearch = (text) => {
    setSearchText(text);
    if (!text) {
      setFilteredData(listData);
      return;
    }
    const filtered = listData.filter(item =>
      item.otherUserName.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(filtered);
  };

  useEffect(() => {
    if (allChats) {
      setListData(allChats);
      setFilteredData(allChats);
      setIsLoading(false);
    }
  }, [allChats]);

  useEffect(() => {
    if (allChats) {
      setListData(allChats);
      setIsLoading(false);
    }
  }, [allChats]);

  if (isLoading) {
    return (
      <Box bg="white" flex="1" justifyContent="center" alignItems="center">
        <NBText>Loading chats...</NBText>
      </Box>
    );
  }

  const closeRow = (rowMap, rowKey) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };

  const deleteRow = (rowMap, rowKey) => {
    closeRow(rowMap, rowKey);
    const newData = [...listData];
    const prevIndex = listData.findIndex(item => item.conversationId === rowKey);
    newData.splice(prevIndex, 1);
    setListData(newData);
  };

  const onRowDidOpen = rowKey => {
    console.log('This row opened', rowKey);
  };

  const renderItem = ({ item, index }) => (
    <Box 
    key={index}
    borderBottomWidth="0.6"
    borderColor="coolGray.300"
    >
      <Pressable onPress={() => onPress(item)} _dark={{ bg: 'coolGray.800' }} _light={{ bg: 'white' }}>
        <Box pl="4" pr="5" py="2" pt="4" borderBottomWidth="0.3" borderColor="coolGray.200" _dark={{ borderColor: 'coolGray.700' }}>
          <HStack alignItems="center" space={3}>
            <Avatar size="55px" source={{ uri: item.profileImage }} />
            <VStack className='h-full'  width={'58%'} >
              <NBText color="coolGray.800" _dark={{ color: 'warmGray.50' }} bold>
                {item.otherUserName}
              </NBText>
              <NBText
                fontWeight={item.unreadCount > 0 ? "500" : "normal"}
                numberOfLines={2}
              >
                {item.lastMessage}
              </NBText>
            </VStack>
            <Spacer />
            <VStack className='h-full' space={2} alignItems={'center'}>
              <NBText fontSize={12} color="coolGray.800"fontWeight={item.unreadCount > 0 ? "600" : "normal"}  _dark={{ color: 'warmGray.50' }}>{item.lastMessageTime}</NBText>
              {item.unreadCount > 0 && (
                <Box
                  bg="success.500"
                  borderRadius="full"
                  px="2"
                  py="1"
                  width="6"
                  alignItems="center"
                  justifyContent="center"
                >
                  <NBText className='' color="white" fontSize="10">
                    {item.unreadCount}
                  </NBText>
                </Box>
              )}
            </VStack>
          </HStack>
        </Box>
      </Pressable>
    </Box>
  );

  const renderHiddenItem = (data, rowMap) => (
    <HStack flex="1" justifyContent="flex-end" pr="2">
      <Pressable
        w="70"
        bg="red.500"
        justifyContent="center"
        onPress={() => deleteRow(rowMap, data.item.conversationId)}
        _pressed={{ opacity: 0.5 }}
      >
        <VStack alignItems="center" space={2}>
          <Icon name="trash" color="white" size={12} />
          <NBText color="white" fontSize={12} fontWeight="medium">
            Delete
          </NBText>
        </VStack>
      </Pressable>
    </HStack>
  );


  return (
    
    <Box bg="gray" flex={1}>
      {/* Top section - 30% */}
      <Box flex={1.5}>
        <HStack paddingLeft={4} paddingRight={4} marginTop={3} justifyContent="space-between" alignItems="center">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Heart size={28} color="#E91E63" fill="#E91E63" />
            <NBText fontWeight="semibold" fontSize="lg" ml={2}>My Connections</NBText>
          </View>
        </HStack>
  
        <View style={{ paddingHorizontal: 3, marginTop: 7 }}>
          <Search onSearch={handleSearch} />
        </View>
      </Box>
  
      {/* Chat list section - 70% */}
      <Box flex={8.8} bg="white">
        <SwipeListView
          data={filteredData}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-130}
          previewRowKey={'0'}
          previewOpenValue={-40}
          previewOpenDelay={3000}
          onRowDidOpen={onRowDidOpen}
        />
      </Box>
    </Box>
  );
  
};

export default ListChats;
