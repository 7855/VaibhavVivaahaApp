// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Dimensions,
//   Share,
//   SafeAreaView,
//   StatusBar
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';

// const { width } = Dimensions.get('window');

// interface PoruthamResult {
//   key: string;
//   name: string;
//   result: 'PASS' | 'FAIL' | 'PARTIAL';
//   reason: string;
//   weight: number;
//   score: number;
// }

// interface MatchResult {
//   score: number;
//   percentage: number;
//   verdict: string;
//   totalWeight: number;
//   results: PoruthamResult[];
// }

// const StarMatchResult = () => {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(true);
//   const [result, setResult] = useState<MatchResult | null>(null);

//   useEffect(() => {
//     const mockResponse: MatchResult = {
//       score: 70,
//       percentage: 78,
//       verdict: "GOOD MATCH",
//       totalWeight: 90,
//       results: [
//         { key: "nadi", name: "Nadi Porutham", result: "PASS", reason: "Different Nadi", weight: 30, score: 30 },
//         { key: "rajju", name: "Rajju Porutham", result: "PASS", reason: "Rajju groups not identical (compatible)", weight: 15, score: 15 },
//         { key: "gana", name: "Gana Porutham", result: "PASS", reason: "Gana compatible", weight: 10, score: 10 },
//         { key: "yoni", name: "Yoni Porutham", result: "FAIL", reason: "Yoni mismatch: Serpent vs Horse", weight: 8, score: 0 },
//         { key: "mahendra", name: "Mahendra Porutham", result: "FAIL", reason: "Not in Mahendra position", weight: 6, score: 0 },
//         { key: "streedhirga", name: "Stree Dirga Porutham", result: "PASS", reason: "Sthree Dirgha condition satisfied", weight: 6, score: 6 },
//         { key: "rasi", name: "Rasi Porutham", result: "PASS", reason: "Rasi compatible", weight: 5, score: 5 },
//         { key: "rasi_adhipathi", name: "Rasi Adhipathi Porutham", result: "PARTIAL", reason: "Lords SUN and VENUS neutral", weight: 5, score: 2 },
//         { key: "vasya", name: "Vasya Porutham", result: "FAIL", reason: "Vasya not compatible", weight: 3, score: 0 },
//         { key: "dina", name: "Dina Porutham", result: "PASS", reason: "Dina compatible", weight: 2, score: 2 }
//       ]
//     };

//     const timer = setTimeout(() => {
//       setResult(mockResponse);
//       setIsLoading(false);
//     }, 800);

//     return () => clearTimeout(timer);
//   }, []);

//   const getResultColor = (result: string) => {
//     switch (result) {
//       case 'PASS': return '#10b981';
//       case 'FAIL': return '#ef4444';
//       case 'PARTIAL': return '#f59e0b';
//       default: return '#6b7280';
//     }
//   };

//   const getResultIcon = (result: string) => {
//     switch (result) {
//       case 'PASS': return 'check-circle';
//       case 'FAIL': return 'close-circle';
//       case 'PARTIAL': return 'alert-circle';
//       default: return 'help-circle';
//     }
//   };

//   const getPoruthamIcon = (key: string) => {
//     const icons: Record<string, string> = {
//       nadi: 'water',
//       rajju: 'link-variant',
//       gana: 'account-group',
//       yoni: 'paw',
//       mahendra: 'crown',
//       streedhirga: 'gender-female',
//       rasi: 'zodiac-aries',
//       rasi_adhipathi: 'star',
//       vasya: 'handshake',
//       dina: 'calendar-heart'
//     };
//     return icons[key] || 'help-circle';
//   };

//   const handleShare = async () => {
//     try {
//       await Share.share({
//         message: `Check out our compatibility score: ${result?.percentage}% - ${result?.verdict}`,
//       });
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   if (isLoading || !result) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#6c5ce7" />
//         <Text style={styles.loadingText}>Analyzing compatibility...</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" />
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//             <MaterialIcons name="arrow-back-ios" size={24} color="#fff" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Compatibility Result</Text>
//           <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
//             <MaterialIcons name="share" size={24} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         <ScrollView style={styles.scrollView}>
//           {/* Score Card */}
//           <View style={styles.scoreCard}>
//             <View style={styles.scoreCircle}>
//               <Text style={styles.scorePercentage}>{result.percentage}%</Text>
//               <Text style={styles.scoreLabel}>Match</Text>
//             </View>

//             <View style={styles.verdictContainer}>
//               <View style={[styles.verdictBadge, { backgroundColor: `${getResultColor('PASS')}20`, borderColor: getResultColor('PASS') }]}>
//                 <Text style={[styles.verdictText, { color: getResultColor('PASS') }]}>{result.verdict}</Text>
//               </View>
//               <Text style={styles.verdictTitle}>Uttama Porutham</Text>
//               <Text style={styles.verdictSubtitle}>Highly compatible for a prosperous life</Text>
//             </View>

//             {/* Score Summary */}
//             <View style={styles.scoreSummary}>
//               <View style={styles.scoreHeader}>
//                 <Text style={styles.scoreHeaderText}>Score Summary</Text>
//                 <Text style={styles.scoreValue}>{result.score} / {result.totalWeight} Points</Text>
//               </View>
//               <View style={styles.progressBar}>
//                 <View 
//                   style={[
//                     styles.progressFill, 
//                     { 
//                       width: `${(result.score / result.totalWeight) * 100}%`,
//                       backgroundColor: getResultColor('PASS')
//                     }
//                   ]} 
//                 />
//               </View>
//             </View>
//           </View>

//           {/* Detailed Analysis */}
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Detailed Analysis</Text>
//             <Text style={styles.sectionSubtitle}>{result.results.length} Factor Match</Text>
//           </View>

//           {/* Results List */}
//           <View style={styles.resultsContainer}>
//             {result.results.map((item) => (
//               <View key={item.key} style={styles.resultCard}>
//                 <View style={styles.resultContent}>
//                   <View style={styles.resultHeader}>
//                     <View style={[styles.resultBadge, { backgroundColor: `${getResultColor(item.result)}20`, borderColor: getResultColor(item.result) }]}>
//                       <Text style={[styles.resultBadgeText, { color: getResultColor(item.result) }]}>{item.result}</Text>
//                     </View>
//                     <Text style={styles.resultScore}>{item.score} / {item.weight}</Text>
//                   </View>
//                   <Text style={styles.resultName}>{item.name}</Text>
//                   <Text style={styles.resultReason}>{item.reason}</Text>
//                 </View>
//                 <View style={[styles.resultIcon, { backgroundColor: `${getResultColor(item.result)}10` }]}>
//                   <MaterialCommunityIcons 
//                     name={getPoruthamIcon(item.key)} 
//                     size={28} 
//                     color={getResultColor(item.result)} 
//                   />
//                 </View>
//               </View>
//             ))}
//           </View>

//           <View style={styles.spacer} />
//         </ScrollView>

//         {/* Fixed Footer */}
//         <View style={styles.footer}>
//           <TouchableOpacity 
//             style={styles.actionButton}
//             onPress={() => router.push('/(root)/screens/StarMatchForm')}
//           >
//             <Text style={styles.actionButtonText}>Check Another Match</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#0d0b1a',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#0d0b1a',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#0d0b1a',
//   },
//   loadingText: {
//     marginTop: 16,
//     color: '#fff',
//     fontSize: 16,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 16,
//     backgroundColor: 'rgba(13, 11, 26, 0.9)',
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'flex-start',
//   },
//   headerTitle: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     flex: 1,
//   },
//   shareButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'flex-end',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scoreCard: {
//     alignItems: 'center',
//     padding: 24,
//     backgroundColor: '#1a1629',
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },
//   scoreCircle: {
//     width: 180,
//     height: 180,
//     borderRadius: 90,
//     backgroundColor: '#0d0b1a',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 10,
//     borderColor: '#3211d4',
//     marginBottom: 24,
//   },
//   scorePercentage: {
//     fontSize: 42,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   scoreLabel: {
//     fontSize: 14,
//     color: '#a5b4fc',
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     letterSpacing: 1,
//   },
//   verdictContainer: {
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   verdictBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 12,
//     borderWidth: 1,
//     marginBottom: 8,
//   },
//   verdictText: {
//     fontSize: 12,
//     fontWeight: 'bold',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   verdictTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   verdictSubtitle: {
//     fontSize: 14,
//     color: '#9ca3af',
//     textAlign: 'center',
//   },
//   scoreSummary: {
//     width: '100%',
//     backgroundColor: 'rgba(50, 17, 212, 0.1)',
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(50, 17, 212, 0.2)',
//   },
//   scoreHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   scoreHeaderText: {
//     color: '#a5b4fc',
//     fontSize: 12,
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   scoreValue: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   progressBar: {
//     height: 6,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 3,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-end',
//     paddingHorizontal: 16,
//     marginTop: 32,
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   sectionSubtitle: {
//     color: '#6b7280',
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   resultsContainer: {
//     paddingHorizontal: 12,
//     marginBottom: 100,
//   },
//   resultCard: {
//     flexDirection: 'row',
//     backgroundColor: '#1a1629',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.05)',
//   },
//   resultContent: {
//     flex: 1,
//     marginRight: 12,
//   },
//   resultHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   resultBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//     borderWidth: 1,
//   },
//   resultBadgeText: {
//     fontSize: 10,
//     fontWeight: 'bold',
//     textTransform: 'uppercase',
//   },
//   resultScore: {
//     color: '#fbbf24',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   resultName: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 4,
//   },
//   resultReason: {
//     color: '#9ca3af',
//     fontSize: 13,
//     lineHeight: 18,
//   },
//   resultIcon: {
//     width: 56,
//     height: 56,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   footer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: 'rgba(13, 11, 26, 0.9)',
//     padding: 16,
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   actionButton: {
//     backgroundColor: '#6c5ce7',
//     height: 56,
//     borderRadius: 14,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   actionButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   spacer: {
//     height: 100,
//   },
// });

// export default StarMatchResult;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import userApi from '../api/userApi';

const { width } = Dimensions.get('window');

interface PoruthamResult {
  key: string;
  name: string;
  result: string;
  reason: string;
  weight: number;
  score: number;
}

interface MatchResult {
  score: number;
  percentage: number;
  verdict: string;
  totalWeight: number;
  results: PoruthamResult[];
}

interface ApiResponse {
  code: number;
  status: string;
  message: string;
  data: {
    percentage: number;
    score: number;
    totalWeight: number;
    verdict: string;
    results: PoruthamResult[];
  };
}

interface FormData {
  bride: {
    name: string;
    dob: string;
    tob: string;
    place: string;
    star: string;
    rasi: string;
  };
  groom: {
    name: string;
    dob: string;
    tob: string;
    place: string;
    star: string;
    rasi: string;
  };
}

const StarMatchResult = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<MatchResult | null>(null);
  const { formData } = useLocalSearchParams<{ formData: string }>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parse the form data from route params
        let requestData = {
          bride: {
            name: "Bride",
            dob: "1990-01-01",
            tob: "00:00",
            place: "Unknown",
            star: "Aswini",
            rasi: "mesham"
          },
          groom: {
            name: "Groom",
            dob: "1990-01-01",
            tob: "00:00",
            place: "Unknown",
            star: "Aswini",
            rasi: "mesham"
          }
        };

        if (formData) {
          try {
            requestData = JSON.parse(formData);
            console.log('Parsed form data for star match:', JSON.stringify(requestData, null, 2));
          } catch (e) {
            console.error('Error parsing formData:', e);
          }
        }

        // Make the API call with the request data
        const response = await userApi.starMatching(requestData);
        console.log('Star Match API Response:', response.data);

        // Transform the API response to match your MatchResult interface
        if (response.data && response.data.data) {
          const apiData = response.data.data;
          const formattedResult: MatchResult = {
            score: apiData.score,
            percentage: apiData.percentage,
            totalWeight: apiData.totalWeight,
            verdict: apiData.verdict,
            results: apiData.results || []
          };
          setResult(formattedResult);
        }
      } catch (error) {
        console.error('Error fetching star match data:', error);
        // Fallback to show error state
        const mockResponse: MatchResult = {
          score: 0,
          percentage: 0,
          totalWeight: 100,
          verdict: 'ERROR',
          results: []
        };
        setResult(mockResponse);
        Alert.alert('Error', 'Failed to fetch compatibility results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [formData]);

  const getResultColor = (result: string) => {
    switch (result) {
      case 'PASS': return '#10b981';
      case 'FAIL': return '#ef4444';
      case 'PARTIAL': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'PASS': return 'check-circle';
      case 'FAIL': return 'close-circle';
      case 'PARTIAL': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const getPoruthamIcon = (key: string) => {
    const icons: Record<string, string> = {
      nadi: 'water',
      rajju: 'link-variant',
      gana: 'account-group',
      yoni: 'paw',
      mahendra: 'crown',
      streedhirga: 'gender-female',
      rasi: 'zodiac-aries',
      rasi_adhipathi: 'star',
      vasya: 'handshake',
      dina: 'calendar-heart'
    };
    return icons[key] || 'help-circle';
  };

  const handleShare = async () => {
    if (!result || !formData) return;
    try {
      const parsed: FormData = JSON.parse(formData as string);
      const emoji = (r: string) => r === 'PASS' ? '✅' : r === 'FAIL' ? '❌' : '⚠️';
      const lines = result.results.map(r => `${emoji(r.result)} ${r.name}: ${r.score}/${r.weight}`);
      const message = [
        `🌟 Jathaga Porutham Result`,
        `👰 Bride: ${parsed.bride.name} (${parsed.bride.star} / ${parsed.bride.rasi})`,
        `🤵 Groom: ${parsed.groom.name} (${parsed.groom.star} / ${parsed.groom.rasi})`,
        ``,
        `📊 Score: ${result.score}/${result.totalWeight} Points (${result.percentage}%)`,
        `🏆 Verdict: ${result.verdict}`,
        ``,
        `Detailed Porutham:`,
        ...lines,
        ``,
        `Checked via Vaibhav Vivaaha Matrimony`,
      ].join('\n');
      await Share.share({ message });
    } catch (error) {
      console.error(error);
    }
  };


  if (isLoading || !result) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1F7FE5" />
        <Text style={styles.loadingText}>Analyzing compatibility...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={22} color="#1F7FE5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compatibility Result</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <MaterialIcons name="share" size={24} color="#1F7FE5" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Score Card */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scorePercentage}>{result.percentage}%</Text>
              <Text style={styles.scoreLabel}>Match</Text>
            </View>

            <View style={styles.verdictContainer}>
              <View style={[styles.verdictBadge, { backgroundColor: `${getResultColor('PASS')}20`, borderColor: getResultColor('PASS') }]}>
                <Text style={[styles.verdictText, { color: getResultColor('PASS') }]}>{result.verdict}</Text>
              </View>
              <Text style={styles.verdictTitle}>Uttama Porutham</Text>
              <Text style={styles.verdictSubtitle}>Highly compatible for a prosperous life</Text>
            </View>

            {/* Score Summary */}
            <View style={styles.scoreSummary}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreHeaderText}>Score Summary</Text>
                <Text style={styles.scoreValue}>{result.score} / {result.totalWeight} Points</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(result.score / result.totalWeight) * 100}%`,
                      backgroundColor: getResultColor('PASS')
                    }
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Detailed Analysis */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Detailed Analysis</Text>
            <Text style={styles.sectionSubtitle}>{result.results.length} Factor Match</Text>
          </View>

          {/* Results List */}
          <View style={styles.resultsContainer}>
            {result.results.map((item) => (
              <View key={item.key} style={[styles.resultCard, { borderLeftColor: getResultColor(item.result) }]}>
                <View style={styles.resultContent}>
                  <View style={styles.resultHeader}>
                    <View style={[styles.resultBadge, { backgroundColor: `${getResultColor(item.result)}15`, borderColor: getResultColor(item.result) }]}>
                      <Text style={[styles.resultBadgeText, { color: getResultColor(item.result) }]}>{item.result}</Text>
                    </View>
                    <Text style={styles.resultScore}>{item.score} / {item.weight}</Text>
                  </View>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultReason}>{item.reason}</Text>
                </View>
                <View style={[styles.resultIcon, { backgroundColor: `${getResultColor(item.result)}15` }]}>
                  <MaterialCommunityIcons
                    name={getPoruthamIcon(item.key)}
                    size={28}
                    color={getResultColor(item.result)}
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.spacer} />
        </ScrollView>

        {/* Fixed Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(root)/screens/StarMatch')}
          >
            <Text style={styles.actionButtonText}>Check Another Match</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f7fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f7fa',
  },
  loadingText: {
    marginTop: 16,
    color: '#1F7FE5',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(15,35,70,0.06)',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    color: '#0f1724',
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    textAlign: 'center',
    flex: 1,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scoreCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#dfecfb',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#1F7FE5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 10,
    borderColor: '#1862b8',
    marginBottom: 24,
  },
  scorePercentage: {
    fontSize: 42,
    fontFamily: 'Rubik-Bold',
    color: '#ffffff',
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Rubik-Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verdictContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  verdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  verdictText: {
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verdictTitle: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    color: '#1F7FE5',
    marginBottom: 4,
  },
  verdictSubtitle: {
    fontSize: 14,
    color: '#1862b8',
    textAlign: 'center',
  },
  scoreSummary: {
    width: '100%',
    backgroundColor: '#eef6fd',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cfe4f7',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreHeaderText: {
    color: '#1862b8',
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    color: '#1F7FE5',
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#1F7FE5',
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
  },
  sectionSubtitle: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
  },
  resultsContainer: {
    paddingHorizontal: 12,
    marginBottom: 100,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  resultContent: {
    flex: 1,
    marginRight: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  resultBadgeText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
    textTransform: 'uppercase',
  },
  resultScore: {
    color: '#1F7FE5',
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
  },
  resultName: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    marginBottom: 4,
  },
  resultReason: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  resultIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  actionButton: {
    backgroundColor: '#dfecfb',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#1F7FE5',
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
  },
  spacer: {
    height: 100,
  },
});

export default StarMatchResult;