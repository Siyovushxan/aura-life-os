// Health Screen - Bio-Battery and Health Tracking
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Modal } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Theme } from '../../styles/theme';
import { GlassCard, GlassButton } from '../../components/ui';

export default function HealthScreen() {
    const [healthData, setHealthData] = useState({
        steps: 0,
        sleep: 0,
        screenTime: 0,
        energy: 75,
    });
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        loadHealthData();
    }, []);

    const loadHealthData = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const today = new Date().toISOString().split('T')[0];
        const docRef = doc(db, 'users', uid, 'modules', 'health', 'daily', today);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setHealthData(docSnap.data());
        }
    };

    const saveHealthData = async (data) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const today = new Date().toISOString().split('T')[0];
        await setDoc(doc(db, 'users', uid, 'modules', 'health', 'daily', today), data);
        setHealthData(data);
        setShowEditModal(false);
    };

    const energyPercentage = healthData.energy;
    const energyColor = energyPercentage > 70 ? Theme.colors.green :
        energyPercentage > 40 ? Theme.colors.gold :
            Theme.colors.red;

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>Health</Text>
                    <Text style={styles.subtitle}>Your vitality dashboard</Text>
                </View>

                {/* Bio-Battery */}
                <GlassCard style={[styles.batteryCard, Theme.glows.green]}>
                    <Text style={styles.batteryLabel}>Bio-Battery</Text>

                    {/* Battery Visualization */}
                    <View style={styles.batteryContainer}>
                        <View style={styles.battery}>
                            <View
                                style={[
                                    styles.batteryFill,
                                    {
                                        height: `${energyPercentage}%`,
                                        backgroundColor: energyColor
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.batteryPercent, { color: energyColor }]}>
                            {energyPercentage}%
                        </Text>
                    </View>

                    <Text style={styles.batteryStatus}>
                        {energyPercentage > 70 ? 'High Energy' :
                            energyPercentage > 40 ? 'Moderate Energy' :
                                'Low Energy - Rest Needed'}
                    </Text>
                </GlassCard>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statIcon}>👣</Text>
                        <Text style={styles.statValue}>{healthData.steps.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Steps</Text>
                    </GlassCard>

                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statIcon}>😴</Text>
                        <Text style={styles.statValue}>{healthData.sleep}h</Text>
                        <Text style={styles.statLabel}>Sleep</Text>
                    </GlassCard>

                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statIcon}>📱</Text>
                        <Text style={styles.statValue}>{healthData.screenTime}m</Text>
                        <Text style={styles.statLabel}>Screen Time</Text>
                    </GlassCard>
                </View>

                {/* Edit Button */}
                <GlassButton
                    title="Update Health Data"
                    variant="secondary"
                    color={Theme.colors.green}
                    onPress={() => setShowEditModal(true)}
                    style={{ marginTop: Theme.spacing.lg }}
                />

                <Text style={styles.infoText}>
                    💡 Tip: Connect HealthKit (iOS) or Google Fit (Android) for automatic tracking
                </Text>
            </ScrollView>

            {/* Edit Modal */}
            {showEditModal && (
                <EditHealthModal
                    visible={showEditModal}
                    data={healthData}
                    onClose={() => setShowEditModal(false)}
                    onSave={saveHealthData}
                />
            )}
        </View>
    );
}

const EditHealthModal = ({ visible, data, onClose, onSave }) => {
    const [steps, setSteps] = useState(data.steps.toString());
    const [sleep, setSleep] = useState(data.sleep.toString());
    const [screenTime, setScreenTime] = useState(data.screenTime.toString());
    const [energy, setEnergy] = useState(data.energy.toString());

    const handleSave = () => {
        onSave({
            steps: parseInt(steps) || 0,
            sleep: parseFloat(sleep) || 0,
            screenTime: parseInt(screenTime) || 0,
            energy: parseInt(energy) || 75,
        });
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <GlassCard style={modalStyles.modal}>
                    <Text style={modalStyles.title}>Update Health Data</Text>

                    <Text style={modalStyles.label}>Steps</Text>
                    <TextInput
                        style={modalStyles.input}
                        placeholder="e.g., 7234"
                        placeholderTextColor={Theme.colors.gray[500]}
                        keyboardType="numeric"
                        value={steps}
                        onChangeText={setSteps}
                    />

                    <Text style={modalStyles.label}>Sleep (hours)</Text>
                    <TextInput
                        style={modalStyles.input}
                        placeholder="e.g., 7.5"
                        placeholderTextColor={Theme.colors.gray[500]}
                        keyboardType="decimal-pad"
                        value={sleep}
                        onChangeText={setSleep}
                    />

                    <Text style={modalStyles.label}>Screen Time (minutes)</Text>
                    <TextInput
                        style={modalStyles.input}
                        placeholder="e.g., 180"
                        placeholderTextColor={Theme.colors.gray[500]}
                        keyboardType="numeric"
                        value={screenTime}
                        onChangeText={setScreenTime}
                    />

                    <Text style={modalStyles.label}>Energy Level (1-100)</Text>
                    <TextInput
                        style={modalStyles.input}
                        placeholder="e.g., 75"
                        placeholderTextColor={Theme.colors.gray[500]}
                        keyboardType="numeric"
                        value={energy}
                        onChangeText={setEnergy}
                    />

                    <View style={modalStyles.actions}>
                        <GlassButton
                            title="Cancel"
                            variant="secondary"
                            onPress={onClose}
                            style={{ flex: 1, marginRight: 8 }}
                        />
                        <GlassButton
                            title="Save"
                            variant="primary"
                            color={Theme.colors.green}
                            onPress={handleSave}
                            style={{ flex: 1, marginLeft: 8 }}
                        />
                    </View>
                </GlassCard>
            </View>
        </Modal>
    );
};

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
    batteryCard: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xl,
        marginBottom: Theme.spacing.lg,
    },
    batteryLabel: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Theme.spacing.md,
    },
    batteryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.xl,
    },
    battery: {
        width: 80,
        height: 160,
        borderRadius: Theme.radius.lg,
        borderWidth: 3,
        borderColor: Theme.colors.gray[300],
        overflow: 'hidden',
        justifyContent: 'flex-end',
        position: 'relative',
    },
    batteryFill: {
        width: '100%',
        borderRadius: Theme.radius.md,
    },
    batteryPercent: {
        fontSize: 48,
        fontWeight: Theme.typography.weights.bold,
    },
    batteryStatus: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[500],
        marginTop: Theme.spacing.md,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: Theme.spacing.md,
        marginBottom: Theme.spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Theme.spacing.lg,
    },
    statIcon: {
        fontSize: 32,
        marginBottom: Theme.spacing.sm,
    },
    statValue: {
        fontSize: Theme.typography.sizes['2xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
    },
    statLabel: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginTop: 4,
    },
    infoText: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[500],
        textAlign: 'center',
        marginTop: Theme.spacing.xl,
        lineHeight: 20,
    },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
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
    label: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginBottom: Theme.spacing.sm,
        marginTop: Theme.spacing.md,
    },
    input: {
        backgroundColor: Theme.glass.input.backgroundColor,
        borderWidth: Theme.glass.input.borderWidth,
        borderColor: Theme.glass.input.borderColor,
        borderRadius: Theme.radius.md,
        padding: Theme.spacing.md,
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.base,
    },
    actions: {
        flexDirection: 'row',
        marginTop: Theme.spacing.xl,
    },
});
