export interface Interest {
    id: string;
    name: string;
    category: string;
    level: number; // 1-10
    progress: number; // 0-100% to next level
    totalHours: number;
    image: string;
}

export const interestsData = {
    stats: {
        totalActive: 4,
        learningStreak: 12, // days
    },
    hobbies: [
        {
            id: 'h1',
            name: 'Guitar',
            category: 'Music',
            level: 4,
            progress: 65,
            totalHours: 120,
            image: '🎸',
        },
        {
            id: 'h2',
            name: 'Photography',
            category: 'Art',
            level: 7,
            progress: 30,
            totalHours: 450,
            image: '📷',
        },
        {
            id: 'h3',
            name: 'Spanish',
            category: 'Language',
            level: 2,
            progress: 80,
            totalHours: 45,
            image: '🇪🇸',
        },
        {
            id: 'h4',
            name: 'Chess',
            category: 'Game',
            level: 5,
            progress: 10,
            totalHours: 200,
            image: '♟️',
        },
    ] as Interest[],
};
