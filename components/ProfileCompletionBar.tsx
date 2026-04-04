import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import userApi from '@/app/(root)/api/userApi';
import ProgressRing from './ProgressRing';

interface CompletionData {
  status: string;
  percentage: number;
  label: string;
}
interface MetaData {
  totalFields: number;
  completedFields: number;
  missingFields: string[];
}
interface NextAction {
  route: string;
  description: string;
  boostPercentage: number;
  title: string;
}
const ProfileCompletionBar = () => {
  const router = useRouter();
  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  useEffect(() => {
    const fetchProfileCompletion = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
        const response = await userApi.getProfileCompletion(userId);
        // console.log("profilerc", response?.data?.data.data);

        if (response?.data?.data) {
          const { completion, meta, nextAction } = response.data.data.data;
          setCompletion(completion);
          setMeta(meta);
          setNextAction(nextAction);
        }
      } catch (error) {
        console.error('Error fetching profile completion:', error);
      }
    };
    fetchProfileCompletion();
  }, []);
  if (!completion || !meta) {
    return null; // or a loading spinner
  }

  const titleOverrides: Record<string, string> = {
    'Add Number of siblings': 'Add No of Siblings',
  };

  const actionTitle = nextAction ?
    (titleOverrides[nextAction.title] ?? nextAction.title) :
    '';

  return (
    <View style={styles.container}>
      <View style={styles.widgetContainer}>
        <View style={styles.profileCompletionWidget}>
          <View style={styles.progressSection}>
            <View style={styles.progressRingContainer}>
              <ProgressRing
                percentage={completion.percentage}
                size={43}
                strokeWidth={4}
                color="#420001"
                bgColor="#e5e7eb"
              />
              <Text style={styles.progressText}>{completion.percentage}%</Text>
            </View>
            <View style={styles.progressInfo}>
              <View style={styles.progressLabel}>
                <Text style={styles.progressStatus}>{completion.status}</Text>
                <View style={styles.dot} />
                <Text style={styles.profileLabel}>Profile</Text>
              </View>
              <Text style={styles.completionText}>
                {meta.completedFields} of {meta.totalFields} completed
              </Text>
            </View>
          </View>
          {completion.percentage >= 100 ? (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>🎉 Profile Completed</Text>
            </View>
          ) : nextAction ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                const route = nextAction.route;
                if (route === '/(root)/(tabs)/profile') {
                  router.push({
                    pathname: route,
                    params: { tabIndex: 2 },
                  } as any);
                } else {
                  router.push(route as any);
                }
              }}
            >
              <Text style={styles.actionButtonText}>{actionTitle}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>+{nextAction.boostPercentage}%</Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  widgetContainer: {
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  profileCompletionWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressRingOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#e5e7eb',
  },
  progressRingInner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#420001', // Your primary color
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '0deg' }],
    transformOrigin: 'center',
  },
  progressRingContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#420001',
  },
  progressInfo: {
    justifyContent: 'center',
  },
  progressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#130001',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9ca3af',
  },
  profileLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  completionText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ebe0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(66, 0, 1, 0.2)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#420001',
  },
  badge: {
    backgroundColor: '#420001',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DADADA',
  },
  completedContainer: {
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
  },
  completedText: {
    color: '#166534',
    fontWeight: '500',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default React.memo(ProfileCompletionBar);