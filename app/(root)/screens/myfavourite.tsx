import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React from 'react'
import { Center, NativeBaseProvider, Stack, VStack } from 'native-base'
import { Image } from 'native-base';
import { Text as NBText } from 'native-base';
import Icon from 'react-native-vector-icons/Ionicons';

const members = [
  {
    id: 1,
    name: "Venkadesh J",
    location: "Nagarcoil",
    profilePic: "https://wallpaperaccess.com/full/317501.jpg"
  },
  {
    id: 2,
    name: "Aarav K",
    location: "Chennai",
    profilePic: "https://wallpaperaccess.com/full/317502.jpg"
  },
  {
    id: 3,
    name: "Ishita R",
    location: "Madurai",
    profilePic: "https://wallpaperaccess.com/full/317503.jpg"
  },
  {
    id: 4,
    name: "Karthik M",
    location: "Coimbatore",
    profilePic: "https://wallpaperaccess.com/full/317504.jpg"
  },
  {
    id: 5,
    name: "Meera P",
    location: "Trichy",
    profilePic: "https://wallpaperaccess.com/full/317502.jpg"
  },
  {
    id: 6,
    name: "Ananya S",
    location: "Salem",
    profilePic: "https://wallpaperaccess.com/full/317501.jpg"
  },
  {
    id: 7,
    name: "Rohan D",
    location: "Bangalore",
    profilePic: "https://wallpaperaccess.com/full/317512.jpg"
  },
  {
    id: 8,
    name: "Priya N",
    location: "Mysore",
    profilePic: "https://wallpaperaccess.com/full/317507.jpg"
  },
  {
    id: 9,
    name: "Varun T",
    location: "Hyderabad",
    profilePic: "https://wallpaperaccess.com/full/317508.jpg"
  },
  {
    id: 10,
    name: "Sneha G",
    location: "Pondicherry",
    profilePic: "https://wallpaperaccess.com/full/317509.jpg"
  },
  {
    id: 11,
    name: "Aditya R",
    location: "Mumbai",
    profilePic: "https://wallpaperaccess.com/full/317510.jpg"
  },
  {
    id: 12,
    name: "Kavya L",
    location: "Delhi",
    profilePic: "https://wallpaperaccess.com/full/317511.jpg"
  },
  {
    id: 13,
    name: "Nikhil V",
    location: "Kolkata",
    profilePic: "https://wallpaperaccess.com/full/317512.jpg"
  },
  {
    id: 14,
    name: "Shreya P",
    location: "Jaipur",
    profilePic: "https://wallpaperaccess.com/full/317513.jpg"
  },
  {
    id: 15,
    name: "Manoj C",
    location: "Lucknow",
    profilePic: "https://wallpaperaccess.com/full/317514.jpg"
  }
];


const MyFavourite = () => {
  return (
    <NativeBaseProvider>
      <SafeAreaView className="h-full">
        <ScrollView className='mb-3'>
          <View className='ml-5 mt-2 mb-2'>
            <NBText fontSize={'lg'} fontWeight={'semibold'}> My Favourite</NBText>
          </View>

          <View className='mb-10'>
            {members.map(member => (
              <VStack key={member.id} space={4} alignItems="center">
                <Center w="100%" h="75" rounded="md" shadow={1}>
                  <Stack direction="row" m={5} space={3} alignItems="center">
                    {/* Profile Picture */}
                    <Center shadow={3}>
                      <Image
                        source={{
                          uri: member.profilePic,
                        }}
                        alt="Img"
                        size="50px"
                        borderRadius="full"
                      />
                    </Center>

                    {/* Name and Location Details */}
                    <VStack flex={1} space={1}>
                      <NBText fontSize="md" fontWeight="semibold" isTruncated maxWidth="90%">
                        {member.name}
                      </NBText>
                      <NBText fontSize="sm" color="gray.500">{member.location}</NBText>
                    </VStack>

                    {/* Remove Button with Icon */}
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center', // Centers content horizontally
                        flex: 0.3,
                        borderWidth: 1,          // Adds the border
                        borderColor: '#ff0000',  // Border color
                        borderRadius: 5,         // Rounded corners
                        paddingVertical: 7,      // Vertical padding for better height
                        paddingHorizontal: 11,   // Horizontal padding to cover content properly
                      }}
                    >
                      <Text style={{ marginRight: 3 }}>Remove</Text>
                      <Icon name="remove-circle-sharp" color={'#ff0000'} size={17} />
                    </TouchableOpacity>

                  </Stack>
                </Center>
              </VStack>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </NativeBaseProvider>
  )
}

export default MyFavourite;
