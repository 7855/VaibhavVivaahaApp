export interface Notification {
    id: string;
    type: 'profile_view' | 'like' | 'message' | 'match' | 'interest' | 'shortlist';
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    avatar?: string;
    userName?: string;
    userAge?: number;
    userLocation?: string;
  }
  
  export type NotificationFilter = 'all' | 'profile_view' | 'like' | 'message' | 'match' | 'interest' | 'shortlist';