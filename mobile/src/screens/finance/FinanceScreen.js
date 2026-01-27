// Finance Screen - Main finance module
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { Theme } from '../../styles/theme';
import { GlassCard, GlassButton } from '../../components/ui';
import * as Haptics from 'expo-haptics';

export default function FinanceScreen() {
    const [transactions, setTransactions] = useState([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const q = query(
            collection(db, 'users', uid, 'modules', 'finance', 'transactions'),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = [];
            let balance = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                txs.push({ id: doc.id, ...data });

                if (data.type === 'income') {
                    balance += data.amount;
                } else {
                    balance -= data.amount;
                }
            });

            setTransactions(txs);
            setTotalBalance(balance);
        });

        return unsubscribe;
    };

    const deleteTransaction = async (id) => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const uid = auth.currentUser?.uid;
        await deleteDoc(doc(db, 'users', uid, 'modules', 'finance', 'transactions', id));
    };

    const addTransaction = async (amount, category, type, note) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        await addDoc(collection(db, 'users', uid, 'modules', 'finance', 'transactions'), {
            amount: parseFloat(amount),
            category,
            type,
            note: note || '',
            date: new Date(),
        });

        setShowAddModal(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Finance</Text>
                    <Text style={styles.subtitle}>Wealth Overview</Text>
                </View>

                {/* Total Balance Card */}
                <GlassCard style={styles.balanceCard} glowColor="gold">
                    <Text style={styles.balanceLabel}>Total Balance</Text>
                    <Text style={[styles.balanceValue, { color: Theme.colors.gold }]}>
                        ${totalBalance.toLocaleString()}
                    </Text>
                    <Text style={styles.balanceChange}>
                        {totalBalance > 0 ? '▲' : '▼'}
                        {' '}${Math.abs(totalBalance * 0.05).toFixed(0)} this month
                    </Text>
                </GlassCard>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>Income</Text>
                        <Text style={[styles.statValue, { color: Theme.colors.green }]}>
                            ${transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                        </Text>
                    </GlassCard>

                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>Expenses</Text>
                        <Text style={[styles.statValue, { color: Theme.colors.red }]}>
                            ${transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                        </Text>
                    </GlassCard>
                </View>

                {/* Transactions List */}
                <View style={styles.transactionsSection}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>

                    {transactions.length === 0 ? (
                        <Text style={styles.emptyText}>No transactions yet. Add your first one!</Text>
                    ) : (
                        transactions.map((tx) => (
                            <GlassCard key={tx.id} style={styles.transactionCard}>
                                <View style={styles.transactionRow}>
                                    <View style={styles.transactionLeft}>
                                        <Text style={styles.transactionAmount}>
                                            {tx.type === 'income' ? '+' : '-'}${tx.amount}
                                        </Text>
                                        <Text style={styles.transactionCategory}>{tx.category}</Text>
                                        {tx.note && <Text style={styles.transactionNote}>{tx.note}</Text>}
                                    </View>

                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => deleteTransaction(tx.id)}
                                    >
                                        <Text style={styles.deleteIcon}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            </GlassCard>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Add Transaction Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAddModal(true)}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Add Transaction Modal (Simplified) */}
            {showAddModal && (
                <AddTransactionModal
                    visible={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onAdd={addTransaction}
                />
            )}
        </View>
    );
}

// Simple Add Transaction Modal Component
const AddTransactionModal = ({ visible, onClose, onAdd }) => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food');
    const [type, setType] = useState('expense');
    const [note, setNote] = useState('');

    const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Other'];

    const handleAdd = () => {
        if (!amount) return;
        onAdd(amount, category, type, note);
        onClose();
    };

    return (
        <View style={modalStyles.overlay}>
            <GlassCard style={modalStyles.modal}>
                <Text style={modalStyles.title}>Add Transaction</Text>

                {/* Type Selector */}
                <View style={modalStyles.typeRow}>
                    <TouchableOpacity
                        style={[modalStyles.typeButton, type === 'expense' && modalStyles.typeActive]}
                        onPress={() => setType('expense')}
                    >
                        <Text style={modalStyles.typeText}>Expense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[modalStyles.typeButton, type === 'income' && modalStyles.typeActive]}
                        onPress={() => setType('income')}
                    >
                        <Text style={modalStyles.typeText}>Income</Text>
                    </TouchableOpacity>
                </View>

                {/* Amount Input */}
                <TextInput
                    style={modalStyles.input}
                    placeholder="Amount"
                    placeholderTextColor={Theme.colors.gray[500]}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                />

                {/* Category Picker */}
                <View style={modalStyles.categoryRow}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[modalStyles.categoryChip, category === cat && modalStyles.categoryActive]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={modalStyles.categoryText}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Note Input */}
                <TextInput
                    style={modalStyles.input}
                    placeholder="Note (optional)"
                    placeholderTextColor={Theme.colors.gray[500]}
                    value={note}
                    onChangeText={setNote}
                />

                {/* Actions */}
                <View style={modalStyles.actions}>
                    <GlassButton
                        title="Cancel"
                        variant="secondary"
                        onPress={onClose}
                        style={{ flex: 1, marginRight: 8 }}
                    />
                    <GlassButton
                        title="Add"
                        variant="primary"
                        color={Theme.colors.gold}
                        onPress={handleAdd}
                        style={{ flex: 1, marginLeft: 8 }}
                    />
                </View>
            </GlassCard>
        </View>
    );
};

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollView: {
        flex: 1,
        padding: Theme.spacing.md,
    },
    header: {
        marginBottom: Theme.spacing.lg,
    },
    title: {
        fontSize: Theme.typography.sizes['3xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
    },
    subtitle: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.gray[600],
        marginTop: 4,
    },
    balanceCard: {
        marginBottom: Theme.spacing.md,
        alignItems: 'center',
        paddingVertical: Theme.spacing.xl,
    },
    balanceLabel: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceValue: {
        fontSize: 48,
        fontWeight: Theme.typography.weights.bold,
        marginVertical: Theme.spacing.sm,
    },
    balanceChange: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[500],
    },
    statsRow: {
        flexDirection: 'row',
        gap: Theme.spacing.md,
        marginBottom: Theme.spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Theme.spacing.md,
    },
    statLabel: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
    },
    statValue: {
        fontSize: Theme.typography.sizes.xl,
        fontWeight: Theme.typography.weights.bold,
        marginTop: 4,
    },
    transactionsSection: {
        marginTop: Theme.spacing.md,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.md,
    },
    emptyText: {
        textAlign: 'center',
        color: Theme.colors.gray[500],
        marginTop: Theme.spacing.xl,
    },
    transactionCard: {
        marginBottom: Theme.spacing.sm,
    },
    transactionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionLeft: {
        flex: 1,
    },
    transactionAmount: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
    },
    transactionCategory: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginTop: 2,
    },
    transactionNote: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[500],
        marginTop: 2,
    },
    deleteButton: {
        padding: Theme.spacing.sm,
    },
    deleteIcon: {
        fontSize: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Theme.colors.gold,
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.xl,
    },
    fabIcon: {
        fontSize: 32,
        color: '#000',
        fontWeight: 'bold',
    },
});

const modalStyles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.spacing.md,
    },
    modal: {
        width: '100%',
        maxWidth: 400,
        padding: Theme.spacing.xl,
    },
    title: {
        fontSize: Theme.typography.sizes['2xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.lg,
    },
    typeRow: {
        flexDirection: 'row',
        gap: Theme.spacing.sm,
        marginBottom: Theme.spacing.md,
    },
    typeButton: {
        flex: 1,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderWidth: 1,
        borderColor: Theme.colors.gray[100],
        alignItems: 'center',
    },
    typeActive: {
        backgroundColor: Theme.colors.cyan + '20',
        borderColor: Theme.colors.cyan,
    },
    typeText: {
        color: Theme.colors.white,
        fontWeight: Theme.typography.weights.semibold,
    },
    input: {
        backgroundColor: Theme.glass.input.backgroundColor,
        borderWidth: Theme.glass.input.borderWidth,
        borderColor: Theme.glass.input.borderColor,
        borderRadius: Theme.radius.md,
        padding: Theme.spacing.md,
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.base,
        marginBottom: Theme.spacing.md,
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Theme.spacing.sm,
        marginBottom: Theme.spacing.md,
    },
    categoryChip: {
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        borderRadius: Theme.radius.full,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderWidth: 1,
        borderColor: Theme.colors.gray[100],
    },
    categoryActive: {
        backgroundColor: Theme.colors.gold + '20',
        borderColor: Theme.colors.gold,
    },
    categoryText: {
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.sm,
    },
    actions: {
        flexDirection: 'row',
        marginTop: Theme.spacing.md,
    },
});
