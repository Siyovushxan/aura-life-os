// Bottom Tab Navigator with Custom v4.0 Styling
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../styles/theme';
import * as Haptics from 'expo-haptics';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import MenuScreen from '../screens/main/MenuScreen';
import FinanceScreen from '../screens/finance/FinanceScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import FoodScreen from '../screens/food/FoodScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 95 : 75,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                },
                tabBarActiveTintColor: Theme.colors.cyan,
                tabBarInactiveTintColor: Theme.colors.gray[500],
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    marginTop: -5,
                },
            }}
        >
            <Tab.Screen
                name="Menu"
                component={MenuScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} emoji="📱" label="Menu" />
                    ),
                    tabBarLabel: 'Menu',
                }}
            />
            <Tab.Screen
                name="Money"
                component={FinanceScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} emoji="💰" label="Moliya" />
                    ),
                    tabBarLabel: 'Moliya',
                }}
            />
            <Tab.Screen
                name="Aura"
                component={HomeScreen} // Central button points to Dashboard/Sphere
                options={{
                    tabBarButton: (props) => (
                        <AuraTabButton {...props} />
                    ),
                }}
            />
            <Tab.Screen
                name="Tasks"
                component={TasksScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} emoji="✅" label="Vazifalar" />
                    ),
                    tabBarLabel: 'Vazifalar',
                }}
            />
            <Tab.Screen
                name="Food"
                component={FoodScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} emoji="🍽️" label="Ovqat" />
                    ),
                    tabBarLabel: 'Ovqat',
                }}
            />
        </Tab.Navigator>
    );
};

// Custom Tab Icon
const TabIcon = ({ focused, color, emoji }) => {
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>
                {emoji}
            </Text>
        </View>
    );
};

// Custom Central AURA Button
const AuraTabButton = ({ accessibilityState, onPress }) => {
    const focused = accessibilityState.selected;

    const handleLongPress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        console.log("AURA Voice Activated");
    };

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onLongPress={handleLongPress}
            activeOpacity={0.8}
            style={styles.auraButtonContainer}
        >
            <View style={[
                styles.auraButton,
                focused && styles.auraButtonActive
            ]}>
                <Text style={styles.auraIcon}>💠</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    auraButtonContainer: {
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    auraButton: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: '#111',
        borderWidth: 2,
        borderColor: Theme.colors.gray[200],
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.lg,
    },
    auraButtonActive: {
        borderColor: Theme.colors.cyan,
        backgroundColor: Theme.colors.background,
        shadowColor: Theme.colors.cyan,
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    auraIcon: {
        fontSize: 32,
    },
});
