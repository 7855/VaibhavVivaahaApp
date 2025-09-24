import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Heart, Calendar, Sparkles, Quote, Gem } from 'lucide-react-native';

const HappyStoryCard = ({
  coupleNames,
  story,
  marriageDate,
  partner1Image,
  partner2Image
}: {
  coupleNames: string;
  story: string;
  marriageDate: string;
  partner1Image: string;
  partner2Image: string;
}) => {
    const [partner1Name, partner2Name] = coupleNames.split(' & ');

    return (
        <View style={styles.cardContainer}>
            {/* Sparkle top right */}

            <View style={styles.gemIconPosition}>
            <Gem size={17} color="#FFFFFF" style={styles.gemIcon} />
            </View>
            <Sparkles size={20} color="#f43f5e" style={styles.sparkleIcon} />

            {/* Glow decoration */}
            <View style={styles.topLeftGlow} />

            <View style={styles.contentWrapper}>
                {/* Avatar side */}
                <View style={styles.avatarWrapper}>
                    {/* <View style={styles.avatarCircle}> */}
                        <View style={styles.avatarGroup}>
                            <View style={[styles.avatar, { backgroundColor: '#f43f5e' }]}>
                                {/* <Text style={styles.avatarText}>{coupleNames[0]?.[0] || 'A'}</Text> */}
                                <Image source={{ uri: partner1Image }} style={styles.avatarImage} />
                            </View>
                            <View style={[styles.avatar, { backgroundColor: '#ec4899' }]}>
                                {/* <Text style={styles.avatarText}>{coupleNames[1]?.[0] || 'B'}</Text> */}
                                <Image source={{ uri: partner2Image }} style={styles.avatarImage} />
                            </View>
                        </View>
                    {/* </View> */}

                    {/* Heart icon */}
                    <View style={styles.heartPulse}>
                        <Heart size={12} color="white" fill="white" />
                    </View>

                    {/* Badge */}
                    {/* <View style={styles.badge}>
                        <Text style={styles.badgeText}>Married</Text>
                    </View> */}
                </View>

                {/* Text Content */}
                <View style={styles.textWrapper}>
                    <Text style={styles.title}>{coupleNames}</Text>

                    <View style={styles.dateRow}>
                        <Calendar size={14} color="#f43f5e" />
                        <Text style={styles.dateText}>{marriageDate}</Text>
                    </View>

                    {/* <View style={styles.quoteWrapper}>
            <Quote size={12} color="#fda4af" style={styles.quoteIcon} />
            <Text style={styles.storyText} numberOfLines={3}>
              "{story.story}"
            </Text>
          </View> */}

                    {/* Rating & Label Row */}
                    {/* <View style={styles.ratingRow}> */}
                    {/* <View style={styles.heartsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  size={12}
                  color={i < 5 ? '#ef4444' : '#d1d5db'}
                  fill={i < 5 ? '#ef4444' : 'none'}
                />
              ))}
              <Text style={styles.matchText}>Perfect Match</Text>
            </View> */}

                    {/* <View style={styles.inspiringRow}>
              <Sparkles size={12} color="#facc15" />
              <Text style={styles.inspiringText}>Inspiring</Text>
            </View> */}
                    {/* </View> */}
                    <View>

                    </View>
                </View>

                <View style={styles.quoteWrapper}>
                    <Quote size={12} color="#fda4af" style={styles.quoteIcon} />
                    <Text style={styles.storyText} numberOfLines={4}>
                        "{story}"
                    </Text>
                </View>

                <View style={styles.ratingRow}>
                                        {/* Rating & Label Row */}
                    <View style={styles.ratingRow}>
                    <View style={styles.heartsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  size={12}
                  color={i < 5 ? '#ef4444' : '#d1d5db'}
                  fill={i < 5 ? '#ef4444' : 'none'}
                />
              ))}
              <Text style={styles.matchText}>Perfect Match</Text>
            </View>
           
        
                    </View>
                    
                </View>
                <View style={styles.inspiringRow}>
              <Sparkles size={12} color="#facc15" />
              <Text style={styles.inspiringText}>Inspiring</Text>
            </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        borderColor: 'rgba(30,64,175,1.00)',
        position: 'relative',
        overflow: 'hidden',
        width: 250,
        marginHorizontal: 8,
        marginBottom: 16,
      },
      
    sparkleIcon: {
        position: 'absolute',
        top: 6,
        right: 6,
        opacity: 0.25,
    },
    gemIcon:{
        // position: 'absolute',
        // top: 6,
        // right: 6,
    },
    topLeftGlow: {
        position: 'absolute',
        top: -8,
        left: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fda4af',
        opacity: 0.25,
    },
    contentWrapper: {
        // flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: 70,
    },
    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fde68a',
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarGroup: {
        flexDirection: 'row',
        // marginLeft: -4,
    },
    avatar: {
        width: 75,
        height: 75,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 5,
        borderColor: '#fff',
        marginHorizontal: -12,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
        resizeMode: 'cover',
    },
    heartPulse: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#ef4444',
        padding: 4,
        borderRadius: 10,
        elevation: 3,
    },
    gemIconPosition:{
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#ef4444',
        padding: 4,
        borderRadius: 999,
        elevation: 3,
    },
    badge: {
        position: 'absolute',
        bottom: -12,
        left: '50%',
        transform: [{ translateX: -30 }],
        backgroundColor: '#10b981',
        paddingVertical: 2,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '500',
    },
    textWrapper: {
        flex: 1,
        paddingLeft: 6,
        marginTop: 3
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    dateText: {
        color: '#6b7280',
        fontSize: 12,
    },
    quoteWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
        gap: 5,
        width: '100%'
    },
    quoteIcon: {
        marginTop: 3,
    },
    storyText: {
        color: '#374151',
        fontSize: 14,
        fontStyle: 'italic',
        flex: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    heartsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    matchText: {
        fontSize: 11,
        color: '#4b5563',
        marginLeft: 6,
    },
    inspiringRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    inspiringText: {
        fontSize: 11,
        color: '#6b7280',
    },
});

export default HappyStoryCard;
