import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import VerifiedBadges from './VerifiedBadges';

interface DiscoveryProfileCardProps {
  imageUrl: string;
  name: string;
  age: number;
  job: string;
  location: string;
  gender?: string;
  idVerified?: boolean;
  educationVerified?: boolean;
  incomeVerified?: boolean;
  isNew?: boolean;
}

// Presentational only — no touch handling here. The caller wraps this in its own
// TouchableOpacity (same pattern the previous ExploreProfileCard usage followed),
// so navigation logic stays entirely in the screen, not this component.
const DiscoveryProfileCard: React.FC<DiscoveryProfileCardProps> = ({
  imageUrl, name, age, job, location, gender,
  idVerified, educationVerified, incomeVerified,
  isNew,
}) => {
  const hasVerification = idVerified || educationVerified || incomeVerified;

  return (
    <View style={styles.card}>
      <ImageBackground
        source={
          imageUrl
            ? { uri: imageUrl }
            : gender === 'M'
            ? require('../assets/images/avatarMen.png')
            : gender === 'F'
            ? require('../assets/images/avatarWomen.png')
            : require('../assets/images/defaultAvatar.png')
        }
        style={styles.image}
        imageStyle={styles.imageRadius}
      >
        {isNew ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        ) : null}

        {hasVerification ? (
          <View style={styles.shieldWrap}>
            <VerifiedBadges
              idVerified={idVerified}
              educationVerified={educationVerified}
              incomeVerified={incomeVerified}
              mode="compact"
              size="sm"
            />
          </View>
        ) : null}

        <LinearGradient
          colors={['transparent', 'rgba(66,0,1,0.35)', 'rgba(35,0,1,0.92)']}
          locations={[0, 0.55, 1]}
          style={styles.scrim}
        >
          <Text style={styles.name} numberOfLines={1}>
            {name}{age ? `, ${age}` : ''}
          </Text>
          {job ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="briefcase-outline" size={11} color="rgba(255,255,255,0.85)" />
              <Text style={styles.metaText} numberOfLines={1}>{job}</Text>
            </View>
          ) : null}
          {location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.85)" />
              <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={styles.viewFab}>
          <Ionicons name="arrow-forward" size={16} color="#420001" />
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 0.72,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#EFE7E4',
    shadowColor: '#420001',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  image: { flex: 1, justifyContent: 'flex-end' },
  imageRadius: { resizeMode: 'cover' },
  scrim: {
    paddingHorizontal: 12,
    paddingTop: 28,
    paddingBottom: 12,
    gap: 3,
  },
  name: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10.5,
    fontFamily: 'Rubik-Medium',
    flexShrink: 1,
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#F6B733',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 3,
  },
  newBadgeText: {
    fontSize: 9,
    fontFamily: 'Rubik-ExtraBold',
    color: '#420001',
    letterSpacing: 0.4,
  },
  shieldWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
  },
  viewFab: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F6B733',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default React.memo(DiscoveryProfileCard);
