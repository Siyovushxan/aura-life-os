// Complete App Navigator with all screens
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text } from 'react-native';
import { Theme } from '../styles/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import FinanceScreen from '../screens/finance/FinanceScreen';
import FocusScreen from '../screens/focus/FocusScreen';
import FamilyScreen from '../screens/family/FamilyScreen';
import MoreScreen from '../screens/main/MoreScreen';

// Module Screens
import TasksScreen from '../screens/tasks/TasksScreen';
import HealthScreen from '../screens/health/HealthScreen';
import FoodScreen from '../screens/food/FoodScreen';
import InterestsScreen from '../screens/interests/InterestsScreen';
import MindScreen from '../screens/mind/MindScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
export const AuthNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
);

// Tab Icon Component
const TabIcon = ({ focused, color, emoji }) => {
    return (
        <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>
            {emoji}
        </Text>
    );
};

// Bottom Tab Navigator
const BottomTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Theme.colors.surface,
                    borderTopWidth: 1,
                    borderTopColor: Theme.colors.gray[100],
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Theme.colors.cyan,
                tabBarInactiveTintColor: Theme.colors.gray[500],
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} emoji="🏠" />
                    ),
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="Money"
                component={FinanceScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} emoji="💰" />
                    ),
                    tabBarLabel: 'Money',
                }}
            />
            <Tab.Screen
                name="Focus"
                component={FocusScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} emoji="🎯" />
                    ),
                    tabBarLabel: 'Focus',
                }}
            />
            <Tab.Screen
                name="Family"
                component={FamilyScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} emoji="👥" />
                    ),
                    tabBarLabel: 'Family',
                }}
            />
            <Tab.Screen
                name="More"
                component={MoreScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} emoji="⚙️" />
                    ),
                    tabBarLabel: 'More',
                }}
            />
        </Tab.Navigator>
    );
};

// Main App Navigator with Stack
export const AppNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={BottomTabs} />
            <Stack.Screen name="Tasks" component={TasksScreen} />
            <Stack.Screen name="Health" component={HealthScreen} />
            <Stack.Screen name="Food" component={FoodScreen} />
            <Stack.Screen name="Interests" component={InterestsScreen} />
            <Stack.Screen name="Mind" component={MindScreen} />
        </Stack.Navigator>
    );
};
