"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { db } from '@/firebaseConfig';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { getLocalTodayStr } from '@/lib/dateUtils';

interface NotificationState {
    family: number;
    interests: number;
    tasks: number;
    finance: number;
    health: number;
    food: number;
    mind: number;
}

interface NotificationContextType {
    notifications: NotificationState;
    clearNotification: (module: keyof NotificationState) => void;
    setNotification: (module: keyof NotificationState, count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationState>({
        family: 0,
        interests: 0,
        tasks: 0,
        finance: 0,
        health: 0,
        food: 0,
        mind: 0,
    });

    // Real-time listener for Family Join Requests
    useEffect(() => {
        if (!user?.uid) {
            // Reset notifications when user is not authenticated
            setNotifications(prev => ({ ...prev, family: 0 }));
            return;
        }

        try {
            const q = query(
                collection(db, "family_groups"),
                where("ownerId", "==", user.uid),
                where("isDeleted", "==", false)
            );

            const unsubscribeFamily = onSnapshot(q, (snapshot) => {
                let totalRequests = 0;
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.joinRequests && Array.isArray(data.joinRequests)) {
                        totalRequests += data.joinRequests.length;
                    }
                });
                setNotifications(prev => ({ ...prev, family: totalRequests }));
            }, (error) => {
                console.error("Error listening for family requests:", error);
            });

            // Sub 3: Listen to ALL AI Insights to trigger notifications
            const modules: (keyof NotificationState)[] = ['finance', 'health', 'interests', 'tasks', 'food', 'mind'];
            const todayStr = getLocalTodayStr();

            const unsubInsights = modules.map(m => {
                return onSnapshot(doc(db, `users/${user.uid}/ai_insights/${m}_${todayStr}`), (snap) => {
                    if (snap.exists()) {
                        const insightData = snap.data();
                        const generatedAt = insightData.generatedAt;

                        // We need to re-fetch profile or use the one from unsubscribeUser to compare
                        // To keep it simple, we'll trigger a re-check of the profile's lastViewed
                        // Actually, the unsubscribeUser listener below will handle the profile.
                        // Let's just store the latest insight timestamps in a local state to help the user listener.
                        setLatestInsights(prev => ({ ...prev, [m]: generatedAt }));
                    }
                });
            });

            return () => {
                unsubscribeFamily();
                unsubInsights.forEach(unsub => unsub());
            };
        } catch (error) {
            console.error("Error setting up Firestore listeners:", error);
        }
    }, [user?.uid]);

    const [latestInsights, setLatestInsights] = useState<Record<string, string>>({});

    // Listen for User Profile to get lastViewed timestamps
    const [userData, setUserData] = useState<any>(null);

    // 1. Listen for User Profile changes
    useEffect(() => {
        if (!user) return;
        const unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            }
        });
        return () => unsubscribeUser();
    }, [user?.uid]);

    // 2. Calculate Notifications when Data or Insights change
    useEffect(() => {
        if (!userData) return;

        const lastViewed = userData.lastViewed || {};

        setNotifications(prev => {
            const newState = { ...prev };
            const modules: (keyof NotificationState)[] = ['finance', 'health', 'interests', 'tasks', 'food', 'mind'];
            modules.forEach(m => {
                const insightTime = latestInsights[m];
                const viewedTime = lastViewed[m];

                if (insightTime) {
                    newState[m] = (!viewedTime || viewedTime < insightTime) ? 1 : 0;
                } else {
                    newState[m] = 0;
                }
            });
            return newState;
        });
    }, [userData, latestInsights]);

    // Function to clear notifications for a module (e.g. when page is visited)
    const clearNotification = useCallback(async (module: keyof NotificationState) => {
        if (!user) return;

        // Loop Protection: If already 0, do nothing.
        // We need to access the current value. Since we are in a callback, we trust 'notifications' from context?
        // No, 'notifications' might be stale in this callback if not in dependency.
        // But we can use the state functional update to check? No, we need to block the DB call.

        // Better: Pass 'notifications' to dependency? No, that triggers recreation.
        // We will optimistically set it.

        setNotifications(prev => {
            if (prev[module] === 0) return prev; // No change
            return { ...prev, [module]: 0 };
        });

        if (module !== 'family') {
            const { updateUserProfile } = await import('@/services/userService');
            const now = new Date().toISOString();
            updateUserProfile(user.uid, {
                [`lastViewed.${module}`]: now
            }).catch(err => console.error("Error clearing notification:", err));
        }
    }, [user]);

    // V2: Centralized Path-Aware Logic
    const pathname = usePathname();

    // Mapping: Path Segment -> Notification Key
    const MODULE_PATHS: { [key: string]: keyof NotificationState } = React.useMemo(() => ({
        'family': 'family',
        'interests': 'interests',
        'tasks': 'tasks',
        'finance': 'finance',
        'health': 'health',
        'food': 'food',
        'mind': 'mind'
    }), []);

    // 1. Auto-Clear on Path Change
    useEffect(() => {
        if (!pathname) return;

        const segment = pathname.split('/').filter(Boolean)[1];
        const moduleKey = MODULE_PATHS[segment];

        if (moduleKey) {
            clearNotification(moduleKey);
        }
    }, [pathname, MODULE_PATHS, clearNotification]);

    // 2. Computed/Derived State for UI (Force 0 if active)
    const visibleNotifications = React.useMemo(() => {
        if (!pathname) return notifications;
        const segment = pathname.split('/').filter(Boolean)[1];
        const activeModule = MODULE_PATHS[segment];

        if (activeModule && notifications[activeModule] > 0) {
            return {
                ...notifications,
                [activeModule]: 0
            };
        }
        return notifications;
    }, [notifications, pathname, MODULE_PATHS]);

    const setNotification = useCallback((module: keyof NotificationState, count: number) => {
        setNotifications(prev => ({
            ...prev,
            [module]: count
        }));
    }, []);

    const contextValue = React.useMemo(() => ({
        notifications: visibleNotifications,
        clearNotification,
        setNotification
    }), [visibleNotifications, clearNotification, setNotification]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
