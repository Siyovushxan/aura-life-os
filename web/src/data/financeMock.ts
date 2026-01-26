export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    icon: string;
}

export const financeData = {
    totalBalance: 12450.00,
    monthlyBudget: 2000.00,
    monthlySpent: 1450.50,
    savingsGoal: 5000.00,
    currentSavings: 3200.00,
};

export const categories = [
    // Income Categories
    { name: 'Salary', color: '#00FF94', icon: '💰', type: 'income' },
    { name: 'Freelance', color: '#00F0FF', icon: '💻', type: 'income' },
    { name: 'Investment', color: '#FFD600', icon: '📈', type: 'income' },
    { name: 'Gift', color: '#FF00FF', icon: '🎁', type: 'income' },
    { name: 'Other Income', color: '#999', icon: '💸', type: 'income' },

    // Expense Categories
    { name: 'Food', color: '#FFD600', icon: '🍔', type: 'expense' },
    { name: 'Transport', color: '#00F0FF', icon: '🚖', type: 'expense' },
    { name: 'Shopping', color: '#7000FF', icon: '🛍️', type: 'expense' },
    { name: 'Bills', color: '#FF2E2E', icon: '🧾', type: 'expense' },
    { name: 'Health', color: '#FF4D4D', icon: '🏥', type: 'expense' },
    { name: 'Education', color: '#00B2FF', icon: '📚', type: 'expense' },
    { name: 'Leisure', color: '#FF8A00', icon: '🎭', type: 'expense' },
    { name: 'Other', color: '#999', icon: '📦', type: 'expense' },
];

export const transactions: Transaction[] = [
    { id: '1', title: 'Salary', amount: 3500, type: 'income', category: 'Income', date: '2026-01-10', icon: '💰' },
    { id: '2', title: 'Grocery Shopping', amount: 120.50, type: 'expense', category: 'Food', date: '2026-01-11', icon: '🛒' },
    { id: '3', title: 'Uber Ride', amount: 15.20, type: 'expense', category: 'Transport', date: '2026-01-11', icon: '🚖' },
    { id: '4', title: 'Netflix Subscription', amount: 12.00, type: 'expense', category: 'Bills', date: '2026-01-09', icon: '🎬' },
    { id: '5', title: 'Coffee & Snacks', amount: 8.50, type: 'expense', category: 'Food', date: '2026-01-12', icon: '☕' },
    { id: '6', title: 'New Keyboard', amount: 150.00, type: 'expense', category: 'Shopping', date: '2026-01-08', icon: '⌨️' },
];
