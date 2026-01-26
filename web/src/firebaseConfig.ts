
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBdVpVPYSB4MTJIRT__ti7pvxTbVHZE18s",
    authDomain: "aura-f1d36.firebaseapp.com",
    projectId: "aura-f1d36",
    storageBucket: "aura-f1d36.firebasestorage.app",
    messagingSenderId: "804734494584",
    appId: "1:804734494584:web:843c968494459ae5ee0a8d",
    measurementId: "G-4VLKRFZ6Q2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log("🔥 Connected to Firestore Emulator");
    } catch (e) {
        // ignore if already connected
    }
}

