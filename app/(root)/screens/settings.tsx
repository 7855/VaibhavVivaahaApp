import { View, Image, StyleSheet, Text as NBText, ScrollView, TouchableOpacity } from 'react-native';
import React, { useCallback } from 'react';
import { NativeBaseProvider, Text, HStack, Avatar, VStack, Center, Box, Spacer, useToast } from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome';
import FT6Icon from 'react-native-vector-icons/FontAwesome6';
import FetIocn from 'react-native-vector-icons/Feather';
import MatIocn from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const settings = () => {
  const router = useRouter();
  const toast = useToast();

  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      
      // Show success toast
      toast.show({
        title: 'Logout Successful',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error during logout:', error);
      toast.show({
        title: 'Logout failed',
        duration: 2000,
      });
    }
  }, [logout, toast]);
  return (
      <NativeBaseProvider>
        <SafeAreaView edges={['right', 'left', 'top']} className="" style={{ backgroundColor: '#130057', marginBottom: 0, paddingBottom: 0,marginTop:0 }}>
        {/* <ScrollView > */}
        <View className="h-full">
  
          {/* <View>
            <HStack justifyContent="center" space={10}>
              <View style={{ position: 'relative' }}>
                <Avatar
                  bg=""
                  borderColor={'#9C27B0'}
                  borderWidth={3}
                  size={125}
                  padding={0.5}
                  source={{
                    uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
                  }}
                />
                <Icon
                  name="camera"
                  size={20}
                  color="#9C27B0"
                  style={{
                    position: 'absolute',
                    bottom: 10, // Moves icon below the avatar
                    right: 10, // Moves icon to the right
                    backgroundColor: 'white',
                    borderRadius: 50,
                    padding: 5,
                  }}
                />
              </View>
            </HStack>
          </View> */}

        {/* <View className='mt-3 mb-4'>
          <VStack space={1} alignItems="center">
            <Text bold fontSize={'xl'} color={'#fff'}>Gowri Shankar</Text>
            <Text fontSize={'xs'} color={'#fff'}>gowrishankar2423@gmail.com</Text>
          </VStack>
        </View> */}

        <Box alignItems="center" padding={0}>
              <Box
                overflow="hidden"
                borderColor="coolGray.200"
                _dark={{
                  borderColor: 'coolGray.600',
                  backgroundColor: 'gray.700',
                }}
                _web={{
                  shadow: 2,
                  borderWidth: 0,
                }}
                _light={{
                  backgroundColor: 'white',
                }}
                className="w-screen h-screen p-0 m-0"
                style={{ borderTopEndRadius: 15, borderTopStartRadius: 15 }}
                 shadow="50"
              >
         
         <View>
            <Center marginTop={3}>
            <Text fontSize={20} fontWeight={'bold'}>Settings</Text>
            </Center>
          </View>

        <VStack space={4} alignItems="start" marginTop={2} paddingRight={5} paddingLeft={5}>
          <View className='mt-2'>
            <Text fontSize="md" fontWeight="normal" color={'gray.400'}>Account Setting</Text>
          </View>
          <View>
        <Box alignItems="center" padding={4} backgroundColor={'gray.100'} borderRadius={10}>

                <HStack space={5}  alignItems="center">
                  <Icon name="lock" size={24} color="gray"style={{marginLeft:3}} />
                  <Text color="" fontSize="md" fontWeight="normal" className="text-lg">
                    Privacy Setting
                  </Text>
                  <Spacer />
                  <FT6Icon name="greater-than" size={15} color={'gray'} />
                </HStack>
                <HStack space={5}  alignItems="center" marginTop={5}>
                  <FetIocn name="edit-3" size={22} color="gray" />
                  <Text color="" fontSize="md" fontWeight="normal" className="text-lg">
                    Change PIN
                  </Text>
                  <Spacer />
                  <FT6Icon name="greater-than" size={15} color={'gray'} />
                </HStack>
                <HStack space={5}  alignItems="center" marginTop={5}>
                  <FT6Icon name="crown" size={22} color="rgba(30,64,175,1.00)" />
                  <Text color="rgba(30,64,175,1.00)" fontSize="md" fontWeight="normal" className="text-lg">
                    Upgrade Now
                  </Text>
                  <Spacer />
                  <FT6Icon name="greater-than" size={15} color={'gray'} />
                </HStack>
                </Box>
          </View>

          {/* Friends and Following Tabs  */}

          <View className='mt-2'>
            <Text fontSize="md" fontWeight="normal" color={'gray.400'}>Community Setting</Text>
          </View>
          <View>
        <Box alignItems="center" padding={4} backgroundColor={'gray.100'} borderRadius={10}>

                <HStack space={5}  alignItems="center">
                  <Icon name="group" size={22} color="gray" />
                  <Text color="" fontSize="md" fontWeight="normal" className="text-lg">
                    Your Connections
                  </Text>
                  <Spacer />
                  <FT6Icon name="greater-than" size={15} color={'gray'} />
                </HStack>
                <HStack space={5}  alignItems="center" marginTop={5}>
                  <MatIocn name="format-list-bulleted" size={22} color="gray" />
                  <Text color="" fontSize="md" fontWeight="normal" className="text-lg">
                    Viewed You
                  </Text>
                  <Spacer />
                  <FT6Icon name="greater-than" size={15} color={'gray'} />
                </HStack>
                <HStack space={5}  alignItems="center" marginTop={5}>
                <Ionicons name={"bookmark"} size={22} color={"gray"} />                 
                  <Text color="" fontSize="md" fontWeight="normal" className="text-lg">
                    Shortlisted Profiles
                  </Text>
                  <Spacer />
                  <FT6Icon name="greater-than" size={15} color={'gray'} />
                </HStack>
                </Box>
          </View>
             
          <View className='mt-2'>
            <Text fontSize="md" fontWeight="normal" color={'gray.400'}>Others</Text>
          </View>
          <View>
        <Box alignItems="center" padding={4} backgroundColor={'gray.100'} borderRadius={10}>

                <HStack space={5}  alignItems="center">
                  <FetIocn name="help-circle" size={22} color="gray" />
                  <Text color="" fontSize="md" fontWeight="normal" className="text-lg">
                    FAQ
                  </Text>
                  <Spacer />
                  <FT6Icon name="greater-than" size={15} color={'gray'} />
                </HStack>
                <HStack space={5}  alignItems="center" marginTop={5}>
                  <FetIocn name="alert-circle" size={22} color="gray" />
                  <Text color="" fontSize="md" fontWeight="normal" className="text-lg">
                    Help & Support
                  </Text>
                  <Spacer />
                  <FT6Icon name="greater-than" size={15} color={'gray'} />
                </HStack>
                <HStack space={5}  alignItems="center" marginTop={5}>
                  <FetIocn name="alert-circle" size={22} color="gray" />
                  <Text color="" fontSize="md" fontWeight="normal" className="text-lg">
                    Terms & Condition
                  </Text>
                  <Spacer />
                  <FT6Icon name="greater-than" size={15} color={'gray'} />
                </HStack>
                <TouchableOpacity className='w-full'
                      onPress={handleLogout}
                >
                <HStack space={5}  alignItems="center" marginTop={5}>
                  <MatIocn name="logout" size={22} color="gray" />
                  <Text color="" fontSize="md" fontWeight="normal" className="text-lg">
                    Log Out
                  </Text>
                  <Spacer />
                  <FT6Icon name="greater-than" size={15} color={'gray'} />
                </HStack>
                </TouchableOpacity>
                </Box>
          </View>
    </VStack>
              </Box>
            </Box>
        <View>
        </View>
        </View>
        {/* </ScrollView> */}
      </SafeAreaView>
    </NativeBaseProvider>

  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20, 
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,64,175,1.00)',
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  greetingName: {
    fontSize: 16,
    fontWeight: '500',
  }
});

export default settings