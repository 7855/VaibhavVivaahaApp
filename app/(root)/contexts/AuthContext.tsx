import React, { createContext, useContext, useEffect, useState } from 'react';
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
          console.log('User is online:---------------------->', storedUserId);
          userApi.lastSeen(storedUserId);
          console.log('User is online:---------------------->', storedUserId);
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
        console.log('User is online:---------------------->', storedUserId);
        userApi.lastSeen(storedUserId);
        console.log('User is online:---------------------->', storedUserId);
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
        // await AsyncStorage.multiRemove(['userId', 'firstName', 'lastName', 'gender', 'location', 'casteId', 'isUser', 'hasStarted', 'mobileNumber', 'profileImage', 'userDetailId']);
        AsyncStorage.clear();
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
      
      // Update last seen status
      await handleLogout();
      
      console.log('Logout completed successfully');
      
      // Clear navigation stack and go to main
      // router.replace('/(root)/(main)');
      // router.replace('/(root)/(main)/LoginScreen');
      // Wait a moment after navigation
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const sendMessage = (conversationId: string, message: string) => {
    if (!userId) {
      console.error('Cannot send message: User not logged in');
      return;
    }
    webSocketService.sendChatMessagePublic(conversationId, message);
  };

  const addChatListener = (callback: (data: WebSocketMessage['data']) => void) => {
    if (!userId) {
      console.error('Cannot add chat listener: User not logged in');
      return;
    }
    webSocketService.addChatListenerPublic(callback);
  };

  const removeChatListener = () => {
    if (!userId) {
      console.error('Cannot remove chat listener: User not logged in');
      return;
    }
    webSocketService.removeChatListenerPublic();
  };

  return (
    <AuthContext.Provider value={{ userId, isOnline, login, logout, sendMessage, addChatListener, removeChatListener }}>
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
