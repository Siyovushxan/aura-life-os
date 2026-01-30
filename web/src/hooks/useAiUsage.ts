import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from "@/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

export const useAiUsage = () => {
    const { user } = useAuth();
    const [usage, setUsage] = useState(0);
    const [limit, setLimit] = useState(5); // Default free limit
    const [loading, setLoading] = useState(true);
    const [planName, setPlanName] = useState('Free');

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // 1. Listen for subscription to set limits
        const subUnsub = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const planId = data?.subscription?.planId || 'free';

                // Define limits based on plan
                let newLimit = 5;
                if (planId === 'individual' || planId === 'AURA PERSONAL') newLimit = 50;
                if (planId === 'family' || planId === 'AURA FAMILY') newLimit = 100;
                if (planId === 'AURA LEGACY' || planId.includes('PRO')) newLimit = 500;

                setLimit(newLimit);
                setPlanName(planId);
            }
        });

        // 2. Listen for daily usage
        const today = new Date().toISOString().split('T')[0];
        const usageUnsub = onSnapshot(doc(db, "usage", user.uid, "daily", today), (snapshot) => {
            if (snapshot.exists()) {
                setUsage(snapshot.data()?.count || 0);
            } else {
                setUsage(0);
            }
            setLoading(false);
        });

        return () => {
            subUnsub();
            usageUnsub();
        };
    }, [user]);

    return {
        usage,
        limit,
        remaining: Math.max(0, limit - usage),
        percentage: Math.min(100, (usage / limit) * 100),
        loading,
        planName
    };
};
