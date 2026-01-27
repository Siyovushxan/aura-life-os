import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from './src/firebaseConfig';
import { AuthNavigator, AppNavigator } from './src/navigation';
import { ActivityIndicator, View, Platform, LogBox } from 'react-native';
import { Theme } from './src/styles/theme';
// Ignore specific development warnings
if (__DEV__) {
  const silentLogs = [
    'props.pointerEvents',
    '[expo-notifications]',
    'Setting a timer',
    'Cross-Origin-Opener-Policy',
    'aria-hidden'
  ];

  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    if (silentLogs.some(log => args[0]?.toString().includes(log))) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (silentLogs.some(log => args[0]?.toString().includes(log))) return;
    originalError(...args);
  };

  LogBox.ignoreAllLogs(true); // Brute force silence for a clean UI
}

import { registerForPushNotificationsAsync, sendLocalNotification } from './src/services/notificationService';
import { LanguageProvider } from './src/context/LanguageContext';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simplified state management
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);
    });

    // No extra redirect handling needed for Popup flow

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Theme.colors.cyan} />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <NavigationContainer>
        {user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </LanguageProvider>
  );
}
