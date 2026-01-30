import { useState, useEffect, useRef, useCallback } from 'react';
import {
    FinanceOverview,
    Transaction,
    DebtItem,
    CreditItem,
    DepositItem,
    subscribeToFinanceOverview,
    subscribeToTransactionsByDate,
    subscribeToDebts,
    subscribeToCredits,
    subscribeToDeposits,
    seedFinanceData
} from '@/services/financeService';
import { getScheduledInsight } from '@/services/aiPersistenceService';

export const useFinance = (userId: string | undefined, language: string, selectedDate: string) => {
    const [financeData, setFinanceData] = useState<FinanceOverview>({
        totalBalance: 0,
        incomeBudget: 0,
        expenseBudget: 0,
        monthlyIncome: 0,
        monthlySpent: 0,
        savingsGoal: 0,
        currentSavings: 0,
        monthlyBudget: 0
    });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [debts, setDebts] = useState<DebtItem[]>([]);
    const [credits, setCredits] = useState<CreditItem[]>([]);
    const [deposits, setDeposits] = useState<DepositItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiInsight, setAiInsight] = useState<any | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const seedingRef = useRef(false);

    // Helper for deep comparison to avoid unnecessary re-renders
    const safeSetState = useCallback((setter: React.Dispatch<React.SetStateAction<any>>, newData: any) => {
        setter((prev: any) => {
            if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
            return newData;
        });
    }, []);

    useEffect(() => {
        if (!userId) return;

        setLoading(true);

        // Sub 1: Overview
        const unsubOverview = subscribeToFinanceOverview(userId, async (data) => {
            if (data) {
                safeSetState(setFinanceData, data);
                setLoading(false);
            } else {
                if (!seedingRef.current) {
                    seedingRef.current = true;
                    console.log("Finance Overview Missing. Seeding...");
                    await seedFinanceData(userId);
                    seedingRef.current = false;
                }
            }
        });

        // Sub 2: Transactions
        const unsubTx = subscribeToTransactionsByDate(userId, selectedDate, (data) => {
            safeSetState(setTransactions, data);
        });

        // Sub 3: Portfolio
        const unsubDebts = subscribeToDebts(userId, (data) => safeSetState(setDebts, data));
        const unsubCredits = subscribeToCredits(userId, (data) => safeSetState(setCredits, data));
        const unsubDeposits = subscribeToDeposits(userId, (data) => safeSetState(setDeposits, data));

        return () => {
            unsubOverview();
            unsubTx();
            unsubDebts();
            unsubCredits();
            unsubDeposits();
        };
    }, [userId, selectedDate]); // safeSetState removed - it's stable via useCallback

    // Manual AI Trigger
    const refreshInsight = async () => {
        if (!userId) return;
        setAiLoading(true);
        try {
            const context = {
                totalBalance: financeData.totalBalance,
                monthlySpent: financeData.monthlySpent,
                monthlyIncome: financeData.monthlyIncome,
                expenseBudget: financeData.expenseBudget,
                incomeBudget: financeData.incomeBudget,
                topSpendingCategory: transactions.length > 0 ? transactions[0].category : 'N/A', // Simple heuristic or improve
                debtTotal: debts.reduce((acc, d) => acc + (d.status === 'active' ? (d.amount - (d.totalRepaid || 0)) : 0), 0),
                creditTotal: credits.reduce((acc, c) => acc + (c.status === 'active' ? (c.remainingAmount || 0) : 0), 0),
                depositTotal: deposits.reduce((acc, d) => acc + (d.currentAmount || 0), 0),
                occupation: 'Advanced Protocol' // Backend will provide further enrichment if needed
            };
            const insight = await getScheduledInsight(userId, 'finance', language, context, { force: true });
            if (insight) {
                setAiInsight(insight.data || insight);
            }
        } catch (err) {
            console.error("AI Scan Failed:", err);
        } finally {
            setAiLoading(false);
        }
    };

    // Stable setter wrappers to prevent infinite loops when used in page.tsx
    const stableSetFinanceData = useCallback(setFinanceData, []);
    const stableSetTransactions = useCallback(setTransactions, []);
    const stableSetDebts = useCallback(setDebts, []);
    const stableSetCredits = useCallback(setCredits, []);
    const stableSetDeposits = useCallback(setDeposits, []);

    return {
        financeData,
        transactions,
        debts,
        credits,
        deposits,
        loading,
        aiInsight,
        aiLoading,
        refreshInsight,
        setFinanceData: stableSetFinanceData, // Stable references
        setTransactions: stableSetTransactions,
        setDebts: stableSetDebts,
        setCredits: stableSetCredits,
        setDeposits: stableSetDeposits
    };
};
