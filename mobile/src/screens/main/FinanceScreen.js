import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { Theme } from '../../styles/theme';
import { useLanguage } from '../../context/LanguageContext';
import { callBackend } from '../../services/groqService';

export default function FinanceScreen() {
    const { t, language } = useLanguage();
    const [balance] = useState(1450200);
    const [income] = useState(5000000);
    const [spent] = useState(3549800);
    const [financeInsight, setFinanceInsight] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fetchFinanceAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const result = await callBackend('getFinanceInsight', {
                data: {
                    balance, income, spent, transactions: [
                        { title: 'Oziq-ovqat', amount: -50000 },
                        { title: 'Oylik Maosh', amount: 5000000 }
                    ]
                },
                language: language
            });
            setFinanceInsight(result.insight || result);
        } catch (error) {
            setFinanceInsight("Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t.finance.title}</Text>
                    <Text style={styles.subtitle}>{t.finance.subtitle}</Text>
                </View>

                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>{t.finance.balance}</Text>
                    <Text style={styles.balanceValue}>{balance.toLocaleString()} UZS</Text>
                    <View style={styles.miniStats}>
                        <View>
                            <Text style={styles.miniLabel}>{t.finance.income}</Text>
                            <Text style={[styles.miniValue, { color: Theme.colors.green }]}>+{income.toLocaleString()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.miniLabel}>{t.finance.expense}</Text>
                            <Text style={[styles.miniValue, { color: Theme.colors.red }]}>-{spent.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* AI Analysis Box */}
                <View style={styles.analysisBox}>
                    <View style={styles.analysisHeader}>
                        <Text style={styles.analysisTitle}>FINANCIAL AI STRATEGY</Text>
                        <TouchableOpacity onPress={fetchFinanceAnalysis} disabled={isAnalyzing}>
                            {isAnalyzing ? (
                                <ActivityIndicator size="small" color={Theme.colors.gold} />
                            ) : (
                                <Text style={styles.analyzeBtn}>🧠</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.analysisText}>
                        {financeInsight || "Tap the brain for a neuro-financial strategic growth plan."}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.finance.transactions}</Text>
                    {[
                        { id: 1, title: 'Oziq-ovqat', amount: -50000, category: 'Food', emoji: '🛒' },
                        { id: 2, title: 'Oylik Maosh', amount: 5000000, category: 'Salary', emoji: '💰' },
                        { id: 3, title: 'Kofe', amount: -25000, category: 'Drinks', emoji: '☕' },
                    ].map(item => (
                        <View key={item.id} style={styles.transactionItem}>
                            <View style={styles.txIcon}>
                                <Text>{item.emoji}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.txTitle}>{item.title}</Text>
                                <Text style={styles.txCat}>{item.category}</Text>
                            </View>
                            <Text style={[styles.txAmount, { color: item.amount > 0 ? Theme.colors.green : '#FFF' }]}>
                                {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.inviteButton}>
                    <Text style={styles.inviteButtonText}>+ {t.finance.addExpense}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scroll: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        marginTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 10,
        color: Theme.colors.textSecondary,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceCard: {
        backgroundColor: Theme.colors.card,
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    balanceLabel: {
        fontSize: 10,
        color: Theme.colors.textDim,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 8,
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 24,
    },
    miniStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 20,
    },
    miniLabel: {
        fontSize: 9,
        color: Theme.colors.textDim,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    miniValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    analysisBox: {
        padding: 24,
        backgroundColor: 'rgba(250, 204, 21, 0.05)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.1)',
        marginBottom: 32,
    },
    analysisHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    analysisTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: Theme.colors.gold,
        letterSpacing: 1,
    },
    analyzeBtn: {
        fontSize: 20,
    },
    analysisText: {
        color: Theme.colors.textSecondary,
        lineHeight: 22,
        fontSize: 14,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: Theme.colors.textDim,
        marginBottom: 16,
        letterSpacing: 1.5,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    txIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    txTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
    txCat: {
        fontSize: 10,
        color: Theme.colors.textDim,
        marginTop: 2,
    },
    txAmount: {
        fontSize: 14,
        fontWeight: '900',
    },
    inviteButton: {
        backgroundColor: Theme.colors.cyan,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    inviteButtonText: {
        color: '#000',
        fontWeight: '900',
        letterSpacing: 1,
    }
});
