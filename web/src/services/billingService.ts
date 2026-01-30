import { db } from "@/firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp, collection, query, where, getDocs, orderBy } from "firebase/firestore";

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
                plan: "Individual"
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
    },

    /**
     * Fetch payment history for a user
     */
    async getPaymentHistory(uid: string): Promise<any[]> {
        console.log("[billingService] Fetching history for:", uid);
        try {
            const paymentsRef = collection(db, "payments");

            // Try without orderBy first to see if it fixes the index error
            const q = query(
                paymentsRef,
                where("userId", "==", uid)
            );

            const querySnapshot = await getDocs(q);
            console.log("[billingService] Found payments:", querySnapshot.size);

            const results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort manually on client to avoid index requirement for now
            return results.sort((a: any, b: any) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime();
            });
        } catch (error) {
            console.error("Error fetching payment history:", error);
            return [];
        }
    }
};
