export type MemberStatus = 'home' | 'work' | 'school' | 'gym' | 'outside' | 'legacy';

export interface Task {
    id: string;
    title: string;
    xp: number;
    completed: boolean;
    assignedTo: string; // member id
}

export interface Member {
    id: string;
    name: string;
    role: 'Father' | 'Mother' | 'Son' | 'Daughter' | 'Grandfather' | 'Grandmother';
    avatar: string;
    level: number;
    currentXP: number;
    maxXP: number;
    status: MemberStatus;
    battery: number; // 0-100
    mood: 'happy' | 'neutral' | 'tired' | 'stressed' | 'focused' | 'energetic' | 'playful';
    location: string;
    // New Fields V2
    genetics: string[];
    safetyStatus: 'safe' | 'warning' | 'critical';
    lastActive: string;
    screenTime: {
        used: number; // minutes
        limit: number; // minutes
    };
}

export const familyMembers: Member[] = [
    {
        id: '1',
        name: 'Azizbek',
        role: 'Father',
        avatar: '/avatars/father.png',
        level: 42,
        currentXP: 8500,
        maxXP: 10000,
        status: 'work',
        battery: 65,
        mood: 'focused',
        location: 'Office (Tashkent City)',
        genetics: ['Hypertension Risk'],
        safetyStatus: 'safe',
        lastActive: 'Now',
        screenTime: { used: 120, limit: 240 }
    },
    {
        id: '2',
        name: 'Malika',
        role: 'Mother',
        avatar: '/avatars/mother.png',
        level: 40,
        currentXP: 9200,
        maxXP: 10000,
        status: 'home',
        battery: 80,
        mood: 'happy',
        location: 'Home',
        genetics: ['Iron Deficiency'],
        safetyStatus: 'safe',
        lastActive: '5m ago',
        screenTime: { used: 90, limit: 240 }
    },
    {
        id: '3',
        name: 'Ali',
        role: 'Son',
        avatar: '/avatars/son.png',
        level: 12,
        currentXP: 1200,
        maxXP: 2500,
        status: 'school',
        battery: 90,
        mood: 'energetic',
        location: 'School #145',
        genetics: [],
        safetyStatus: 'safe',
        lastActive: '1h ago',
        screenTime: { used: 45, limit: 60 } // Near limit
    },
    {
        id: '4',
        name: 'Zahro',
        role: 'Daughter',
        avatar: '/avatars/daughter.png',
        level: 8,
        currentXP: 800,
        maxXP: 2500,
        status: 'home',
        battery: 95,
        mood: 'playful',
        location: 'Home',
        genetics: [],
        safetyStatus: 'safe',
        lastActive: 'Now',
        screenTime: { used: 30, limit: 60 }
    },
];

export const mockTasks: Task[] = [
    { id: 't1', title: 'Complete Math Homework', xp: 50, completed: false, assignedTo: '3' },
    { id: 't2', title: 'Clean Room', xp: 100, completed: true, assignedTo: '3' },
    { id: 't3', title: 'Practice Piano', xp: 75, completed: false, assignedTo: '4' },
    { id: 't4', title: 'Read a Book (20 mins)', xp: 50, completed: false, assignedTo: '4' },
];
