import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
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
        imageStyle={styles.imageStyle}
      >
        {/* ⭐ Boosted badge at top-left */}
        {hasActiveBoost ? (
          <View style={styles.boostBadge}>
            <Text style={styles.boostBadgeText}>⭐ Boosted</Text>
          </View>
        ) : null}

        {/* Trust shield at top-right corner */}
        <View style={styles.shieldWrap}>
          <VerifiedBadges
            idVerified={idVerified}
            educationVerified={educationVerified}
            incomeVerified={incomeVerified}
            mode="compact"
            size="md"
          />
        </View>

        <View style={styles.gradient}>
          <Text style={styles.nameAge}>
            {name}, {age}
          </Text>
          <Text style={styles.job}>{job}</Text>
          <Text style={styles.job}>{location}</Text>
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
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    backgroundColor: '#000',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
    height: '100%',
  },
  imageStyle: {
    resizeMode: 'cover',
    height: '100%',
  },
  gradient: {
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  nameAge: { color: '#DADADA', fontSize: 16, fontWeight: '600' },
  job: { color: '#ccc', fontSize: 13, marginTop: 4 },
  interestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  interestTag: {
    backgroundColor: 'rgba(245,158,11,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  interestTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fef3c7',
  },
  boostBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(245,158,11,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 3,
  },
  boostBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  shieldWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default React.memo(ExploreProfileCard);
