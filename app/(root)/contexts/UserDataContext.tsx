import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
    userId: string | null;
    decodedUserId: string | null;
    firstName: string;
    lastName: string;
    gender: string;
    profileImage: string | null;
    location: string | null;
    casteId: string | null;
    email: string | null;
    mobileNumber: string | null;
    isUser: string | null;
    hasStarted: string | null;
}

interface UserDataContextType {
    userData: UserData;
    isLoaded: boolean;
    loadUserData: () => Promise<void>;
    updateField: (key: keyof UserData, value: string | null) => Promise<void>;
    clearUserData: () => void;
}

const defaultUserData: UserData = {
    userId: null,
    decodedUserId: null,
    firstName: '',
    lastName: '',
    gender: '',
    profileImage: null,
    location: null,
    casteId: null,
    email: null,
    mobileNumber: null,
    isUser: null,
    hasStarted: null,
};

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userData, setUserData] = useState<UserData>(defaultUserData);
    const [isLoaded, setIsLoaded] = useState(false);
    const loadedRef = useRef(false);

    const loadUserData = useCallback(async () => {
        try {
            const keys = ['userId', 'firstName', 'lastName', 'gender', 'profileImage', 'location', 'casteId', 'email', 'mobileNumber', 'isUser', 'hasStarted'];
            const results = await AsyncStorage.multiGet(keys);

            const data: Record<string, string | null> = {};
            results.forEach(([key, value]) => {
                data[key] = value;
            });

            let decodedUserId: string | null = null;
            if (data.userId) {
                try {
                    decodedUserId = atob(data.userId);
                } catch {
                    decodedUserId = data.userId;
                }
            }

            setUserData({
                userId: data.userId || null,
                decodedUserId,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                gender: data.gender || '',
                profileImage: data.profileImage || null,
                location: data.location || null,
                casteId: data.casteId || null,
                email: data.email || null,
                mobileNumber: data.mobileNumber || null,
                isUser: data.isUser || null,
                hasStarted: data.hasStarted || null,
            });

            loadedRef.current = true;
            setIsLoaded(true);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }, []);

    const updateField = useCallback(async (key: keyof UserData, value: string | null) => {
        try {
            if (key === 'decodedUserId') return; // derived field, don't store

            if (value !== null) {
                await AsyncStorage.setItem(key, value);
            } else {
                await AsyncStorage.removeItem(key);
            }

            setUserData(prev => {
                const updated = { ...prev, [key]: value };
                // Keep decodedUserId in sync
                if (key === 'userId') {
                    try {
                        updated.decodedUserId = value ? atob(value) : null;
                    } catch {
                        updated.decodedUserId = value;
                    }
                }
                return updated;
            });
        } catch (error) {
            console.error('Error updating user data field:', error);
        }
    }, []);

    const clearUserData = useCallback(() => {
        setUserData(defaultUserData);
        loadedRef.current = false;
        setIsLoaded(false);
    }, []);

    // Auto-load on mount
    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    return (
        <UserDataContext.Provider value={{ userData, isLoaded, loadUserData, updateField, clearUserData }}>
            {children}
        </UserDataContext.Provider>
    );
};

export const useUserData = () => {
    const context = useContext(UserDataContext);
    if (context === undefined) {
        throw new Error('useUserData must be used within a UserDataProvider');
    }
    return context;
};
