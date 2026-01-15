import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/subscriptionContext';
import { useRoute } from '@react-navigation/native';
import userApi from '../api/userApi';

type SearchResultParams = {
  searchResults?: string;
  // Add other params if you have them
};

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
  subscriptionTag: string;
}

interface SearchData {
  minAge?: number;
  maxAge?: number;
  minAnnualIncome?: number;
  maxAnnualIncome?: number;
  dosham?: string;
  star?: string;
  education?: string;
  degree?: string;
  jobSector?: string;
  profilesWithHoroscope?: string;
  profileImageStatus?: string;
  [key: string]: any; // For any additional dynamic properties
}

interface SearchCriteria {
  minAge?: number;
  maxAge?: number;
  minAnnualIncome?: number;
  maxAnnualIncome?: number;
  dosham?: string;
  star?: string;
  education?: string;
  degree?: string;
  // jobSector?: string;
  profilesWithHoroscope?: string;
  profileImageStatus?: string;
  employedAt?: string;
  // Add other fields that might be in your search criteria
}

// In your component

export default function ResultsScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { searchResults } = useLocalSearchParams<{ searchResults?: string }>();
  const { searchCriteria } = useLocalSearchParams<{ searchCriteria?: string }>();
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);
  const { subscriptionData } = useSubscription() || {};
  const [profilesSearchCriteria, setProfilesSearchCriteria] = useState<SearchCriteria | null>(null);


  useEffect(() => {
    // console.log("searchResults",searchResults);

    if (searchResults) {
      try {
        const results = JSON.parse(searchResults);
        const formattedProfiles: Profile[] = results.map((user: any) => ({
          id: user?.userId, // Add fallback ID
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          age: parseInt(user.age, 10) || 0,
          height: user.height ? `${user.height}"` : 'N/A',
          city: user.location || 'N/A',
          jobSector: user.occupation || 'N/A',
          annualIncome: (() => {
            const income = parseInt(user.annualIncome || '0', 10);
            if (income >= 1000000) return `${income / 100000} LPA`;
            if (income > 0) return `${income / 100000} LPA`;
            return 'N/A';
          })(),
          image: user.profileImage || 'https://via.placeholder.com/150',
          isLiked: false,
          subscriptionTag: user.subscriptionTag || 'FREE' // Add this line

        }));
        // console.log(formattedProfiles);

        setProfiles(formattedProfiles);
      } catch (error) {
        console.error('Error parsing search results:', error);
      }
    }
  }, [searchResults]); // Only re-run when searchResults changes

  useEffect(() => {
    // console.log("searchCriteria",searchCriteria);

    if (searchCriteria) {
      try {
        const results = JSON.parse(searchCriteria);

        console.log("results", results);


        setProfilesSearchCriteria(results);
      } catch (error) {
        console.error('Error parsing search results:', error);
      }
    }
  }, [searchCriteria]);


  useEffect(() => {
    if (subscriptionData && subscriptionData.entitlements) {
      // console.log("subscriptionData======>", subscriptionData);
      // console.log("subscriptionData.entitlements:", subscriptionData.entitlements);

      const hasPremiumAccess =
        subscriptionData.entitlements.advSearch === true ||
        subscriptionData.entitlements.basicSearch === true;

      // console.log("hasPremiumAccess ===>", hasPremiumAccess);
      setIsPremiumUser(hasPremiumAccess);
    } else {
      // console.log("No subscription data or entitlements found");
      setIsPremiumUser(false);
    }
    // console.log("hasPremiumAccess ===>",isPremiumUser);

  }, [subscriptionData]);

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
  const gatherSearchData = (): SearchData => {
    if (!profilesSearchCriteria) {
      return {};
    }
    // console.log("profilesSearchCriteria",profilesSearchCriteria);


    return {
      minAge: profilesSearchCriteria.minAge,
      maxAge: profilesSearchCriteria.maxAge,
      minAnnualIncome: profilesSearchCriteria.minAnnualIncome,
      maxAnnualIncome: profilesSearchCriteria.maxAnnualIncome,
      dosham: profilesSearchCriteria.dosham,
      star: profilesSearchCriteria.star,
      education: profilesSearchCriteria.education,
      degree: profilesSearchCriteria.degree,
      jobSector: profilesSearchCriteria.employedAt,
      profilesWithHoroscope: profilesSearchCriteria.profilesWithHoroscope || 'N',
      profileImageStatus: profilesSearchCriteria.profileImageStatus || 'N',
    };
  };

  const checkUserSubscription = async () => {
    try {
      const subscriptionData = await AsyncStorage.getItem('userSubscription');
      if (subscriptionData) {
        const { isActive, expiryDate } = JSON.parse(subscriptionData);
        const isPremium = isActive && new Date(expiryDate) > new Date();
        return { isPremiumUser: isPremium };
      }
      return { isPremiumUser: false };
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { isPremiumUser: false };
    }
  };

  const handleSaveSearch = async () => {
    try {
      Alert.prompt(
        'Save Search',
        'Enter a name for this search:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Save',
            onPress: async (searchName: any) => {
              if (!searchName || searchName.trim() === '') {
                Alert.alert('Error', 'Please enter a name for your search');
                return;
              }
              try {
                const searchData = await gatherSearchData();
                const userIdRaw = await AsyncStorage.getItem('userId');

                if (!userIdRaw) {
                  throw new Error('User not found');
                }
                const userId = atob(userIdRaw);
                const filters = [];
                // Always include basic filters
                if (searchData.minAge || searchData.maxAge) {
                  filters.push({
                    filterKey: 'Age',
                    filterValue: `${searchData.minAge || 0} - ${searchData.maxAge || 0}`
                  });
                }
                if (searchData.minAnnualIncome || searchData.maxAnnualIncome) {
                  filters.push({
                    filterKey: 'Annual Income',
                    filterValue: `${searchData.minAnnualIncome || 0} - ${searchData.maxAnnualIncome || 0}`
                  });
                }
                // For premium users, include all filters
                const isPremium = await checkUserSubscription(); // Implement this function

                if (isPremium) {
                  console.log("searchData1", searchData);

                  // Add all premium filters
                  if (searchData.dosham) {
                    filters.push({
                      filterKey: 'Dosham',
                      filterValue: searchData.dosham
                    });
                  }
                  if (searchData.star) {
                    filters.push({
                      filterKey: 'Star',
                      filterValue: searchData.star
                    });
                  }
                  if (searchData.degree) {
                    filters.push({
                      filterKey: 'Education',
                      filterValue: searchData.degree
                    });
                  }
                  // Add Job Sector filter
                  if (searchData.jobSector && searchData.jobSector !== 'Any') {
                    filters.push({
                      filterKey: 'Job Sector',
                      filterValue: searchData.jobSector
                    });
                  }

                  if (searchData.profileImageStatus) {
                    filters.push({
                      filterKey: 'profileImageStatus1',
                      filterValue: searchData.profileImageStatus
                    });
                  }
                  if (searchData.profilesWithHoroscope) {
                    filters.push({
                      filterKey: 'profilesWithHoroscope',
                      filterValue: searchData.profilesWithHoroscope
                    });
                  }
                }
                const requestBody = {
                  userId: parseInt(userId),
                  searchName: searchName.trim(),
                  filters: filters,
                  isPremiumSearch: isPremium
                };

                console.log('requestBody', requestBody.filters);
                const response = await userApi.createOrUpdateSavedSearch(requestBody);

                if (response.data.code === 200) {
                  Alert.alert('Success', 'Search saved successfully!');
                } else {
                  throw new Error(response.data.message || 'Failed to save search');
                }
              } catch (error) {
                console.error('Error saving search:', error);
                Alert.alert('Error', error.message || 'Failed to save search. Please try again.');
              }
            }
          }
        ],
        'plain-text',
        '',
        'My Search'
      );
    } catch (error) {
      console.error('Error showing save dialog:', error);
      Alert.alert('Error', 'Failed to initiate save. Please try again.');
    }
  };

  return (

    <SafeAreaView edges={['right', 'left']} style={[{ backgroundColor: 'linear-gradient(0deg,rgba(254, 254, 254, 1) 18%, rgba(219, 177, 211, 1) 100%)' }, styles.container]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.resultsText}>Results</Text>
            <Text style={styles.matchesCount}>
              Showing {matchesCount.toLocaleString()} Matches
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, styles.editButton]}
              onPress={handleEditSearch}
            >
              <Text style={styles.editButtonText}>Edit Search</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.saveButton]}
              onPress={handleSaveSearch}
            >
              <Text style={styles.saveButtonText}>Save Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.profileList} showsVerticalScrollIndicator={false}>
        {profiles.map((profile, index) => (
          <View key={profile?.id || `profile-${index}`} style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              {/* User tier badge */}
              <View style={styles.profileImageContainer}>

                <Image source={{ uri: profile.image }} style={styles.profileImage} />
              </View>
              {/* <Image source={{ uri: profile.image }} style={styles.profileImage} /> */}
              {/* Inside your profile card map function */}

              {/* <TouchableOpacity
                style={styles.heartButton}
                
              >
                <Heart
                  size={24}
                  color={profile.isLiked ? '#420001' : '#ccc'}
                  fill={profile.isLiked ? '#420001' : 'none'}
                />
              </TouchableOpacity>  */}
            </View>

            <View style={styles.profileInfo}>

              {profile.subscriptionTag !== 'FREE' && (
                <View
                  style={[
                    styles.tierBadge,
                    profile.subscriptionTag === 'PLATINUM' && styles.platinumBadge,
                    profile.subscriptionTag === 'GOLD' && styles.goldBadge,
                    profile.subscriptionTag === 'SILVER' && styles.silverBadge,
                    (profile.subscriptionTag === 'BRONZE' || !profile.subscriptionTag) && styles.bronzeBadge,
                  ]}
                >
                  {profile.subscriptionTag === 'PLATINUM' && (
                    <MaterialIcons name="stars" size={13} color="#555" style={styles.badgeIcon} />
                  )}
                  {profile.subscriptionTag === 'GOLD' && (
                    <MaterialIcons name="star" size={13} color="#5E4200" style={styles.badgeIcon} />
                  )}
                  {profile.subscriptionTag === 'SILVER' && (
                    <MaterialIcons name="star-half" size={13} color="#555" style={styles.badgeIcon} />
                  )}
                  {profile.subscriptionTag === 'BRONZE' && (
                    <MaterialIcons name="star-border" size={13} color="#fff" style={styles.badgeIcon} />
                  )}
                  <Text
                    style={[
                      styles.tierBadgeText,
                      (profile.subscriptionTag === 'GOLD' || profile.subscriptionTag === 'SILVER' || profile.subscriptionTag === 'PLATINUM')
                        ? styles.lightText
                        : styles.darkText
                    ]}
                  >
                    {profile.subscriptionTag}
                  </Text>
                </View>
              )}
              <Text style={styles.profileName}>{profile.name}wjowoiejoweowhewoiejoiw</Text>
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
    // paddingTop: 10,
    // paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0

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
    paddingHorizontal: 15,
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
    marginRight: 8,
  },
  profileImage: {
    width: 120,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    width: '57%',
    lineHeight: 20,
    maxHeight: 40,
    overflow: 'hidden',
    // Add this to ensure proper text wrapping and ellipsis
    textOverflow: 'ellipsis',
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
    marginTop: 8,
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
  tierBadge: {
    position: 'absolute',
    top: -2,
    right: -5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 111,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  platinumBadge: {
    backgroundColor: '#E5E4E2',
    borderColor: '#B4B4B4',
  },
  goldBadge: {
    backgroundColor: '#FFD700',
    borderColor: '#FFC107',
  },
  silverBadge: {
    backgroundColor: '#E3E3E3',
    borderColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
    borderColor: '#8B4513',
  },
  tierBadgeText: {
    color: '#333',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Make text white for better contrast on darker badges
  goldBadgeText: {
    color: '#5E4200',
  },
  bronzeBadgeText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  badgeIcon: {
    marginRight: 4,
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  resultsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  matchesCount: {
    fontSize: 14,
    color: '#666',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#420001',
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: '#420001',
    borderColor: '#420001',
  },
  editButtonText: {
    color: '#420001',
    fontSize: 12,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

