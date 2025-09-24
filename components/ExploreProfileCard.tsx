import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';

interface ExploreProfileCardProps {
  imageUrl: string;
  name: string;
  age: number;
  job: string;
  location: string;
}

const ExploreProfileCard: React.FC<ExploreProfileCardProps> = ({ imageUrl, name, age, job, location }) => {
  return (
    <View style={styles.card}>
      <ImageBackground source={{ uri: imageUrl }} style={styles.image} imageStyle={styles.imageStyle}>
        <View style={styles.gradient}>
          <Text style={styles.nameAge}>{name}, {age}</Text>
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
    height: 280, // Fixed height for consistent appearance
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    backgroundColor: '#000',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
    height: '100%', // Ensure image takes full height
  },
  imageStyle: {
    resizeMode: 'cover',
    height: '100%', // Ensure image covers the full height
  },
  gradient: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  nameAge: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  job: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
});

export default ExploreProfileCard;
