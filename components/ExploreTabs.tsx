import React, { useCallback, useEffect, useRef, useState } from "react";
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
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Box, CheckIcon, FlatList, HStack, Radio, Select, Stack, Switch } from "native-base";
import { TabView, TabBar } from "react-native-tab-view";
import Expandable from "react-native-reanimated-animated-accordion";
import { Ionicons } from "@expo/vector-icons";
import RangeSlider from "rn-range-slider";
import { Dropdown } from "react-native-element-dropdown";
import DropdownComponent from "./DropdownComponent";
import ExploreProfileCard from "./ExploreProfileCard";
import userApi from "@/app/(root)/api/userApi";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Book, Calendar, DollarSign, Briefcase } from "lucide-react-native";

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
        const response = await userApi.getRandomUsers("F",1);
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
        <View style={styles.accordionContainer}>
              <View
                style={styles.content}
                onTouchStart={() => setSwipeEnabled(false)}
                onTouchEnd={() => setSwipeEnabled(true)}
              >
                {/* Age Filter */}
                <View style={styles.ageFilterContainer}>
                  <View style={styles.ageLabelContainer}>
                    <Calendar size={20} color="#420001" />
                    <Text style={styles.ageLabelText}>Age Range</Text>
                  </View>
                  <View style={styles.ageInputContainer}>
                    <View style={styles.ageInputWrapper}>
                      <TextInput
                        style={styles.ageInput}
                        placeholder="Min Age"
                        value={minAgeText} // store as string in state
                        onChangeText={(text) => setMinAgeText(text)} // don't parse here
                        keyboardType="numeric"
                        // placeholderTextColor="#FFFFFF"
                        // color="#420001"
                      />
                    </View>
                    <View style={styles.ageInputWrapper}>
                      <TextInput
                        style={styles.ageInput}
                        placeholder="Max Age"
                        value={maxAgeText} // store as string in state
                        onChangeText={(text) => setMaxAgeText(text)} // don't parse here
                        keyboardType="numeric"
                        // placeholderTextColor="#FFFFFF"
                        // color="#FFFFFF"
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
                <View style={styles.salaryFilterContainer}>
                  <View style={styles.salaryLabelContainer}>
                    <DollarSign size={20} color="#420001" />
                    <Text style={styles.salaryLabelText}>Salary Range (LPA)</Text>
                  </View>
                  <View style={styles.salaryInputContainer}>
                    <View style={styles.salaryInputWrapper}>
                      <TextInput
                        style={styles.salaryInput}
                        placeholder="Min Salary"
                        value={minSalaryText} // store as string
                        onChangeText={setMinSalaryText} // don't parse here
                        keyboardType="numeric"
                        // placeholderTextColor="#FFFFFF"
                        // color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.salaryInputWrapper}>
                      <TextInput
                        style={styles.salaryInput}
                        placeholder="Max Salary"
                        value={maxSalaryText}
                        onChangeText={setMaxSalaryText}
                        keyboardType="numeric"
                        // placeholderTextColor="#FFFFFF"
                        // color="#FFFFFF"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.container}>
                  {/* <Text style={styles.title}>Filter Options</Text> */}
                  <View style={styles.educationInputContainer}>
                    <View style={styles.educationLabelContainer}>
                      <Book size={20} color="#420001" />
                      <Text style={styles.educationLabelText}>City / District</Text>
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
                  </View>

                  <View style={styles.jobsect}>

                    <View style={styles.jobSectorLabelContainer}>
                      <Briefcase size={20} color="#FFFFFF" />
                      <Text style={styles.title}>Job Sector</Text>
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
                        <Radio value="one" >
                          <Text style={{ fontSize: 15, color: "#FFFFFF" }}>Government</Text>
                        </Radio>
                        <Radio value="two" >
                          <Text style={{ fontSize: 15, color: "#FFFFFF" }}>Private</Text>
                        </Radio>
                      </Stack>
                    </Radio.Group>
                  </View>

                  <View>
                    <HStack alignItems="center" space={2} marginTop={2}>
                      <Text style={styles.profileWphototext}>Profile with photos only</Text>
                      <Switch size="sm" value={photoOnly} onValueChange={setPhotoOnly} />
                    </HStack>
                  </View>
                </View>

                {/* Find Button */}
                <TouchableOpacity
                  style={styles.findButton}
                  onPress={() => {
                    handleFindPress();
                    setExpanded(!expanded);
                    setSwipeEnabled(!expanded);
                  }}
                >
                  <Text style={styles.buttonText}>Find Your Partner</Text>
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
      style={{marginTop:25}}
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
          tabStyle={styles.tab}
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
    backgroundColor: 'rgba(30,64,175,1.00)',
    height: '100%',
    borderRadius: 4,
  },
  tabLabelTab: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  sceneTab:{
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
    color:"#FFFFFF"
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
    backgroundColor: "#130057",
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
    borderTopWidth:2,
    borderColor:"#FFFFFF",
    width:'65%',
    alignSelf:'center',
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
  title: { fontSize: 15, fontWeight: "bold" ,color:"#FFFFFF"},
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
    marginTop: 20,
    marginBottom:6
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
    height:280
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
    marginBottom:10
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
});
