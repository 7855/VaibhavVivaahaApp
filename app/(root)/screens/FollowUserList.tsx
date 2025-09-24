import React from 'react';
import { View, Image, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeBaseProvider, VStack, Stack, Text as NBText, Center, Box, HStack, Image as NBImage } from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useLocalSearchParams } from 'expo-router';

const FollowUserList = () => {
  const { title, data } = useLocalSearchParams();
  const usersData = JSON.parse(data as string || '[]');

  // const usersData = parsedData;

  return (
    <NativeBaseProvider>
      <SafeAreaView className="h-full">
        <ScrollView className='mb-3'>
          <View className='ml-5 mt-2 mb-2'>
            <NBText fontSize={'lg'} fontWeight={'semibold'}>{title}</NBText>
          </View>
          <Box w="full" h="0.9" bg="gray.200"  />

          <View className='mb-10'>
            {usersData.map((user: any) => (
              <VStack key={user.userId} space={4} alignItems="center">
                <Center w="100%" h="75" rounded="md" >
                  <Stack direction="row" m={5} space={3} alignItems="center">
                    {/* Profile Picture */}
                    <Center shadow={3}>
                      <NBImage
                        source={{
                          uri: user.profileImage || 'https://wallpaperaccess.com/full/317513.jpg',
                        }}
                        alt="Profile"
                       size="50px"
                        rounded="full"
                        
                      />
                    </Center>

                    {/* Name and Location Details */}
                    <VStack flex={1} space={1}>
                      <NBText fontSize="md" fontWeight="semibold" isTruncated maxWidth="90%">
                        {user.firstName} {user.lastName}
                      </NBText>
                      <NBText fontSize="sm" color="gray.500">Member ID: {user.memberId}</NBText>
                    </VStack>

                    {/* Remove Button with Icon */}
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 0.3,
                        borderWidth: 1,
                        borderColor: '#ff0000',
                        borderRadius: 5,
                        paddingVertical: 7,
                        paddingHorizontal: 11,
                      }}
                      onPress={() => {
                        // Add remove functionality here
                        console.log('Remove clicked for user:', user.userId);
                      }}
                    >
                      <Text style={{ marginRight: 3 }}>Remove</Text>
                      <Ionicons name="remove-circle-sharp" color={'#ff0000'} size={17} />
                    </TouchableOpacity>

                  </Stack>
                </Center>
              </VStack>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </NativeBaseProvider>
  );
};

export default FollowUserList;
