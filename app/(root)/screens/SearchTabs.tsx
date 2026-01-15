import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Text,
    View,
    useWindowDimensions,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
    Modal,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Box, CheckIcon, Divider, FlatList, HStack, Radio, Select, Stack, Switch } from "native-base";
import { TabView, TabBar } from "react-native-tab-view";
import Expandable from "react-native-reanimated-animated-accordion";
import { Feather, Ionicons } from "@expo/vector-icons";
import RangeSlider from "rn-range-slider";
import { Dropdown } from "react-native-element-dropdown";
import DropdownComponent from "../../../components/DropdownComponent";
import ExploreProfileCard from "../../../components/ExploreProfileCard";
import userApi from "@/app/(root)/api/userApi";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Book, Calendar, DollarSign, Briefcase, ChevronDown, ChevronRight } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubscription } from '../contexts/subscriptionContext';
// Custom Components for Slider
const Thumb = () => <View style={styles.thumb} />;
const Rail = () => <View style={styles.rail} />;
const RailSelected = () => <View style={styles.railSelected} />;
const Notch = () => <View style={styles.notch} />;
const Label = ({ text }: { text: number }) => (
    <View style={styles.labelContainer}>
        <Text style={styles.labelText}>{text}</Text>
    </View>
);

// Search Tab with Expandable Accordion
interface SearchProps {
    setSwipeEnabled: (enabled: boolean) => void;
}
interface Filter {
    id: number;
    filterKey: string;
    filterValue: string;
}
interface SavedSearch {
    id: number;
    userId: number;
    searchName: string;
    isActive: string;
    createdAt: string;
    updatedAt: string;
    filters: Filter[];
}

const Search: React.FC<SearchProps> = ({ setSwipeEnabled }) => {
    const [profiles, setProfiles] = useState<any>(null);
    const [expanded, setExpanded] = useState(false);
    const [minAgeText, setMinAgeText] = useState("18");
    const [maxAgeText, setMaxAgeText] = useState("50");
    const [minSalaryText, setMinSalaryText] = useState("0");
    const [maxSalaryText, setMaxSalaryText] = useState("20");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [education, setEducation] = useState<any>(null);
    const [educationOptions, setEducationOptions] = useState<string[]>([]);
    const { subscriptionData } = useSubscription();

    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [star, setStar] = useState('');
    const [dosham, setDosham] = useState('');
    const [annualIncome, setAnnualIncome] = useState('');
    const [city, setCity] = useState('');

    const [activeTab, setActiveTab] = useState('criteria');
    const [showAgeModal, setShowAgeModal] = useState(false);
    // const [showHeightModal, setShowHeightModal] = useState(false);
    const [showProfileCreatedModal, setShowProfileCreatedModal] = useState(false);
    // const [showSubcasteModal, setShowSubcasteModal] = useState(false);
    const [showEducationModal, setShowEducationModal] = useState(false);
    // const [showCityModal, setShowCityModal] = useState(false);
    const [showStarModal, setShowStarModal] = useState(false);
    const [showDoshamModal, setShowDoshamModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showJobSectorModal, setShowJobSectorModal] = useState(false);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [loading, setLoading] = useState(true);
    // Add this effect to fetch saved searches
    const [incomeRanges, setIncomeRanges] = useState<Array<{
        id: number;
        from: number | null;
        to: number | null;
        amount: string;
    }>>([
        { id: 1, from: 100000, to: 400000, amount: "1 lakh - 4 lakhs" },
        { id: 2, from: 400000, to: 800000, amount: "4 lakhs - 8 lakhs" },
        { id: 3, from: 800000, to: 1200000, amount: "8 lakh - 12 lakhs" },
        { id: 4, from: 1200000, to: 1600000, amount: "12 lakh - 16 lakhs" },
        { id: 5, from: 1600000, to: 2000000, amount: "16 lakh - 20 lakhs" },
        { id: 6, from: 2000000, to: null, amount: "above 20 lakhs" },
        { id: 7, from: null, to: null, amount: "Any" }
    ]);
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        religious: true,
        job: true, // Set to true to have job section expanded by default
    });
    const [profileId, setProfileId] = useState<string>('');

    const [optionsMap, setOptionsMap] = useState({
        height: [] as string[],
        age: [] as string[],
        star: [] as string[],
        dosham: [] as string[],
        education: [] as string[],
        annualIncome: [] as string[],
        city: [] as string[],
        annualIncomeFilter: [] as string[],
        jobSector: [] as string[],

    });

    const [filters, setFilters] = useState({
        ageRange: '28 Yrs - 32 Yrs',
        profileCreatedBy: 'Any',
        subcaste: 'Any',
        education: '',
        city: '',
        star: '',
        dosham: '',
        annualIncomeFilter: '',
        jobSector: '',
        degree: '',
    });

    const tabs = [
        { id: 'criteria', label: 'By Criteria' },
        { id: 'profile', label: 'By Profile ID' },
        { id: 'saved', label: 'Saved Search' },
    ];

    // Age options will be loaded from the API
    const profileCreatedOptions = ['Any', 'Parents', 'Self', 'Relatives', 'Guardian'];

    const gatherSearchData = async () => {
        // Parse age range (format: "28 Yrs - 32 Yrs")
        const keys = ['gender', 'casteId', 'userId'];
        const values = await AsyncStorage.multiGet(keys);

        const userData = Object.fromEntries(values);

        if (!userData.gender || !userData.casteId || !userData.userId) {
            throw new Error('User data not found in AsyncStorage');
        }

        console.log('User data ---------->:', userData);

        const [minAge, maxAge] = filters.ageRange
            ? filters.ageRange
                .split(' - ')
                .map(s => s.split(' ')[0])
            : ['28', '32']; // Default values if not set

        // Parse income range (format: "5 Lacs - 20 Lacs")
        let minAnnualIncome: string | null = null;
        let maxAnnualIncome: string | null = null;
        if (filters.annualIncomeFilter) {
            // Find the matching income range from the fetched data
            const selectedRange = incomeRanges.find(range =>
                range.amount?.toLowerCase() === filters.annualIncomeFilter.toLowerCase()
            );
            if (selectedRange) {
                minAnnualIncome = selectedRange.from?.toString() ?? null;
                maxAnnualIncome = selectedRange.to?.toString() ?? null;
            }
        }

        // Map job sector to employedAt format
        const getEmployedAt = () => {
            if (!filters.jobSector) return null;
            const sector = filters.jobSector.toLowerCase();

            if (sector.includes('govt')) return 'GOVT';
            if (sector.includes('private')) return 'PRIVATE';
            if (sector.includes('self')) return 'SELF';
            if (sector.includes('no job')) return 'UNEMPLOYED';  // Changed from 'NOJOB' to match your API
            if (sector.includes('any job') || sector === 'any') return 'ANY';

            return 'ANY';  // Default to 'ANY' instead of 'Any' for consistency
        };

        const searchData = {
            minAge,
            maxAge,
            minAnnualIncome,
            maxAnnualIncome,
            occupation: filters.occupation || 'Any',
            location: filters.city || 'Any',
            employedAt: getEmployedAt(),
            profileImageStatus: photoOnly ? 'Y' : 'N',
            casteId: userData.casteId, // Default value, update as needed
            gender: userData.gender == 'M' ? 'F' : 'M', // Default value, update as needed
            dosham: filters.dosham || 'Any',
            star: filters.star || 'Any',
            profilesWithHoroscope: horoscopeOnly ? 'Y' : 'N',
            userId: atob(userData.userId), // Default value, replace with actual user ID
            degree: filters.education || 'Any',
        };

        // Log the search data in a readable format
        console.log('=== Search Filters ===');
        console.log(JSON.stringify(searchData, null, 2));
        console.log('======================');

        return searchData;
    };

    useEffect(() => {
        const fetchSavedSearches = async () => {
            try {
                const userId = await AsyncStorage.getItem('userId');
                if (!userId) return;

                const decodedUserId = atob(userId);
                const response = await userApi.getAllUserSavedSearches(decodedUserId);
                console.log("response.data====>", response.data);


                if (response.data.code === 200) {
                    setSavedSearches(response.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching saved searches:', error);
            } finally {
                setLoading(false);
            }
        };
        if (activeTab === 'saved') {
            fetchSavedSearches();
        }
    }, [activeTab]);



    const handleSearch = async () => {
        const searchData = await gatherSearchData();
        // console.log('Search Data:', JSON.stringify(searchData, null, 2));
        // console.log("searchData.minAnnualIncome ", searchData.minAnnualIncome);


        try {
            // Format the request body according to API requirements
            const requestBody = {
                minAge: searchData.minAge || null, // Extract min age from range
                maxAge: searchData.maxAge || null, // Extract max age from range
                minAnnualIncome: searchData.minAnnualIncome || null, // Default value
                maxAnnualIncome: searchData.maxAnnualIncome || null, // Default value
                occupation: searchData.occupation == 'Any' ? null : searchData.occupation,
                location: searchData.location == 'Any' ? null : searchData.location,
                employedAt: searchData.employedAt || null, // Default value
                profileImageStatus: searchData.profileImageStatus || 'N',
                casteId: searchData.casteId || null, // Default value, you might want to get this from your filters
                gender: searchData.gender || null, // Default value, you might want to get this from your filters
                dosham: searchData.dosham == 'Any' ? null : searchData.dosham,
                star: searchData.star == 'Any' ? null : searchData.star,
                profilesWithHoroscope: searchData.profilesWithHoroscope || 'N',
                userId: searchData.userId || null, // You need to get this from your auth context or state
                degree: searchData.degree || null
            };

            // console.log('Sending request:', JSON.stringify(requestBody, null, 2));

            // Call the API
            // console.log("called this");

            const response = await userApi.filterUsers(requestBody);
            // console.log('Search results:', response.data.data);

            // Navigate to search results with the data
            if (response.data.code == 200) {
                router.push({
                    pathname: '/(root)/screens/SearchResult',
                    params: {
                        searchResults: JSON.stringify(response.data.data),
                        searchCriteria: JSON.stringify(requestBody)
                    }
                });
            } else if (response.data.code == 404) {
                Alert.alert('No profiles found matching your search criteria');
            } else {
                Alert.alert('Something Went Wrong. Please try again.');
            }

        } catch (error) {
            console.error('Error searching profiles:', error);
            // Handle error (show error message to user)
            Alert.alert('Something Went Wrong. Please try again.');
        }
    };

    useEffect(() => {
        if (subscriptionData && subscriptionData.entitlements) {
            // console.log("subscriptionData======>", subscriptionData);
            // console.log("subscriptionData.entitlements:", subscriptionData.entitlements);

            const hasPremiumAccess =
                subscriptionData.entitlements.advSearch === true &&
                subscriptionData.entitlements.basicSearch === true;

            // console.log("hasPremiumAccess ===>", hasPremiumAccess);
            setIsPremiumUser(hasPremiumAccess);
        } else {
            // console.log("No subscription data or entitlements found");
            setIsPremiumUser(false);
        }
        // console.log("hasPremiumAccess ===>", isPremiumUser);

    }, [subscriptionData]);


    const handleUseSearch = async (savedSearch: SavedSearch) => {
        // Create a mapping of filter keys to your state keys

        // console.log("isPremiumUser", isPremiumUser);


        // Check if search contains premium features
        const hasPremiumFeatures = savedSearch.filters.some(filter =>
            ['Star', 'Dosham', 'profilesWithHoroscope', 'Education'].includes(filter.filterKey)
        );
        if (hasPremiumFeatures && !isPremiumUser) {
            Alert.alert(
                'Premium Feature',
                'This search includes premium features. Please upgrade to premium to use this search.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Upgrade Now',
                        onPress: () => router.push('/')
                    }
                ]
            );
            return;
        }

        const filterKeyMap: Record<string, string> = {
            'age': 'ageRange',
            'annual income': 'annualIncomeFilter',
            'dosham': 'dosham',
            'degree': 'degree',
            'education': 'education',
            'star': 'star',
            'city': 'city',
            'job sector': 'jobSector',
            'profileswithhoroscope': 'horoscopeOnly',
            'profileimagestatus': 'photoOnly'
        };

        // Initialize with default values
        const updatedFilters = {
            ageRange: '28 Yrs - 32 Yrs',
            profileCreatedBy: 'Any',
            education: '',
            city: '',
            star: '',
            dosham: '',
            annualIncomeFilter: '',
            jobSector: '',
            degree: '',
        };

        // Initialize state for toggles
        let newHoroscopeOnly = false;
        let newPhotoOnly = false;

        // Apply saved filters
        savedSearch.filters.forEach(filter => {
            const key = filter.filterKey.toLowerCase();
            const value = filter.filterValue;

            // Handle age range
            if (key === 'age') {
                updatedFilters.ageRange = value;
            }
            // Handle annual income
            // In the saved search handling section, update the annual income case:
            else if (key === 'annual income') {
                const [minStr, maxStr] = value.split(' - ').map(s => s === 'null' ? null : s);

                // Find the matching range in incomeRanges
                const matchedRange = incomeRanges.find(range => {
                    const rangeMin = range.from?.toString() || 'null';
                    const rangeMax = range.to?.toString() || 'null';
                    return rangeMin === minStr && rangeMax === maxStr;
                });

                if (matchedRange) {
                    updatedFilters.annualIncomeFilter = matchedRange.amount;
                } else {
                    // Fallback: If no exact match found, try to find the closest match
                    if (minStr === '2000000' && (maxStr === 'null' || maxStr === null)) {
                        updatedFilters.annualIncomeFilter = 'above 20 lakhs';
                    } else if (minStr === 'null' && maxStr === 'null') {
                        updatedFilters.annualIncomeFilter = 'Any';
                    } else {
                        // For custom ranges, format them nicely
                        const formatLakhs = (num: string) => {
                            const numValue = parseInt(num);
                            return numValue >= 100000 ? `${numValue / 100000} lakh${numValue !== 100000 ? 's' : ''}` : num;
                        };

                        if (maxStr === 'null') {
                            updatedFilters.annualIncomeFilter = `above ${formatLakhs(minStr)}`;
                        } else {
                            updatedFilters.annualIncomeFilter = `${formatLakhs(minStr)} - ${formatLakhs(maxStr)}`;
                        }
                    }
                }
            }
            // Handle profiles with horoscope (exact match)
            else if (key === 'profileswithhoroscope') {
                newHoroscopeOnly = value === 'Y';
            }
            // Handle profile with photos (exact match)
            else if (key === 'profileimagestatus') {
                newPhotoOnly = value === 'Y';
            }
            // Handle other filters
            else if (key in filterKeyMap) {
                const stateKey = filterKeyMap[key] as keyof typeof updatedFilters;
                if (stateKey in updatedFilters) {
                    updatedFilters[stateKey] = value;
                }
            }
        });

        // Update all filters at once
        setFilters(updatedFilters);

        // Update the toggle states
        if (newHoroscopeOnly !== horoscopeOnly) {
            setHoroscopeOnly(newHoroscopeOnly);
        }
        if (newPhotoOnly !== photoOnly) {
            setPhotoOnly(newPhotoOnly);
        }

        // Switch to criteria tab
        setActiveTab('criteria');

        // Show success message
        Alert.alert('Search Loaded', `Loaded search: ${savedSearch.searchName}`);
    };

    const handleDelete = async (searchId: number) => {
        try {
            // Show confirmation dialog
            Alert.alert(
                'Delete Saved Search',
                'Are you sure you want to delete this saved search?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                // Call your API to mark the search as inactive
                                const response = await userApi.inActiveSavedSearch(searchId);

                                if (response.data.code === 200) {
                                    // Remove the search from the local state
                                    setSavedSearches(prev => prev.filter(search => search.id !== searchId));

                                    // Show success message
                                    Alert.alert('Success', 'Search deleted successfully');
                                } else {
                                    throw new Error(response.data.message || 'Failed to delete search');
                                }
                            } catch (error) {
                                console.error('Error deleting search:', error);
                                Alert.alert('Error', 'Failed to delete search. Please try again.');
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error showing delete confirmation:', error);
        }
    };

    const toggleSection = useCallback((section: 'basic' | 'religious' | 'job') => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    // Fetch key-value pairs for dropdowns
    useEffect(() => {
        const fetchKeyValues = async () => {
            const keys = ['education', 'city', 'height', 'age', 'star', 'dosham', 'annualIncome', 'employingIn'];

            for (const key of keys) {
                try {
                    console.log(`Fetching ${key}...`);
                    const response = await userApi.getKeyValueByKey(key);
                    console.log(`${key} API Response:`, response);

                    let value = response.data.data?.valueColumn || response.data.data?.value || response.data?.data;
                    console.log(`${key} raw value:`, value);

                    // If value is a string that looks like a JSON array, parse it
                    // Add this inside the fetchKeyValues function, after processing other keys
                    if (key === 'employingIn') {
                        // console.log("Processing employingIn data:", value);

                        // Process the employingIn data to extract job sector options
                        let jobSectorOptions: string[] = [];

                        try {
                            // If value is a string, parse it as JSON
                            const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;

                            if (Array.isArray(parsedValue)) {
                                jobSectorOptions = parsedValue
                                    .filter((item: any) => item && item.label) // Filter out invalid items
                                    .map((item: any) => item.label); // Extract label for display
                            }

                            console.log("Processed job sector options:", jobSectorOptions);

                            // Update the jobSector state and optionsMap
                            if (jobSectorOptions.length > 0) {
                                setOptionsMap(prev => ({
                                    ...prev,
                                    jobSector: jobSectorOptions
                                }));
                            }
                        } catch (error) {
                            console.error('Error processing employingIn data:', error);
                        }
                    }

                    if (key === 'annualIncome') {
                        try {
                            const ranges = Array.isArray(value) ? value : JSON.parse(value as string);
                            if (Array.isArray(ranges) && ranges.length > 0) {
                                setIncomeRanges(ranges);
                                // Update optionsMap with the amount values
                                const incomeOptions = ranges.map(range => range.amount || '');
                                setOptionsMap(prev => ({
                                    ...prev,
                                    annualIncome: incomeOptions
                                }));
                            }
                        } catch (error) {
                            console.error('Error processing annual income data:', error);
                        }
                    }


                    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                        try {
                            value = JSON.parse(value);
                            console.log(`${key} parsed value:`, value);
                        } catch (e) {
                            console.error('Error parsing JSON:', e);
                            continue; // Skip to next key if parsing fails
                        }
                    }

                    // Process the array based on its content type
                    let processedArray: string[] = [];

                    if (Array.isArray(value)) {
                        if (value.length > 0) {
                            // Handle different response formats
                            const firstItem = value[0];
                            console.log(`First item of ${key}:`, firstItem);

                            // For array of objects with name (education, star)
                            if (firstItem.name) {
                                processedArray = value.map((item: any) => item.name);
                            }
                            // For array of objects with label/value (city)
                            else if (firstItem.label && firstItem.value) {
                                processedArray = value.map((item: any) => item.label);
                            }
                            // For array of objects with displayValue (height)
                            else if (firstItem.displayValue) {
                                processedArray = value.map((item: any) => item.displayValue);
                            }
                            else if (firstItem.amount) {
                                processedArray = value.map((item: any) => item.amount);
                            }

                            // For array of objects with from/to (age, other numeric ranges)
                            else if (firstItem && typeof firstItem === 'object' && 'from' in firstItem && 'to' in firstItem) {
                                processedArray = value.map((item: any) => {
                                    if (item.label) return item.label;
                                    if (item.from === null && item.to === null) return 'Any';
                                    if (item.to === null) return `Above ${item.from} Yrs`;
                                    return `${item.from} Yrs - ${item.to} Yrs`;
                                });
                            }
                            // For simple string arrays (dosham, education)
                            else if (typeof firstItem === 'string') {
                                processedArray = [...value];
                            }
                            // For array of objects with different structure
                            else if (typeof firstItem === 'object') {
                                processedArray = value.map((item: any) => {
                                    return item.name || item.label || item.value || JSON.stringify(item);
                                });
                            }
                        }
                    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                        // Handle case where value is a single object
                        processedArray = [value.name || value.label || value.value || ''];
                    }

                    console.log(`${key} processed array:`, processedArray);

                    // Update the options map with the processed array
                    setOptionsMap(prev => ({
                        ...prev,
                        [key]: processedArray.length > 0 ? processedArray : prev[key as keyof typeof prev]
                    }));

                    // Special handling for education to maintain backward compatibility
                    if (key === 'education' && processedArray.length > 0) {
                        console.log("Raw education data:", processedArray);

                        // Process education data to extract degree values
                        const educationOptions = processedArray.map(item => {
                            try {
                                // If item is a string that looks like JSON, parse it
                                if (typeof item === 'string' && (item.startsWith('{') || item.startsWith('['))) {
                                    const parsed = JSON.parse(item);
                                    return parsed.degree || parsed.name || item;
                                }
                                // If item is an object, try to get degree or name
                                else if (typeof item === 'object' && item !== null) {
                                    return item.degree || item.name || JSON.stringify(item);
                                }
                                return item;
                            } catch (e) {
                                console.error('Error parsing education item:', e);
                                return item;
                            }
                        });

                        console.log("Processed education options:", educationOptions);

                        // Update both education state and optionsMap with processed data
                        setEducation(educationOptions);
                        setOptionsMap(prev => ({
                            ...prev,
                            education: educationOptions
                        }));
                    }
                } catch (error) {
                    console.error(`Error processing ${key}:`, error);
                }
            }
        };

        fetchKeyValues();
    }, []);

    const handleProfileIdSearch = async () => {
        try {
            if (!profileId.trim()) {
                Alert.alert('Error', 'Please enter a profile ID');
                return;
            }

            const casteId = await AsyncStorage.getItem('casteId');
            const gender = await AsyncStorage.getItem('gender');

            if (!casteId && !gender) {
                throw new Error('User data not found');
            }

            console.log('Profile ID:', profileId);
            console.log('Gender:', gender);
            console.log('Caste ID:', casteId);


            const response = await userApi.getProfileDetailByMemberId(profileId, gender == 'M' ? 'F' : 'M', casteId);

            if (response.data && response.data.status === 'SUCCESS') {
                // Navigate to search results with the profile data
                router.push({
                    pathname: '/(root)/screens/SearchResult',
                    params: {
                        searchResults: JSON.stringify([response.data.data]) // Wrap in array to match expected format
                    }
                });
            } else {
                Alert.alert('Not Found', 'No profile found with this ID');
            }
        } catch (error) {
            console.error('Error searching by profile ID:', error);
            Alert.alert('Error', 'Failed to search profile. Please try again.');
        }
    };



    const DropdownModal = ({
        visible,
        onClose,
        options = [],
        selectedValue,
        onSelect,
        title
    }: {
        visible: boolean;
        onClose: () => void;
        options?: string[];
        selectedValue: string;
        onSelect: (value: string) => void;
        title: string;
    }) => (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>

                    <ScrollView>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={`${option}-${index}`}
                                style={[
                                    styles.modalOption,
                                    selectedValue === option && styles.selectedOption,
                                ]}
                                onPress={() => {
                                    onSelect(option);
                                    onClose();
                                }}
                            >
                                <Text
                                    style={[
                                        styles.modalOptionText,
                                        selectedValue === option && styles.selectedOptionText,
                                    ]}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <Text style={styles.modalCloseText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

    );

    const renderTabContent = () => {
        if (activeTab === 'profile') {
            return (
                <View style={styles.cardContainer}>
                    <View style={styles.filterCard}>
                        <Text style={styles.sectionHeader}>Profile Search</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Profile ID</Text>
                            <View style={styles.inputField}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Profile ID"
                                    placeholderTextColor="#999"
                                    value={profileId}
                                    onChangeText={setProfileId}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            );
        }

        if (activeTab === 'saved') {
            return (
                <ScrollView style={{ flex: 1, padding: 5, backgroundColor: '#F9FAFB' }}>
                    {/* <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
                        Saved Searches
                    </Text> */}

                    {loading ? (
                        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 24 }} />
                    ) : savedSearches.length > 0 ? (
                        savedSearches.map((search) => (
                            <View key={search.id} style={styles.savedSearchCard}>
                                <View style={styles.searchHeader}>
                                    <View style={styles.titleContainer}>
                                        <Text
                                            style={styles.searchName}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {search.searchName}
                                        </Text>
                                        <Text style={styles.searchDate}>
                                            {new Date(search.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>

                                    <View style={styles.actionsContainer}>
                                        <TouchableOpacity
                                            onPress={() => handleUseSearch(search)}
                                            style={[styles.actionButton, styles.searchButton]}
                                        >
                                            <Feather name="search" size={16} color="#4F46E5" />
                                            <Text style={[styles.actionButtonText, { color: '#4F46E5' }]}>
                                                Use
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleDelete(search.id)}
                                            style={[styles.actionButton, styles.deleteButton]}
                                        >
                                            <Feather name="trash-2" size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.filtersContainer}>
                                    {search.filters.map((filter) => (
                                        <View key={filter.id} style={styles.filterChip}>
                                            <Feather name="filter" size={12} color="#6B7280" />
                                            <Text style={styles.filterText} numberOfLines={1}>
                                                {filter.filterKey}: {filter.filterValue}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Feather name="search" size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
                            <Text style={styles.emptyStateText}>No saved searches yet</Text>
                            <Text style={styles.emptyStateSubtext}>
                                Save your searches to quickly access them later
                            </Text>
                        </View>
                    )}
                </ScrollView>
            );
        }

        // Default tab (criteria)
        return (
            <View style={styles.cardContainer}>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                        // Reset all filters to default values
                        setFilters({
                            ageRange: '28 Yrs - 32 Yrs',
                            profileCreatedBy: 'Any',
                            subcaste: 'Any',
                            education: '',
                            city: '',
                            star: '',
                            dosham: '',
                            annualIncomeFilter: '',
                            jobSector: '',
                            degree: '',
                        });
                        // Reset toggle switches
                        setPhotoOnly(false);
                        setHoroscopeOnly(false);
                    }}
                >
                    <Feather name="x-circle" size={16} color="#666" />
                    <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
                <View style={styles.filterCard}>

                    <TouchableOpacity
                        style={styles.sectionHeaderContainer}
                        onPress={() => toggleSection('basic')}
                    >
                        <Text style={styles.sectionHeader}>Basic Details</Text>
                        <ChevronDown
                            size={20}
                            color="#420001"
                            style={[
                                styles.chevronIcon,
                                expandedSections.basic && styles.chevronRotated,
                            ]}
                        />
                    </TouchableOpacity>

                    <View style={styles.filterContent}>
                        {expandedSections.basic && (
                            <View style={{ marginBottom: 35 }}>
                                <View style={styles.filterRow}>
                                    <Text style={styles.filterLabel}>Age</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowAgeModal(true)}
                                    >
                                        <Text style={styles.dropdownText}>{filters.ageRange}</Text>
                                        <ChevronDown size={16} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                {/* <View style={styles.filterRow}>
                                    <Text style={styles.filterLabel}>Height</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowHeightModal(true)}
                                    >
                                        <Text style={styles.dropdownText}>{filters.heightRange}</Text>
                                        <ChevronDown size={16} color="#666" />
                                    </TouchableOpacity>
                                </View> */}

                                {/* <View style={styles.filterRow}>
                                    <Text style={styles.filterLabel}>Profile Created By</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowProfileCreatedModal(true)}
                                    >
                                        <Text style={styles.dropdownText}>{filters.profileCreatedBy}</Text>
                                        <ChevronDown size={16} color="#666" />
                                    </TouchableOpacity>
                                </View> */}

                                <View>
                                    <HStack alignItems="center" space={2}>
                                        <Text style={styles.filterLabel}>Profile with photos only</Text>
                                        <Switch
                                            size="sm"
                                            value={photoOnly}
                                            onValueChange={setPhotoOnly}
                                            trackColor={{ false: "#767577", true: "#420001" }}
                                            thumbColor={photoOnly ? "#f5dd4b" : "#f4f3f4"}
                                        />
                                    </HStack>
                                </View>
                            </View>
                        )}



                        {/* ------Job Details ---- */}

                        <TouchableOpacity
                            style={styles.sectionHeaderContainer}
                            onPress={() => toggleSection('job')}
                        >
                            <Text style={styles.sectionHeader}>Job Details</Text>
                            <ChevronDown
                                size={20}
                                color="#420001"
                                style={[
                                    styles.chevronIcon,
                                    expandedSections.job && styles.chevronRotated,
                                ]}
                            />
                        </TouchableOpacity>
                        <Divider my={2} height={'0.5px'} bg="gray.200" />

                        {expandedSections.job && (

                            <View style={{ marginBottom: 35 }}>

                                <View style={styles.filterRow}>
                                    <Text style={styles.filterLabel}>Education  {!isPremiumUser && (
                                        <Text
                                            style={styles.lockIcon}
                                            onPress={() => setShowUpgradeModal(true)}
                                        >
                                            {' '}🔒
                                        </Text>
                                    )}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => {
                                            if (!isPremiumUser) {
                                                setShowUpgradeModal(true);
                                            } else {
                                                setShowEducationModal(true);
                                            }
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {filters.education || 'Select Education'}
                                        </Text>
                                        <ChevronDown size={16} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.filterRow}>
                                    <Text style={styles.filterLabel}>Annual Income</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowIncomeModal(true)}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {filters.annualIncomeFilter || 'Select Income'}
                                        </Text>
                                        <ChevronDown size={16} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                {/* <View style={{ ...styles.filterRow }}>
                                    <Text style={styles.filterLabel}>
                                        City / District
                                        {!isPremiumUser && (
                                            <Text
                                                style={styles.lockIcon}
                                                onPress={() => setShowUpgradeModal(true)}
                                            >
                                                {' '}🔒
                                            </Text>
                                        )}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => {
                                            if (!isPremiumUser) {
                                                setShowUpgradeModal(true);
                                            } else {
                                                setShowCityModal(true);
                                            }
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {filters.city || 'Select City'}
                                        </Text>
                                        <ChevronDown size={16} color="#666" />
                                    </TouchableOpacity>
                                </View> */}
                                <View style={styles.filterRow}>
                                    <Text style={styles.filterLabel}>Job Sector</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowJobSectorModal(true)}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {filters.jobSector || 'Select Job Sector'}
                                        </Text>
                                        <ChevronDown size={16} color="#666" />
                                    </TouchableOpacity>
                                </View>


                            </View>
                        )}
                        {/* ------Religious Details ---- */}
                        <TouchableOpacity
                            style={styles.sectionHeaderContainer}
                            onPress={() => toggleSection('religious')}
                        >
                            <Text style={styles.sectionHeader}>Religious Details</Text>
                            <ChevronDown
                                size={20}
                                color="#420001"
                                style={[
                                    styles.chevronIcon,
                                    expandedSections.religious && styles.chevronRotated,
                                ]}
                            />
                        </TouchableOpacity>

                        {expandedSections.religious && (
                            <View style={{ marginBottom: 35 }}>
                                <View style={{ ...styles.filterRow, marginTop: 10 }}>
                                    <Text style={styles.filterLabel}>
                                        Star
                                        {!isPremiumUser && (
                                            <Text
                                                style={styles.lockIcon}
                                                onPress={() => setShowUpgradeModal(true)}
                                            >
                                                {' '}🔒
                                            </Text>
                                        )}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => {
                                            if (!isPremiumUser) {
                                                setShowUpgradeModal(true);
                                            } else {
                                                setShowStarModal(true);
                                            }
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {filters.star || 'Select Star'}
                                        </Text>
                                        <ChevronDown size={16} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                <View style={{ ...styles.filterRow }}>
                                    <Text style={styles.filterLabel}>
                                        Dosham
                                        {!isPremiumUser && (
                                            <Text
                                                style={styles.lockIcon}
                                                onPress={() => setShowUpgradeModal(true)}
                                            >
                                                {' '}🔒
                                            </Text>
                                        )}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => {
                                            if (!isPremiumUser) {
                                                setShowUpgradeModal(true);
                                            } else {
                                                setShowDoshamModal(true);
                                            }
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {filters.dosham || 'Select Dosham'}
                                        </Text>
                                        <ChevronDown size={16} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                <View style={{ ...styles.filterRow }}>
                                    <Text style={styles.filterLabel}>
                                        Profile with Horoscope only
                                        {!isPremiumUser && (
                                            <Text
                                                style={styles.lockIcon}
                                                onPress={() => setShowUpgradeModal(true)}
                                            >
                                                {' '}🔒
                                            </Text>
                                        )}
                                    </Text>
                                    <Switch
                                        size="sm"
                                        value={horoscopeOnly}
                                        onValueChange={(value) => {
                                            if (!isPremiumUser) {
                                                setShowUpgradeModal(true);
                                            } else {
                                                setHoroscopeOnly(value);
                                            }
                                        }}
                                        disabled={!isPremiumUser}
                                        trackColor={{ false: "#767577", true: "#420001" }}
                                        thumbColor={horoscopeOnly ? "#f5dd4b" : "#f4f3f4"}
                                    />
                                </View>
                            </View>

                        )}
                    </View>
                </View>

                {/* Upgrade to Premium Modal */}
                <Modal
                    visible={showUpgradeModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowUpgradeModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>🔒 Premium Feature</Text>
                            <Text style={styles.modalText}>
                                Upgrade to Premium to access advanced search filters.
                            </Text>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setShowUpgradeModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.upgradeButton]}
                                    onPress={() => {
                                        // Handle upgrade navigation
                                        // router.push('/premium');
                                        setShowUpgradeModal(false);
                                    }}
                                >
                                    <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>


        );
    };


    useEffect(() => {
        // Open accordion when screen mounts
        setExpanded(true);
    }, []);

    const speed = 300; // Animation speed

    useEffect(() => {
        const getRandomUsers = async () => {
            try {
                const response = await userApi.getRandomUsers("F", 1);
                const rawData = response.data.data;
                setProfiles(response.data.data);
                // console.log("rawData=======================>", rawData);
            } catch (error: any) {
                console.error('API call error:', error);
            }
        };
        getRandomUsers();
    }, []);

    const handleFindPress = async () => {
        // console.log("minSalary=======================>", minSalaryText);
        // console.log("maxSalary=======================>", maxSalaryText);

        const parsedMinSalary = parseInt(minSalaryText);
        const parsedMaxSalary = parseInt(maxSalaryText);

        const request = {
            minAge: parseInt(minAgeText),
            maxAge: parseInt(maxAgeText),
            minAnnualIncome: (parsedMinSalary === 0 ? "1" : parsedMinSalary.toString()) + '00000',
            maxAnnualIncome: (parsedMaxSalary === 0 ? "20" : parsedMaxSalary.toString()) + '00000',
            occupation: selectedEducation && selectedEducation.trim() !== '' ? selectedEducation : null,
            location: selectedCity && selectedCity.trim() !== '' ? selectedCity : null,
            employedAt: value === "one" ? "GOVT" : "PRIVATE",
            profileImageStatus: photoOnly ? 'Y' : 'N',
            casteId: 1,
            gender: "F"
        };

        try {

            const response = await userApi.filterUsers(request);
            const rawData = response.data.data;
            setProfiles(response.data.data);
            handleDropdownClose();
        } catch (error: any) {
            console.error('API call error:', error);
        }
    };

    const handleDropdownClose = () => {
        setIsDropdownOpen(false);
    };


    const [selectedEducation, setSelectedEducation] = useState("");
    const [selectedCity, setSelectedCity] = useState("");


    const [value, setValue] = React.useState('one');

    const [photoOnly, setPhotoOnly] = useState(false);
    const [horoscopeOnly, setHoroscopeOnly] = useState(false);


    return (
        <View style={styles.container1}>
            <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tabInner,
                            activeTab === tab.id && styles.activeTab,
                        ]}
                        onPress={() => setActiveTab(tab.id)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === tab.id && styles.activeTabText,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {renderTabContent()}

                {/* Matches Count */}
                {/* <View style={styles.matchesContainer}>
                    <Text style={styles.matchesText}>
                        {matchesCount.toLocaleString()} matches based on your preferences
                    </Text>
                </View> */}
            </ScrollView>

            <View style={styles.basesearchButtonContainer}>
                <TouchableOpacity onPress={activeTab === 'profile' ? handleProfileIdSearch : handleSearch} style={styles.basesearchButtonWrapper}>
                    <LinearGradient
                        colors={['#420001', '#8B0000', '#420001']}
                        style={styles.basesearchButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.basesearchButtonText}>Search</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <DropdownModal
                visible={showAgeModal}
                onClose={() => setShowAgeModal(false)}
                options={optionsMap.age}
                selectedValue={filters.ageRange}
                onSelect={(value) => setFilters(prev => ({ ...prev, ageRange: value }))}
                title="Select Age Range"
            />

            {/* <DropdownModal
                visible={showHeightModal}
                onClose={() => setShowHeightModal(false)}
                options={optionsMap.height}
                selectedValue={filters.heightRange}
                onSelect={(value) => setFilters(prev => ({ ...prev, heightRange: value }))}
                title="Select Height Range"
            /> */}

            <DropdownModal
                visible={showProfileCreatedModal}
                onClose={() => setShowProfileCreatedModal(false)}
                options={profileCreatedOptions}
                selectedValue={filters.profileCreatedBy}
                onSelect={(value) => setFilters(prev => ({ ...prev, profileCreatedBy: value }))}
                title="Profile Created By"
            />

            {/* <DropdownModal
                visible={showSubcasteModal}
                onClose={() => setShowSubcasteModal(false)}
                options={subcasteOptions}
                selectedValue={filters.subcaste}
                onSelect={(value) => setFilters(prev => ({ ...prev, subcaste: value }))}
                title="Select Subcaste"
            /> */}

            <DropdownModal
                visible={showEducationModal}
                onClose={() => setShowEducationModal(false)}
                options={optionsMap.education || []}
                selectedValue={filters.education || ''}
                onSelect={(value) => {
                    console.log('Selected education:', value);
                    setFilters(prev => ({ ...prev, education: value }));
                }}
                title="Select Education"
            />

            {/* <DropdownModal
                visible={showCityModal}
                onClose={() => setShowCityModal(false)}
                options={optionsMap.city}
                selectedValue={filters.city || ''}
                onSelect={(value) => setFilters(prev => ({ ...prev, city: value }))}
                title="Select City / District"
            /> */}

            <DropdownModal
                visible={showStarModal}
                onClose={() => setShowStarModal(false)}
                options={optionsMap.star}
                selectedValue={filters.star || ''}
                onSelect={(value) => setFilters(prev => ({ ...prev, star: value }))}
                title="Select Star"
            />

            <DropdownModal
                visible={showDoshamModal}
                onClose={() => setShowDoshamModal(false)}
                options={optionsMap.dosham}
                selectedValue={filters.dosham}
                onSelect={(value) => setFilters(prev => ({ ...prev, dosham: value }))}
                title="Select Dosham"
            />

            <DropdownModal
                visible={showIncomeModal}
                onClose={() => setShowIncomeModal(false)}
                options={optionsMap.annualIncome}
                selectedValue={filters.annualIncomeFilter}
                onSelect={(value) => setFilters(prev => ({ ...prev, annualIncomeFilter: value }))}
                title="Select Annual Income"
            />

            <DropdownModal
                visible={showJobSectorModal}
                onClose={() => setShowJobSectorModal(false)}
                options={optionsMap.jobSector}
                selectedValue={filters.jobSector}
                onSelect={(value) => setFilters(prev => ({ ...prev, jobSector: value }))}
                title="Select Job Sector"
            />


        </View>
    );
};

// Find Partner Tab
const FindPartner = () => {
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'all', title: 'All Matches' },
        { key: 'new', title: 'Newly Added' },
    ]);

    const [allMatches, setAllMatches] = useState<any[]>([]);
    const [newlyAdded, setNewlyAdded] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAllMatches = async (casteId: number, gender: string) => {
        try {
            const response = await userApi.getAllCasteProfilesByGender(casteId, gender);
            setAllMatches(response.data.data);
        } catch (error) {
            console.error('Error fetching all matches:', error);
        }
    };

    const fetchNewlyAdded = async (casteId: number, gender: string) => {
        try {
            const response = await userApi.getNewConnections(casteId, gender);
            setNewlyAdded(response.data.data);
        } catch (error) {
            console.error('Error fetching newly added:', error);
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedGender = await AsyncStorage.getItem('gender');
                const casteId = await AsyncStorage.getItem('casteId');

                if (!storedGender || !casteId) {
                    console.warn("Gender or casteId missing");
                    return;
                }

                await fetchAllMatches(parseInt(casteId), storedGender);
                await fetchNewlyAdded(parseInt(casteId), storedGender);
            } catch (error) {
                console.error('Error in fetchData:', error);
            }
        };

        fetchData();
    }, []);


    const renderScene = ({ route }: { route: { key: string; title: string } }) => {
        const data = route.key === 'all' ? allMatches : newlyAdded;
        return (
            <View style={[styles.sceneTab]}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.userId.toString()}
                    numColumns={2}
                    contentContainerStyle={styles.containerProfle}
                    columnWrapperStyle={styles.rowProfile}
                    renderItem={({ item }) => (
                        <View style={styles.cardWrapper}>
                            <TouchableOpacity
                                onPress={() => {
                                    router.push({
                                        pathname: '/screens/ProfileDetail',
                                        params: { userId: item.userId }
                                    });
                                }}
                            >
                                <ExploreProfileCard
                                    imageUrl={item.profileImage}
                                    name={item.firstName}
                                    age={item.age}
                                    job={item.userDetail?.[0]?.occupation || ''}
                                    location={item.location}
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                            <Text style={{ color: 'gray' }}>
                                {route.key === 'all' ? 'No matches found' : 'No newly added profiles'}
                            </Text>
                        </View>
                    )}
                />
            </View>
        );
    };

    return (
        <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            style={{ marginTop: 25 }}
            renderTabBar={props => (
                <TabBar
                    {...props}
                    style={styles.tabBarTab}
                    indicatorStyle={styles.indicatorTab}
                    activeColor="#FFFFFF"
                    inactiveColor="#A0A0A0"
                />
            )}
            onIndexChange={setIndex}
            initialLayout={{ width: useWindowDimensions().width }}
        />
    );
};

// Tab View Component
const ExploreTabs = () => {
    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
    const [swipeEnabled, setSwipeEnabled] = useState(true); // Control swipe

    const [routes] = useState([
        { key: "search", title: "Search" },
        { key: "partner", title: "Explore" },
    ]);

    const renderScene = ({ route }: { route: { key: string; title: string } }) => {
        switch (route.key) {
            case "search":
                return <Search setSwipeEnabled={setSwipeEnabled} />;
            case "partner":
                return <FindPartner />;
            default:
                return null;
        }
    };

    return (
        <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={(props) => (
                <TabBar
                    {...props}
                    style={styles.tabBar}
                    indicatorStyle={styles.indicator}
                    tabStyle={styles.tabInner}
                    activeColor="#FFFFFF"
                    inactiveColor="#A0A0A0"
                />
            )}
            swipeEnabled={swipeEnabled} // Dynamically enable/disable swipe
        />
    );
};

export default ExploreTabs;

const styles = StyleSheet.create({
    modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#555',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    gradientBackground: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    },
    containerProfle: {
        padding: 8,
    },
    rowProfile: {
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    cardWrapper: {
        flex: 1,
        margin: 4,
    },
    tabBarTab: {
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    indicatorTab: {
        backgroundColor: '#420001',
        height: '100%',
        borderRadius: 4,
    },
    tabLabelTab: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    sceneTab: {
        backgroundColor: "#FFFFFF",
        marginTop: 0,
        flex: 1,
        alignItems: "center",
    },
    ageFilterContainer: {
        marginTop: 16,
        gap: 8,
    },
    ageLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ageLabelText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#420001',
    },
    ageInputContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    ageInputWrapper: {
        flex: 1,
    },
    ageInput: {
        borderWidth: 2,
        borderColor: '#E3E3E3',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    salaryFilterContainer: {
        marginTop: 16,
        gap: 8,
    },
    salaryLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    salaryLabelText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#420001',
    },
    salaryInputContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    salaryInputWrapper: {
        flex: 1,
    },
    salaryInput: {
        borderWidth: 2,
        borderColor: '#E3E3E3',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    // tabBarTab: {
    //   backgroundColor: '#fff',
    //   elevation: 4,
    //   shadowColor: '#000',
    //   shadowOffset: { width: 0, height: 2 },
    //   shadowOpacity: 0.1,
    //   shadowRadius: 4,
    // },
    // indicatorTab: {
    //   backgroundColor: '#9C27B0',
    //   height: '100%',
    //   borderRadius: 4,
    // },
    // tabLabelTab: {
    //   color: '#fff',
    //   fontSize: 16,
    //   fontWeight: '500',
    // },
    scene: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        marginTop: 25,
    },
    // sceneTab:{
    //   backgroundColor: "#FFFFFF",
    //   marginTop: 0,
    //   flex: 1,
    //   alignItems: "center",
    //   // backgroundColor: "#FFFFFF",
    //   // marginTop: 30,
    // },
    profileWphototext: {
        fontSize: 15,
        fontWeight: 'bold',
        // color:"#"
    },
    tabBar: {
        backgroundColor: "#F5F5F5",
        borderRadius: 30,
        marginHorizontal: 70,
        height: 45,
        borderColor: "#130057",
        borderWidth: 0,
        justifyContent: "center",
        alignItems: "center",
        // Android shadow
        elevation: 10,
        // iOS shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    tab: {
        marginHorizontal: 5,
    },
    indicator: {
        backgroundColor: "#420001",
        height: "100%",
        borderRadius: 30,
    },
    accordionContainer: {
        width: "98%",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        backgroundColor: "white",
        shadowOffset: { height: -2, width: 0 },
        elevation: 2,
        shadowRadius: 20,
        shadowOpacity: 0.07,
        overflow: "hidden",

    },
    header: {
        backgroundColor: "#130057",
        // background: "linear-gradient(0deg, rgba(0, 0, 28, 1) 0%, rgba(19, 0, 87, 1) 30%, rgba(30, 64, 175, 1) 72%, rgba(30, 64, 175, 1) 100%, rgba(0, 0, 0, 1) 100%)",
        padding: 10,
        borderBottomLeftRadius: '100%',
        borderBottomRightRadius: '100%',
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        borderTopWidth: 2,
        borderColor: "#FFFFFF",
        width: '65%',
        alignSelf: 'center',
        marginBottom: 5
    },
    headerText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    content: {
        width: "100%",
        padding: 10,
        // backgroundColor: "#130057",
        // borderWidth:2
    },
    findButton: {
        marginTop: 15,
        backgroundColor: "#FFFFFF",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        width: "50%",
        left: "25%",
        marginBottom: 15,

    },
    buttonText: {
        color: "#130057",
        fontSize: 16,
        fontWeight: "bold",
    },
    sliderLabel: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 5,
    },
    slider: {
        width: "100%",
        height: 40,
    },
    thumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#130057",
    },
    rail: {
        flex: 1,
        height: 4,
        backgroundColor: "#ccc",
        borderRadius: 2,
    },
    railSelected: {
        height: 4,
        backgroundColor: "#130057",
        borderRadius: 2,
    },
    labelContainer: {
        padding: 5,
        backgroundColor: "#130057",
        borderRadius: 4,
        alignItems: "center",
    },
    labelText: {
        color: "white",
        fontSize: 12,
    },
    notch: {
        width: 8,
        height: 8,
        backgroundColor: "#130057",
        borderRadius: 4,
    },
    container: { padding: 5, paddingLeft: 0 },
    title: { fontSize: 15, fontWeight: "semibold" },
    dropdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // optional, aligns items vertically
        width: '100%',
        marginVertical: 4,
        // marginBottom:20,
    },

    educationDropdown: {
        width: '100%',
    },
    cityDropdown: {
        width: '50%',
    },
    jobsect: {
        marginTop: 5,
        marginBottom: 6
    },
    containerProfle: {
        paddingHorizontal: 12,
        paddingTop: 16,
    },
    rowProfile: {
        justifyContent: 'space-between',
        marginBottom: -30, // Overlap amount
    },
    cardWrapper: {
        width: '49%',
        marginBottom: 40, // Allow space for overlap + content
        height: 280
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'visible',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    image: {
        height: 180,
        width: '100%',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        marginBottom: -30, // Overlap next card
        zIndex: 2,
    },
    infoContainer: {
        backgroundColor: '#fff',
        paddingTop: 40,
        paddingHorizontal: 10,
        paddingBottom: 12,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        zIndex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    job: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    educationInputContainer: {
        marginTop: 16,
        gap: 8,
    },
    educationLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    jobSectorLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10
    },
    educationLabelText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#420001',
    },
    educationInputWrapper: {
        flex: 1,
    },
    educationInput: {
        borderWidth: 2,
        borderColor: '#E3E3E3',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },

    //   -----------------------------------------------------------------------new 
    container1: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        marginTop: 20
    },
    headerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    tabInner: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#420001',
    },
    tabText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#420001',
        fontWeight: 'bold',
    },
    contentSearch: {
        flex: 1,
        paddingTop: 20,
    },
    cardContainer: {
        paddingHorizontal: 0,
    },

    filterCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionHeader: {
        color: '#420001',
        fontSize: 16,
        fontWeight: 'bold',
    },
    chevronIcon: {
        transform: [{ rotate: '0deg' }],
    },
    chevronRotated: {
        transform: [{ rotate: '180deg' }],
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    filterLabel: {
        color: '#333',
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
        minWidth: 140,
        justifyContent: 'space-between',
    },
    dropdownText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
    expandedContent: {
        marginTop: 10,
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingVertical: 8,
    },
    viewMoreText: {
        color: '#420001',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    premiumLockCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    lockIconContainer: {
        marginRight: 12,
    },
    premiumTextContainer: {
        flex: 1,
    },
    premiumLockText: {
        color: '#666',
        fontSize: 14,
        lineHeight: 20,
    },
    upgradeNowText: {
        color: '#420001',
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        color: '#333',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputField: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    input: {
        fontSize: 16,
        color: '#333',
    },
    inputPlaceholder: {
        color: '#999',
        fontSize: 14,
    },
    // emptyStateContainer: {
    //     alignItems: 'center',
    //     paddingVertical: 40,
    // },
    // emptyStateText: {
    //     color: '#666',
    //     fontSize: 16,
    //     fontWeight: '500',
    //     marginBottom: 8,
    // },
    // emptyStateSubtext: {
    //     color: '#999',
    //     fontSize: 14,
    //     textAlign: 'center',
    // },
    matchesContainer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        alignItems: 'center',
    },
    matchesText: {
        color: '#420001',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    searchButtonContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingBottom: 70,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    searchButtonWrapper: {
        borderRadius: 25,
        overflow: 'hidden',
        width: '50%'
    },
    searchButton: {
        borderWidth: 1,
        borderColor: '#E0E7FF',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
    },
    searchButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#420001',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalOption: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedOption: {
        backgroundColor: '#420001',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedOptionText: {
        color: 'white',
        fontWeight: '600',
    },
    modalCloseButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    modalCloseText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    filterContent: {
        paddingVertical: 10,
        paddingHorizontal: 0,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 8,
    },
    upgradeButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    upgradeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    cancelButtonText: {
        color: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    lockIcon: {
        color: '#FF9800',
        fontSize: 20,
    },
    savedSearchCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
        width: '100%',
    },
    searchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        width: '100%',
    },
    searchName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    searchDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    filterChip: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '100%',
    },
    filterText: {
        fontSize: 12,
        color: '#4B5563',
        marginLeft: 4,
        maxWidth: '90%',
    },
    filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6B7280',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        borderRadius: 6,
        minWidth: 40,
        height: 32,
    },
    actionButtonText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '500',
    },
    deleteButton: {
        borderWidth: 1,
        borderColor: '#FEE2E2',
        backgroundColor: '#FEF2F2',
        marginLeft: 8,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        marginRight: 8,
    },
    basesearchButtonContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingBottom: 70,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    basesearchButtonWrapper: {
        borderRadius: 25,
        overflow: 'hidden',
        width: '50%'
    },
    basesearchButton: {
        paddingVertical: 13,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    basesearchButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'transparent',
    },
    clearButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
});
