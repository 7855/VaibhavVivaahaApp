import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscription } from '../app/(root)/contexts/subscriptionContext';
import { usePopup } from '../app/(root)/contexts/PopupContext';
import { buildUpgradeAction } from '../app/(root)/utils/upgradeNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 20) / 2 - 10; // 40 = 20 padding on each side, 10 = half the gap

const QuickAction = () => {
  const router = useRouter();
  const { subscriptionData } = useSubscription() || {};
  const popup = usePopup();

  const handleActionPress = (actionType: string) => {
    switch (actionType) {
      case 'Connections':
        router.push('/screens/ListUser?type=connection');
        break;
      case 'Star Match':
        if (!subscriptionData?.entitlements?.starMatch) {
          popup.premiumRequired(
            'Star Match is available from Classic plan onwards. Upgrade to discover your compatibility score!',
            buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Star Match', minPlan: 'Classic' })
          );
          return;
        }
        router.push('/(root)/screens/StarMatch');
        break;
      case 'Viewed You':
        if (!subscriptionData?.planTitle || subscriptionData.planTitle === 'Free') {
          popup.premiumRequired(
            'Upgrade to Starter or above to see who viewed your profile.',
            buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Who Viewed You', minPlan: 'Starter' })
          );
          return;
        }
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
                color="#1F7FE5"
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
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#162336',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: 'rgba(15,35,70,0.06)',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#dfecfb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: 'Rubik-Bold',
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    color: '#1e293b',
    flex: 1,
  },
});

export default React.memo(QuickAction);