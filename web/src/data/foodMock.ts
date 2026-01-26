export interface Macro {
    label: string;
    value: number; // grams
    goal: number; // grams
    color: string;
}

export const foodData = {
    summary: {
        calories: { current: 1450, goal: 2200 },
        protein: { current: 85, goal: 150 }, // g
        carbs: { current: 180, goal: 250 },  // g
        fat: { current: 45, goal: 70 },      // g
        water: { current: 1500, goal: 2500 }, // ml
    },
    meals: [
        {
            id: 'm1',
            name: 'Oatmeal & Berries',
            type: 'Breakfast',
            calories: 450,
            time: '08:30',
            image: '/food/oatmeal.jpg' // mock
        },
        {
            id: 'm2',
            name: 'Grilled Chicken Salad',
            type: 'Lunch',
            calories: 620,
            time: '13:15',
            image: '/food/salad.jpg' // mock
        },
        {
            id: 'm3',
            name: 'Protein Shake',
            type: 'Snack',
            calories: 180,
            time: '16:00',
            image: '/food/shake.jpg' // mock
        },
        {
            id: 'm4',
            name: 'Palov',
            type: 'Dinner',
            calories: 850,
            time: '19:00',
            image: '/food/palov.jpg' // mock
        },
    ]
};
