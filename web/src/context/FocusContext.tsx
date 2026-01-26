"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { startFocusSession, endFocusSession, incrementDistraction } from '@/services/focusService';

interface FocusContextType {
    isActive: boolean;
    isPaused: boolean;
    timeLeft: number;
    duration: number;
    sessionId: string | null;
    taskName: string | null;
    taskId: string | null;
    distractions: number;
    startSession: (mins: number, taskId?: string, taskName?: string) => Promise<void>;
    pauseSession: () => void;
    resumeSession: () => void;
    endSession: (status: 'completed' | 'failed' | 'cancelled') => Promise<void>;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [duration, setDuration] = useState(25);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [taskName, setTaskName] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [distractions, setDistractions] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive && !isPaused && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            handleComplete();
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, isPaused, timeLeft]);

    const handleComplete = async () => {
        if (user && sessionId) {
            // Play completion sound
            const completionSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bright-msg-notifier-1044.mp3');
            completionSound.play().catch(e => console.log("Audio play blocked by browser"));

            await endFocusSession(user.uid, sessionId, 'completed', distractions);
            setIsActive(false);
            setSessionId(null);
        }
    };

    const startSession = async (mins: number, tId?: string, tName?: string) => {
        if (!user) return;
        const id = await startFocusSession(user.uid, mins, tId, tName);
        setSessionId(id);
        setDuration(mins);
        setTimeLeft(mins * 60);
        setTaskId(tId || null);
        setTaskName(tName || null);
        setDistractions(0);
        setIsActive(true);
        setIsPaused(false);
    };

    const pauseSession = () => setIsPaused(true);
    const resumeSession = () => setIsPaused(false);

    const endSession = async (status: 'completed' | 'failed' | 'cancelled') => {
        if (user && sessionId) {
            await endFocusSession(user.uid, sessionId, status, distractions);
            setIsActive(false);
            setIsPaused(false);
            setSessionId(null);
        }
    };

    // Distraction detection (global)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && isActive && !isPaused && sessionId && user) {
                setDistractions(prev => {
                    const newCount = prev + 1;
                    incrementDistraction(user.uid, sessionId, prev);
                    return newCount;
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [isActive, isPaused, sessionId, user]);

    return (
        <FocusContext.Provider value={{
            isActive, isPaused, timeLeft, duration, sessionId, taskName, taskId, distractions,
            startSession, pauseSession, resumeSession, endSession
        }}>
            {children}
        </FocusContext.Provider>
    );
};

export const useFocus = () => {
    const context = useContext(FocusContext);
    if (context === undefined) {
        throw new Error('useFocus must be used within a FocusProvider');
    }
    return context;
};
