import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Grid3X3, Eye, Heart, MessageCircle, Users, Star, Bookmark } from 'lucide-react-native';
import { NotificationFilter } from './notification';

interface NotificationFilterProps {
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  counts: Record<NotificationFilter, number>;
}

const NotificationFilterComponent: React.FC<NotificationFilterProps> = ({ 
  activeFilter, 
  onFilterChange, 
  counts 
}) => {
  const filters = [
    { key: 'all' as NotificationFilter, label: 'All', icon: Grid3X3 },
    { key: 'profile_view' as NotificationFilter, label: 'Views', icon: Eye },
    { key: 'like' as NotificationFilter, label: 'Likes', icon: Heart },
    { key: 'message' as NotificationFilter, label: 'Messages', icon: MessageCircle },
    { key: 'match' as NotificationFilter, label: 'Matches', icon: Users },
    { key: 'interest' as NotificationFilter, label: 'Interests', icon: Star },
    { key: 'shortlist' as NotificationFilter, label: 'Shortlist', icon: Bookmark },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map(({ key, label, icon: Icon }) => {
          const isActive = activeFilter === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onFilterChange(key)}
              style={[
                styles.filterButton,
                isActive ? styles.activeButton : styles.inactiveButton,
              ]}
            >
              <Icon size={16} color={isActive ? '#fff' : '#4B5563'} />
              <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
              {counts[key] > 0 && (
                <View style={[styles.countBadge, isActive ? styles.activeCountBadge : styles.inactiveCountBadge]}>
                  <Text style={[styles.countText, isActive && { color: '#fff' }]}>
                    {counts[key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  activeButton: {
    backgroundColor: '#F43F5E',
    transform: [{ scale: 1.05 }],
  },
  inactiveButton: {
    backgroundColor: '#F9FAFB',
  },
  label: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 6,
  },
  activeLabel: {
    color: '#fff',
  },
  countBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  inactiveCountBadge: {
    backgroundColor: '#FECACA',
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B91C1C',
  },
});

export default NotificationFilterComponent;