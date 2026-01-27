import { Pedometer } from 'expo-sensors';
import { db } from '../firebaseConfig';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

/**
 * AURA Mobile Sensor Service
 * Monitors physical data and syncs to Firestore
 */

let lastSyncedSteps = 0;

export const startStepTracking = (userId, onUpdate) => {
    let subscription;

    const checkAvailability = async () => {
        const isAvailable = await Pedometer.isAvailableAsync();
        if (isAvailable) {
            subscription = Pedometer.watchStepCount(result => {
                onUpdate(result.steps);
                syncStepsToFirebase(userId, result.steps);
            });
        }
    };

    checkAvailability();
    return () => subscription && subscription.remove();
};

const syncStepsToFirebase = async (userId, steps) => {
    if (!userId || steps === lastSyncedSteps) return;

    // Throttle: only sync if steps increased by at least 10 or every 5 minutes (simplified for MVP)
    if (steps - lastSyncedSteps < 10) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const healthRef = doc(db, `users/${userId}/health/daily_${today}`);

    try {
        const snap = await getDoc(healthRef);
        if (snap.exists()) {
            await updateDoc(healthRef, {
                'metrics.steps': steps,
                lastSync: new Date().toISOString()
            });
        } else {
            await setDoc(healthRef, {
                date: today,
                metrics: {
                    steps: steps,
                    sleep: 0 // Placeholder
                },
                lastSync: new Date().toISOString()
            });
        }
        lastSyncedSteps = steps;
    } catch (e) {
        console.error("[SensorService] Sync failed:", e);
    }
};

export const syncSleepData = async (userId, hours) => {
    const today = new Date().toISOString().split('T')[0];
    const healthRef = doc(db, `users/${userId}/health/daily_${today}`);

    try {
        await updateDoc(healthRef, {
            'metrics.sleep': hours,
            lastSync: new Date().toISOString()
        });
    } catch (e) {
        // If doc doesn't exist, create it
        await setDoc(healthRef, {
            date: today,
            metrics: { steps: 0, sleep: hours },
            lastSync: new Date().toISOString()
        });
    }
};
