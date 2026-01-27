import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Theme } from '../styles/theme';
import { Text } from 'react-native';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import HealthScreen from '../screens/main/HealthScreen';
import FinanceScreen from '../screens/main/FinanceScreen';
import FamilyScreen from '../screens/main/FamilyScreen';
import FoodCameraScreen from '../screens/main/FoodCameraScreen';
import FocusScreen from '../screens/main/FocusScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import TasksScreen from '../screens/main/TasksScreen';
import InterestsScreen from '../screens/main/InterestsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export const AuthNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
);

const AppStack = createStackNavigator();

const MainStack = () => (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="Root" component={TabNavigator} />
        <AppStack.Screen name="FoodCamera" component={FoodCameraScreen} />
        <AppStack.Screen name="Tasks" component={TasksScreen} />
        <AppStack.Screen name="Interests" component={InterestsScreen} />
    </AppStack.Navigator>
);

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#000',
                    borderTopWidth: 1,
                    borderTopColor: '#222',
                    paddingBottom: 20,
                    height: 70,
                },
                tabBarActiveTintColor: Theme.colors.cyan,
                tabBarInactiveTintColor: Theme.colors.textDim,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                }
            }}
        >
            <Tab.Screen
                name="AURA"
                component={DashboardScreen}
                options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text> }}
            />
            <Tab.Screen
                name="Focus"
                component={FocusScreen}
                options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🎯</Text> }}
            />
            <Tab.Screen
                name="Health"
                component={HealthScreen}
                options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚡</Text> }}
            />
            <Tab.Screen
                name="Finance"
                component={FinanceScreen}
                options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💰</Text> }}
            />
            <Tab.Screen
                name="Family"
                component={FamilyScreen}
                options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👨‍👩‍👧‍👦</Text> }}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🧠</Text> }}
            />
        </Tab.Navigator>
    );
}

export const AppNavigator = MainStack;
