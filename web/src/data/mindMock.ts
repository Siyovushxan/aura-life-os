export interface MoodEntry {
    date: string;
    mood: 'happy' | 'calm' | 'neutral' | 'stressed' | 'anxious';
    note: string;
}

export const mindData = {
    quote: {
        text: "Quiet the mind, and the soul will speak.",
        author: "Ma Jaya Sati Bhagavati"
    },
    stats: {
        focusMinutes: 1450,
        meditationMinutes: 320,
        journalStreak: 5,
    },
    moodHistory: [
        { date: 'Mon', mood: 'stressed', value: 40 },
        { date: 'Tue', mood: 'neutral', value: 60 },
        { date: 'Wed', mood: 'calm', value: 80 },
        { date: 'Thu', mood: 'happy', value: 90 },
        { date: 'Fri', mood: 'calm', value: 85 },
    ]
};
