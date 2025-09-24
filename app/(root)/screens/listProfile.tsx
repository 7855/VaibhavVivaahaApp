import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeBaseProvider, Box, Text, Center } from 'native-base';
import ExploreProfileCard from '@/components/ExploreProfileCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import userApi from '@/app/(root)/api/userApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const styles = StyleSheet.create({
  containerProfle: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  rowProfile: {
    justifyContent: 'space-between',
    marginBottom: -30, 
  },
  cardWrapper: {
    width: '49%',
    marginBottom: 40, 
    height:280
  },
  heading: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop:5,
    textAlign: 'center',
    paddingTop:3,
    textTransform: 'uppercase',
  },
  headingContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
  },
});

type Profile = {
  userDetail: any;
  userId: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  age: number;
  location: string;
  occupation: string;
  onPress?: () => void;
};

// const ListProfile = async () => {
//   const router = useRouter();
//   const { type } = useLocalSearchParams();
//   const [profileData, setProfileData] = useState<Profile[]>([]);
//   const [loading, setLoading] = useState(true);
//   const location = await AsyncStorage.getItem('location');
//   const storedGender = await AsyncStorage.getItem('gender');
//   const casteId = await AsyncStorage.getItem('casteId');

  // const fetchNewConnections = async () => {

    
  //   try {
  //     const response = await userApi.getNewConnections();
  //     setProfileData(response.data.data);
  //   } catch (error) {
  //     console.error('Error fetching new connections:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const fetchDailyRecommendations = async () => {
  //   try {
  //     const response = await userApi.getDailyRecommendation();
  //     setProfileData(response.data.data);
  //   } catch (error) {
  //     console.error('Error fetching daily recommendations:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const fetchNearYou = async () => {
  //   try {
  //     const response = await userApi.getNearYouProfiles(casteId, storedGender, location);
  //     setProfileData(response.data.data);
  //   } catch (error) {
  //     console.error('Error fetching near you profiles:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const ListProfile = () => {
    const router = useRouter();
    const { type } = useLocalSearchParams();
    const [profileData, setProfileData] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
  
    const fetchProfiles = async () => {
      try {
        const location = await AsyncStorage.getItem('location');
        const storedGender = await AsyncStorage.getItem('gender');
        const casteId = await AsyncStorage.getItem('casteId');
  
        switch (type) {
          case 'newConnections': {
            const response = await userApi.getNewConnections(parseInt(casteId!), storedGender);
            console.log("New Connections Data ===========>", response.data.data[0].userDetail);
            
            setProfileData(response.data.data);
            break;
          }
          case 'dailyRecommendations': {
            const response = await userApi.getDailyRecommendation(parseInt(casteId!), storedGender);
            setProfileData(response.data.data);
            break;
          }
          case 'nearYou': {
            const response = await userApi.getNearYouProfiles(parseInt(casteId!), storedGender, location!);
            setProfileData(response.data.data);
            break;
          }
          default: {
            const response = await userApi.getNewConnections(parseInt(casteId!), storedGender);
            setProfileData(response.data.data);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchProfiles();
    }, [type]);

  if (loading) {
    return (
      <NativeBaseProvider>
        <Center flex={1}>
          <Text>Loading...</Text>
        </Center>
      </NativeBaseProvider>
    );
  }

  const getHeading = () => {
    switch (type) {
      case 'newConnections':
        return 'New Profiles';
      case 'dailyRecommendations':
        return 'Daily Recommendations';
      case 'nearYou':
        return 'Near Your Location';
      default:
        return 'New Profiles';
    }
  };

  return (
    <NativeBaseProvider>
      <SafeAreaView edges={['right', 'left', 'top']} style={{ backgroundColor: '#130057', flex: 1 }}>
        {/* <View style={styles.headingContainer}>
          <Text style={styles.heading}>{getHeading()}</Text>
        </View> */}
        <View style={styles.containerProfle}>
          <FlatList
            data={profileData}
            keyExtractor={(_, index) => index.toString()}
            numColumns={2}
            contentContainerStyle={{ flexGrow: 1 }}
            columnWrapperStyle={styles.rowProfile}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <TouchableOpacity
                  onPress={() => {
                    router.push({
                      pathname: '/screens/ProfileDetail',
                      params: { userId: item.userId }
                    });
                  }}
                >
                  <ExploreProfileCard
                    imageUrl={item.profileImage}
                    name={`${item.firstName} ${item.lastName}`}
                    age={item.age}
                    location={item.location}
                    job={item.userDetail[0]?.occupation ?? 'N/A'}
                    />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </NativeBaseProvider>
  );
};

export default ListProfile;