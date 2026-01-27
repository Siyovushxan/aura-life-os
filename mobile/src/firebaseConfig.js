import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { Platform } from "react-native";

// AURA Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBdVpVPYSB4MTJIRT__ti7pvxTbVHZE18s",
    authDomain: "aura-f1d36.firebaseapp.com",
    projectId: "aura-f1d36",
    storageBucket: "aura-f1d36.firebasestorage.app",
    messagingSenderId: "804734494584",
    appId: "1:804734494584:web:843c968494459ae5ee0a8d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

if (Platform.OS === 'web') {
    setPersistence(auth, browserLocalPersistence);
}
