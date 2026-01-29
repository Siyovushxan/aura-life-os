import { db } from "@/firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";

export interface SubscriptionData {
    planId: "trial" | "individual" | "family";
    status: "active" | "past_due" | "canceled" | "expired";
    currentPeriodStart: any;
    currentPeriodEnd: any;
    cancelAtPeriodEnd: boolean;
    memberCount?: number;
    amount: number;
    currency: string;
}

export const billingService = {
    /**
     * Fetch user subscription data from Firestore
     */
    async getUserSubscription(uid: string): Promise<SubscriptionData | null> {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                return data.subscription || null;
            }
            return null;
        } catch (error) {
            console.error("Error fetching subscription:", error);
            return null;
        }
    },

    /**
     * Mock upgrade to Individual plan
     */
    async upgradeToIndividual(uid: string): Promise<boolean> {
        try {
            const userRef = doc(db, "users", uid);
            const now = new Date();
            const nextMonth = new Date();
            nextMonth.setMonth(now.getMonth() + 1);

            const subscription: SubscriptionData = {
                planId: "individual",
                status: "active",
                currentPeriodStart: serverTimestamp(),
                currentPeriodEnd: Timestamp.fromDate(nextMonth),
                cancelAtPeriodEnd: false,
                amount: 2.99,
                currency: "USD"
            };

            await updateDoc(userRef, {
                subscription,
                plan: "Individual" // Legacy support for profile.plan
            });
            return true;
        } catch (error) {
            console.error("Error upgrading to individual:", error);
            return false;
        }
    },

    /**
     * Mock upgrade to Family plan
     */
    async upgradeToFamily(uid: string, memberCount: number): Promise<boolean> {
        try {
            const userRef = doc(db, "users", uid);
            const now = new Date();
            const nextMonth = new Date();
            nextMonth.setMonth(now.getMonth() + 1);

            // Calculation logic: $3.00 base + $1.99 per member
            const amount = 3.00 + (memberCount * 1.99);

            const subscription: SubscriptionData = {
                planId: "family",
                status: "active",
                currentPeriodStart: serverTimestamp(),
                currentPeriodEnd: Timestamp.fromDate(nextMonth),
                cancelAtPeriodEnd: false,
                memberCount,
                amount: parseFloat(amount.toFixed(2)),
                currency: "USD"
            };

            await updateDoc(userRef, {
                subscription,
                plan: "Family"
            });
            return true;
        } catch (error) {
            console.error("Error upgrading to family:", error);
            return false;
        }
    }
};
