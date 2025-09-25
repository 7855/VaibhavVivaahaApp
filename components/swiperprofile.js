import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { Card } from 'react-native-elements'; // Ensure correct import
import { TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window'); // Get device width for responsive design

const styles = StyleSheet.create({
  carouselContainer: {
    paddingLeft: 0,  // Remove left padding
    paddingRight: 0, // Remove right padding
  },
  card: {
    width:'100%',
    margin: 5,
    padding: 0,
    borderWidth: 0, // Remove card border
    shadowColor: 'transparent', // Remove shadow
  },
  user: {
    position: 'relative', // Allows text to overlay the image
  },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background for text
    paddingVertical: 5,
    alignItems: 'center',
    borderTopEndRadius: 10,
    borderTopStartRadius: 10,
    width: 125,

  },
  userText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    marginVertical: 4,
    textAlign: 'center',
    lineHeight:17
  },
  nearyouImage: {
    height: 150,
    width: 125,
    borderRadius: 10, // Rounded corners for the image
  },
});
const SwiperProfile = ({ users, onUserPress }) => {
  const safeUsers = users || [];


  const renderCarouselItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleCardPress(item.userId)}>
      <Card containerStyle={[styles.card, { borderRadius: 8 }]}>
        <View style={styles.user}>
          <Image style={styles.nearyouImage} source={{ uri: item.profileImage }} />
          <View style={[styles.textOverlay, { borderRadius: 8 }]}>
            <Text style={styles.userText}>{item.firstName} {item.lastName} , {item.age} , {item.location}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const handleCardPress = (userId) => {
    console.log('Clicked userId:', userId);
    if (onUserPress) {
      onUserPress(userId); // Optional callback to parent
    }
  };

  return (
    <Carousel
      data={safeUsers}
      renderItem={renderCarouselItem}
      sliderWidth={width}
      itemWidth={125}
      inactiveSlideScale={1}
      inactiveSlideOpacity={1}
      containerCustomStyle={styles.carouselContainer}
      contentContainerCustomStyle={{
        paddingLeft: 0,
        paddingRight: 0,
        gap: 3,
      }}
    />
  );
};

export default SwiperProfile;
