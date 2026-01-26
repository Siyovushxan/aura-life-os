import { db } from "@/firebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, orderBy, deleteDoc, onSnapshot, limit } from "firebase/firestore";
import { getLocalTodayStr } from "@/lib/dateUtils";

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface SubTask {
    id: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
    category?: string;
    subtasks?: SubTask[];
    date?: string;
    startTime?: string;
    endTime?: string;
    parentId?: string;
    parentTitle?: string;
    createdAt?: number;
}

export interface Resource {
    type: 'link' | 'file';
    title: string;
    url: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    startTime: string;
    endTime: string;
    category: string;
    date: string; // YYYY-MM-DD
    subtasks?: SubTask[];
    resources?: Resource[];
    parentId?: string;
    parentTitle?: string;
    createdAt?: number;
    isSubtaskDisplay?: boolean;
    parentTitleDisplay?: string;
    parentIdDisplay?: string;
}

const getSubCollection = (userId: string) => collection(db, `users/${userId}/tasks`);

export const getTasksByDate = async (userId: string, date: string): Promise<Task[]> => {
    const q = query(getSubCollection(userId), where("date", "==", date), orderBy("startTime", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
};

export const subscribeToTasksByDate = (userId: string, date: string, callback: (tasks: Task[]) => void) => {
    const q = query(getSubCollection(userId), where("date", "==", date), orderBy("startTime", "asc"));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
};

export const subscribeToUpcomingTasks = (userId: string, fromDate: string, callback: (tasks: Task[]) => void) => {
    const q = query(getSubCollection(userId), where("date", ">", fromDate), orderBy("date", "asc"), limit(20));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
};

export const subscribeToFutureTasks = (userId: string, fromDate: string, callback: (tasks: Task[]) => void) => {
    const q = query(getSubCollection(userId), where("date", ">", fromDate), orderBy("date", "asc"));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
};

export const getUpcomingTasks = async (userId: string, fromDate: string): Promise<Task[]> => {
    const q = query(getSubCollection(userId), where("date", ">", fromDate), orderBy("date"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
};

export const subscribeToOverdueTasks = (userId: string, date: string, callback: (tasks: Task[]) => void) => {
    const q = query(getSubCollection(userId), where("date", "<", date), where("status", "!=", "done"));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
};

export const getOverdueTasks = async (userId: string, date: string): Promise<Task[]> => {
    const q = query(
        getSubCollection(userId),
        where("date", "<", date),
        where("status", "!=", "done")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
};

export const moveTask = async (userId: string, taskId: string, newDate: string) => {
    await updateDoc(doc(db, `users/${userId}/tasks/${taskId}`), { date: newDate });
};

export const addTask = async (userId: string, task: Omit<Task, 'id'>) => {
    await addDoc(getSubCollection(userId), task);
};

export const updateTaskStatus = async (userId: string, taskId: string, status: TaskStatus) => {
    await updateDoc(doc(db, `users/${userId}/tasks/${taskId}`), { status });
};

export const updateTask = async (userId: string, taskId: string, updates: Partial<Task>) => {
    await updateDoc(doc(db, `users/${userId}/tasks/${taskId}`), updates);
};

export const deleteTask = async (userId: string, taskId: string) => {
    await deleteDoc(doc(db, `users/${userId}/tasks/${taskId}`));
};

export const seedTasks = async (userId: string) => {
    const today = getLocalTodayStr();

    // Onboarding Checklist
    const tasks: Omit<Task, 'id'>[] = [
        {
            title: 'Welcome to Aura! 👋',
            description: 'This is your centralized dashboard. Complete your profile to get started.',
            status: 'todo',
            priority: 'high',
            startTime: '09:00',
            endTime: '09:15',
            category: 'Personal',
            date: today,
            subtasks: [
                { id: '1-1', title: 'Complete profile setup', status: 'done', priority: 'high' },
                { id: '1-2', title: 'Connect Shajara (Genealogy)', status: 'todo', priority: 'medium' }
            ],
            resources: [{ type: 'link', title: 'Getting Started Guide', url: 'https://aura-docs.com' }]
        },
        {
            title: 'Set your Financial Goals',
            description: 'Go to the Finance module and set a monthly budget.',
            status: 'todo',
            priority: 'medium',
            startTime: '10:00',
            endTime: '10:30',
            category: 'Growth',
            date: today,
            subtasks: [
                { id: '2-1', title: 'Review last month expenses', status: 'todo', priority: 'medium' },
                { id: '2-2', title: 'Define savings target', status: 'todo', priority: 'high' }
            ]
        },
        {
            title: 'Log your first Mood',
            description: 'Check in with the Mind module to track your mental state.',
            status: 'todo',
            priority: 'low',
            startTime: '12:00',
            endTime: '12:05',
            category: 'Health',
            date: today
        },
    ];

    for (const t of tasks) {
        await addDoc(getSubCollection(userId), t);
    }
};
