import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { Theme } from '../../styles/theme';
import { useLanguage } from '../../context/LanguageContext';
import { auth, db } from '../../firebaseConfig';
import { collection, query, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

export default function InterestsScreen({ navigation }) {
    const { t } = useLanguage();
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    useEffect(() => {
        fetchInterests();
    }, []);

    const fetchInterests = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(collection(db, `users/${user.uid}/interests`));
            const querySnapshot = await getDocs(q);
            const interestList = [];
            querySnapshot.forEach((doc) => {
                interestList.push({ id: doc.id, ...doc.data() });
            });
            setInterests(interestList);
        } catch (error) {
            console.error("Error fetching interests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLog = async (interest) => {
        try {
            await updateDoc(doc(db, `users/${user.uid}/interests`, interest.id), {
                logCount: increment(1),
                lastLogged: new Date().toISOString()
            });
            setInterests(interests.map(i => i.id === interest.id ? { ...i, logCount: (i.logCount || 0) + 1 } : i));
        } catch (error) {
            console.error("Error logging interest:", error);
        }
    };

    const positiveInterests = interests.filter(i => i.type !== 'negative');
    const negativeHabits = interests.filter(i => i.type === 'negative');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>{t.common.back}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t.interests.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <ActivityIndicator color={Theme.colors.purple} style={{ marginTop: 40 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t.interests.activities}</Text>
                        <View style={styles.grid}>
                            {positiveInterests.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.card}
                                    onPress={() => handleLog(item)}
                                >
                                    <Text style={styles.cardEmoji}>{item.emoji || '✨'}</Text>
                                    <Text style={styles.cardTitle}>{item.name}</Text>
                                    <Text style={styles.cardValue}>{item.logCount || 0} {t.interests.streak}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t.interests.habits}</Text>
                        <View style={styles.grid}>
                            {negativeHabits.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.card, { borderColor: Theme.colors.red + '40' }]}
                                    onPress={() => handleLog(item)}
                                >
                                    <View style={styles.badBadge}><Text style={styles.badBadgeText}>!</Text></View>
                                    <Text style={styles.cardEmoji}>{item.emoji || '⚠️'}</Text>
                                    <Text style={styles.cardTitle}>{item.name}</Text>
                                    <Text style={styles.cardValue}>{item.logCount || 0} {t.interests.streak}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: Theme.colors.purple,
        fontSize: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Theme.colors.card,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardEmoji: {
        fontSize: 32,
        marginBottom: 12,
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardValue: {
        color: Theme.colors.textSecondary,
        fontSize: 12,
    },
    badBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: Theme.colors.red,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    }
});
