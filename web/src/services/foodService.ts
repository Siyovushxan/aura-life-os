import { db } from "@/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export interface Meal {
    id: string;
    name: string;
    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time: string;
    image?: string;
}

export interface FoodDayLog {
    date: string;
    summary: {
        calories: { current: number; goal: number };
        protein: { current: number; goal: number };
        carbs: { current: number; goal: number };
        fat: { current: number; goal: number };
        water: { current: number; goal: number };
    };
    meals: Meal[];
}

const getDocRef = (userId: string, date: string) => doc(db, `users/${userId}/food/${date}`);

export const getFoodLog = async (userId: string, date: string): Promise<FoodDayLog | null> => {
    const snap = await getDoc(getDocRef(userId, date));
    return snap.exists() ? (snap.data() as FoodDayLog) : null;
};

export const addMeal = async (userId: string, date: string, meal: Meal) => {
    let log = await getFoodLog(userId, date);
    if (!log) {
        log = await seedFoodData(userId, date);
    }

    const newSummary = { ...log.summary };
    newSummary.calories.current += meal.calories;
    newSummary.protein.current += meal.protein;
    newSummary.carbs.current += meal.carbs;
    newSummary.fat.current += meal.fat;

    await updateDoc(getDocRef(userId, date), {
        meals: arrayUnion(meal),
        summary: newSummary
    });
};

export const removeMeal = async (userId: string, date: string, meal: Meal) => {
    const log = await getFoodLog(userId, date);
    if (!log) return;

    const newSummary = { ...log.summary };
    newSummary.calories.current = Math.max(0, newSummary.calories.current - meal.calories);
    newSummary.protein.current = Math.max(0, newSummary.protein.current - meal.protein);
    newSummary.carbs.current = Math.max(0, newSummary.carbs.current - meal.carbs);
    newSummary.fat.current = Math.max(0, newSummary.fat.current - meal.fat);

    await updateDoc(getDocRef(userId, date), {
        meals: arrayRemove(meal),
        summary: newSummary
    });
};

export const updateWaterIntake = async (userId: string, date: string, amount: number) => {
    // Amount can be positive or negative to add/remove
    // We need to read first to update properly or use dot notation if we trust client state, 
    // but reading is safer for consistency or Atomic increment
    // For simplicity with this structure, we'll read-modify-write or use increment if path known
    // Since summary is a nested map, we can update just the field
    const log = await getFoodLog(userId, date);
    if (!log) return;

    const newWater = Math.max(0, log.summary.water.current + amount);

    await updateDoc(getDocRef(userId, date), {
        "summary.water.current": newWater
    });
};

export const seedFoodData = async (userId: string, date: string): Promise<FoodDayLog> => {
    const data: FoodDayLog = {
        date,
        summary: {
            calories: { current: 0, goal: 2000 },
            protein: { current: 0, goal: 150 },
            carbs: { current: 0, goal: 250 },
            fat: { current: 0, goal: 70 },
            water: { current: 0, goal: 2500 },
        },
        meals: []
    };

    await setDoc(getDocRef(userId, date), data);
    return data;
};
