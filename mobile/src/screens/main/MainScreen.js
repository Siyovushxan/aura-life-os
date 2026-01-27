import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import * as Haptics from 'expo-haptics';

// Screens
import DashboardScreen from './DashboardScreen';
import FinanceScreen from './FinanceScreen';
import TasksScreen from './TasksScreen';
import HealthScreen from './HealthScreen';
import HistoryScreen from './HistoryScreen';

export default function MainScreen({ navigation }) {
    const pagerRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1); // Default to Dashboard (index 1)

    const onPageSelected = (e) => {
        const index = e.nativeEvent.position;
        if (index !== currentPage) {
            Haptics.selectionAsync();
            setCurrentPage(index);
        }
    };

    return (
        <View style={styles.container}>
            <PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={1}
                onPageSelected={onPageSelected}
                orientation="horizontal"
            >
                <View key="0">
                    <FinanceScreen navigation={navigation} isNested={true} />
                </View>
                <View key="1">
                    <DashboardScreen navigation={navigation} isNested={true} />
                </View>
                <View key="2">
                    <TasksScreen navigation={navigation} isNested={true} />
                </View>
                <View key="3">
                    <HealthScreen navigation={navigation} isNested={true} />
                </View>
                <View key="4">
                    <HistoryScreen navigation={navigation} isNested={true} />
                </View>
            </PagerView>
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
});
