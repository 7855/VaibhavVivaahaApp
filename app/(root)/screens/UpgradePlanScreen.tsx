import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Crown, Check } from 'lucide-react-native';
import userApi from '../api/userApi';
import { useUserData } from '../contexts/UserDataContext';
import { useSubscription } from '../contexts/subscriptionContext';
import { usePopup } from '../contexts/PopupContext';
import { PLAN_RANK, useActivePlans, type UpgradePlanOption } from '../utils/upgradeNavigation';
import RelationshipManagerView, { type AdminContact } from '../../../components/RelationshipManagerView';

/**
 * Generalized "pick a plan, raise an admin request" screen — reached from any
 * `popup.premiumRequired(...)` upgrade flow via `buildUpgradeAction()` (see
 * utils/upgradeNavigation.ts). Replaces the earlier Family-Access-only version of this screen;
 * same underlying pattern (plan picker → RelationshipManagerView callback form) now applies to
 * every "upgrade" scenario in the app, not just Family Access, since there's no self-serve
 * "upgrade my existing plan" checkout built anywhere.
 *
 * Route params:
 *  - featureName: what the user was trying to unlock (shown in the intro copy)
 *  - minPlan: the lowest plan title that actually has the feature (e.g. "Gold" for Family Access);
 *    when present, plans below it are excluded even if they're above the user's current plan
 *  - freeUser: '1' when reached from a Free user in PAYMENT_MODE=CONTACT (no self-serve checkout
 *    at all) — in that case there's no "current plan" to rank against, so all plans >= minPlan show
 */
export default function UpgradePlanScreen() {
  const { featureName, minPlan, freeUser } = useLocalSearchParams<{
    featureName?: string; minPlan?: string; freeUser?: string;
  }>();
  const { userData } = useUserData();
  const { subscriptionData } = useSubscription() || {};
  const popup = usePopup();
  const [selectedPlan, setSelectedPlan] = useState<UpgradePlanOption | null>(null);
  const [adminContact, setAdminContact] = useState<AdminContact | null>(null);

  useEffect(() => {
    userApi.getAdminContact()
      .then((res: any) => {
        if (res?.data?.data?.valueColumn) {
          try {
            setAdminContact(JSON.parse(res.data.data.valueColumn));
          } catch { }
        }
      })
      .catch(() => { });
  }, []);

  const currentPlanTitle = freeUser === '1' ? 'Free' : (subscriptionData?.planTitle || 'Free');
  const currentRank = PLAN_RANK[currentPlanTitle] || 1;
  const minRank = minPlan ? (PLAN_RANK[minPlan] || 1) : 1;

  // Only plans the backend still reports as active (subscription_plans.isActive='Y') are
  // purchasable — a tier the client deactivates in the DB disappears from this picker on the next
  // catalog refresh, with no code change. The rank filter below is unchanged; it just now runs
  // over the live list instead of a hardcoded one.
  const { plans: activePlans, loading: plansLoading } = useActivePlans();

  const eligiblePlans = useMemo(
    () => activePlans.filter((p) => {
      const rank = PLAN_RANK[p.title] || 1;
      return rank > currentRank && rank >= minRank;
    }),
    [activePlans, currentRank, minRank]
  );

  const feature = featureName || 'this feature';

  if (selectedPlan) {
    const fullName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim();
    return (
      <RelationshipManagerView
        planTitle={selectedPlan.title}
        planPrice={selectedPlan.price}
        planPeriod={selectedPlan.period}
        encodedUserId={userData?.userId || null}
        defaultName={fullName}
        defaultMobile={(userData as any)?.mobileNumber || ''}
        defaultEmail={(userData as any)?.email}
        adminContact={adminContact}
        popupError={(title, msg) => popup.error(title, msg)}
      />
    );
  }

  return (
    <View style={s.container}>
      <SafeAreaView edges={['top']} style={s.headerSafe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={22} color="#475569" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Upgrade for {feature}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={s.content}>
        <Text style={s.intro}>
          {currentPlanTitle !== 'Free'
            ? `You're currently on the ${currentPlanTitle} plan. Pick the plan that unlocks ${feature} and our team will contact you to complete the upgrade.`
            : `${feature} is a premium feature. Pick a plan below and our team will contact you to complete the upgrade.`}
        </Text>

        {eligiblePlans.length === 0 && plansLoading ? (
          // Only reachable when the sync seed itself had nothing eligible and the live refresh is
          // still in flight — showing "you're on our top plan" here would be wrong.
          <View style={s.emptyState}>
            <ActivityIndicator size="small" color="#1F7FE5" />
            <Text style={s.emptyText}>Loading plans…</Text>
          </View>
        ) : eligiblePlans.length === 0 ? (
          <View style={s.emptyState}>
            <Crown size={28} color="#94a3b8" />
            <Text style={s.emptyText}>You're already on our top plan for this feature.</Text>
          </View>
        ) : eligiblePlans.map((plan) => (
          <TouchableOpacity
            key={plan.title}
            activeOpacity={0.88}
            onPress={() => setSelectedPlan(plan)}
            style={s.planCard}
          >
            <LinearGradient
              colors={plan.title === 'Platinum' || plan.title === 'Gold' ? ['#420001', '#7a2d2d'] : ['#1F7FE5', '#1862b8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.planIcon}
            >
              <Crown size={20} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.planTitle}>{plan.title}</Text>
              <Text style={s.planTagline}>{plan.tagline}</Text>
              <Text style={s.planPeriod}>{plan.period}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.planPrice}>{plan.price}</Text>
              <View style={s.selectPill}>
                <Text style={s.selectPillText}>Select</Text>
                <Check size={12} color="#1F7FE5" strokeWidth={3} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f7fa' },
  headerSafe: { backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  backBtn: { padding: 8, marginRight: 4 },
  headerTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#0f1724' },

  content: { padding: 18 },
  intro: {
    fontSize: 13, fontFamily: 'Rubik-Regular', color: '#475569',
    lineHeight: 20, marginBottom: 20,
  },

  planCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  planIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  planTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  planTagline: { fontSize: 11, fontFamily: 'Rubik-Regular', color: '#94a3b8', marginTop: 2 },
  planPeriod: { fontSize: 11, fontFamily: 'Rubik-Medium', color: '#64748b', marginTop: 2 },
  planPrice: { fontSize: 16, fontFamily: 'Rubik-ExtraBold', color: '#1F7FE5' },
  selectPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: '#dfecfb', borderRadius: 100,
  },
  selectPillText: { fontSize: 10, fontFamily: 'Rubik-Bold', color: '#1F7FE5' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 13, fontFamily: 'Rubik-Medium', color: '#94a3b8', marginTop: 10, textAlign: 'center' },
});
