"use client";
import Modal from '@/components/Modal';
import MoneyInput from '@/components/MoneyInput';
import React, { useState, useEffect, useRef } from 'react';
import { categories } from '@/data/financeMock';
import HistoryModal from '@/components/HistoryModal';
import * as XLSX from 'xlsx';
import VoiceInput from '@/components/VoiceInput';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
// ... other imports ...
import {
    getFinanceOverview,
    // subscribeToFinanceOverview, // Removed: Handled in hook
    // subscribeToTransactions, // Removed
    getTransactions,
    addTransaction,
    FinanceOverview,
    Transaction,
    seedFinanceData,
    getTransactionsByDate,
    getCurrencyRates,
    getStatisticsByRange,
    updateUltimateGoal,
    updateBudgets,
    addDebt,
    getDebts,
    DebtItem,
    repayDebt,
    updateDebt,
    addCredit,
    getCredits,
    payCredit,
    updateCredit,
    CreditItem,
    addDeposit,
    getDeposits,
    addFundsToDeposit,
    withdrawFromDeposit,
    addProfitToDeposit,
    updateDeposit,
    deleteDeposit,
    DepositItem,
    // subscribeToDebts, // Removed
    // subscribeToCredits, // Removed
    // subscribeToDeposits, // Removed
    calculateAnnuitySchedule,
    calculateDifferentialSchedule,
    calculateHistoricalLoan,
    calculateHistoricalDeposit,
    // subscribeToTransactionsByDate // Removed
} from '@/services/financeService';
import { getScheduledInsight } from '@/services/aiPersistenceService'; // Kept for types if needed, but logic moved
import { DateNavigator } from '@/components/dashboard/DateNavigator';
import { getFinanceInsight } from '@/services/groqService';
import { getUserProfile, UserProfile } from '@/services/userService';
import { useLanguage } from '@/context/LanguageContext';
import { useFinance } from '@/hooks/useFinance'; // NEW HOOK
import { getLocalTodayStr } from '@/lib/dateUtils';
import { AiInsightSection } from '@/components/dashboard/AiInsightSection';

// V14: Real Exchange Rates (Simulator)
const exchangeRates = [
    { code: 'USD', rate: 12850 },
    { code: 'EUR', rate: 13920 },
    { code: 'RUB', rate: 142 },
];

const convertCurrency = (amount: number, from: string, to: string, customRates?: any[]) => {
    if (from === to) return amount;
    const rates = customRates && customRates.length > 0 ? customRates : exchangeRates;
    // Normalize to UZS first
    let amountInUZS = from === 'UZS' ? amount : amount * (rates.find(r => r.code === from)?.rate || 1);
    // Convert to target
    return to === 'UZS' ? amountInUZS : amountInUZS / (rates.find(r => r.code === to)?.rate || 1);
};

export default function FinanceDashboard() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { clearNotification } = useNotifications();

    // Derived categories for the modal with translation keys
    const incomeCategories = categories.filter(c => c.type === 'income').map(c => ({
        name: c.name,
        key: c.name.replace(/\s+/g, '') as keyof typeof t.categories
    }));
    const expenseCategories = categories.filter(c => c.type === 'expense').map(c => ({
        name: c.name,
        key: c.name.replace(/\s+/g, '') as keyof typeof t.categories
    }));

    // --- NEW: Custom Hook Logic ---
    const [selectedDate, setSelectedDate] = useState(getLocalTodayStr());

    // consume the hook
    const {
        financeData,
        transactions,
        debts,
        credits,
        deposits,
        loading,
        aiInsight,
        aiLoading,
        refreshInsight,
        setFinanceData,
        setTransactions, // Exposed for optimistic updates if needed
        setDebts,
        setCredits,
        setDeposits
    } = useFinance(user?.uid, language, selectedDate);
    // ------------------------------

    // UI Local States
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [currencyRates, setCurrencyRates] = useState<any[]>([]);
    const [statsData, setStatsData] = useState<any>(null);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);

    // const [loading, setLoading] = useState(true); // Handled by Hook
    // const [aiInsight, setAiInsight] = useState... // Handled by Hook
    // const [aiLoading, setAiLoading] = useState(false); // Handled by Hook
    // const seedingRef = useRef(false); // Handled by Hook

    // V10.5 New State
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [goalForm, setGoalForm] = useState({ target: 1000000, deadline: '2027-12-31', currency: 'USD' });

    // Clear Notification on Mount
    useEffect(() => {
        clearNotification('finance');
    }, []);

    const isToday = selectedDate === getLocalTodayStr();
    const isArchived = !isToday;

    useEffect(() => {
        if (financeData.ultimateGoal) {
            setGoalForm({
                target: financeData.ultimateGoal.target || 1000000,
                deadline: financeData.ultimateGoal.deadline || '2027-12-31',
                currency: financeData.ultimateGoal.currency || 'USD'
            });
        }
    }, [financeData.ultimateGoal?.target, financeData.ultimateGoal?.deadline, financeData.ultimateGoal?.currency, isGoalModalOpen]);

    // V17: Daily Check for Due Payments & Manual Confirmation
    const [dueItems, setDueItems] = useState<{ type: 'credit' | 'deposit', item: any }[]>([]);
    const [isDueModalOpen, setIsDueModalOpen] = useState(false);

    useEffect(() => {
        const checkDailyEvents = async () => {
            if (!user) return;
            const today = getLocalTodayStr();
            const foundDueItems: { type: 'credit' | 'deposit', item: any }[] = [];

            // 1. Credits Due Today (Using data from hook instead of raw fetch if possible, but raw fetch is safer for "events" check to ensure fresh data)
            // Or better, filter the `credits` array we already have from the hook! 
            // optimization: use the `credits` from hook which is real-time.
            if (credits.length > 0) {
                const dueCredits = credits.filter(c => {
                    if (c.status !== 'active' || !c.startDate) return false;
                    const start = new Date(c.startDate).toISOString().split('T')[0];
                    return today >= start && (c.nextPaymentDate === today);
                });
                dueCredits.forEach(c => foundDueItems.push({ type: 'credit', item: c }));
            }

            if (foundDueItems.length > 0) {
                // simple deduplication by ID to avoid loop if effect runs often
                setDueItems(prev => {
                    const newItems = foundDueItems.filter(newItem => !prev.some(p => p.item.id === newItem.item.id));
                    return [...prev, ...newItems];
                });
                if (foundDueItems.length > 0) setIsDueModalOpen(true);
            }
        };
        // Debounce slightly or just run when credits/user changes
        if (credits.length > 0) checkDailyEvents();
    }, [user?.uid, credits]); // depend on 'credits' from hook

    const handleConfirmDueItem = async (dueItem: { type: 'credit' | 'deposit', item: any }) => {
        if (!user) return;
        if (dueItem.type === 'credit') {
            await payCredit(user.uid, dueItem.item, dueItem.item.monthlyPayment || 0);
            setAlertState({ isOpen: true, title: t.finance.paymentSuccess, message: "✅ " + t.finance.paymentSuccess, type: 'success' });
        }
        setDueItems(prev => prev.filter(i => i.item.id !== dueItem.item.id));
        if (dueItems.length <= 1) setIsDueModalOpen(false);
    };

    // V18: Budget Modal State
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [budgetForm, setBudgetForm] = useState({ incomeBudget: 0, expenseBudget: 0 });

    // --- REMOVED MANUAL SUBSCRIPTIONS (Moved to useFinance) ---

    // --- REMOVED AUTOMATIC AI FETCH (Moved to useFinance with manual trigger) ---

    // V23: Scheduled AI Insight - REPLACED WITH MANUAL BUTTON IN UI

    const handleBudgetUpdate = async () => {
        if (!user) return;
        await updateBudgets(user.uid, budgetForm.incomeBudget, budgetForm.expenseBudget);
        setIsBudgetModalOpen(false);
        setAlertState({ isOpen: true, title: t.finance.budgetSaved, message: t.finance.budgetSaved, type: 'success' });
    };

    // V19: Custom Alert Modal State
    const [alertState, setAlertState] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'warning' | 'error' }>({
        isOpen: false, title: '', message: '', type: 'success'
    });

    // V17: Auto-Sync Currency with Language (User Request)
    useEffect(() => {
        if (language === 'uz') {
            setStatsDisplayCurrency('UZS');
            setTxCurrency('UZS');
        } else if (language === 'ru') {
            setStatsDisplayCurrency('RUB');
            setTxCurrency('RUB');
        } else if (language === 'en') {
            setStatsDisplayCurrency('USD');
            setTxCurrency('USD');
        }
    }, [language]);

    const [txCurrency, setTxCurrency] = useState<'UZS' | 'USD' | 'EUR' | 'RUB'>('UZS');
    const [statsPeriod, setStatsPeriod] = useState<'weekly' | 'monthly' | 'custom'>('monthly');
    const [statsDisplayCurrency, setStatsDisplayCurrency] = useState<'UZS' | 'USD' | 'EUR' | 'RUB'>('UZS'); // V16: Global Stats Currency
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    const convert = (amount: number, from: string, to: string) => convertCurrency(amount, from, to, currencyRates);

    // V13 Portfolio State
    const [viewMode, setViewMode] = useState<'daily' | 'stats' | 'debts'>('daily');
    // const [debts, setDebts] = useState<DebtItem[]>([]); // Hook
    // const [credits, setCredits] = useState<CreditItem[]>([]); // Hook
    // const [deposits, setDeposits] = useState<DepositItem[]>([]); // Hook
    const [portfolioTab, setPortfolioTab] = useState<'debts' | 'credits' | 'deposits'>('debts');
    const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
    const [debtForm, setDebtForm] = useState<{
        type: 'i_owe' | 'owed_to_me';
        person: string;
        amount: number;
        currency: 'UZS' | 'USD' | 'EUR' | 'RUB';
        startDate: string; // New: Mandatory Start Date
        deadline: string; // New: Mandatory Deadline
        description: string;
    }>({
        type: 'i_owe',
        person: '',
        amount: 0,
        currency: 'UZS',
        startDate: getLocalTodayStr(),
        deadline: '',
        description: ''
    });

    const [extendModalDebt, setExtendModalDebt] = useState<DebtItem | null>(null);
    const [newDeadline, setNewDeadline] = useState('');

    // V13 Forms
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [creditForm, setCreditForm] = useState<any>({
        title: '', totalAmount: 0, monthlyPayment: 0, paymentDay: 1, currency: 'UZS', startDate: '', status: 'active'
    });

    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositForm, setDepositForm] = useState<{
        title: string;
        monthlyContribution: number;
        contributionDay: number;
        currency: 'UZS' | 'USD' | 'EUR' | 'RUB';
        startDate: string;
        currentAmount: number;
        interestRate: number;
        termMonths: number;
        isMonthlyInterest: boolean;
        isFromBalance: boolean; // New: Source of funds check
    }>({
        title: '',
        monthlyContribution: 0,
        contributionDay: 1,
        currency: 'UZS',
        startDate: '',
        currentAmount: 0, // Should be 0 for new, or actual for edit
        interestRate: 0,
        termMonths: 12,
        isMonthlyInterest: true,
        isFromBalance: true // Default to Yes (Safe option)
    });

    const [editingDeposit, setEditingDeposit] = useState<DepositItem | null>(null); // New: Edit state

    // V17 Repayment Modal State
    const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
    const [payingCredit, setPayingCredit] = useState<CreditItem | null>(null);
    const [repaymentForm, setRepaymentForm] = useState({ principal: 0, interest: 0 });

    // V18 Deposit Action Modal
    const [isDepositActionModalOpen, setIsDepositActionModalOpen] = useState(false);
    const [managingDeposit, setManagingDeposit] = useState<DepositItem | null>(null);
    const [depositAction, setDepositAction] = useState<'add' | 'withdraw' | 'profit'>('add');
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [isDepositTransferFromBalance, setIsDepositTransferFromBalance] = useState(true);

    // V21: Edit & Archive State
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
    const [editingCredit, setEditingCredit] = useState<CreditItem | null>(null);



    // V20: Initial Snapshot (Handled by Subscriptions now)
    /*
    useEffect(() => {
        if (!user) return;
        const fetchInitialData = async () => {
            const [d, c, dep] = await Promise.all([
                getDebts(user.uid),
                getCredits(user.uid),
                getDeposits(user.uid)
            ]);
            setDebts(d);
            setCredits(c);
            setDeposits(dep);
        };
        fetchInitialData();
    }, [user, viewMode]);
    */

    // Add Transaction State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTx, setNewTx] = useState<Omit<Transaction, 'id'>>({
        title: '',
        amount: 0,
        type: 'expense',
        category: 'Food',
        date: new Date().toISOString(),
        icon: '🛒',
        currency: 'UZS'
    });

    const handleAddTransaction = async (manualTx?: Transaction | any) => {
        const txData = manualTx || newTx;
        console.log("Adding Transaction Attempt:", txData); // Debug Log

        if (!user) {
            console.error("User not found");
            return;
        }
        if (!txData.title || txData.amount <= 0) {
            console.warn("Validation Failed:", txData);
            setAlertState({
                isOpen: true,
                title: 'Xatolik',
                message: t.finance.fillAllFields + ` (Title: ${!!txData.title}, Amount: ${txData.amount})`,
                type: 'error'
            });
            return;
        }

        try {
            // Auto Icon based on category
            const cat = categories.find(c => c.name === txData.category);
            const icon = manualTx?.icon || cat?.icon || '💰';

            const txToAdd = {
                ...txData,
                amount: Number(txData.amount),
                icon,
                date: manualTx ? txData.date : selectedDate,
                currency: manualTx ? txData.currency : txCurrency
            };

            await addTransaction(user.uid, txToAdd);
            setIsAddModalOpen(false);

            setAlertState({ isOpen: true, title: 'Muvaffaqiyatli', message: t.finance.paymentSuccess, type: 'success' });


            // Refresh Data
            const [overview, txs] = await Promise.all([
                getFinanceOverview(user.uid),
                getTransactionsByDate(user.uid, selectedDate)
            ]);
            if (overview) setFinanceData(overview);
            setTransactions(txs);

            // V18 Threshold Checks & Notifications
            if (overview) {
                if (txData.type === 'expense' && overview.expenseBudget > 0) {
                    const ratio = overview.monthlySpent / overview.expenseBudget;
                    if (ratio >= 1.0) {
                        setAlertState({ isOpen: true, title: 'Limit Reached', message: t.finance.expenseLimitMessage, type: 'error' });
                    } else if (ratio >= 0.9) {
                        setAlertState({ isOpen: true, title: 'Warning', message: t.finance.expenseAlmostLimit.replace('{val}', '90'), type: 'warning' });
                    } else if (ratio >= 0.8) {
                        setAlertState({ isOpen: true, title: 'Warning', message: t.finance.expenseAlmostLimit.replace('{val}', '80'), type: 'warning' });
                    }
                }

                if (txData.type === 'income' && overview.incomeBudget > 0) {
                    const ratio = overview.monthlyIncome / overview.incomeBudget;
                    if (ratio >= 1.0) {
                        setAlertState({ isOpen: true, title: 'Great Job!', message: t.finance.incomeGrowthMessage, type: 'success' });
                    } else if (ratio >= 0.9) {
                        setAlertState({ isOpen: true, title: 'Almost There', message: t.finance.incomeAlmostTarget.replace('{val}', '90'), type: 'success' });
                    } else if (ratio >= 0.8) {
                        setAlertState({ isOpen: true, title: 'Keep Going', message: t.finance.incomeAlmostTarget.replace('{val}', '80'), type: 'success' });
                    }
                }
            }
            // Reset
            if (!manualTx) {
                setNewTx({
                    title: '',
                    amount: 0,
                    type: 'expense',
                    category: 'Food',
                    date: new Date().toISOString(),
                    icon: '🛒',
                    currency: 'UZS'
                });
            }
        } catch (error: any) {
            console.error("Add Transaction Error:", error);
            setAlertState({
                isOpen: true,
                title: 'Xatolik',
                message: `Xatolik yuz berdi: ${error.message || 'Noma\'lum xatolik'}`,
                type: 'error'
            });
        }
    };

    const handleExportToExcel = async () => {
        if (!user) return;
        setAlertState({
            isOpen: true,
            title: 'Tayyorlanmoqda...',
            message: 'Ma\'lumotlar eksport qilinmoqda, iltimos kuting...',
            type: 'success'
        });

        try {
            const allTxs = await getTransactions(user.uid);

            if (allTxs.length === 0) {
                setAlertState({
                    isOpen: true,
                    title: 'Xatolik',
                    message: 'Eksport qilish uchun tranzaksiyalar topilmadi.',
                    type: 'warning'
                });
                return;
            }

            const worksheetData = allTxs.map((t: Transaction) => ({
                'Sana': t.date,
                'Sarlavha': t.title,
                'Turi': t.type === 'income' ? 'Kirim' : 'Chiqim',
                'Kategoriya': t.category,
                'Miqdor': t.amount,
                'Valyuta': t.currency || 'UZS',
                'Asl Miqdor': t.originalAmount || t.amount
            }));

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Tranzaksiyalar");

            const fileName = `AURA_Moliya_Eksport_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            setAlertState({
                isOpen: true,
                title: 'Muvaffaqiyatli',
                message: 'Moliyaviy ma\'lumotlar Excel formatida yuklab olindi.',
                type: 'success'
            });
        } catch (error) {
            console.error("Export Error:", error);
            setAlertState({
                isOpen: true,
                title: 'Xatolik',
                message: 'Eksport qilishda xatolik yuz berdi.',
                type: 'error'
            });
        }
    };

    // Voice Command Handler
    const handleVoiceCommand = async (command: any) => {
        if (!user) return;

        const { action, data } = command;

        if (action === 'add' || action === 'expense' || action === 'income') {
            const amount = Number(data.amount) || 0;
            const category = data.category || 'Other';
            const type: 'income' | 'expense' = (action === 'income' || data.type === 'income') ? 'income' : 'expense';
            const title = data.title || `${type} via voice`;
            const currency = data.currency || 'UZS'; // Voice currency

            if (amount > 0) {
                const cat = categories.find(c => c.name === category);
                const icon = cat?.icon || '💰';

                const txToAdd = {
                    title,
                    amount,
                    type,
                    category,
                    icon,
                    currency: currency as any,
                    date: selectedDate // Standardized date
                };

                await addTransaction(user.uid, txToAdd);

                const [overview, txs] = await Promise.all([
                    getFinanceOverview(user.uid),
                    getTransactionsByDate(user.uid, selectedDate)
                ]);
                if (overview) setFinanceData(overview);
                setTransactions(txs);

                // Budget Alert Check
                if (type === 'expense') {
                    const newSpent = (overview?.monthlySpent || 0);
                    const limit = (overview?.expenseBudget || 0);
                    if (newSpent > limit * 0.9) {
                        setAlertState({
                            isOpen: true,
                            title: 'Warning',
                            message: language === 'uz' ? `⚠️ Diqqat! Siz oylik xarajat limitingizning 90% idan o'tdingiz!` : `⚠️ Warning! You have exceeded 90% of your monthly expense limit!`,
                            type: 'warning'
                        });
                    }
                }
            }
        }
    };

    const handleQRScan = async () => {
        setQrLoading(true);
        // Simulate QR extraction logic from image/camera
        setTimeout(async () => {
            const mockExtractedData = {
                title: "QR Xarid",
                amount: 150000,
                type: 'expense' as const,
                category: 'Shopping'
            };

            if (user) {
                await addTransaction(user.uid, {
                    ...mockExtractedData,
                    icon: '🛍️',
                    date: selectedDate
                });

                const [overview, txs] = await Promise.all([
                    getFinanceOverview(user.uid),
                    getTransactionsByDate(user.uid, selectedDate)
                ]);
                if (overview) setFinanceData(overview);
                setTransactions(txs);
            }

            setQrLoading(false);
            setIsQRModalOpen(false);
        }, 1500);
    };

    const handleAddCredit = async () => {
        if (!user || !creditForm.title || creditForm.totalAmount <= 0) return;

        // V20: Calculate Historical or Future Schedule
        const result = calculateHistoricalLoan(
            creditForm.totalAmount,
            creditForm.interestRate || 0,
            creditForm.termMonths || 12,
            creditForm.startDate || getLocalTodayStr(),
            creditForm.calculationMethod as any
        );

        const creditData = {
            ...creditForm,
            remainingAmount: result.currentRemaining, // Correct remaining amount based on history!
            nextPaymentDate: result.nextPaymentDate || getLocalTodayStr(),
            status: result.currentRemaining > 0 ? 'active' : 'paid',
            // Save metadata for history tracking
            historical: {
                initialAmount: result.initialAmount,
                monthsPassed: result.monthsPassed,
                isHistorical: result.isHistorical
            }
        };

        if (editingCredit) {
            await updateCredit(user.uid, editingCredit.id!, creditData as any);
            setAlertState({ isOpen: true, title: 'Success', message: 'Kredit ma\'lumotlari yangilandi', type: 'success' });
            setEditingCredit(null);
        } else {
            // 2. Add Credit Record with calculated state
            await addCredit(user.uid, creditData as any);

            // 3. Cash Flow Logic
            // If it's a historical loan (started in past), DO NOT add Income transaction.
            // If it's new (future or today), ADD Income as usual.

            if (!result.isHistorical) {
                await handleAddTransaction({
                    title: `Kredit Olindi: ${creditForm.title}`,
                    amount: creditForm.totalAmount,
                    type: 'income',
                    category: t.categories.creditIn, // 'Kredit (Kirim)'
                    date: creditForm.startDate || getLocalTodayStr(),
                    icon: '🏦',
                    currency: creditForm.currency,
                    isLiability: true // Not profit
                } as any);
            } else {
            }
        }

        setIsCreditModalOpen(false);
        setCreditForm({ title: '', totalAmount: 0, monthlyPayment: 0, paymentDay: 1, currency: 'UZS', startDate: '', status: 'active', interestRate: 0, termMonths: 12, calculationMethod: 'annuity' });
    };



    const handlePayCredit = (credit: CreditItem) => {
        setPayingCredit(credit);
        // Default split estimate (simple logic: assume full payment is principal unless we have better tracking later)
        // Ideally, we'd calculate interest based on schedule, but for now user inputs it manually.
        setRepaymentForm({ principal: credit.monthlyPayment, interest: 0 });
        setIsRepaymentModalOpen(true);
    };

    const submitCreditRepayment = async () => {
        if (!user || !payingCredit || (repaymentForm.principal + repaymentForm.interest <= 0)) return;

        // 1. Pay Credit (Principal Reduction)
        // calling payCredit with ONLY principal? No, typically reducing amount means principal. 
        // We will call payCredit with Principal amount to reduce the debt.
        await payCredit(user.uid, payingCredit, repaymentForm.principal);

        // 2. Record Transactions
        const date = new Date().toISOString();

        // Principal -> Debt Repayment (Not Expense, just Liability reduction)
        if (repaymentForm.principal > 0) {
            await handleAddTransaction({
                title: `Kredit Asosiy Qarz: ${payingCredit.title}`,
                amount: repaymentForm.principal,
                type: 'expense', // Still expense output, but flagged
                category: 'Kredit (Asosiy)',
                date,
                icon: '📉',
                currency: payingCredit.currency,
                isDebtRepayment: true // V17 Flag
            } as any);
        }

        // Interest -> Expense (Real cost)
        if (repaymentForm.interest > 0) {
            await handleAddTransaction({
                title: `Kredit Foiz: ${payingCredit.title}`,
                amount: repaymentForm.interest,
                type: 'expense',
                category: 'Kredit (Foiz)', // Interest Category
                date,
                icon: '💸',
                currency: payingCredit.currency
            } as any);
        }

        // Actions handled by subscriptions
        setIsRepaymentModalOpen(false);
        setPayingCredit(null);
        setAlertState({ isOpen: true, title: 'Repaid', message: t.finance.paymentSuccess, type: 'success' });
    };

    const handleAddToDeposit = (deposit: DepositItem) => {
        setManagingDeposit(deposit);
        setDepositAmount(deposit.monthlyContribution || 0);
        setDepositAction('add');
        setIsDepositTransferFromBalance(true);
        setIsDepositActionModalOpen(true);
    };

    const submitDepositAction = async () => {
        if (!user || !managingDeposit || depositAmount <= 0) return;

        if (depositAction === 'add') {
            await addFundsToDeposit(user.uid, managingDeposit, depositAmount, isDepositTransferFromBalance);
            setAlertState({ isOpen: true, title: 'Success', message: 'Omonat to\'ldirildi!', type: 'success' });
        } else if (depositAction === 'withdraw') {
            await withdrawFromDeposit(user.uid, managingDeposit, depositAmount);
            setAlertState({ isOpen: true, title: 'Success', message: 'Mablag\' yechildi!', type: 'success' });
        } else if (depositAction === 'profit') {
            await addProfitToDeposit(user.uid, managingDeposit, depositAmount);
            setAlertState({ isOpen: true, title: 'Success', message: 'Foyda qo\'shildi!', type: 'success' });
        }

        // Actions handled by subscriptions
        setIsDepositActionModalOpen(false);
        setManagingDeposit(null);
        setDepositAmount(0);
    };

    const handleAddDebt = async () => {
        if (!user || !debtForm.person || debtForm.amount <= 0 || !debtForm.startDate || !debtForm.deadline) {
            setAlertState({ isOpen: true, title: 'Error', message: "Iltimos, barcha maydonlarni va muddatlarni to'ldiring!", type: 'error' });
            return;
        }

        const debtData = {
            ...debtForm,
            date: debtForm.startDate,
            status: (editingDebt ? editingDebt.status : 'active') as any,
            repaymentHistory: editingDebt ? editingDebt.repaymentHistory : [],
            totalRepaid: editingDebt ? editingDebt.totalRepaid : 0
        };

        if (editingDebt) {
            await updateDebt(user.uid, editingDebt.id, debtData);
            setAlertState({ isOpen: true, title: 'Success', message: 'Qarz ma\'lumotlari yangilandi', type: 'success' });
            setEditingDebt(null);
        } else {
            await addDebt(user.uid, debtData);

            // V17: Cash Flow Logic Refinement
            // Borrowing (I Owe) = INCOME (Money comes in)
            // Lending (Owed to Me) = EXPENSE (Money goes out)
            if (debtForm.type === 'i_owe') {
                await handleAddTransaction({
                    title: `Qarz Olindi: ${debtForm.person}`,
                    amount: debtForm.amount,
                    type: 'income',
                    category: 'Qarz (Kirim)',
                    date: debtForm.startDate,
                    icon: '📥', // Inbox tray for coming in
                    currency: debtForm.currency
                } as any);
            } else {
                await handleAddTransaction({
                    title: `Qarz Berildi: ${debtForm.person}`,
                    amount: debtForm.amount,
                    type: 'expense',
                    category: 'Qarz Berish (Chiqim)',
                    date: debtForm.startDate,
                    icon: '📤', // Outbox tray for going out
                    currency: debtForm.currency
                } as any);
            }
        }

        // Actions handled by subscriptions
        setIsDebtModalOpen(false);
        setDebtForm({ type: 'i_owe', person: '', amount: 0, currency: 'UZS', startDate: getLocalTodayStr(), deadline: '', description: '' });
    };

    const handleRepay = async (debt: DebtItem) => {
        if (!user || !confirm("Ushbu qarz to'liq qaytarildimi? (Balansga ta'sir qiladi)")) return;
        await repayDebt(user.uid, debt, debt.amount - (debt.totalRepaid || 0), true);

        // V17: Repayment Cash Flow Logic
        // I Owe -> Repaying it logic -> EXPENSE (Money leaves me)
        // Owed to Me -> Receiving it logic -> INCOME (Money returns to me)
        if (debt.type === 'i_owe') {
            await handleAddTransaction({
                title: `Qarz Uzildi: ${debt.person}`,
                amount: debt.amount,
                type: 'expense',
                category: 'Qarz Qaytarish (Chiqim)',
                date: new Date().toISOString(),
                icon: '💸',
                currency: debt.currency
            } as any);
        }
        else {
            await handleAddTransaction({
                title: `Qarz Qaytdi: ${debt.person}`,
                amount: debt.amount,
                type: 'income',
                category: 'Qarz Qaytishi (Kirim)',
                date: new Date().toISOString(),
                icon: '💰',
                currency: debt.currency
            } as any);
        }

        // Actions handled by subscriptions
        // Qarz qaytarilganda onSnapshot avtomat yangilaydi

    };

    const handleExtend = async () => {
        if (!user || !extendModalDebt || !newDeadline) return;
        await updateDebt(user.uid, extendModalDebt.id, { deadline: newDeadline });
        setDebts(await getDebts(user.uid));
        setExtendModalDebt(null);
    };

    // Formatting Helpers
    const formatNumber = (num: number) => {
        const val = Math.round(num || 0);
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };
    const parseNumber = (str: string) => Number(str.replace(/\s/g, ''));

    const expensePercentage = financeData.expenseBudget > 0
        ? (financeData.monthlySpent / financeData.expenseBudget) * 100
        : 0;

    const incomePercentage = financeData.incomeBudget > 0
        ? (financeData.monthlyIncome / financeData.incomeBudget) * 100
        : 0;

    // Load Data (Rates & Profile Only - Data handled by Subs)
    useEffect(() => {
        if (user?.uid) {
            // Clear notification on mount
            clearNotification('finance');

            // setLoading(true); // Removed as loading is handled by hook
            Promise.all([
                getCurrencyRates(),
                getUserProfile(user.uid)
            ]).then(async ([rates, profile]) => {
                setCurrencyRates(rates);
                setUserProfile(profile);
                // Loading state handled by subscription

                // Fetch AI Insight if we have data (transactions check moved to effect dependency or separate check)
                // We'll let the AI Insight effect handle itself based on state changes
            });
        }
    }, [user?.uid, language]);

    // Stats Effect
    useEffect(() => {
        if (!user) return;
        const fetchStats = async () => {
            let start = new Date(selectedDate);
            let end = new Date(selectedDate);

            if (statsPeriod === 'weekly') {
                start.setDate(end.getDate() - 6); // Last 7 days including today
            } else if (statsPeriod === 'monthly') {
                start.setDate(1); // Start of month
            } else if (statsPeriod === 'custom' && customRange.start && customRange.end) {
                start = new Date(customRange.start);
                end = new Date(customRange.end);
            } else {
                // Default fallback
                start.setDate(end.getDate() - 30);
            }

            const stats = await getStatisticsByRange(user.uid, start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
            setStatsData(stats);
        };
        fetchStats();
    }, [user?.uid, selectedDate, statsPeriod]);

    const handleGoalUpdate = async () => {
        if (!user) return;
        await updateUltimateGoal(user.uid, {
            target: Number(goalForm.target),
            deadline: goalForm.deadline,
            currency: goalForm.currency as any
        });
        // No manual refresh needed
        setIsGoalModalOpen(false);
    };


    // Simulate Time (Evening) for AI Insight
    const isEvening = true;

    // Calculate category totals for charts
    const categoryTotals = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);


    // History State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isAllTransactionsOpen, setIsAllTransactionsOpen] = useState(false);

    const handleEditDeposit = (deposit: DepositItem) => {
        setEditingDeposit(deposit);
        setDepositForm({
            title: deposit.title,
            currentAmount: deposit.currentAmount,
            monthlyContribution: deposit.monthlyContribution,
            contributionDay: deposit.contributionDay,
            currency: deposit.currency,
            startDate: deposit.startDate,
            interestRate: deposit.interestRate || 0,
            termMonths: deposit.termMonths || 12,
            isMonthlyInterest: deposit.isMonthlyInterest !== false,
            isFromBalance: true // Default (irrelevant for edit usually, but safe)
        });
        setIsDepositModalOpen(true);
    };

    const handleDeleteDeposit = async (deposit: DepositItem) => {
        if (!confirm(`Haqiqatan ham "${deposit.title}" omonatini o'chirmoqchimisiz?`)) return;
        if (!user || !deposit.id) return;

        await deleteDeposit(user.uid, deposit.id);
        setDeposits(await getDeposits(user.uid));

        // Update balance
        const overview = await getFinanceOverview(user.uid);
        if (overview) setFinanceData(overview);

        setAlertState({ isOpen: true, title: 'Deleted', message: 'Omonat o\'chirildi', type: 'success' });
    };




    return (
        <>
            <div className="space-y-8 animate-fade-in relative">

                {/* HEADER */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-white mb-2">{t.finance.title}</h1>
                        <p className="text-gray-400">{t.finance.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

                        <VoiceInput
                            module="finance"
                            onCommand={handleVoiceCommand}
                            color="gold"
                            className={isArchived ? 'opacity-30 pointer-events-none' : ''}
                        />

                        <button
                            onClick={() => !isArchived && setIsAddModalOpen(true)}
                            disabled={isArchived}
                            className={`px-6 py-3 rounded-xl border font-bold shadow-lg transition-all ${isArchived ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : 'bg-aura-gold/10 border-aura-gold/30 text-aura-gold hover:bg-aura-gold/20 shadow-aura-gold/10'}`}
                        >
                            + {t.finance.addTransaction}
                        </button>
                    </div>
                </div>

                {/* ARCHIVED DAY INDICATOR (PRD Feature) */}
                {isArchived && (
                    <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-gray-400 text-sm animate-pulse shadow-xl">
                        <span className="text-xl">🔒</span>
                        <div className="flex flex-col">
                            <span className="font-bold text-white/80">{t.finance.readOnly || "Archive Context"}</span>
                            <span className="text-[10px] uppercase tracking-widest opacity-60">{t.finance.readOnlyDesc || "Past days cannot be edited to ensure data integrity"}</span>
                        </div>
                    </div>
                )}

                {/* HEADER CONTROLS: Currencies (left) & Navigation (right) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
                    {/* CURRENCIES (LEFT) */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-black border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
                            <span className="text-[8px] font-black text-white/30 tracking-tight">USD</span>
                            <span className="text-[10px] font-black text-white tracking-tight">12 850</span>
                            <span className="text-[10px] text-aura-green">▲</span>
                        </div>
                        <div className="bg-black border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
                            <span className="text-[8px] font-black text-white/30 tracking-tight">EUR</span>
                            <span className="text-[10px] font-black text-white tracking-tight">13 920</span>
                            <span className="text-[10px] text-aura-red">▼</span>
                        </div>
                        <div className="bg-black border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
                            <span className="text-[8px] font-black text-white/30 tracking-tight">RUB</span>
                            <span className="text-[10px] font-black text-white tracking-tight">142</span>
                            <span className="text-[10px] text-aura-green">▲</span>
                        </div>
                    </div>

                    {/* NAVIGATION BUTTONS (RIGHT) */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setIsQRModalOpen(true)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 text-gray-400 hover:text-white transition-all hover:bg-white/10"
                        >
                            <span className="text-xs">📷</span>
                            <span className="text-xs font-black uppercase tracking-wider">{t.finance.qrScanner}</span>
                        </button>
                        <button
                            onClick={() => setViewMode('daily')}
                            className={`border rounded-xl px-4 py-2 text-xs font-black uppercase transition-all tracking-wider ${viewMode === 'daily' ? 'bg-aura-gold text-black border-aura-gold shadow-[0_0_15px_rgba(255,214,0,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        >
                            {t.finance.dailyFlow}
                        </button>
                        <button
                            onClick={() => setViewMode('stats')}
                            className={`border rounded-xl px-4 py-2 text-xs font-black uppercase transition-all tracking-wider ${viewMode === 'stats' ? 'bg-aura-gold text-black border-aura-gold shadow-[0_0_15px_rgba(255,214,0,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        >
                            {t.finance.advancedStats}
                        </button>
                        <button
                            onClick={() => setViewMode('debts')}
                            className={`border rounded-xl px-4 py-2 flex items-center gap-2 transition-all tracking-wider ${viewMode === 'debts' ? 'bg-aura-gold text-black border-aura-gold shadow-[0_0_15px_rgba(255,214,0,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                        >
                            <span className="text-xs">💼</span>
                            <span className="text-xs font-black uppercase">{t.finance.portfolio}</span>
                        </button>
                    </div>
                </div>



                {viewMode === 'daily' ? (
                    <>
                        {/* TOP CARDS: DUAL BUDGET & ULTIMATE GOAL */}
                        {/* V20 Adjusted Layout: col-span-2 -> col-span-full or smarter logic to reduce space */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                            <div
                                onClick={() => !isArchived && setIsGoalModalOpen(true)}
                                className={`lg:col-span-2 p-8 rounded-[2.5rem] bg-gradient-to-br from-aura-gold/20 via-black to-black border border-aura-gold/30 relative overflow-hidden group hover:border-aura-gold/50 transition-all min-h-full flex flex-col ${isArchived ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                {!isArchived && <div className="absolute top-4 right-4 text-xs text-aura-gold border border-aura-gold/30 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">EDIT ✏️</div>}
                                <div className="absolute top-0 right-0 p-8 opacity-20 text-8xl grayscale group-hover:grayscale-0 transition-all duration-700">🏆</div>
                                <div className="relative z-10 h-full flex flex-col">
                                    <p className="text-aura-gold font-black text-[10px] uppercase tracking-[0.3em] mb-4">{t.finance.ultimateGoalTitle}</p>

                                    {financeData.ultimateGoal?.target && financeData.ultimateGoal.target > 0 ? (
                                        <>
                                            <h2 className="text-4xl font-display font-black text-white mb-2">
                                                {formatNumber(financeData.ultimateGoal.target)} {financeData.ultimateGoal.currency || 'USD'}
                                            </h2>
                                            <p className="text-gray-500 text-xs mb-8">{t.finance.deadline}: {financeData.ultimateGoal?.deadline || '2027-12-31'}</p>

                                            <div className="space-y-4 mt-auto">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t.finance.currentStatus}</span>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-2xl font-black text-white">{financeData.ultimateGoal?.currency || 'USD'} {formatNumber(financeData.totalBalance)}</span>
                                                            <span className="text-xs text-gray-500 font-bold">/ {formatNumber(financeData.ultimateGoal.target)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-aura-gold font-black text-2xl drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                                                        {Math.min(100, Math.round((financeData.totalBalance / financeData.ultimateGoal.target) * 100))}%
                                                    </div>
                                                </div>

                                                <div className="h-4 w-full bg-white/5 rounded-full border border-white/10 p-1">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-aura-gold to-yellow-500 rounded-full shadow-[0_0_20px_rgba(255,214,0,0.4)] transition-all duration-1000"
                                                        style={{ width: `${Math.min(100, (financeData.totalBalance / financeData.ultimateGoal.target) * 100)}%` }}
                                                    ></div>
                                                </div>

                                                {/* Net Worth Block V20 */}
                                                {(() => {
                                                    const assetTotal = deposits.reduce((sum, d) => sum + convert(d.currentAmount || 0, d.currency, 'UZS'), 0) +
                                                        debts.filter(d => d.type === 'owed_to_me').reduce((sum, d) => sum + convert(d.amount - (d.totalRepaid || 0), d.currency, 'UZS'), 0);

                                                    const liabilityTotal = credits.reduce((sum, c) => sum + convert(c.remainingAmount || 0, c.currency, 'UZS'), 0) +
                                                        debts.filter(d => d.type === 'i_owe').reduce((sum, d) => sum + convert(d.amount - (d.totalRepaid || 0), d.currency, 'UZS'), 0);

                                                    const realBalance = assetTotal - liabilityTotal;

                                                    return (
                                                        <div className="mt-4 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl group/nw hover:border-aura-green/40 transition-all">
                                                            <div className="flex justify-between items-center mb-6">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-aura-green animate-pulse"></div>
                                                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">{t.finance.realMoney}</span>
                                                                </div>
                                                                <span className={`text-2xl font-display font-black tracking-tighter ${realBalance >= 0 ? 'text-aura-green' : 'text-aura-red'}`}>
                                                                    {realBalance >= 0 ? '+' : ''}{formatNumber(convert(realBalance, 'UZS', statsDisplayCurrency))} <span className="text-xs opacity-50 font-sans">{statsDisplayCurrency}</span>
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 group-hover/nw:border-aura-green/20 transition-colors">
                                                                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">{t.finance.assets}</p>
                                                                    <p className="text-lg font-mono font-bold text-aura-green">
                                                                        +{formatNumber(convert(assetTotal, 'UZS', statsDisplayCurrency))}
                                                                    </p>
                                                                </div>
                                                                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 group-hover/nw:border-aura-red/20 transition-colors">
                                                                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">{t.finance.liabilities}</p>
                                                                    <p className="text-lg font-mono font-bold text-aura-red">
                                                                        -{formatNumber(convert(liabilityTotal, 'UZS', statsDisplayCurrency))}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* AI Predictions */}
                                                {(financeData.totalBalance > 0 || financeData.monthlyIncome > 0) && (
                                                    <div className="flex justify-between text-[10px] text-white/60 mt-2 gap-4 border-t border-white/5 pt-4">
                                                        <div className="text-left">
                                                            <span className="block text-aura-gold font-bold mb-1">{t.finance.remainingTime}:</span>
                                                            <span className="font-mono text-white">
                                                                {(() => {
                                                                    const deadline = new Date(financeData.ultimateGoal?.deadline || '2027-12-31').getTime();
                                                                    const now = new Date().getTime();
                                                                    const diff = deadline - now;
                                                                    if (diff <= 0) return t.finance.deadlineExpired;
                                                                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                                    const weeks = Math.floor(days / 7);
                                                                    const months = Math.floor(days / 30);
                                                                    return `${months} ${t.finance.months}, ${weeks % 4} ${t.finance.weeks}, ${days % 7} ${t.finance.days}`;
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block text-aura-green font-bold mb-1">{t.finance.probability}:</span>
                                                            <span className="font-mono text-white">
                                                                {(() => {
                                                                    const netIncomeUZS = financeData.monthlyIncome - financeData.monthlySpent;
                                                                    const targetUZS = financeData.ultimateGoal ? financeData.ultimateGoal.target * (financeData.ultimateGoal.currency === 'USD' ? 12850 : 1) : 0;
                                                                    const currentUZS = financeData.totalBalance;

                                                                    if (netIncomeUZS <= 0) return t.finance.incomeInsufficient;
                                                                    const remainingUZS = Math.max(0, targetUZS - currentUZS);
                                                                    const monthsToGoal = Math.ceil(remainingUZS / netIncomeUZS);
                                                                    if (monthsToGoal > 1200) return `> 100 ${t.finance.years}`;
                                                                    const years = Math.floor(monthsToGoal / 12);
                                                                    const months = monthsToGoal % 12;

                                                                    return years > 0 ? `${years}y ${months}m` : `${months}m`;
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                                            <div className="text-5xl mb-4 opacity-50">🎯</div>
                                            <h2 className="text-2xl font-display font-black text-white mb-2">{t.finance.enterGoal}</h2>
                                            <p className="text-gray-500 text-xs max-w-[200px]">{t.finance.incomeHistoryEmptyDesc}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                onClick={() => {
                                    if (isArchived) return;
                                    setBudgetForm({ incomeBudget: financeData.incomeBudget, expenseBudget: financeData.expenseBudget });
                                    setIsBudgetModalOpen(true);
                                }}
                                className={`p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden group hover:border-aura-green/30 transition-all flex-1 flex flex-col justify-between ${isArchived ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                <div className="absolute top-4 right-4 p-2 rounded-full bg-aura-green/10 text-aura-green group-hover:scale-110 transition-transform">
                                    <span className="text-xl">📈</span>
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-aura-green mb-4">{t.finance.incomePlan}</h3>

                                <div className="flex items-baseline gap-2 mb-2">
                                    <h2 className="text-4xl font-display font-black text-white tracking-tighter">
                                        {formatNumber(convert(financeData.monthlyIncome || 0, 'UZS', statsDisplayCurrency))}
                                    </h2>
                                    <span className="text-xs font-black text-white/40">{statsDisplayCurrency}</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-4 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                    <span>/ {formatNumber(convert(financeData.incomeBudget || 0, 'UZS', statsDisplayCurrency))} {statsDisplayCurrency} {t.finance.target}</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full mb-2 p-[2px] border border-white/5">
                                    <div className="bg-aura-green h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,255,150,0.3)]" style={{ width: `${Math.min(incomePercentage, 100)}%` }}></div>
                                </div>

                                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-white/40 mt-6 pt-4 border-t border-white/5">
                                    <span>
                                        {`${incomePercentage.toFixed(0)}% ${t.finance.achieved}`}
                                    </span>
                                    {(financeData.incomeBudget || 0) > 0 && (
                                        <span className="text-aura-green font-bold text-xs">
                                            {formatNumber(convert(financeData.incomeBudget - financeData.monthlyIncome, 'UZS', statsDisplayCurrency))} {t.finance.left}
                                        </span>
                                    )}
                                </div>

                                {/* V20: Match detail to fill space */}
                                <div className="mt-4 flex items-center gap-2 opacity-40">
                                    <div className="w-1.5 h-1.5 rounded-full bg-aura-green"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{t.finance.incomePlan} {t.finance.analysisSummary}</span>
                                </div>

                            </div>

                            {/* Expense Card */}
                            <div
                                onClick={() => {
                                    if (isArchived) return;
                                    setIsBudgetModalOpen(true);
                                }}
                                className={`p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden group hover:border-aura-red/30 transition-all flex-1 flex flex-col justify-between ${isArchived ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                <div className="absolute top-4 right-4 p-2 rounded-full bg-aura-red/10 text-aura-red group-hover:scale-110 transition-transform">
                                    <span className="text-xl">📉</span>
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-aura-red mb-4">{t.finance.expenseControl}</h3>

                                <div className="flex items-baseline gap-2 mb-2">
                                    <h2 className="text-4xl font-display font-black text-white tracking-tighter">
                                        {formatNumber(convert(financeData.monthlySpent || 0, 'UZS', statsDisplayCurrency))}
                                    </h2>
                                    <span className="text-xs font-black text-white/40">{statsDisplayCurrency}</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-4 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                    <span>/ {formatNumber(convert(financeData.expenseBudget || 0, 'UZS', statsDisplayCurrency))} {statsDisplayCurrency} {t.finance.limit}</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full mb-2 p-[2px] border border-white/5">
                                    <div className="bg-aura-red h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,50,50,0.3)]" style={{ width: `${Math.min(expensePercentage, 100)}%` }}></div>
                                </div>

                                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-white/40 mt-6 pt-4 border-t border-white/5">
                                    <span>
                                        {`${expensePercentage.toFixed(0)}% ${t.finance.used}`}
                                    </span>
                                    {(financeData.expenseBudget || 0) > 0 && (
                                        <span className={expensePercentage > 90 ? 'text-aura-red animate-pulse' : 'text-white/60 font-bold'}>
                                            {formatNumber(convert(financeData.expenseBudget - financeData.monthlySpent, 'UZS', statsDisplayCurrency))} {t.finance.left}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-4 flex items-center gap-2 opacity-40">
                                    <div className="w-1.5 h-1.5 rounded-full bg-aura-red"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{t.finance.expenseControl} {t.finance.analysisSummary}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* RECENT TRANSACTIONS */}
                            <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-black/40 border border-white/5">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter">{t.finance.recentActivity}</h3>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleExportToExcel}
                                            className="px-4 py-2 rounded-xl bg-aura-gold/10 border border-aura-gold/30 text-xs font-black uppercase text-aura-gold hover:bg-aura-gold/20 transition-all flex items-center gap-2"
                                        >
                                            <span>📊</span>
                                            {t.finance.exportExcel || "Excel Yuklash"}
                                        </button>
                                        <button
                                            onClick={() => setIsAllTransactionsOpen(true)}
                                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase text-gray-400 hover:text-white transition-all"
                                        >
                                            {t.common.viewHistory}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {transactions.length > 0 ? transactions.map((t) => (
                                        <div key={t.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                                            <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                {t.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white group-hover:text-aura-gold transition-colors">{t.title}</h4>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{new Date(t.date).toLocaleDateString()} • {t.category}</p>
                                            </div>
                                            <div className={`text-xl font-mono font-black ${t.type === 'income' ? 'text-aura-green' : 'text-white'}`}>
                                                {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center opacity-20">
                                            <p className="text-4xl mb-4">🕳️</p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">{t.finance.noTransactions}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AI WEALTH PATHING (NEW V10) */}
                            <div className="p-8 rounded-[2.5rem] bg-indigo-950/20 border border-indigo-500/20 flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">🤖</div>
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">{t.finance.aiRoadmapTitle}</h3>
                                        <p className="text-[10px] text-gray-500">{t.finance.filesAnalysis}</p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6">
                                    {/* Status Card */}
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] text-indigo-400 font-bold uppercase">{t.finance.financialStatus}</p>
                                            <span className={`text-xs font-black ${(financeData.monthlyIncome === 0 && financeData.monthlySpent === 0) ? 'text-gray-400' :
                                                (financeData.monthlyIncome >= financeData.monthlySpent) ? 'text-aura-green' : 'text-aura-red'
                                                }`}>
                                                {(financeData.monthlyIncome === 0 && financeData.monthlySpent === 0) ? t.finance.statusStart :
                                                    (financeData.monthlyIncome >= financeData.monthlySpent) ? t.finance.statusPositive : t.finance.statusDanger}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-300 leading-relaxed">
                                            {(financeData.monthlyIncome === 0 && financeData.monthlySpent === 0)
                                                ? t.finance.statusDescStart
                                                : (financeData.monthlyIncome >= financeData.monthlySpent)
                                                    ? t.finance.statusDescPositive(((financeData.monthlyIncome - financeData.monthlySpent) / (financeData.monthlyIncome || 1) * 100).toFixed(0))
                                                    : t.finance.statusDescDanger}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{t.finance.recommendations}</h4>

                                        {/* AI INSIGHT RENDERING */}
                                        {aiLoading ? (
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5 animate-pulse">
                                                <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                                                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                            </div>
                                        ) : aiInsight ? (
                                            <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                                <span className="text-2xl mt-1">{aiInsight.emoji || '💡'}</span>
                                                <div>
                                                    <h5 className="text-sm font-bold text-white mb-1">{aiInsight.title || 'AI Advisor'}</h5>
                                                    <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                                                        {typeof aiInsight.insight === 'string' ? aiInsight.insight : JSON.stringify(aiInsight.insight)}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            // Fallback if no AI insight yet
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                                                <span className="text-lg">✨</span>
                                                <span className="text-[10px] font-bold text-gray-400 leading-tight">{t.finance.statusOk}</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 mt-auto"
                                        onClick={() => setViewMode('stats')}
                                    >
                                        {t.finance.viewFullAnalysis}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* V17: AI FORECAST FOOTER */}
                        <div className="w-full p-12 rounded-[3rem] bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/5 text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aura-gold to-transparent opacity-20"></div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-4">{t.finance.aiPredictionTitle}</p>
                            <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-4">
                                {financeData.monthlyIncome > 0 || financeData.monthlySpent > 0 ? (
                                    <>
                                        {(() => {
                                            const today = new Date().getDate();
                                            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                                            const remainingDays = daysInMonth - today;
                                            const dailyIncome = financeData.monthlyIncome / (today || 1);
                                            const dailyExpense = financeData.monthlySpent / (today || 1);
                                            const projectedNet = (dailyIncome - dailyExpense) * remainingDays;
                                            const projectedResult = (financeData.monthlyIncome - financeData.monthlySpent) + projectedNet;

                                            return (
                                                <>
                                                    <span className={projectedResult > 0 ? 'text-aura-green' : 'text-aura-red'}>
                                                        {projectedResult > 0 ? '+' : ''}{formatNumber(projectedResult)} {statsDisplayCurrency}
                                                    </span>
                                                    <span className="block text-xs text-white/30 font-bold tracking-widest mt-2 uppercase">
                                                        {t.finance.expectedMonthlyProfit}
                                                    </span>
                                                </>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    t.finance.waitingForData
                                )}
                            </h2>
                            <p className="text-white/40 text-sm max-w-2xl mx-auto italic">
                                {t.finance.predictionDisclaimerText}
                            </p>
                        </div>
                    </>
                ) : viewMode === 'debts' ? (
                    /* PORTFOLIO DASHBOARD (V13: Debts + Credits + Deposits) */
                    <div className="space-y-8 animate-fade-in">
                        {/* V14: LIVE EXCHANGE RATES WIDGET - REMOVED (Redundant) */}

                        {/* PORTFOLIO SUMMARY & TABS */}
                        <div className="flex flex-col gap-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-aura-red/10 border border-aura-red/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">📉</div>
                                    <p className="text-xs text-aura-red uppercase font-black tracking-widest mb-2">{t.finance.liabilities} ({t.finance.debt})</p>
                                    <h2 className="text-2xl font-black text-white">
                                        {formatNumber(
                                            debts.filter(d => d.type === 'i_owe' && d.status === 'active').reduce((a, b) => a + (b.amount - (b.totalRepaid || 0)), 0) +
                                            credits.filter(c => c.status === 'active').reduce((a, b) => a + b.remainingAmount, 0)
                                        )}
                                        <span className="text-xs ml-2 text-gray-500">UZS</span>
                                    </h2>
                                    <p className="text-[10px] text-gray-500 mt-1">{t.finance.debtsPlusCredits}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-aura-green/10 border border-aura-green/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">📈</div>
                                    <p className="text-xs text-aura-green uppercase font-black tracking-widest mb-2">{t.finance.assets} ({t.finance.investment})</p>
                                    <h2 className="text-2xl font-black text-white">
                                        {formatNumber(
                                            debts.filter(d => d.type === 'owed_to_me' && d.status === 'active').reduce((a, b) => a + (b.amount - (b.totalRepaid || 0)), 0) +
                                            deposits.reduce((a, b) => a + (b.currentAmount || 0), 0)
                                        )}
                                        <span className="text-xs ml-2 text-gray-500">UZS</span>
                                    </h2>
                                    <p className="text-[10px] text-gray-500 mt-1">{t.finance.returnPlusDeposits}</p>
                                </div>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="relative flex flex-col md:flex-row items-center justify-center gap-6">
                                <div className="flex bg-black/40 p-1 rounded-xl w-full md:w-fit">
                                    <button
                                        onClick={() => setPortfolioTab('debts')}
                                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${portfolioTab === 'debts' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        📒 {t.finance.debt}
                                    </button>
                                    <button
                                        onClick={() => setPortfolioTab('credits')}
                                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${portfolioTab === 'credits' ? 'bg-aura-red text-white shadow-lg shadow-aura-red/20' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        🏦 {t.finance.credit}
                                    </button>
                                    <button
                                        onClick={() => setPortfolioTab('deposits')}
                                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${portfolioTab === 'deposits' ? 'bg-aura-green text-black shadow-lg shadow-aura-green/20' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        💰 {t.finance.investment}
                                    </button>
                                </div>

                                <div className="md:absolute md:right-0 w-full md:w-auto">
                                    <button
                                        onClick={() => {
                                            if (isArchived) return;
                                            if (portfolioTab === 'debts') setIsDebtModalOpen(true);
                                            else if (portfolioTab === 'credits') {
                                                setCreditForm({ title: '', totalAmount: 0, monthlyPayment: 0, paymentDay: 1, currency: 'UZS', startDate: '', status: 'active' });
                                                setIsCreditModalOpen(true);
                                            } else if (portfolioTab === 'deposits') {
                                                setDepositForm({
                                                    title: '',
                                                    monthlyContribution: 0,
                                                    contributionDay: 1,
                                                    currency: 'UZS',
                                                    startDate: '',
                                                    currentAmount: 0,
                                                    interestRate: 0,
                                                    termMonths: 12,
                                                    isMonthlyInterest: true,
                                                    isFromBalance: true
                                                });
                                                setIsDepositModalOpen(true);
                                            }
                                        }}
                                        disabled={isArchived}
                                        className={`w-full md:w-auto px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isArchived ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed' :
                                            (portfolioTab === 'debts' ? 'bg-aura-gold text-black shadow-aura-gold/20 hover:scale-110 active:scale-95' :
                                                portfolioTab === 'credits' ? 'bg-aura-red text-white shadow-aura-red/20 hover:scale-110 active:scale-95' :
                                                    'bg-aura-green text-black shadow-aura-green/20 hover:scale-110 active:scale-95')
                                            }`}
                                    >
                                        + {portfolioTab === 'debts' ? t.finance.addDebt.replace('+ ', '') : portfolioTab === 'credits' ? t.finance.addCredit : t.finance.addDeposit}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CONTENT AREA */}

                        {/* 1. DEBTS VIEW */}
                        {portfolioTab === 'debts' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-end">
                                    {/* Redundant Button Removed as per User Request */}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {debts.filter(d => (d as any).status !== 'archived').map((debt: any) => (
                                        <div key={debt.id} className="p-6 rounded-2xl bg-black/40 border border-white/5 relative group">
                                            <div className={`absolute top-4 left-4 text-[10px] font-bold px-2 py-1 rounded-full ${debt.type === 'i_owe' ? 'bg-aura-red/20 text-aura-red' : 'bg-aura-green/20 text-aura-green'}`}>
                                                {debt.type === 'i_owe' ? t.finance.iOweLabel : t.finance.owedToMeLabel}
                                            </div>

                                            <div className="mt-8"></div> {/* Spacer for absolute buttons */}

                                            <h3 className="text-lg font-bold text-white mb-1">{debt.person}</h3>
                                            <p className="text-xs text-gray-500 mb-4">{debt.deadline ? `${t.finance.deadline}: ${debt.deadline}` : t.finance.noDeadline}</p>

                                            <div className="text-3xl font-mono font-black text-white mb-6">
                                                {formatNumber(debt.amount)} <span className="text-sm text-gray-500">{debt.currency}</span>
                                            </div>

                                            {debt.status === 'paid' ? (
                                                <div className="w-full py-3 rounded-xl bg-white/5 text-aura-green text-xs font-bold text-center border border-aura-green/20">
                                                    ✅ {t.finance.repaid}
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => !isArchived && handleRepay(debt)}
                                                        disabled={isArchived}
                                                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${isArchived ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed' : 'bg-aura-green/10 hover:bg-aura-green/20 text-aura-green border-aura-green/10'}`}
                                                    >
                                                        ✅ {t.finance.repay}
                                                    </button>
                                                    <button
                                                        onClick={() => { if (isArchived) return; setExtendModalDebt(debt); setNewDeadline(debt.deadline || ''); }}
                                                        disabled={isArchived}
                                                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${isArchived ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 text-white border-white/5'}`}
                                                    >
                                                        ⏳ {t.finance.extend}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Edit/Delete Actions - Visible */}
                                            {!isArchived && (
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    <button
                                                        onClick={() => { setEditingDebt(debt); setDebtForm({ ...debt, startDate: (debt as any).date }); setIsDebtModalOpen(true); }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/5"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setConfirmModal({
                                                                isOpen: true, title: 'Arxivlash', message: 'Ushbu qarzni arxivlamoqchimisiz? Bu moliyaviy hisobotlarga ta\'sir qilishi mumkin.', onConfirm: async () => {
                                                                    // @ts-ignore
                                                                    await updateDebt(user!.uid, (debt as any).id, { ...debt, status: 'archived' } as any);
                                                                    setDebts(await getDebts(user!.uid));
                                                                    setConfirmModal({ ...confirmModal, isOpen: false });
                                                                    setAlertState({ isOpen: true, title: 'Muvaffaqiyatli', message: 'Ma\'lumot arxivlandi.', type: 'success' });
                                                                    // Update overview
                                                                    const overview = await getFinanceOverview(user!.uid);
                                                                    if (overview) setFinanceData(overview);
                                                                }
                                                            });
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/10"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {debts.length === 0 && (
                                        <div className="col-span-full py-20 text-center opacity-30">
                                            <p className="text-4xl mb-4">🤝</p>
                                            <p className="font-bold uppercase tracking-widest">{t.finance.debtsEmpty}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. CREDITS VIEW */}
                        {portfolioTab === 'credits' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-end">
                                    {/* Action handled by top dynamic button */}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {credits.filter(c => (c as any).status !== 'archived').map((credit: any) => {
                                        const nextPayment = new Date(credit.nextPaymentDate);
                                        const today = new Date();
                                        const start = credit.startDate ? new Date(credit.startDate) : new Date(0);
                                        const isStarted = today >= start;
                                        const isDue = isStarted && (today >= nextPayment || today.getDate() >= credit.paymentDay);

                                        return (
                                            <div key={credit.id} className={`p-6 rounded-2xl bg-black/40 border relative group ${isDue ? 'border-aura-red' : isStarted ? 'border-white/5' : 'border-white/5 opacity-50'}`}>
                                                <div className="absolute top-4 left-4 text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-gray-400">
                                                    {credit.paymentDay}-{t.finance.dayLabel}
                                                </div>
                                                <div className="mt-8"></div> {/* Spacer */}
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="text-lg font-bold text-white mb-1">{credit.title}</h3>
                                                    {credit.historical?.isHistorical && (
                                                        <span className="text-[8px] bg-white/5 text-aura-gold px-2 py-0.5 rounded border border-aura-gold/20 uppercase font-black">
                                                            {credit.historical?.monthsPassed} {t.finance.months} {t.finance.left.split(' ')[0]}
                                                        </span>
                                                    )}
                                                </div>

                                                {credit.historical?.isHistorical && (
                                                    <div className="flex justify-between items-center text-[9px] text-gray-500 mb-1">
                                                        <span>{t.finance.initialAmount}: {formatNumber(credit.historical?.initialAmount || 0)}</span>
                                                        <span>{Math.round(((credit.totalAmount - credit.remainingAmount) / credit.totalAmount) * 100)}%</span>
                                                    </div>
                                                )}

                                                <div className="w-full bg-white/5 h-1 rounded-full mt-2 mb-4 overflow-hidden">
                                                    <div style={{ width: `${Math.min(100, ((credit.totalAmount - credit.remainingAmount) / credit.totalAmount) * 100)}%` }} className="h-full bg-aura-red shadow-[0_0_10px_rgba(255,50,50,0.3)]"></div>
                                                </div>

                                                <div className="flex justify-between items-end mb-6">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase">{t.finance.remaining}</p>
                                                        <p className="text-2xl font-mono font-black text-white">{formatNumber(credit.remainingAmount)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-gray-500 uppercase">{t.finance.monthlyPayment}</p>
                                                        <p className="text-xl font-mono font-bold text-aura-red">{formatNumber(credit.monthlyPayment)}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => !isArchived && handlePayCredit(credit)}
                                                    disabled={isArchived}
                                                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all border ${isArchived ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : (isDue ? 'bg-aura-red text-white border-aura-red' : 'bg-white/5 hover:bg-white/10 text-white border-white/5')}`}
                                                >
                                                    {isDue ? `${t.finance.payNow} ⚠️` : t.finance.prepay}
                                                </button>

                                                {/* Edit/Delete Actions - Visible */}
                                                {!isArchived && (
                                                    <div className="absolute top-4 right-4 flex gap-2">
                                                        <button
                                                            onClick={() => { setEditingCredit(credit); setCreditForm(credit); setIsCreditModalOpen(true); }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/5"
                                                        >
                                                            ✎
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setConfirmModal({
                                                                    isOpen: true, title: 'Arxivlash', message: 'Ushbu kreditni arxivlamoqchimisiz? Bu moliyaviy hisobotlarga ta\'sir qilishi mumkin.', onConfirm: async () => {
                                                                        // @ts-ignore
                                                                        await updateCredit(user!.uid, (credit as any).id, { ...credit, status: 'archived' } as any);
                                                                        setCredits(await getCredits(user!.uid));
                                                                        setConfirmModal({ ...confirmModal, isOpen: false });
                                                                        setAlertState({ isOpen: true, title: 'Muvaffaqiyatli', message: 'Kredit arxivlandi.', type: 'success' });
                                                                        const overview = await getFinanceOverview(user!.uid);
                                                                        if (overview) setFinanceData(overview);
                                                                    }
                                                                });
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/10"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {credits.length === 0 && (
                                        <div className="col-span-full py-20 text-center opacity-30">
                                            <p className="text-4xl mb-4">💳</p>
                                            <p className="font-bold uppercase tracking-widest">{t.finance.creditsEmpty}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. DEPOSITS VIEW */}
                        {portfolioTab === 'deposits' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-end">
                                    {/* Action handled by top dynamic button */}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {deposits.filter(d => (d as any).status !== 'archived').map((deposit: any) => {
                                        const today = new Date();
                                        const start = deposit.startDate ? new Date(deposit.startDate) : new Date(0);
                                        const isStarted = today >= start;
                                        const isDue = isStarted && (today.getDate() >= deposit.contributionDay);

                                        return (
                                            <div key={deposit.id} className={`p-6 rounded-2xl bg-black/40 border border-white/5 relative group ${!isStarted ? 'opacity-50' : ''}`}>
                                                <div className="absolute top-4 left-4 text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-gray-400">
                                                    {deposit.contributionDay}-{t.finance.dayLabel}
                                                </div>
                                                <div className="mt-8"></div> {/* Spacer */}
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="text-lg font-bold text-white">{deposit.title}</h3>
                                                    {deposit.historical && deposit.historical.monthsPassed > 0 && (
                                                        <span className="text-[8px] bg-white/5 text-aura-green px-2 py-0.5 rounded border border-aura-green/20 uppercase font-black">
                                                            {deposit.historical.monthsPassed} {t.finance.months}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-aura-green mb-4">{t.finance.collecting} ↗</p>

                                                <div className="flex justify-between items-end mb-6">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase">{t.finance.totalCollected}</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <p className="text-2xl font-mono font-black text-white">{formatNumber(deposit.currentAmount)}</p>
                                                            {deposit.historical && deposit.historical.accruedInterest > 0 && (
                                                                <span className="text-[10px] text-aura-green font-bold">
                                                                    (+{formatNumber(deposit.historical.accruedInterest)})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-gray-500 uppercase">{t.finance.monthlyPlan}</p>
                                                        <p className="text-xl font-mono font-bold text-aura-green">{formatNumber(deposit.monthlyContribution)}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => !isArchived && handleAddToDeposit(deposit)}
                                                    disabled={isArchived}
                                                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all border ${isArchived ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : (isDue ? 'bg-aura-green text-black border-aura-green' : 'bg-white/5 hover:bg-white/10 text-white border-white/5')}`}
                                                >
                                                    {isDue ? `${t.finance.paymentSuccess} (ESLATMA) 🔔` : t.finance.topUp}
                                                </button>

                                                {/* Edit/Delete Actions - Visible */}
                                                {!isArchived && (
                                                    <div className="absolute top-4 right-4 flex gap-2">
                                                        <button
                                                            onClick={() => { setEditingDeposit(deposit); setDepositForm({ ...deposit, isMonthlyInterest: deposit.isMonthlyInterest ?? true, isFromBalance: true }); setIsDepositModalOpen(true); }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/5"
                                                        >
                                                            ✎
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setConfirmModal({
                                                                    isOpen: true, title: 'Arxivlash', message: 'Ushbu omonatni arxivlamoqchimisiz? Bu moliyaviy hisobotlarga ta\'sir qilishi mumkin.', onConfirm: async () => {
                                                                        const updatedDeposit = { ...deposit, status: 'archived' };
                                                                        // @ts-ignore
                                                                        await updateDeposit(user!.uid, deposit.id!, updatedDeposit as any);
                                                                        setDeposits(await getDeposits(user!.uid));
                                                                        setConfirmModal({ ...confirmModal, isOpen: false });
                                                                        setAlertState({ isOpen: true, title: 'Muvaffaqiyatli', message: 'Omonat arxivlandi.', type: 'success' });
                                                                        const overview = await getFinanceOverview(user!.uid);
                                                                        if (overview) setFinanceData(overview);
                                                                    }
                                                                });
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/10"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {deposits.length === 0 && (
                                        <div className="col-span-full py-20 text-center opacity-30">
                                            <p className="text-4xl mb-4">💰</p>
                                            <p className="font-bold uppercase tracking-widest">{t.finance.depositsEmpty}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                    </div>
                ) : (
                    /* ADVANCED STATISTICS VIEW */
                    <div className="space-y-8 animate-fade-in">



                        <div className="flex flex-col items-center gap-4 bg-white/5 p-4 rounded-xl w-fit mx-auto">
                            <div className="flex bg-black/40 p-1 rounded-xl">
                                {['weekly', 'monthly', 'custom'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setStatsPeriod(m as any)}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${statsPeriod === m ? 'bg-aura-gold text-black shadow-lg shadow-aura-gold/20' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {m === 'weekly' ? t.finance.weeklyLabel : m === 'monthly' ? t.finance.monthlyLabel : t.finance.customLabel}
                                    </button>
                                ))}
                            </div>

                            {statsPeriod === 'custom' && (
                                <div className="flex items-center gap-4 animate-fade-in">
                                    <div>
                                        <label className="text-[10px] uppercase text-gray-500 block mb-1">{t.finance.fromLabel}</label>
                                        <input
                                            type="date"
                                            value={customRange.start}
                                            onChange={e => setCustomRange({ ...customRange, start: e.target.value })}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-aura-gold outline-none"
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                    <span className="text-gray-500">-</span>
                                    <div>
                                        <label className="text-[10px] uppercase text-gray-500 block mb-1">{t.finance.toLabel}</label>
                                        <input
                                            type="date"
                                            value={customRange.end}
                                            onChange={e => setCustomRange({ ...customRange, end: e.target.value })}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-aura-gold outline-none"
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* NEW: Unified Bar Chart & Details for All Periods */}
                        {statsData?.transactions && (
                            <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5">
                                <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-8">
                                    {statsPeriod === 'weekly' ? t.finance.weeklyLabel : statsPeriod === 'monthly' ? t.finance.monthlyLabel : t.finance.customLabel} {t.finance.analysisSummary}
                                </h3>
                                <div className="h-40 flex items-end gap-2 mb-8 border-b border-white/5 pb-4 overflow-x-auto">
                                    {(() => {
                                        let chartData: { date: string, label: string, income: number, expense: number }[] = [];

                                        if (statsPeriod === 'weekly') {
                                            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                            chartData = Array(7).fill(0).map((_, i) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() - (6 - i));
                                                return { date: d.toISOString().split('T')[0], label: days[d.getDay()], income: 0, expense: 0 };
                                            });
                                        } else if (statsPeriod === 'monthly') {
                                            const today = new Date();
                                            const currentMonth = today.getMonth();
                                            const currentYear = today.getFullYear();
                                            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                                            chartData = Array.from({ length: daysInMonth }, (_, i) => {
                                                const day = i + 1;
                                                const d = new Date(currentYear, currentMonth, day);
                                                // Handle local date string correctly
                                                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                return { date: dateStr, label: String(day), income: 0, expense: 0 };
                                            });
                                        } else if (statsPeriod === 'custom' && customRange.start && customRange.end) {
                                            const start = new Date(customRange.start);
                                            const end = new Date(customRange.end);
                                            const diffTime = Math.abs(end.getTime() - start.getTime());
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                            chartData = Array.from({ length: diffDays + 1 }, (_, i) => {
                                                const d = new Date(start);
                                                d.setDate(d.getDate() + i);
                                                const dateStr = d.toISOString().split('T')[0];
                                                return { date: dateStr, label: dateStr.slice(5), income: 0, expense: 0 };
                                            });
                                        }

                                        statsData.transactions.forEach((t: Transaction) => {
                                            const dEntry = chartData.find(d => d.date === t.date.split('T')[0]);
                                            if (dEntry) {
                                                if (t.type === 'income') dEntry.income += t.amount;
                                                else dEntry.expense += t.amount;
                                            }
                                        });

                                        const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense, 1)));

                                        return chartData.map(d => (
                                            <div key={d.date} className="flex-1 min-w-[20px] flex flex-col justify-end gap-1 h-full group relative">
                                                <div className="flex gap-1 h-full items-end justify-center">
                                                    <div style={{ height: `${(d.income / maxVal) * 80}%` }} className="w-2 md:w-3 bg-aura-green/50 rounded-t-sm transition-all group-hover:bg-aura-green"></div>
                                                    <div style={{ height: `${(d.expense / maxVal) * 80}%` }} className="w-2 md:w-3 bg-aura-red/50 rounded-t-sm transition-all group-hover:bg-aura-red"></div>
                                                </div>
                                                <span className="text-[9px] text-center text-white/50 uppercase font-black truncate">{d.label}</span>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black border border-white/20 p-2 rounded-lg text-[10px] hidden group-hover:block w-max z-20 shadow-2xl">
                                                    <p className="text-white/70 mb-1 font-bold">{d.date}</p>
                                                    <p className="text-aura-green">+{formatNumber(d.income)}</p>
                                                    <p className="text-aura-red">-{formatNumber(d.expense)}</p>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* V18: Enhanced Category Analysis */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pb-8 border-b border-white/5">
                                    <div>
                                        <h4 className="text-[10px] font-black text-aura-green uppercase tracking-[0.2em] mb-4">{t.finance.incomeTitle} {t.finance.byCategory}</h4>
                                        <div className="space-y-4">
                                            {Object.entries(statsData.income || {}).sort(([, a]: any, [, b]: any) => b - a).map(([cat, amount]: any) => {
                                                const percentage = Math.round((amount / (statsData.totalIncome || 1)) * 100);
                                                return (
                                                    <div key={cat} className="group cursor-help">
                                                        <div className="flex justify-between items-end mb-1">
                                                            <span className="text-xs font-bold text-white group-hover:text-aura-green transition-colors">{cat}</span>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-sm font-black text-white">{formatNumber(convert(amount, 'UZS', statsDisplayCurrency))}</span>
                                                                <span className="text-[8px] text-gray-500">{statsDisplayCurrency}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-aura-green transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                        <div className="text-[8px] text-right mt-1 text-gray-500 font-black">{percentage}%</div>
                                                    </div>
                                                );
                                            })}
                                            {(!statsData.income || Object.keys(statsData.income).length === 0) && <p className="text-[10px] text-gray-600 uppercase italic">No income data</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-aura-red uppercase tracking-[0.2em] mb-4">{t.finance.expenseTitle} {t.finance.byCategory}</h4>
                                        <div className="space-y-4">
                                            {Object.entries(statsData.expense || {}).sort(([, a]: any, [, b]: any) => b - a).map(([cat, amount]: any) => {
                                                const percentage = Math.round((amount / (statsData.totalExpense || 1)) * 100);
                                                return (
                                                    <div key={cat} className="group cursor-help">
                                                        <div className="flex justify-between items-end mb-1">
                                                            <span className="text-xs font-bold text-white group-hover:text-aura-red transition-colors">{cat}</span>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-sm font-black text-white">{formatNumber(convert(amount, 'UZS', statsDisplayCurrency))}</span>
                                                                <span className="text-[8px] text-gray-500">{statsDisplayCurrency}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-aura-red transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                        <div className="text-[8px] text-right mt-1 text-gray-500 font-black">{percentage}%</div>
                                                    </div>
                                                );
                                            })}
                                            {(!statsData.expense || Object.keys(statsData.expense).length === 0) && <p className="text-[10px] text-gray-600 uppercase italic">No expense data</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Transaction List */}
                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">{t.finance.detailedList}</h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {(statsData.transactions as Transaction[]).sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="text-xl">{t.icon}</div>
                                                <div>
                                                    <p className="text-xs font-bold text-white">{t.title}</p>
                                                    <p className="text-[10px] text-gray-500">{t.date} • {t.category}</p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-mono font-bold ${t.type === 'income' ? 'text-aura-green' : 'text-white'}`}>
                                                {t.type === 'income' ? '+' : '-'}{formatNumber(t.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* TRANSACTION HISTORY (Left Column) */}
                            <div className="p-8 rounded-[2.5rem] bg-black border border-white/10 flex flex-col h-[600px]">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">{t.finance.recentActivity}</h3>
                                    <button onClick={() => setIsAllTransactionsOpen(true)} className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1 rounded-full">{t.finance.viewAll}</button>
                                </div>

                                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                    {statsData?.transactions && statsData.transactions.length > 0 ? (
                                        statsData.transactions.slice(0, 15).map((t: Transaction, idx: number) => (
                                            <div key={t.id || idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:bg-white/10 transition-colors">
                                                        {t.icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white/90">{t.title}</p>
                                                        <p className="text-[9px] text-white/50 uppercase font-black tracking-widest">{t.category} • {t.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-mono font-black ${t.type === 'income' ? 'text-aura-green' : 'text-white'}`}>
                                                        {t.type === 'income' ? '+' : '-'}{formatNumber(convert(t.amount, 'UZS', statsDisplayCurrency))}
                                                    </p>
                                                    <span className="text-[8px] text-white/50 font-bold uppercase">{statsDisplayCurrency}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-20">
                                            <div className="w-20 h-1 bg-gradient-to-r from-transparent via-white to-transparent mb-4"></div>
                                            <p className="text-xs font-mono w-full text-center uppercase tracking-[0.3em]">{t.finance.noTransactions}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Income & Expense Stack */}
                            <div className="flex flex-col gap-8 h-[600px]">
                                {/* Income Stats Section */}
                                <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-xl font-display font-black text-aura-green uppercase tracking-tighter">
                                            {statsPeriod === 'weekly' ? t.finance.weeklyLabel : statsPeriod === 'monthly' ? t.finance.monthlyLabel : t.finance.customLabel} {t.finance.incomeTitle}
                                        </h3>
                                        <select
                                            value={statsDisplayCurrency}
                                            onChange={(e) => setStatsDisplayCurrency(e.target.value as any)}
                                            className="bg-black border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white font-bold uppercase outline-none"
                                        >
                                            {['UZS', 'USD', 'EUR', 'RUB'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        {statsData?.income && Object.entries(statsData.income).map(([cat, amount]: any) => {
                                            const rate = exchangeRates.find(r => r.code === statsDisplayCurrency)?.rate || 1;
                                            let displayAmount = amount;
                                            if (statsDisplayCurrency !== 'UZS') {
                                                displayAmount = amount / rate;
                                            }
                                            let totalIncomeConverted = statsData.totalIncome;
                                            if (statsDisplayCurrency !== 'UZS') totalIncomeConverted = statsData.totalIncome / rate;

                                            return (
                                                <div key={cat} className="space-y-1">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{cat}</span>
                                                        <span className="text-sm font-black text-white">{statsDisplayCurrency} {formatNumber(Math.round(displayAmount))}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-aura-green"
                                                            style={{ width: `${Math.min(100, (displayAmount / (totalIncomeConverted || 1)) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!statsData?.income || Object.keys(statsData.income).length === 0) && (
                                            <div className="py-10 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.3em]">{t.finance.noData}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Expense Stats Section */}
                                <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-xl font-display font-black text-aura-red uppercase tracking-tighter">
                                            {statsPeriod === 'weekly' ? t.finance.weeklyLabel : statsPeriod === 'monthly' ? t.finance.monthlyLabel : t.finance.customLabel} {t.finance.expenseTitle}
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        {statsData?.expense && Object.entries(statsData.expense).map(([cat, amount]: any) => {
                                            const rate = exchangeRates.find(r => r.code === statsDisplayCurrency)?.rate || 1;
                                            let displayAmount = amount;
                                            if (statsDisplayCurrency !== 'UZS') {
                                                displayAmount = amount / rate;
                                            }
                                            let totalExpenseConverted = statsData.totalExpense;
                                            if (statsDisplayCurrency !== 'UZS') totalExpenseConverted = statsData.totalExpense / rate;

                                            return (
                                                <div key={cat} className="space-y-1">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{cat}</span>
                                                        <span className="text-sm font-black text-white">{statsDisplayCurrency} {formatNumber(Math.round(displayAmount))}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-aura-red"
                                                            style={{ width: `${Math.min(100, (displayAmount / (totalExpenseConverted || 1)) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!statsData?.expense || Object.keys(statsData.expense).length === 0) && (
                                            <div className="py-10 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.3em]">{t.finance.noData}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 to-black border border-white/5 text-center">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">{t.finance.aiPredictionTitle}</p>
                            <h4 className="text-2xl font-display font-black text-white mb-4">
                                {(() => {
                                    // Dynamic Projection Logic
                                    const now = new Date();
                                    let daysRemaining = 0;
                                    let passedDays = 1;

                                    if (statsPeriod === 'weekly') {
                                        const dayOfWeek = now.getDay(); // 0-6
                                        passedDays = dayOfWeek + 1; // 1-7
                                        daysRemaining = 7 - passedDays;
                                    } else if (statsPeriod === 'monthly') {
                                        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                                        passedDays = now.getDate(); // 1-31
                                        daysRemaining = daysInMonth - passedDays;
                                    }

                                    // Use Stats Data for Projection
                                    const netIncome = (statsData?.totalIncome || 0) - (statsData?.totalExpense || 0);
                                    const dailyAvg = netIncome / (passedDays || 1);
                                    const projectedFinal = netIncome + (dailyAvg * daysRemaining);

                                    return (
                                        <>
                                            {t.finance.predictionPart1} <span className={projectedFinal >= 0 ? 'text-aura-green' : 'text-aura-red'}>
                                                {projectedFinal >= 0 ? '+' : ''}{formatNumber(projectedFinal)} {statsDisplayCurrency}
                                            </span> {t.finance.predictionPart2}
                                        </>
                                    );
                                })()}
                            </h4>
                            <p className="text-gray-500 text-xs max-w-2xl mx-auto leading-relaxed">
                                {(() => {
                                    const inc = financeData.monthlyIncome || 0;
                                    const exp = financeData.monthlySpent || 0;
                                    const savingsRate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;

                                    let message = "";
                                    if (savingsRate > 50) message = t.finance.predictionMsgExcellent;
                                    else if (savingsRate > 20) message = t.finance.predictionMsgGood;
                                    else if (savingsRate > 0) message = t.finance.predictionMsgOk;
                                    else message = t.finance.predictionMsgBad;

                                    return message;
                                })()}
                            </p>
                        </div>

                        {/* AI Financial Advisor (Enhanced V21) */}
                        <AiInsightSection
                            onAnalyze={refreshInsight}
                            isLoading={aiLoading}
                            insight={aiInsight}
                            title="AI Moliyaviy Maslahatchi"
                            description="Moliyaviy holatingizni sun'iy intellekt yordamida chuqur tahlil qiling. Bu jarayon bir necha soniya vaqt olishi mumkin."
                            buttonText="Tahlilni Boshlash"
                            color="gold"
                        />
                    </div>
                )
                }












            </div >

            {/* MODALS RENDERING OUTSIDE ANIMATED WRAPPER */}
            {/* 1. ADD TRANSACTION MODAL */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t.finance.addTransaction}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setNewTx({ ...newTx, type: 'income' })}
                            className={`py-3 rounded-xl font-bold transition-all ${newTx.type === 'income' ? 'bg-aura-green text-black shadow-lg shadow-aura-green/20' : 'bg-white/5 text-gray-500'}`}
                        >
                            {t.finance.incomeTitle}
                        </button>
                        <button
                            onClick={() => setNewTx({ ...newTx, type: 'expense' })}
                            className={`py-3 rounded-xl font-bold transition-all ${newTx.type === 'expense' ? 'bg-aura-red text-white shadow-lg shadow-aura-red/20' : 'bg-white/5 text-gray-500'}`}
                        >
                            {t.finance.expenseTitle}
                        </button>
                    </div>

                    {/* Currency Selector V17 */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        {['UZS', 'USD', 'EUR', 'RUB'].map(c => (
                            <button
                                key={c}
                                onClick={() => setNewTx({ ...newTx, currency: c as any })}
                                className={`py-2 rounded-lg text-xs font-bold transition-all ${newTx.currency === c ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.transTitle}</label>
                            <input
                                value={newTx.title}
                                onChange={e => setNewTx({ ...newTx, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-gold"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.amount}</label>
                                <MoneyInput
                                    value={newTx.amount}
                                    onChange={(val) => setNewTx({ ...newTx, amount: val })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-gold"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.currency}</label>
                                <select
                                    value={newTx.currency || 'UZS'}
                                    onChange={e => setNewTx({ ...newTx, currency: e.target.value as any })}
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                >
                                    {['UZS', 'USD', 'EUR', 'RUB'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.transCategory}</label>
                            <select
                                value={newTx.category}
                                onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            >
                                {(newTx.type === 'income' ? incomeCategories : expenseCategories).map(c => (
                                    <option key={c.name} value={c.name}>
                                        {t.categories[c.key] || c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => handleAddTransaction()}
                        className="w-full py-4 rounded-xl bg-aura-gold text-black font-black uppercase tracking-widest hover:bg-white transition-all mt-4"
                    >
                        {t.common.save}
                    </button>
                </div>
            </Modal>

            {/* 2. HISTORY MODAL */}
            <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={t.finance.archivedDays}>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((day) => (
                        <div key={day} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10 opacity-70 hover:opacity-100">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🔒</span>
                                <div>
                                    <p className="font-bold text-white">Jan {12 - day}, 2026</p>
                                    <p className="text-xs text-gray-500">{t.finance.dayClosed}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-aura-red font-bold">-${(Math.random() * 100).toFixed(2)}</p>
                                <p className="text-xs text-gray-500">{t.finance.spent}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </HistoryModal>

            {/* 3. DEBT MODAL (Fixed) */}
            <Modal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} title={t.finance.addDebt}>
                <div className="space-y-4">
                    <div className="flex bg-black/40 p-1 rounded-xl">
                        <button
                            onClick={() => setDebtForm({ ...debtForm, type: 'i_owe' })}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase transition-all ${debtForm.type === 'i_owe' ? 'bg-aura-red text-white shadow-lg shadow-aura-red/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            📥 {t.finance.iOwe}
                        </button>
                        <button
                            onClick={() => setDebtForm({ ...debtForm, type: 'owed_to_me' })}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase transition-all ${debtForm.type === 'owed_to_me' ? 'bg-aura-green text-black shadow-lg shadow-aura-green/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            📤 {t.finance.owedToMe}
                        </button>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.personName}</label>
                        <input
                            value={debtForm.person}
                            onChange={e => setDebtForm({ ...debtForm, person: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            placeholder={t.finance.fullNamePlaceholder}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.amount}</label>
                            <MoneyInput
                                value={debtForm.amount}
                                onChange={(val) => setDebtForm({ ...debtForm, amount: val })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.currency}</label>
                            <select
                                value={debtForm.currency}
                                onChange={e => setDebtForm({ ...debtForm, currency: e.target.value as any })}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none appearance-none"
                            >
                                {['UZS', 'USD', 'EUR', 'RUB'].map(c => (
                                    <option key={c} value={c} className="bg-black text-white">{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.dateTaken}</label>
                            <input
                                type="date"
                                value={debtForm.startDate}
                                onChange={e => setDebtForm({ ...debtForm, startDate: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.returnDate}</label>
                            <input
                                type="date"
                                value={debtForm.deadline}
                                onChange={e => setDebtForm({ ...debtForm, deadline: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAddDebt}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-all mt-4 ${debtForm.type === 'i_owe' ? 'bg-aura-red text-white' : 'bg-aura-green text-black'}`}
                    >
                        {t.common.save}
                    </button>
                </div>
            </Modal>

            {/* 4. GOAL MODAL */}
            <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={t.finance.editGoalTitle}>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.target} {t.finance.amount}</label>
                        <div className="flex gap-2">
                            <select
                                value={goalForm.currency}
                                onChange={(e) => {
                                    const newCurrency = e.target.value;
                                    const oldCurrency = goalForm.currency;
                                    let newTarget = goalForm.target;

                                    if (newCurrency !== oldCurrency) {
                                        const oldRate = exchangeRates.find(r => r.code === oldCurrency)?.rate || 1;
                                        const newRate = exchangeRates.find(r => r.code === newCurrency)?.rate || 1;
                                        let amountInUZS = oldCurrency === 'UZS' ? newTarget : newTarget * oldRate;
                                        newTarget = newCurrency === 'UZS' ? amountInUZS : amountInUZS / newRate;
                                    }

                                    setGoalForm({ ...goalForm, currency: newCurrency, target: Math.round(newTarget) });
                                }}
                                className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aura-gold appearance-none"
                            >
                                {['USD', 'UZS', 'EUR', 'RUB'].map(c => (
                                    <option key={c} value={c} className="bg-zinc-900 text-white">{c}</option>
                                ))}
                            </select>
                            <MoneyInput
                                value={goalForm.target}
                                onChange={(val) => setGoalForm({ ...goalForm, target: val })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aura-gold transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.deadline}</label>
                        <input
                            type="text"
                            value={goalForm.deadline}
                            onChange={e => setGoalForm({ ...goalForm, deadline: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aura-gold transition-colors"
                            placeholder={t.finance.datePlaceholder}
                        />
                    </div>
                    <button
                        onClick={handleGoalUpdate}
                        className="w-full py-4 rounded-xl bg-aura-gold text-black font-bold uppercase text-xs tracking-widest hover:bg-white transition-all mt-4"
                    >
                        {t.common.save}
                    </button>
                </div>
            </Modal>

            {/* 5. BUDGET MODAL */}
            <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title={t.finance.editBudgetTitle}>
                <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-aura-green/5 border border-aura-green/20">
                        <label className="text-[10px] text-aura-green uppercase font-black tracking-widest mb-3 block">{t.finance.targetIncome} (UZS)</label>
                        <MoneyInput
                            value={budgetForm.incomeBudget}
                            onChange={(val) => setBudgetForm({ ...budgetForm, incomeBudget: val })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aura-green transition-colors"
                        />
                        <p className="text-[8px] text-gray-500 mt-2 uppercase">{t.finance.incomeHistoryEmptyDesc}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-aura-red/5 border border-aura-red/20">
                        <label className="text-[10px] text-aura-red uppercase font-black tracking-widest mb-3 block">{t.finance.limitExpense} (UZS)</label>
                        <MoneyInput
                            value={budgetForm.expenseBudget}
                            onChange={(val) => setBudgetForm({ ...budgetForm, expenseBudget: val })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aura-red transition-colors"
                        />
                        <p className="text-[8px] text-gray-500 mt-2 uppercase">{t.finance.expenseHistoryEmptyDesc}</p>
                    </div>

                    <button
                        onClick={handleBudgetUpdate}
                        className="w-full py-4 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-aura-gold hover:text-black transition-all shadow-lg"
                    >
                        {t.common.save}
                    </button>
                </div>
            </Modal>

            {/* 6. CREDIT MODAL */}
            <Modal isOpen={isCreditModalOpen} onClose={() => setIsCreditModalOpen(false)} title={t.finance.addCredit}>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.creditName}</label>
                        <input
                            value={creditForm.title}
                            onChange={e => setCreditForm({ ...creditForm, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            placeholder={t.finance.creditNamePlaceholder}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.totalAmount}</label>
                            <MoneyInput
                                value={creditForm.totalAmount}
                                onChange={(val) => setCreditForm({ ...creditForm, totalAmount: val })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.monthlyPayment}</label>
                            <MoneyInput
                                value={creditForm.monthlyPayment}
                                onChange={(val) => setCreditForm({ ...creditForm, monthlyPayment: val })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.paymentDay}</label>
                        <input
                            type="number"
                            min="1" max="31"
                            value={creditForm.paymentDay}
                            onChange={e => setCreditForm({ ...creditForm, paymentDay: Number(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            placeholder={t.finance.daysInMonth}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-aura-gold uppercase mb-1 block">{t.finance.startDate}</label>
                        <input
                            type="date"
                            value={creditForm.startDate}
                            onChange={e => setCreditForm({ ...creditForm, startDate: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-gold mb-4"
                            style={{ colorScheme: 'dark' }}
                        />
                        <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.currency}</label>
                        <select
                            value={creditForm.currency}
                            onChange={e => setCreditForm({ ...creditForm, currency: e.target.value })}
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                        >
                            {['UZS', 'USD', 'EUR', 'RUB'].map(c => <option key={c} value={c} className="bg-black text-white">{c}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-aura-gold uppercase mb-1 block">{t.finance.interestRate}</label>
                            <input
                                type="number"
                                value={creditForm.interestRate || ''}
                                onChange={e => setCreditForm({ ...creditForm, interestRate: Number(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-gold"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-aura-gold uppercase mb-1 block">{t.finance.termMonths}</label>
                            <input
                                type="number"
                                value={creditForm.termMonths || ''}
                                onChange={e => setCreditForm({ ...creditForm, termMonths: Number(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-gold"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-aura-gold uppercase mb-1 block">{t.finance.calculationMethod}</label>
                        <div className="flex bg-black/40 p-1 rounded-xl">
                            <button
                                onClick={() => setCreditForm({ ...creditForm, calculationMethod: 'annuity' })}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${creditForm.calculationMethod === 'annuity' ? 'bg-aura-green text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                {t.finance.annuity}
                            </button>
                            <button
                                onClick={() => setCreditForm({ ...creditForm, calculationMethod: 'differential' })}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${creditForm.calculationMethod === 'differential' ? 'bg-aura-gold text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                {t.finance.differential}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleAddCredit}
                        className="w-full py-4 rounded-xl bg-aura-red text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all mt-4"
                    >
                        {t.finance.add}
                    </button>
                </div>
            </Modal>

            {/* 7. DEPOSIT MODAL */}
            <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title={t.finance.addDeposit}>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.depositName}</label>
                        <input
                            value={depositForm.title}
                            onChange={e => setDepositForm({ ...depositForm, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            placeholder={t.finance.depositNamePlaceholder}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.currentAmount}</label>
                            <MoneyInput
                                value={depositForm.currentAmount}
                                onChange={(val) => setDepositForm({ ...depositForm, currentAmount: val })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.currency}</label>
                            <select
                                value={depositForm.currency}
                                onChange={e => setDepositForm({ ...depositForm, currency: e.target.value as any })}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            >
                                {['UZS', 'USD', 'EUR', 'RUB'].map(c => <option key={c} value={c} className="bg-black text-white">{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-aura-green uppercase mb-1 block">{t.finance.interestRate}</label>
                            <input
                                type="number"
                                value={depositForm.interestRate || ''}
                                onChange={e => setDepositForm({ ...depositForm, interestRate: Number(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-green"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-aura-green uppercase mb-1 block">{t.finance.termMonths}</label>
                            <input
                                type="number"
                                value={depositForm.termMonths || ''}
                                onChange={e => setDepositForm({ ...depositForm, termMonths: Number(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-green"
                                placeholder="12"
                            />
                        </div>
                    </div>

                    <div
                        onClick={() => setDepositForm({ ...depositForm, isMonthlyInterest: !depositForm.isMonthlyInterest })}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${depositForm.isMonthlyInterest ? 'bg-aura-green/20 border-aura-green' : 'bg-white/5 border-white/10'}`}
                    >
                        <span className="text-xs font-bold text-white uppercase">{t.finance.monthlyProfitChoice}</span>
                        <div className={`w-4 h-4 rounded-full border border-white/20 flex items-center justify-center ${depositForm.isMonthlyInterest ? 'bg-aura-green' : 'bg-transparent'}`}>
                            {depositForm.isMonthlyInterest && <span className="text-black text-[10px]">✓</span>}
                        </div>
                    </div>

                    <p className="text-xs text-center text-gray-400">
                        {t.finance.expectedMonthlyProfit}: <span className="text-aura-green font-bold">
                            {depositForm.interestRate > 0 ? (depositForm.currentAmount * (depositForm.interestRate / 100) / 12).toLocaleString() : 0} {depositForm.currency}
                        </span>
                    </p>

                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.startDate}</label>
                        <input
                            type="date"
                            value={depositForm.startDate}
                            onChange={e => setDepositForm({ ...depositForm, startDate: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>

                    <button
                        onClick={async () => {
                            if (!user || !depositForm.title || depositForm.currentAmount <= 0) {
                                setAlertState({ isOpen: true, title: 'Error', message: t.finance.fillAllFields, type: 'error' });
                                return;
                            }
                            const result = calculateHistoricalDeposit(
                                depositForm.currentAmount,
                                depositForm.interestRate,
                                depositForm.termMonths,
                                depositForm.startDate || getLocalTodayStr(),
                                !depositForm.isMonthlyInterest
                            );
                            const depositData = {
                                title: depositForm.title,
                                currentAmount: result.currentAmount,
                                monthlyContribution: depositForm.monthlyContribution,
                                contributionDay: depositForm.contributionDay,
                                currency: depositForm.currency,
                                startDate: depositForm.startDate || getLocalTodayStr(),
                                interestRate: depositForm.interestRate,
                                termMonths: depositForm.termMonths,
                                isMonthlyInterest: depositForm.isMonthlyInterest,
                                payoutHistory: [],
                                historical: {
                                    initialAmount: result.initialAmount,
                                    accruedInterest: result.accruedInterest,
                                    monthsPassed: result.monthsPassed
                                }
                            };
                            if (editingDeposit) {
                                await updateDeposit(user.uid, editingDeposit.id!, depositData);
                                setAlertState({ isOpen: true, title: 'Success', message: 'Omonat yangilandi!', type: 'success' });
                            } else {
                                await addDeposit(user.uid, depositData);
                                const isHistorical = result.monthsPassed > 0;
                                if (!isHistorical) {
                                    if (!depositForm.isFromBalance) {
                                        await handleAddTransaction({ title: `Omonat Kirimi: ${depositForm.title}`, amount: depositForm.currentAmount, type: 'income', category: t.categories.depositIn, date: depositForm.startDate || getLocalTodayStr(), icon: '💰', currency: depositForm.currency } as any);
                                    } else {
                                        await handleAddTransaction({ title: `Omonatga o'tkazma: ${depositForm.title}`, amount: depositForm.currentAmount, type: 'expense', category: t.categories.savings, date: depositForm.startDate || getLocalTodayStr(), icon: '📥', currency: depositForm.currency, isTransfer: true } as any);
                                    }
                                }
                                setAlertState({ isOpen: true, title: 'Success', message: 'Omonat muvaffaqiyatli qo\'shildi!', type: 'success' });
                            }
                            setDeposits(await getDeposits(user.uid));
                            setIsDepositModalOpen(false);
                            setEditingDeposit(null);
                            const overview = await getFinanceOverview(user.uid);
                            if (overview) setFinanceData(overview);
                            setDepositForm({ title: '', monthlyContribution: 0, contributionDay: 1, currency: 'UZS', startDate: '', currentAmount: 0, interestRate: 0, termMonths: 12, isMonthlyInterest: true, isFromBalance: true });
                        }}
                        className="w-full py-4 rounded-xl bg-aura-gold text-black font-black uppercase tracking-widest hover:bg-white transition-all mt-4"
                    >
                        {t.common.save}
                    </button>
                </div>
            </Modal>

            {/* 8. REPAYMENT MODAL */}
            <Modal isOpen={isRepaymentModalOpen} onClose={() => setIsRepaymentModalOpen(false)} title={t.finance.creditPayment}>
                <div className="space-y-4">
                    <p className="text-white text-center text-sm opacity-60 mb-4">{t.finance.repaymentSplit}</p>
                    <div>
                        <label className="text-xs text-aura-green uppercase mb-1 block">{t.finance.principalAmount} ({t.finance.remaining}: {payingCredit ? formatNumber(payingCredit.remainingAmount) : 0})</label>
                        <MoneyInput value={repaymentForm.principal} onChange={(val) => setRepaymentForm({ ...repaymentForm, principal: val })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-green" />
                    </div>
                    <div>
                        <label className="text-xs text-aura-red uppercase mb-1 block">{t.finance.interestAmount} ({t.finance.expenseTitle})</label>
                        <MoneyInput value={repaymentForm.interest} onChange={(val) => setRepaymentForm({ ...repaymentForm, interest: val })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-red" />
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 mt-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{t.finance.totalAmount}</span></div>
                        <div className="text-xl font-bold text-white">{formatNumber(repaymentForm.principal + repaymentForm.interest)} {payingCredit?.currency}</div>
                    </div>
                    <button onClick={submitCreditRepayment} className="w-full py-4 rounded-xl bg-aura-gold text-black font-black uppercase tracking-widest hover:bg-white transition-all mt-4">{t.finance.confirmPayment}</button>
                </div>
            </Modal>

            {/* 9. DEPOSIT ACTION MODAL */}
            <Modal isOpen={isDepositActionModalOpen} onClose={() => setIsDepositActionModalOpen(false)} title={t.finance.depositActionTitle}>
                <div className="space-y-4">
                    <div className="flex bg-black/40 p-1 rounded-xl mb-4">
                        <button onClick={() => { setDepositAction('add'); setIsDepositTransferFromBalance(true); }} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${depositAction === 'add' ? 'bg-aura-green text-black' : 'text-gray-500 hover:text-white'}`}>{t.finance.actionAdd}</button>
                        <button onClick={() => setDepositAction('withdraw')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${depositAction === 'withdraw' ? 'bg-aura-red text-white' : 'text-gray-500 hover:text-white'}`}>{t.finance.actionWithdraw}</button>
                        <button onClick={() => setDepositAction('profit')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${depositAction === 'profit' ? 'bg-aura-gold text-black' : 'text-gray-500 hover:text-white'}`}>{t.finance.actionProfit}</button>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">{t.finance.amount}</label>
                        <MoneyInput value={depositAmount} onChange={(val) => setDepositAmount(val)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-gold" />
                    </div>
                    <button onClick={submitDepositAction} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-all mt-4 ${depositAction === 'add' ? 'bg-aura-green text-black' : depositAction === 'withdraw' ? 'bg-aura-red text-white' : 'bg-aura-gold text-black'}`}>{t.common.save}</button>
                </div>
            </Modal>

            {/* 10. ALERT MODAL */}
            <Modal isOpen={alertState.isOpen} onClose={() => setAlertState({ ...alertState, isOpen: false })} title={alertState.title}>
                <div className="p-6 text-center">
                    <div className="text-4xl mb-4">{alertState.type === 'success' ? '✅' : alertState.type === 'warning' ? '⚠️' : '❌'}</div>
                    <p className="text-white text-lg font-bold mb-2">{alertState.message}</p>
                    <button onClick={() => setAlertState({ ...alertState, isOpen: false })} className={`mt-6 w-full py-3 rounded-xl font-bold uppercase tracking-widest text-black transition-all ${alertState.type === 'success' ? 'bg-aura-green' : alertState.type === 'warning' ? 'bg-aura-gold' : 'bg-aura-red'}`}>OK</button>
                </div>
            </Modal>

            {/* 11. QR SCANNER MODAL */}
            <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title={t.finance.qrScannerTitle}>
                <div className="p-10 text-center flex flex-col items-center gap-6">
                    <div className={`w-40 h-40 rounded-3xl border-2 border-dashed flex items-center justify-center text-4xl transition-all ${qrLoading ? 'border-aura-gold animate-pulse' : 'border-white/20'}`}>{qrLoading ? '🔍' : '📷'}</div>
                    <p className="text-gray-400 text-sm max-w-xs">{t.finance.qrScannerDesc}</p>
                    <button onClick={handleQRScan} disabled={qrLoading} className="w-full py-4 rounded-2xl bg-aura-gold text-black font-black uppercase text-xs tracking-widest disabled:opacity-50">{qrLoading ? t.finance.analyzing : t.finance.qrScannerAction}</button>
                </div>
            </Modal>

            {/* 12. DUE ITEMS MODAL */}
            <Modal isOpen={isDueModalOpen} onClose={() => setIsDueModalOpen(false)} title={`${t.finance.todayPayments} 🔔`}>
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">{t.finance.confirmPaymentsInstruction}</p>
                    {dueItems.map((due, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                            <div>
                                <p className="font-bold text-white text-lg">{due.item.title}</p>
                                <p className="text-xs text-aura-gold uppercase tracking-wider">{due.type === 'credit' ? t.finance.creditPayment : t.finance.depositProfit}</p>
                            </div>
                            <button onClick={() => handleConfirmDueItem(due)} className="bg-aura-green text-black px-6 py-2 rounded-lg font-bold hover:scale-105 transition-transform">{t.finance.confirmPayment}</button>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* 13. ALL TRANSACTIONS HISTORY MODAL */}
            <Modal isOpen={isAllTransactionsOpen} onClose={() => setIsAllTransactionsOpen(false)} title={t.finance.recentActivity}>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-400">{t.common.history}</p>
                        <div className="text-xs text-aura-gold">{transactions.length} record(s)</div>
                    </div>

                    {transactions.length > 0 ? transactions.map((t) => (
                        <div key={t.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center text-xl">
                                {t.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-sm">{t.title}</h4>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{new Date(t.date).toLocaleDateString()} • {t.category}</p>
                            </div>
                            <div className={`text-lg font-mono font-black ${t.type === 'income' ? 'text-aura-green' : 'text-white'}`}>
                                {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center opacity-20">
                            <p className="text-4xl mb-4">📜</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">{t.finance.noTransactions}</p>
                        </div>
                    )}
                </div>
            </Modal>
            {/* 14. CONFIRMATION WARNING MODAL */}
            <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} title={confirmModal.title}>
                <div className="p-6 text-center space-y-4">
                    <div className="text-4xl">⚠️</div>
                    <p className="text-white font-bold">{confirmModal.message}</p>
                    <p className="text-xs text-gray-400">Bu amalni ortga qaytarib bo'lmasligi mumkin.</p>
                    <div className="flex gap-4 mt-6">
                        <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition-all">Bekor qilish</button>
                        <button onClick={confirmModal.onConfirm} className="flex-1 py-3 rounded-xl bg-aura-red text-white font-bold hover:bg-red-600 transition-all">Tasdiqlash</button>
                    </div>
                </div>
            </Modal>

            {/* 15. EXTEND DEBT MODAL (Restored) */}
            <Modal isOpen={!!extendModalDebt} onClose={() => setExtendModalDebt(null)} title={t.finance.extend}>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-aura-gold uppercase mb-1 block">{t.finance.deadline}</label>
                        <input
                            type="date"
                            value={newDeadline}
                            onChange={e => setNewDeadline(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aura-gold"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                    <button
                        onClick={async () => {
                            if (!extendModalDebt || !newDeadline) return;
                            await updateDebt(user!.uid, extendModalDebt.id, { ...extendModalDebt, deadline: newDeadline });
                            setDebts(await getDebts(user!.uid));
                            setExtendModalDebt(null);
                            setAlertState({ isOpen: true, title: 'Success', message: 'Muddat uzaytirildi!', type: 'success' });
                        }}
                        className="w-full py-4 rounded-xl bg-aura-gold text-black font-black uppercase tracking-widest hover:bg-white transition-all mt-4"
                    >
                        {t.common.save}
                    </button>
                </div>
            </Modal>
        </>
    );
}

