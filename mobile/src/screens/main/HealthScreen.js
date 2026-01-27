import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { Theme } from '../../styles/theme';
import { startStepTracking } from '../../services/sensorService';
import { auth } from '../../firebaseConfig';
import { useLanguage } from '../../context/LanguageContext';
import { callBackend } from '../../services/groqService';

export default function HealthScreen() {
    const { t, language } = useLanguage();
    const [steps, setSteps] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [healthInsight, setHealthInsight] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const user = auth.currentUser;

    useEffect(() => {
        let stop;
        if (isSyncing) {
            stop = startStepTracking(user?.uid, (val) => setSteps(val));
        }
        return () => stop && stop();
    }, [isSyncing, user?.uid]);

    const fetchHealthAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const result = await callBackend('getHealthInsight', {
                data: { steps, heartRate: 72, sleep: '7.5h' },
                language: language
            });
            setHealthInsight(result.insight || result);
        } catch (error) {
            setHealthInsight("Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t.health.title}</Text>
                    <Text style={styles.subtitle}>{t.health.subtitle}</Text>
                </View>

                {/* Main Progress Circle Simulation */}
                <View style={styles.circleContainer}>
                    <View style={styles.circleInner}>
                        <Text style={styles.stepsValue}>{steps}</Text>
                        <Text style={styles.stepsLabel}>{t.health.steps}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.syncButton, { backgroundColor: isSyncing ? Theme.colors.cyan : 'rgba(255,255,255,0.05)' }]}
                    onPress={() => setIsSyncing(!isSyncing)}
                >
                    <Text style={[styles.syncText, { color: isSyncing ? '#000' : '#FFF' }]}>
                        {isSyncing ? "BIO-SYNC ACTIVE" : t.health.sync}
                    </Text>
                </TouchableOpacity>

                <View style={styles.statsList}>
                    <View style={styles.statRow}>
                        <Text style={styles.statKey}>{t.health.battery}</Text>
                        <Text style={[styles.statValue, { color: Theme.colors.green }]}>88%</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statKey}>{t.health.heartRate}</Text>
                        <Text style={[styles.statValue, { color: Theme.colors.red }]}>72 BPM</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statKey}>{t.health.sleep}</Text>
                        <Text style={[styles.statValue, { color: Theme.colors.purple }]}>7.5h</Text>
                    </View>
                </View>

                <View style={styles.analysisBox}>
                    <View style={styles.analysisHeader}>
                        <Text style={styles.analysisTitle}>{t.health.analysis}</Text>
                        <TouchableOpacity
                            onPress={fetchHealthAnalysis}
                            disabled={isAnalyzing}
                        >
                            <Text style={styles.analyzeBtn}>{isAnalyzing ? '...' : '🔄'}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.analysisText}>
                        {healthInsight || t.health.analysis_desc || "Tap 🔄 for deep bio-analysis."}
                    </Text>
                </View>
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
    circleContainer: {
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 8,
        borderColor: 'rgba(255,255,255,0.05)',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    circleInner: {
        alignItems: 'center',
    },
    stepsValue: {
        fontSize: 48,
        fontWeight: '900',
        color: Theme.colors.cyan,
    },
    stepsLabel: {
        fontSize: 12,
        color: Theme.colors.textDim,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginTop: 4,
    },
    syncButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    syncText: {
        fontWeight: '900',
        letterSpacing: 1.5,
        fontSize: 12,
    },
    statsList: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statKey: {
        color: Theme.colors.textSecondary,
        fontSize: 14,
    },
    statValue: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    analysisBox: {
        padding: 24,
        backgroundColor: 'rgba(0, 240, 255, 0.05)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.1)',
    },
    analysisHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    analyzeBtn: {
        fontSize: 18,
    },
    analysisTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: Theme.colors.cyan,
        letterSpacing: 1,
    },
    analysisText: {
        color: Theme.colors.textSecondary,
        lineHeight: 22,
        fontSize: 14,
    }
});
