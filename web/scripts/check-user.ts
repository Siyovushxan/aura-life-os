
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

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
const db = getFirestore(app);

async function main() {
    const targetUid = "gwog5X7Wp9g1oaI98dBl88LMWvj2";
    console.log("Checking User:", targetUid);

    const userSnap = await getDoc(doc(db, "users", targetUid));
    if (userSnap.exists()) {
        console.log("Found in users:", JSON.stringify(userSnap.data(), null, 2));
    } else {
        console.log("Not found in root users collection.");
    }

    // List all users to see who is active
    /*
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach(d => {
        console.log("User:", d.id, d.data().displayName || d.data().fullName);
    });
    */
}

main().catch(console.error);
