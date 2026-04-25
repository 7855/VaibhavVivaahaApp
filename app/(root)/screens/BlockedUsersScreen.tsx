import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import userApi from '../api/userApi';
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';

type BlockedRow = {
  id: number;
  blockedUserId: number;
  blockedAt?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  mobile?: string;
};

const BlockedUsersScreen = () => {
  const { userData } = useUserData();
  const popup = usePopup();
  const [data, setData] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      if (!userData.userId) return;
      const res = await userApi.getMyBlockedUsers(userData.userId);
      if (res?.data?.code === 200) {
        setData(res.data.data || []);
      } else {
        setData([]);
      }
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userData.userId]);

  useEffect(() => { load(); }, [load]);

  const handleUnblock = (row: BlockedRow) => {
    const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || `User ${row.blockedUserId}`;
    popup.confirm(
      'Unblock this user?',
      `${name} will be able to see your profile, message you, and send you interest requests again.`,
      async () => {
        setUnblockingId(row.id);
        try {
          const res = await userApi.deleteBlockedUser(row.id);
          if (res?.data?.code === 200) {
            popup.success('Unblocked', `${name} has been unblocked.`);
            load();
          } else {
            popup.error('Could not unblock', res?.data?.message || 'Please try again.');
          }
        } catch (e) {
          popup.error('Could not unblock', 'Network error. Please try again.');
        } finally {
          setUnblockingId(null);
        }
      },
      'Unblock',
      'Cancel'
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#d0dfeb' }} edges={['top']}>
    <LinearGradient colors={['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa']} locations={[0, 0.3, 0.6, 1.0]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: 'rgba(15,35,70,0.06)', shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          <MaterialIcons name="chevron-left" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>
        People you've blocked can't view your profile, message you, or send you interest requests.
      </Text>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#9c4040" /></View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="ban" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>You haven't blocked anyone</Text>
          <Text style={styles.emptySub}>Blocked users will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
            />
          }
          renderItem={({ item }) => {
            const name = [item.firstName, item.lastName].filter(Boolean).join(' ') || `User ${item.blockedUserId}`;
            return (
              <View style={styles.card}>
                <Image
                  source={item.profileImage
                    ? { uri: item.profileImage }
                    : require('../../../assets/images/defaultAvatar.png')}
                  style={styles.avatar}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{name}</Text>
                  {item.blockedAt ? (
                    <Text style={styles.meta}>Blocked on {new Date(item.blockedAt).toLocaleDateString()}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  disabled={unblockingId === item.id}
                  onPress={() => handleUnblock(item)}
                  style={[styles.unblockBtn, unblockingId === item.id && { opacity: 0.5 }]}
                >
                  {unblockingId === item.id
                    ? <ActivityIndicator size="small" color="#9c4040" />
                    : <Text style={styles.unblockText}>Unblock</Text>}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0f1724' },
  subtitle: { fontSize: 13, color: '#6b7280', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, lineHeight: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 12, fontSize: 15, fontWeight: '600', color: '#111' },
  emptySub: { marginTop: 6, fontSize: 12, color: '#6b7280' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fafafa', padding: 12, borderRadius: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e5e7eb' },
  name: { fontSize: 14, fontWeight: '600', color: '#111' },
  meta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#9c4040',
  },
  unblockText: { color: '#9c4040', fontSize: 12, fontWeight: '700' },
});

export default BlockedUsersScreen;
