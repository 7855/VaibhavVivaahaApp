// import React, { useState, useMemo, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView } from 'react-native';
// // import TinderCard from 'react-tinder-card';

// interface TinderCardRef {
//   swipe: (direction: 'left' | 'right' | 'up' | 'down') => Promise<void>; // Ensuring Promise<void>
//   restoreCard: () => Promise<void>; // Ensuring Promise<void>
// }

// const db = [
//   { name: 'Richard Hendricks', url: 'https://content.jdmagicbox.com/comp/def_content_category/naturals-salons/315555217-10160429724219197-7446077994955993629-n-naturals-salons-194-5f38b.jpg' },
//   { name: 'Erlich Bachman', url: 'https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/photo-1588842867976-fd084ca2c87b' },
//   { name: 'Monica Hall', url: 'https://i.pinimg.com/236x/19/98/41/19984159fbec41ae092fa05e9b6e27fe.jpg' },
// ];

// type Direction = 'left' | 'right' | 'up' | 'down';

// function ProfileSwiper() {
//   const [currentIndex, setCurrentIndex] = useState(db.length - 1);
//   const [lastDirection, setLastDirection] = useState<Direction | null>(null);

//   const currentIndexRef = useRef(currentIndex);
//   const childRefs = useMemo(
//     () => Array(db.length).fill(0).map(() => React.createRef<TinderCardRef>()),
//     []
//   );

//   const updateCurrentIndex = (val: number) => {
//     setCurrentIndex(val);
//     currentIndexRef.current = val;
//   };

//   const canGoBack = currentIndex < db.length - 1;
//   const canSwipe = currentIndex >= 0;

//   const swiped = async (direction: Direction, nameToDelete: string, index: number) => {
//     setLastDirection(direction);
//     updateCurrentIndex(index - 1);
//   };

//   const outOfFrame = (name: string, idx: number) => {
//     console.log(`${name} (${idx}) left the screen!`, currentIndexRef.current);
//     if (currentIndexRef.current >= idx) {
//       childRefs[idx].current?.restoreCard();
//     }
//   };

//   const swipe = async (dir: Direction) => {
//     if (canSwipe && currentIndex >= 0) {
//       await childRefs[currentIndex].current?.swipe(dir); // Ensure this returns a Promise<void>
//     }
//   };

//   const goBack = async () => {
//     if (!canGoBack) return;
//     const newIndex = currentIndex + 1;
//     updateCurrentIndex(newIndex);
//     await childRefs[newIndex].current?.restoreCard();
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.title}>React Native Tinder Card</Text>
//       <View style={styles.cardContainer}>
//         {db.map((character, index) => (
//           <TinderCard
//             ref={childRefs[index]}
//             className="swipe"
//             key={character.name}
//             onSwipe={(dir: Direction) => swiped(dir, character.name, index)}
//             onCardLeftScreen={() => outOfFrame(character.name, index)}
//           >
//             <View style={[styles.card, { backgroundImage: `url(${character.url})` }]}>
//               <Image source={{ uri: character.url }} style={styles.cardImage} />
//               <Text style={styles.cardText}>{character.name}</Text>
//             </View>
//           </TinderCard>
//         ))}
//       </View>
//       <View style={styles.buttons}>
//         <TouchableOpacity
//           style={[styles.button, !canSwipe && styles.disabledButton]}
//           onPress={() => swipe('left')}
//           disabled={!canSwipe}
//         >
//           <Text style={styles.buttonText}>Swipe left!</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.button, !canGoBack && styles.disabledButton]}
//           onPress={() => goBack()}
//           disabled={!canGoBack}
//         >
//           <Text style={styles.buttonText}>Undo swipe!</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.button, !canSwipe && styles.disabledButton]}
//           onPress={() => swipe('right')}
//           disabled={!canSwipe}
//         >
//           <Text style={styles.buttonText}>Swipe right!</Text>
//         </TouchableOpacity>
//       </View>
//       {lastDirection ? (
//         <Text style={styles.infoText}>You swiped {lastDirection}</Text>
//       ) : (
//         <Text style={styles.infoText}>Swipe a card or press a button to get Restore Card button visible!</Text>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   cardContainer: {
//     width: '100%',
//     height: 400,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   card: {
//     width: 300,
//     height: 400,
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     marginBottom: 20,
//   },
//   cardImage: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 20,
//   },
//   cardText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 20,
//   },
//   buttons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '80%',
//     marginTop: 20,
//   },
//   button: {
//     backgroundColor: '#3498db',
//     padding: 10,
//     borderRadius: 5,
//     width: 100,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//   },
//   disabledButton: {
//     backgroundColor: '#c3c4d3',
//   },
//   infoText: {
//     fontSize: 16,
//     marginTop: 20,
//     color: '#3498db',
//   },
// });

// export default ProfileSwiper;
