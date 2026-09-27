// ─────────────────────────────────────────────────────────────────────────────
//  onboarding.tsx — 3-screen first-run intro, shown ONCE before the login screen.
//
//  The slide artwork carries its own headline/subtitle baked into the image.
//  The pagination dots and the "Get Started" button that appeared in the source
//  designs were ERASED from the bundled webp files on purpose — painted-on
//  controls can't be tapped and painted dots can't advance, so the real,
//  interactive versions are rendered here instead, styled to match.
//
//  Completion writes AsyncStorage 'onboardingSeen'. That key deliberately
//  SURVIVES logout: all logout paths clear storage via clearStorageForLogout()
//  (utils/storage.ts), which preserves it — a member who signs out must land on
//  the login screen, not the intro. Raw AsyncStorage.clear() would resurface
//  this screen after every logout.
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import Swiper from 'react-native-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ⚠️ `contain`, deliberately — NOT `cover`. Every artwork in this set carries a
// decorative gold frame / lotus corners only ~2.2% inside its edge, and `cover`
// crops a fixed FRACTION of the width (~2-5% per side on a tall phone), which
// clips that frame. Padding the images wider cannot fix it: the crop scales
// proportionally, so a fixed-percentage inset is always eaten. `contain` shows
// each image whole, and because every slide's letterbox is painted in that
// image's own sampled edge colour it still reads as full-bleed.
//
// ⚠️ Sample these bgs from each image's TOP/BOTTOM EDGE AVERAGE, not its corners
// (`contain` letterboxes top/bottom on a phone, so those edges are what sits
// against the fill).
//
// All three sources are now natively 1080x1919 (9:16) — no margin synthesis
// anywhere, which is why the set finally reads as one design. Earlier revisions
// used a taller 0.462 crop of slide 3 and had to fabricate its side margins;
// if slide 3 is ever regenerated, ask for 9:16 and it drops straight in.
//
// Each slide's letterbox is painted in its own artwork's edge colour — the three
// images were generated separately and their maroons differ slightly; one shared
// bg would show a faint seam. Colours are SAMPLED from each file's corners
// (2026-08-18 set: Families First / A Match Worth Trusting / Two Hearts Unite).
const SLIDES = [
  { src: require('../../../assets/images/onboard1.webp'), bg: '#350204' }, // Two Hearts Unite
  { src: require('../../../assets/images/onboard2.webp'), bg: '#280200' }, // A Match Worth Trusting
  { src: require('../../../assets/images/onboard3.webp'), bg: '#290101' }, // Families First
];

// Sampled from the artwork so the live controls read as part of the designs:
// the button gold matches the erased "Get Started" outline, the maroon matches
// the slide backgrounds.
const GOLD = '#F0A94F';
const MAROON_DIM = 'rgba(64,1,2,0.55)';

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const swiperRef = useRef<Swiper>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    try {
      await AsyncStorage.setItem('onboardingSeen', 'true');
    } catch (_) {
      // Storage failing must never trap the user on the intro — worst case they
      // see it again next launch.
    }
    router.replace('/(root)/(main)/LoginScreen');
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* The artwork carries its own baked-in headline/subtitle near the bottom
          edge, so the image must NEVER sit underneath the control bar: slides are
          padded, the image is letterboxed with `contain` on the matching maroon
          background, and the dots/buttons live in their own reserved band below
          (normal flex flow, not an absolute overlay). */}
      <View style={{ flex: 1 }}>
        <Swiper
          ref={swiperRef}
          loop={false}
          showsPagination={false}
          onIndexChanged={setIndex}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={[styles.slide, { backgroundColor: slide.bg }]}>
              <Image source={slide.src} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </Swiper>
      </View>

      {/* Skip — hidden on the last screen, where Get Started is the only exit */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skip, { top: insets.top + 12 }]}
          onPress={finish}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Bottom controls — real replacements for the erased baked-in ones.
          A sibling of the Swiper, so it can never cover the artwork's text. */}
      <View
        style={[
          styles.bottom,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 10,
            // Matches the active slide, so the band merges into that image's
            // maroon rather than sitting on a fixed colour that clashes as the
            // slides change.
            backgroundColor: SLIDES[index].bg,
          },
        ]}
      >
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={styles.dotSlot}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </View>
          ))}
        </View>

        <View style={styles.buttonSlot}>
          {isLast ? (
            <TouchableOpacity onPress={finish} activeOpacity={0.88} style={styles.buttonShadow}>
              <LinearGradient
                colors={['#F6C15E', '#E29A38']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => swiperRef.current?.scrollBy(1)}
              activeOpacity={0.88}
              style={styles.buttonShadow}
            >
              <LinearGradient
                colors={['#F6C15E', '#E29A38']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Next</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Fallback only (first paint / over-scroll); each slide and the control band
    // paint their own colour.
    backgroundColor: '#350204',
  },
  slide: {
    flex: 1,
  },
  // Edge-to-edge: no padding, no corner radius. The artwork's own maroon runs to
  // the frame, and each slide's `bg` fills the top/bottom letterbox `contain`
  // leaves, so the image reads as full-bleed without ever cropping its lotus
  // corners or headline.
  image: {
    flex: 1,
    width: '100%',
  },
  skip: {
    position: 'absolute',
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: MAROON_DIM,
    borderWidth: 1,
    borderColor: 'rgba(240,169,79,0.45)',
  },
  skipText: {
    color: '#F5E7D0',
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    letterSpacing: 0.3,
  },
  bottom: {
    alignItems: 'center',
    paddingTop: 14,
    // backgroundColor is set per-slide inline (see above) — it must follow the
    // active image, so it is deliberately NOT fixed here.
  },
  dotsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  // Fixed-size slot per dot: the active pill grows INSIDE it, so neighbours
  // never shift and the row never changes size.
  dotSlot: {
    width: 24,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Inactive: fine hollow gold ring (jewellery-line look). Active: solid gold
  // pill with a soft glow — reads as an ornament, not a UI widget.
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.2,
    borderColor: 'rgba(240,169,79,0.55)',
    backgroundColor: 'transparent',
  },
  dotActive: {
    width: 18,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 0,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  // Both buttons render inside this identical slot — swapping Next for
  // Get Started can no longer change the band's height.
  buttonSlot: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonShadow: {
    borderRadius: 25,
    shadowColor: '#E29A38',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  cta: {
    width: 184,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#400102',
    fontSize: 14.5,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.6,
  },
});
