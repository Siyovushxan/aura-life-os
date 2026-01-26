import { db } from "@/firebaseConfig";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    DocumentData,
    WithFieldValue
} from "firebase/firestore";

// Generic helper to get a document
export const getDocument = async <T>(collectionName: string, id: string): Promise<T | null> => {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
    } else {
        return null;
    }
};

// Generic helper to set (create/overwrite) a document
export const setDocument = async <T extends WithFieldValue<DocumentData>>(collectionName: string, id: string, data: T) => {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
};

// Generic helper to add a document with auto-id
export const addDocument = async <T extends WithFieldValue<DocumentData>>(collectionName: string, data: T) => {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
};

// Generic helper to get all documents from a collection
export const getCollection = async <T>(collectionName: string): Promise<T[]> => {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

// Generic helper to query documents by a field
export const queryDocuments = async <T>(collectionName: string, field: string, value: any): Promise<T[]> => {
    const colRef = collection(db, collectionName);
    const q = query(colRef, where(field, "==", value));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};
