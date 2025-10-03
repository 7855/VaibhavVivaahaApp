import React, { useCallback, useEffect, useRef, useState } from "react";
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
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Box, CheckIcon, Divider, FlatList, HStack, Radio, Select, Stack, Switch } from "native-base";
import { TabView, TabBar } from "react-native-tab-view";
import Expandable from "react-native-reanimated-animated-accordion";
import { Ionicons } from "@expo/vector-icons";
import RangeSlider from "rn-range-slider";
import { Dropdown } from "react-native-element-dropdown";
import DropdownComponent from "../../../components/DropdownComponent";
import ExploreProfileCard from "../../../components/ExploreProfileCard";
import userApi from "@/app/(root)/api/userApi";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Book, Calendar, DollarSign, Briefcase, ChevronDown, ChevronRight } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

const Search: React.FC<SearchProps> = ({ setSwipeEnabled }) => {
    const [profiles, setProfiles] = useState<any>(null);
    const [expanded, setExpanded] = useState(false);
    const [minAgeText, setMinAgeText] = useState("18");
    const [maxAgeText, setMaxAgeText] = useState("50");
    const [minSalaryText, setMinSalaryText] = useState("0");
    const [maxSalaryText, setMaxSalaryText] = useState("20");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [occupation, setOccupation] = useState<any>(null);
    const [occupationOptions, setOccupationOptions] = useState<string[]>([]);

    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [star, setStar] = useState('');
    const [dosham, setDosham] = useState('');
    const [education, setEducation] = useState('');
    const [annualIncome, setAnnualIncome] = useState('');
    const [city, setCity] = useState('');

    const [activeTab, setActiveTab] = useState('criteria');
    const [showAgeModal, setShowAgeModal] = useState(false);
    // const [showHeightModal, setShowHeightModal] = useState(false);
    const [showProfileCreatedModal, setShowProfileCreatedModal] = useState(false);
    // const [showSubcasteModal, setShowSubcasteModal] = useState(false);
    const [showOccupationModal, setShowOccupationModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showStarModal, setShowStarModal] = useState(false);
    const [showDoshamModal, setShowDoshamModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showJobSectorModal, setShowJobSectorModal] = useState(false);
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
        occupation: [] as string[],
        education: [] as string[],
        annualIncome: [] as string[],
        city: [] as string[],
        annualIncomeFilter: [] as string[],
        jobSector: ['Government', 'Private', 'Self Employment', 'Any'],

    });

    const [filters, setFilters] = useState({
        ageRange: '28 Yrs - 32 Yrs',
        heightRange: '5\'4" - 6\'0"',
        profileCreatedBy: 'Any',
        subcaste: 'Any',
        occupation: '',
        city: '',
        star: '',
        dosham: '',
        annualIncomeFilter: '',
        jobSector: '',

    });


    const tabs = [
        { id: 'criteria', label: 'By Criteria' },
        { id: 'profile', label: 'By Profile ID' },
        // { id: 'saved', label: 'Saved Search' },
    ];

    // Age options will be loaded from the API
    const heightOptions = optionsMap.height;
    const profileCreatedOptions = ['Any', 'Parents', 'Self', 'Relatives', 'Guardian'];
    const subcasteOptions = ['Any', 'Brahmin', 'Kshatriya', 'Vaishya', 'Other'];

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
        const [minAnnualIncome, maxAnnualIncome] = filters.annualIncomeFilter
            ? filters.annualIncomeFilter
                .split(' - ')
                .map(s => {
                    const value = parseFloat(s) * 100000; // Convert lacs to actual number
                    return Math.floor(value).toString();
                })
            : ['500000', '2000000']; // Default values if not set
    
        // Map job sector to employedAt format
        const getEmployedAt = () => {
            if (!filters.jobSector) return 'PRIVATE';
            const sector = filters.jobSector.toLowerCase();
            if (sector.includes('government')) return 'GOVT';
            if (sector.includes('private')) return 'PRIVATE';
            if (sector.includes('self')) return 'SELF';
            return 'PRIVATE';
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
            userId: atob(userData.userId) // Default value, replace with actual user ID
        };
    
        // Log the search data in a readable format
        console.log('=== Search Filters ===');
        console.log(JSON.stringify(searchData, null, 2));
        console.log('======================');
    
        return searchData;
    };

    

    const handleSearch = async () => {
        const searchData = await gatherSearchData();
        console.log('Search Data:', JSON.stringify(searchData, null, 2));

        try {
            // Format the request body according to API requirements
            const requestBody = {
                minAge: searchData.minAge || null, // Extract min age from range
                maxAge: searchData.maxAge || null, // Extract max age from range
                minAnnualIncome: searchData.minAnnualIncome || null, // Default value
                maxAnnualIncome: searchData.maxAnnualIncome || null, // Default value
                occupation: searchData.occupation == 'Any' ? null : searchData.occupation,
                location: searchData.location == 'Any' ? null : searchData.location,
                employedAt: searchData.employedAt || 'PRIVATE', // Default value
                profileImageStatus: searchData.profileImageStatus || 'N',
                casteId: searchData.casteId || null, // Default value, you might want to get this from your filters
                gender: searchData.gender || null, // Default value, you might want to get this from your filters
                dosham: searchData.dosham == 'Any' ? null : searchData.dosham,
                star: searchData.star == 'Any' ? null : searchData.star,
                profilesWithHoroscope: searchData.profilesWithHoroscope || 'N',
                userId: searchData.userId || null // You need to get this from your auth context or state
            };

            // console.log('Sending request:', JSON.stringify(requestBody, null, 2));

            // Call the API
            const response = await userApi.filterUsers(requestBody);
            // console.log('Search results:', response.data.data);

            // Navigate to search results with the data
            if(response.data.code == 200){
            router.push({
                pathname: '/(root)/screens/SearchResult',
                params: { searchResults: JSON.stringify(response.data.data) }
            });
            }else if(response.data.code == 404){
                Alert.alert('No profiles found matching your search criteria');
            }else{
                Alert.alert('Something Went Wrong. Please try again.');
            }

        } catch (error) {
            console.error('Error searching profiles:', error);
            // Handle error (show error message to user)
            Alert.alert('Something Went Wrong. Please try again.');
        }
    };

    useEffect(() => {
        // Check if user is premium
        const checkPremiumStatus = async () => {
            try {
                // Replace with your actual API call
                // const response = await userApi.checkPremiumStatus();
                // setIsPremiumUser(response.isPremium);

                // For testing
                setIsPremiumUser(true); // Set to false to test premium features
            } catch (error) {
                console.error('Error checking premium status:', error);
            }
        };

        checkPremiumStatus();
    }, []);

    const toggleSection = useCallback((section: 'basic' | 'religious' | 'job') => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    // Fetch key-value pairs on component mount
    useEffect(() => {
        const fetchKeyValues = async () => {
            // Fetch all required keys
            const keys: (keyof typeof optionsMap)[] = ['occupation', 'city', 'height', 'age', 'star', 'dosham', 'annualIncomeFilter'];

            for (const key of keys) {
                try {
                    console.log(`Fetching ${key}...`);
                    console.log('Making API call to:', `/keyValue/getKeyValueByKey/${key}`);
                    const response = await userApi.getKeyValueByKey(key);
                    console.log(`${key} API Response:`, response.data);

                    let value = response.data.data?.value;

                    // If value is a string that looks like a JSON array, parse it
                    if (typeof value === 'string' && value.trim().startsWith('[')) {
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            console.error('Error parsing JSON:', e);
                        }
                    }

                    // Process the array based on its content type
                    let arr = [];
                    if (Array.isArray(value)) {
                        if (value.length > 0 && typeof value[0] === 'object') {
                            // For array of objects with label (like age data)
                            if (value[0].label) {
                                arr = value.map(item => item.label);
                            }
                            // For array of objects with label/value (like city data)
                            else if (value[0].value) {
                                arr = value.map(item => item.label || item.value);
                            }
                            // For array of objects with name (like occupation data)
                            else if (value[0].name) {
                                arr = value.map(item => item.name);
                            }
                        } else {
                            // For simple string arrays
                            arr = [...value];
                        }
                    }

                    console.log(`${key} processed array:`, arr);

                    setOptionsMap(prev => {
                        const newMap = { ...prev, [key]: arr };
                        console.log('Updated optionsMap:', newMap);
                        return newMap;
                    });

                    if (key === 'occupation') {
                        console.log('Setting occupation state with:==============>', arr);
                        setOccupation(arr);
                    }
                } catch (error) {
                    console.error(`Error fetching ${key}:`, error);
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

        // if (activeTab === 'saved') {
        //     return (
        //         <View style={styles.cardContainer}>
        //             <View style={styles.filterCard}>
        //                 <Text style={styles.sectionHeader}>Saved Searches</Text>
        //                 <View style={styles.emptyStateContainer}>
        //                     <Text style={styles.emptyStateText}>No saved searches yet</Text>
        //                     <Text style={styles.emptyStateSubtext}>
        //                         Save your searches to quickly access them later
        //                     </Text>
        //                 </View>
        //             </View>
        //         </View>
        //     );
        // }

        // Default tab (criteria)
        return (
            <View style={styles.cardContainer}>
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
                                    <Text style={styles.filterLabel}>Occupation  {!isPremiumUser && (
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
                                                setShowOccupationModal(true);
                                            }
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>
                                            {filters.occupation || 'Select Occupation'}
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

                                <View style={{ ...styles.filterRow }}>
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
                                </View>
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
            console.log("request==================================>", request);

            const response = await userApi.filterUsers(request);
            const rawData = response.data.data;
            setProfiles(response.data.data);
            console.log("rawData=======================>", rawData);
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

            <View style={styles.searchButtonContainer}>
                <TouchableOpacity onPress={activeTab === 'profile' ? handleProfileIdSearch : handleSearch} style={styles.searchButtonWrapper}>
                    <LinearGradient
                        colors={['#420001', '#8B0000', '#420001']}
                        style={styles.searchButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.searchButtonText}>Search</Text>
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
                visible={showOccupationModal}
                onClose={() => setShowOccupationModal(false)}
                options={optionsMap.occupation}
                selectedValue={filters.occupation || ''}
                onSelect={(value) => setFilters(prev => ({ ...prev, occupation: value }))}
                title="Select Occupation"
            />

            <DropdownModal
                visible={showCityModal}
                onClose={() => setShowCityModal(false)}
                options={optionsMap.city}
                selectedValue={filters.city || ''}
                onSelect={(value) => setFilters(prev => ({ ...prev, city: value }))}
                title="Select City / District"
            />

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
                options={optionsMap.annualIncomeFilter}
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
    emptyStateContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
    },
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
        paddingVertical: 13,
        paddingHorizontal: 10,
        alignItems: 'center',
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
});
