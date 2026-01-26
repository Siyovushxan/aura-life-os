const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, setDoc, addDoc, collection, getDoc } = require('firebase/firestore');
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require('firebase/functions');

const { getAuth, signInAnonymously, connectAuthEmulator } = require('firebase/auth');

// --- CONFIG ---
const PROJECT_ID = "aura-f1d36";
const USER_ID = "test-user-simulation-1"; // Dedicated test user
const DATE = new Date().toISOString().split('T')[0];

const firebaseConfig = {
    apiKey: "fake-api-key",
    projectId: PROJECT_ID,
    authDomain: `${PROJECT_ID}.firebaseapp.com`,
};

// --- INIT ---
console.log(`🚀 Starting AURA System Verification for User: ${USER_ID}, Date: ${DATE}`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
const auth = getAuth(app);

// Connect to Emulators
connectFirestoreEmulator(db, '127.0.0.1', 8080);
connectFunctionsEmulator(functions, '127.0.0.1', 5001);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runSimulation() {
    try {
        console.log("🔐 Authenticating...");
        const cred = await signInAnonymously(auth);
        console.log(`✅ Authenticated as: ${cred.user.uid}`);

        // Use the actual authenticated UID for valid testing!
        const SIM_USER_ID = cred.user.uid;

        // 1. HEALTH: Log Sleep & Readiness
        console.log(`\n💤 [1/5] Logging Health (Sleep & Vitals)...`);
        await setDoc(doc(db, `users/${SIM_USER_ID}/health_logs/${DATE}`), {
            date: DATE,
            sleep: {
                duration: "7h 30m",
                score: 85,
                quality: "Good",
                stages: [{ name: "Deep", percentage: 20 }, { name: "REM", percentage: 25 }]
            },
            bodyBattery: { current: 90, status: "High" },
            vitals: { stress: 15, heartRate: 60 }
        }, { merge: true });
        console.log("✅ Health logged.");

        // 2. FOOD: Log Breakfast
        console.log(`\n🍳 [2/5] Logging Food (Breakfast)...`);
        await setDoc(doc(db, `users/${USER_ID}/food_logs/${DATE}`), {
            date: DATE,
            meals: [
                { name: "Oatmeal with Berries", calories: 350, protein: 12, carbs: 60, fats: 6, time: "08:00" }
            ],
            totalCalories: 350,
            waterIntake: 500
        }, { merge: true });
        console.log("✅ Food logged.");

        // 3. WORK: Log Deep Work Session
        console.log(`\n🧠 [3/5] Logging Deep Work Session...`);
        // Assuming there's a 'focus_sessions' collection or similar. 
        // Based on previous analysis, it might be aggregated in daily stats, let's create a raw session doc.
        await addDoc(collection(db, `users/${USER_ID}/focus_sessions`), {
            startTime: new Date().toISOString(),
            duration: 45 * 60, // 45 mins
            mode: "Deep Work",
            completed: true,
            date: DATE
        });
        console.log("✅ Focus session logged.");

        // 4. FINANCE: Log Expense
        console.log(`\n💸 [4/5] Logging Finance (Coffee Expense)...`);
        await addDoc(collection(db, `users/${USER_ID}/finance_transactions`), {
            title: "Morning Coffee",
            amount: 25000,
            type: "expense",
            category: "Food",
            date: DATE,
            currency: "UZS"
        });
        // Update overview (Mocking service logic roughly)
        await setDoc(doc(db, `users/${USER_ID}/finance/overview`), {
            monthlySpent: 25000,
            totalBalance: 1000000 // Mock balance
        }, { merge: true });
        console.log("✅ Finance transaction logged.");

        // 5. AI INTELLIGENCE: Trigger Daily Analysis
        console.log(`\n🤖 [5/5] Triggering AI Analysis...`);
        // Calling the cloud function directly to test the endpoint
        const dailyAIAnalysis = httpsCallable(functions, 'dailyAIAnalysis'); // Or HTTP trigger 'getDailyInsight'
        // Since dailyAIAnalysis is a scheduler, we can't call it via client SDK easily if it's pubsub.
        // But we have 'getDailyInsight' as an HTTP endpoint in index.js!

        // Let's call the HTTP endpoint via fetch to simulate real frontend call
        // Actually, we can use the callable if it was exported as onCall, but index.js showed 'onRequest'.
        // So we will just use a fetch to the emulator URL.

        const response = await fetch("http://127.0.0.1:5001/aura-f1d36/us-central1/getDailyInsight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: USER_ID,
                date: DATE,
                userContext: { name: "Tester" }
            })
        });

        const result = await response.json();
        console.log("✅ AI Response:", JSON.stringify(result, null, 2));

        if (result.success) {
            console.log("\n✨ SYSTEM VERIFICATION PASSED! ✨");
        } else {
            console.error("\n❌ AI Analysis Failed:", result.error);
        }

    } catch (e) {
        console.error("\n❌ SYSTEM VERIFICATION CRASHED:", e);
    }
}

runSimulation();
