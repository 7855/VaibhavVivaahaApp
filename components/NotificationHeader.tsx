import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Check, Trash2, Settings } from 'lucide-react-native';

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  onMarkAllAsRead,
  onClearAll,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.bellWrapper}>
          <Bell size={28} color="#F43F5E" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {unreadCount === 0
              ? 'All caught up!'
              : `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={onMarkAllAsRead} style={styles.readButton}>
            <Check size={14} color="#2563EB" />
            <Text style={styles.readText}>Read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onClearAll} style={styles.clearButton}>
          <Trash2 size={14} color="#4B5563" />
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={styles.settingsButton}>
          <Settings size={18} color="#9CA3AF" />
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 13,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  bellWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readButton: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    alignItems: 'center',
  },
  readText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 4,
  },
  clearButton: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    alignItems: 'center',
  },
  clearText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 4,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
  },
});

export default NotificationHeader;
