import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscription } from '../app/(root)/contexts/subscriptionContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 20) / 2 - 10; // 40 = 20 padding on each side, 10 = half the gap

const QuickAction = () => {
  const router = useRouter();
  const { subscriptionData } = useSubscription() || {};

  const handleActionPress = (actionType: string) => {
    switch (actionType) {
      case 'Connections':
        router.push('/screens/ListUser?type=connection');
        break;
      case 'Star Match':
        if (!subscriptionData?.planTitle || subscriptionData.planTitle === 'Free') {
          Alert.alert(
            'Unlock Star Match ⭐',
            'Star Match is a premium feature! Upgrade your plan to discover your compatibility score and find your perfect match.',
            [
              { text: 'Maybe Later', style: 'cancel' },
              { text: 'Upgrade Now', onPress: () => router.push('/(root)/screens/PremiumTab') }
            ]
          );
          return;
        }
        router.push('/(root)/screens/StarMatch');
        break;
      case 'Viewed You':
        router.push('/screens/ListUser?type=viewed');
        break;
      case 'Shortlisted':
        router.push('/screens/ListUser?type=shortlisted');
        break;
      default:
        console.log('No route defined for:', actionType);
    }
  };
  const actions = [
    {
      icon: 'link',
      label: 'Connections',
      notificationCount: 3
    },
    {
      icon: 'auto-awesome',
      label: 'Star Match'
    },
    {
      icon: 'visibility',
      label: 'Viewed You',
      notificationCount: 12
    },
    {
      icon: 'star-rate',
      label: 'Shortlisted',
      notificationCount: 5
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Actions</Text>
      </View>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            onPress={() => handleActionPress(action.label)}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={action.icon as any}
                size={20}
                color="#420001"
              />
              {/* {action.notificationCount && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{action.notificationCount}</Text>
                </View>
              )} */}
            </View>
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    marginTop: 7,
    marginBottom: 20,

  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#420001', // slate-400
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ebe0e0',
    borderWidth: 1,
    borderColor: 'rgba(66, 0, 1, 0.05)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#420001',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#DADADA',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#130001', // slate-800
    flex: 1,
  },
});

export default React.memo(QuickAction);