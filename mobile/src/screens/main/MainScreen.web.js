import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Screens
import DashboardScreen from './DashboardScreen';
import FinanceScreen from './FinanceScreen';
import TasksScreen from './TasksScreen';
import HealthScreen from './HealthScreen';
import HistoryScreen from './HistoryScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MainScreen({ navigation }) {
    const scrollViewRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1); // Default to Dashboard (index 1)

    useEffect(() => {
        // Initial scroll to page 1 (Dashboard)
        if (scrollViewRef.current) {
            // Small timeout to ensure layout is ready
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * 1, animated: false });
            }, 100);
        }
    }, []);

    const onMomentumScrollEnd = (e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (index !== currentPage) {
            // Haptics.selectionAsync() is generally web-safe (shimmed) but we can wrap it
            try { Haptics.selectionAsync(); } catch (e) { }
            setCurrentPage(index);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumScrollEnd}
                style={styles.pagerView}
            >
                <View style={styles.page} key="0">
                    <FinanceScreen navigation={navigation} isNested={true} />
                </View>
                <View style={styles.page} key="1">
                    <DashboardScreen navigation={navigation} isNested={true} />
                </View>
                <View style={styles.page} key="2">
                    <TasksScreen navigation={navigation} isNested={true} />
                </View>
                <View style={styles.page} key="3">
                    <HealthScreen navigation={navigation} isNested={true} />
                </View>
                <View style={styles.page} key="4">
                    <HistoryScreen navigation={navigation} isNested={true} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    pagerView: {
        flex: 1,
    },
    page: {
        width: SCREEN_WIDTH,
        flex: 1,
    }
});
