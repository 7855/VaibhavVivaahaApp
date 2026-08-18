import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFooterClearance } from '@/components/VVMFooterNav';
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
    Modal,
    ActivityIndicator,
    FlatList,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Switch } from "native-base";
import Expandable from "react-native-reanimated-animated-accordion";
import { Feather } from "@expo/vector-icons";
import RangeSlider from "rn-range-slider";
import { Dropdown } from "react-native-element-dropdown";
import DropdownComponent from "../../../components/DropdownComponent";
import userApi from "@/app/(root)/api/userApi";
import { router } from "expo-router";
import { useUserData } from '../contexts/UserDataContext';
import { usePopup } from '../contexts/PopupContext';
import { useMasterData } from '../contexts/MasterDataContext';
import { Briefcase, ChevronDown, User, Sparkles, Search as SearchIcon, Check, SlidersHorizontal } from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubscription } from '../contexts/subscriptionContext';
import { buildUpgradeAction, upgradeMessage } from '../utils/upgradeNavigation';
import AgeRangeSelector from "@/components/AgeRangeSelector";
import RangeSelectorModal from "@/components/RangeSelectorModal";
import { AnyRecord } from "react-native-reanimated/lib/typescript/css/types";
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

type Filters = {
    ageRange: string;
    profileCreatedBy: string;
    subcaste: string[];
    education: string[];
    city: string;
    star: string[];
    dosham: string[];
    annualIncomeFilter: string;
    jobSector: string[];
    degree: string[];  // Changed from string to string[]
};

// Floating bottom tab bar footprint (PremiumNavBar):
// - card height 66 + bottom gap 10 + safe-area bottom inset
const NAV_BAR_FOOTPRINT = 66 + 10;

const Search: React.FC<SearchProps> = ({ setSwipeEnabled }) => {
    const footerPad = useFooterClearance();
    const tabInsets = useSafeAreaInsets();
    const searchBarBottomPad = NAV_BAR_FOOTPRINT + tabInsets.bottom + 12;
    const { userData } = useUserData();
    const popup = usePopup();
    const { getSubcastesForCaste } = useMasterData() || {};
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
    const [viewerHobbies, setViewerHobbies] = useState<string[]>([]);

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
    const [showEducationModal, setShowEducationModal] = useState(false);
    // const [showCityModal, setShowCityModal] = useState(false);
    const [showStarModal, setShowStarModal] = useState(false);
    const [showDoshamModal, setShowDoshamModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    // Silver+ only — a stricter gate than isPremiumUser (Classic+). See the entitlement effect below.
    const [canSearchBySubcaste, setCanSearchBySubcaste] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showJobSectorModal, setShowJobSectorModal] = useState(false);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSearchSubmitting, setIsSearchSubmitting] = useState(false);
    const [fromAge, setFromAge] = useState(18);
    const [toAge, setToAge] = useState(60);
    const [fromIncome, setFromIncome] = useState(0);
    const [toIncome, setToIncome] = useState(100);

    // Stable identity is required here — rn-range-slider's internal effect depends on this
    // callback's reference and re-fires whenever it changes. An inline arrow function gets a new
    // identity every render, so it refires unconditionally on every render (not just user drags),
    // which calls setState here, which re-renders, which creates a new inline function... an
    // infinite "Maximum update depth exceeded" loop. useCallback with a stable (empty) deps array
    // keeps the reference fixed so the effect only actually fires on a real value change.
    const handleAgeSliderChange = useCallback((low: number, high: number) => {
        setFromAge(low);
        setToAge(high);
        setFilters(prev => ({
            ...prev,
            ageRange: low === high ? `${low} Yrs` : `${low} Yrs - ${high} Yrs`
        }));
    }, []);

    const handleIncomeSliderChange = useCallback((low: number, high: number) => {
        setFromIncome(low);
        setToIncome(high);
        setFilters(prev => ({
            ...prev,
            annualIncomeFilter: low === high
                ? (low === 0 ? '0' : low === 99 ? '100L+' : `${low}L`)
                : `${low} Lakhs - ${high} Lakhs`
        }));
    }, []);
    // Add this effect to fetch saved searches
    const [incomeRanges, setIncomeRanges] = useState<Array<{
        id: number;
        from: number | null;
        to: number | null;
        amount: string;
    }>>([]);
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
        ageRange: '',
        profileCreatedBy: 'Any',
        subcaste: [] as string[],
        education: [] as string[],
        city: '',
        star: [] as string[],
        dosham: [] as string[],
        annualIncomeFilter: '',
        jobSector: [] as string[],
        degree: '',
    });

    const tabs = [
        { id: 'criteria', label: 'By Criteria' },
        { id: 'profile', label: 'By Profile ID' },
        { id: 'saved', label: 'Saved Search' },
    ];

    // Age options will be loaded from the API
    const profileCreatedOptions = ['Any', 'Parents', 'Self', 'Relatives', 'Guardian'];

    // Subcaste filter — only ever offers subcastes of the searching user's OWN caste, since
    // every search is already scoped to `userData.casteId`. The `subcastes` table is empty
    // When a caste has no subcastes the whole chip row stays unrendered.
    const subcasteList = useMemo(
        () => (getSubcastesForCaste?.(userData.casteId) || []) as any[],
        [getSubcastesForCaste, userData.casteId]
    );

    const gatherSearchData = async () => {
        console.log("filters==>", filters);

        if (!userData.gender || !userData.casteId || !userData.userId) {
            throw new Error('User data not found');
        }

        // Parse age range (format: "18 Yrs - 57 Yrs"). An untouched slider must mean
        // "no age preference" — the full 18–60 span — not a hidden 28–32 filter.
        const [minAge, maxAge] = filters.ageRange
            ? filters.ageRange
                .split(' - ')
                .map(s => s.split(' ')[0])
            : ['18', '60'];

        // Parse income range (format: "2 Lakhs - 9 Lakhs")
        let minAnnualIncome: string | null = null;
        let maxAnnualIncome: string | null = null;
        if (filters.annualIncomeFilter) {
            const [min, max] = filters.annualIncomeFilter
                .split(' - ')
                .map(s => parseFloat(s.split(' ')[0]));
            minAnnualIncome = (min * 100000).toString();
            maxAnnualIncome = (max * 100000).toString();
        }

        // Map job sector to employedAt format
        const getEmployedAt = () => {
            if (!filters.jobSector || filters.jobSector.length === 0) return null;
            return filters.jobSector.map(sector => {
                const s = sector.toLowerCase();
                if (s.includes('government') || s.includes('govt')) return 'GOVT';
                if (s.includes('private')) return 'PRIVATE';
                if (s.includes('no job') || s.includes('unemployed')) return 'UNEMPLOYED';
                if (s.includes('self')) return 'SELF';
                return s.toUpperCase();
            });
        };

        const searchData = {
            minAge,
            maxAge,
            minAnnualIncome,
            maxAnnualIncome,
            occupation: null,
            location: filters.city || null,
            employedAt: getEmployedAt(),
            degree: filters.education.length > 0 ? filters.education : null,
            star: filters.star.length > 0 ? filters.star : null,
            dosham: filters.dosham.length > 0 ? filters.dosham : null,
            profileImageStatus: photoOnly ? 'Y' : 'N',
            // Was hardcoded to 'N' ("or based on your filter") — the "Profile with Horoscope only"
            // switch below is real state, is restored by handleUseSearch, and is premium-gated,
            // but its value never reached the payload. So the filter did nothing on search AND
            // never persisted: SearchResult only saves this key when it equals 'Y'.
            profilesWithHoroscope: horoscopeOnly ? 'Y' : 'N',
            casteId: userData.casteId,
            // Multi-select: the picked names are resolved to the numeric ids the backend expects.
            // An empty selection sends null (= no subcaste filter), matching how degree/star/dosham
            // signal "unset" — the backend's COALESCE(:subcasteIds) IS NULL check relies on that.
            subcasteIds: filters.subcaste.length > 0
                ? subcasteList
                    .filter((sc: any) => filters.subcaste.includes(sc.subcasteName))
                    .map((sc: any) => sc.id)
                : null,
            gender: userData.gender === 'M' ? 'F' : 'M',
            userId: atob(userData.userId),
        };

        console.log('=== Search Data ===');
        console.log(JSON.stringify(searchData, null, 2));
        console.log('===================');

        return searchData;
    };


    // Fetch viewer's hobbies once on mount for shared-interest computation
    useEffect(() => {
        if (userData.userId) {
            userApi.getUserHobbies(userData.userId).then((res: any) => {
                if (res.data?.code === 200 && res.data?.data?.hobbies) {
                    setViewerHobbies(res.data.data.hobbies);
                }
            }).catch(() => { });
        }
    }, [userData.userId]);

    useEffect(() => {
        const fetchSavedSearches = async () => {
            try {
                const userId = userData.userId;
                if (!userId) return;

                const decodedUserId = atob(userId);
                const response = await userApi.getAllUserSavedSearches(decodedUserId);
                // console.log("response.data====>", response.data);


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



    const handleClearFilters = () => {
        // Reset all filters to default values
        setFilters({
            ageRange: '',
            profileCreatedBy: 'Any',
            subcaste: [] as string[],
            // These four are typed (and used) as string[] — resetting them to '' left the state
            // lying about its own shape. Every read site had to defend with Array.isArray(...)
            // to avoid a string's .includes() doing substring matching instead of membership.
            education: [] as string[],
            city: '',
            star: [] as string[],
            dosham: [] as string[],
            annualIncomeFilter: '',
            jobSector: [] as string[],
            degree: '',
        });
        // Reset toggle switches
        setPhotoOnly(false);
        setHoroscopeOnly(false);
    };

    const handleSearch = async () => {
        const searchData = await gatherSearchData();
        // console.log('Search Data:', JSON.stringify(searchData, null, 2));
        // console.log("searchData.minAnnualIncome ", searchData.minAnnualIncome);

        setIsSearchSubmitting(true);
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
                subcasteIds: searchData.subcasteIds || null, // Optional — null/empty means "any subcaste"
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
                        searchCriteria: JSON.stringify(requestBody),
                        // Sent separately rather than inside requestBody, which is the exact body
                        // POSTed to filterUsers — adding a field there risks the backend DTO
                        // rejecting an unknown property. Saved searches store subcaste by NAME
                        // (like Education/Star/Dosham) because names are what the filter UI
                        // restores into; requestBody only carries the resolved numeric ids.
                        subcasteNames: JSON.stringify(filters.subcaste || [])
                    }
                });
            } else if (response.data.code == 404) {
                popup.error('No Profiles Found', 'No profiles found matching your search criteria.');
            } else {
                popup.error('Something Went Wrong', 'Please try again.');
            }

        } catch (error) {
            console.error('Error searching profiles:', error);
            // Handle error (show error message to user)
            popup.error('Something Went Wrong', 'Please try again.');
        } finally {
            setIsSearchSubmitting(false);
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

            // Subcaste search is a SEPARATE, higher gate than the other advanced filters:
            // ADV_SEARCH is Classic+, SUBCASTE_SEARCH is Silver+. Keyed off its own entitlement
            // (backend feature code SUBCASTE_SEARCH -> camelCase) so moving it to another tier is
            // a planFeatures data change, not an app release. The server enforces this too — the
            // filter is ignored there for non-entitled users, so this gate is UX, not security.
            setCanSearchBySubcaste(subscriptionData.entitlements.subcasteSearch === true);
        } else {
            // console.log("No subscription data or entitlements found");
            setIsPremiumUser(false);
            setCanSearchBySubcaste(false);
        }
        // console.log("hasPremiumAccess ===>", isPremiumUser);

    }, [subscriptionData]);


    const handleUseSearch = async (savedSearch: any) => {
        try {
            console.log("savedSearch=>", savedSearch);

            // Check for premium features — profilesWithHoroscope is saved on EVERY search
            // (defaults to the string 'N', which is truthy in JS, so the save flow always
            // includes this filter key even when the user never opted into horoscope-only
            // filtering). Checking mere key presence flagged every saved search as "premium",
            // blocking Starter/Free users from using even a plain age/income search. Only treat
            // it as an actual premium selection when its value is 'Y'.
            const hasPremiumFeatures = savedSearch.filters.some((filter: any) =>
                ['Star', 'Dosham', 'Education'].includes(filter.filterKey) ||
                (filter.filterKey === 'profilesWithHoroscope' && filter.filterValue === 'Y')
            );

            // Subcaste is gated SEPARATELY: SUBCASTE_SEARCH is Silver+, a higher tier than the
            // ADV_SEARCH (Classic+) that isPremiumUser represents. Folding it into the list above
            // would let a Classic member load a saved search with subcaste chips selected that the
            // backend then silently ignores for them.
            const usesSubcaste = savedSearch.filters.some((filter: any) => filter.filterKey === 'Subcaste');
            if (usesSubcaste && !canSearchBySubcaste) {
                popup.premiumRequired(
                    upgradeMessage('use saved searches that filter by subcaste', 'Silver'),
                    buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Subcaste Search', minPlan: 'Silver' })
                );
                return;
            }

            if (hasPremiumFeatures && !isPremiumUser) {
                popup.premiumRequired(
                    'This search includes premium filters. Upgrade to Premium to use horoscope, education, and dosham filters.',
                    buildUpgradeAction({ planTitle: subscriptionData?.planTitle, featureName: 'Advanced Search Filters' })
                );
                return;
            }

            // Initialize with default values
            const updatedFilters = {
                ageRange: '',
                profileCreatedBy: 'Any',
                city: '',
                star: [] as string[],
                dosham: [] as string[],
                annualIncomeFilter: '',
                jobSector: [] as string[],
                education: [] as string[],
                // Reset to empty like the others, so loading a saved search without a subcaste
                // filter clears any chips left selected from a previous search.
                subcaste: [] as string[],
            };

            let newHoroscopeOnly = false;
            let newPhotoOnly = false;

            // Process each filter
            savedSearch.filters.forEach((filter: any) => {
                const key = filter.filterKey.toLowerCase();
                let value = filter.filterValue;

                switch (key) {
                    case 'age':
                    case 'agerange':
                        // Convert "18 - 60" to "18 Yrs - 60 Yrs" format
                        if (value.includes('-')) {
                            const [minAge, maxAge] = value.split('-').map(s => s.trim());
                            updatedFilters.ageRange = `${minAge} Yrs - ${maxAge} Yrs`;
                        } else {
                            updatedFilters.ageRange = value;
                        }
                        break;

                    case 'subcaste':
                        // Stored as names (see SearchResult's save path) so they map straight back
                        // onto the chip selection, same as star/dosham/education.
                        updatedFilters.subcaste = value.split(',').map((s: string) => s.trim());
                        break;

                    case 'star':
                        updatedFilters.star = value.split(',').map((s: string) => s.trim());
                        break;

                    case 'dosham':
                        updatedFilters.dosham = value.split(',').map((s: string) => s.trim());
                        break;

                    case 'education':
                        // Convert comma-separated string to array
                        updatedFilters.education = value.split(',').map((s: string) => s.trim());
                        break;

                    case 'jobsector':
                    case 'jobsectors':
                        updatedFilters.jobSector = value.split(',').map((s: string) => s.trim());
                        break;

                    case 'degree':
                        updatedFilters.education = value.split(',').map((s: string) => s.trim());
                        break;

                    case 'city':
                        updatedFilters.city = value;
                        break;

                    case 'annualincome':
                    case 'incomerange':
                        if (value.includes('-')) {
                            const [min, max] = value.split('-').map(s => s.trim());
                            const minLakhs = Math.floor(parseInt(min) / 100000);
                            const maxLakhs = max === 'null' ? 99 : Math.floor(parseInt(max) / 100000); // Changed null to 99 for max range

                            updatedFilters.annualIncomeFilter = maxLakhs < 100
                                ? `${minLakhs} Lakhs - ${maxLakhs} Lakhs`
                                : `Above ${minLakhs} Lakhs`;

                            // Set the income range state values
                            setFromIncome(minLakhs);
                            setToIncome(maxLakhs);

                            // Also update the incomeRanges state if needed
                            setIncomeRanges((prevRanges: any) => {
                                // If we can't find the range in the existing ones, add it
                                const rangeExists = prevRanges.some(
                                    (range: any) => range.from === minLakhs && range.to === maxLakhs
                                );

                                if (!rangeExists && maxLakhs) {
                                    const newRange = {
                                        from: minLakhs,
                                        to: maxLakhs,
                                        amount: maxLakhs < 100
                                            ? `${minLakhs} Lakhs - ${maxLakhs} Lakhs`
                                            : `Above ${minLakhs} Lakhs`
                                    };
                                    return [...prevRanges, newRange];
                                }
                                return prevRanges;
                            });
                        }
                        break;

                    case 'profileswithhoroscope':
                        newHoroscopeOnly = value === 'Y';
                        break;

                    case 'profileimagestatus':
                        newPhotoOnly = value === 'Y';
                        break;
                }
            });

            // Update all states
            setFilters((prev: Filters) => {
                return {
                    ...prev,
                    ...updatedFilters
                } as Filters; // Type assertion to ensure type safety
            });

            if (newHoroscopeOnly !== horoscopeOnly) {
                setHoroscopeOnly(newHoroscopeOnly);
            }
            if (newPhotoOnly !== photoOnly) {
                setPhotoOnly(newPhotoOnly);
            }

            // Switch to criteria tab
            setActiveTab('criteria');

            popup.success('Search Loaded', `"${savedSearch.searchName}" filters have been applied.`);

        } catch (error) {
            console.error('Error loading search:', error);
            popup.error('Error', 'Failed to load the saved search. Please try again.');
        }
    };

    const handleDelete = (searchId: number) => {
        const runDelete = async () => {
            try {
                const response = await userApi.inActiveSavedSearch(searchId);

                if (response.data.code === 200) {
                    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
                    popup.success('Success', 'Search deleted successfully');
                } else {
                    throw new Error(response.data.message || 'Failed to delete search');
                }
            } catch (error) {
                console.error('Error deleting search:', error);
                popup.error('Error', 'Failed to delete search. Please try again.');
            }
        };

        // CommonPopup (via usePopup) instead of the native Alert.alert — Alert renders as the
        // OS's own dialog, which looks and behaves differently on Android vs iOS. Every other
        // popup in this app already goes through the shared cross-platform component. Using
        // `show()` directly (not the `confirm()` shorthand, which hardcodes `variant: 'primary'`
        // on its confirm button) so Delete can keep the destructive/red styling the original
        // Alert.alert had via `style: 'destructive'`. Unlike the convenience helpers, `show()`
        // doesn't auto-close the popup on button press, so each `onPress` here calls `hide()`
        // itself first (same 100ms delay the helpers use, to let the close animation finish).
        popup.show({
            title: 'Delete Saved Search',
            description: 'Are you sure you want to delete this saved search?',
            variant: 'confirm',
            buttons: [
                { text: 'Cancel', variant: 'secondary', onPress: () => popup.hide() },
                {
                    text: 'Delete',
                    variant: 'destructive',
                    onPress: () => {
                        popup.hide();
                        setTimeout(runDelete, 100);
                    },
                },
            ],
        });
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

            // Was a serial `for (const key of keys) { await userApi.getKeyValueByKey(key) }` loop —
            // 8 sequential round-trips (~1.6s of pure waterfall) before any filter dropdown became
            // usable. The keys are independent, so they now run concurrently. The per-key
            // try/catch below is unchanged, so one missing/malformed key still can't break the
            // other seven. (Kept as 8 parallel calls rather than one getAllKeyValues() call: that
            // endpoint returns every keyValue row — banners, QUICK_ACCESS_MENU, ADMIN_CONTACT,
            // promo configs — so it trades 8 small concurrent requests for one much larger
            // payload, with the same single-round-trip wall-clock cost.)
            const processKey = async (key: string) => {
                try {
                    console.log(`Fetching ${key}...`);
                    const response = await userApi.getKeyValueByKey(key);
                    // console.log(`${key} API Response:`, response);

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
                            return; // Skip this key if parsing fails
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
            };

            await Promise.all(keys.map(processKey));
        };

        fetchKeyValues();
    }, []);

    const handleProfileIdSearch = async () => {
        if (!profileId.trim()) {
            popup.warning('Missing Profile ID', 'Please enter a profile ID.');
            return;
        }

        setIsSearchSubmitting(true);
        try {
            const casteId = userData.casteId;
            const gender = userData.gender;

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
                popup.error('Not Found', 'No profile found with this ID.');
            }
        } catch (error) {
            console.error('Error searching by profile ID:', error);
            popup.error('Error', 'Failed to search profile. Please try again.');
        } finally {
            setIsSearchSubmitting(false);
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
                        <View style={styles.sectionHeaderContainer}>
                            <View style={styles.sectionIconBadge}>
                                <User size={15} color="#1F7FE5" />
                            </View>
                            <Text style={styles.sectionHeader}>Profile Search</Text>
                        </View>
                        <Text style={styles.profileIdHint}>
                            Enter the exact Profile ID (Member ID) to find a specific member.
                        </Text>
                        <View style={styles.inputContainer}>
                            <View style={styles.inputField}>
                                <SearchIcon size={16} color="#94a3b8" />
                                {/* Placeholder shows the real shape of a member id (prefix +
                                    number + gender letter, e.g. BLK101F / PLN56M) — the previous
                                    "Enter Profile ID" gave no clue what to type. */}
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. BLK101F"
                                    placeholderTextColor="#94a3b8"
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
                <ScrollView style={{ flex: 1, paddingHorizontal: 18, paddingTop: 12, backgroundColor: 'transparent' }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: footerPad }}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#1F7FE5" style={{ marginTop: 24 }} />
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
                                            <SearchIcon size={14} color="#1F7FE5" />
                                            <Text style={[styles.actionButtonText, { color: '#1F7FE5' }]}>
                                                Use
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleDelete(search.id)}
                                            style={[styles.actionButton, styles.deleteButton]}
                                        >
                                            <Feather name="trash-2" size={15} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.filtersContainer}>
                                    {search.filters.map((filter) => (
                                        <View key={filter.id} style={styles.filterChip}>
                                            <Feather name="filter" size={11} color="#1F7FE5" />
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
                            <View style={styles.exploreEmptyIcon}>
                                <SearchIcon size={30} color="#1F7FE5" />
                            </View>
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
                <View style={styles.filterCard}>

                    <TouchableOpacity
                        style={styles.sectionHeaderContainer}
                        onPress={() => toggleSection('basic')}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.sectionIconBadge, { backgroundColor: '#dfecfb' }]}>
                            <User size={15} color="#1F7FE5" />
                        </View>
                        <Text style={styles.sectionHeader}>Basic Details</Text>
                        <ChevronDown
                            size={20}
                            color="#1F7FE5"
                            style={[
                                styles.chevronIcon,
                                expandedSections.basic && styles.chevronRotated,
                            ]}
                        />
                    </TouchableOpacity>

                    <View style={styles.filterContent}>
                        {expandedSections.basic && (
                            <View style={{ marginBottom: 0 }}>
                                {/* <View style={styles.filterRow}>
                                    <Text style={styles.filterLabel}>Age</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowAgeModal(true)}
                                    >
                                        <Text style={styles.dropdownText}>{filters.ageRange}</Text>
                                        <ChevronDown size={16} color="#666" />
                                    </TouchableOpacity>
                                </View> */}

                                <View style={[styles.rangeSection, styles.rangeSectionFirst]}>
                                    <Text style={styles.rangeSectionLabel}>Age Range</Text>
                                    <View style={styles.sliderWrap}>
                                        <RangeSlider
                                            style={styles.slider}
                                            min={18}
                                            max={60}
                                            step={1}
                                            low={fromAge}
                                            high={toAge}
                                            renderThumb={() => <View style={styles.thumb} />}
                                            renderRail={() => <View style={styles.rail} />}
                                            renderRailSelected={() => <View style={styles.railSelected} />}
                                            onValueChanged={handleAgeSliderChange}
                                        />
                                    </View>
                                    <View style={styles.rangeBoxRow}>
                                        <View style={styles.rangeBox}>
                                            <Text style={styles.rangeBoxLabel}>Minimum</Text>
                                            <Text style={styles.rangeBoxValue}>{fromAge} Yrs</Text>
                                        </View>
                                        <View style={styles.rangeBox}>
                                            <Text style={styles.rangeBoxLabel}>Maximum</Text>
                                            <Text style={styles.rangeBoxValue}>{toAge} Yrs</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Subcaste — multi-select chips, same interaction as Education below.
                                    Scoped to the searching user's own caste (every search is already
                                    caste-scoped), and rendered only when that caste actually has
                                    subcastes, so it never shows as an empty or unusable filter.
                                    PREMIUM (Silver+): a stricter gate than the other advanced filters,
                                    which are Classic+. Non-entitled users see the locked pill and an
                                    upgrade prompt. The server enforces this independently. */}
                                {subcasteList.length > 0 && (
                                    <View style={styles.filterRow}>
                                        <View style={styles.pillFieldSection}>
                                            <Text style={styles.rangeSectionLabel}>
                                                Subcaste  {!canSearchBySubcaste && (
                                                    <Text style={{ color: '#F6B733', fontSize: 12 }}>🔒</Text>
                                                )}
                                            </Text>
                                            {!canSearchBySubcaste ? (
                                                <TouchableOpacity
                                                    style={styles.dropdownDisabled}
                                                    onPress={() => setShowUpgradeModal(true)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={styles.disabledText}>Select</Text>
                                                    <Text style={styles.lockIcon}>🔒</Text>
                                                </TouchableOpacity>
                                            ) : (
                                            <View style={styles.pillWrapRow}>
                                                {subcasteList.map((sc: any) => {
                                                    const name = sc.subcasteName;
                                                    const list = Array.isArray(filters.subcaste) ? filters.subcaste : [];
                                                    const selected = list.includes(name);
                                                    return (
                                                        <TouchableOpacity
                                                            key={String(sc.id)}
                                                            style={[styles.wrapPill, selected && styles.wrapPillSelected]}
                                                            activeOpacity={0.8}
                                                            onPress={() => setFilters(prev => ({
                                                                ...prev,
                                                                subcaste: selected
                                                                    ? list.filter(v => v !== name)
                                                                    : [...list, name],
                                                            }))}
                                                        >
                                                            {selected && <Check size={13} color="#1F7FE5" strokeWidth={3} />}
                                                            <Text style={[styles.wrapPillText, selected && styles.wrapPillTextSelected]}>{name}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                            )}
                                        </View>
                                    </View>
                                )}

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

                                <View style={styles.filterRow}>
                                    <View style={styles.switchCard}>
                                        <View style={styles.switchCardLeft}>
                                            <View style={[styles.switchIconBadge, { backgroundColor: '#dfecfb' }]}>
                                                <Feather name="image" size={15} color="#1F7FE5" />
                                            </View>
                                            <Text style={styles.switchCardLabel}>Profile with photos only</Text>
                                        </View>
                                        <Switch
                                            size="sm"
                                            value={photoOnly}
                                            onValueChange={setPhotoOnly}
                                            trackColor={{ false: "#e2e8f0", true: "#1F7FE5" }}
                                            thumbColor={"#fff"}
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        <View style={styles.sectionDivider} />

                        {/* ------Job Details ---- */}
                        <TouchableOpacity
                            style={styles.sectionHeaderContainer}
                            onPress={() => toggleSection('job')}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.sectionIconBadge, { backgroundColor: '#feead0' }]}>
                                <Briefcase size={15} color="#c7811a" />
                            </View>
                            <Text style={styles.sectionHeader}>Job Details</Text>
                            <ChevronDown
                                size={20}
                                color="#1F7FE5"
                                style={[
                                    styles.chevronIcon,
                                    expandedSections.job && styles.chevronRotated,
                                ]}
                            />
                        </TouchableOpacity>

                        {expandedSections.job && (

                            <View style={{ marginBottom: 0 }}>

                                {/* <View style={styles.filterRow}>
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
                                </View> */}
                                <View style={[styles.filterRow, styles.filterRowFirst]}>
                                    <View style={styles.pillFieldSection}>
                                        <Text style={styles.rangeSectionLabel}>Education</Text>
                                        {optionsMap.education && optionsMap.education.length > 0 ? (
                                            isPremiumUser ? (
                                                <View style={styles.pillWrapRow}>
                                                    {optionsMap.education.map((opt) => {
                                                        const list = Array.isArray(filters.education) ? filters.education : [];
                                                        const selected = list.includes(opt);
                                                        return (
                                                            <TouchableOpacity
                                                                key={opt}
                                                                style={[styles.wrapPill, selected && styles.wrapPillSelected]}
                                                                activeOpacity={0.8}
                                                                onPress={() => setFilters(prev => ({
                                                                    ...prev,
                                                                    education: selected ? list.filter(v => v !== opt) : [...list, opt],
                                                                }))}
                                                            >
                                                                {selected && <Check size={13} color="#1F7FE5" strokeWidth={3} />}
                                                                <Text style={[styles.wrapPillText, selected && styles.wrapPillTextSelected]}>{opt}</Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    style={styles.dropdownDisabled}
                                                    onPress={() => setShowUpgradeModal(true)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={styles.disabledText}>Select</Text>
                                                    <Text style={styles.lockIcon}>🔒</Text>
                                                </TouchableOpacity>
                                            )
                                        ) : (
                                            <Text>Loading...</Text>
                                        )}
                                    </View>
                                </View>


                                <View style={styles.rangeSection}>
                                    <Text style={styles.rangeSectionLabel}>Annual Income (₹ Lakhs)</Text>
                                    <View style={styles.sliderWrap}>
                                        <RangeSlider
                                            style={styles.slider}
                                            min={0}
                                            max={99}
                                            step={1}
                                            low={fromIncome}
                                            high={toIncome}
                                            renderThumb={() => <View style={styles.thumb} />}
                                            renderRail={() => <View style={styles.rail} />}
                                            renderRailSelected={() => <View style={styles.railSelected} />}
                                            onValueChanged={handleIncomeSliderChange}
                                        />
                                    </View>
                                    <View style={styles.rangeBoxRow}>
                                        <View style={styles.rangeBox}>
                                            <Text style={styles.rangeBoxLabel}>Minimum</Text>
                                            <Text style={styles.rangeBoxValue}>{fromIncome === 0 ? '0' : `₹${fromIncome}L`}</Text>
                                        </View>
                                        <View style={styles.rangeBox}>
                                            <Text style={styles.rangeBoxLabel}>Maximum</Text>
                                            <Text style={styles.rangeBoxValue}>{toIncome === 99 ? '₹100L+' : `₹${toIncome}L`}</Text>
                                        </View>
                                    </View>
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
                                {/* Job Sector — inline wrapped pill multi-select */}
                                <View style={styles.filterRow}>
                                    <View style={styles.pillFieldSection}>
                                        <Text style={styles.rangeSectionLabel}>Job Sector</Text>
                                        {optionsMap.jobSector && optionsMap.jobSector.length > 0 ? (
                                            <View style={styles.pillWrapRow}>
                                                {optionsMap.jobSector.map((opt) => {
                                                    const list = Array.isArray(filters.jobSector) ? filters.jobSector : [];
                                                    const selected = list.includes(opt);
                                                    return (
                                                        <TouchableOpacity
                                                            key={opt}
                                                            style={[styles.wrapPill, selected && styles.wrapPillSelected]}
                                                            activeOpacity={0.8}
                                                            onPress={() => setFilters(prev => ({
                                                                ...prev,
                                                                jobSector: selected ? list.filter(v => v !== opt) : [...list, opt],
                                                            }))}
                                                        >
                                                            {selected && <Check size={13} color="#1F7FE5" strokeWidth={3} />}
                                                            <Text style={[styles.wrapPillText, selected && styles.wrapPillTextSelected]}>{opt}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        ) : (
                                            <Text>Loading...</Text>
                                        )}
                                    </View>
                                </View>


                            </View>
                        )}

                        <View style={styles.sectionDivider} />

                        {/* ------Religious Details ---- */}
                        <TouchableOpacity
                            style={styles.sectionHeaderContainer}
                            onPress={() => toggleSection('religious')}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.sectionIconBadge, { backgroundColor: '#ebe5fb' }]}>
                                <Sparkles size={15} color="#8b6fd9" />
                            </View>
                            <Text style={styles.sectionHeader}>Religious Details</Text>
                            <ChevronDown
                                size={20}
                                color="#1F7FE5"
                                style={[
                                    styles.chevronIcon,
                                    expandedSections.religious && styles.chevronRotated,
                                ]}
                            />
                        </TouchableOpacity>

                        {expandedSections.religious && (
                            <View style={{ marginBottom: 0 }}>
                                {/* Star — inline wrapped pill multi-select */}
                                <View style={[styles.filterRow, styles.filterRowFirst]}>
                                    <View style={styles.pillFieldSection}>
                                        <Text style={styles.rangeSectionLabel}>Star</Text>
                                        {optionsMap.star && optionsMap.star.length > 0 ? (
                                            isPremiumUser ? (
                                                <View style={styles.pillWrapRow}>
                                                    {optionsMap.star.map((opt) => {
                                                        const list = Array.isArray(filters.star) ? filters.star : [];
                                                        const selected = list.includes(opt);
                                                        return (
                                                            <TouchableOpacity
                                                                key={opt}
                                                                style={[styles.wrapPill, selected && styles.wrapPillSelected]}
                                                                activeOpacity={0.8}
                                                                onPress={() => setFilters(prev => ({
                                                                    ...prev,
                                                                    star: selected ? list.filter(v => v !== opt) : [...list, opt],
                                                                }))}
                                                            >
                                                                {selected && <Check size={13} color="#1F7FE5" strokeWidth={3} />}
                                                                <Text style={[styles.wrapPillText, selected && styles.wrapPillTextSelected]}>{opt}</Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    style={styles.dropdownDisabled}
                                                    onPress={() => setShowUpgradeModal(true)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={styles.disabledText}>Select</Text>
                                                    <Text style={styles.lockIcon}>🔒</Text>
                                                </TouchableOpacity>
                                            )
                                        ) : (
                                            <Text>Loading...</Text>
                                        )}
                                    </View>
                                </View>

                                {/* Dosham — inline wrapped pill multi-select */}
                                <View style={styles.filterRow}>
                                    <View style={styles.pillFieldSection}>
                                        <Text style={styles.rangeSectionLabel}>Dosham</Text>
                                        {optionsMap.dosham && optionsMap.dosham.length > 0 ? (
                                            isPremiumUser ? (
                                                <View style={styles.pillWrapRow}>
                                                    {optionsMap.dosham.map((opt) => {
                                                        const list = Array.isArray(filters.dosham) ? filters.dosham : [];
                                                        const selected = list.includes(opt);
                                                        return (
                                                            <TouchableOpacity
                                                                key={opt}
                                                                style={[styles.wrapPill, selected && styles.wrapPillSelected]}
                                                                activeOpacity={0.8}
                                                                onPress={() => setFilters(prev => ({
                                                                    ...prev,
                                                                    dosham: selected ? list.filter(v => v !== opt) : [...list, opt],
                                                                }))}
                                                            >
                                                                {selected && <Check size={13} color="#1F7FE5" strokeWidth={3} />}
                                                                <Text style={[styles.wrapPillText, selected && styles.wrapPillTextSelected]}>{opt}</Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    style={styles.dropdownDisabled}
                                                    onPress={() => setShowUpgradeModal(true)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={styles.disabledText}>Select</Text>
                                                    <Text style={styles.lockIcon}>🔒</Text>
                                                </TouchableOpacity>
                                            )
                                        ) : (
                                            <Text>Loading...</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={{ ...styles.filterRow }}>
                                    <View style={styles.switchCard}>
                                        <View style={styles.switchCardLeft}>
                                            <View style={[styles.switchIconBadge, { backgroundColor: '#ebe5fb' }]}>
                                                <Feather name="moon" size={15} color="#8b6fd9" />
                                            </View>
                                            <Text style={styles.switchCardLabel}>Profile with Horoscope only</Text>
                                        </View>
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
                                            trackColor={{ false: "#e2e8f0", true: "#1F7FE5" }}
                                            thumbColor={"#fff"}
                                        />
                                    </View>
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
                            <View style={styles.modalIconBadge}>
                                <Feather name="lock" size={22} color="#d97706" />
                            </View>
                            <Text style={styles.modalTitle}>Premium Feature</Text>
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
                const response = await userApi.getRandomUsers("F", 1, userData.decodedUserId);
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
            if (rawData?.length > 0) {
                console.log('🔍 First result verified flags:', {
                    name: rawData[0].firstName,
                    idVerified: rawData[0].idVerified,
                    educationVerified: rawData[0].educationVerified,
                    incomeVerified: rawData[0].incomeVerified,
                    hasActiveBoost: rawData[0].hasActiveBoost,
                    keys: Object.keys(rawData[0]).join(', ')
                });
            }
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
            <View style={styles.pageHeader}>
                <LinearGradient
                    colors={['#1F7FE5', '#1862b8']}
                    style={styles.pageHeaderIconBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <SlidersHorizontal size={17} color="#fff" strokeWidth={2.4} />
                </LinearGradient>
                <View style={styles.pageHeaderTextWrap}>
                    <Text style={styles.pageTitle}>Find Your Match</Text>
                    <Text style={styles.pageSubtitle}>Filter by age, education, location & more</Text>
                </View>
            </View>
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
                {activeTab !== 'saved' && (
                    <View style={[styles.basesearchButtonContainer, { marginTop: 10, paddingBottom: 150, borderTopWidth: 0, backgroundColor: 'transparent', gap: 10 }]}>
                        {activeTab === 'criteria' && (
                            <TouchableOpacity
                                onPress={handleClearFilters}
                                style={styles.clearButtonBottom}
                                activeOpacity={0.85}
                            >
                                <Feather name="x-circle" size={16} color="#475569" />
                                <Text style={styles.clearButtonBottomText}>Clear</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={activeTab === 'profile' ? handleProfileIdSearch : handleSearch}
                            style={styles.basesearchButtonWrapper}
                            disabled={isSearchSubmitting}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#1F7FE5', '#1862b8']}
                                style={[styles.basesearchButton, isSearchSubmitting && { opacity: 0.75 }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isSearchSubmitting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.basesearchButtonText}>Search</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* <DropdownModal
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

            <RangeSelectorModal
                visible={showAgeModal}
                onClose={() => {
                    // Reset to the last applied values
                    setShowAgeModal(false);
                }}
                title="Select Age Range"
                min={18}
                max={60}
                unit=" Yrs"
                initialFrom={fromAge}
                initialTo={toAge}
                onApply={(from, to) => {
                    setFromAge(from);
                    setToAge(to);
                    setFilters(prev => ({
                        ...prev,
                        ageRange: from === to ? `${from} Yrs` : `${from} Yrs - ${to} Yrs`
                    }));
                    setShowAgeModal(false);
                }}
            />

            <DropdownModal
                visible={showProfileCreatedModal}
                onClose={() => setShowProfileCreatedModal(false)}
                options={profileCreatedOptions}
                selectedValue={filters.profileCreatedBy}
                onSelect={(value) => setFilters(prev => ({ ...prev, profileCreatedBy: value }))}
                title="Profile Created By"
            />

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

            {/* <DropdownModal
                visible={showIncomeModal}
                onClose={() => setShowIncomeModal(false)}
                options={optionsMap.annualIncome}
                selectedValue={filters.annualIncomeFilter}
                onSelect={(value) => setFilters(prev => ({ ...prev, annualIncomeFilter: value }))}
                title="Select Annual Income"
            /> */}

            <RangeSelectorModal
                visible={showIncomeModal}
                onClose={() => {
                    setShowIncomeModal(false);
                }}
                title="Select Annual Income Range"
                min={0}
                max={99}
                step={1}
                unit="L"
                initialFrom={fromIncome}
                initialTo={toIncome}
                formatValue={(val) => {
                    if (val === 0) return '0';
                    if (val === 99) return '100+';
                    return val.toString();
                }}
                onApply={(from, to) => {
                    setFromIncome(from);
                    setToIncome(to);
                    setFilters(prev => ({
                        ...prev,
                        annualIncomeFilter: from === to
                            ? (from === 0 ? '0' : from === 99 ? '100L+' : `${from}L`)
                            : `${from} Lakhs - ${to} Lakhs`
                    }));
                    setShowIncomeModal(false);
                }}
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

// The Explore tab used to hold its own Search/Explore switcher, with "Explore" showing an
// All Matches/Newly Added grid — confusing nesting (an "Explore" sub-tab inside the "Explore"
// bottom tab), and "Newly Added" duplicated the Home tab's existing "New Connections" carousel
// (same getTop30NewUsers endpoint). All Matches moved to Home as its own carousel instead, so
// this screen is now just the filter form directly — no switcher needed.
const ExploreTabs = () => {
    const noop = useCallback(() => { }, []);
    return <Search setSwipeEnabled={noop} />;
};

export default ExploreTabs;

const styles = StyleSheet.create({
    modalText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
        textAlign: 'center',
        color: '#475569',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        padding: 13,
        borderRadius: 10,
        alignItems: 'center',
    },
    gradientBackground: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
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
        fontFamily: 'Rubik-Medium',
        color: '#1F7FE5',
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
        color: '#130001',
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
        fontFamily: 'Rubik-Medium',
        color: '#1F7FE5',
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
        color: '#130001',
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
    //   fontFamily: 'Rubik-Medium',
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
        fontFamily: 'Rubik-Bold',
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
        backgroundColor: "#1F7FE5",
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
        color: "#DADADA",
        fontSize: 16,
        fontFamily: 'Rubik-Bold',
    },
    // No horizontal padding here — cardContainer/the Saved-tab ScrollView already supply their
    // own gutter; this used to double up (10 + gutter = too much space left/right).
    content: {
        width: "100%",
        paddingTop: 10,
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
        fontFamily: 'Rubik-Bold',
    },
    sliderLabel: {
        color: "#DADADA",
        fontSize: 14,
        fontFamily: 'Rubik-Bold',
        marginBottom: 5,
    },
    // Age Range / Annual Income — inline dual-handle sliders (Omostate-reference style) with
    // Minimum/Maximum value boxes below, replacing the old "tap to open a picker-wheel modal"
    // pattern. Same underlying fromAge/toAge/fromIncome/toIncome state and filters.ageRange /
    // filters.annualIncomeFilter format as before, just committed live as the user drags.
    rangeSection: {
        marginTop: 6,
        paddingTop: 6,
    },
    // First field in a section already gets its gap from filterContent's own marginTop —
    // rangeSection's marginTop/paddingTop on top of that was double-spacing Basic Details'
    // header down to Age Range (24px + 12px = 36px). Zeroed here for Age Range only; Annual
    // Income (Job Details) keeps the base rangeSection gap since it follows the Education row.
    rangeSectionFirst: {
        marginTop: 0,
        paddingTop: 0,
    },
    rangeSectionLabel: {
        fontSize: 13.5,
        fontFamily: 'Rubik-Bold',
        color: '#0f1724',
        letterSpacing: -0.1,
        marginBottom: 10,
    },
    sliderWrap: {
        paddingHorizontal: 4,
        marginBottom: 2,
    },
    rangeBoxRow: {
        flexDirection: 'row',
        gap: 10,
    },
    rangeBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    rangeBoxLabel: {
        fontSize: 10.5,
        fontFamily: 'Rubik-Medium',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    rangeBoxValue: {
        fontSize: 15,
        fontFamily: 'Rubik-Bold',
        color: '#0f1724',
    },
    // Photo-only / Horoscope-only toggles were plain text+switch rows, easy to miss next to the
    // bordered pill fields around them — now a matching white card with an icon badge, same
    // visual weight as everything else in the form instead of reading as an afterthought.
    switchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    switchCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        marginRight: 10,
    },
    switchIconBadge: {
        width: 30,
        height: 30,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    switchCardLabel: {
        fontSize: 13,
        fontFamily: 'Rubik-Medium',
        color: '#0f1724',
        flexShrink: 1,
    },
    // Education / Job Sector / Star / Dosham — inline wrapped ring-select pills (Focus Area/
    // Disease Target reference), replacing "tap to open a modal list" with direct in-form
    // multi-select. Same wrapPill visual language as the ring-selected tab switcher above.
    pillFieldSection: {
        width: '100%',
    },
    pillWrapRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    wrapPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 100,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    wrapPillSelected: {
        borderColor: '#1F7FE5',
    },
    wrapPillText: {
        fontSize: 12.5,
        fontFamily: 'Rubik-Medium',
        color: '#475569',
    },
    wrapPillTextSelected: {
        color: '#1F7FE5',
        fontFamily: 'Rubik-Bold',
    },
    slider: {
        width: "100%",
        height: 40,
    },
    thumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#fff",
        borderWidth: 3,
        borderColor: "#1F7FE5",
        shadowColor: 'rgba(15,35,70,0.25)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 3,
    },
    rail: {
        flex: 1,
        height: 4,
        backgroundColor: "#e2e8f0",
        borderRadius: 2,
    },
    railSelected: {
        height: 4,
        backgroundColor: "#1F7FE5",
        borderRadius: 2,
    },
    labelContainer: {
        padding: 5,
        backgroundColor: "#1F7FE5",
        borderRadius: 4,
        alignItems: "center",
    },
    labelText: {
        color: "#fff",
        fontSize: 12,
    },
    notch: {
        width: 8,
        height: 8,
        backgroundColor: "#1F7FE5",
        borderRadius: 4,
    },
    container: { padding: 5, paddingLeft: 0 },
    title: { fontSize: 15, fontFamily: 'Rubik-Medium' },
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
    exploreEmptyIcon: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: 'rgba(31,127,229,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
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
        fontFamily: 'Rubik-Medium',
        color: '#1F7FE5',
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
        color: '#130001',
    },

    //   -----------------------------------------------------------------------new 
    container1: {
        flex: 1,
        backgroundColor: '#eef1f5',
    },
    // Hero header: gradient icon badge on the left, catchy title + plain-language subtitle
    // stacked to its right — the subtitle keeps the page's actual purpose (filtering) clear
    // underneath the friendlier title. Row centered as a whole so it stays balanced on the page.
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 4,
        gap: 10,
    },
    pageHeaderIconBadge: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1F7FE5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 4,
    },
    pageHeaderTextWrap: {
        alignItems: 'flex-start',
        flexShrink: 1,
    },
    pageTitle: {
        color: '#0f1724',
        fontSize: 16.5,
        fontFamily: 'Rubik-Bold',
        letterSpacing: -0.2,
        textAlign: 'left',
    },
    pageSubtitle: {
        color: '#64748b',
        fontSize: 11.5,
        fontFamily: 'Rubik-Medium',
        textAlign: 'left',
        marginTop: 2,
    },
    // Standard iOS/Material segmented control: a light neutral track holding all segments, the
    // active one rendered as a floating white card with a soft shadow (no color, no border ring)
    // — this is the pattern used by iOS Settings, banking apps, and most business/productivity
    // software for a single-select group, rather than a lifestyle-app-style accent-colored pill.
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        padding: 3,
        marginHorizontal: 18,
        marginTop: 16,
        marginBottom: 16,
    },
    tabInner: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 11,
        backgroundColor: 'transparent',
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: 'rgba(15,23,42,0.16)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 2,
    },
    tabText: {
        color: '#64748b',
        fontSize: 13,
        fontFamily: 'Rubik-Medium',
    },
    activeTabText: {
        color: '#0f1724',
        fontFamily: 'Rubik-Bold',
    },
    contentSearch: {
        flex: 1,
        paddingTop: 20,
    },
    cardContainer: {
        paddingHorizontal: 18,
    },

    // Flattened per feedback — no boxed card, no shadow. Fields sit directly on the page
    // background; sections are separated by spacing + a thin divider line instead.
    filterCard: {
        backgroundColor: 'transparent',
        padding: 0,
        marginBottom: 0,
    },
    // 8pt-grid tier used for a tap target's own internal breathing room (half the "standard"
    // 16px unit) — applies to the header row regardless of section position.
    sectionHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 10,
    },
    sectionIconBadge: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#dfecfb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionHeader: {
        flex: 1,
        color: '#0f1724',
        fontSize: 14.5,
        fontFamily: 'Rubik-Bold',
        letterSpacing: -0.2,
    },
    // "Distinct group" tier — 24px (3x the 8pt base unit) is the standard business-app spacing
    // for separating unrelated sections (vs. 16px for related items within one), so Basic/Job/
    // Religious read as clearly separate groups rather than one continuous list.
    sectionDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 12,
    },
    chevronIcon: {
        transform: [{ rotate: '0deg' }],
    },
    chevronRotated: {
        transform: [{ rotate: '180deg' }],
    },
    // "Standard" tier — 16px (8+8 split across margin/padding, with the divider line sitting
    // in between) separates related fields inside one section.
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#edf2f7',
    },
    filterRowFirst: {
        marginTop: 0,
        paddingTop: 0,
        borderTopWidth: 0,
    },
    filterLabel: {
        color: '#475569',
        fontSize: 13.5,
        fontFamily: 'Rubik-Medium',
        flex: 1,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minWidth: 180,
        justifyContent: 'space-between',
    },
    dropdownText: {
        color: '#0f1724',
        fontSize: 13,
        fontFamily: 'Rubik-Medium',
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
        color: '#1F7FE5',
        fontSize: 14,
        fontFamily: 'Rubik-Medium',
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
        color: '#1F7FE5',
        fontFamily: 'Rubik-Bold',
    },
    inputContainer: {
        marginBottom: 8,
        marginTop: 4,
    },
    inputLabel: {
        color: '#0f1724',
        fontSize: 15,
        fontFamily: 'Rubik-Medium',
        marginBottom: 2,
    },
    profileIdHint: {
        fontSize: 12,
        fontFamily: 'Rubik-Regular',
        color: '#64748b',
        lineHeight: 17,
        marginTop: 10,
        marginBottom: 4,
    },
    inputField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Rubik-Medium',
        color: '#0f1724',
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
    //     fontFamily: 'Rubik-Medium',
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
        color: '#1F7FE5',
        fontSize: 16,
        fontFamily: 'Rubik-Bold',
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
        borderColor: 'rgba(31,127,229,0.25)',
        backgroundColor: '#dfecfb',
        paddingHorizontal: 12,
    },
    searchButtonText: {
        color: '#DADADA',
        fontSize: 15,
        fontFamily: 'Rubik-Bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.45)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
        maxHeight: '70%',
    },
    modalIconBadge: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fde68a',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 17,
        fontFamily: 'Rubik-Bold',
        color: '#0f1724',
        textAlign: 'center',
        marginBottom: 18,
    },
    modalOption: {
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#f8fafc',
    },
    selectedOption: {
        backgroundColor: '#1F7FE5',
    },
    modalOptionText: {
        fontSize: 15,
        fontFamily: 'Rubik-Medium',
        color: '#0f1724',
    },
    selectedOptionText: {
        color: '#fff',
        fontFamily: 'Rubik-Bold',
    },
    modalCloseButton: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: 16,
    },
    modalCloseText: {
        color: '#475569',
        fontSize: 14.5,
        fontFamily: 'Rubik-Bold',
    },
    // Flattened along with filterCard — this used to be a separate white box nested inside the
    // (already-removed) card, left over with its own bg/radius/border after that card became
    // transparent, showing up as a stray white box around each section's fields.
    // "Standard" tier — 16px between a section's header and its first field.
    filterContent: {
        paddingVertical: 0,
        paddingHorizontal: 0,
        backgroundColor: 'transparent',
        marginTop: 16,
    },
    upgradeButton: {
        backgroundColor: '#1F7FE5',
    },
    cancelButton: {
        backgroundColor: '#f1f5f9',
    },
    upgradeButtonText: {
        color: '#fff',
        fontFamily: 'Rubik-Bold',
    },
    cancelButtonText: {
        color: '#475569',
        fontFamily: 'Rubik-Bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Rubik-Bold',
    },
    lockIcon: {
        color: '#d97706',
        fontSize: 16,
    },
    savedSearchCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: 'rgba(15,35,70,0.08)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        width: '100%',
    },
    searchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        width: '100%',
    },
    searchName: {
        fontSize: 15,
        fontFamily: 'Rubik-Bold',
        color: '#0f1724',
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    searchDate: {
        fontSize: 11.5,
        fontFamily: 'Rubik-Regular',
        color: '#94a3b8',
    },
    filterChip: {
        backgroundColor: '#dfecfb',
        borderRadius: 100,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '100%',
    },
    filterText: {
        fontSize: 11.5,
        fontFamily: 'Rubik-Medium',
        color: '#1862b8',
        marginLeft: 4,
        maxWidth: '90%',
    },
    filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        marginTop: 20,
    },
    emptyStateText: {
        fontSize: 15,
        fontFamily: 'Rubik-Bold',
        color: '#0f1724',
        marginBottom: 6,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 12.5,
        fontFamily: 'Rubik-Regular',
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 18,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 10,
        borderRadius: 9,
        minWidth: 40,
        height: 32,
    },
    actionButtonText: {
        fontSize: 12,
        color: '#1F7FE5',
        fontFamily: 'Rubik-Bold',
    },
    deleteButton: {
        borderWidth: 1,
        borderColor: '#fecaca',
        backgroundColor: '#fef2f2',
        marginLeft: 8,
        width: 32,
        minWidth: 32,
        paddingHorizontal: 0,
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
        paddingHorizontal: 18,
        paddingTop: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    // "Clear" now sits to the left of "Search" (Clear All / Show Places reference pattern)
    // instead of floating alone at the top of the form.
    clearButtonBottom: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 18,
        borderRadius: 25,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    clearButtonBottomText: {
        color: '#475569',
        fontSize: 14.5,
        fontFamily: 'Rubik-Bold',
    },
    basesearchButtonWrapper: {
        flex: 1,
        borderRadius: 25,
        overflow: 'hidden',
    },
    basesearchButton: {
        paddingVertical: 13,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    basesearchButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: 'Rubik-Bold',
    },

    centeredModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    centeredModalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitleAge: {
        fontSize: 18,
        fontFamily: 'Rubik-Medium',
        color: '#130001',
    },
    closeButton: {
        color: '#1F7FE5',
        fontSize: 18,
        fontFamily: 'Rubik-Bold',
    },
    applyButton: {
        backgroundColor: '#1F7FE5',
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#DADADA',
        fontFamily: 'Rubik-Medium',
        fontSize: 16,
    },
    // Add this to your StyleSheet in SearchTabs.tsx
    filterButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
        maxWidth: 200,
    },
    filterButtonText: {
        fontSize: 13,
        color: '#0f1724',
        fontFamily: 'Rubik-Medium',
    },
    singleRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    labelContainer1: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dropdownContainer: {
        flex: 1,
        marginLeft: 12,
        maxWidth: 200,
    },
    // Amber "premium locked" treatment — same family as ProfileDetail.tsx's PremiumLock
    // component, so a gated filter reads the same way this whole gating pattern reads elsewhere.
    dropdownDisabled: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fde68a',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: '#fffbeb',
        width: '100%',
    },
    disabledText: {
        color: '#92400e',
        fontSize: 13,
        fontFamily: 'Rubik-Medium',
    },
});
