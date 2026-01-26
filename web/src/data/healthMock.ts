export interface HealthMetric {
    label: string;
    value: string | number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    status: 'optimal' | 'good' | 'warning' | 'critical';
}

export const healthData = {
    bodyBattery: {
        current: 78,
        min: 12,
        max: 95,
        status: 'High Energy',
    },
    vitals: {
        heartRate: { value: 68, unit: 'bpm', trend: 'stable', status: 'optimal' },
        bloodOxygen: { value: 98, unit: '%', trend: 'stable', status: 'optimal' },
        stress: { value: 24, unit: '/100', trend: 'down', status: 'good' },
    },
    sleep: {
        duration: '7h 42m',
        score: 85,
        quality: 'Restful',
        stages: [
            { name: 'Deep', percentage: 25, color: '#2E5C55' },
            { name: 'REM', percentage: 20, color: '#4A9D8F' },
            { name: 'Light', percentage: 50, color: '#88D4C8' },
            { name: 'Awake', percentage: 5, color: '#E76F51' },
        ]
    },
    activity: {
        steps: 8432,
        goal: 10000,
        calories: 420,
        distance: '5.2 km',
    },
    hydration: {
        current: 1250, // ml
        goal: 2500, // ml
    }
};
