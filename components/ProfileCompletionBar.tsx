import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { User, Crown, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';

interface ProfileCompletionBarProps {
  percentage: number;
  isPremium?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileCompletionBar({ 
  percentage, 
  isPremium = false 
}: ProfileCompletionBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered animations for premium feel
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: percentage,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // Sparkle animation for completed profiles
    if (percentage === 100) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [percentage]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const getCompletionData = () => {
    if (percentage < 25) return {
      message: '✨ Your Perfect Match Awaits',
      subMessage: 'Complete your profile to unlock destiny',
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      icon: User
    };
    if (percentage < 50) return {
      message: '💫 Love Story in Progress',
      subMessage: 'Add more magic to attract your soulmate',
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      icon: User
    };
    if (percentage < 75) return {
      message: '🌟 Almost Ready to Sparkle',
      subMessage: 'Your dream partner is just steps away',
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      icon: Crown
    };
    if (percentage < 100) return {
      message: '👑 Royal Profile in Making',
      subMessage: 'Final touches for your fairy tale beginning',
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      icon: Crown
    };
    return {
      message: '💎 Profile Perfection Achieved',
      subMessage: 'Ready to meet your destined partner',
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      icon: Sparkles
    };
  };

  const getCatchyGreeting = () => {
    if (!isPremium && percentage < 100) {
      return {
        greeting: '🔥 Upgrade to Premium',
        subtitle: `'${Math.round(percentage)}% Journey Complete'`,
        showProgressBar: false
      };
    }
    
    const greetings = [
      { greeting: '✨ Profile Spotlight', subtitle: `${Math.round(percentage)}% Journey Complete`, showProgressBar: false },
    //   { greeting: '✨ Matrimony Magic', subtitle: `${Math.round(percentage)}% Profile Power`, showProgressBar: false },
    //   { greeting: '🌹 Love Compass', subtitle: `${Math.round(percentage)}% Ready for Love`, showProgressBar: false },
    //   { greeting: '💫 Destiny Tracker', subtitle: `${Math.round(percentage)}% Path to Happiness`, showProgressBar: true },
      { greeting: '👑 Royal Progress', subtitle: `${Math.round(percentage)}% Crown Jewels`, showProgressBar: false }
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  };
  const completionData = getCompletionData();
  const greetingData = getCatchyGreeting();
  const IconComponent = completionData.icon;
  const handleUpgradePress = () => {
    console.log("Upgrade Pressed");
    router.push('/(root)/screens/PremiumTab');
  };
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor: completionData.bgColor,
          borderColor: completionData.color + '20',
          height:78,
        }
      ]}
    >
      {/* Decorative gradient overlay */}
      <View style={[styles.gradientOverlay, { backgroundColor: completionData.color + '05' }]} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View style={[styles.iconContainer, { backgroundColor: completionData.color + '15' }]}>
            <IconComponent size={16} color={completionData.color} strokeWidth={2.5} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{greetingData.greeting}</Text>
            <Text style={[styles.percentage, { color: !isPremium && percentage < 100 ? '#FF6B00' : completionData.color }]}>
              {greetingData.subtitle}
            </Text>
          </View>
        </View>
        
        {percentage === 100 && (
          <Animated.View style={{ opacity: sparkleAnim }}>
            <Sparkles size={20} color="#FFD700" strokeWidth={2} />
          </Animated.View>
        )}
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: progressWidth,
                  backgroundColor: completionData.color,
                  shadowColor: completionData.color,
                }
              ]}
            >
              {/* Shimmer effect */}
              <View style={styles.shimmer} />
            </Animated.View>
          </View>
          
          {/* Progress indicators */}
          <View style={styles.indicators}>
            {[25, 50, 75, 100].map((mark, index) => (
              <View 
                key={mark}
                style={[
                  styles.indicator,
                  { 
                    backgroundColor: percentage >= mark ? completionData.color : '#E0E0E0',
                    transform: [{ scale: percentage >= mark ? 1.2 : 1 }]
                  }
                ]} 
              />
            ))}
          </View>
        </View>
      </View>

      {/* Message Section */}
      <View style={styles.messageSection}>
        <Text style={[styles.mainMessage, { color: completionData.color }]}>
          {completionData.message}
        </Text>
        {/* <Text style={styles.subMessage}>
          {completionData.subMessage}
        </Text> */}
      </View>

      {/* Premium badge for completed profiles */}
      {(percentage === 100 || isPremium) && (
        <View style={styles.premiumBadge}>
          <Crown size={12} color="#FFD700" strokeWidth={2} />
          <Text style={styles.premiumText}>
            {isPremium ? 'Premium Member' : 'Premium Profile'}
          </Text>
          {greetingData.showProgressBar && (
            <View style={styles.miniProgressContainer}>
              <View style={styles.miniProgressTrack}>
                <Animated.View 
                  style={[
                    styles.miniProgressFill,
                    { 
                      width: progressWidth,
                      backgroundColor: completionData.color,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.miniProgressText, { color: completionData.color }]}>
                {Math.round(percentage)}%
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Upgrade prompt for non-premium users */}
      {!isPremium && percentage < 100 && (
      <TouchableOpacity 
      style={styles.upgradeBadge}
      onPress={handleUpgradePress}
    >
      <Text style={styles.upgradeBadgeText}>⚡ Upgrade</Text>
    </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 1,
  },
  percentage: {
    fontSize: 10,
    fontWeight: '600',
    // letterSpacing: 0.3,
    marginTop:1
  },
  progressSection: {
    marginBottom: 8,
    zIndex: 1,
  },
  progressContainer: {
    position: 'relative',
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 4,
    overflow: 'hidden',
    // shadowInset: '0 1px 3px rgba(0,0,0,0.1)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    position: 'relative',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    paddingHorizontal: 2,
  },
  indicator: {
    width: 4,
    height: 10,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  messageSection: {
    zIndex: 1,
  },
  mainMessage: {
    fontSize: 10,
    fontWeight: '600',
    // marginBottom: 2,
    // lineHeight: 10,
  },
  subMessage: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
    lineHeight: 13,
    fontStyle: 'italic',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth:1,
    borderColor:'#FFD700'
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#B8860B',
    marginLeft: 3,
    letterSpacing: 0.3,

  },
  upgradePrompt: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  upgradeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  miniProgressContainer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  miniProgressText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // premiumBadge: {
  //   position: 'absolute',
  //   top: 8,
  //   right: 12,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor: 'rgba(255, 215, 0, 0.15)',
  //   paddingHorizontal: 6,
  //   paddingVertical: 2,
  //   borderRadius: 8,
  //   borderWidth:1,
  //   borderColor:'#FFD700'
  // },
  // premiumText: {
  //   fontSize: 9,
  //   fontWeight: '600',
  //   color: '#B8860B',
  //   marginLeft: 3,
  //   letterSpacing: 0.3,
  // },
  upgradeBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B00',
    zIndex: 2,
  },
  upgradeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B00',
    marginLeft: 3,
    letterSpacing: 0.3,
  },
});