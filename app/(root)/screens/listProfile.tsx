import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DiscoveryProfileCard from '@/components/DiscoveryProfileCard';
import userApi from '@/app/(root)/api/userApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserData } from '../contexts/UserDataContext';

// Sourced from the home page's real palette (index.tsx gradient + VVMFooterNav's active-tab
// color) rather than the standalone brand maroon, so this screen actually feels part of the
// same app instead of a one-off dark-themed page.
const BRAND_BLUE = '#1F7FE5';
const INK = '#0f1724';
const MUTED = '#64748b';
const BRAND_GOLD = '#F6B733';

type Profile = {
  userDetail: any;
  userId: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  age: number;
  location: string;
  occupation: string;
  gender?: string;
  idVerified?: boolean;
  educationVerified?: boolean;
  incomeVerified?: boolean;
  onPress?: () => void;
};

// Per-`type` copy for the header, subtitle and empty state — presentational only,
// mirrors the same 4 cases fetchProfiles() already switches on below.
const LIST_META: Record<string, { title: string; subtitle: string; emptyTitle: string; emptyText: string; icon: keyof typeof Ionicons.glyphMap }> = {
  newConnections: {
    title: 'New Connections',
    subtitle: 'Fresh faces who just joined',
    emptyTitle: 'No new connections yet',
    emptyText: 'Check back soon — new members join every day.',
    icon: 'people-outline',
  },
  dailyRecommendations: {
    title: 'Daily Recommendations',
    subtitle: 'Handpicked matches for you today',
    emptyTitle: 'No recommendations yet',
    emptyText: 'Complete your profile to get better daily picks.',
    icon: 'sparkles-outline',
  },
  nearYou: {
    title: 'Near Your Location',
    subtitle: 'Members close to where you are',
    emptyTitle: 'No one nearby yet',
    emptyText: "We couldn't find matches near you right now.",
    icon: 'location-outline',
  },
  interestMatches: {
    title: 'Matches Based on Interests',
    subtitle: 'Because you share similar interests',
    emptyTitle: 'No interest matches yet',
    emptyText: 'Add a few hobbies to your profile to find better matches.',
    icon: 'heart-outline',
  },
  allMatches: {
    title: 'All Matches',
    subtitle: 'Every profile in your community',
    emptyTitle: 'No matches found',
    emptyText: 'Check back soon — new members join every day.',
    icon: 'grid-outline',
  },
};
const DEFAULT_META = LIST_META.newConnections;

const ListProfile = () => {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { userData } = useUserData();
  const [profileData, setProfileData] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    try {
      const location = userData.location;
      const storedGender = userData.gender;
      const casteId = userData.casteId;

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
        case 'interestMatches': {
          const oppositeGender = storedGender === 'M' ? 'F' : 'M';
          const response = await userApi.getInterestMatchesByUser(parseInt(casteId!), oppositeGender, userData.userId);
          setProfileData(response.data.data || []);
          break;
        }
        case 'allMatches': {
          const response = await userApi.getAllCasteProfilesByGender(parseInt(casteId!), storedGender);
          setProfileData(response.data.data || []);
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

  const meta = LIST_META[type as string] || DEFAULT_META;
  const isNewConnections = type === 'newConnections';

  return (
    <SafeAreaView edges={['right', 'left']} style={styles.root}>
      {/* Header color/back-button now come from the shared screens/_layout.tsx theme —
          only the title needs overriding per-screen here. */}
      <Stack.Screen options={{ title: meta.title }} />

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText} numberOfLines={1}>{meta.subtitle}</Text>
        {!loading && profileData.length > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{profileData.length}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={BRAND_BLUE} />
          <Text style={styles.loadingText}>Finding profiles for you...</Text>
        </View>
      ) : profileData.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIcon}>
            <Ionicons name={meta.icon} size={42} color={BRAND_BLUE} />
          </View>
          <Text style={styles.emptyTitle}>{meta.emptyTitle}</Text>
          <Text style={styles.emptySubtitle}>{meta.emptyText}</Text>
        </View>
      ) : (
        <FlatList
          data={profileData}
          keyExtractor={(_, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              style={{ flex: 1 }}
              onPress={() => {
                router.push({
                  pathname: '/screens/ProfileDetail',
                  params: { userId: item.userId }
                });
              }}
            >
              <DiscoveryProfileCard
                imageUrl={item.profileImage}
                name={`${item.firstName} ${item.lastName}`}
                age={item.age}
                location={item.location}
                job={item.userDetail[0]?.occupation ?? 'N/A'}
                gender={item.gender}
                idVerified={item.idVerified}
                educationVerified={item.educationVerified}
                incomeVerified={item.incomeVerified}
                isNew={isNewConnections}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF7F5' },

  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  subHeaderText: { flex: 1, fontSize: 12.5, fontFamily: 'Rubik-Medium', color: '#7a5a5c' },
  countBadge: {
    backgroundColor: BRAND_GOLD,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
    marginLeft: 10,
  },
  countText: { color: INK, fontSize: 12, fontFamily: 'Rubik-ExtraBold' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  row: { gap: 14 },

  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  loadingText: { marginTop: 14, fontSize: 13, fontFamily: 'Rubik-Medium', color: '#7a5a5c' },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(246,183,51,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: { fontSize: 17, fontFamily: 'Rubik-Bold', color: BRAND_BLUE, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Rubik-Regular',
    color: '#8a7274',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
});

export default ListProfile;
