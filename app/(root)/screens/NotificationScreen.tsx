import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, FlatList } from 'react-native';
import NotificationHeader from '../../../components/NotificationHeader';
import NotificationFilterComponent from '../../../components/NotificationFilter';
import NotificationCard from '../../../components/NotificationCard';
import { Notification, NotificationFilter } from '../../../components/notification';
import userApi from '../api/userApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationScreen: React.FC = () => {
//   const mockNotifications: Notification[] = [
//     {
//       id: '1',
//       type: 'like',
//       title: 'New Like Received',
//       message: 'Priya liked your profile and wants to connect with you.',
//       timestamp: new Date(Date.now() - 5 * 60 * 1000),
//       isRead: false,
//       avatar: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg',
//       userName: 'Priya Sharma',
//       userAge: 26,
//       userLocation: 'Mumbai',
//     },
//     {
//       id: '2',
//       type: 'profile_view',
//       title: 'Profile View',
//       message: 'Rahul viewed your profile today.',
//       timestamp: new Date(Date.now() - 30 * 60 * 1000),
//       isRead: false,
//       avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg',
//       userName: 'Rahul Patel',
//       userAge: 29,
//       userLocation: 'Delhi',
//     },
//     {
//       id: '3',
//       type: 'match',
//       title: 'New Match Found!',
//       message: 'You and Anjali have been matched based on your preferences.',
//       timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
//       isRead: false,
//       avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
//       userName: 'Anjali Gupta',
//       userAge: 24,
//       userLocation: 'Bangalore',
//     },
//     {
//       id: '4',
//       type: 'message',
//       title: 'New Message',
//       message: 'Vikram sent you a message: "Hi! I found your profile interesting..."',
//       timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
//       isRead: true,
//       avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
//       userName: 'Vikram Singh',
//       userAge: 31,
//       userLocation: 'Pune',
//     },
//     {
//       id: '5',
//       type: 'interest',
//       title: 'Interest Expressed',
//       message: 'Kavya expressed interest in your profile.',
//       timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
//       isRead: true,
//       avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
//       userName: 'Kavya Reddy',
//       userAge: 27,
//       userLocation: 'Hyderabad',
//     },
//     {
//       id: '6',
//       type: 'shortlist',
//       title: 'Added to Shortlist',
//       message: 'Arjun added you to their shortlist.',
//       timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
//       isRead: true,
//       avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg',
//       userName: 'Arjun Kumar',
//       userAge: 28,
//       userLocation: 'Chennai',
//     },
//     {
//       id: '7',
//       type: 'profile_view',
//       title: 'Profile View',
//       message: 'Neha viewed your profile.',
//       timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
//       isRead: true,
//       avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
//       userName: 'Neha Agarwal',
//       userAge: 25,
//       userLocation: 'Kolkata',
//     },
//     {
//       id: '8',
//       type: 'like',
//       title: 'New Like Received',
//       message: 'Sanjay liked your profile.',
//       timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
//       isRead: true,
//       avatar: 'https://images.pexels.com/photos/1310522/pexels-photo-1310522.jpeg',
//       userName: 'Sanjay Mehta',
//       userAge: 30,
//       userLocation: 'Ahmedabad',
//     },
//   ];

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        console.log("userId ===========================>",userId);
        const response = await userApi.getAllNotifications(userId);
        const rawData = response?.data?.data || [];
        // console.log("rawData ===========================>",rawData);
        
        const formattedData = rawData.map((item: any) => ({
            id: item.notificationId, // use the correct key
            type: item.notificationCategory,
            title: item.title,
            message: item.message,
            timestamp: new Date(item.timestamp),
            isRead: item.isRead == 'Y' ? true : false,
            avatar: item.avatar,
            userName: item.userName,
            userAge: item.userAge,
            userLocation: item.userLocation,
          }));

          console.log("formattedData ===========================>",formattedData);
          
        setNotifications(formattedData);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  const handleClearAllNotifications = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await userApi.deleteAllNotificationsByReceiverId(userId);
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await userApi.markAllAsReadByReceiverId(userId);
      const updatedNotifications = notifications.map(n => ({
        ...n,
        isRead: true
      }));
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.type.toLowerCase() === activeFilter.toLowerCase());
  }, [notifications, activeFilter]);

  const notificationCounts = useMemo(() => {
    const counts: Record<NotificationFilter, number> = {
      all: notifications.filter((n) => n.isRead === false).length,
      like: 0,
      profile_view: 0,
      match: 0,
      message: 0,
      interest: 0,
      shortlist: 0,
    };
    notifications.forEach((n) => {
      const normalizedType = n.type?.toLowerCase() as NotificationFilter;
      if (counts[normalizedType] !== undefined && n.isRead === false) {
        counts[normalizedType]++;
      }
    });
    return counts;
  }, [notifications]);
  

  const unreadCount = notifications.filter((n) => n.isRead === false).length;

  const handleMarkAsRead = async (id: string) => {
    try {
        console.log("handleMarkAsRead ===========================>",id);
      const userId = await AsyncStorage.getItem('userId');
      const notification = notifications.find(n => n.id === id);
      if (notification) {
        await userApi.markAsRead(notification.id, userId);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id);
      if (notification) {
        await userApi.deleteNotification(notification.id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await userApi.deleteAllNotificationsByReceiverId(userId);
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <View style={styles.container}>
      <NotificationHeader
        unreadCount={notificationCounts.all}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAllNotifications}
      />
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            <NotificationFilterComponent
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={notificationCounts}
            />
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyMessage}>
              {activeFilter === 'all'
                ? "You're all caught up! No new notifications at the moment."
                : `No ${activeFilter.replace('_', ' ')} notifications found.`}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
            <View style={{paddingHorizontal: 8}}>

          <NotificationCard
            notification={item}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
          </View>
        )}
        contentContainerStyle={styles.content}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1F2',
  },
  content: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 48,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#E5E7EB',
    borderRadius: 24,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default NotificationScreen;
