import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Eye, Heart, MessageCircle, Star, Bookmark, Phone, KeyRound, Sparkles, CreditCard, ImageOff, ChevronRight, Trash2, CheckCircle2,
} from 'lucide-react-native';
import { Notification } from './notification';

interface Props {
  notification: Notification;
  onPress: (n: Notification) => void;
  onDelete: (id: string) => void;
}

/** Icon + tint per backend category. Unknown categories get a neutral bell-ish sparkle. */
function iconFor(type: string) {
  const t = (type || '').toUpperCase();
  const s = 14;
  switch (t) {
    case 'MESSAGE':           return { node: <MessageCircle size={s} color="#fff" />, tint: '#10B981' };
    case 'INTEREST':          return { node: <Star size={s} color="#fff" />,          tint: '#F59E0B' };
    case 'INTEREST_ACCEPTED':
    case 'MATCH':             return { node: <CheckCircle2 size={s} color="#fff" />,  tint: '#1F7FE5' };
    case 'LIKE':              return { node: <Heart size={s} color="#fff" />,         tint: '#EF4444' };
    case 'PROFILE_VIEW':      return { node: <Eye size={s} color="#fff" />,           tint: '#3B82F6' };
    case 'SHORTLIST':         return { node: <Bookmark size={s} color="#fff" />,      tint: '#6366F1' };
    case 'CALL_REQUEST':      return { node: <Phone size={s} color="#fff" />,         tint: '#16A34A' };
    case 'MOBILE': case 'HOROSCOPE': case 'PROFILE_IMAGE': case 'BIRTH_TIME':
                              return { node: <KeyRound size={s} color="#fff" />,      tint: '#8B5CF6' };
    case 'DAILY_MATCH':       return { node: <Sparkles size={s} color="#fff" />,      tint: '#F6B733' };
    case 'PAYMENT_SUCCESS':
    case 'PAYMENT_REJECTED':  return { node: <CreditCard size={s} color="#fff" />,    tint: '#0EA5E9' };
    case 'IMAGE_REJECTED':    return { node: <ImageOff size={s} color="#fff" />,      tint: '#EF4444' };
    default:                  return { node: <Sparkles size={s} color="#fff" />,      tint: '#94A3B8' };
  }
}

export function timeAgo(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const NotificationCard: React.FC<Props> = ({ notification: n, onPress, onDelete }) => {
  const icon = iconFor(n.type);
  const isMessage = (n.type || '').toUpperCase() === 'MESSAGE';
  // A chat preview is deliberately ONE line: the tap opens the thread, and a wall of text
  // here would let people read messages without ever opening the chat (client, 2026-09-27).
  const lines = isMessage ? 1 : 2;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(n)} style={[styles.card, !n.isRead && styles.unread]}>
      <View style={styles.avatarWrap}>
        <Image
          source={n.avatar ? { uri: n.avatar } : require('../assets/images/defaultAvatar.png')}
          style={styles.avatar}
          fadeDuration={0}
        />
        <View style={[styles.typeDot, { backgroundColor: icon.tint }]}>{icon.node}</View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !n.isRead && styles.titleUnread]} numberOfLines={1}>
            {n.userName && !isMessage ? n.userName : n.title}
          </Text>
          <Text style={styles.time}>{timeAgo(n.timestamp)}</Text>
        </View>
        <Text style={styles.message} numberOfLines={lines} ellipsizeMode="tail">
          {isMessage && n.userName ? `${n.userName}: ` : ''}{n.message}
        </Text>
        {!!(n.userAge || n.userLocation) && !isMessage && (
          <Text style={styles.meta} numberOfLines={1}>
            {[n.userAge ? `${n.userAge} yrs` : null, n.userLocation].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>

      <View style={styles.trailing}>
        {!n.isRead && <View style={styles.unreadDot} />}
        <ChevronRight size={16} color="#cbd5e1" />
        <TouchableOpacity hitSlop={10} onPress={() => onDelete(n.id)} style={styles.trash}>
          <Trash2 size={13} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#e7edf5',
  },
  unread: { borderColor: '#bcd6f5', backgroundColor: '#f6faff' },
  avatarWrap: { marginRight: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#F6B733' },
  typeDot: {
    position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, minWidth: 0, fontSize: 14, fontFamily: 'Rubik-Medium', color: '#0f1724' },
  titleUnread: { fontFamily: 'Rubik-Bold' },
  time: { fontSize: 11, fontFamily: 'Rubik-Regular', color: '#94a3b8', flexShrink: 0 },
  message: { fontSize: 12.5, fontFamily: 'Rubik-Regular', color: '#475569', marginTop: 2, lineHeight: 17 },
  meta: { fontSize: 11, fontFamily: 'Rubik-Regular', color: '#94a3b8', marginTop: 3 },
  trailing: { alignItems: 'center', justifyContent: 'center', marginLeft: 8, gap: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1F7FE5' },
  trash: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
});

export default React.memo(NotificationCard);
