import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Profile {
  id: string;
  name: string;
  age: number;
  height: string;
  city: string;
  jobSector: string;
  annualIncome: string;
  image: string;
  isLiked: boolean;
}

export default function ResultsScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { searchResults } = useLocalSearchParams<{ searchResults?: string }>();
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);

  useEffect(() => {
    if (searchResults) {
      try {
        const results = JSON.parse(searchResults);
        const formattedProfiles: Profile[] = results.map((user: any) => {
          const userDetails = user.userDetail?.[0] || {};
          return {
            id: user.userId.toString(),
            name: `${user.firstName} ${user.lastName}`,
            age: parseInt(user.age, 10),
            height: userDetails.height || 'N/A',
            city: user.location || 'N/A',
            jobSector: userDetails.occupation || 'N/A',
            annualIncome: (() => {
              const income = parseInt(userDetails.annualIncome || '0', 10);
              if (income >= 1000000) return `${income / 100000} - ${(income + 400000)/100000} LPA`;
              if (income > 0) return `${income / 100000} - ${(income + 400000)/100000} LPA`;
              return 'N/A';
            })(),
            image: user.profileImage || 'https://via.placeholder.com/150',
            isLiked: false,
          };
        });
        setProfiles(formattedProfiles);
      } catch (error) {
        console.error('Error parsing search results:', error);
      }
    }
  }, [searchResults]); // Only re-run when searchResults changes

  useEffect(() => {
    // Check premium status when component mounts
    const checkPremiumStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          setIsPremiumUser(user.isPremium || false);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      }
    };

    checkPremiumStatus();
  }, []);

  const handleUpgrade = () => {
    // Navigate to premium subscription screen
    router.push('/(root)/screens/PremiumTab'); // Update the route as per your app
  };

  const matchesCount = profiles.length;

  // const toggleLike = (profileId: string) => {
  //   setProfiles(prev =>
  //     prev.map(profile =>
  //       profile.id === profileId
  //         ? { ...profile, isLiked: !profile.isLiked }
  //         : profile
  //     )
  //   );
  // };

  const handleEditSearch = () => {
    router.back();
  };

  const handleViewProfile = (profileId: string) => {
    if (!profileId) {
        console.error('No profile ID provided');
        return;
    }
    router.push({
        pathname: '/(root)/screens/ProfileDetail',
        params: { userId: profileId }
    });
};

  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Search Results</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.topSection}>
        <Text style={styles.matchesText}>
          Showing {matchesCount.toLocaleString()} matches
        </Text>
        <TouchableOpacity onPress={handleEditSearch} style={styles.editSearchButton}>
          <Text style={styles.editSearchText}>Edit Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.profileList} showsVerticalScrollIndicator={false}>
        {profiles.map((profile) => (
          <View key={profile.id} style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <Image source={{ uri: profile.image }} style={styles.profileImage} />
              {/* Inside your profile card map function */}
             
              {/* <TouchableOpacity
                style={styles.heartButton}
                
              >
                <Heart
                  size={24}
                  color={profile.isLiked ? '#420001' : '#ccc'}
                  fill={profile.isLiked ? '#420001' : 'none'}
                />
              </TouchableOpacity> */}
            </View>

            <View style={styles.profileInfo}>
            {/* {!isPremiumUser && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
              )} */}
              <Text style={styles.profileName}>{profile.name}</Text>
              <View style={styles.profileDetails}>
                <Text style={styles.detailText}>{profile.age} years</Text>
                <Text style={styles.detailSeparator}>•</Text>
                <Text style={styles.detailText}>{profile.height}</Text>
                <Text style={styles.detailSeparator}>•</Text>
                <Text style={styles.detailText}>{profile.city}</Text>
              </View>
              <Text style={styles.detailText}>{profile.jobSector}</Text>
              <Text style={styles.detailText}>{profile.annualIncome}</Text>

              <TouchableOpacity
                style={styles.viewProfileButton}
                onPress={() => handleViewProfile(profile.id)}
              >
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
  {!isPremiumUser && (
    <TouchableOpacity 
      style={styles.upgradeButtonContainer}
      onPress={handleUpgrade}
    >
      <LinearGradient
        colors={['#420001', '#8B0000', '#420001']}
        style={styles.upgradeButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.upgradeButtonText}>Upgrade for Premium Filters</Text>
      </LinearGradient>
    </TouchableOpacity>
  )}
</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    // color: '#420001',
    paddingTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#420001',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 34,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  matchesText: {
    color: '#666',
    fontSize: 16,
  },
  editSearchButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#420001',
    backgroundColor: 'white',
  },
  editSearchText: {
    color: '#420001',
    fontSize: 14,
    fontWeight: '600',
  },
  profileList: {
    flex: 1,
    paddingHorizontal: 5,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 7,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileImage: {
    width: 100,
    height: 130,
    borderRadius: 8,
  },
  heartButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#420001',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
  },
  detailSeparator: {
    color: '#666',
    fontSize: 14,
    marginHorizontal: 8,
  },
  viewProfileButton: {
    backgroundColor: '#420001',
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  viewProfileText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  upgradeButtonContainer: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  upgradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'gold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});