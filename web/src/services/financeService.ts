import { db } from "@/firebaseConfig";
// Finance Service V13
import { collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, query, orderBy, limit, where, arrayUnion, onSnapshot } from "firebase/firestore";
import { getLocalTodayStr } from "@/lib/dateUtils";

export interface Transaction {
    id: string;
    title: string;
    amount: number; // positive for income, negative for expense (or check type)
    type: 'income' | 'expense';
    category: string;
    date: string;
    icon: string;
    currency?: 'UZS' | 'USD' | 'EUR' | 'RUB';
    originalAmount?: number;
    // V17 Credit Logic
    isLiability?: boolean; // If true, this income is NOT Profit, it's Debt Inflow
    isDebtRepayment?: boolean; // If true, this expense is Principal Repayment (not loss)
    principalAmount?: number;
    interestAmount?: number;
    // V18 Deposit Logic
    isTransfer?: boolean; // If true, this transaction is a neutral transfer (Wallet <-> Deposit), Balance unchanged.
}

export interface DebtItem {
    id: string;
    type: 'i_owe' | 'owed_to_me'; // 'Men Qarzdorman' | 'Mendan Qarz'
    person: string;
    amount: number;
    currency: 'UZS' | 'USD' | 'EUR' | 'RUB';
    date: string;
    deadline?: string;
    description?: string;
    status: 'active' | 'paid' | 'partial';
    repaymentHistory: { date: string; amount: number; }[];
    totalRepaid: number;
}

export interface CreditItem {
    id?: string;
    title: string;
    totalAmount: number;
    remainingAmount: number;
    monthlyPayment: number;
    paymentDay: number;
    currency: 'UZS' | 'USD' | 'EUR' | 'RUB';
    startDate: string;
    nextPaymentDate: string;
    status: 'active' | 'paid';
    // V14 Banking Logic
    interestRate?: number; // Annual %
    termMonths?: number;
    calculationMethod?: 'annuity' | 'differential';
    schedule?: { date: string; payment: number; interest: number; principal: number; remaining: number }[];
    history?: { date: string; amount: number }[];
    historical?: {
        initialAmount: number;
        monthsPassed: number;
        isHistorical: boolean;
    };
}

export interface DepositItem {
    id?: string;
    title: string;
    currentAmount: number;
    goalAmount?: number;
    monthlyContribution: number;
    contributionDay: number;
    currency: 'UZS' | 'USD' | 'EUR' | 'RUB';
    startDate: string;
    // V14 & V16 Banking Logic
    interestRate?: number; // Annual %
    termMonths?: number; // New: Investment Term
    isMonthlyInterest?: boolean; // New: Monthly Payout vs End of Term
    payoutHistory?: { date: string; amount: number; status: 'pending' | 'received' }[]; // New: Track payouts
    history?: { date: string; amount: number }[];
    historical?: {
        initialAmount: number;
        accruedInterest: number;
        monthsPassed: number;
    };
}

// --- V14 Calculation Helpers ---
export const calculateAnnuitySchedule = (principal: number, annualRate: number, months: number, startDate: Date) => {
    const monthlyRate = annualRate / 12 / 100;
    // Standard Annuity Formula: P * (r * (1+r)^n) / ((1+r)^n - 1)
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

    let balance = principal;
    const schedule = [];

    for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate;
        const principalPart = monthlyPayment - interest;
        balance -= principalPart;

        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);

        schedule.push({
            date: date.toISOString().split('T')[0],
            payment: monthlyPayment,
            interest: interest,
            principal: principalPart,
            remaining: Math.max(0, balance)
        });
    }
    return schedule;
};

export const calculateDifferentialSchedule = (principal: number, annualRate: number, months: number, startDate: Date) => {
    const monthlyRate = annualRate / 12 / 100;
    const principalPart = principal / months;

    let balance = principal;
    const schedule = [];

    for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate;
        const payment = principalPart + interest;
        balance -= principalPart;

        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);

        schedule.push({
            date: date.toISOString().split('T')[0],
            payment: payment,
            interest: interest,
            principal: principalPart,
            remaining: Math.max(0, balance)
        });
    }
    return schedule;
};

export const calculateHistoricalLoan = (principal: number, annualRate: number, termMonths: number, startDate: string, method: 'annuity' | 'differential' = 'annuity') => {
    const start = new Date(startDate);
    const now = new Date();
    // Calculate months passed
    let monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    monthsPassed = Math.max(0, monthsPassed);

    const schedule = method === 'annuity'
        ? calculateAnnuitySchedule(principal, annualRate, termMonths, start)
        : calculateDifferentialSchedule(principal, annualRate, termMonths, start);

    // Past payments are those with index < monthsPassed
    const futurePayments = schedule.slice(monthsPassed);

    // Determine current remaining principal from the schedule
    let currentRemaining = 0;
    if (monthsPassed >= termMonths) {
        currentRemaining = 0;
    } else if (monthsPassed === 0) {
        currentRemaining = principal;
    } else {
        // The remaining amount AFTER the last past payment
        currentRemaining = schedule[monthsPassed - 1].remaining;
    }

    const nextPaymentDate = futurePayments.length > 0 ? futurePayments[0].date : null;
    const progress = Math.min(100, (monthsPassed / termMonths) * 100);

    return {
        initialAmount: principal,
        currentRemaining,
        monthsPassed,
        progress,
        nextPaymentDate,
        isHistorical: monthsPassed > 0
    };
};

export const calculateHistoricalDeposit = (principal: number, annualRate: number, termMonths: number, startDate: string, capitalization: boolean) => {
    const start = new Date(startDate);
    const now = new Date();
    let monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    monthsPassed = Math.max(0, monthsPassed);

    // Monthly interest logic
    const monthlyRate = annualRate / 12 / 100;
    let accruedInterest = 0;
    let currentAmount = principal;

    if (capitalization) {
        // Compound interest: A = P * (1 + r)^n
        // If passed term, cap at term
        const calcMonths = Math.min(monthsPassed, termMonths);
        const amountWithInterest = principal * Math.pow(1 + monthlyRate, calcMonths);
        accruedInterest = amountWithInterest - principal;
        currentAmount = amountWithInterest;
    } else {
        // Simple interest paid out
        const calcMonths = Math.min(monthsPassed, termMonths);
        const interestPerMonth = principal * monthlyRate;
        accruedInterest = interestPerMonth * calcMonths;
        currentAmount = principal;
    }

    return {
        initialAmount: principal,
        currentAmount,
        accruedInterest,
        monthsPassed,
        progress: Math.min(100, (monthsPassed / termMonths) * 100)
    };
};

export const convertToUZS = (amount: number, currency: string, rates: { code: string, rate: number }[]): number => {
    if (currency === 'UZS') return amount;
    const rate = rates.find(r => r.code === currency)?.rate || 1;
    return Math.round(amount * rate);
};

export interface FinanceOverview {
    totalBalance: number;
    monthlyBudget: number; // For backward compatibility if needed
    incomeBudget: number;  // Target monthly income
    expenseBudget: number; // Max monthly expense
    monthlyIncome: number; // Actual current income
    monthlySpent: number;
    savingsGoal: number;
    currentSavings: number;
    ultimateGoal?: {
        target: number;
        deadline: string;
        title: string;
        progress: number;
        currency?: 'UZS' | 'USD' | 'EUR' | 'RUB';
    };
}

const getSubCollection = (userId: string, col: string) => collection(db, `users/${userId}/${col}`);

export const getFinanceOverview = async (userId: string): Promise<FinanceOverview | null> => {
    const docRef = doc(db, `users/${userId}/finance/overview`);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as FinanceOverview : null;
};

export const subscribeToFinanceOverview = (userId: string, callback: (data: FinanceOverview | null) => void) => {
    const docRef = doc(db, `users/${userId}/finance/overview`);
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            callback(snap.data() as FinanceOverview);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error subscribing to finance overview:", error);
    });
};

export const subscribeToTransactions = (userId: string, callback: (data: Transaction[]) => void) => {
    const q = query(getSubCollection(userId, "finance_transactions"), orderBy("date", "desc"), limit(50));
    return onSnapshot(q, (snap) => {
        const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        callback(txs);
    }, (error) => {
        console.error("Error subscribing to transactions:", error);
        // Fallback: Try without ordering if index is missing (though this changes UX, better than nothing)
        // For now just log, as index creation is the fix.
    });
};

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
    try {
        const q = query(getSubCollection(userId, "finance_transactions"), orderBy("date", "desc"), limit(50));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
};

// NEW: Subscribe to transactions by date
export const subscribeToTransactionsByDate = (userId: string, date: string, callback: (data: Transaction[]) => void) => {
    const q = query(
        getSubCollection(userId, "finance_transactions"),
        where("date", "==", date)
        // orderBy("createdAt", "desc") // removed as createdAt field is missing in interface
    );
    // Note: if 'date' is exact string "YYYY-MM-DD", works.
    // Ideally user stores date as "YYYY-MM-DD".

    return onSnapshot(q, (snap) => {
        const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        callback(txs);
    }, (error) => {
        console.error("Error subscribing to transactions by date:", error);
    });
};

export const getTransactionsByDate = async (userId: string, date: string): Promise<Transaction[]> => {
    // ... existing implementation ...
    // Ideally we would index on date, but for now we can reuse the existing collection and query
    const q = query(getSubCollection(userId, "finance_transactions"), where("date", "==", date));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
};

export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>) => {
    // Ensure standard date format YYYY-MM-DD
    const date = transaction.date.includes('T') ? transaction.date.split('T')[0] : transaction.date;
    const rates = await getCurrencyRates();
    const currency = transaction.currency || 'UZS';
    const amountInUZS = convertToUZS(transaction.amount, currency, rates);

    const finalTransaction = {
        ...transaction,
        amount: isNaN(amountInUZS) ? 0 : amountInUZS, // Store standardized UZS amount for stats
        originalAmount: transaction.amount, // Store original input
        currency,
        date
    };

    await addDoc(getSubCollection(userId, "finance_transactions"), finalTransaction);

    const overview = await getFinanceOverview(userId) || {
        totalBalance: 0,
        incomeBudget: 0,
        expenseBudget: 0,
        monthlyIncome: 0,
        monthlySpent: 0,
        savingsGoal: 0,
        currentSavings: 0,
        monthlyBudget: 0
    };

    let newBalance = overview.totalBalance;
    let newSpent = overview.monthlySpent;
    let newIncome = overview.monthlyIncome || 0;

    // V18: Transfers do NOT affect Total Balance (Net Worth) or Budget Stats
    // They are just records of movement.
    if (!transaction.isTransfer) {
        if (transaction.type === 'income') {
            // V17: Debt Inflow (Liability) also doesn't count as "Income" for budget, 
            // but DOES increase Cash Balance? 
            // Wait, User said: "Credit is Liability". 
            // If I borrow 1000, my Cash +1000, Liability +1000. Net Worth same.
            // So TotalBalance (Net Worth) should roughly stay same? 
            // AURA V1 definition: TotalBalance = "All Money I Have". 
            // So Borrowing INCREASES TotalBalance. 
            // BUT "Profit" (Monthly Income) should NOT increase.

            newBalance += amountInUZS;
            if (!transaction.isLiability) {
                newIncome += amountInUZS;
            }
        } else {
            // Expense
            newBalance -= amountInUZS;
            if (!transaction.isDebtRepayment) {
                newSpent += amountInUZS;
            }
        }
    }

    await setDoc(doc(db, `users/${userId}/finance/overview`), {
        ...overview,
        totalBalance: newBalance,
        monthlySpent: newSpent,
        monthlyIncome: newIncome
    });
};

export const updateBudgets = async (userId: string, incomeBudget: number, expenseBudget: number) => {
    const overview = await getFinanceOverview(userId);
    if (!overview) return;
    await setDoc(doc(db, `users/${userId}/finance/overview`), {
        ...overview,
        incomeBudget,
        expenseBudget
    });
};

export const updateUltimateGoal = async (userId: string, goalData: { target: number, deadline: string, title?: string, currency?: 'UZS' | 'USD' | 'EUR' | 'RUB' }) => {
    const overview = await getFinanceOverview(userId);
    if (!overview) return;

    await setDoc(doc(db, `users/${userId}/finance/overview`), {
        ...overview,
        ultimateGoal: {
            ...overview.ultimateGoal,
            target: goalData.target,
            deadline: goalData.deadline,
            title: goalData.title || overview.ultimateGoal?.title || 'Financial Freedom',
            progress: overview.ultimateGoal?.progress || 0,
            currency: goalData.currency || overview.ultimateGoal?.currency || 'USD'
        }
    });
};

export const getCurrencyRates = async () => {
    // In production, this would fetch from an API like CBU.UZ or a free exchange rate API
    // For now, we return real-time-ish mock data targeted at UZS (Uzbekistan market)
    return [
        { code: 'USD', rate: 12850, icon: '🇺🇸', trend: 'up' },
        { code: 'EUR', rate: 13920, icon: '🇪🇺', trend: 'down' },
        { code: 'RUB', rate: 142, icon: '🇷🇺', trend: 'up' },
    ];
};

export const getStatisticsByRange = async (userId: string, startDate: string, endDate: string) => {
    const q = query(
        getSubCollection(userId, "finance_transactions"),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));

    // Aggregate by category and type
    const stats = {
        income: {} as Record<string, number>,
        expense: {} as Record<string, number>,
        totalIncome: 0,
        totalExpense: 0,
        transactions: [] as Transaction[]
    };

    txs.forEach(t => {
        const cat = t.category || 'Other';
        if (t.type === 'income') {
            // V17: Exclude Debt Inflows from "Profit" calculation
            if (!t.isLiability) {
                stats.income[cat] = (stats.income[cat] || 0) + t.amount;
                stats.totalIncome += t.amount;
            }
        } else {
            // Exclude Principal Repayment from "Expense" calculation (Net Worth neutral) - Optional based on user pref
            // User said: "Principal: Reduces Debt (Liability), Interest: Expense."
            // So Principal should ideally NOT be in totalExpense (Profit/Loss).
            if (!t.isDebtRepayment) {
                stats.expense[cat] = (stats.expense[cat] || 0) + t.amount;
                stats.totalExpense += t.amount;
            }
        }
    });

    stats.transactions = txs;
    return stats;
};

export const seedFinanceData = async (userId: string): Promise<FinanceOverview> => {
    // Seed Overview - Zero State
    const overview: FinanceOverview = {
        totalBalance: 0,
        incomeBudget: 0,
        expenseBudget: 0,
        monthlyIncome: 0,
        monthlySpent: 0,
        savingsGoal: 0,
        currentSavings: 0,
        monthlyBudget: 0,
        ultimateGoal: {
            title: "Mening Asosiy Maqsadim",
            target: 0,
            deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            progress: 0
        }
    };

    await setDoc(doc(db, `users/${userId}/finance/overview`), overview);

    // No initial transactions for clean slate
    return overview;
};

// --- DEBT MANAGEMENT (V12) ---

export const addDebt = async (userId: string, debt: Omit<DebtItem, 'id'>) => {
    try {
        await addDoc(getSubCollection(userId, "finance_debts"), debt);
    } catch (e) {
        console.error("Error adding debt: ", e);
    }
};

export const subscribeToDebts = (userId: string, callback: (data: DebtItem[]) => void) => {
    const q = query(getSubCollection(userId, "finance_debts"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as DebtItem)));
    }, (error) => {
        console.error("Error subscribing to debts:", error);
    });
};

export const getDebts = async (userId: string) => {
    try {
        const q = query(getSubCollection(userId, "finance_debts"), orderBy("date", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as DebtItem));
    } catch (e) {
        console.error("Error fetching debts: ", e);
        return [];
    }
};

export const updateDebt = async (userId: string, debtId: string, updates: Partial<DebtItem>) => {
    try {
        const ref = doc(db, `users/${userId}/finance_debts/${debtId}`);
        await setDoc(ref, updates, { merge: true });
    } catch (e) {
        console.error("Error updating debt: ", e);
    }
};

export const repayDebt = async (userId: string, debt: DebtItem, amount: number, isFullRepayment: boolean) => {
    try {
        // 1. Update Debt Record
        const debtRef = doc(db, `users/${userId}/finance_debts/${debt.id}`);
        await setDoc(debtRef, {
            status: isFullRepayment ? 'paid' : 'partial',
            totalRepaid: (debt.totalRepaid || 0) + amount,
            repaymentHistory: [...(debt.repaymentHistory || []), { date: new Date().toISOString(), amount }]
        }, { merge: true });

        // 2. Add Transaction for Cash Flow (Real Data)
        // If 'i_owe' (Liability) -> I paid money -> Expense (or just negative balance flow)
        // If 'owed_to_me' (Asset) -> I received money -> Income (or positive balance flow)

        // NOTE: We categorize this as 'Debt Repayment' so it doesn't mess up "Business Income" stats if user desires, 
        // but for now we treat it as Cash Flow.

        await addTransaction(userId, {
            title: `${debt.type === 'i_owe' ? 'Qarz to\'landi' : 'Qarz qaytarildi'}: ${debt.person}`,
            amount: amount,
            type: debt.type === 'i_owe' ? 'expense' : 'income',
            category: 'Debt',
            date: new Date().toISOString().split('T')[0],
            icon: debt.type === 'i_owe' ? '📉' : '📈',
            currency: debt.currency
        });

    } catch (e) {
        console.error("Error repaying debt: ", e);
    }
};

export const deleteDebt = async (userId: string, debtId: string) => {
    // Requires deleteDoc import if needed, for now placeholder or handle in future
};

// --- V13 Credits (Loans) ---
export const addCredit = async (userId: string, credit: CreditItem) => {
    try {
        await addDoc(collection(db, `users/${userId}/finance_credits`), credit);
    } catch (e) {
        console.error("Error adding credit: ", e);
    }
};

export const subscribeToCredits = (userId: string, callback: (data: CreditItem[]) => void) => {
    const q = query(collection(db, `users/${userId}/finance_credits`));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as CreditItem)));
    }, (error) => {
        console.error("Error subscribing to credits:", error);
    });
};

export const getCredits = async (userId: string): Promise<CreditItem[]> => {
    try {
        const q = query(collection(db, `users/${userId}/finance_credits`));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditItem));
    } catch (e) {
        console.error("Error fetching credits: ", e);
        return [];
    }
};

export const payCredit = async (userId: string, credit: CreditItem, amount: number) => {
    try {
        const creditRef = doc(db, `users/${userId}/finance_credits/${credit.id}`);
        const newRemaining = Math.max(0, credit.remainingAmount - amount);
        const status = newRemaining === 0 ? 'paid' : 'active';

        // Calculate next month's payment date
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(Math.min(credit.paymentDay, 28)); // Simple logic, can be improved

        await setDoc(creditRef, {
            remainingAmount: newRemaining,
            status,
            nextPaymentDate: nextDate.toISOString().split('T')[0],
            history: arrayUnion({ date: new Date().toISOString(), amount })
        }, { merge: true });

        // Add Expense Transaction
        await addTransaction(userId, {
            title: `Kredit To'lovi: ${credit.title}`,
            amount: amount,
            type: 'expense',
            category: 'Credit',
            date: new Date().toISOString().split('T')[0],
            icon: '🏦',
            currency: credit.currency
        });

    } catch (e) {
        console.error("Error paying credit: ", e);
    }
};

export const updateCredit = async (userId: string, creditId: string, updates: Partial<CreditItem>) => {
    try {
        const ref = doc(db, `users/${userId}/finance_credits/${creditId}`);
        await setDoc(ref, updates, { merge: true });
    } catch (e) {
        console.error("Error updating credit: ", e);
    }
};

// --- V13 Deposits (Savings) ---
export const addDeposit = async (userId: string, deposit: DepositItem) => {
    try {
        await addDoc(collection(db, `users/${userId}/finance_deposits`), deposit);
    } catch (e) {
        console.error("Error adding deposit: ", e);
    }
};

export const updateDeposit = async (userId: string, depositId: string, data: Partial<DepositItem>) => {
    try {
        const depositRef = doc(db, `users/${userId}/finance_deposits/${depositId}`);
        await setDoc(depositRef, data, { merge: true });
    } catch (e) {
        console.error("Error updating deposit: ", e);
    }
};

export const deleteDeposit = async (userId: string, depositId: string) => {
    try {
        await deleteDoc(doc(db, `users/${userId}/finance_deposits/${depositId}`));
    } catch (e) {
        console.error("Error deleting deposit: ", e);
    }
};


export const subscribeToDeposits = (userId: string, callback: (data: DepositItem[]) => void) => {
    const q = query(collection(db, `users/${userId}/finance_deposits`));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as DepositItem)));
    }, (error) => {
        console.error("Error subscribing to deposits:", error);
    });
};

export const getDeposits = async (userId: string): Promise<DepositItem[]> => {
    try {
        const q = query(collection(db, `users/${userId}/finance_deposits`));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositItem));
    } catch (e) {
        console.error("Error fetching deposits: ", e);
        return [];
    }
};

export const addFundsToDeposit = async (userId: string, deposit: DepositItem, amount: number, isFromBalance: boolean) => {
    try {
        const depositRef = doc(db, `users/${userId}/finance_deposits/${deposit.id}`);

        await setDoc(depositRef, {
            currentAmount: (deposit.currentAmount || 0) + amount,
            history: arrayUnion({ date: new Date().toISOString(), amount, type: 'deposit' })
        }, { merge: true });

        // If from balance, it's a TRANSFER (Wallet -> Deposit)
        // If from outside (new money), it's INCOME (but we handle that logic in UI usually, 
        // effectively if it's 'New Money' it increases Total Balance. 
        // If 'From Balance', Total Balance stays same.

        await addTransaction(userId, {
            title: `Omonatga To'ldirish: ${deposit.title}`,
            amount: amount,
            type: isFromBalance ? 'expense' : 'income',
            // If from balance: Expense (Transfer) to reduce "Cash", but isTransfer=true so TotalBalance unchanged? 
            // WAIT. If I move 100 from Cash to Deposit. 
            // Cash -100. Deposit +100. Total Balance (Cash+Deposit) = Same.
            // Our 'addTransaction' reduces TotalBalance if type='expense' & !isTransfer.
            // If isTransfer=true, addTransaction does NOTHING to TotalBalance.
            // BUT we want to track that "Cash" wallet decreased? 
            // Current App architecture: "TotalBalance" IS the wallet. 
            // Actually, AURA V1 Architecture: TotalBalance derived from Overview. 
            // If we use isTransfer=true, TotalBalance doesn't change. 
            // This is correct for "Net Worth". 
            // But if "TotalBalance" implies "Liquid Cash", then it SHOULD decrease.
            // User Request: "Omonat Hamyoni (+), Asosiy Hamyon (-). Jami boylik o'zgarmaydi."
            // So: addTransaction should NOT change TotalBalance. 
            // Hence isTransfer=true is correct.

            isTransfer: isFromBalance, // Only if from balance is it a neutral transfer
            category: 'Savings',
            date: getLocalTodayStr(),
            icon: '📥',
            currency: deposit.currency
        });

    } catch (e) {
        console.error("Error adding funds to deposit: ", e);
    }
};

export const withdrawFromDeposit = async (userId: string, deposit: DepositItem, amount: number) => {
    try {
        const depositRef = doc(db, `users/${userId}/finance_deposits/${deposit.id}`);
        // Prevent negative
        const newAmount = Math.max(0, (deposit.currentAmount || 0) - amount);

        await setDoc(depositRef, {
            currentAmount: newAmount,
            history: arrayUnion({ date: getLocalTodayStr(), amount, type: 'withdrawal' })
        }, { merge: true });

        // Withdrawal = Transfer from Deposit to Wallet
        // Wallet (+), Deposit (-). Total Balance Same.
        // Transaction: type='income' (to Wallet), isTransfer=true.

        await addTransaction(userId, {
            title: `Omonatdan Yechish: ${deposit.title}`,
            amount: amount,
            type: 'income',
            isTransfer: true,
            category: 'Savings',
            date: getLocalTodayStr(),
            icon: '📤',
            currency: deposit.currency
        });

    } catch (e) {
        console.error("Error withdrawing from deposit: ", e);
    }
};

export const addProfitToDeposit = async (userId: string, deposit: DepositItem, amount: number) => {
    try {
        const depositRef = doc(db, `users/${userId}/finance_deposits/${deposit.id}`);

        await setDoc(depositRef, {
            currentAmount: (deposit.currentAmount || 0) + amount,
            history: arrayUnion({ date: new Date().toISOString(), amount, type: 'profit' })
        }, { merge: true });

        // Profit = Actual Income (Net Worth Increases)
        // Deposit (+), Wallet (0). Net Worth (+).
        // Transaction: type='income', isTransfer=FALSE (It is profit).

        await addTransaction(userId, {
            title: `Omonat Foydasi: ${deposit.title}`,
            amount: amount,
            type: 'income',
            isTransfer: false, // Increases Net Worth
            category: 'Investment', // Or 'Savings'
            date: new Date().toISOString().split('T')[0],
            icon: '📈',
            currency: deposit.currency
        });

    } catch (e) {
        console.error("Error adding profit to deposit: ", e);
    }
};


