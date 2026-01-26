export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    category: string;
}

export const tasksData = {
    stats: {
        pending: 5,
        completed: 12,
        efficiency: 85, // %
    },
    today: [
        {
            id: '1',
            title: 'Morning Deep Work',
            description: 'Finish the PRD document for Project X.',
            status: 'done',
            priority: 'high',
            startTime: '08:00',
            endTime: '11:00',
            category: 'Work',
        },
        {
            id: '2',
            title: 'Team Sync',
            description: 'Weekly sync with design team.',
            status: 'done',
            priority: 'medium',
            startTime: '14:00',
            endTime: '15:00',
            category: 'Meeting',
        },
        {
            id: '3',
            title: 'Read "Atomic Habits"',
            status: 'in-progress',
            priority: 'low',
            startTime: '20:00',
            endTime: '21:00',
            category: 'Personal',
        },
        {
            id: '4',
            title: 'Plan Weekly Groceries',
            status: 'todo',
            priority: 'medium',
            startTime: '21:30',
            endTime: '22:00',
            category: 'Home',
        },
    ] as Task[],
    upcoming: [
        {
            id: '5',
            title: 'Dentist Appointment',
            status: 'todo',
            priority: 'high',
            startTime: '10:00',
            endTime: '11:00',
            date: 'Tomorrow',
            category: 'Health',
        },
    ]
};
