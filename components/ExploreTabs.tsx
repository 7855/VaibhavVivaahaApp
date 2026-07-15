import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { HStack, Radio, Stack, Switch } from "native-base";
import { TabView, TabBar } from "react-native-tab-view";
import Expandable from "react-native-reanimated-animated-accordion";
import { Ionicons } from "@expo/vector-icons";
import RangeSlider from "rn-range-slider";
import { Dropdown } from "react-native-element-dropdown";
import DropdownComponent from "./DropdownComponent";
import DiscoveryProfileCard from "./DiscoveryProfileCard";
import userApi from "@/app/(root)/api/userApi";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Book, Calendar, DollarSign, Briefcase } from "lucide-react-native";

const BRAND_MAROON = '#420001';
const BRAND_GOLD = '#F6B733';

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

  // const handleAgeChange = useCallback((low: number, high: number) => {
  //   setMinAgeText(low);
  //   setMaxAgeText(high);
  // }, []);

  // const handleSalaryChange = useCallback((low: number, high: number) => {
  //   setMinSalary(low);
  //   setMaxSalary(high);
  // }, []);

  const [selectedEducation, setSelectedEducation] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const educationOptions = [
    { id: 1, label: "Doctor", value: "Doctor" },
    { id: 2, label: "Engineer", value: "Engineer" },
    { id: 3, label: "Teacher", value: "Teacher" },
    { id: 4, label: "Lawyer", value: "Lawyer" },
    { id: 5, label: "Accountant", value: "Accountant" },
    { id: 6, label: "Nurse", value: "Nurse" },
    { id: 7, label: "Software Developer", value: "Software Developer" },
    { id: 8, label: "Civil Servant", value: "Civil Servant" },
    { id: 9, label: "Farmer", value: "Farmer" },
    { id: 10, label: "Entrepreneur", value: "Entrepreneur" },
    { id: 11, label: "Architect", value: "Architect" },
    { id: 12, label: "Journalist", value: "Journalist" },
    { id: 13, label: "Pharmacist", value: "Pharmacist" },
    { id: 14, label: "Chartered Accountant (CA)", value: "Chartered Accountant (CA)" },
    { id: 15, label: "Researcher", value: "Researcher" },
    { id: 16, label: "Scientist", value: "Scientist" },
    { id: 17, label: "Designer", value: "Designer" },
    { id: 18, label: "Human Resources (HR) Manager", value: "Human Resources (HR) Manager" },
    { id: 19, label: "Marketing Manager", value: "Marketing Manager" },
    { id: 20, label: "Sales Executive", value: "Sales Executive" },
    { id: 21, label: "Graphic Designer", value: "Graphic Designer" },
    { id: 22, label: "Web Developer", value: "Web Developer" },
    { id: 23, label: "Data Analyst", value: "Data Analyst" },
    { id: 24, label: "Business Analyst", value: "Business Analyst" },
    { id: 25, label: "Consultant", value: "Consultant" },
    { id: 26, label: "Banker", value: "Banker" },
    { id: 27, label: "Pilot", value: "Pilot" },
    { id: 28, label: "Air Hostess / Flight Attendant", value: "Air Hostess / Flight Attendant" },
    { id: 29, label: "Police Officer", value: "Police Officer" },
    { id: 30, label: "Firefighter", value: "Firefighter" },
    { id: 31, label: "Chef", value: "Chef" },
    { id: 32, label: "Hotel Manager", value: "Hotel Manager" },
    { id: 33, label: "Artist", value: "Artist" },
    { id: 34, label: "Musician", value: "Musician" },
    { id: 35, label: "Actor/Actress", value: "Actor/Actress" },
    { id: 36, label: "Photographer", value: "Photographer" },
    { id: 37, label: "Event Planner", value: "Event Planner" },
    { id: 38, label: "Fitness Trainer", value: "Fitness Trainer" },
    { id: 39, label: "Social Worker", value: "Social Worker" },
    { id: 40, label: "Psychologist", value: "Psychologist" },
    { id: 41, label: "Librarian", value: "Librarian" },
    { id: 42, label: "Translator", value: "Translator" },
    { id: 43, label: "Interpreter", value: "Interpreter" },
    { id: 44, label: "Content Writer", value: "Content Writer" },
    { id: 45, label: "Copywriter", value: "Copywriter" },
    { id: 46, label: "Digital Marketer", value: "Digital Marketer" },
    { id: 47, label: "SEO Specialist", value: "SEO Specialist" },
    { id: 48, label: "Public Relations (PR) Officer", value: "Public Relations (PR) Officer" },
    { id: 49, label: "Real Estate Agent", value: "Real Estate Agent" },
    { id: 50, label: "Retail Manager", value: "Retail Manager" },
    { id: 51, label: "Logistics Manager", value: "Logistics Manager" },
    { id: 52, label: "Supply Chain Manager", value: "Supply Chain Manager" },
    { id: 53, label: "Operations Manager", value: "Operations Manager" },
    { id: 54, label: "Project Manager", value: "Project Manager" },
    { id: 55, label: "Quality Assurance (QA) Engineer", value: "Quality Assurance (QA) Engineer" },
    { id: 56, label: "Network Administrator", value: "Network Administrator" },
    { id: 57, label: "System Administrator", value: "System Administrator" },
    { id: 58, label: "Graphic Illustrator", value: "Graphic Illustrator" },
    { id: 59, label: "Animator", value: "Animator" },
    { id: 60, label: "Video Editor", value: "Video Editor" },
    { id: 61, label: "Data Scientist", value: "Data Scientist" },
    { id: 62, label: "Machine Learning Engineer", value: "Machine Learning Engineer" },
    { id: 63, label: "AI Specialist", value: "AI Specialist" },
    { id: 64, label: "Blockchain Developer", value: "Blockchain Developer" },
    { id: 65, label: "Cybersecurity Analyst", value: "Cybersecurity Analyst" },
    { id: 66, label: "Ethical Hacker", value: "Ethical Hacker" },
    { id: 67, label: "UX/UI Designer", value: "UX/UI Designer" },
    { id: 68, label: "Content Strategist", value: "Content Strategist" },
    { id: 69, label: "Social Media Manager", value: "Social Media Manager" },
    { id: 70, label: "Customer Support Representative", value: "Customer Support Representative" },
    { id: 71, label: "Call Center Agent", value: "Call Center Agent" },
    { id: 72, label: "Receptionist", value: "Receptionist" },
    { id: 73, label: "Administrator", value: "Administrator" }
  ];


  const cityOptions = [
    { label: 'Ariyalur', value: 'ariyalur' },
    { label: 'Chennai', value: 'chennai' },
    { label: 'Coimbatore', value: 'coimbatore' },
    { label: 'Cuddalore', value: 'cuddalore' },
    { label: 'Dharmapuri', value: 'dharmapuri' },
    { label: 'Dindigul', value: 'dindigul' },
    { label: 'Erode', value: 'erode' },
    { label: 'Kallakurichi', value: 'kallakurichi' },
    { label: 'Kancheepuram', value: 'kancheepuram' },
    { label: 'Kanyakumari', value: 'kanyakumari' },
    { label: 'Karur', value: 'karur' },
    { label: 'Krishnagiri', value: 'krishnagiri' },
    { label: 'Madurai', value: 'madurai' },
    { label: 'Nagapattinam', value: 'nagapattinam' },
    { label: 'Namakkal', value: 'namakkal' },
    { label: 'Nilgiris', value: 'nilgiris' },
    { label: 'Perambalur', value: 'perambalur' },
    { label: 'Pudukkottai', value: 'pudukkottai' },
    { label: 'Ramanathapuram', value: 'ramanathapuram' },
    { label: 'Salem', value: 'salem' },
    { label: 'Sivaganga', value: 'sivaganga' },
    { label: 'Thanjavur', value: 'thanjavur' },
    { label: 'Theni', value: 'theni' },
    { label: 'Thiruvallur', value: 'thiruvallur' },
    { label: 'Thiruvarur', value: 'thiruvarur' },
    { label: 'Thirunelveli', value: 'thirunelveli' },
    { label: 'Thiruppur', value: 'thiruppur' },
    { label: 'Thiruvannamalai', value: 'thiruvannamalai' },
    { label: 'Tiruchirappalli', value: 'tiruchirappalli' },
    { label: 'Tirunelveli', value: 'tirunelveli' },
    { label: 'Tiruppur', value: 'tiruppur' },
    { label: 'Tiruvannamalai', value: 'tiruvannamalai' },
    { label: 'Vellore', value: 'vellore' },
    { label: 'Viluppuram', value: 'viluppuram' },
    { label: 'Virudhunagar', value: 'virudhunagar' },
    { label: 'The Nilgiris', value: 'the_nilgiris' }
  ];
  const [value, setValue] = React.useState('one');

  const [photoOnly, setPhotoOnly] = useState(false);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>

      <View style={styles.scene}>
        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.accordionContainer}>
            <View
              style={styles.content}
              onTouchStart={() => setSwipeEnabled(false)}
              onTouchEnd={() => setSwipeEnabled(true)}
            >
              {/* Age Filter */}
              <View style={styles.filterCard}>
                <View style={styles.filterCardHeader}>
                  <View style={styles.filterIconWrap}>
                    <Calendar size={16} color={BRAND_MAROON} />
                  </View>
                  <Text style={styles.filterCardTitle}>Age Range</Text>
                </View>
                <View style={styles.ageInputContainer}>
                  <View style={styles.ageInputWrapper}>
                    <Text style={styles.inputLabel}>Min Age</Text>
                    <TextInput
                      style={styles.ageInput}
                      placeholder="18"
                      placeholderTextColor="#b0a3a4"
                      value={minAgeText} // store as string in state
                      onChangeText={(text) => setMinAgeText(text)} // don't parse here
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.ageInputWrapper}>
                    <Text style={styles.inputLabel}>Max Age</Text>
                    <TextInput
                      style={styles.ageInput}
                      placeholder="50"
                      placeholderTextColor="#b0a3a4"
                      value={maxAgeText} // store as string in state
                      onChangeText={(text) => setMaxAgeText(text)} // don't parse here
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>


              {/* Salary Range */}
              {/* Salary Range Slider */}
              {/* <Box alignItems="start" w="100%" mt={4}>
                <Text style={styles.sliderLabel}>
                  Salary: {minSalary} - {maxSalary} LPA
                </Text>
                <RangeSlider
                  style={styles.slider}
                  min={0}
                  max={20}
                  step={1}
                  floatingLabel
                  renderThumb={Thumb}
                  renderRail={Rail}
                  renderRailSelected={RailSelected}
                  renderNotch={Notch}
                  renderLabel={(value) => <Label text={value} />}
                  onValueChanged={handleSalaryChange}
                />
              </Box> */}
              <View style={styles.filterCard}>
                <View style={styles.filterCardHeader}>
                  <View style={styles.filterIconWrap}>
                    <DollarSign size={16} color={BRAND_MAROON} />
                  </View>
                  <Text style={styles.filterCardTitle}>Salary Range (LPA)</Text>
                </View>
                <View style={styles.ageInputContainer}>
                  <View style={styles.ageInputWrapper}>
                    <Text style={styles.inputLabel}>Min Salary</Text>
                    <TextInput
                      style={styles.ageInput}
                      placeholder="0"
                      placeholderTextColor="#b0a3a4"
                      value={minSalaryText} // store as string
                      onChangeText={setMinSalaryText} // don't parse here
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.ageInputWrapper}>
                    <Text style={styles.inputLabel}>Max Salary</Text>
                    <TextInput
                      style={styles.ageInput}
                      placeholder="20"
                      placeholderTextColor="#b0a3a4"
                      value={maxSalaryText}
                      onChangeText={setMaxSalaryText}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.filterCard}>
                {/* <Text style={styles.title}>Filter Options</Text> */}
                <View style={styles.filterCardHeader}>
                  <View style={styles.filterIconWrap}>
                    <Book size={16} color={BRAND_MAROON} />
                  </View>
                  <Text style={styles.filterCardTitle}>City / District</Text>
                </View>
                <View style={styles.educationInputWrapper}>
                  {/* <TextInput
                  style={styles.educationInput}
                  placeholder="Education"
                  value={selectedEducation}
                  editable={false}
                  onPressIn={() => setIsDropdownOpen(true)}
                  placeholderTextColor="#808080"
                /> */}
                  <DropdownComponent
                    data={cityOptions}
                    onSelect={(item) => setSelectedCity(item.label)}

                  />
                </View>

                <View style={styles.jobsect}>

                  <View style={styles.jobSectorLabelContainer}>
                    <Briefcase size={15} color={BRAND_MAROON} />
                    <Text style={styles.filterCardTitle}>Job Sector</Text>
                  </View>
                  {/* Radio Button Group */}
                  <Radio.Group
                    name="myRadioGroup"
                    accessibilityLabel="favorite number"
                    value={value}
                    onChange={nextValue => setValue(nextValue)}
                  >
                    <Stack
                      direction={{
                        base: 'row',  // Stack vertically on small screens
                      }}
                      alignItems={{
                        base: 'flex-start', // Align to the start of the column on small screens
                      }}
                      space={6}              // Add space between radio buttons
                      w="100%"                // Set width to 75%
                    >
                      <Radio value="one" colorScheme="amber">
                        <Text style={styles.radioLabel}>Government</Text>
                      </Radio>
                      <Radio value="two" colorScheme="amber">
                        <Text style={styles.radioLabel}>Private</Text>
                      </Radio>
                    </Stack>
                  </Radio.Group>
                </View>

                <View>
                  <HStack alignItems="center" space={2} marginTop={3}>
                    <Switch size="sm" value={photoOnly} onValueChange={setPhotoOnly} onTrackColor="#F6B733" onThumbColor="#fff" />
                    <Text style={styles.profileWphototext}>Profile with photos only</Text>
                  </HStack>
                </View>
              </View>

              {/* Find Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  handleFindPress();
                  setExpanded(!expanded);
                  setSwipeEnabled(!expanded);
                }}
              >
                <LinearGradient
                  colors={['#5c1216', BRAND_MAROON]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.findButton}
                >
                  <Text style={styles.buttonText}>Find Your Partner</Text>
                </LinearGradient>
              </TouchableOpacity>

            </View>

            {/* Accordion Header */}

          </View>
          {/* <TouchableOpacity
            style={styles.header}
            onPress={() => {
              setExpanded(!expanded);
              setSwipeEnabled(!expanded);
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.headerText}>Search  </Text>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={24}
                color="white"
              />
            </View>


          </TouchableOpacity> */}

          {/* <View>
            <FlatList
              data={profiles}
              keyExtractor={(_, index) => index.toString()}
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
                      job={item.userDetail[0].occupation}
                      location={item.location}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />

          </View> */}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
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
          windowSize={5}
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              style={{ flex: 1 }}
              onPress={() => {
                router.push({
                  pathname: '/screens/ProfileDetail',
                  params: { userId: item.userId }
                });
              }}
            >
              <DiscoveryProfileCard
                imageUrl={item.profileImage}
                name={item.firstName}
                age={item.age}
                job={item.userDetail?.[0]?.occupation || ''}
                location={item.location}
                gender={item.gender}
                idVerified={item.idVerified}
                educationVerified={item.educationVerified}
                incomeVerified={item.incomeVerified}
                isNew={route.key === 'new'}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={route.key === 'all' ? 'people-outline' : 'sparkles-outline'}
                  size={38}
                  color={BRAND_MAROON}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {route.key === 'all' ? 'No matches found' : 'No newly added profiles'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {route.key === 'all'
                  ? 'Try adjusting your search filters to see more profiles.'
                  : 'Check back soon — new members join every day.'}
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
      style={{ marginTop: 16 }}
      renderTabBar={(props: any) => (
        <TabBar
          {...props}
          style={styles.tabBarTab}
          indicatorStyle={styles.indicatorTab}
          activeColor={BRAND_MAROON}
          inactiveColor="#a3898b"
          labelStyle={styles.tabLabelTab}
          renderIndicator={(indicatorProps: any) => (
            <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'flex-end' }]} pointerEvents="none">
              <LinearGradient
                colors={[BRAND_GOLD, '#C59A40']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  left: indicatorProps.layout.width / routes.length * indicatorProps.navigationState.index,
                  width: indicatorProps.layout.width / routes.length,
                  height: 3,
                  bottom: 0,
                  borderRadius: 3,
                }}
              />
            </View>
          )}
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
      renderTabBar={(props: any) => (
        <TabBar
          {...props}
          style={styles.tabBar}
          tabStyle={styles.tab}
          activeColor="#fff"
          inactiveColor={BRAND_MAROON}
          labelStyle={styles.mainTabLabel}
          renderIndicator={() => null}
          renderTabBarItem={({ route, navigationState, onPress }: any) => {
            const routeIndex = navigationState.routes.findIndex((r: any) => r.key === route.key);
            const active = navigationState.index === routeIndex;
            return (
              <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.85} style={styles.tab}>
                {active ? (
                  <LinearGradient
                    colors={[BRAND_MAROON, '#5c1216']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.mainTabPillActive}
                  >
                    <Text style={styles.mainTabLabelActive}>{route.title}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.mainTabPill}>
                    <Text style={styles.mainTabLabel}>{route.title}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
      swipeEnabled={swipeEnabled} // Dynamically enable/disable swipe
    />
  );
};

export default ExploreTabs;

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
  },
  containerProfle: {
    padding: 16,
    gap: 14,
  },
  rowProfile: {
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: 2,
  },
  cardWrapper: {
    flex: 1,
    margin: 4,
  },
  tabBarTab: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: BRAND_MAROON,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  indicatorTab: {
    backgroundColor: 'transparent',
    height: 3,
  },
  tabLabelTab: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    textTransform: 'none',
  },
  sceneTab: {
    backgroundColor: "#FAF7F5",
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
    fontFamily: 'Rubik-Bold',
    color: BRAND_MAROON,
  },
  ageInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  ageInputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
    color: '#8a7274',
    marginBottom: 5,
  },
  ageInput: {
    borderWidth: 1.5,
    borderColor: '#EDE2DF',
    backgroundColor: '#FDFBFA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    color: '#162336',
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
    fontFamily: 'Rubik-Bold',
    color: BRAND_MAROON,
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
  scene: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FAF7F5",
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  profileWphototext: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: "#162336",
  },
  tabBar: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    marginHorizontal: 16,
    marginTop: 12,
    height: 52,
    justifyContent: "center",
  },
  tab: {
    marginHorizontal: 5,
    width: 'auto',
  },
  mainTabPill: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE2DF',
  },
  mainTabPillActive: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 100,
    shadowColor: BRAND_MAROON,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  mainTabLabel: {
    fontSize: 13.5,
    fontFamily: 'Rubik-Bold',
    color: BRAND_MAROON,
    textAlign: 'center',
  },
  mainTabLabelActive: {
    fontSize: 13.5,
    fontFamily: 'Rubik-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  accordionContainer: {
    width: "92%",
    borderRadius: 24,
    backgroundColor: "white",
    shadowColor: BRAND_MAROON,
    shadowOffset: { height: 4, width: 0 },
    elevation: 3,
    shadowRadius: 16,
    shadowOpacity: 0.08,
    overflow: "hidden",

  },
  header: {
    backgroundColor: "#130057",
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
  content: {
    width: "100%",
    padding: 18,
    gap: 16,
  },
  filterCard: {
    gap: 4,
  },
  filterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  filterIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(246,183,51,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCardTitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: '#162336',
  },
  radioLabel: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#162336',
  },
  findButton: {
    marginTop: 4,
    paddingVertical: 15,
    borderRadius: 100,
    alignItems: "center",
    shadowColor: BRAND_MAROON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.2,
  },
  sliderLabel: {
    color: "#DADADA",
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
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
    color: "#DADADA",
    fontSize: 12,
  },
  notch: {
    width: 8,
    height: 8,
    backgroundColor: "#130057",
    borderRadius: 4,
  },
  container: { padding: 5, paddingLeft: 0 },
  title: { fontSize: 15, fontFamily: 'Rubik-Bold', color: "#DADADA" },
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
    marginTop: 18,
    marginBottom: 4,
    gap: 4,
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
    fontFamily: 'Rubik-Bold',
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
    fontFamily: 'Rubik-Bold',
    color: BRAND_MAROON,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(246,183,51,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: BRAND_MAROON,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    fontFamily: 'Rubik-Regular',
    color: '#8a7274',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
