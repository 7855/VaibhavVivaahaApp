import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonCardProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
    width = '100%',
    height = 100,
    borderRadius = 8,
    style,
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: '#E1E9EE',
                    opacity,
                },
                style,
            ]}
        />
    );
};

// Pre-built skeleton layouts for common screens
export const ProfileSkeleton = () => (
    <View style={skeletonStyles.container}>
        {/* Avatar */}
        <View style={skeletonStyles.avatarRow}>
            <SkeletonCard width={100} height={100} borderRadius={50} />
            <View style={skeletonStyles.avatarInfo}>
                <SkeletonCard width="70%" height={20} />
                <SkeletonCard width="50%" height={16} style={{ marginTop: 8 }} />
            </View>
        </View>
        {/* Stats row */}
        <View style={skeletonStyles.statsRow}>
            <SkeletonCard width="30%" height={50} />
            <SkeletonCard width="30%" height={50} />
            <SkeletonCard width="30%" height={50} />
        </View>
        {/* Tab content */}
        <SkeletonCard height={40} style={{ marginTop: 16 }} />
        <SkeletonCard height={60} style={{ marginTop: 12 }} />
        <SkeletonCard height={60} style={{ marginTop: 12 }} />
        <SkeletonCard height={60} style={{ marginTop: 12 }} />
    </View>
);

export const CardListSkeleton = ({ count = 3 }: { count?: number }) => (
    <View style={skeletonStyles.container}>
        {Array.from({ length: count }).map((_, i) => (
            <View key={i} style={skeletonStyles.cardRow}>
                <SkeletonCard width={80} height={80} borderRadius={12} />
                <View style={skeletonStyles.cardInfo}>
                    <SkeletonCard width="60%" height={18} />
                    <SkeletonCard width="80%" height={14} style={{ marginTop: 6 }} />
                    <SkeletonCard width="40%" height={14} style={{ marginTop: 6 }} />
                </View>
            </View>
        ))}
    </View>
);

export const HomeSkeleton = () => (
    <View style={skeletonStyles.container}>
        {/* Welcome bar */}
        <SkeletonCard height={70} borderRadius={35} />
        {/* Connection stats */}
        <View style={skeletonStyles.statsRow}>
            <SkeletonCard width="23%" height={70} borderRadius={12} />
            <SkeletonCard width="23%" height={70} borderRadius={12} />
            <SkeletonCard width="23%" height={70} borderRadius={12} />
            <SkeletonCard width="23%" height={70} borderRadius={12} />
        </View>
        {/* Section title */}
        <SkeletonCard width="50%" height={20} style={{ marginTop: 16 }} />
        {/* Carousel */}
        <View style={[skeletonStyles.statsRow, { marginTop: 12 }]}>
            <SkeletonCard width={125} height={150} borderRadius={10} />
            <SkeletonCard width={125} height={150} borderRadius={10} />
            <SkeletonCard width={125} height={150} borderRadius={10} />
        </View>
        {/* Section title */}
        <SkeletonCard width="50%" height={20} style={{ marginTop: 16 }} />
        {/* Cards */}
        <View style={[skeletonStyles.statsRow, { marginTop: 12 }]}>
            <SkeletonCard width={125} height={150} borderRadius={10} />
            <SkeletonCard width={125} height={150} borderRadius={10} />
            <SkeletonCard width={125} height={150} borderRadius={10} />
        </View>
    </View>
);

const skeletonStyles = StyleSheet.create({
    container: {
        padding: 16,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarInfo: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 8,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
    },
    cardInfo: {
        flex: 1,
    },
});

export default React.memo(SkeletonCard);
