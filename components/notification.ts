/** One row of /notifications/getAllNotifications, normalised for the screen. */
export interface Notification {
  id: string;
  /** Raw backend category, upper-case: MESSAGE, INTEREST, INTEREST_ACCEPTED, PROFILE_VIEW, LIKE,
   *  SHORTLIST, DAILY_MATCH, CALL_REQUEST, PAYMENT_SUCCESS, PAYMENT_REJECTED, IMAGE_REJECTED, or a
   *  restricted-field type (MOBILE, HOROSCOPE, PROFILE_IMAGE, BIRTH_TIME) for permission traffic. */
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  /** The other member in the event (message sender, interest sender, viewer…); 0 = system. */
  senderId: number;
  avatar?: string;
  userName?: string;
  userAge?: number;
  userLocation?: string;
}

/** Chip groups on the screen. Each maps to one or more backend categories (see GROUP_OF). */
export type NotificationFilter = 'all' | 'message' | 'interest' | 'permission' | 'activity' | 'other';

const PERMISSION_TYPES = ['MOBILE', 'HOROSCOPE', 'PROFILE_IMAGE', 'BIRTH_TIME'];

export function groupOf(type: string): Exclude<NotificationFilter, 'all'> {
  const t = (type || '').toUpperCase();
  if (t === 'MESSAGE') return 'message';
  if (t === 'INTEREST' || t === 'INTEREST_ACCEPTED' || t === 'MATCH') return 'interest';
  if (PERMISSION_TYPES.includes(t)) return 'permission';
  if (t === 'PROFILE_VIEW' || t === 'LIKE' || t === 'SHORTLIST') return 'activity';
  return 'other';
}
