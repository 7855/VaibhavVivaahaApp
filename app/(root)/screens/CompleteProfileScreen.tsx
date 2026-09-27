// ─────────────────────────────────────────────────────────────────────────────
//  CompleteProfileScreen — the guided "Complete your profile" flow.
//
//  One hub, not a wizard of new forms: it lists the seven places a profile can
//  have gaps (photo, four detail sections, horoscope, interests), shows which
//  still do, and opens the EXISTING editor / profile-tab control for each.
//  Saving a section brings the member back here, the list refreshes from the
//  server, and if that step is now complete the next one opens by itself —
//  "Save moves to the next one" — while a member who backs out of a step
//  without saving simply lands back on the list. Every step is skippable by
//  tapping a different row; nothing is forced.
//
//  Reached from Home's completion widget (ring/summary tap) and the profile
//  tab's completion ring. Registered HEADERLESS in screens/_layout.tsx.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import userApi from '@/app/(root)/api/userApi';
import ProgressRing from '@/components/ProgressRing';
import {
  buildCompletionSteps, navigateToCompletionTarget, FIELD_LABEL, type CompletionStep,
} from '@/utils/profileSections';

const BG_GRADIENT = ['#d0dfeb', '#dde8f1', '#e9f0f6', '#f3f7fa'] as const;
const CTA_GRADIENT = ['#1F7FE5', '#1862b8'] as const;

type Completion = { percentage: number; status: string; label: string };
type Meta = { totalFields: number; completedFields: number; missingFields: string[] };

const missingSummary = (fields: string[]) => {
  const labels = fields.map((f) => FIELD_LABEL[f] || f);
  if (labels.length <= 3) return labels.join(' · ');
  return `${labels.slice(0, 3).join(' · ')} +${labels.length - 3} more`;
};

export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [steps, setSteps] = useState<CompletionStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // The step opened from this screen, so a return can tell "saved" from "backed out".
  const openedRef = useRef<{ id: string; hadMissing: number } | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) throw new Error('no user');
    const res = await userApi.getProfileCompletion(userId);
    const payload = res?.data?.data?.data;
    if (!payload?.meta) throw new Error('bad payload');
    const nextSteps = buildCompletionSteps(payload.meta.missingFields || []);
    setCompletion(payload.completion);
    setMeta(payload.meta);
    setSteps(nextSteps);
    return nextSteps;
  }, []);

  const openStep = useCallback((step: CompletionStep, all: CompletionStep[]) => {
    const pending = all.filter((s) => s.missing.length > 0);
    const idx = Math.max(0, pending.findIndex((s) => s.id === step.id));
    openedRef.current = { id: step.id, hadMissing: step.missing.length };
    navigateToCompletionTarget(router, step.target, { flow: `${idx + 1}/${pending.length}` });
  }, []);

  useFocusEffect(useCallback(() => {
    let alive = true;
    setError(false);
    (async () => {
      try {
        const fresh = await load();
        if (!alive) return;
        // Auto-advance only when the step we sent the member to actually got
        // completed — backing out of a form must not shove them into the next one.
        const opened = openedRef.current;
        openedRef.current = null;
        if (opened && opened.hadMissing > 0) {
          const now = fresh.find((s) => s.id === opened.id);
          if (now && now.missing.length === 0) {
            const next = fresh.find((s) => s.missing.length > 0);
            if (next) {
              Toast.show({ type: 'success', text1: 'Saved', text2: `Next: ${next.title}`, visibilityTime: 1600 });
              advanceTimer.current = setTimeout(() => { if (alive) openStep(next, fresh); }, 700);
            }
          }
        }
      } catch (e: any) {
        console.warn('[complete-profile] load failed:', e?.message);
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null; }
    };
  }, [load, openStep]));

  const pending = steps.filter((s) => s.missing.length > 0);
  const next = pending[0];
  const allDone = !loading && !error && steps.length > 0 && pending.length === 0;

  return (
    <View style={st.flex}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={st.flex} edges={['top', 'left', 'right']}>
        <View style={st.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={st.backPill}>
            <ChevronLeft size={20} color="#0f1724" />
          </TouchableOpacity>
          <View>
            <Text style={st.pageTitle}>Complete your profile</Text>
            <Text style={st.pageSub}>Fill each section once — no need to hunt for fields</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={st.center}>
              <ActivityIndicator size="small" color="#1F7FE5" />
              <Text style={st.muted}>Checking what&apos;s left…</Text>
            </View>
          ) : error ? (
            <View style={st.center}>
              <Text style={st.muted}>Could not load your progress.</Text>
              <TouchableOpacity style={st.retryBtn} onPress={() => { setLoading(true); setError(false); load().catch(() => setError(true)).finally(() => setLoading(false)); }}>
                <Text style={st.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Summary */}
              <View style={st.summaryCard}>
                <View style={st.ringWrap}>
                  <ProgressRing percentage={completion?.percentage ?? 0} size={72} strokeWidth={6} color="#1F7FE5" bgColor="rgba(31,127,229,0.12)" />
                  <Text style={st.ringText}>{completion?.percentage ?? 0}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.summaryTitle}>{allDone ? 'Profile complete 🎉' : (completion?.label || 'Your profile')}</Text>
                  <Text style={st.summarySub}>
                    {meta ? `${meta.completedFields} of ${meta.totalFields} fields` : ''}
                    {pending.length > 0 ? ` · ${pending.length} ${pending.length === 1 ? 'step' : 'steps'} left` : ''}
                  </Text>
                </View>
              </View>

              {/* Steps */}
              <Text style={st.sectionLabel}>STEPS</Text>
              {steps.map((step) => {
                const done = step.missing.length === 0;
                const isNext = !done && next?.id === step.id;
                return (
                  <TouchableOpacity
                    key={step.id}
                    style={[st.row, done && st.rowDone, isNext && st.rowNext]}
                    activeOpacity={0.75}
                    onPress={() => openStep(step, steps)}
                  >
                    <View style={[st.emojiChip, done && st.emojiChipDone]}>
                      <Text style={{ fontSize: 18 }}>{step.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[st.rowTitle, done && st.rowTitleDone]}>{step.title}</Text>
                      <Text style={st.rowSub} numberOfLines={2}>
                        {done ? 'Completed' : missingSummary(step.missing)}
                      </Text>
                    </View>
                    {done ? (
                      <View style={st.checkChip}><Check size={14} color="#fff" strokeWidth={3} /></View>
                    ) : (
                      <ChevronRight size={18} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>

        {!loading && !error && (
          <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => (next ? openStep(next, steps) : router.back())}
            >
              <LinearGradient colors={CTA_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.cta}>
                <Text style={st.ctaText}>{next ? `Continue · ${next.title}` : 'Done'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  flex: { flex: 1 },
  pageHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
  },
  backPill: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e7edf5', alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { fontSize: 17, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  pageSub: { fontSize: 11.5, fontFamily: 'Rubik-Regular', color: '#64748b', marginTop: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  muted: { fontSize: 13, fontFamily: 'Rubik-Regular', color: '#64748b' },
  retryBtn: { marginTop: 4, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7edf5' },
  retryText: { fontSize: 13, fontFamily: 'Rubik-Medium', color: '#1F7FE5' },

  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#e7edf5',
    shadowColor: '#1F7FE5', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    marginBottom: 18,
  },
  ringWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontSize: 15, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  summaryTitle: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  summarySub: { fontSize: 12, fontFamily: 'Rubik-Regular', color: '#64748b', marginTop: 3 },

  sectionLabel: { fontSize: 11, fontFamily: 'Rubik-Bold', color: '#64748b', letterSpacing: 0.6, marginBottom: 8, marginLeft: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#e7edf5',
  },
  rowNext: { borderColor: '#1F7FE5', borderWidth: 1.5 },
  rowDone: { opacity: 0.7 },
  emojiChip: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(31,127,229,0.10)',
  },
  emojiChipDone: { backgroundColor: 'rgba(46,154,92,0.12)' },
  rowTitle: { fontSize: 14, fontFamily: 'Rubik-Bold', color: '#0f1724' },
  rowTitleDone: { color: '#475569' },
  rowSub: { fontSize: 11.5, fontFamily: 'Rubik-Regular', color: '#64748b', marginTop: 2 },
  checkChip: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#2e9a5c', alignItems: 'center', justifyContent: 'center' },

  footer: {
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#e7edf5', backgroundColor: 'rgba(243,247,250,0.96)',
  },
  cta: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 15, fontFamily: 'Rubik-Bold', letterSpacing: 0.3 },
});
