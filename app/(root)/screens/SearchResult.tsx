import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/subscriptionContext';
import { buildUpgradeAction } from '../utils/upgradeNavigation';
import VerifiedBadges from '../../../components/VerifiedBadges';
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
  gender: string;
  isLiked: boolean;
  subscriptionTag: string;
  idVerified: boolean;
  educationVerified: boolean;
  incomeVerified: boolean;
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
  // Subcaste names for the saved-search round-trip — searchCriteria only carries numeric
  // subcasteIds, and the filter UI restores by name.
  const { subcasteNames } = useLocalSearchParams<{ subcasteNames?: string }>();
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);
  const { subscriptionData } = useSubscription() || {};
  const [profilesSearchCriteria, setProfilesSearchCriteria] = useState<SearchCriteria | null>(null);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchNameInput, setSearchNameInput] = useState('');
  const [isSavingSearch, setIsSavingSearch] = useState(false);


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
          image: user.profileImage || '',
          gender: user.gender || '',
          isLiked: false,
          // Was reading `user.subscriptionTag`, a field the API never actually returns (every
          // other screen in the app reads `subscriptionTitle` for this) — so the tier badge
          // below silently never fired for any real profile. Fixed to read the real field.
          subscriptionTag: user.subscriptionTitle || 'FREE',
          idVerified: user.idVerified === true || user.idVerified === 1,
          educationVerified: user.educationVerified === true || user.educationVerified === 1,
          incomeVerified: user.incomeVerified === true || user.incomeVerified === 1,
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

  const handleUpgrade = buildUpgradeAction({
    planTitle: subscriptionData?.planTitle,
    featureName: 'Advanced Search',
  });

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
      subcaste: (() => { try { return subcasteNames ? JSON.parse(subcasteNames) : []; } catch { return []; } })(),
    };
  };



  // Alert.prompt is iOS-only in React Native — it silently does nothing on Android (no popup
  // at all), which is why "Save Search" never appeared to work there. Replaced with a plain
  // cross-platform Modal + TextInput so both platforms get the same dialog.
  const handleSaveSearch = () => {
    setSearchNameInput('');
    setShowSaveSearchModal(true);
  };

  const submitSaveSearch = async () => {
    const searchName = searchNameInput.trim();
    if (!searchName) {
      Alert.alert('Error', 'Please enter a name for your search');
      return;
    }

    setIsSavingSearch(true);
    try {
      const searchData = await gatherSearchData();
      const userIdRaw = await AsyncStorage.getItem('userId');

      if (!userIdRaw) {
        throw new Error('User not found');
      }
      const userId = atob(userIdRaw);

      // Format filters array
      const filters = [];

      // Add age filter if available
      if (searchData.minAge || searchData.maxAge) {
        filters.push({
          filterKey: 'Age',
          filterValue: `${searchData.minAge || 18} - ${searchData.maxAge || 60}`
        });
      }

      // Add income filter if available
      if (searchData.minAnnualIncome || searchData.maxAnnualIncome) {
        filters.push({
          filterKey: 'Annual Income',
          filterValue: `${searchData.minAnnualIncome || 0} - ${searchData.maxAnnualIncome || 0}`
        });
      }

      // Add other filters
      if (searchData.dosham) {
        filters.push({
          filterKey: 'Dosham',
          filterValue: Array.isArray(searchData.dosham) ? searchData.dosham : [searchData.dosham]
        });
      }

      if (searchData.star) {
        filters.push({
          filterKey: 'Star',
          filterValue: Array.isArray(searchData.star) ? searchData.star : [searchData.star]
        });
      }

      console.log("searchData.degree===>", searchData.degree);

      if (searchData.degree) {
        filters.push({
          filterKey: 'Education',
          filterValue: Array.isArray(searchData.degree) ? searchData.degree : [searchData.degree]
        });
      }

      if (Array.isArray(searchData.subcaste) && searchData.subcaste.length > 0) {
        filters.push({
          filterKey: 'Subcaste',
          filterValue: searchData.subcaste
        });
      }

      if (searchData.jobSector) {
        filters.push({
          filterKey: 'Job Sector',
          filterValue: Array.isArray(searchData.jobSector) ? searchData.jobSector : [searchData.jobSector]
        });
      }

      if (searchData.profileImageStatus) {
        filters.push({
          filterKey: 'profileImageStatus1',
          filterValue: searchData.profileImageStatus
        });
      }

      // gatherSearchData defaults this to the string 'N' when unset, which is truthy in JS —
      // only save the filter when the user actually opted into horoscope-only filtering,
      // otherwise every saved search carries a spurious 'N' entry that downstream code (see
      // SearchTabs.tsx's handleUseSearch) can mistake for an active premium filter selection.
      if (searchData.profilesWithHoroscope === 'Y') {
        filters.push({
          filterKey: 'profilesWithHoroscope',
          filterValue: searchData.profilesWithHoroscope
        });
      }

      // Construct the request body
      const requestBody = {
        data: {
          userId: parseInt(userId),
          searchName: searchName,
          filters: filters,
          isPremiumSearch: {
            isPremiumUser: isPremiumUser
          }
        }
      };

      console.log('Saving search with data:', JSON.stringify(requestBody, null, 2));

      const response = await userApi.createOrUpdateSavedSearch(requestBody);

      if (response.data.code === 200) {
        setShowSaveSearchModal(false);
        Alert.alert('Success', 'Search saved successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to save search');
      }
    } catch (error) {
      console.error('Error saving search:', error);
      Alert.alert('Error', 'Failed to save search. Please try again.');
    } finally {
      setIsSavingSearch(false);
    }
  };

  // Tier badge styling per plan — was previously only ever checked for 'PLATINUM' even though
  // gold/silver/bronze badge styles already existed unused below. Now covers every paid tier,
  // rendered as a gradient "sticker" chip instead of a flat-color pill.
  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return { gradient: ['#eef2f7', '#c7d1db'] as [string, string], textColor: '#0f1724' };
      case 'GOLD': return { gradient: ['#FFE067', '#F6B733'] as [string, string], textColor: '#5E4200' };
      case 'SILVER': return { gradient: ['#f4f6f8', '#cbd5e1'] as [string, string], textColor: '#0f1724' };
      case 'CLASSIC': return { gradient: ['#e2a76f', '#8B4513'] as [string, string], textColor: '#fff' };
      default: return null;
    }
  };

  return (

    <SafeAreaView edges={['right', 'left']} style={styles.container}>
      <LinearGradient colors={['#FFFFFF', '#F3F7FA']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.resultsText}>Search Results</Text>
            <View style={styles.matchesCountRow}>
              <View style={styles.matchesCountBadge}>
                <Text style={styles.matchesCountBadgeText}>{matchesCount.toLocaleString()}</Text>
              </View>
              <Text style={styles.matchesCount}>Matches found</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, styles.editButton]}
              onPress={handleEditSearch}
              activeOpacity={0.8}
            >
              <MaterialIcons name="tune" size={14} color="#1F7FE5" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.saveButton]}
              onPress={handleSaveSearch}
              activeOpacity={0.8}
            >
              <MaterialIcons name="bookmark-border" size={14} color="#fff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.profileList} contentContainerStyle={styles.profileListContent} showsVerticalScrollIndicator={false}>
        {profiles.map((profile, index) => {
          const tier = (profile.subscriptionTag || 'FREE').toUpperCase();
          const tierStyle = getTierBadgeStyle(tier);
          const hasVerification = profile.idVerified || profile.educationVerified || profile.incomeVerified;

          return (
            <View key={profile?.id || `profile-${index}`} style={styles.profileCard}>
              <ImageBackground
                source={profile.image ? { uri: profile.image } :
                  profile.gender === 'M' ? require('../../../assets/images/avatarMen.png') :
                    profile.gender === 'F' ? require('../../../assets/images/avatarWomen.png') :
                      require('../../../assets/images/defaultAvatar.png')}
                style={styles.cardImageBg}
                imageStyle={styles.cardImageRadius}
              >
                <View style={styles.topBadgeRow}>
                  {tierStyle ? (
                    <LinearGradient
                      colors={tierStyle.gradient}
                      style={styles.tierChip}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <MaterialIcons name="auto-awesome" size={10} color={tierStyle.textColor} />
                      <Text style={[styles.tierChipText, { color: tierStyle.textColor }]}>{tier}</Text>
                    </LinearGradient>
                  ) : <View />}

                  {hasVerification && (
                    <View style={styles.verifiedChipWrap}>
                      <VerifiedBadges
                        idVerified={profile.idVerified}
                        educationVerified={profile.educationVerified}
                        incomeVerified={profile.incomeVerified}
                        mode="compact"
                        size="sm"
                      />
                    </View>
                  )}
                </View>

                <LinearGradient
                  colors={['transparent', 'rgba(6,10,20,0.35)', 'rgba(6,10,20,0.94)']}
                  locations={[0, 0.55, 1]}
                  style={styles.bottomScrim}
                >
                  <Text style={styles.cardNameAge} numberOfLines={1}>
                    {profile.name}{profile.age ? `, ${profile.age}` : ''}
                  </Text>

                  <View style={styles.chipRow}>
                    <View style={styles.glassChip}>
                      <MaterialIcons name="straighten" size={11} color="#fff" />
                      <Text style={styles.glassChipText} numberOfLines={1}>{profile.height}</Text>
                    </View>
                    <View style={styles.glassChip}>
                      <MaterialIcons name="location-on" size={11} color="#fff" />
                      <Text style={styles.glassChipText} numberOfLines={1}>{profile.city}</Text>
                    </View>
                  </View>
                  <View style={styles.chipRow}>
                    <View style={styles.glassChip}>
                      <MaterialIcons name="work" size={11} color="#fff" />
                      <Text style={styles.glassChipText} numberOfLines={1}>{profile.jobSector}</Text>
                    </View>
                    <View style={styles.glassChip}>
                      <MaterialIcons name="payments" size={11} color="#fff" />
                      <Text style={styles.glassChipText} numberOfLines={1}>{profile.annualIncome}</Text>
                    </View>
                  </View>
                </LinearGradient>

                <TouchableOpacity
                  style={styles.floatingCta}
                  onPress={() => handleViewProfile(profile.id)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#F6B733', '#f0a412']}
                    style={styles.floatingCtaGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialIcons name="arrow-forward" size={20} color="#0f1724" />
                  </LinearGradient>
                </TouchableOpacity>
              </ImageBackground>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomSection}>
        {!isPremiumUser && (
          <TouchableOpacity
            style={styles.upgradeButtonContainer}
            onPress={handleUpgrade}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#1F7FE5', '#1862b8']}
              style={styles.upgradeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="workspace-premium" size={18} color="#F6B733" />
              <Text style={styles.upgradeButtonText}>Upgrade for Premium Filters</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showSaveSearchModal}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!isSavingSearch) setShowSaveSearchModal(false); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.saveSearchOverlay}
        >
          <View style={styles.saveSearchCard}>
            <Text style={styles.saveSearchTitle}>Save Search</Text>
            <Text style={styles.saveSearchSubtitle}>Enter a name for this search:</Text>
            <TextInput
              style={styles.saveSearchInput}
              placeholder="e.g. My Search"
              placeholderTextColor="#94a3b8"
              value={searchNameInput}
              onChangeText={setSearchNameInput}
              autoFocus
              editable={!isSavingSearch}
            />
            <View style={styles.saveSearchButtonRow}>
              <TouchableOpacity
                style={[styles.saveSearchButton, styles.saveSearchCancelButton]}
                onPress={() => setShowSaveSearchModal(false)}
                disabled={isSavingSearch}
              >
                <Text style={styles.saveSearchCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveSearchButton, styles.saveSearchConfirmButton]}
                onPress={submitSaveSearch}
                disabled={isSavingSearch}
              >
                {isSavingSearch ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveSearchConfirmText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7FA',
  },
  profileList: {
    flex: 1,
  },
  profileListContent: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 18,
  },
  // Full-bleed photo card (Tinder/Hinge/Bumble "discover feed" style) — the whole card IS the
  // photo, name+age is bold and large over a bottom gradient scrim, meta details are frosted
  // glass chips instead of a plain icon+text list, and the CTA is a floating circular arrow
  // FAB half-sitting on the image edge instead of a text button. Much bolder than a boxed
  // photo-beside-text layout, closer to what a GenZ-facing dating/matching app actually looks like.
  profileCard: {
    width: '100%',
    aspectRatio: 0.98,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    shadowColor: 'rgba(15,23,42,0.9)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  cardImageBg: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardImageRadius: {
    resizeMode: 'cover',
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 12,
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 100,
  },
  tierChipText: {
    fontSize: 10,
    fontFamily: 'Rubik-ExtraBold',
    letterSpacing: 0.4,
  },
  verifiedChipWrap: {},
  bottomScrim: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 18,
    gap: 8,
  },
  cardNameAge: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    letterSpacing: -0.3,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 1,
  },
  glassChipText: {
    color: '#fff',
    fontSize: 11.5,
    fontFamily: 'Rubik-Medium',
    flexShrink: 1,
  },
  floatingCta: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingCtaGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  upgradeButtonContainer: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#1F7FE5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 30,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14.5,
    fontFamily: 'Rubik-Bold',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    fontSize: 19,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
    marginBottom: 5,
  },
  matchesCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchesCountBadge: {
    backgroundColor: '#F6B733',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  matchesCountBadgeText: {
    fontSize: 11,
    fontFamily: 'Rubik-ExtraBold',
    color: '#0f1724',
  },
  matchesCount: {
    fontSize: 12.5,
    fontFamily: 'Rubik-Medium',
    color: '#64748b',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#1F7FE5',
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: '#1F7FE5',
    borderColor: '#1F7FE5',
  },
  editButtonText: {
    color: '#1F7FE5',
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
  },
  saveSearchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  saveSearchCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  saveSearchTitle: {
    fontSize: 17,
    fontFamily: 'Rubik-Bold',
    color: '#0f1724',
    marginBottom: 4,
  },
  saveSearchSubtitle: {
    fontSize: 13,
    fontFamily: 'Rubik-Regular',
    color: '#6b7280',
    marginBottom: 14,
  },
  saveSearchInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#0f1724',
    marginBottom: 18,
  },
  saveSearchButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveSearchButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSearchCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1F7FE5',
  },
  saveSearchConfirmButton: {
    backgroundColor: '#1F7FE5',
  },
  saveSearchCancelText: {
    color: '#1F7FE5',
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
  },
  saveSearchConfirmText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
  },
});
