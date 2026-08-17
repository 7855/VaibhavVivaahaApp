import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import userApi from '../api/userApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { webSocketService } from '../services/webSocketService';
import { router } from 'expo-router';

interface WebSocketMessage {
  type: string;
  data: {
    conversationId?: string;
    message?: string;
    timestamp?: string;
    senderId?: string;
  };
}

interface AuthContextType {
  userId: string | null;
  isOnline: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  sendMessage: (conversationId: string, message: string) => void;
  addChatListener: (callback: (data: WebSocketMessage['data']) => void) => void;
  removeChatListener: () => void;
}

// Export the context and provider as default
export default {
  AuthContext: createContext<AuthContextType | undefined>(undefined),
  AuthProvider: ({ children }: { children: React.ReactNode }) => {
    const [userId, setUserId] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState<boolean>(false);

    useEffect(() => {
      checkUserStatus();
      
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => {
        subscription.remove();
      };
    }, []);

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (userId) {
          await userApi.lastSeen(userId);
        }
      }
    };

    const checkUserStatus = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          setIsOnline(true);
          // console.log('User is online:---------------------->', storedUserId);
          userApi.lastSeen(storedUserId);
          // console.log('User is online:---------------------->', storedUserId);
          webSocketService.connect(storedUserId);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    const handleLogout = async () => {
      if (userId) {
        await userApi.lastSeen(userId);
        setUserId(null);
        setIsOnline(false);
        try {
          await AsyncStorage.removeItem('userId');
        } catch (error) {
          console.error('Error removing userId from storage:', error);
        }
      }
    };

    const login = async (userId: string) => {
      setUserId(userId);
      setIsOnline(true);
      try {
        await AsyncStorage.setItem('userId', userId);
        await webSocketService.connect(userId);
      } catch (error) {
        console.error('Error during login:', error);
        setIsOnline(false);
        throw error;
      }
    };

    const logout = async () => {
      try {
        console.log('Logout called');
        
        await handleLogout();
      } catch (error) {
        console.error('Error during logout:', error);
      }
    };

    const sendMessage = (conversationId: string, message: string) => {
      if (!userId) return;
      webSocketService.sendChatMessage(conversationId, message);
    };

    const addChatListener = (callback: (data: WebSocketMessage['data']) => void) => {
      webSocketService.addListener('chat_message', callback);
    };

    const removeChatListener = () => {
      webSocketService.removeListener('chat_message');
    };

    const value = {
      userId,
      isOnline,
      login,
      logout,
      sendMessage,
      addChatListener,
      removeChatListener,
    };

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }
};

interface WebSocketMessage {
  type: string;
  data: {
    conversationId?: string;
    message?: string;
    timestamp?: string;
    senderId?: string;
  };
}

interface AuthContextType {
  userId: string | null;
  isOnline: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  sendMessage: (conversationId: string, message: string) => void;
  addChatListener: (callback: (data: WebSocketMessage['data']) => void) => void;
  removeChatListener: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  // Mirror of `userId` readable from stable callbacks. The AppState handler below is
  // registered once on mount, so closing over `userId` directly meant it captured the
  // mount-time value (always null) — a user who logged in during this session never got
  // a background lastSeen ping. Every stable callback here reads this ref instead.
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      const currentUserId = userIdRef.current;
      if (currentUserId) {
        try { await userApi.lastSeen(currentUserId); } catch (_) {}
      }
    }
  }, []);

  const checkUserStatus = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedAuthToken = await AsyncStorage.getItem('authToken');

      // Zombie session guard: if we have a userId but no authToken,
      // the stored session is stale. Clear silently — don't redirect
      // (the user might already be on register/login page).
      if (storedUserId && !storedAuthToken) {
        console.warn('⚠️ Stale session detected (userId without authToken). Clearing.');
        try { await AsyncStorage.clear(); } catch (_) {}
        setUserId(null);
        setIsOnline(false);
        return;
      }

      if (storedUserId && storedAuthToken) {
        setUserId(storedUserId);
        setIsOnline(true);
        userApi.lastSeen(storedUserId).catch(() => {});
        webSocketService.connect(storedUserId);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  }, []);

  useEffect(() => {
    checkUserStatus();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [checkUserStatus, handleAppStateChange]);

  // `targetUserId` lets logout() hand in the id it snapshotted before clearing state —
  // by the time this runs the ref may already have been nulled by the re-render.
  const handleLogout = useCallback(async (targetUserId?: string | null) => {
    const id = targetUserId !== undefined ? targetUserId : userIdRef.current;
    if (id) {
      await userApi.lastSeen(id);
      setUserId(null);
      setIsOnline(false);
      try {
        AsyncStorage.clear();
      } catch (error) {
        console.error('Error removing userId from storage:', error);
      }
    }
  }, []);

  const login = useCallback(async (userId: string) => {
    setUserId(userId);
    setIsOnline(true);
    try {
      await AsyncStorage.setItem('userId', userId);
      await webSocketService.connect(userId);
    } catch (error) {
      console.error('Error during login:', error);
      setIsOnline(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('Logout called');

      const loggingOutUserId = userIdRef.current;

      // First, disconnect WebSocket
      console.log('WebSocketService: Starting logout process...');
      
      // Clear listeners and disconnect
      webSocketService.clearListeners();
      webSocketService.disconnect();
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear state
      setUserId(null);
      setIsOnline(false);
      // Clear async storage
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('authToken');
      
      // Update last seen status
      await handleLogout(loggingOutUserId);

      console.log('Logout completed successfully');

      // Clear navigation stack and go to main
      // router.replace('/(root)/(main)');
      // router.replace('/(root)/(main)/LoginScreen');
      // Wait a moment after navigation
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [handleLogout]);

  // These three intentionally read the `userId` STATE, not userIdRef — the ref is synced in
  // an effect, and React flushes child effects before parent ones, so a consumer reacting to
  // userId turning non-null (myChatList's chat-listener focus effect) would still see a stale
  // null ref on that first pass. Their identity only churns when userId actually changes.
  const sendMessage = useCallback((conversationId: string, message: string) => {
    if (!userId) {
      console.error('Cannot send message: User not logged in');
      return;
    }
    webSocketService.sendChatMessagePublic(conversationId, message);
  }, [userId]);

  const addChatListener = useCallback((callback: (data: WebSocketMessage['data']) => void) => {
    if (!userId) {
      console.error('Cannot add chat listener: User not logged in');
      return;
    }
    webSocketService.addChatListenerPublic(callback);
  }, [userId]);

  const removeChatListener = useCallback(() => {
    if (!userId) {
      console.error('Cannot remove chat listener: User not logged in');
      return;
    }
    webSocketService.removeChatListenerPublic();
  }, [userId]);

  // Memoized so the only thing that re-renders every consumer in the app is an actual
  // userId/isOnline change — not simply the provider itself re-rendering.
  const value = useMemo(
    () => ({ userId, isOnline, login, logout, sendMessage, addChatListener, removeChatListener }),
    [userId, isOnline, login, logout, sendMessage, addChatListener, removeChatListener]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
