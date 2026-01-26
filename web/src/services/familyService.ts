import { db } from "@/firebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, deleteDoc, onSnapshot } from "firebase/firestore";
import { getLocalTodayStr } from "@/lib/dateUtils";

export interface FamilyMember {
    id: string;
    name: string;
    fullName?: string;
    birthDate?: string; // YYYY-MM-DD or just YYYY
    role: 'Father' | 'Mother' | 'Son' | 'Daughter' | string;
    status: 'home' | 'work' | 'school' | 'gym' | 'legacy' | string;
    battery: number;
    mood: 'happy' | 'focused' | 'tired' | 'stressed' | string;
    level: number;
    avatar?: string;
    // Linkage
    fatherId?: string;
    motherId?: string;
    spouseId?: string;
    // Extended fields for ClientProfile
    safetyStatus?: 'safe' | 'danger' | 'unknown';
    location?: string;
    lastActive?: string;
    currentXP?: number;
    maxXP?: number;
    screenTime?: {
        used: number;
        limit: number;
    };
    genetics?: string[];
    beaconWindow?: '12h' | '24h' | '48h';

    // Extended Details
    profession?: string;
    bio?: string;
    education?: string;
    // 7-module monitoring status
    modules?: {
        finance: number;
        health: number;
        tasks: number;
        food: number;
        mind: number;
        interests: number;
        family: number;
    };
    balance?: number; // Coin balance
}

// Extended Family Group with Soft Delete and Owners
export interface FamilyGroup {
    id: string;
    name: string;
    ownerId: string;
    members: string[]; // member user IDs

    // Soft Delete
    isDeleted?: boolean;
    deletedAt?: string | null; // For soft delete logic (ISO date string)
    deletedBy?: string; // User ID who deleted

    createdAt: string;
    joinRequests?: string[]; // user IDs requesting to join
}

// Join Request with user details (for UI display)
export interface JoinRequest {
    userId: string;
    userName: string; // snapshot of name at request time
    status: 'pending' | 'approved' | 'rejected';
}

export interface ParentingRequest {
    id: string;
    kid: string;
    task: string;
    reward: string;
    status: 'pending' | 'approved' | 'denied';
    timestamp: string;
    // Linkage
    fatherId?: string;
    motherId?: string;
    spouseId?: string;
}

export interface Ancestor {
    id: string;
    name: string;
    role: string;
    birth: string;
    death: string;
    profession: string;
    healthIssues: string[];
    traits: string[];
    status?: string;
    photo?: string;
    avatar?: string;
    // Linkage
    fatherId?: string;
    motherId?: string;
    spouseId?: string;
    bio?: string;
    education?: string;
}

// New Roles List
export const FAMILY_ROLES = [
    'Grandfather', 'Grandmother',
    'Father', 'Mother',
    'Spouse (Turmush o\'rtog\'im)',
    'Brother', 'Younger Brother',
    'Sister', 'Younger Sister',
    'Son', 'Daughter',
    'Daughter-in-law (Kelin)',
    'Uncle (Amaki)', 'Uncle (Tog\'a)',
    'Aunt (Amma)', 'Aunt (Xola)',
    'Nephew/Niece (Jiyan)',
    'Grandchild (Nabira)',
    'Relative (Qarindosh)'
];

const getSubCollection = (userId: string, subName: string) => {
    return collection(db, `users/${userId}/${subName}`);
};

// ... existing cleanup function ...
export const removeFakeFamilyData = async (userId: string) => {
    const fakeNames = ['Alex', 'Elena', 'Grandpa', 'Grandma', 'Sarah', 'Mike', 'Sophie', 'Max', 'Grandmother'];
    const membersRef = getSubCollection(userId, "family_members");
    const snapshot = await getDocs(membersRef);

    const deletePromises = snapshot.docs
        .filter(doc => fakeNames.includes(doc.data().name))
        .map(doc => deleteDoc(doc.ref));

    await Promise.all(deletePromises);
};

// ... existing deleteFamilyMember ... (logic needs update to remove from Group too ideally, but for now simple doc delete)
export const deleteFamilyMember = async (userId: string, memberId: string) => {
    const docRef = doc(db, `users/${userId}/family_members/${memberId}`);
    await deleteDoc(docRef);
};

export const ensureOwnerProfile = async (userId: string) => {
    const memberRef = doc(db, `users/${userId}/family_members/${userId}`);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
        await setDoc(memberRef, {
            id: userId,
            name: "Oila Boshlig'i",
            role: 'Father',
            battery: 100,
            mood: 'happy',
            status: 'home',
            level: 1,
            safetyStatus: 'safe'
        });
        return true;
    }
    return false;
};

export const subscribeToFamilyMembers = (ownerId: string, onUpdate: (members: FamilyMember[]) => void) => {
    if (!ownerId) return () => { };
    const membersRef = getSubCollection(ownerId, "family_members");
    return onSnapshot(membersRef, (snapshot) => {
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember));
        onUpdate(members);
    }, (error) => {
        console.error("Error subscribing to family members:", error);
    });
};

export const getFamilyMembers = async (userId: string): Promise<FamilyMember[]> => {
    const snapshot = await getDocs(getSubCollection(userId, "family_members"));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FamilyMember));
};

export const getFamilyMember = async (userId: string, memberId: string): Promise<FamilyMember | null> => {
    const docRef = doc(db, `users/${userId}/family_members/${memberId}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as FamilyMember;
    }
    return null;
};

// --- FAMILY GROUP SERVICES ---

// Get active family groups (filtering out soft deleted ones older than 30 days or hiding them)
export const getFamilyGroups = async (userId: string): Promise<FamilyGroup[]> => {
    // In a real app with subcollections, we might need a collectionGroup query or similar.
    // For this architecture where groups are under `users/{userId}/family_groups`, 
    // it implies only the owner sees them easily. 
    // To allow "Global" families, we should ideally move `family_groups` to root.
    // However, adhering to current structure: we assume we are fetching groups THIS user owns or belongs to.

    // CURRENT ARCHITECTURE LIMITATION FIX:
    // Since we are using detailed role management and multi-user, `family_groups` should ideally be a root collection.
    // But to respect the likely Firestore rules of the current user scope, I will create them in a way accessible.
    // For now, let's keep it simple: We fetch groups where `ownerId` == userId OR `members` contains userId.
    // NOTE: Generating a compound query might require an index. We will stick to fetching owned groups for now 
    // and assume a "Join" flow adds the group copy or reference. 

    // ACTUALLY, checking the `createFamilyGroup` implementation... it was `getSubCollection(userId, "family_groups")`.
    // This means groups are private to the user. This contradicts "Joining" another user's family easily without restricted access.
    // I will MOVE family_groups to a ROOT collection to handle multi-user properly.

    const q = query(collection(db, "family_groups"), where("members", "array-contains", userId));
    const snapshot = await getDocs(q);

    const groups = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FamilyGroup));

    return groups;
};

// Real-time listener for a Family Group
export const subscribeToFamilyGroup = (groupId: string, onUpdate: (data: FamilyGroup) => void) => {
    const ref = doc(db, "family_groups", groupId);
    return onSnapshot(ref, (doc) => {
        if (doc.exists()) {
            onUpdate({ id: doc.id, ...doc.data() } as FamilyGroup);
        }
    });
};

// Real-time listener for ALL groups a user belongs to (for instant join updates)
// Real-time listener for ALL groups a user belongs to (for instant join updates)
export const subscribeToUserFamilies = (userId: string, onUpdate: (groups: FamilyGroup[]) => void) => {
    if (!userId) return () => { };

    const q = query(
        collection(db, "family_groups"),
        where("members", "array-contains", userId),
        where("isDeleted", "==", false)
    );

    return onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FamilyGroup));
        onUpdate(groups);
    }, (error) => {
        console.error("Error subscribing to user families:", error);
    });
};

export const upsertMemberProfile = async (userId: string, details: { fullName: string, birthDate: string, role?: string }) => {
    const memberRef = doc(db, `users/${userId}/family_members/${userId}`);
    const data = {
        id: userId,
        name: details.fullName.split(' ')[0],
        fullName: details.fullName,
        birthDate: details.birthDate,
        role: details.role || 'Son',
        battery: 100,
        mood: 'happy',
        status: 'home',
        level: 1,
        safetyStatus: 'safe'
    };
    await setDoc(memberRef, data, { merge: true });

    // Also sync to root users collection for global visibility during joins
    try {
        const { createUserProfile } = await import('./userService');
        await createUserProfile(userId, {
            displayName: details.fullName,
            // We can add more fields if we want to expand userService
        });
    } catch (e) {
        console.warn("Could not sync to root users collection", e);
    }
};

interface OwnerDetails {
    fullName: string;
    birthDate: string;
    role: string;
}

export const createFamilyGroup = async (userId: string, name: string, ownerDetails?: OwnerDetails): Promise<string> => {
    // check limit
    const existing = await getFamilyGroups(userId);
    // Filter out ones I own
    const owned = existing.filter(g => g.ownerId === userId && !g.deletedAt);

    if (owned.length >= 3) {
        throw new Error("Siz maksimal 3 ta oila yaratishingiz mumkin.");
    }

    const newGroup: Omit<FamilyGroup, 'id'> = {
        name,
        ownerId: userId,
        members: [userId],
        createdAt: getLocalTodayStr(),
        joinRequests: [],
        isDeleted: false,
        deletedAt: null
    };

    const docRef = await addDoc(collection(db, "family_groups"), newGroup);

    // Ensure Owner has a Member Profile with DETAILED info
    const memberRef = doc(db, `users/${userId}/family_members/${userId}`);
    const ownerData = {
        id: userId,
        name: ownerDetails?.fullName?.split(' ')[0] || "Oila Boshlig'i",
        fullName: ownerDetails?.fullName,
        birthDate: ownerDetails?.birthDate,
        role: ownerDetails?.role || 'Head',
        battery: 100,
        mood: 'happy',
        status: 'home',
        level: 1,
        safetyStatus: 'safe'
    };
    await setDoc(memberRef, ownerData, { merge: true });

    // Sync to root users
    if (ownerDetails?.fullName) {
        try {
            const { createUserProfile } = await import('./userService');
            await createUserProfile(userId, {
                displayName: ownerDetails.fullName
            });
        } catch (e) {
            console.warn("Could not sync owner to root users collection", e);
        }
    }

    return docRef.id;
};

export const updateFamilyGroup = async (groupId: string, name: string) => {
    const ref = doc(db, "family_groups", groupId);
    await updateDoc(ref, { name });
};

// Soft Delete
export const deleteFamilyGroup = async (groupId: string, userId: string) => {
    const ref = doc(db, "family_groups", groupId);
    await updateDoc(ref, {
        isDeleted: true,
        deletedAt: getLocalTodayStr(),
        deletedBy: userId
    });
};

// Restore
export const restoreFamilyGroup = async (groupId: string) => {
    const ref = doc(db, "family_groups", groupId);
    await updateDoc(ref, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
    });
};

// Request to Join
export const requestJoinFamily = async (userId: string, groupId: string) => {
    const ref = doc(db, "family_groups", groupId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Oila topilmadi");

    const data = snap.data() as FamilyGroup;
    if (data.members.includes(userId)) throw new Error("Siz allaqachon bu oiladasiz");
    if (data.joinRequests?.includes(userId)) throw new Error("So'rov yuborilgan");

    // Add to requests
    // Note: In real app use arrayUnion
    const currentRequests = data.joinRequests || [];
    await updateDoc(ref, { joinRequests: [...currentRequests, userId] });
};

// Approve Join
// Approve Join
export const approveJoinRequest = async (ownerId: string, groupId: string, requestingUserId: string, role: string, linkage?: { fatherId?: string, motherId?: string }) => {
    const ref = doc(db, "family_groups", groupId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Oila topilmadi");
    const data = snap.data() as FamilyGroup;

    if (data.ownerId !== ownerId) throw new Error("Huquqingiz yo'q");

    const newMembers = [...data.members, requestingUserId];
    const newRequests = (data.joinRequests || []).filter(id => id !== requestingUserId);

    await updateDoc(ref, {
        members: newMembers,
        joinRequests: newRequests
    });

    // Fetch user public profile to get real name
    let memberName = "Yangi A'zo";
    const memberBirth = "";

    try {
        const { getUserProfile } = await import('./userService');
        const userProfile = await getUserProfile(requestingUserId);
        if (userProfile) {
            memberName = userProfile.fullName || userProfile.displayName || "Yangi A'zo";
        }
    } catch (e) {
        console.warn("Could not fetch user profile for name", e);
    }

    await setDoc(doc(db, `users/${ownerId}/family_members/${requestingUserId}`), {
        id: requestingUserId,
        name: memberName.split(' ')[0],
        fullName: memberName,
        birthDate: memberBirth,
        role: role,
        fatherId: linkage?.fatherId || '',
        motherId: linkage?.motherId || '',
        battery: 100,
        status: 'home',
        mood: 'happy',
        level: 1,
        safetyStatus: 'safe'
    });
};

// Remove Member (Kick)
export const removeMemberFromGroup = async (ownerId: string, groupId: string, targetUserId: string) => {
    const ref = doc(db, "family_groups", groupId);
    const snap = await getDoc(ref);
    const data = snap.data() as FamilyGroup;

    if (data.ownerId !== ownerId) throw new Error("Huquqingiz yo'q");

    const newMembers = data.members.filter(m => m !== targetUserId);
    await updateDoc(ref, { members: newMembers });

    // Also remove from subcollection
    await deleteDoc(doc(db, `users/${ownerId}/family_members/${targetUserId}`));
};

// ... existing exports for parenting requests, ancestors, coins etc ...
// We need to keep getFamilyMembers, getParentingRequests etc for UI compatibility
// BUT we should update getFamilyMembers to potentially fetch from the "active group" logic in future.
// For now, leaving them as is creates a bridge between new Group logic and old UI.

export const getAncestors = async (id: string, isGroup: boolean = false): Promise<Ancestor[]> => {
    const colRef = isGroup
        ? collection(db, `family_groups/${id}/ancestors`)
        : collection(db, `users/${id}/ancestors`);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Ancestor));
};

export function subscribeToAncestors(
    id: string,
    isGroup: boolean,
    callback: (ancestors: Ancestor[]) => void
) {
    const colRef = isGroup
        ? collection(db, `family_groups/${id}/ancestors`)
        : collection(db, `users/${id}/ancestors`);

    return onSnapshot(colRef, snapshot => {
        const ancestors = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Ancestor[];
        callback(ancestors);
    });
}

export const updateRequestStatus = async (userId: string, requestId: string, status: 'approved' | 'denied') => {
    const docRef = doc(db, `users/${userId}/parenting_requests/${requestId}`);
    await updateDoc(docRef, { status });
};

export const unlockScreenTime = async (userId: string, memberId: string, minutes: number) => {
    const docRef = doc(db, `users/${userId}/family_members/${memberId}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data() as FamilyMember;
        const currentLimit = data.screenTime?.limit || 60;
        await updateDoc(docRef, {
            screenTime: { ...data.screenTime, limit: currentLimit + minutes }
        });
    }
};

export const updateFamilyMember = async (userId: string, memberId: string, data: Partial<FamilyMember>) => {
    const docRef = doc(db, `users/${userId}/family_members/${memberId}`);
    await updateDoc(docRef, data);
};

export const addCoins = async (userId: string, memberId: string, amount: number) => {
    const docRef = doc(db, `users/${userId}/family_members/${memberId}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data() as FamilyMember;
        const currentBalance = data.balance || 0;
        await updateDoc(docRef, { balance: currentBalance + amount });
    }
};

export const checkSafetyStatus = async (_userId: string, _memberId: string): Promise<'safe' | 'danger'> => { // eslint-disable-line @typescript-eslint/no-unused-vars
    return 'safe'; // Placeholder
};

export const upsertAncestor = async (id: string, ancestor: Omit<Ancestor, 'id'> & { id?: string }, isGroup: boolean = false) => {
    const colRef = isGroup
        ? collection(db, `family_groups/${id}/ancestors`)
        : collection(db, `users/${id}/ancestors`);

    if (ancestor.id) {
        const docRef = doc(db, colRef.path, ancestor.id);
        await updateDoc(docRef, ancestor as Partial<Ancestor>);
    } else {
        await addDoc(colRef, ancestor);
    }
};

export const getParentingRequests = async (userId: string): Promise<ParentingRequest[]> => {
    const snapshot = await getDocs(getSubCollection(userId, "parenting_requests"));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ParentingRequest));
};

/**
 * Permanently delete a family (cannot be undone)
 */
export async function permanentDeleteFamily(familyId: string) {
    const familyRef = doc(db, 'family_groups', familyId);
    await deleteDoc(familyRef);
}

/**
 * Subscribe to deleted families for a user (for restore UI)
 */
export function subscribeToDeletedFamilies(
    userId: string,
    callback: (families: FamilyGroup[]) => void
) {
    const q = query(
        collection(db, 'family_groups'),
        where('ownerId', '==', userId),
        where('isDeleted', '==', true)
    );

    return onSnapshot(q, snapshot => {
        const families = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FamilyGroup[];
        callback(families);
    });
}


// --- RELATIONSHIP LINKING SERVICES ---

export interface RelationshipPayload {
    sourceId: string;
    targetId: string;
    type: 'father' | 'mother' | 'spouse' | 'son' | 'daughter';
}

/**
 * Link two family members.
 * Note: Linking A as father of B implies B is child of A.
 * We store reference on Child (fatherId, motherId) and Spouse (spouseId).
 */
export const linkFamilyMembers = async (ownerId: string, payload: RelationshipPayload) => {
    // 1. If type is 'father', set fatherId on target
    // 2. If type is 'mother', set motherId on target
    // 3. If type is 'spouse', set spouseId on BOTH
    // 4. If type is 'son'/'daughter', inverse: set father/mother on source (based on owner gender? or explicit?)
    //    Actually, better to be explicit: 'source' is the PARENT, 'target' is the CHILD if type is 'son'.
    //    Let's handle basic types directly mapping to DB fields.

    // Scenario 1: Source is Father of Target
    if (payload.type === 'father') {
        await updateDoc(doc(db, `users/${ownerId}/family_members/${payload.targetId}`), {
            fatherId: payload.sourceId
        });
    }
    // Scenario 2: Source is Mother of Target
    else if (payload.type === 'mother') {
        await updateDoc(doc(db, `users/${ownerId}/family_members/${payload.targetId}`), {
            motherId: payload.sourceId
        });
    }
    // Scenario 3: Source is Spouse of Target
    else if (payload.type === 'spouse') {
        // Bi-directional for spouse
        await updateDoc(doc(db, `users/${ownerId}/family_members/${payload.sourceId}`), {
            spouseId: payload.targetId
        });
        await updateDoc(doc(db, `users/${ownerId}/family_members/${payload.targetId}`), {
            spouseId: payload.sourceId
        });
    }
};

/**
 * Remove a specific relationship link
 */
export const removeRelationship = async (ownerId: string, memberId: string, relationField: 'fatherId' | 'motherId' | 'spouseId') => {
    // If spouse, remove from both
    if (relationField === 'spouseId') {
        const member = await getFamilyMember(ownerId, memberId);
        if (member && member.spouseId) {
            await updateDoc(doc(db, `users/${ownerId}/family_members/${member.spouseId}`), {
                spouseId: '' // or deleteField()
            });
        }
    }

    await updateDoc(doc(db, `users/${ownerId}/family_members/${memberId}`), {
        [relationField]: ''
    });
};


// --- STRATEGIC LIFE BEACON (Passive Care) LOGIC ---

/**
 * MOCK: Simulated cron job logic triggered by the system.
 * In a real app, this would be a Cloud Function (cron) checking everyone's lastActive.
 */
export const checkVitalityTrigger = async (userId: string) => {
    console.log(`[Life Beacon] Running vitality check for system user: ${userId}`);
    // Logic: 
    // 1. Fetch all family members.
    // 2. Identify seniors (Grandfather/Grandmother).
    // 3. Compare lastActive timestamp with threshold (12h/24h/48h).
    // 4. If overdue -> push alert to family owner.
    return { status: 'monitoring', timestamp: new Date().toISOString() };
};

/**
 * MOCK: Update user activity timestamp.
 * Called whenever the user interacts with the app.
 */
export const updateLastActive = async (userId: string) => {
    const memberRef = doc(db, `users/${userId}/family_members/${userId}`);
    const now = new Date().toISOString();
    await updateDoc(memberRef, {
        lastActive: now,
        safetyStatus: 'safe' // Reset danger status if they are active
    });
    console.log(`[Life Beacon] Activity recorded for ${userId} at ${now}`);
};

/**
 * MOCK: Explicit "I'm OK" check-in from the dashboard.
 */
export const pulseCheckIn = async (userId: string) => {
    await updateLastActive(userId);
    // Potential for rewarding with XP for being proactive
};
