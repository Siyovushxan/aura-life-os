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

export default function FamilyScreen() {
    const { t, language } = useLanguage();
    const [familyInsight, setFamilyInsight] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [members] = useState([
        { id: 1, name: 'Siyovushxan', role: 'Siz (Ota)', status: 'Active', emoji: '👨' },
        { id: 2, name: 'Nafisa', role: 'Ona', status: 'Active', emoji: '👩' },
        { id: 3, name: 'Azamat Ota', role: 'Bobo', status: 'Inactive', emoji: '👴' },
    ]);

    const fetchFamilyAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const result = await callBackend('getFamilyInsight', {
                data: { members },
                language: language
            });
            setFamilyInsight(result.insight || result);
        } catch (error) {
            setFamilyInsight("Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t.family.title}</Text>
                    <Text style={styles.subtitle}>{t.family.subtitle}</Text>
                </View>

                {/* AI Analysis Box */}
                <TouchableOpacity
                    style={styles.alertBox}
                    onPress={fetchFamilyAnalysis}
                    disabled={isAnalyzing}
                >
                    <Text style={styles.alertEmoji}>🛡️</Text>
                    <View style={{ flex: 1 }}>
                        <View style={styles.alertHeader}>
                            <Text style={styles.alertTitle}>{t.family.analysis}</Text>
                            {isAnalyzing && <ActivityIndicator size="small" color={Theme.colors.cyan} />}
                        </View>
                        <Text style={styles.alertText}>
                            {familyInsight || "Tap to run Guardian AI family safety scan."}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.family.members}</Text>
                    {members.map(member => (
                        <View key={member.id} style={styles.memberCard}>
                            <View style={styles.memberAvatar}>
                                <Text style={{ fontSize: 24 }}>{member.emoji}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.memberName}>{member.name}</Text>
                                <Text style={styles.memberRole}>{member.role}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: member.status === 'Active' ? 'rgba(0, 255, 148, 0.1)' : 'rgba(255, 45, 85, 0.1)' }]}>
                                <View style={[styles.statusDot, { backgroundColor: member.status === 'Active' ? Theme.colors.green : Theme.colors.red }]} />
                                <Text style={[styles.statusText, { color: member.status === 'Active' ? Theme.colors.green : Theme.colors.red }]}>
                                    {member.status}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.inviteButton}>
                    <Text style={styles.inviteButtonText}>+ {t.family.invite}</Text>
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
    alertBox: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'rgba(0, 240, 255, 0.05)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.1)',
        marginBottom: 32,
        alignItems: 'center',
    },
    alertEmoji: {
        fontSize: 32,
        marginRight: 16,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    alertTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: Theme.colors.cyan,
        letterSpacing: 1,
    },
    alertText: {
        color: Theme.colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: Theme.colors.textDim,
        marginBottom: 16,
        letterSpacing: 1.5,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    memberAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    memberRole: {
        fontSize: 12,
        color: Theme.colors.textDim,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
    },
    inviteButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginTop: 20,
    },
    inviteButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
