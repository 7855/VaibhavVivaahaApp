import React, { useEffect, useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeBaseProvider, Box, Text as NBText, HStack, VStack, Spacer, Avatar } from 'native-base';
// import { useNavigation } from '@react-navigation/native';
import userApi from '../api/userApi';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as dayjs from 'dayjs';
import { router } from 'expo-router';

interface ShortlistedProfile {
    userId: number;
    firstName: string;
    lastName: string;
    profileImage: string;
    age: number;
    annualIncome: string;
    degree: string;
    location: string;
    occupation: string;
    shortlistedId: number;
    interestId?: number;
}

interface ViewedProfile {
    userId: number;
    firstName: string;
    lastName: string;
    profileImage: string;
    age: number;
    annualIncome: string;
    degree: string;
    email: string;
    gender: string;
    location: string;
    memberId: string;
    mobile: string;
    occupation: string;
    viewedAt: string;
}

export default function ListUser() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<ShortlistedProfile[] | ViewedProfile[]>([]);
    const [type, setType] = useState('viewed');
    const { type: urlType } = useLocalSearchParams();
    useEffect(() => {
        if (typeof urlType === 'string') {
            setType(urlType);
        }
    }, [urlType]);
    // const navigation = useNavigation();

    const loadProfileData = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                setError('User ID not found');
                return;
            }

            setLoading(true);
            if (type === 'viewed') {
                const response = await userApi.getProfileViewers(userId);
                if (response.data.code === 200) {
                    setData(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to load viewers');
                }
            } else if (type === 'connection') {
                const response = await userApi.getAcceptedInterestRequests(userId);
                if (response.data.code === 200) {
                    setData(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to load connections');
                }
            } else {
                const response = await userApi.getShortlistedMailbox(userId);
                if (response.data.code === 200) {
                    setData(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to load shortlisted profiles');
                }
            }
        } catch (e) {
            console.error('Error:', e);
            setError('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (shortlistedId: number) => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                console.error('No user ID found');
                return;
            }

            const response = await userApi.deleteShortlistedProfile(shortlistedId);
            if (response.data.code === 200) {
                setData(prev =>
                    (prev as ShortlistedProfile[]).filter(member => member.shortlistedId !== shortlistedId)
                );
            }
        } catch (error) {
            console.error('Error removing user:', error);
        }
    };

    useEffect(() => {
        loadProfileData();
    }, [type]);

    const renderItem = ({ item }: { item: ShortlistedProfile | ViewedProfile }) => {
        return (
            <Box
                borderBottomWidth="1"
                borderColor="coolGray.200"
                pl="4"
                pr="5"
                py="2"
                backgroundColor="white"
            >
                <HStack space={3} justifyContent="space-between" alignItems="center">
                    {/* Avatar */}
                    <Avatar
                        size="50px"
                        source={{
                            uri: item.profileImage || 'https://via.placeholder.com/150',
                        }}
                    />

                    {/* User Info */}
                    <VStack flex={1} justifyContent="center">
                        <NBText bold fontSize="md">
                            {item.firstName} {item.lastName}
                        </NBText>
                        <NBText fontSize="sm" color="gray.500">
                            {(item as ShortlistedProfile).age} years, {(item as ShortlistedProfile).location}
                        </NBText>
                        {type === 'viewed' && (
                            <NBText fontSize="sm" color="gray.500">
                                Viewed {dayjs((item as ViewedProfile).viewedAt).format('DD MMM YYYY, hh:mm A')}
                            </NBText>
                        )}
                    </VStack>

                    {/* Right-Side Icon */}
                    <VStack justifyContent="center" alignItems="center">
                        {type === 'viewed' ? (
                            <TouchableOpacity
                                onPress={() => {
                                    router.push({
                                        pathname: '/screens/ProfileDetail',
                                        params: {
                                            userId: (item as ViewedProfile).userId.toString(),
                                            from: 'viewed'
                                        }
                                    });
                                }}
                            >
                                <View style={{ borderWidth: 1, borderColor: '#e11d48', borderRadius: 25, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e11d48' }}>
                                    <Ionicons name="eye" size={20} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        ) : type === 'shortlisted' ? (
                            <HStack space={3}>
                                <TouchableOpacity
                                    onPress={() => {
                                        router.push({
                                            pathname: '/screens/ProfileDetail',
                                            params: {
                                                userId: (item as ShortlistedProfile).userId.toString(),
                                                from: 'shortlisted'
                                            }
                                        });
                                    }}
                                >
                                    <View style={{ borderRadius: 25, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e11d48' }}>
                                        <Ionicons name="eye" size={15} color="#fff" />
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleRemove((item as ShortlistedProfile).shortlistedId!)}
                                >
                                    <View style={{ borderRadius: 25, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e11d48' }}>
                                        <Ionicons name="close" size={15} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            </HStack>
                        ) : (
                            <HStack space={3}>
                                <TouchableOpacity
                                    onPress={() => {
                                        router.push({
                                            pathname: '/screens/ProfileDetail',
                                            params: {
                                                userId: (item as ViewedProfile).userId.toString(),
                                                from: 'viewed'
                                            }
                                        });
                                    }}
                                >
                                    <View style={{ borderRadius: 25, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e11d48' }}>
                                        <Ionicons name="eye" size={15} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            </HStack>
                        )}
                    </VStack>
                </HStack>

            </Box>
        );
    };

    return (
        <NativeBaseProvider>
            <Box p="4" backgroundColor="#f1f1f1">
                <NBText fontSize="lg" fontWeight="semibold">
                    {type === 'viewed' ? 'People Who Viewed You' : 
                     type === 'connection' ? 'Your Connections' : 
                     'Shortlisted Profiles'}
                </NBText>
                {loading && <ActivityIndicator size="large" color="#0000ff" />}
                {error && <NBText color="red.500">{error}</NBText>}
                {data.length === 0 ? (
                    <NBText style={styles.emptyText}>
                        {type === 'viewed' ? 'No one has viewed your profile yet.' : 
                         type === 'connection' ? 'No connections yet.' : 
                         'No profiles shortlisted.'}
                    </NBText>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderItem}
                    />
                )}
            </Box>
        </NativeBaseProvider>
    );
}

const styles = StyleSheet.create({
    removeButton: {
        borderWidth: 1,
        borderColor: '#ff0000',
        borderRadius: 25,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        padding: 16,
        textAlign: 'center',
    },
    emptyText: {
        padding: 16,
        textAlign: 'center',
        color: '#777',
    },
});