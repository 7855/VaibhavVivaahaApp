import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { Card } from 'react-native-elements'; // Ensure correct import
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../app/(root)/contexts/subscriptionContext';
import VerifiedBadges from './VerifiedBadges';

const { width } = Dimensions.get('window'); // Get device width for responsive design

const styles = StyleSheet.create({
  carouselContainer: {
    paddingLeft: 0,  // Remove left padding
    paddingRight: 0, // Remove right padding
  },
  card: {
    width: '100%',
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
    color: '#DADADA',
    fontSize: 11,
    fontWeight: 'bold',
    marginVertical: 4,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 1
  },
  nearyouImage: {
    height: 150,
    width: 125,
    borderRadius: 10, // Rounded corners for the image
  },
  blurOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 125,
    height: 150,
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 2,
  },
});

const PLAN_BADGE_COLORS = {
  Silver: '#9ca3af',
  Gold: '#d4a017',
  Platinum: '#7c3aed',
};

const SwiperProfile = ({ users, onUserPress }) => {
  const safeUsers = users || [];
  const { subscriptionData } = useSubscription();
  const viewerPlan = subscriptionData?.planTitle || 'Free';
  const isFreeViewer = viewerPlan === 'Free';

  const renderCarouselItem = ({ item }) => {
    const profilePlan = item.subscriptionTitle;
    const badgeColor = PLAN_BADGE_COLORS[profilePlan];
    const isVerified = profilePlan === 'Silver' || profilePlan === 'Gold' || profilePlan === 'Platinum';

    return (
    <TouchableOpacity onPress={() => handleCardPress(item.userId)}>
      <Card containerStyle={[styles.card, { borderRadius: 8 }]}>
        <View style={styles.user}>
          <Image style={styles.nearyouImage} source={item.profileImage ? { uri: item.profileImage } :
            item.gender === 'M' ? require('../assets/images/avatarMen.png') :
              item.gender === 'F' ? require('../assets/images/avatarWomen.png') :
                require('../assets/images/defaultAvatar.png')} />
          {/* Blur removed — Free users can see carousel photos */}
          {badgeColor ? (
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              {isVerified ? <Ionicons name="checkmark-circle" size={10} color="#fff" /> : null}
              <Text style={styles.badgeText}>{profilePlan?.toUpperCase()}</Text>
            </View>
          ) : null}
          {/* Trust shield — top-right corner with catchy gold color */}
          <View style={{ position: 'absolute', top: 6, right: 6 }}>
            <VerifiedBadges
              idVerified={item.idVerified}
              educationVerified={item.educationVerified}
              incomeVerified={item.incomeVerified}
              mode="compact"
              size="sm"
              color="gold"
            />
          </View>
          <View style={[styles.textOverlay, { borderRadius: 8 }]}>
            <Text style={styles.userText}>{item.firstName} {item.lastName} , {item.age} , {item.location}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
    );
  };

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

export default React.memo(SwiperProfile);
