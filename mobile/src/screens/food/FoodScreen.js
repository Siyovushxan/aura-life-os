// Food Screen - Meal tracking and calorie counter
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Theme } from '../../styles/theme';
import { GlassCard, GlassButton } from '../../components/ui';

export default function FoodScreen() {
    const [meals, setMeals] = useState([]);
    const [dailyCalories, setDailyCalories] = useState(0);
    const [calorieGoal] = useState(2000);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadMeals();
    }, []);

    const loadMeals = () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, 'users', uid, 'modules', 'food', 'meals'),
            where('timestamp', '>=', Timestamp.fromDate(today)),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const mealsList = [];
            let totalCal = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                mealsList.push({ id: doc.id, ...data });
                totalCal += data.calories || 0;
            });

            setMeals(mealsList);
            setDailyCalories(totalCal);
        });

        return unsubscribe;
    };

    const addMeal = async (name, calories, category) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        await addDoc(collection(db, 'users', uid, 'modules', 'food', 'meals'), {
            name,
            calories: parseInt(calories),
            category,
            timestamp: Timestamp.now(),
        });

        setShowAddModal(false);
    };

    const deleteMeal = async (id) => {
        const uid = auth.currentUser?.uid;
        await deleteDoc(doc(db, 'users', uid, 'modules', 'food', 'meals', id));
    };

    const caloriePercentage = Math.min((dailyCalories / calorieGoal) * 100, 100);
    const progressColor = caloriePercentage < 80 ? Theme.colors.green :
        caloriePercentage < 100 ? Theme.colors.gold :
            Theme.colors.red;

    const groupedMeals = {
        breakfast: meals.filter(m => m.category === 'breakfast'),
        lunch: meals.filter(m => m.category === 'lunch'),
        dinner: meals.filter(m => m.category === 'dinner'),
        snack: meals.filter(m => m.category === 'snack'),
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>Food</Text>
                    <Text style={styles.subtitle}>Nutrition tracking</Text>
                </View>

                {/* Calorie Counter Card */}
                <GlassCard style={styles.calorieCard}>
                    <Text style={styles.calorieLabel}>Daily Calories</Text>

                    <View style={styles.calorieRow}>
                        <Text style={[styles.calorieValue, { color: progressColor }]}>
                            {dailyCalories}
                        </Text>
                        <Text style={styles.calorieGoal}>/ {calorieGoal} kcal</Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${caloriePercentage}%`,
                                    backgroundColor: progressColor
                                }
                            ]}
                        />
                    </View>

                    <Text style={styles.remainingText}>
                        {calorieGoal - dailyCalories} kcal remaining
                    </Text>
                </GlassCard>

                {/* Meals Timeline */}
                <View style={styles.timeline}>
                    {Object.entries(groupedMeals).map(([category, categoryMeals]) => (
                        <View key={category}>
                            <Text style={styles.categoryTitle}>
                                {getCategoryEmoji(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Text>

                            {categoryMeals.length === 0 ? (
                                <Text style={styles.emptyCategory}>No meals logged</Text>
                            ) : (
                                categoryMeals.map((meal) => (
                                    <GlassCard key={meal.id} style={styles.mealCard}>
                                        <View style={styles.mealRow}>
                                            <View style={styles.mealInfo}>
                                                <Text style={styles.mealName}>{meal.name}</Text>
                                                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => deleteMeal(meal.id)}
                                            >
                                                <Text style={styles.deleteIcon}>🗑️</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </GlassCard>
                                ))
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Add Meal FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAddModal(true)}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Add Meal Modal */}
            {showAddModal && (
                <AddMealModal
                    visible={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onAdd={addMeal}
                />
            )}
        </View>
    );
}

const getCategoryEmoji = (category) => {
    const emojis = {
        breakfast: '🌅',
        lunch: '🌞',
        dinner: '🌙',
        snack: '🍪',
    };
    return emojis[category] || '🍽️';
};

const AddMealModal = ({ visible, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [calories, setCalories] = useState('');
    const [category, setCategory] = useState('breakfast');

    const handleAdd = () => {
        if (!name || !calories) return;
        onAdd(name, calories, category);
        setName('');
        setCalories('');
        setCategory('breakfast');
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <GlassCard style={modalStyles.modal}>
                    <Text style={modalStyles.title}>Add Meal</Text>

                    <TextInput
                        style={modalStyles.input}
                        placeholder="Food name"
                        placeholderTextColor={Theme.colors.gray[500]}
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput
                        style={modalStyles.input}
                        placeholder="Calories (e.g., 350)"
                        placeholderTextColor={Theme.colors.gray[500]}
                        keyboardType="numeric"
                        value={calories}
                        onChangeText={setCalories}
                    />

                    <Text style={modalStyles.label}>Category</Text>
                    <View style={modalStyles.categoryRow}>
                        {['breakfast', 'lunch', 'dinner', 'snack'].map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    modalStyles.categoryChip,
                                    category === cat && modalStyles.categoryActive
                                ]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={modalStyles.categoryEmoji}>{getCategoryEmoji(cat)}</Text>
                                <Text style={modalStyles.categoryText}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

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
    calorieCard: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xl,
        marginBottom: Theme.spacing.lg,
    },
    calorieLabel: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    calorieRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginVertical: Theme.spacing.md,
    },
    calorieValue: {
        fontSize: 48,
        fontWeight: Theme.typography.weights.bold,
    },
    calorieGoal: {
        fontSize: Theme.typography.sizes.xl,
        color: Theme.colors.gray[500],
        marginLeft: Theme.spacing.sm,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: Theme.colors.gray[100],
        borderRadius: Theme.radius.full,
        overflow: 'hidden',
        marginVertical: Theme.spacing.md,
    },
    progressFill: {
        height: '100%',
        borderRadius: Theme.radius.full,
    },
    remainingText: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[500],
    },
    timeline: {
        paddingBottom: 100,
    },
    categoryTitle: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginTop: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
    },
    emptyCategory: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginBottom: Theme.spacing.md,
        fontStyle: 'italic',
    },
    mealCard: {
        marginBottom: Theme.spacing.sm,
    },
    mealRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mealInfo: {
        flex: 1,
    },
    mealName: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.white,
        fontWeight: Theme.typography.weights.medium,
    },
    mealCalories: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginTop: 2,
    },
    deleteButton: {
        padding: Theme.spacing.sm,
    },
    deleteIcon: {
        fontSize: 18,
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
    label: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginBottom: Theme.spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Theme.spacing.sm,
        marginBottom: Theme.spacing.lg,
    },
    categoryChip: {
        width: '48%',
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderWidth: 1,
        borderColor: Theme.colors.gray[100],
        alignItems: 'center',
    },
    categoryActive: {
        backgroundColor: Theme.colors.gold + '20',
        borderColor: Theme.colors.gold,
    },
    categoryEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    categoryText: {
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.sm,
    },
    actions: {
        flexDirection: 'row',
    },
});
