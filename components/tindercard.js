import React, { useState, useMemo } from 'react';
import { ImageBackground, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardContainer: {
    width: '99%',
    height: 550,
  },
  card: {
    position: 'absolute',
    backgroundColor: '#fff',
    width: '100%',
    height: 550,
    shadowRadius: 20,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 20,
  },
  cardTitle: {
    position: 'absolute',
    bottom: 70,
    margin: 10,
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 20,
  },
  jobPosition: {
    position: 'absolute',
    bottom: 40,
    margin: 10,
    color: '#fff',
    fontSize: 14,
    padding: 10,
    borderRadius: 20,
  },
  buttons: {
    margin: -40,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
  },
  remove: {
    backgroundColor: 'whitesmoke',
    shadowColor: 'black',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  heart: {
    backgroundColor: 'whitesmoke',
    shadowColor: 'black',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 7,
  },
  fav: {
    backgroundColor: 'whitesmoke',
    shadowColor: 'black',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
};

const db = [
  {
    name: 'Madhu',
    img: require('../assets/images/bride2.jpeg'),
    age: 22,
    job: 'Software Engineer',
  },
  {
    name: 'Gowri Shankar',
    img: require('../assets/images/groom1.jpg'),
    age: 25,
    job: 'Software Engineer',
  },
  {
    name: 'Jenova',
    img: require('../assets/images/bride3.jpeg'),
    age: 24,
    job: 'Software Engineer',
  },
  {
    name: 'Mugesh Ramesh',
    img: require('../assets/images/groom2.jpg'),
    age: 23,
    job: 'Software Engineer',
  },
  {
    name: 'Yokesh Raj',
    img: require('../assets/images/groom3.jpg'),
    age: 26,
    job: 'Software Engineer',
  },
];

let charactersState = db;
const alreadyRemoved = [];

const Advanced = () => {
  const [characters, setCharacters] = useState(db);

  const swiped = (direction, nameToDelete) => {
    console.log('removing: ' + nameToDelete + ' to the ' + direction);
    alreadyRemoved.push(nameToDelete);
  };

  const outOfFrame = (name) => {
    console.log(name + ' left the screen!');
    charactersState = charactersState.filter((character) => character.name !== name);
    setCharacters(charactersState);
  };

  const removeCard = (cardName) => {
    alreadyRemoved.push(cardName);
    setCharacters((prevCharacters) =>
      prevCharacters.filter((character) => character.name !== cardName)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {characters.map((character, index) => (
          <View key={character.name} style={styles.card}>
            <ImageBackground style={styles.cardImage} source={character.img}>
              <Text style={styles.cardTitle}>
                {character.name},{character.age} {'\n'}
              </Text>
              <Text style={styles.jobPosition}>{character.job}</Text>
            </ImageBackground>
          </View>
        ))}
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity onPress={() => removeCard(characters[characters.length - 1]?.name)} style={styles.remove}>
          <Icon name="times" size={30} color="red" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => removeCard(characters[characters.length - 1]?.name)} style={styles.heart}>
          <Icon name="heart" size={35} color="green" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeCard(characters[characters.length - 1]?.name)} style={styles.fav}>
          <Icon name="star" size={30} color="green" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Advanced;


// import React, { useState, useMemo } from 'react';
// import { ImageBackground, Text, View, TouchableOpacity } from 'react-native';
// import TinderCard from 'react-tinder-card';
// import Icon from 'react-native-vector-icons/FontAwesome';

// const styles = {
//   container: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: '100%',
//   },
//   cardContainer: {
//     width: '93%',
//     height: 550,
//   },
//   card: {
//     position: 'absolute',
//     backgroundColor: '#fff',
//     width: '100%',
//     height: 550,
//     shadowRadius: 20,
//     borderRadius: 20,
//     resizeMode: 'cover',
//   },
//   cardImage: {
//     width: '100%',
//     height: '100%',
//     overflow: 'hidden',
//     borderRadius: 20,
//   },
//   cardTitle: {
//     position: 'absolute',
//     bottom: 70,
//     margin: 10,
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: 'bold',
//     padding: 10,
//     borderRadius: 20,
//   },
//   jobPosition: {
//     position: 'absolute',
//     bottom: 40,
//     margin: 10,
//     color: '#fff',
//     fontSize: 14,
//     padding: 10,
//     borderRadius: 20,
//   },
//   buttons: {
//     margin: -40,
//     zIndex: 100,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 40,
//   },
//   remove: {
//     backgroundColor: 'whitesmoke',
//     shadowColor: 'black',
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     borderRadius: 50,
//     width: 60,
//     height: 60,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   heart: {
//     backgroundColor: 'whitesmoke',
//     shadowColor: 'black',
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     borderRadius: 50,
//     width: 70,
//     height: 70,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 7,
//   },
//   fav: {
//     backgroundColor: 'whitesmoke',
//     shadowColor: 'black',
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     borderRadius: 50,
//     width: 60,
//     height: 60,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 10,
//   },
// };

// const db = [
//   {
//     name: 'Madhu',
//     img: require('../assets/images/bride2.jpeg'),
//     age: 22,
//     job: 'Software Engineer',
//   },
//   {
//     name: 'Gowri Shankar',
//     img: require('../assets/images/groom1.jpg'),
//     age: 25,
//     job: 'Software Engineer',
//   },
//   {
//     name: 'Jenova',
//     img: require('../assets/images/bride3.jpeg'),
//     age: 24,
//     job: 'Software Engineer',
//   },
//   {
//     name: 'Mugesh Ramesh',
//     img: require('../assets/images/groom2.jpg'),
//     age: 23,
//     job: 'Software Engineer',
//   },
//   {
//     name: 'Yokesh Raj',
//     img: require('../assets/images/groom3.jpg'),
//     age: 26,
//     job: 'Software Engineer',
//   },
// ];

// const alreadyRemoved = [];
// let charactersState = db;

// const Advanced = () => {
//   const [characters, setCharacters] = useState(db);
//   const [lastDirection, setLastDirection] = useState();

//   const childRefs = useMemo(() => Array(db.length).fill(0).map((i) => React.createRef()), []);

//   const swiped = (direction, nameToDelete) => {
//     console.log('removing: ' + nameToDelete + ' to the ' + direction);
//     setLastDirection(direction);
//     alreadyRemoved.push(nameToDelete);
//   };

//   const outOfFrame = (name) => {
//     console.log(name + ' left the screen!');
//     charactersState = charactersState.filter((character) => character.name !== name);
//     setCharacters(charactersState);
//   };

//   const swipe = (dir) => {
//     const cardsLeft = characters.filter((person) => !alreadyRemoved.includes(person.name));
//     if (cardsLeft.length) {
//       const toBeRemoved = cardsLeft[cardsLeft.length - 1].name;
//       const index = db.map((person) => person.name).indexOf(toBeRemoved);
//       alreadyRemoved.push(toBeRemoved);
//       childRefs[index].current.swipe(dir);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.cardContainer}>
//         {characters.map((character, index) => (
//           <TinderCard
//             className="pressable"
//             ref={childRefs[index]}
//             key={character.name}
//             onSwipe={(dir) => swiped(dir, character.name)}
//             onCardLeftScreen={() => outOfFrame(character.name)}
//             preventSwipe={'left,up,down'}
//           >
//             <View style={styles.card}>
//               <ImageBackground style={styles.cardImage} source={character.img}>
//                 <Text style={styles.cardTitle}>
//                   {character.name},{character.age} {'\n'}
//                 </Text>
//                 <Text style={styles.jobPosition}>{character.job}</Text>
//               </ImageBackground>
//             </View>
//           </TinderCard>
//         ))}
//       </View>
//       <View style={styles.buttons}>
//         <TouchableOpacity onPress={() => swipe('left')} style={styles.remove}>
//           <Icon name="times" size={30} color="red" />
//         </TouchableOpacity>

//         <TouchableOpacity onPress={() => swipe('right')} style={styles.heart}>
//           <Icon name="heart" size={35} color="green" />
//         </TouchableOpacity>
//         <TouchableOpacity onPress={() => swipe('right')} style={styles.fav}>
//           <Icon name="star" size={30} color="green" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// export default Advanced;
