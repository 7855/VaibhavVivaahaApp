import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useSubscription } from '../app/(root)/contexts/subscriptionContext';
import { usePopup } from '../app/(root)/contexts/PopupContext';
import { buildUpgradeAction, upgradeMessage, resolveMinPlanTitle } from '../app/(root)/utils/upgradeNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 20) / 2 - 6; // 20 = section padding, 12 = grid gap

// Same palette as the profile page's cards (profile.tsx `C`), so the two screens read
// as one system.
const C = {
  brand: '#1F7FE5', brandSoft: '#dfecfb',
  lavender: '#8b6fd9', lavenderSoft: '#ebe5fb',
  amberDeep: '#c7811a', amberSoft: '#feead0',
  pink: '#e85a7a', pinkSoft: '#fde0e7',
  ink: '#0f1724', ink4: '#64748b', ink5: '#94a3b8',
  line: '#e7edf5', chev: '#f6f8fa', white: '#fff',
};

type Counts = { connections?: number; views?: number; shortlisted?: number };

type Action = {
  key: 'Connections' | 'Star Match' | 'Viewed You' | 'Shortlisted';
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  tint: string;
  tintSoft: string;
  /** Subtitle when there is no live count (or the action has none). */
  hint: string;
  /** Live count → "3 matched" etc. Omitted for Star Match, which has nothing to count. */
  count?: number;
  noun?: string;
  /** Entitlement floor the tap enforces; shown as a lock when the member lacks it. */
  minPlan?: 'Starter' | 'Classic';
  locked?: boolean;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const QuickAction = ({ counts }: { counts?: Counts }) => {
  const router = useRouter();
  const { subscriptionData } = useSubscription() || {};
  const popup = usePopup();
  const planTitle = subscriptionData?.planTitle;

  // Gate conditions are the SAME expressions the tap handlers use below — the lock
  // badge must never disagree with what happens on press.
  const starMatchLocked = !subscriptionData?.entitlements?.starMatch;
  const viewedYouLocked = !planTitle || planTitle === 'Free';

  const handleActionPress = (actionType: Action['key']) => {
    switch (actionType) {
      case 'Connections':
        router.push('/screens/ListUser?type=connection');
        break;
      case 'Star Match':
        if (starMatchLocked) {
          popup.premiumRequired(
            upgradeMessage('check horoscope compatibility with Star Match', 'Classic'),
            buildUpgradeAction({ planTitle, featureName: 'Star Match', minPlan: 'Classic' })
          );
          return;
        }
        router.push('/(root)/screens/StarMatch');
        break;
      case 'Viewed You':
        if (viewedYouLocked) {
          popup.premiumRequired(
            upgradeMessage('see who viewed your profile', 'Starter'),
            buildUpgradeAction({ planTitle, featureName: 'Who Viewed You', minPlan: 'Starter' })
          );
          return;
        }
        router.push('/screens/ListUser?type=viewed');
        break;
      case 'Shortlisted':
        router.push('/screens/ListUser?type=shortlisted');
        break;
      default:
        console.log('No route defined for:', actionType);
    }
  };

  const actions: Action[] = [
    { key: 'Connections', icon: 'people-alt', tint: C.brand, tintSoft: C.brandSoft, hint: 'Your matches', count: counts?.connections, noun: 'matched' },
    { key: 'Star Match', icon: 'auto-awesome', tint: C.lavender, tintSoft: C.lavenderSoft, hint: 'Compatibility', minPlan: 'Classic', locked: starMatchLocked },
    { key: 'Viewed You', icon: 'visibility', tint: C.amberDeep, tintSoft: C.amberSoft, hint: 'Profile views', count: counts?.views, noun: 'views', minPlan: 'Starter', locked: viewedYouLocked },
    { key: 'Shortlisted', icon: 'bookmark', tint: C.pink, tintSoft: C.pinkSoft, hint: 'Saved profiles', count: counts?.shortlisted, noun: 'saved' },
  ];

  const subtitleFor = (a: Action) => {
    // Displayed plan names go through the catalog (§17): retiring a tier is a DB flip.
    if (a.locked && a.minPlan) return `${resolveMinPlanTitle(a.minPlan)}+ plan`;
    // Subtitles must fit ~95pt at half width — keep every string short.
    if (typeof a.count === 'number' && a.noun) {
      if (a.count === 0) return a.hint;
      return a.noun === 'views' ? plural(a.count, 'view', 'views') : `${a.count} ${a.noun}`;
    }
    return a.hint;
  };

  return (
    <View style={styles.container}>
      {/* Header in the same shape as the Home shelves (title + icon-led subtitle). */}
      <View style={styles.header}>
        <Text style={styles.title}>Quick Actions</Text>
        <View style={styles.subtitleRow}>
          <Icon name="bolt" size={12} color="#8B3A3A" />
          <Text style={styles.subtitle}>Jump straight to what matters</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => handleActionPress(a.key)}
          >
            <View style={[styles.iconTile, { backgroundColor: a.tintSoft }]}>
              <MaterialIcons name={a.icon} size={22} color={a.tint} />
              {a.locked && (
                <View style={styles.lockBadge}>
                  <MaterialIcons name="lock" size={9} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.body}>
              <Text style={styles.cardTitle} numberOfLines={1}>{a.key}</Text>
              <Text style={[styles.cardSub, a.locked && styles.cardSubLocked]} numberOfLines={1}>
                {subtitleFor(a)}
              </Text>
            </View>
            <View style={styles.chev}>
              <MaterialIcons name="chevron-right" size={16} color={C.ink5} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    // Same top gap as the shelves above it (they use NativeBase mt={3} = 12), so the
    // section sits in the same rhythm as New Connections / Near You / All Matches.
    marginTop: 12,
    marginBottom: 20,
  },
  header: { marginBottom: 12 },
  title: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#162336',
  },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  subtitle: { fontSize: 12, fontFamily: 'Rubik-Regular', color: C.ink4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    padding: 10,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    // The app's card shadow: blue-tinted and shorter than the card gap, so it never
    // spills onto a neighbour (ProfileDetail, 2026-09-17).
    shadowColor: C.brand,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F6B733',
    borderWidth: 1.5,
    borderColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    color: C.ink,
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 10.5,
    fontFamily: 'Rubik-Regular',
    color: C.ink4,
    marginTop: 2,
  },
  cardSubLocked: { color: '#c7811a', fontFamily: 'Rubik-Medium' },
  chev: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.chev,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QuickAction;
