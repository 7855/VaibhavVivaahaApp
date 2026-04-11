import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUserData } from '../contexts/UserDataContext';
import userApi from '../api/userApi';

type ServiceRequest = {
  id: number;
  requestType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
  note?: string;
  createdAt?: string;
};

const TYPE_LABELS: Record<string, string> = {
  VOICE_CALL: 'In-App Voice Call',
  VIDEO_PROFILE: 'Video Profile (30s)',
  FAMILY_LOGIN: 'Family / Parent Login',
  SPEAK_FAMILY: 'Speak With Families',
  DEDICATED_RM: 'Dedicated Relationship Manager',
  FAMILY_ASSISTED_MATCH: 'Family Assisted Matchmaking',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  DONE: '#10b981',
  REJECTED: '#ef4444',
};

const MyRequestsScreen = () => {
  const { userData } = useUserData();
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (!userData.userId) return;
      const res = await userApi.getMyServiceRequests(userData.userId);
      if (res.data.code === 200) {
        setData(res.data.data || []);
        setError(null);
      } else {
        setError(res.data.message || 'No requests yet');
      }
    } catch (e: any) {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userData.userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#9c4040" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Service Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      {error && data.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>
                  {TYPE_LABELS[item.requestType] || item.requestType}
                </Text>
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: STATUS_COLORS[item.status] || '#6b7280' },
                  ]}
                >
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
              {item.createdAt ? (
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 12, color: '#6b7280', fontSize: 15, textAlign: 'center' },
  card: {
    backgroundColor: '#fafafa',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111', flex: 1 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  note: { marginTop: 6, color: '#4b5563', fontSize: 13 },
  date: { marginTop: 6, color: '#9ca3af', fontSize: 11 },
});

export default MyRequestsScreen;
