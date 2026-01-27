import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { Theme } from '../../styles/theme';
import { useLanguage } from '../../context/LanguageContext';
import { callBackend } from '../../services/groqService';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function FamilyScreen({ navigation }) {
    const { t, language } = useLanguage();
    const [familyInsight, setFamilyInsight] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [members] = useState([
        {
            id: 1,
            name: 'Siyovushxan',
            role: 'Siz (Ota)',
            status: 'Active',
            emoji: '👨',
            message: 'Hozirgina 10k qadamni tugatdi!',
            action: null
        },
        {
            id: 2,
            name: 'Nafisa',
            role: 'Ona',
            status: 'Active',
            emoji: '👩',
            message: 'Moliya hisobotini ko\'rib chiqmoqda.',
            action: null
        },
        {
            id: 3,
            name: 'Temurbek',
            role: 'O\'g\'il',
            status: 'Request',
            emoji: '👦',
            message: 'Matematika vazifasini tugatdi.',
            action: 'Ruxsat berish (30 min)'
        },
        {
            id: 4,
            name: 'Azamat Ota',
            role: 'Bobo',
            status: 'Inactive',
            emoji: '👴',
            message: 'Oxirgi marta 2 soat oldin harakatlangan.',
            action: 'Sog\'liqni tekshirish'
        },
    ]);

    const fetchFamilyAnalysis = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setIsAnalyzing(true);
        try {
            const result = await callBackend('getFamilyInsight', {
                data: { members },
                language: language
            });
            // Ensure we are saving a string
            const insightText = typeof (result.insight || result) === 'object'
                ? (result.insight?.insight || JSON.stringify(result.insight || result))
                : (result.insight || result);
            setFamilyInsight(insightText);
        } catch (error) {
            setFamilyInsight("Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                {!navigation.canGoBack() ? null : (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>{t.common.back}</Text>
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>{t.family.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Guardian AI Analysis */}
                <TouchableOpacity
                    style={styles.alertBox}
                    onPress={fetchFamilyAnalysis}
                    disabled={isAnalyzing}
                >
                    <LinearGradient
                        colors={['rgba(0, 240, 255, 0.1)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.alertEmoji}>🛡️</Text>
                    <View style={{ flex: 1 }}>
                        <View style={styles.alertHeader}>
                            <Text style={styles.alertTitle}>GUARDIAN NEURAL SCAN</Text>
                            {isAnalyzing && <ActivityIndicator size="small" color={Theme.colors.cyan} />}
                        </View>
                        <Text style={styles.alertText}>
                            {familyInsight || "Tap to run Guardian AI family safety scan."}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.storyFeed}>
                    {members.map(member => (
                        <View key={member.id} style={styles.storyCard}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                                style={styles.storyGradient}
                            />

                            <View style={styles.cardHeader}>
                                <View style={styles.avatarContainer}>
                                    <Text style={styles.avatarEmoji}>{member.emoji}</Text>
                                    <View style={[styles.livenessDot, {
                                        backgroundColor: member.status === 'Active' ? Theme.colors.green :
                                            member.status === 'Request' ? Theme.colors.gold : Theme.colors.red
                                    }]} />
                                </View>
                                <View>
                                    <Text style={styles.storyName}>{member.name}</Text>
                                    <Text style={styles.storyRole}>{member.role}</Text>
                                </View>
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={styles.statusMessage}>{member.message}</Text>

                                {member.action && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, { borderColor: member.status === 'Request' ? Theme.colors.gold : Theme.colors.cyan }]}
                                        onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
                                    >
                                        <Text style={[styles.actionButtonText, { color: member.status === 'Request' ? Theme.colors.gold : Theme.colors.cyan }]}>
                                            {member.action.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.inviteButton}>
                    <Text style={styles.inviteButtonText}>+ {t.family.invite.toUpperCase()}</Text>
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: Theme.colors.cyan,
        fontSize: 14,
    },
    storyFeed: {
        marginTop: 10,
    },
    storyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 32,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    storyGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        position: 'relative',
    },
    avatarEmoji: {
        fontSize: 28,
    },
    livenessDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: Theme.colors.background,
    },
    storyName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
    },
    storyRole: {
        fontSize: 10,
        color: Theme.colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    cardContent: {
        padding: 24,
    },
    statusMessage: {
        color: '#FFF',
        fontSize: 15,
        lineHeight: 22,
        opacity: 0.8,
        marginBottom: 20,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    actionButtonText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    inviteButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginTop: 10,
    },
    inviteButtonText: {
        color: Theme.colors.textDim,
        fontWeight: 'bold',
        letterSpacing: 2,
        fontSize: 10,
    },
    alertBox: {
        flexDirection: 'row',
        padding: 24,
        backgroundColor: 'rgba(0, 240, 255, 0.03)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.08)',
        marginBottom: 24,
        alignItems: 'center',
        overflow: 'hidden',
    },
    alertEmoji: {
        fontSize: 28,
        marginRight: 20,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    alertTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: Theme.colors.cyan,
        letterSpacing: 2,
    },
    alertText: {
        color: Theme.colors.textSecondary,
        lineHeight: 22,
        fontSize: 14,
        opacity: 0.8,
    }
});
