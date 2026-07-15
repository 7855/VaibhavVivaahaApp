import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import VerifiedBadges from './VerifiedBadges';
import { getInterestEmoji, getInterestLabel } from '../constants/interests';

interface ExploreProfileCardProps {
  imageUrl: string;
  name: string;
  age: number;
  job: string;
  location: string;
  gender?: string;
  idVerified?: boolean;
  educationVerified?: boolean;
  incomeVerified?: boolean;
  sharedInterests?: string[];
  hasActiveBoost?: boolean;
}

const ExploreProfileCard: React.FC<ExploreProfileCardProps> = ({
  imageUrl, name, age, job, location, gender,
  idVerified, educationVerified, incomeVerified,
  sharedInterests, hasActiveBoost,
}) => {
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
        {/* ⭐ Boosted ribbon at top-left */}
        {hasActiveBoost ? (
          <View style={styles.boostBadge}>
            <Ionicons name="flash" size={10} color="#420001" />
            <Text style={styles.boostBadgeText}>Boosted</Text>
          </View>
        ) : null}

        {/* Trust shield at top-right corner */}
        <View style={styles.shieldWrap}>
          <VerifiedBadges
            idVerified={idVerified}
            educationVerified={educationVerified}
            incomeVerified={incomeVerified}
            mode="compact"
            size="sm"
          />
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(66,0,1,0.35)', 'rgba(35,0,1,0.92)']}
          locations={[0, 0.55, 1]}
          style={styles.gradientLayer}
        />

        <View style={styles.content}>
          <Text style={styles.nameAge} numberOfLines={1}>
            {name}{age ? `, ${age}` : ''}
          </Text>
          {job ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="briefcase-outline" size={11} color="rgba(255,255,255,0.88)" />
              <Text style={styles.metaText} numberOfLines={1}>{job}</Text>
            </View>
          ) : null}
          {location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.88)" />
              <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
            </View>
          ) : null}
          {sharedInterests && sharedInterests.length > 0 ? (
            <View style={styles.interestRow}>
              {sharedInterests.slice(0, 3).map((code) => (
                <View key={code} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>
                    {getInterestEmoji(code)} {getInterestLabel(code)}
                  </Text>
                </View>
              ))}
              {sharedInterests.length > 3 ? (
                <View style={styles.interestTag}>
                  <Text style={styles.interestTagText}>+{sharedInterests.length - 3}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.viewFab}>
          <Ionicons name="arrow-forward" size={15} color="#420001" />
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 0.74,
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
  gradientLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 3,
  },
  nameAge: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 10.5,
    fontFamily: 'Rubik-Medium',
    flexShrink: 1,
  },
  interestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
  },
  interestTag: {
    backgroundColor: 'rgba(246,183,51,0.28)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  interestTagText: {
    fontSize: 9,
    fontFamily: 'Rubik-Medium',
    color: '#FFE8B0',
  },
  boostBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F6B733',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 3,
  },
  boostBadgeText: {
    fontSize: 9,
    fontFamily: 'Rubik-ExtraBold',
    color: '#420001',
    letterSpacing: 0.3,
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
    width: 28,
    height: 28,
    borderRadius: 14,
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

export default React.memo(ExploreProfileCard);
