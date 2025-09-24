import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  FlatList,
  ScrollView,
  GestureResponderEvent,
  useWindowDimensions,
  Modal,
  Pressable,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeBaseProvider, Center, Stack, VStack, Image as NBImage, Text as NBText, Divider } from 'native-base';
import { Image as ImageNative } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import userApi from '../api/userApi';
import { Checkbox } from 'native-base';
import {
  MapPin,
  GraduationCap,
  DollarSign,
  Briefcase,
  Eye,
  Phone,
  Star,
  Clock,
} from 'lucide-react-native';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from 'react-native-popup-menu';

interface ReceivedProfile {
  userId: number;
  firstName: string;
  lastName: string;
  age: number;
  degree: string;
  annualIncome: string;
  occupation: string;
  location: string;
  profileImage: string;
  status: 'pending' | 'accepted' | 'rejected';
  interestId: number;
  isSent: boolean; // Add this field to distinguish between sent and received profiles
  shortlistedId: number;
}


const ReceivedTab = () => {
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumCheckLoading, setPremiumCheckLoading] = useState(false);

  const checkPremiumStatus = async () => {
    try {
      setPremiumCheckLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found');
        return;
      }
      const response = await userApi.getUserPaidStatus(userId);
      setIsPremium(response.data.isPaid);
    } catch (err) {
      setError('Failed to check premium status');
    } finally {
      setPremiumCheckLoading(false);
    }
  };

  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Checking your premium status...</Text>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );

  const PremiumRequiredScreen = () => (
    <TouchableOpacity 
      style={styles.premiumContainer}
      onPress={() => router.replace('/(root)/screens/PremiumTab')}
    >
      <View style={styles.premiumContent}>
        <Ionicons name="lock-closed" size={40} color="#ec4899" />
        <Text style={styles.premiumTitle}>Premium Required</Text>
        <Text style={styles.premiumText}>
          Upgrade to Premium to send messages and enjoy full features
        </Text>
        <Pressable
          style={styles.upgradeButton}
          onPress={() => router.replace('/(root)/screens/PremiumTab')}
        >
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </Pressable>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    checkPremiumStatus();
  }, []);



  const [data, setData] = useState<ReceivedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  const getStatusCounts = () => ({
    pending: data.filter(item => item.status === 'pending').length,
    accepted: data.filter(item => item.status === 'accepted').length,
    rejected: data.filter(item => item.status === 'rejected').length,
  });

  const filteredData = data.filter(item => item.status === selectedFilter);

  const handleAccept = async (item: ReceivedProfile) => {
    try {
      if (!isPremium) {
        Alert.alert(
          'Premium Required',
          'Upgrade to Premium to accept requests and send messages',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Upgrade Now',
              onPress: () => router.push('/(root)/screens/PremiumTab'),
            },
          ]
        );
        return;
      }

      await userApi.updateInterestRequestStatus(item.interestId, 'APPROVED');

      // Refresh data by fetching latest profiles
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found');
        return;
      }

      const [pendingResponse, acceptedResponse, rejectedResponse] = await Promise.all([
        userApi.getPendingReceivedProfiles(userId),
        userApi.getAcceptedReceivedProfiles(userId),
        userApi.getRejectedReceivedProfiles(userId),
      ]);

      const pendingProfiles = (pendingResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'pending',
      }));

      const acceptedProfiles = (acceptedResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'accepted',
      }));

      const rejectedProfiles = (rejectedResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'rejected',
      }));

      const combinedProfiles = [...pendingProfiles, ...acceptedProfiles, ...rejectedProfiles];
      setData(combinedProfiles);
    } catch (error) {
      console.error('Error accepting profile:', error);
      setError('Failed to accept profile');
    }
  };

  const handleDecline = async (item: ReceivedProfile) => {
    try {
      await userApi.updateInterestRequestStatus(item.interestId, 'REJECTED');

      // Refresh data by fetching latest profiles
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found');
        return;
      }

      const [pendingResponse, acceptedResponse, rejectedResponse] = await Promise.all([
        userApi.getPendingReceivedProfiles(userId),
        userApi.getAcceptedReceivedProfiles(userId),
        userApi.getRejectedReceivedProfiles(userId),
      ]);

      const pendingProfiles = (pendingResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'pending',
      }));

      const acceptedProfiles = (acceptedResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'accepted',
      }));

      const rejectedProfiles = (rejectedResponse.data?.data || []).map((item: any) => ({
        ...item,
        status: 'rejected',
      }));

      const combinedProfiles = [...pendingProfiles, ...acceptedProfiles, ...rejectedProfiles];
      setData(combinedProfiles);
    } catch (error) {
      console.error('Error rejecting profile:', error);
      setError('Failed to reject profile');
    }
  };

  useEffect(() => {
    const loadReceivedData = async () => {
      try {
        setLoading(true);
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          setError('User ID not found');
          return;
        }

        const [pendingResponse, acceptedResponse, rejectedResponse] = await Promise.all([
          userApi.getPendingReceivedProfiles(userId),
          userApi.getAcceptedReceivedProfiles(userId),
          userApi.getRejectedReceivedProfiles(userId),
        ]);

        const pendingProfiles = (pendingResponse.data?.data || []).map((item: any) => ({
          ...item,
          status: 'pending',
        }));

        const acceptedProfiles = (acceptedResponse.data?.data || []).map((item: any) => ({
          ...item,
          status: 'accepted',
        }));

        const rejectedProfiles = (rejectedResponse.data?.data || []).map((item: any) => ({
          ...item,
          status: 'rejected',
        }));

        const combinedProfiles = [...pendingProfiles, ...acceptedProfiles, ...rejectedProfiles];

        console.log('Combined profiles with status:', combinedProfiles);

        setData(combinedProfiles);
        setError(null);
      } catch (err: any) {
        console.error('Error loading received profiles:', err);
        setError('Failed to load profiles: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadReceivedData();
  }, [selectedFilter]);

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {['pending', 'accepted', 'rejected'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text style={[styles.filterButtonText, selectedFilter === filter && styles.filterButtonTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)} ({getStatusCounts()[filter as 'pending' | 'accepted' | 'rejected']})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.userId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.matchCard}
            onPress={() => router.push(`/screens/ProfileDetail?userId=${item.userId}`)}
          >
            <ImageBackground
              source={{ uri: item.profileImage }}
              style={styles.imageBackground}
              imageStyle={styles.image}
            >
              <View style={styles.overlay} />
              <View style={styles.matchInfo}>
                <View style={styles.infoText}>
                  <Text style={styles.name}>{item.firstName} {item.lastName}, {item.age}</Text>
                  <Text style={styles.occupation}>
                    {item.degree}, {item.annualIncome}/yr, {item.occupation}, {item.location}
                  </Text>
                </View>
                {item.status === 'pending' && (
                  <View style={styles.iconActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={(e: GestureResponderEvent) => {
                        e.stopPropagation();
                        handleDecline(item);
                      }}
                    >
                      <Ionicons name="close" size={20} color="green" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={(e: GestureResponderEvent) => {
                        e.stopPropagation();
                        handleAccept(item);
                      }}
                    >
                      <Ionicons name="heart" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No received interests found</Text>
          </View>
        )}
      />
   
    <View style={{ marginBottom:90}}></View>
    </View>
  );
};

const SentTab = () => {
  const [data, setData] = useState<ReceivedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (item: ReceivedProfile) => {
    try {
      await userApi.deleteInterestRequest(item.interestId);
      setData(prevData => prevData.filter(profile => profile.interestId !== item.interestId));
    } catch (error) {
      console.error('Error deleting interest:', error);
      setError('Failed to delete interest');
    }
  };

  useEffect(() => {
    const loadSentData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          setError('User ID not found');
          return;
        }
        const response = await userApi.getSentMailbox(userId);
        if (response.data.code === 200) {
          setData(response.data.data);
        } else {
          setError('Failed to load sent data');
        }
      } catch (error) {
        setError('Error loading sent data');
      } finally {
        setLoading(false);
      }
    };

    loadSentData();
  }, []);

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.userId.toString()}
      renderItem={({ item }) => (
        <View style={styles.matchCard}>
          <TouchableOpacity onPress={() => router.push(`/screens/ProfileDetail?userId=${item.userId}`)}>
            <ImageBackground
              source={{ uri: item.profileImage }}
              style={styles.imageBackground}
              imageStyle={styles.image}
            >
              <View style={styles.overlay} />
              <View style={styles.matchInfo}>
                <View style={styles.infoText}>
                  <Text style={styles.name}>{item.firstName} {item.lastName}, {item.age}</Text>
                  <Text style={styles.occupation}>
                    {item.degree}, {item.annualIncome}/yr, {item.occupation}, {item.location}
                  </Text>
                </View>
                <View style={styles.iconActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                  >
                    <Ionicons name="close" size={20} color="green" />
                  </TouchableOpacity>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No sent interests found</Text>
        </View>
      )}
    />
  );
};

const RequestsTab = () => {
  const [data, setData] = useState<any[]>([]);
  const [wholeReceivedData, setWholeReceivedData] = useState<any[]>([]);
  const [receivedData, setreceivedData] = useState<any[]>([]);
  const [sentData, setsentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'sent' | 'received'>('sent');
  const [profilePhotoChecked, setProfilePhotoChecked] = useState(false);
  const [horoscopeChecked, setHoroscopeChecked] = useState(false);
  const [mobileNumberChecked, setMobileNumberChecked] = useState(false);


  const handleAccept = async (item: any) => {
    try {
      await userApi.updateInterestRequestStatus(item.interestId, 'APPROVED');

      // Refresh data
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found');
        return;
      }

      const [sentResponse, receivedResponse] = await Promise.all([
        userApi.getSentMailbox(userId),
        userApi.getPendingReceivedProfiles(userId),
      ]);

      const sentProfiles = (sentResponse.data?.data || []).map((item: any) => ({
        ...item,
        isSent: true,
      }));

      const receivedProfiles = (receivedResponse.data?.data || []).map((item: any) => ({
        ...item,
        isSent: false,
      }));

      const combinedProfiles = [...sentProfiles, ...receivedProfiles];
      setData(combinedProfiles);
    } catch (err: any) {
      console.error('Error accepting request:', err);
      setError('Failed to accept request: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDelete = async (item: any) => {
    try {
      if (item.isSent) {
        // For sent requests, use deleteInterestRequest
        await userApi.deleteInterestRequest(item.interestId);
      } else {
        // For received requests, use updateInterestRequestStatus with 'REJECTED'
        await userApi.updateInterestRequestStatus(item.interestId, 'REJECTED');
      }

      // Refresh data
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found');
        return;
      }

      const [sentResponse, receivedResponse] = await Promise.all([
        userApi.getSentMailbox(userId),
        userApi.getPendingReceivedProfiles(userId),
      ]);

      const sentProfiles = (sentResponse.data?.data || []).map((item: any) => ({
        ...item,
        isSent: true,
      }));

      const receivedProfiles = (receivedResponse.data?.data || []).map((item: any) => ({
        ...item,
        isSent: false,
      }));

      const combinedProfiles = [...sentProfiles, ...receivedProfiles];
      setData(combinedProfiles);
    } catch (err: any) {
      console.error('Error deleting request:', err);
      setError('Failed to delete request: ' + (err.message || 'Unknown error'));
    }
  };



  // const filteredData = data.filter(item => item.isSent === (selectedFilter === 'sent'));

  useEffect(() => {
    const loadRequestsData = async () => {
      try {
        setLoading(true);
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          setError('User ID not found');
          return;
        }

        // Fetch both sent and received profiles
        // const [sentResponse, receivedResponse] = await Promise.all([
        //   userApi.getRestrictedRequestsToId(userId),
        //   userApi.getRestrictedRequestsById(userId),
        // ]);
        const sentResponse = await userApi.getRestrictedRequestsById(userId);
        const receivedResponse = await userApi.getRestrictedRequestsToId(userId);



        // Convert responses to consistent format
        const sentProfiles = sentResponse.data?.data || []
          ;

        console.log("sentProfiles===========================>", sentProfiles);
        // const sentProfiles = (sentResponse.data?.data || []).map((item: any) => ({
        //   ...item,
        //   isSent: true,
        // }));
        const receivedProfiles = receivedResponse.data?.data || [];
        // const receivedProfiles = (receivedResponse.data?.data || []).map((item: any) => ({
        console.log("receivedProfiles===========================>", receivedProfiles);
        //   ...item,
        //   isSent: false,
        // }));

        // const combinedProfiles = [...sentProfiles, ...receivedProfiles];
        setWholeReceivedData(receivedProfiles);
        setreceivedData(receivedProfiles);
        setsentData(sentProfiles);

        // setData(combinedProfiles);
        setError(null);
      } catch (err: any) {
        console.error('Error loading requests:', err);
        setError('Failed to load requests: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };


    loadRequestsData();
  }, [selectedFilter]);

  const handlePrintSelected = (newState: {
    profilePhoto?: boolean;
    horoscope?: boolean;
    mobileNumber?: boolean;
  } = {}) => {
    const {
      profilePhoto = profilePhotoChecked,
      horoscope = horoscopeChecked,
      mobileNumber = mobileNumberChecked,
    } = newState;

    // console.log("profilePhoto===========================>", profilePhoto);
    // console.log("horoscope===========================>", horoscope);
    // console.log("mobileNumber===========================>", mobileNumber);


    // console.log("wholeReceivedData===========================>", wholeReceivedData);

    // Filter receivedData based on selected checkboxes
    const filteredData = wholeReceivedData.filter(item => {
      // If no filters are selected, show all items
      if (!profilePhoto && !horoscope && !mobileNumber) return true;

      // Check if the item matches any of the selected filters
      const isProfileImage = item.fieldType?.toUpperCase() === 'PROFILE_IMAGE';
      const isHoroscope = item.fieldType?.toUpperCase() === 'HOROSCOPE';
      const isMobile = item.fieldType?.toUpperCase() === 'MOBILE';

      return (
        (profilePhoto && isProfileImage) ||
        (horoscope && isHoroscope) ||
        (mobileNumber && isMobile)
      );
    });

    // console.log("filteredData===========================>", filteredData);


    // Update the receivedData state with filtered data
    setreceivedData(filteredData);

    // Update checked states
    // setProfilePhotoChecked(profilePhoto);
    // setHoroscopeChecked(horoscope);
    // setMobileNumberChecked(mobileNumber);

    const selectedOptions = [];
    if (profilePhoto) selectedOptions.push("Profile Photo");
    if (horoscope) selectedOptions.push("Horoscope");
    if (mobileNumber) selectedOptions.push("Mobile Number");

    console.log("Selected Filters:", selectedOptions);
    Alert.alert("Selected Filters", selectedOptions.join(', ') || "None");
  };


  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{error}</Text>
      </View>
    );
  }

  const RequestCard: React.FC<{ request: any }> = ({ request }) => {
    const getRequestBadgeColor = (type: string) => {
      switch (type) {
        case 'Horoscope':
          return { backgroundColor: '#FEF3C7', color: '#D97706' };
        case 'Mobile':
          return { backgroundColor: '#DBEAFE', color: '#2563EB' };
        case 'Profile Photo':
          return { backgroundColor: '#F3E8FF', color: '#7C3AED' };
        default:
          return { backgroundColor: '#F3F4F6', color: '#6B7280' };
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'APPROVED':
          return '#10B981';
        case 'REJECTED':
          return '#EF4444';
        default:
          return '#F59E0B';
      }
    };

    const getRequestIcon = (type: string) => {
      switch (type) {
        case 'HOROSCOPE':
          return <Star size={12} color="#D97706" />;
        case 'MOBILE':
          return <Phone size={12} color="#2563EB" />;
        case 'PROFILE_IMAGE':
          return <Eye size={12} color="#7C3AED" />;
        default:
          return null;
      }
    };

    const getTimeAgo = (dateString: string): string => {
      const requestedDate = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - requestedDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      return `${diffDays} days ago`;
    };



    return (
      <TouchableOpacity onPress={() => router.push(`/screens/ProfileDetail?userId=${request.requestedTo}`)} style={styles.requestCard}>
        <View style={styles.cardHeader}>
          <ImageNative source={{ uri: request.profileImage }} style={styles.profileImageRequestCard} />
          <View style={styles.headerInfo}>
            <Text style={styles.nameRequestCard}>
              {request.firstname} {request.lastname}
            </Text>
            <Text style={styles.age}>{request.age} years</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(request.status || 'pending') },
                ]}
              />
              <Text style={[styles.status, { color: getStatusColor(request.status || 'pending') }]}>
                {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.timeContainer}>
            <Clock size={14} color="#9CA3AF" />
            <Text style={styles.requestTime}>{getTimeAgo(request.requestedAt)}</Text>
          </View>
        </View>

        <View style={styles.requestTypesContainer}>
          <View style={styles.requestTypesRow}>
            {/* Left column */}
            <View style={styles.requestTypesLeft}>
              <Text style={styles.requestLabel}>Requested Access:</Text>
              <View style={styles.requestBadges}>
                {request.fieldType && (
                  <View style={[styles.requestBadge, getRequestBadgeColor(request.fieldType)]}>
                    {getRequestIcon(request.fieldType)}
                    <Text
                      style={[
                        styles.requestBadgeText,
                        { color: getRequestBadgeColor(request.fieldType).color },
                      ]}
                    >
                      {request.fieldType === 'HOROSCOPE'
                        ? 'Horoscope'
                        : request.fieldType === 'MOBILE'
                          ? 'Mobile Number'
                          : 'Profile Photo'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Right column (button shown only if status is APPROVED) */}
            {request.status === 'APPROVED' && (
              <TouchableOpacity onPress={() => router.push(`/screens/ProfileDetail?userId=${request.requestedTo}`)} style={styles.viewProfileButton}>
                <Eye size={14} color="#007AFF" style={{ marginRight: 6 }} />
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>


        <View style={styles.profileDetails1}>
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{request.degree}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{request.Occupation}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{request.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{request.AnnualIncome}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <MenuProvider>

      <View style={styles.container}>
        <View style={styles.filterContainerReq}>
          {['sent', 'received'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButtonReq,
                selectedFilter === filter && styles.filterButtonActiveReq,
              ]}
              onPress={() => setSelectedFilter(filter as 'sent' | 'received')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActiveReq,
              ]}>
                {filter === 'sent' ? 'Request Received' : 'Request Sent'}
                {/* {getStatusCounts()[filter as 'sent' | 'received'] > 0 && (
                <Text style={styles.filterBadge}>
                  {getStatusCounts()[filter as 'sent' | 'received']}
                </Text>
              )} */}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {selectedFilter === 'sent' && (
          <>

            <View style={styles.titleRow}>
              {/* Left Section */}
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Request received to view your Information</Text>
                <Text style={styles.subtitleText}>Member who would like to view your Information</Text>
              </View>

              {/* Right Icon Trigger */}
              {/* <TouchableOpacity
        style={styles.filterIcon}
      >
        <Ionicons name="options-outline" size={24} color="black" />
      </TouchableOpacity> */}

              <Menu>
                <MenuTrigger style={styles.filterIcon}>
                  <Ionicons name="options-outline" size={25} color="black" />
                </MenuTrigger>

                <MenuOptions customStyles={{
                  optionsContainer: {
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 6,
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                    marginTop: -50,  // Adjust this value to position the menu closer
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    alignSelf: 'center'
                  },
                }}>
                  <View style={styles.menuContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'evenly', justifyContent: 'space-between' }}>
                      <Text style={styles.menuTitle}>Filter Options</Text>

                    </View>


                    <Checkbox
                      value="profilePhoto"
                      isChecked={profilePhotoChecked}
                      onChange={(val) => {
                        setProfilePhotoChecked(val);
                        handlePrintSelected({ profilePhoto: val });
                      }}
                      size="sm"
                      marginBottom={3}
                      colorScheme="amber"
                      _checked={{
                        bg: "amber.500",
                        borderColor: "amber.500"
                      }}>
                      <Text>Profile Photo</Text>
                    </Checkbox>

                    <Checkbox
                      value="horoscope"
                      isChecked={horoscopeChecked}
                      onChange={(val) => {
                        setHoroscopeChecked(val);
                        handlePrintSelected({ horoscope: val });
                      }}
                      size="sm"
                      marginBottom={3}
                      colorScheme="amber"
                      _checked={{
                        bg: "amber.500",
                        borderColor: "amber.500"
                      }}>
                      <Text>Horoscope</Text>
                    </Checkbox>

                    <Checkbox
                      value="mobileNumber"
                      isChecked={mobileNumberChecked}
                      onChange={(val) => {
                        setMobileNumberChecked(val);
                        handlePrintSelected({ mobileNumber: val });
                      }}
                      size="sm"
                      colorScheme="amber"
                      _checked={{
                        bg: "amber.500",
                        borderColor: "amber.500"
                      }}>
                      <Text>Mobile Number</Text>
                    </Checkbox>

                  </View>
                </MenuOptions>
              </Menu>
            </View>

            <FlatList
              data={receivedData}
              keyExtractor={(item: any) => item.requestId.toString()}
              renderItem={({ item }) => (
                <View style={styles.matchCard}>
                  <TouchableOpacity onPress={() => router.push(`/screens/ProfileDetail?userId=${item.requestedBy}`)}>
                    <ImageBackground
                      source={{ uri: item.profileImage }}
                      style={styles.imageBackground}
                      imageStyle={styles.image}
                    >
                      <View style={styles.overlay} />
                      {selectedFilter === 'sent' && (
                        <View style={styles.profileImageLabel}>
                          <Text style={styles.profileImageLabelText}>{item.fieldType == 'PROFILE_IMAGE' ? 'Profile Photo' : item.fieldType == 'HOROSCOPE' ? 'Horoscope' : item.fieldType == 'MOBILE' ? 'Mobile Number' : ''}</Text>
                        </View>
                      )}
                      <View style={styles.matchInfo}>
                        <View style={styles.infoText}>
                          <Text style={styles.name}>
                            {item.firstname} {item.lastname}, {item.age}
                          </Text>
                          <Text style={styles.occupation}>
                            {item.degree}, {item.AnnualIncome}/yr, {item.Occupation}, {item.location}
                          </Text>
                        </View>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={[
                              styles.iconButton,
                              { marginRight: 10 }
                            ]}
                            onPress={(e: GestureResponderEvent) => {
                              e.stopPropagation();
                              handleAccept(item);
                            }}
                          >
                            <Ionicons name="checkmark" size={20} color="green" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={(e: GestureResponderEvent) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                          >
                            <Ionicons name="close" size={20} color="red" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No received interests found
                  </Text>
                </View>
              )}
            />
          </>
        )}

        {selectedFilter === 'received' && (
          <View style={styles.containerRequestCard}>
            {/* <View style={styles.header}>
      <Text style={styles.headerTitle}> Request Sent</Text>
      <Text style={styles.headerSubtitle}>
        {receivedData.length} request{receivedData.length !== 1 ? 's' : ''} received
      </Text>
    </View> */}

            {sentData.length > 0 ? (
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {sentData.map((request) => (
                  <RequestCard key={request.requestId} request={request} />
                ))}

              </ScrollView>
            ) : (
              <View style={{ padding: 20 }}>
                <Text style={{ textAlign: 'center', color: '#6B7280', fontSize: 16 }}>
                  No received interests found
                </Text>
              </View>
            )}
          </View>
        )}

      </View>
    </MenuProvider>
  );
};

const ShortlistedTab = () => {
  const [data, setData] = useState<ReceivedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async (shortlistedId: number) => {
    try {
      await userApi.deleteShortlistedProfile(shortlistedId);
      // Refresh data after successful removal
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found');
        return;
      }
      const response = await userApi.getShortlistedMailbox(userId);
      if (response.data.code === 200) {
        setData(response.data.data);
      } else {
        setError('Failed to refresh shortlisted data');
      }
    } catch (error) {
      setError('Error removing profile');
    }
  };

  useEffect(() => {
    const loadShortlistedData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          setError('User ID not found');
          return;
        }
        const response = await userApi.getShortlistedMailbox(userId);
        if (response.data.code === 200) {
          setData(response.data.data);
        } else {
          setError('Failed to load shortlisted data');
        }
      } catch (error) {
        setError('Error loading shortlisted data');
      } finally {
        setLoading(false);
      }
    };

    loadShortlistedData();
  }, []);

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{error}</Text>
      </View>
    );
  }

  return (
    <NativeBaseProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
        <ScrollView className='mb-3'>
          <View className='ml-5 mt-2 mb-2'>
            <NBText fontSize={'lg'} fontWeight={'semibold'}> Shortlisted</NBText>
          </View>

          <View className='mb-10'>
            {data.map(member => (
              <VStack key={member.userId} space={2} alignItems="center">
                <Center w="100%" h="75" rounded="md">
                  <Stack direction="row" m={5} space={3} alignItems="center">
                    {/* Profile Picture */}
                    <Center shadow={3}>
                      <NBImage
                        source={{
                          uri: member.profileImage,
                        }}
                        alt="Img"
                        size="50px"
                        borderRadius="full"
                      />
                    </Center>

                    {/* Profile Details */}
                    <VStack flex={1} space={1}>
                      <NBText fontSize="md" fontWeight="semibold" isTruncated maxWidth="90%">
                        {member.firstName} {member.lastName}
                      </NBText>
                      <NBText fontSize="sm" color="gray.500">{member.location}, {member.degree}, {member.annualIncome}, {member.occupation}</NBText>
                    </VStack>

                    {/* Remove Button with Icon */}
                    <View style={styles.iconActions}>
                      <TouchableOpacity
                        style={{
                          borderWidth: 1,
                          borderColor: '#ff0000',
                          borderRadius: 25,
                          width: 40,
                          height: 40,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                        onPress={() => handleRemove(member.shortlistedId)}
                      >
                        <Ionicons name="close" size={20} color="#ff0000" />
                      </TouchableOpacity>
                    </View>
                  </Stack>
                </Center>
                <Divider my="1" _light={{
                  bg: "gray.200"
                }} _dark={{
                  bg: "gray.50"
                }} />
              </VStack>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </NativeBaseProvider>
  );
};

const MailBox = () => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'received', title: 'Received' },
    { key: 'sent', title: 'Sent' },
    { key: 'request', title: 'Request' },
    { key: 'shortlisted', title: 'Shortlisted' }
  ]);

  const renderScene = SceneMap({
    received: ReceivedTab,
    sent: SentTab,
    request: RequestsTab,
    shortlisted: ShortlistedTab
  });

  return (
    <NativeBaseProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={props => (
              <TabBar
                {...props}
                style={styles.tabBar}
                indicatorStyle={styles.indicator}
                activeColor="#000"
                inactiveColor="#888"
                tabStyle={styles.tabStyle}
              />
            )}
          />
        </View>
      </SafeAreaView>
    </NativeBaseProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  errorText: {
    color: '#ff3b30',
    marginTop: 10,
    textAlign: 'center',
  },
  premiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  premiumContent: {
    alignItems: 'center',
    padding: 20,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginTop: 20,
  },
  premiumText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 20,
  },
  upgradeButton: {
    backgroundColor: '#ec4899',
    padding: 12,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabStyle: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filterIconContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  filterIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    // height: '%',
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 16,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    position: 'relative',
    overflow: 'hidden',
  },
  profileImageLabel: {
    position: 'absolute',
    top: 14,
    right: 0,
    backgroundColor: 'red',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  profileImageLabelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  profileCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: 150,
    justifyContent: 'flex-end',
    padding: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileDetails: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  filterBadge: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  tabBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  indicator: {
    backgroundColor: '#007AFF',
    height: 2,
  },
  // matchCard: {
  //   paddingHorizontal: 16,
  //   paddingVertical: 12,
  //   borderRadius: 16,
  //   position: 'relative',
  // },
  // profileImageLabel: {
  //   position: 'absolute',
  //   top: 12,
  //   right: 16,
  //   backgroundColor: '#2196F3',
  //   paddingHorizontal: 12,
  //   paddingVertical: 4,
  //   borderRadius: 20,
  //   zIndex: 10,
  // },
  // profileImageLabelText: {
  //   color: 'white',
  //   fontSize: 12,
  //   fontWeight: '500',
  // },
  // profileImageLabel: {
  //   position: 'absolute',
  //   top: 12,
  //   right: 16,
  //   backgroundColor: '#2196F3',
  //   paddingHorizontal: 12,
  //   paddingVertical: 4,
  //   borderRadius: 20,
  //   zIndex: 10,
  // },
  // profileImageLabelText: {
  //   color: 'white',
  //   fontSize: 12,
  //   fontWeight: '500',
  // },
  imageBackground: {
    height: 260,
    borderRadius: 16,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 16,
    height: 260,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,

  },
  matchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 16,
  },
  infoText: {
    maxWidth: '70%',
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  occupation: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  iconActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 5,
    // backgroundColor: '#f5f5f5',
    // borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginTop: 10,
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    // width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterButtonText: {
    color: '#333',
    fontSize: 12,
    // fontWeight: '// 500',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    // paddingVertical: 12,
  },
  titleContainer: {
    flexShrink: 1,
  },
  // titleText: {
  //   fontSize: 16,
  //   fontWeight: '600',
  //   color: '#000',
  // },
  subtitleText: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
    marginBottom: 10,
  },
  titleText: {
    color: '#000',
    marginTop: 10,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    // fontWeight: '600',

  },
  filterContainerReq: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 5,
    // backgroundColor: '#f5f5f5',
    // borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginTop: 10,
  },
  filterButtonReq: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActiveReq: {
    backgroundColor: '#007AFF',
  },
  filterButtonTextReq: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
  },
  filterButtonTextActiveReq: {
    color: '#fff',
  },
  menuContent: {
    padding: 8,
    // width: 250,
  },
  // checkbox: {
  //   marginBottom: 12,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   gap: 8,
  // },
  menuTitle: {
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileImageRequestCard: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  nameRequestCard: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  age: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  status: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  timeContainer: {
    alignItems: 'center',
  },
  requestTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  requestTypesContainer: {
    marginBottom: 16,
  },
  requestLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  requestBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8, // this ensures spacing if you're using older RN versions
  },
  requestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  requestBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  profileDetails1: {
    rowGap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
  },
  containerRequestCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    marginTop: 10,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    // paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    // marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  requestTypesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  requestTypesLeft: {
    flex: 1,
  },

  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
  },

  viewProfileText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },

});


export default MailBox;
