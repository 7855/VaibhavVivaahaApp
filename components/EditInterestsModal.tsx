// ─────────────────────────────────────────────────────────────
//  EditInterestsModal.tsx — Shared "Edit Your Interests" sheet
//  Multi-select chip grid (InterestChipGrid) + Save, backed by
//  userApi.updateUserHobbies. Used by profile.tsx and tabs.tsx
//  so there is one implementation instead of two.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal, View, ScrollView, Text as RNText, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InterestChipGrid from './InterestChipGrid';
import userApi from '../app/(root)/api/userApi';
import { usePopup } from '../app/(root)/contexts/PopupContext';
import { useMasterData } from '../app/(root)/contexts/MasterDataContext';

interface EditInterestsModalProps {
  visible: boolean;
  onClose: () => void;
  initialSelected: string[];
  userId?: string | null;
  refreshProfile?: () => void;
}

const EditInterestsModal: React.FC<EditInterestsModalProps> = ({
  visible,
  onClose,
  initialSelected,
  userId,
  refreshProfile,
}) => {
  const popup = usePopup();
  const { state: masterData } = useMasterData() || {};
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setSelected(initialSelected);
  }, [visible, initialSelected]);

  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await userApi.updateUserHobbies(userId, selected);
      if (res.data?.code === 200) {
        popup.success('Updated', 'Your interests have been updated.');
        onClose();
        refreshProfile?.();
      } else {
        popup.error('Error', res.data?.message || 'Failed to update interests.');
      }
    } catch (e) {
      popup.error('Error', 'Failed to update interests. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 16,
          // Bottom sheet sits flush against the screen edge, and this build is edge-to-edge, so
          // it draws behind the device nav bar. A fixed 40 was not enough on gesture-nav phones
          // and clipped the Save button. Keep 40 as the visual minimum on devices with no inset.
          paddingBottom: Math.max(40, insets.bottom + 24),
          paddingHorizontal: 20,
          maxHeight: '80%',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View>
              <RNText style={{ fontSize: 18, fontFamily: 'Rubik-ExtraBold', color: '#420001' }}>
                Edit Your Interests
              </RNText>
              <RNText style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                Select at least 3 interests
              </RNText>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={{
            backgroundColor: selected.length >= 3 ? '#d1fae5' : '#fef3c7',
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 14,
            alignSelf: 'flex-start',
            marginBottom: 14,
          }}>
            <RNText style={{
              fontSize: 11,
              fontFamily: 'Rubik-Bold',
              color: selected.length >= 3 ? '#065f46' : '#92400e',
            }}>
              {selected.length} selected {selected.length >= 3 ? '✓' : '(min 3)'}
            </RNText>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <InterestChipGrid
              selected={selected}
              masterTags={masterData?.interestTags}
              onToggle={(code) =>
                setSelected((prev) =>
                  prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
                )
              }
            />
          </ScrollView>

          <TouchableOpacity
            style={{
              backgroundColor: selected.length >= 3 ? '#420001' : '#9ca3af',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}
            disabled={selected.length < 3 || saving}
            onPress={handleSave}
          >
            <RNText style={{ color: '#fff', fontFamily: 'Rubik-Bold', fontSize: 14 }}>
              {saving ? 'Saving...' : 'Save Interests'}
            </RNText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default EditInterestsModal;
