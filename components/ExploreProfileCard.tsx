import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import VerifiedBadges from './VerifiedBadges';

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
}

const ExploreProfileCard: React.FC<ExploreProfileCardProps> = ({
  imageUrl, name, age, job, location, gender,
  idVerified, educationVerified, incomeVerified,
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
        {/* Trust shield at bottom-right corner */}
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
  shieldWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default React.memo(ExploreProfileCard);
