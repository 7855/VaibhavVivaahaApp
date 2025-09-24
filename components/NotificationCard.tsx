import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, Heart, MessageCircle, Users, Star, Bookmark, Clock, MoreVertical } from 'lucide-react-native';
import { Notification } from './notification';
import AntDesign from 'react-native-vector-icons/AntDesign';
interface NotificationCardProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onMarkAsRead, onDelete }) => {
    const getIcon = () => {
        const iconProps = { size: 18, color: undefined };
        switch (notification.type.toLowerCase()) {
            case 'profile_view':
                return <Eye {...iconProps} color="#3B82F6" />;
            case 'like':
                return <Heart {...iconProps} color="#EF4444" />;
            case 'message':
                return <MessageCircle {...iconProps} color="#10B981" />;
            case 'match':
                return <Users {...iconProps} color="#8B5CF6" />;
            case 'interest':
                return <Star {...iconProps} color="#F59E0B" />;
            case 'shortlist':
                return <Bookmark {...iconProps} color="#6366F1" />;
            default:
                return <Eye {...iconProps} color="#9CA3AF" />;
        }
    };

    const getTimeAgo = (timestamp: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const getInitials = (name?: string) => {
        return name?.charAt(0).toUpperCase() || 'U';
    };

    return (
        <View style={[styles.card, !notification.isRead && styles.unreadCard]}>
            {!notification.isRead && (
                <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                </View>
            )}
            <View style={[styles.sideBar, !notification.isRead && styles.activeSideBar]} />
            <View style={styles.contentWrapper}>
                {/* Avatar */}
                <View style={styles.avatarWrapper}>
                    {notification.avatar ? (
                        <Image source={{ uri: notification.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarInitial}>{getInitials(notification.userName)}</Text>
                        </View>
                    )}
                    {/* <View style={styles.iconWrapper}>{getIcon()}</View> */}
                </View>

                {/* Content */}
                <View style={styles.contentBlock}>
                    <View style={styles.headerRow}>
                        <View style={styles.messageBlock}>
                            <Text style={[styles.title, !notification.isRead && styles.unreadText]}>{notification.title}</Text>
                            <Text style={[styles.message, !notification.isRead && styles.unreadSubText]}>
                                {notification.type !== 'match' && notification.userName ? `${notification.userName} ` : ''}
                                {notification.message}
                            </Text>
                            {notification.userName && (
                                <View style={styles.userInfo}>
                                    <Text style={styles.userInfoText}>{notification.userName}</Text>
                                    {notification.userAge && <Text style={styles.userInfoText}> • {notification.userAge} years</Text>}
                                    {notification.userLocation && <Text style={styles.userInfoText}> • {notification.userLocation}</Text>}
                                </View>
                            )}
                        </View>
                        {/* <View style={styles.actions}>
              <TouchableOpacity onPress={() => onMarkAsRead(notification.id)}>
                <View style={[styles.readDot, notification.isRead ? styles.readDotBorder : styles.readDotFill]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(notification.id)}>
                <MoreVertical size={14} color="#9CA3AF" />
              </TouchableOpacity>
            </View> */}

                    </View>
                    {/* <View style={styles.timestampWrapper}>
            <Clock size={10} color="#9CA3AF" />
            <Text style={styles.timestampText}>{getTimeAgo(notification.timestamp)}</Text>
          </View> */}
                    <View style={styles.bottomRow}>
                        {/* Left side: Icon + timestamp */}
                        <View style={styles.leftInfo}>
                            <View style={styles.iconWrapper}>{getIcon()}</View>
                            <View style={styles.timestampWrapper}>
                                <Clock size={10} color="#9CA3AF" />
                                <Text style={styles.timestampText}>{getTimeAgo(notification.timestamp)}</Text>
                            </View>
                        </View>

                        {/* Right side: Delete icon */}
                        <TouchableOpacity onPress={() => onDelete(notification.id)} style={styles.deleteButton}>
                            <AntDesign name="delete" size={15} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        position: 'relative',
        overflow: 'hidden',
        elevation: 1,
    },
    unreadCard: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sideBar: {
        width: 4,
        backgroundColor: 'transparent',
    },
    activeSideBar: {
        backgroundColor: '#EC4899',
    },
    contentWrapper: {
        flex: 1,
        flexDirection: 'row',
        padding: 12,
    },
    avatarWrapper: {
        marginRight: 12,
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    avatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F43F5E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    iconWrapper: {

        backgroundColor: 'white',
        padding: 2,
        borderRadius: 999,
        elevation: 1,
        marginRight: 8,
    },
    contentBlock: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    messageBlock: {
        flex: 1,
        paddingRight: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    unreadText: {
        color: '#111827',
    },
    message: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    unreadSubText: {
        color: '#374151',
    },
    userInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    userInfoText: {
        fontSize: 12,
        color: '#6B7280',
        marginRight: 4,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    readDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    readDotFill: {
        backgroundColor: '#3B82F6',
    },
    readDotBorder: {
        borderWidth: 2,
        borderColor: '#3B82F6',
        backgroundColor: 'transparent',
    },
    timestampWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timestampText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    newBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#F43F5E',
        paddingHorizontal: 10,
        paddingVertical: 5,
        // borderRadius: 999,
        borderBottomLeftRadius:999,
        zIndex: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },

    deleteButton: {
        padding: 6,
        borderRadius: '50%',
        backgroundColor: '#F97316',
    },

    leftInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },

});

export default NotificationCard;
