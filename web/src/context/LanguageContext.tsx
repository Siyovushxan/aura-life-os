"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'uz' | 'ru';

type TranslationStructure = {
    common: {
        refresh: string;
        save: string;
        cancel: string;
        back: string;
        viewHistory: string;
        history: string;
        today: string;
        yesterday: string;
        done: string;
        user: string;
    };
    nav: {
        hero: string;
        problem: string;
        solution: string;
        butterfly: string;
        platforms: string;
        family: string;
    };
    sidebar: {
        dashboard: string;
        family: string;
        finance: string;
        tasks: string;
        health: string;
        food: string;
        mind: string;
        interests: string;
        liveness: string;
        settings: string;
        archived: string;
    };
    home: {
        deepWork: string;
        endSession: string;
        rainOn: string;
        ambientOff: string;
        voiceCommand: string;
        listening: string;
        analyzing: string;
        viewHistory: string;
        simStress: string;
        simCalm: string;
        enterZen: string;
        chronos: string;
        atmosphere: string;
        clearSky: string;
        wealthPulse: string;
        familyHub: string;
        approval: string;
        kidsTask: string;
        waiting: string;
        vitality: string;
        geneticRisk: string;
        nutrition: string;
        hobbies: string;
        streak: string;
        dailyInsights: string;
        batteryStatus: {
            ready: string;
            good: string;
            tired: string;
            rest: string;
        };
        thisMonth: string;
        need_more_data: string;
        analysis_error: string;
        system_ready: string;
        modules: {
            finance: string;
            health: string;
            family: string;
            mind: string;
            food: string;
        };
    };
    settings: {
        title: string;
        lang: string;
        notifs: string;
        dailyBrief: string;
        focusAlerts: string;
        familyUpdates: string;
        system: string;
        export: string;
        reset: string;
        currentLocale: string;
        freePlan: string;
        justNow: string;
        dailyBriefDesc: string;
        focusAlertsDesc: string;
        familyUpdatesDesc: string;
        exportSuccess: string;
        resetScheduled: string;
        logType: string;
        logDevice: string;
        logTime: string;
        logLogin: string;
        logWebDashboard: string;
        profile: string;
        securityLog: string;
        logout: string;
        yesterday: string;
        today: string;
        selectDate: string;
    };
    family: {
        title: string;
        subtitle: string;
        readOnly: string;
        readOnlyDesc: string;
        liveHub: string;
        genealogy: string;
        smartParenting: string;
        requests: string;
        approve: string;
        deny: string;
        approved: string;
        reward: string;
        overallMood: string;
        activeQuests: string;
        familyXP: string;
        gen1: string;
        gen2: string;
        gen3: string;
        backToHub: string;
        geneticProfile: string;
        safetyMonitor: string;
        emergencyCall: string;
        parentalControls: string;
        activityLog: string;
        task: string;
        date: string;
        xp: string;
    };
    finance: {
        title: string;
        subtitle: string;
        totalBalance: string;
        monthlyBudget: string;
        savingsGoal: string;
        recentTransactions: string;
        addTransaction: string;
        dailyAnalysis: string;
        dailyAnalysisText: string;
        spendBreakdown: string;
        viewAll: string;
        investment: string;
        credit: string;
        debt: string;
        confirmPaymentsInstruction: string;
        centralBankRate: string;
        realTimeCurrency: string;
        liabilities: string;
        assets: string;
        initialAmount: string;
        byCategory: string;
        debtsPlusCredits: string;
        returnPlusDeposits: string;
        addDebt: string;
        waitingForData: string;
        vsLastMonth: string;
        used: string;
        left: string;
        archivedDays: string;
        readOnly: string;
        readOnlyDesc: string;
        dayClosed: string;
        spent: string;
        days: string;
        weeks: string;
        months: string;
        years: string;
        enterGoal: string;
        deadline: string;
        achieved: string;
        noFunds: string;
        limit: string;
        target: string;
        current: string;
        perMonth: string;
        incomeInsufficient: string;
        iOwe: string;
        owedToMe: string;
        personName: string;
        fullNamePlaceholder: string;
        amount: string;
        currency: string;
        dateTaken: string;
        dateGiven: string;
        returnDate: string;
        addCredit: string;
        addDeposit: string;
        creditName: string;
        creditNamePlaceholder: string;
        depositName: string;
        depositNamePlaceholder: string;
        totalAmount: string;
        currentAmount: string;
        incomeHistoryEmpty: string;
        incomeHistoryEmptyDesc: string;
        expenseHistoryEmpty: string;
        expenseHistoryEmptyDesc: string;
        incomePlan: string;
        expenseControl: string;
        voiceFeedback: {
            listening: string;
            processing: string;
            done: string;
        };
        dailyFlow: string;
        advancedStats: string;
        incomeBudget: string;
        expenseBudget: string;
        targetIncome: string;
        limitExpense: string;
        ultimateGoalTitle: string;
        currentStatus: string;
        timeLeft: string;
        remainingTime: string;
        deadlineExpired: string;
        paymentSuccess: string;
        depositsEmpty: string;
        creditsEmpty: string;
        debtsEmpty: string;
        confirm: string;
        confirmPayment: string;
        todayPayments: string;
        monthlyPayment: string;
        paymentDay: string;
        interestRate: string;
        termMonths: string;
        calculationMethod: string;
        annuity: string;
        differential: string;
        add: string;
        yearlyProfit: string;
        depositDeadline: string;
        daysInMonth: string;
        monthlyProfitChoice: string;
        expectedMonthlyProfit: string;
        startDate: string;
        fillAllFields: string;
        depositOpened: string;
        investmentTransfer: string;
        noDeadline: string;
        extendDeadline: string;
        fromCurrentBalance: string; // New
        noExpenseRecord: string; // New
        markAsIncome: string; // New
        addFunds: string; // New
        editGoalTitle: string;
        editBudgetTitle: string;
        budgetSaved: string;
        incomeGrowthMessage: string;
        expenseLimitMessage: string;
        incomeAlmostTarget: string;
        expenseAlmostLimit: string;
        setNewReturnDate: string;
        datePlaceholder: string;
        creditPayment: string;
        depositProfit: string;
        probability: string;
        aiWealthRoadmap: string;
        analysisForGoal: string;
        professionalPotentialDescription: (role: string) => string;
        professionalPotential: string;
        professionalPotentialDesc: string;
        getCertification: string;
        additionalIncomeChannel: string;
        increaseInvestments: string;
        recommendations: string;
        viewFullAnalysis: string;
        qrScanner: string;
        qrScannerTitle: string;
        qrScannerDesc: string;
        qrScannerAction: string;
        analyzing: string;
        portfolio: string;
        recentActivity: string;
        noTransactions: string;
        aiRoadmapTitle: string;
        filesAnalysis: string;
        detailedList: string;
        monthlyAnalysisTitle: string;
        monthlyIncomeTitle: string;
        weeklyExpenseStats: string;
        iOweLabel: string;
        owedToMeLabel: string;
        repaid: string;
        repay: string;
        extend: string;
        dayLabel: string;
        remaining: string;
        payNow: string;
        prepay: string;
        collecting: string;
        totalCollected: string;
        monthlyPlan: string;
        topUp: string;
        noData: string;
        aiPredictionTitle: string;
        predictionPart1: string;
        predictionPart2: string;
        predictionTrend: (percent: number) => string;
        predictionGoalAdvice: (goal: string, months: number) => string;
        predictionDisclaimerText: string;
        weeklyLabel: string;
        monthlyLabel: string;
        customLabel: string;
        analysisSummary: string;
        incomeTitle: string;
        expenseTitle: string;
        principalAmount: string;
        interestAmount: string;
        repaymentSplit: string;
        realMoney: string;
        transTitle: string;
        transType: string;
        transCategory: string;
        depositActionTitle: string;
        actionAdd: string;
        actionWithdraw: string;
        actionProfit: string;
        sourceBalance: string;
        sourceOutside: string;
        // AI Status & Recs
        financialStatus: string;
        statusStart: string;
        statusPositive: string;
        statusDanger: string;
        statusDescStart: string;
        statusDescPositive: (percent: string) => string;
        statusDescDanger: string;
        recStart: string;
        recSafety: string;
        recDeposit: string;
        recDebt: string;
        recBudget: string;
        statusOk: string;
        predictionMsgExcellent: string;
        predictionMsgGood: string;
        predictionMsgOk: string;
        predictionMsgBad: string;
        fromLabel: string;
        toLabel: string;
        exportExcel: string;
    };
    categories: {
        Salary: string;
        Freelance: string;
        Investment: string;
        Gift: string;
        OtherIncome: string; // 'Other Income' in mock
        Food: string;
        Transport: string;
        Shopping: string;
        Bills: string;
        Health: string;
        Education: string;
        Leisure: string;
        Other: string;
        creditIn: string;
        depositIn: string;
        savings: string;
        // Added keys for translations mapping
        general: string;
        music: string;
        mind: string;
    };
    tasks: {
        title: string;
        subtitle: string;
        newTask: string;
        taskName: string;
        startTime: string;
        endTime: string;
        priority: string;
        low: string;
        medium: string;
        high: string;
        createTask: string;
        calendar: string;
        upcomingTasks: string;
        overdue: string;
        future: string;
        stats: {
            completedToday: string;
            pending: string;
            efficiency: string;
        };
        sections: {
            today: string;
            upcoming: string;
            completed: string;
            overdue: string;
            future: string;
        };
        aiSuggestion: {
            title: string;
            suggestion: string;
            add: string;
        };
        actions: {
            startFocus: string;
            moveToToday: string;
            subtask: string;
            move: string;
            focus: string;
            edit: string;
            delete: string;
            promote: string;
        };
        noTasks: string;
        allClear: string;
        completedArchive: string;
        readOnly: string;
        readOnlyDesc: string;
    };
    health: {
        history: string;
        readOnly: string;
        readOnlyDesc: string;
        title: string;
        subtitle: string;
        bodyBattery: {
            title: string;
            fullyCharged: string;
            recharge: string;
            sleepRestoration: string;
            activeDrain: string;
            stressTax: string;
            hydrationEfficiency: string;
        };
        vitals: {
            title: string; // Heart Rate Title
            stressTitle: string;
            resting: string;
            heartRateUnit: string;
            normalRange: string;
            avgLevel: string;
            low: string;
            relaxedState: string;
        };
        sleep: {
            score: string;
            quality: string;
            unit: string;
        };
        hydration: {
            title: string;
            goal: string;
            unit: string;
        };
        activity: {
            title: string;
            stepsToday: string;
            kcal: string;
            dist: string;
        };
        trends: {
            title: string;
            stepsHistory: string;
            sleepQuality: string;
        };
        days: {
            mon: string;
            tue: string;
            wed: string;
            thu: string;
            fri: string;
            sat: string;
            sun: string;
        };
        biometrics: {
            title: string;
            aiRecTitle: string;
            aiRecLose: string;
            aiRecMaintain: string;
            weight: string;
            height: string;
            goal: string;
            lose: string;
            gain: string;
            maintain: string;
            unitCm: string;
            unitKg: string;
            goalLabel: string;
        };
        aiAdvisor: {
            title: string;
            analyzing: string;
            hydrationLow: string;
            stressHigh: string;
            sleepLow: string;
            allGood: string;
        };
        loading: string;
        simulate: string;
        batteryStatus: {
            ready: string;
            good: string;
            tired: string;
            rest: string;
        };
        voiceAlertSteps: string;
        voiceAlertSleep: string;
        voiceAlertWater: string;
    };
    food: {
        title: string;
        subtitle: string;
        readOnly: string;
        readOnlyDesc: string;
        calories: string;
        macros: string;
        protein: string;
        carbs: string;
        fats: string;
        mealLogs: string;
        scanMeal: string;
        dailyLog: string;
        historyModalTitle: string;
        cameraPrompt: string;
        analyzing: string;
        instantAdviceTitle: string;
        targetAdvice: string;
        scanError: string;
        aiDetected: string;
        eatQuestion: string;
        yes: string;
        no: string;
        streak: string;
        loading: string;
        alertArchived: string;
        mealQuick: string;
        mealSnack: string;
        mealBreakfast: string;
        mealLunch: string;
        mealDinner: string;
        kcal: string;
        unitG: string;
    };
    mind: {
        title: string;
        subtitle: string;
        readOnly: string;
        readOnlyDesc: string;
        weeklyFocus: string;
        focusingOn: string;
        focus: string;
        break: string;
        moodSphere: string;
        moodSphereDesc: string;
        resonanceBreathing: string;
        startSession: string;
        stopSession: string;
        inhale: string;
        exhale: string;
        hold: string;
        ready: string;
        aiSummaryTitle: string;
        aiSummaryText: string;
        historyModalTitle: string;
        recentSessions: string;
        moodTrends: string;
        zenTitle: string;
        zenSubtitle: string;
        whyFeeling: string;
        exitZen: string;
        reasons: {
            tired: string;
            anxious: string;
            overwhelmed: string;
            justBecause: string;
        };
        loadingState: string;
        saved: string;
        saveMood: string;
        zenMapLeft: string;
        zenMapRight: string;
        aiLoading: string;
        aiPoweredBy: string;
    };
    focus: {
        minutes: string;
        done: string;
    };
    interests: {
        title: string;
        subtitle: string;
        readOnly: string;
        readOnlyDesc: string;
        historyModalTitle: string;
        practiceLog: string;
        streak: string;
        newHobby: string;
        aiRecommendation: string;
        aiReason: string;
        tryThis: string;
        hoursSpent: string;
        nextLevel: string;
        discoverNew: string;

        addHobbyTitle: string;
        hobbyName: string;
        category: string;
        loading: string;
        categories: {
            general: string;
            art: string;
            physical: string;
            mind: string;
            music: string;
        };
        placeholderName: string;
        positive: string;
        negative: string;
        type: string;
        trackingMode: string;
        trackingFrequency: string;
        trackingFrequencyDesc: string;
        trackingBinary: string;
        trackingBinaryDesc: string;
        newHobbyCardTitle: string;
        newHobbyCardDesc: string;
        positiveInterests: string;
        negativeHabits: string;
        dailyActivities: string;
        aiRecStatus: string;
        statCount: string;
        statDuration: string;
        loyaltyXP: string;
        done: string;
        logCount: string;
        log: string;
        status: string;
        times: string;
        level: string;
        totalHours: string;
        totalControl: string;
        logDurationQuestion: string;
        aiRecTitleCorrection: string;
        aiRecTitleGrowth: string;
        aiRecDone: string;
        aiRecTask: string;
        aiRecAddTask: string;
        noActivities: string;
        selectHobby: string;
        notDone: string;
        todayLabel: string;
        dailyStats: string;
    };
    butterfly: {
        title: string;
        subtitle: string;
        analyzing: string;
        lifeHarmony: string;
        keyInsights: string;
        noCorrelations: string;
        keepLogging: string;
        confident: string;
        fixThis: string;
        states: {
            harmonic: string;
            fragmented: string;
            disconnected: string;
        };
        descriptions: {
            harmonic: string;
            fragmented: string;
            disconnected: string;
        };
        insights: {
            sleepProductivityNegative: (sleep: string, productivity: string) => string;
            sleepProductivityPositive: (sleep: string, productivity: string) => string;
            financeMindNegative: (stress: string, mood: number) => string;
            foodHealthNegative: (calories: string, energy: number) => string;
            foodHealthPositive: (protein: string, energy: number) => string;
            focusInterestsPositive: (focus: number, streak: number) => string;
            familyMindPositive: (members: number, mood: number) => string;
        };
        actions: {
            sleep: string;
            finance: string;
            food: string;
        };
    };
    liveness_section: {
        title: string;
        subtitle: string;
        desc: string;
        cta: string;
        silent_mode: string;
        silent_mode_desc: string;
        activity_log: string;
        panic_alert: string;
        panic_confirm: string;
        countdown_prefix: string;
        checkInPrompt: string;
        familyAlert: (hours: number) => string;
    };
};

const translations: Record<Language, TranslationStructure> = {
    en: {
        common: {
            refresh: 'Refresh',
            save: 'Save',
            cancel: 'Cancel',
            back: 'Back',
            viewHistory: 'View History',
            history: 'History',
            today: 'Today',
            yesterday: 'Yesterday',
            done: 'Done',
            user: 'User'
        },
        nav: {
            hero: 'Home',
            problem: 'Problem',
            solution: 'Solution',
            butterfly: 'Butterfly',
            platforms: 'Platforms',
            family: 'Family'
        },
        sidebar: {
            dashboard: 'Dashboard',
            family: 'Family',
            finance: 'Finance',
            tasks: 'Tasks',
            health: 'Health',
            food: 'Food',
            mind: 'Mind',
            interests: 'Interests',
            liveness: 'Life Beacon',
            settings: 'Settings',
            archived: 'Archived'
        },
        home: {
            deepWork: 'DEEP WORK SESSION',
            endSession: 'End Session',
            rainOn: 'Rain On',
            ambientOff: 'Ambient Off',
            voiceCommand: 'Voice Command',
            listening: 'Listening...',
            analyzing: 'Analyzing system...',
            viewHistory: 'View History',
            simStress: 'Sim Stress',
            simCalm: 'Sim Calm',
            enterZen: 'Enter Zen',
            chronos: 'Chronos',
            atmosphere: 'Atmosphere',
            clearSky: 'Clear Sky',
            wealthPulse: 'Wealth Pulse',
            familyHub: 'Family Hub',
            approval: '1 Approval',
            kidsTask: "Kid's Task Done",
            waiting: 'Waiting for parental confirmation',
            vitality: 'Vitality',
            geneticRisk: '⚠️ Genetic Risk',
            nutrition: 'Nutrition',
            hobbies: 'Hobbies',
            streak: 'Day Streak',
            dailyInsights: 'Daily AI Insights History',
            batteryStatus: {
                ready: 'Ready for action',
                good: 'Feeling good',
                tired: 'Slightly tired',
                rest: 'Need rest'
            },
            thisMonth: 'this month',
            need_more_data: 'Not enough data for analysis. Please fill the modules.',
            analysis_error: 'Error during system analysis. Please check the status of services.',
            system_ready: 'AURA AI system is ready',
            modules: {
                finance: "Finance",
                health: "Health",
                family: "Family",
                mind: "Mind",
                food: "Food"
            }
        },
        butterfly: {
            title: 'Butterfly Effect',
            subtitle: 'How your daily choices ripple across your life ecosystem',
            analyzing: 'Analyzing correlations across 8 modules...',
            lifeHarmony: 'Life Harmony',
            keyInsights: 'Key Insights',
            noCorrelations: 'No significant correlations detected yet',
            keepLogging: 'Keep logging data across your modules to unlock insights',
            confident: 'confident',
            fixThis: 'Fix This',
            states: {
                harmonic: 'Harmonic Flow',
                fragmented: 'Fragmented',
                disconnected: 'Disconnected'
            },
            descriptions: {
                harmonic: 'Your life modules are working in beautiful synergy',
                fragmented: 'Some areas need attention to restore balance',
                disconnected: 'Critical: Multiple areas require immediate focus'
            },
            insights: {
                sleepProductivityNegative: (sleep, productivity) => `Poor sleep (${sleep}) → Low productivity (${productivity})`,
                sleepProductivityPositive: (sleep, productivity) => `Great sleep (${sleep}) → High productivity (${productivity})`,
                financeMindNegative: (stress, mood) => `Financial stress (${stress}) → Low mood (${mood}/100)`,
                foodHealthNegative: (calories, energy) => `Undereating (${calories}) → Low energy (${energy}% body battery)`,
                foodHealthPositive: (protein, energy) => `Excellent nutrition (${protein}) → High energy (${energy}% body battery)`,
                focusInterestsPositive: (focus, streak) => `Deep work (${focus} min today) → Strong learning habit (${streak} day streak)`,
                familyMindPositive: (members, mood) => `Active family hub (${members} members) → Positive mood (${mood}/100)`
            },
            actions: {
                sleep: "Improve sleep quality tonight to boost tomorrow's focus",
                finance: "Review budget and create emergency fund plan",
                food: "Add a protein-rich snack to restore energy"
            }
        },
        settings: {
            title: 'Settings',
            lang: 'Language / Til',
            notifs: 'Notifications',
            dailyBrief: 'Daily Briefing (08:00)',
            focusAlerts: 'Focus Alerts',
            familyUpdates: 'Family Updates',
            system: 'System',
            export: 'Export All Data',
            reset: "Reset Account",
            currentLocale: "Current Locale:",
            freePlan: "FREE",
            justNow: "Just now",
            dailyBriefDesc: "Morning summary at 08:00",
            focusAlertsDesc: "Reminders to start focus sessions",
            familyUpdatesDesc: "When family members complete tasks",
            exportSuccess: "✅ Data Exported Successfully!",
            resetScheduled: "⚠️ Account Reset Scheduled",
            logType: "TYPE",
            logDevice: "DEVICE",
            logTime: "TIME",
            logLogin: "LOGIN",
            logWebDashboard: "Web Dashboard",
            profile: 'Member since',
            securityLog: 'Security Audit Log',
            logout: 'Log Out',
            yesterday: 'Yesterday',
            today: 'Today',
            selectDate: 'Select Date'
        },
        family: {
            title: 'Family Hub',
            subtitle: 'Digital bridge between generations.',
            readOnly: 'Family History Locked',
            readOnlyDesc: 'Past activities cannot be modified.',
            liveHub: 'Live Hub',
            genealogy: 'Genealogy',
            smartParenting: 'Smart Parenting Console',
            requests: 'Requests',
            approve: 'Approve',
            deny: 'Deny',
            approved: 'Approved',
            reward: 'Reward',
            overallMood: 'Overall Mood',
            activeQuests: 'Active Quests',
            familyXP: 'Family XP',
            gen1: 'Generation 1 (Roots)',
            gen2: 'Generation 2 (Guardians)',
            gen3: 'Generation 3 (Future)',
            backToHub: 'Back to Family Hub',
            geneticProfile: 'Genetic Profile',
            safetyMonitor: 'Safety Monitor',
            emergencyCall: 'EMERGENCY CALL',
            parentalControls: 'Parental Controls',
            activityLog: 'Activity History',
            task: 'Task',
            date: 'Date',
            xp: 'XP'
        },
        finance: {
            title: 'Finance',
            subtitle: 'Master your wealth.',
            readOnly: 'Context Archived',
            readOnlyDesc: 'Past entries are locked for data integrity.',
            totalBalance: 'Total Balance',
            monthlyBudget: 'Monthly Budget',
            savingsGoal: 'Savings Goal',
            recentTransactions: 'Recent Transactions',
            addTransaction: 'Add Transaction',
            dailyAnalysis: 'Daily Analysis',
            dailyAnalysisText: 'High pending on "Food" today matches your high stress levels. Recommended: Cook at home tomorrow.',
            spendBreakdown: 'Spend Breakdown',
            viewAll: 'View All',
            investment: 'Investment',
            credit: 'Credit',
            debt: 'Debt',
            confirmPaymentsInstruction: 'Please confirm the following payments:',
            centralBankRate: 'CENTRAL BANK RATE',
            realTimeCurrency: 'Real-time exchange rates',
            liabilities: 'LIABILITIES',
            assets: 'ASSETS',
            initialAmount: 'Initial Amount',
            byCategory: 'by Category',
            debtsPlusCredits: 'Debts + Credits',
            returnPlusDeposits: 'Debt Returns + Deposits',
            addDebt: '+ Add Debt',
            waitingForData: 'Waiting for data...',
            vsLastMonth: 'vs last month',
            used: 'Used',
            left: 'Left',
            archivedDays: 'Archived Days',
            dayClosed: 'Day Closed',
            spent: 'Spent',
            days: 'Days',
            weeks: 'Weeks',
            months: 'months',
            years: 'years',
            enterGoal: 'Enter your financial goal',
            deadline: 'Deadline',
            achieved: 'Achieved',
            noFunds: 'No funds',
            limit: 'Limit',
            target: 'Target',
            current: 'Current',
            perMonth: 'Per Month',
            incomeInsufficient: 'Income insufficient',
            iOwe: 'I owe',
            owedToMe: 'Owed to me',
            personName: 'Person (From/To)',
            fullNamePlaceholder: 'Full Name',
            amount: 'Amount',
            currency: 'Currency',
            dateTaken: 'Date Taken',
            dateGiven: 'Date Given',
            returnDate: 'Return Date',
            addCredit: 'Add Credit',
            addDeposit: 'Add Deposit',
            creditName: 'Credit Name',
            creditNamePlaceholder: 'e.g. Mortgage, iPhone',
            depositName: 'Deposit Name',
            depositNamePlaceholder: 'e.g. Safety Net, Car',
            totalAmount: 'Total Amount',
            currentAmount: 'Current Amount',
            incomeHistoryEmpty: 'No income history.',
            incomeHistoryEmptyDesc: 'Add your first income transaction to start tracking your progress towards your goals.',
            expenseHistoryEmpty: 'No expense history.',
            expenseHistoryEmptyDesc: 'Set a monthly budget to control your spending and see real-time analysis here.',
            incomePlan: 'INCOME PLAN',
            expenseControl: 'EXPENSE CONTROL',
            voiceFeedback: {
                listening: 'Listening...',
                processing: 'Processing AI Command...',
                done: '✅ Transaction Added!'
            },
            dailyFlow: 'Daily Flow',
            advancedStats: 'Advanced Statistics',
            incomeBudget: 'Income Budget',
            expenseBudget: 'Expense Budget',
            targetIncome: 'Target Income',
            limitExpense: 'Expense Limit',
            ultimateGoalTitle: 'ULTIMATE GOAL',
            currentStatus: 'CURRENT STATUS',
            timeLeft: 'Time Remaining (AI):',
            remainingTime: 'Time Remaining (AI)',
            deadlineExpired: 'DEADLINE EXPIRED',
            paymentSuccess: 'Payment processed successfully!',
            depositsEmpty: 'No Deposits Available',
            creditsEmpty: 'No Credits Available',
            debtsEmpty: 'No Debts Available',
            confirm: 'Confirm',
            confirmPayment: 'Confirm Payment',
            todayPayments: 'Today\'s Payments',
            monthlyPayment: 'Monthly Payment',
            paymentDay: 'Payment Day (Date)',
            interestRate: 'Annual Interest (%)',
            termMonths: 'Term (Months)',
            calculationMethod: 'Calculation Method',
            annuity: 'Annuity (Equal)',
            differential: 'Differential (Decreasing)',
            add: 'Add',
            yearlyProfit: 'Yearly Profit (%)',
            depositDeadline: 'Deposit Deadline',
            daysInMonth: '1-31',
            monthlyProfitChoice: 'Monthly Profit Withdrawal',
            expectedMonthlyProfit: 'Expected Monthly Profit',
            startDate: 'Start Date',
            fillAllFields: 'Please fill all fields',
            depositOpened: 'Deposit Opened',
            investmentTransfer: 'Investment (Transfer)',
            noDeadline: 'No deadline',
            extendDeadline: "Extend Deadline",
            fromCurrentBalance: "From Current Balance?",
            noExpenseRecord: "No expense recorded (Transfer)",
            markAsIncome: "Will record as New Income",
            addFunds: "Add Funds",
            editGoalTitle: "Edit Financial Goal",
            editBudgetTitle: "Monthly Budget Plan",
            budgetSaved: "Budgets updated successfully!",
            incomeGrowthMessage: "Growth detected! You are approaching your income target. Keep it up! 🚀",
            expenseLimitMessage: "Expense Alert! You have reached your monthly limit! ⚠️",
            incomeAlmostTarget: "Almost there! {val}% of income target achieved.",
            expenseAlmostLimit: "Warning! {val}% of expense limit reached.",
            setNewReturnDate: "Set New Return Date",
            datePlaceholder: 'YYYY-MM-DD or Month Year',
            creditPayment: 'Credit Payment',
            depositProfit: 'Deposit Profit',
            probability: 'Probability',
            aiWealthRoadmap: 'AI WEALTH ROADMAP',
            analysisForGoal: 'Analysis to reach the goal',
            professionalPotentialDescription: (role: string) => `Your expertise as a ${role} is the main driver to reach your financial goals.`,
            professionalPotential: 'PROFESSIONAL POTENTIAL',
            professionalPotentialDesc: 'Your expertise is the main driver to reach your financial goals.',
            recommendations: 'RECOMMENDATIONS',
            increaseInvestments: 'Increase investments by 15%',
            getCertification: 'Get professional certificate',
            additionalIncomeChannel: 'Additional income channel',
            viewFullAnalysis: 'VIEW FULL ANALYSIS',
            qrScanner: 'QR Scanner',
            qrScannerTitle: "QR Receipt Scanner",
            qrScannerDesc: "Point your camera at the QR code or upload a receipt image.",
            qrScannerAction: "Scan Now",
            analyzing: "Analyzing...",
            portfolio: 'Portfolio',
            recentActivity: 'Recent Activity',
            noTransactions: 'No transactions yet',
            aiRoadmapTitle: 'AI WEALTH ROADMAP',
            filesAnalysis: 'Analysis to reach the goal',
            detailedList: 'DETAILED LIST',
            monthlyAnalysisTitle: 'MONTHLY ANALYSIS (SUMMARY)',
            monthlyIncomeTitle: 'MONTHLY INCOME',
            weeklyExpenseStats: 'WEEKLY EXPENSE STATISTICS',
            iOweLabel: 'I OWE',
            owedToMeLabel: 'OWED TO ME',
            repaid: 'REPAID',
            repay: 'Repay',
            extend: 'Extend',
            dayLabel: 'DATE',
            remaining: 'Remaining',
            payNow: 'PAY NOW',
            prepay: 'Prepay',
            collecting: 'Collecting',
            totalCollected: 'Total Collected',
            monthlyPlan: 'Monthly Plan',
            topUp: 'Top Up',
            noData: 'No data yet',
            aiPredictionTitle: 'AI MONTHLY FORECAST',
            predictionPart1: 'You are expected to end this month with',
            predictionPart2: 'profit',
            predictionTrend: (percent: number) => `Your expenses decreased by ${percent}% compared to last week.`,
            predictionGoalAdvice: (goal: string, months: number) => `If you continue at this pace, you can reach the ${goal} goal ${months} months earlier than expected.`,
            predictionDisclaimerText: 'Based on your current spending habits and recurring income.',
            weeklyLabel: 'Weekly',
            monthlyLabel: 'Monthly',
            customLabel: 'Custom',
            analysisSummary: 'Summary of system analysis',
            exportExcel: 'Export to Excel',
            incomeTitle: 'Income',
            expenseTitle: 'Expense',
            principalAmount: "Principal Amount",
            interestAmount: "Interest Amount",
            repaymentSplit: "Payment Split",
            realMoney: "Real Net Worth",
            transTitle: "Title",
            transType: "Type",
            transCategory: "Category",
            depositActionTitle: "Manage Deposit",
            actionAdd: "Top Up",
            actionWithdraw: "Withdraw",
            actionProfit: "Add Profit",
            sourceBalance: "From Balance (-)",
            sourceOutside: "New Income (+)",
            financialStatus: "Financial Status",
            statusStart: "⚪ Starting",
            statusPositive: "✅ Positive",
            statusDanger: "⚠️ Critical",
            statusDescStart: "Not enough data for analysis yet. Add your first income or expense.",
            statusDescPositive: (percent: string) => `You are saving ${percent}% of your income. That's a great result!`,
            statusDescDanger: "Warning! Your expenses exceed your income. Reduce at least 2 unnecessary expenses immediately.",
            recStart: "Add your first transaction (Income or Expense)",
            recSafety: "Build a safety net equal to 3 months of expenses",
            recDeposit: "Open a savings account and start saving",
            recDebt: "Pay off debts faster using the 'Snowball' method",
            recBudget: "Set an income plan (Budget)",
            statusOk: "Everything looks good so far!",
            predictionMsgExcellent: "Great result! You are saving a large part of your income. Consider investing.",
            predictionMsgGood: "Good indicator. Your savings plan is stable. Keep it up.",
            predictionMsgOk: "You are in a positive balance, but optimizing expenses a bit could be beneficial.",
            predictionMsgBad: "Warning! Your expenses are exceeding your income. Review your budget.",
            fromLabel: "From",
            toLabel: "To"
        },
        categories: {
            Salary: "Salary",
            Freelance: "Freelance",
            Investment: "Investment",
            Gift: "Gift",
            OtherIncome: "Other Income",
            Food: "Food",
            Transport: "Transport",
            Shopping: "Shopping",
            Bills: "Bills",
            Health: "Health",
            Education: "Education",
            Leisure: "Leisure",
            Other: "Other",
            creditIn: "Credit (Inflow)",
            depositIn: "Deposit (Inflow)",
            savings: "Savings/Transfer",
            general: "General",
            music: "Music",
            mind: "Mindfulness"
        },
        tasks: {
            title: 'Focus & Tasks',
            subtitle: 'Design your day.',
            newTask: 'New Task',
            taskName: 'Task Name',
            startTime: 'Start Time',
            endTime: 'End Time',
            priority: 'Priority',
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            createTask: 'Create Task',
            calendar: 'Calendar',
            upcomingTasks: 'Upcoming Plans',
            overdue: 'Overdue',
            future: 'Future',
            stats: {
                completedToday: 'Completed Today',
                pending: 'Pending',
                efficiency: 'Efficiency Score'
            },
            sections: {
                today: 'Today',
                upcoming: 'Upcoming',
                completed: 'Completed',
                overdue: 'Overdue',
                future: 'Future'
            },
            aiSuggestion: {
                title: 'AI Insight',
                suggestion: '"Review Monthly Budget" is overdue.',
                add: 'Add +'
            },
            actions: {
                startFocus: 'Start Focus',
                moveToToday: 'Move to Today',
                subtask: 'Subtask',
                move: 'Move',
                focus: 'Focus',
                edit: 'Edit',
                delete: 'Delete',
                promote: 'Promote to Root'
            },
            completedArchive: 'Completed Tasks Archive',
            readOnly: 'Tasks Archived',
            readOnlyDesc: 'Past tasks are read-only.',
            noTasks: 'No tasks for today. Enjoy your day!',
            allClear: 'Everything is clear for now!'
        },
        health: {
            history: 'History',
            title: 'Health & Vitality',
            subtitle: 'Your body is the engine.',
            bodyBattery: {
                title: 'Body Battery',
                fullyCharged: 'You are fully charged! Perfect time for high-intensity tasks or a workout.',
                recharge: 'Consider taking a break to recharge.',
                sleepRestoration: 'Sleep Restoration',
                activeDrain: 'Active Drain',
                stressTax: 'Stress Tax',
                hydrationEfficiency: 'Hydration Efficiency'
            },
            vitals: {
                title: 'Heart Rate',
                stressTitle: 'Stress Level',
                resting: 'Resting',
                heartRateUnit: 'BPM',
                normalRange: 'Within normal range',
                avgLevel: 'Avg Level',
                low: 'Low',
                relaxedState: 'Relaxed State'
            },
            sleep: {
                score: '/ 100',
                quality: 'Restorative Sleep',
                unit: 'Score'
            },
            hydration: {
                title: 'Hydration',
                goal: 'Goal',
                unit: 'ml'
            },
            activity: {
                title: 'Activity',
                stepsToday: 'steps today',
                kcal: 'kcal',
                dist: 'dist'
            },
            trends: {
                title: 'Health Trends (Last 7 Days)',
                stepsHistory: 'Steps History',
                sleepQuality: 'Sleep Quality'
            },
            days: {
                mon: 'Mon',
                tue: 'Tue',
                wed: 'Wed',
                thu: 'Thu',
                fri: 'Fri',
                sat: 'Sat',
                sun: 'Sun'
            },
            biometrics: {
                title: 'Biometrics',
                aiRecTitle: 'AI Recommendation',
                aiRecLose: 'Metabolism boost suggested. AI will adjust calorie goals.',
                aiRecMaintain: 'Steady progress maintained. Keep the rhythm.',
                weight: 'Weight',
                height: 'Height',
                goal: 'Goal',
                lose: 'Lose Weight',
                gain: 'Gain Muscle',
                maintain: 'Maintain Health',
                unitCm: 'cm',
                unitKg: 'kg',
                goalLabel: 'Choose your health goal'
            },
            aiAdvisor: {
                title: 'AI Health Advisor',
                analyzing: 'AI is analyzing your metrics...',
                hydrationLow: 'Your hydration level is low. Drink 2 more glasses of water to boost efficiency.',
                stressHigh: 'Stress levels are high. Consider a 10-minute meditation breathing session.',
                sleepLow: 'Poor recovery detected. Prioritize rest today and avoid heavy workouts.',
                allGood: 'All systems operational. Your recovery matches your activity level perfectly!'
            },
            readOnly: 'Health Data Locked',
            readOnlyDesc: 'Historical biometrics cannot be modified.',
            loading: "Loading Health Data...",
            simulate: "Simulate 21:00",
            batteryStatus: {
                ready: "Ready",
                good: "Feeling Good",
                tired: "A Bit Tired",
                rest: "Need Rest"
            },
            voiceAlertSteps: "steps logged!",
            voiceAlertSleep: "hours of sleep logged!",
            voiceAlertWater: "ml of water added!"
        },
        food: {
            title: "Food AI",
            subtitle: "Fuel your body intelligently.",
            readOnly: 'Daily Log Archived',
            readOnlyDesc: 'Past meals cannot be edited or added.',
            calories: "Calories",
            macros: "Macros",
            protein: "Protein",
            carbs: "Carbs",
            fats: "Fats",
            mealLogs: "Meal Logs",
            scanMeal: "Scan Meal",
            dailyLog: "Daily Log",
            historyModalTitle: "Meal History (Past 7 Days)",
            cameraPrompt: "Point camera at food",
            analyzing: "AI Analyzing...",
            instantAdviceTitle: "Instant Advice",
            targetAdvice: "Great protein intake today! Try adding more fiber (vegetables) to your dinner.",
            scanError: "Could not identify food. Please try again.",
            aiDetected: "AI Detected",
            eatQuestion: "Did you eat this?",
            yes: "Yes",
            no: "No",
            streak: "DAY STREAK",
            loading: "Loading Nutrition...",
            alertArchived: "You cannot add/delete items for archived days.",
            mealQuick: "Quick Log",
            mealSnack: "Snack",
            mealBreakfast: "Breakfast",
            mealLunch: "Lunch",
            mealDinner: "Dinner",
            kcal: "kcal",
            unitG: "g"
        },
        mind: {
            title: "Mind Sanctuary",
            subtitle: "Mental clarity and focus.",
            readOnly: 'Mind Context Locked',
            readOnlyDesc: 'Past mental states are archived.',
            weeklyFocus: "Weekly Focus",
            focusingOn: "Focusing on:",
            focus: "Focus",
            break: "Break",
            moodSphere: "Mood Sphere",
            moodSphereDesc: "Drag to adjust (<30 = Zen Mode)",
            resonanceBreathing: "Resonance Breathing",
            startSession: "Start Session",
            stopSession: "Stop Session",
            inhale: "Inhale",
            exhale: "Exhale",
            hold: "Hold",
            ready: "Ready",
            aiSummaryTitle: "AI Daily Summary",
            aiSummaryText: "Your mood has been stable today. Focus efficiency is up 15% from yesterday. Keep maintaining this rhythm.",
            historyModalTitle: "Mind Journal (Mood History)",
            recentSessions: "Recent Focus Sessions",
            moodTrends: "Mood Trends",
            zenTitle: "Breathe",
            zenSubtitle: "Analysis and charts are hidden. Focus on now.",
            whyFeeling: "Why are you feeling this way?",
            exitZen: "I'm feeling better now (Exit Zen Mode)",
            reasons: {
                tired: "Tired",
                anxious: "Anxious",
                overwhelmed: "Overwhelmed",
                justBecause: "Just Because"
            },
            loadingState: "Loading Sanctuary...",
            saved: "Saved",
            saveMood: "Save Mood",
            zenMapLeft: "Negative (Zen)",
            zenMapRight: "Positive",
            aiLoading: "AI is analyzing your state...",
            aiPoweredBy: "AURA Strategic Mind"
        },
        focus: {
            minutes: 'Minutes',
            done: 'Done'
        },
        interests: {
            title: "Interests & Growth",
            subtitle: "Expand your horizons.",
            readOnly: 'Progress Locked',
            readOnlyDesc: 'Past logs cannot be modified.',
            historyModalTitle: "Hobby Practice Log",
            practiceLog: "Practice Log",
            streak: "Day Streak",
            newHobby: "+ New Hobby",
            aiRecommendation: "AI Recommendation: Pottery",
            aiReason: "Based on your \"Design\" interest, you might enjoy tactile creativity.",
            tryThis: "Try this",
            hoursSpent: "hrs spent",
            nextLevel: "Next: Level",
            discoverNew: "Discover New Passion",
            level: "Lvl",
            addHobbyTitle: "Add New Hobby",
            hobbyName: "Name",
            category: "Category",
            loading: "Loading Hobbies...",
            categories: {
                general: "General",
                art: "Art",
                physical: "Physical",
                mind: "Mind",
                music: "Music"
            },
            placeholderName: "e.g. Pottery, Chess, Piano...",
            positive: "Positive",
            negative: "Negative",
            type: "Type",
            trackingMode: "Tracking Mode",
            trackingFrequency: "Frequency (+1)",
            trackingFrequencyDesc: "Counts every occurrence (e.g. rolled cigarettes).",
            trackingBinary: "Once (Yes/No)",
            trackingBinaryDesc: "Recorded once per day (e.g. woke up late).",
            newHobbyCardTitle: "New Hobby",
            newHobbyCardDesc: "For positive growth",
            positiveInterests: "Positive Interests",
            negativeHabits: "Controlled Habits",
            dailyActivities: "Daily Activities",
            aiRecStatus: "AI Recommendation Status",
            statCount: "COUNT",
            statDuration: "DURATION",
            loyaltyXP: "LOYALTY XP",
            done: "Done",
            logCount: "LOG (+1)",
            log: "LOG",
            status: "Status",
            times: "times",

            totalHours: "h TOTAL",
            totalControl: "h CONTROL",
            logDurationQuestion: "How many minutes did you practice?",
            aiRecTitleCorrection: "AURA Correction",
            aiRecTitleGrowth: "AURA Growth",
            aiRecDone: "Completed",
            aiRecTask: "Task",
            aiRecAddTask: "Task",
            noActivities: "No activities recorded today.",
            selectHobby: "Select a hobby above to log activity.",
            notDone: "Not Done",
            todayLabel: "Today",
            dailyStats: "DAILY STATS"
        },
        liveness_section: {
            title: "LIFE BEACON",
            subtitle: "Bridging the legacy of care.",
            desc: "Passive monitoring for your loved ones. If no activity is detected within the set window, we'll alert the family. Ideal for senior safety.",
            cta: "Set Up Beacon",
            silent_mode: 'Silent Mode',
            silent_mode_desc: 'Pause during sleep hours',
            activity_log: 'Pulse History',
            panic_alert: 'PANIC ALERT',
            panic_confirm: 'Send emergency alert now?',
            countdown_prefix: 'Next check in:',
            checkInPrompt: 'Azamat Ota, are you okay? Please confirm.',
            familyAlert: (hours: number) => `Alert: Your father has not checked in for ${hours} hours!`
        },
    },
    uz: {
        common: {
            refresh: 'Yangilash',
            save: 'Saqlash',
            cancel: 'Bekor qilish',
            back: 'Orqaga',
            viewHistory: 'Tarixni ko\'rish',
            history: 'Tarix',
            today: 'Bugun',
            yesterday: 'Kecha',
            done: 'Bajarildi',
            user: 'Foydalanuvchi'
        },
        nav: {
            hero: 'Bosh sahifa',
            problem: 'Muammo',
            solution: 'Yechim',
            butterfly: 'Kapalak',
            platforms: 'Platformalar',
            family: 'Oila'
        },
        sidebar: {
            dashboard: 'Bosh sahifa',
            family: 'Oila',
            finance: 'Moliya',
            tasks: 'Vazifalar',
            health: 'Salomatlik',
            food: 'Ovqatlanish',
            mind: 'Diqqat',
            interests: 'Qiziqishlar',
            liveness: 'Hayot Signali',
            settings: 'Sozlamalar',
            archived: 'Arxivlangan'
        },
        home: {
            deepWork: 'DIQQAT SESSIYASI',
            endSession: 'Sessiyani yakunlash',
            rainOn: 'Yomg\'ir',
            ambientOff: 'Ovoz o\'chirilgan',
            voiceCommand: 'Ovozli buyruq',
            listening: 'Eshitilmoqda...',
            analyzing: 'Tizim tahlil qilinmoqda...',
            viewHistory: 'Tarixni ko\'rish',
            simStress: 'Sim Stress',
            simCalm: 'Sim Tinch',
            enterZen: 'Zen Kirish',
            chronos: 'Xronos',
            atmosphere: 'Atmosfera',
            clearSky: 'Musaffo Osmon',
            wealthPulse: 'Boylik Pulsi',
            familyHub: 'Oila Markazi',
            approval: '1 Tasdiq',
            kidsTask: "Bola vazifasi bajarildi",
            waiting: 'Ota-ona tasdiqlashi kutilmoqda',
            vitality: 'Hayotiylik',
            geneticRisk: '⚠️ Genetik Xavf',
            nutrition: 'Ovqatlanish',
            hobbies: 'Hobbilar',
            streak: 'Kunlik Seriya',
            dailyInsights: 'Kunlik AI Xulosalari',
            batteryStatus: {
                ready: 'Harakatga tayyor',
                good: 'Yaxshi his qilish',
                tired: 'Biroz charchagan',
                rest: 'Dam olish kerak'
            },
            thisMonth: 'bu oy',
            need_more_data: "Tahlil uchun ma'lumotlar yetarli emas. Iltimos, modullarni to'ldiring.",
            analysis_error: "Tizim tahlilida xatolik yuz berdi. Iltimos, servislar holatini tekshiring.",
            system_ready: "AURA AI tizimi tayyor",
            modules: {
                finance: "Moliya",
                health: "Salomatlik",
                family: "Oila",
                mind: "Ruhiyat",
                food: "Taomnoma"
            }
        },
        butterfly: {
            title: 'Kapalak Effekti',
            subtitle: 'Kundalik tanlovlaringiz hayot ekotizimingizga qanday ta\'sir qilishi',
            analyzing: '8 ta modul bo\'yicha bog\'liqliklar tahlil qilinmoqda...',
            lifeHarmony: 'Hayot Uyg\'unligi',
            keyInsights: 'Asosiy Xulosalar',
            noCorrelations: 'Hozircha sezilarli bog\'liqliklar aniqlanmadi',
            keepLogging: 'Xulosalarni ochish uchun modullarda ma\'lumotlarni kiritishda davom eting',
            confident: 'ishonch',
            fixThis: 'Tuzatish',
            states: {
                harmonic: 'Garmonik Oqim',
                fragmented: 'Parchalangan',
                disconnected: 'Bog\'lanmagan'
            },
            descriptions: {
                harmonic: 'Hayot modullaringiz go\'zal uyg\'unlikda ishlamoqda',
                fragmented: 'Muvozanatni tiklash uchun ba\'zi sohalarga e\'tibor qaratish lozim',
                disconnected: 'Kritik: Bir nechta sohalar zudlik bilan e\'tibor talab qiladi'
            },
            insights: {
                sleepProductivityNegative: (sleep, productivity) => `Yomon uyqu (${sleep}) → Past mahsuldorlik (${productivity} bajarilgan vazifalar)`,
                sleepProductivityPositive: (sleep, productivity) => `Ajoyib uyqu (${sleep}) → Yuqori mahsuldorlik (${productivity} bajarilgan vazifalar)`,
                financeMindNegative: (stress, mood) => `Moliyaviy stress (${stress}) → Past kayfiyat (${mood}/100)`,
                foodHealthNegative: (calories, energy) => `Kam ovqatlanish (kaloriya maqsadining ${calories}) → Kam quvvat (${energy}% tana quvvati)`,
                foodHealthPositive: (protein, energy) => `Ajoyib ovqatlanish (protein maqsadining ${protein}) → Yuqori quvvat (${energy}% tana quvvati)`,
                focusInterestsPositive: (focus, streak) => `Chuqur ish (bugun ${focus} daqiqa) → Kuchli o'rganish odati (${streak} kunlik seriya)`,
                familyMindPositive: (members, mood) => `Faol oila markazi (${members} a'zolar) → Ijobiy kayfiyat (${mood}/100)`
            },
            actions: {
                sleep: "Ertangi diqqatni oshirish uchun bugun uyqu sifatini yaxshilang",
                finance: "Byudjetni ko'rib chiqing va favqulodda jamg'arma rejasini tuzing",
                food: "Energiyani tiklash uchun oqsilga boy gazak qo'shing"
            }
        },
        settings: {
            title: 'Sozlamalar',
            lang: 'Til / Language',
            notifs: 'Bildirishnomalar',
            dailyBrief: 'Kunlik Xulosa (08:00)',
            focusAlerts: 'Fokus Eslatmalari',
            familyUpdates: 'Oila Yangiliklari',
            system: 'Tizim',
            export: 'Ma\'lumotlarni Yuklash',
            reset: "Hisobni tiklash",
            currentLocale: "Joriy til:",
            freePlan: "BEPUL",
            justNow: "Hozirgina",
            dailyBriefDesc: "Ertalabki xulosa soat 08:00 da",
            focusAlertsDesc: "Fokus seanslarini boshlash uchun eslatmalar",
            familyUpdatesDesc: "Oila a'zolari vazifalarni bajarganda",
            exportSuccess: "✅ Ma'lumotlar muvaffaqiyatli eksport qilindi!",
            resetScheduled: "⚠️ Hisobni o'chirish rejalashtirildi",
            logType: "TUR",
            logDevice: "QURILMA",
            logTime: "VAQT",
            logLogin: "KIRISH",
            logWebDashboard: "Veb Panel",
            profile: 'A\'zo bo\'lgan sana',
            securityLog: 'Xavfsizlik Tarixi',
            logout: 'Chiqish',
            yesterday: 'Kecha',
            today: 'Bugun',
            selectDate: 'Sanani tanlash'
        },
        family: {
            title: 'Oila Markazi',
            subtitle: 'Avlodlar o\'rtasidagi raqamli ko\'prik.',
            readOnly: 'Oila Tarixi Arxivlandi',
            readOnlyDesc: 'Ma\'lumotlar yaxlitligi uchun o\'tmish bloklangan.',
            liveHub: ' jonli Markaz',
            genealogy: 'Shajara',
            smartParenting: 'Aqlli Ota-ona Konsoli',
            requests: 'So\'rovlar',
            approve: 'Tasdiqlash',
            deny: 'Rad etish',
            approved: 'Tasdiqlandi',
            reward: 'Mukofot',
            overallMood: 'Umumiy Kayfiyat',
            activeQuests: 'Faol Kvestlar',
            familyXP: 'Oila XP',
            gen1: '1-Avlod (Ildizlar)',
            gen2: '2-Avlod (Posbonlar)',
            gen3: '3-Avlod (Kelajak)',
            backToHub: 'Oila Markaziga qaytish',
            geneticProfile: 'Genetik Profil',
            safetyMonitor: 'Xavfsizlik Monitori',
            emergencyCall: 'FVQ QO\'NG\'IROQ',
            parentalControls: 'Ota-ona Nazorati',
            activityLog: 'Faoliyat Tarixi',
            task: 'Vazifa',
            date: 'Sana',
            xp: 'XP'
        },
        finance: {
            title: 'Moliya',
            subtitle: 'Boyligingizni boshqaring.',
            readOnly: 'Moliya Tarixi Arxivlandi',
            readOnlyDesc: 'O\'tmishdagi ma\'lumotlar yaxlitlik uchun bloklangan.',
            totalBalance: 'Umumiy Balans',
            monthlyBudget: 'Oylik Byudjet',
            savingsGoal: 'Jamg\'arma Maqsadi',
            recentTransactions: 'Oxirgi O\'tkazmalar',
            addTransaction: 'O\'tkazma Qo\'shish',
            dailyAnalysis: 'Kunlik Tahlil',
            dailyAnalysisText: 'Bugun "Ovqat" uchun xarajat yuqori bo\'lishi kutilmoqda. Tavsiya: Ertaga uyda ovqatlaning.',
            spendBreakdown: 'Xarajatlar Taqsimoti',
            viewAll: 'Hammasini Ko\'rish',
            investment: 'Investitsiya',
            credit: 'Kredit',
            debt: 'Qarz',
            confirmPaymentsInstruction: 'Iltimos, quyidagi to\'lovlarni tasdiqlang:',
            centralBankRate: 'MARKAZIY BANK KURSI',
            realTimeCurrency: 'Real vaqtdagi valyuta kurslari',
            liabilities: 'MAJBURIYATLAR',
            assets: 'AKTIVLAR',
            initialAmount: 'Boshlang\'ich summa',
            byCategory: 'kategoriya bo\'yicha',
            debtsPlusCredits: 'Qarzlar + Kreditlar',
            returnPlusDeposits: 'Qarz Qaytarish + Omonatlar',
            addDebt: '+ Qarz Qo\'shish',
            waitingForData: 'Ma\'lumotlar kutilmoqda...',
            vsLastMonth: 'o\'tgan oyga nisbatan',
            used: 'Ishlatildi',
            left: 'Qoldi',
            archivedDays: 'Arxivlanan Kunlar',
            dayClosed: 'Kun yopildi',
            spent: 'Sarflandi',
            days: 'kun',
            weeks: 'Hafta',
            months: 'oy',
            years: 'yil',
            enterGoal: 'Moliyaviy maqsadingizni kiriting',
            deadline: 'Muddat',
            achieved: 'Erishildi',
            noFunds: 'Mablag\' yo\'q',
            limit: 'Limit',
            target: 'Maqsad',
            current: 'Hozirgi',
            perMonth: 'Oyiga',
            incomeInsufficient: 'Daromad yetarli emas',
            iOwe: 'Men qarzman',
            owedToMe: 'Mendan qarz',
            personName: 'Shaxs (Kimdan/Kimga)',
            fullNamePlaceholder: 'Ism Familiya',
            amount: 'Summa',
            currency: 'Valyuta',
            dateTaken: 'Olingan sana',
            dateGiven: 'Berilgan sana',
            returnDate: 'Qaytarish sanasi',
            addCredit: 'Kredit Qo\'shish',
            addDeposit: 'Omonat Qo\'shish',
            creditName: 'Kredit Nomi',
            creditNamePlaceholder: 'Masalan: Ipoteka, iPhone',
            depositName: 'Omonat Nomi',
            depositNamePlaceholder: 'Masalan: Yostiqcha, Mashina',
            totalAmount: 'Jami Summa',
            currentAmount: 'Joriy Summa',
            incomeHistoryEmpty: 'Daromadlar tarixi yo\'q.',
            incomeHistoryEmptyDesc: 'Maqsadlaringizga erishishni kuzatish uchun birinchi daromad o\'tkazmasini qo\'shing.',
            expenseHistoryEmpty: 'Xarajatlar tarixi yo\'q.',
            expenseHistoryEmptyDesc: 'Xarajatlaringizni nazorat qilish va real vaqtda tahlilni ko\'rish uchun oylik byudjet belgilang.',
            incomePlan: 'Daromad Rejasi',
            expenseControl: 'Xarajat Nazorati',
            voiceFeedback: {
                listening: 'Eshitilmoqda...',
                processing: 'AI buyruqni qayta ishlashmoqda...',
                done: '✅ O\'tkazma qo\'shildi!'
            },
            dailyFlow: 'Kunlik Oqim',
            advancedStats: 'Kengaytirilgan Statistika',
            incomeBudget: 'Daromad Byudjeti',
            expenseBudget: 'Xarajat Byudjeti',
            targetIncome: 'Maqsadli Daromad',
            limitExpense: 'Xarajat Limiti',
            ultimateGoalTitle: 'YAKUNIY MAQSAD',
            currentStatus: 'HOZIRGI HOLAT',
            timeLeft: 'Qolgan vaqt (AI):',
            remainingTime: 'Qolgan vaqt (AI)',
            deadlineExpired: 'MUDDAT TUGADI',
            paymentSuccess: 'To\'lov muvaffaqiyatli amalga oshirildi!',
            depositsEmpty: 'Omonatlar mavjud emas',
            creditsEmpty: 'Kreditlar mavjud emas',
            debtsEmpty: 'Qarzlar mavjud emas',
            confirm: 'Tasdiqlash',
            confirmPayment: 'To\'lovni Tasdiqlash',
            todayPayments: 'Bugungi To\'lovlar',
            monthlyPayment: 'Oylik To\'lov',
            paymentDay: 'To\'lov Sanasi (Kun)',
            interestRate: 'Yillik Foiz (%)',
            termMonths: 'Muddat (Oy)',
            calculationMethod: 'Hisoblash Usuli',
            annuity: 'Annuitet (Bir Xil)',
            differential: 'Differensial (Kamayuvchi)',
            add: 'Qo\'shish',
            yearlyProfit: 'Yillik Daromad (%)',
            depositDeadline: 'Omonat Muddati',
            daysInMonth: '1-31',
            monthlyProfitChoice: 'Oyma-oy Foyda Olish',
            expectedMonthlyProfit: 'Kutilayotgan Oylik Foyda',
            startDate: 'Boshlanish Sanasi',
            fillAllFields: 'Iltimos, barcha maydonlarni to\'ldiring',
            depositOpened: 'Omonat Ochildi',
            investmentTransfer: 'Investitsiya (Transfer)',
            noDeadline: 'Muddatsiz',
            extendDeadline: "Muddatni uzaytirish",
            fromCurrentBalance: "Joriy balansdanmi?",
            noExpenseRecord: "Xarajat sifatida yozilmaydi (O'tkazma)",
            markAsIncome: "Yangi daromad deb yoziladi",
            addFunds: "Mablag' qo'shish",
            editGoalTitle: "Moliyaviy maqsadni tahrirlash",
            editBudgetTitle: "Oylik byudjet rejasi",
            budgetSaved: "Byudjetlar muvaffaqiyatli saqlandi!",
            incomeGrowthMessage: "O'sish kuzatilmoqda! Siz daromad maqsadingizga yaqinlashyapsiz. To'xtamang! 🚀",
            expenseLimitMessage: "Xarajat ogohlantirishi! Siz oylik xarajat limitingizga yetdingiz! ⚠️",
            incomeAlmostTarget: "Deyarli yetdingiz! Daromad maqsadining {val}% i bajarildi.",
            expenseAlmostLimit: "Diqqat! Xarajat limitingizning {val}% iga yetdingiz.",
            setNewReturnDate: "Yangi qaytarish sanasini belgilash",
            datePlaceholder: 'YYYY-OO-KK yoki Oy Yil',
            creditPayment: 'Kredit To\'lovi',
            depositProfit: 'Omonat Foydasi',
            probability: 'Ehtimollik',
            aiWealthRoadmap: 'AI BOYLIQ YO\'L XARITASI',
            analysisForGoal: 'Maqsadga erishish uchun tahlil',
            professionalPotentialDescription: (role: string) => `Sizning ${role} sifatidagi tajribangiz moliyaviy maqsadlaringizga erishishning asosiy omilidir.`,
            professionalPotential: 'PROFESSIONAL POTENTSIAL',
            professionalPotentialDesc: 'Sizning tajribangiz moliyaviy maqsadlarga erishishning asosiy omilidir.',
            recommendations: 'TAVSIYALAR',
            increaseInvestments: 'Investitsiyalarni 15% ga oshiring',
            getCertification: 'Professional sertifikat olish',
            additionalIncomeChannel: 'Qo\'shimcha daromad manbai',
            viewFullAnalysis: 'TO\'LIQ TAHLILNI KO\'RISH',
            qrScanner: "QR Skaner",
            qrScannerTitle: "QR Chek Skaneri",
            qrScannerDesc: "Kamerani QR kodga qarating yoki chek rasmini yuklang.",
            qrScannerAction: "Hozir Skanerlash",
            analyzing: "Tahlil qilinmoqda...",
            portfolio: "Moliyaviy Portfel",
            recentActivity: 'Oxirgi Faoliyat',
            noTransactions: 'Hali o\'tkazmalar yo\'q',
            aiRoadmapTitle: 'AI BOYLIQ YO\'L XARITASI',
            filesAnalysis: 'Maqsadga erishish uchun tahlil',
            detailedList: 'BATAFSIL RO\'YXAT',
            monthlyAnalysisTitle: 'OYLIK TAHLIL (JAMLANMA)',
            monthlyIncomeTitle: 'OYLIK DAROMAD',
            weeklyExpenseStats: 'HAFTALIK XARAJAT STATISTIKASI',
            iOweLabel: 'MEN QARZDORMAN',
            owedToMeLabel: 'MENDAN QARZ',
            repaid: 'QAYTARILDI',
            repay: 'Qaytarildi',
            extend: 'Uzaytirish',
            dayLabel: 'SANA',
            remaining: 'Qoldiq',
            payNow: 'TO\'LOVNI QILISH',
            prepay: 'Oldindan To\'lash',
            collecting: 'Yig\'ilmoqda',
            totalCollected: 'Jami Yig\'ildi',
            monthlyPlan: 'Oylik Reja',
            topUp: 'Hisobni To\'ldirish',
            noData: 'Hali ma\'lumot yo\'q',
            aiPredictionTitle: 'AI OYLIK PROGNOZ',
            predictionPart1: 'Siz bu oyni',
            predictionPart2: 'foyda bilan yakunlashingiz kutilmoqda',
            predictionTrend: (percent: number) => `Xarajatlaringiz o'tgan haftaga nisbatan ${percent}% ga kamaygan.`,
            predictionGoalAdvice: (goal: string, months: number) => `Agar shu tempda davom etsangiz, ${goal} maqsadiga kutilganidan ${months} oy oldin yetishingiz mumkin.`,
            predictionDisclaimerText: 'Joriy xarajat odatlaringiz va takroriy daromadinigizga asoslanib.',
            weeklyLabel: 'Haftalik',
            monthlyLabel: 'Oylik',
            customLabel: 'Oraliq',
            analysisSummary: 'Tizim tahlili xulosasi',
            exportExcel: 'Excelda yuklash',
            incomeTitle: 'Daromad',
            expenseTitle: 'Xarajat',
            principalAmount: "Asosiy qarz",
            interestAmount: "Foizlar",
            repaymentSplit: "To'lov taqsimoti",
            realMoney: "Haqiqiy pulim (Sof)",
            transTitle: "Nomi (Izoh)",
            transType: "Turi",
            transCategory: "Kategoriya",
            depositActionTitle: "Omonatni Boshqarish",
            actionAdd: "To'ldirish",
            actionWithdraw: "Yechish",
            actionProfit: "Foyda",
            sourceBalance: "Balansdan (-)",
            sourceOutside: "Tashqi Kirim (+)",
            financialStatus: "Moliyaviy Holat",
            statusStart: "⚪ Boshlanish",
            statusPositive: "✅ Ijobiy",
            statusDanger: "⚠️ Xavfli",
            statusDescStart: "Sizda hali tahlil uchun yetarli ma'lumot yo'q. Dastlabki daromad yoki xarajatni kiriting.",
            statusDescPositive: (percent: string) => `Siz oyiga daromadingizning ${percent}% qismini saqlab qolmoqdasiz. Bu juda yaxshi natija!`,
            statusDescDanger: "Diqqat! Sizning xarajatlaringiz daromaddan oshib ketdi. Zudlik bilan kamida 2 ta ortiqcha xarajatni qisqartiring.",
            recStart: "Birinchi o'tkazmani (Daromad yoki Xarajat) qo'shing",
            recSafety: "Xavfsizlik yostig'ini 3 oylik xarajat miqdoriga yetkazing",
            recDeposit: "Omonat hisobraqamini oching va jamg'arishni boshlang",
            recDebt: "Qarzlarni \"Qor uyumi\" usulida tezroq yoping",
            recBudget: "Daromad rejasini (Budjet) belgilang",
            statusOk: "Hozircha hammasi joyida!",
            predictionMsgExcellent: "Ajoyib natija! Siz daromadingizning katta qismini saqlab qolmoqdasiz. Investitsiya qilishni o'ylab ko'ring.",
            predictionMsgGood: "Yaxshi ko'rsatkich. Saqlash rejangiz barqaror. Davom eting.",
            predictionMsgOk: "Ijobiy balansdasiz, ammo xarajatlarni biroz optimallashtirish foydali bo'lishi mumkin.",
            predictionMsgBad: "Diqqat! Xarajatlaringiz daromaddan oshmoqda. Byudjetni qayta ko'rib chiqing.",
            fromLabel: "Dan",
            toLabel: "Gacha"
        },
        categories: {
            Salary: "Oylik Maosh",
            Freelance: "Frilans",
            Investment: "Investitsiya",
            Gift: "Sovg'a",
            OtherIncome: "Boshqa Daromad",
            Food: "Oziq-ovqat",
            Transport: "Transport",
            Shopping: "Xaridlar",
            Bills: "To'lovlar (Kommunal)",
            Health: "Sog'liq",
            Education: "Ta'lim",
            Leisure: "Dam olish",
            Other: "Boshqa",
            creditIn: "Kredit (Kirim)",
            depositIn: "Omonat (Kirim)",
            savings: "Omonat/O'tkazma",
            general: "Umumiy",
            music: "Musiqa",
            mind: "Zehn"
        },
        tasks: {
            title: 'Fokus va Vazifalar',
            subtitle: 'Kuningizni rejalashtiring.',
            newTask: 'Yangi Vazifa',
            taskName: 'Vazifa Nomi',
            startTime: 'Boshlash Vaqti',
            endTime: 'Tugash Vaqti',
            priority: 'Muhimlik',
            low: 'Past',
            medium: 'O\'rta',
            high: 'Yuqori',
            createTask: 'Vazifa Yaratish',
            calendar: 'Kalendar',
            upcomingTasks: 'Kelgusi Rejalar',
            overdue: 'Muddati O\'tgan',
            future: 'Kelajak',
            stats: {
                completedToday: 'Bugun Bajarildi',
                pending: 'Kutilmoqda',
                efficiency: 'Samaradorlik'
            },
            sections: {
                today: 'Bugun',
                upcoming: 'Kelgusi',
                completed: 'Bajarilgan',
                overdue: 'Muddati O\'tgan',
                future: 'Kelajak'
            },
            aiSuggestion: {
                title: 'AI Tavsiyasi',
                suggestion: '"Oylik byudjetni ko\'rish" muddati o\'tgan.',
                add: 'Qo\'shish +'
            },
            actions: {
                startFocus: 'Fokusni Boshlash',
                moveToToday: 'Bugunga o\'tkazish',
                subtask: 'Quyi vazifa',
                move: 'Ko\'chirish',
                focus: 'Fokus',
                edit: 'Tahrirlash',
                delete: 'O\'chirish',
                promote: 'Asosiyga O\'tkazish'
            },
            completedArchive: 'Bajarilgan Vazifalar Arxivi',
            readOnly: 'Vazifalar Arxivlandi',
            readOnlyDesc: 'O\'tmishdagi vazifalarni o\'zgartirib bo\'lmaydi.',
            noTasks: 'Bugun uchun vazifalar yo\'q. Kuningiz maroqli o\'tsin!',
            allClear: 'Hozircha hamma narsa silliq!'
        },
        health: {
            history: 'Tarix',
            readOnly: 'Salomatlik Ma\'lumotlari Bloklangan',
            readOnlyDesc: 'Tarixiy biometrik ma\'lumotlarni o\'zgartirib bo\'lmaydi.',
            title: "Sog'lik",
            subtitle: "Harakatda baraka.",
            bodyBattery: {
                title: 'Zaryad',
                fullyCharged: 'Siz to\'liq quvvatlangansiz! Yuqori intensivlikdagi vazifalar yoki mashg\'ulot uchun ajoyib vaqt.',
                recharge: 'Quvvatni tiklash uchun tanaffus qilishni o\'ylab ko\'ring.',
                sleepRestoration: 'Uyqu Tiklanishi',
                activeDrain: 'Faol Xarajat',
                stressTax: 'Stress Yuklamasi',
                hydrationEfficiency: 'Gidratatsiya Samaradorligi'
            },
            vitals: {
                title: 'Yurak urishi',
                stressTitle: 'Stress darajasi',
                resting: 'Dam olishda',
                heartRateUnit: 'urish/daq',
                normalRange: 'Normal diapazonda',
                avgLevel: 'O\'rtacha daraja',
                low: 'Past',
                relaxedState: 'Bo\'shashgan holat'
            },
            sleep: {
                score: '/ 100',
                quality: 'Tiklovchi uyqu',
                unit: 'Ball'
            },
            hydration: {
                title: 'Suv balansi',
                goal: 'Maqsad',
                unit: 'ml'
            },
            activity: {
                title: 'Faoliyat',
                stepsToday: 'bugun qadam',
                kcal: 'kkal',
                dist: 'masofa'
            },
            trends: {
                title: 'Salomatlik tendensiyalari (Oxirgi 7 kun)',
                stepsHistory: 'Qadamlar tarixi',
                sleepQuality: 'Uyqu sifati'
            },
            days: {
                mon: 'Du',
                tue: 'Se',
                wed: 'Chor',
                thu: 'Pay',
                fri: 'Ju',
                sat: 'Shan',
                sun: 'Yak'
            },
            biometrics: {
                title: 'Biometrik ma\'lumotlar',
                aiRecTitle: 'AI Tavsiyasi',
                aiRecLose: 'Metabolizmni tezlashtirish tavsiya etiladi. AI kaloriya maqsadlarini o\'zgartiradi.',
                aiRecMaintain: 'Barqaror rivojlanish saqlanmoqda. Ritmni ushlab turing.',
                weight: 'Vazn',
                height: 'Bo\'y',
                goal: 'Maqsad',
                lose: 'Vazn yo\'qotish',
                gain: 'Vazn orttirish',
                maintain: 'Vaznni saqlash',
                unitCm: 'sm',
                unitKg: "kg",
                goalLabel: 'Salomatlik maqsadini tanlang'
            },
            aiAdvisor: {
                title: 'AI Salomatlik Maslahatchisi',
                analyzing: 'AI ma\'lumotlarni tahlil qilmoqda...',
                hydrationLow: 'Sizning suv balansingiz past. Samaradorlikni oshirish uchun yana 2 stakan suv iching.',
                stressHigh: 'Stress darajasi yuqori. 10 daqiqalik meditatsiya mashg\'ulotini o\'tkazishni tavsiya qilamiz.',
                sleepLow: 'Tiklanish darajasi past. Bugun dam olishga e\'tibor bering va og\'ir mashqlardan qoching.',
                allGood: 'Barcha tizimlar joyida. Sizning tiklanish darajangiz faolligingizga to\'liq mos keladi!'
            },
            loading: "Salomatlik ma'lumotlari yuklanmoqda...",
            simulate: "21:00 simulyatsiya qilish",
            batteryStatus: {
                ready: "Tayyor",
                good: "Yaxshi his qilyapman",
                tired: "Bir oz charchagan",
                rest: "Dam olish vaqti"
            },
            voiceAlertSteps: "qadamlar qayd etildi!",
            voiceAlertSleep: "soat uyqu qayd etildi!",
            voiceAlertWater: "ml suv qo'shildi!"
        },
        food: {
            title: "Taom AI",
            subtitle: "Tanangizni oqilona oziqlantiring.",
            readOnly: 'Kunlik Jurnal Arxivlandi',
            readOnlyDesc: 'O\'tmishdagi ovqatlarni tahrirlab bo\'lmaydi.',
            calories: "Kaloriyalar",
            macros: "Makroslar",
            protein: "Oqsillar",
            carbs: "Uglevodlar",
            fats: "Yog'lar",
            mealLogs: "Taomlar Tarixi",
            scanMeal: "Taomni Skanerlash",
            dailyLog: "Kunlik Jurnal",
            historyModalTitle: "Taomlanish Tarixi (So'nggi 7 kun)",
            cameraPrompt: "Kamerani taomga qarating",
            analyzing: "AI Tahlil qilmoqda...",
            instantAdviceTitle: "Tezkor Maslahat",
            targetAdvice: "Bugungi oqsil miqdori ajoyib! Kechki ovqatga ko'proq kletchatka (sabzavotlar) qo'shishni sinab ko'ring.",
            scanError: "Taomni aniqlab bo'lmadi. Iltimos, qayta urinib ko'ring.",
            aiDetected: "AI Aniqladi",
            eatQuestion: "Buni yedingizmi?",
            yes: "Ha",
            no: "Yo'q",
            streak: "KUNLIK SERIYA",
            loading: "Yuklanmoqda...",
            alertArchived: "Siz arxivlangan kunlar uchun ma'lumot qo'sha olmaysiz.",
            mealQuick: "Tezkor Kiritish",
            mealSnack: "Tamaddi",
            mealBreakfast: "Nonushta",
            mealLunch: "Tushlik",
            mealDinner: "Kechki ovqat",
            kcal: "kkal",
            unitG: "g"
        },
        mind: {
            title: "Zukko Maskani",
            subtitle: "Aqliy tiniqlik va diqqat.",
            readOnly: 'Zehn Konteksti Bloklangan',
            readOnlyDesc: 'O\'tmishdagi ruhiy holatlar arxivlangan.',
            weeklyFocus: "Haftalik Maqsad",
            focusingOn: "Diqqat markazi:",
            focus: "Diqqat",
            break: "Tanaffus",
            moodSphere: "Kayfiyat Sferasi",
            moodSphereDesc: "Sozlash uchun torting (<30 = Zen)",
            resonanceBreathing: "Rezonans Nafas",
            startSession: "Boshlash",
            stopSession: "To'xtatish",
            inhale: "Nafas oling",
            exhale: "Nafas chiqaring",
            hold: "Ushlab turing",
            ready: "Tayyormisiz",
            aiSummaryTitle: "Kunlik AI Xulosasi",
            aiSummaryText: "Bugun kayfiyatingiz barqaror. Diqqat samaradorligi kechagiga qaraganda 15% ga oshdi.",
            historyModalTitle: "Kayfiyat Jurnali (Tarix)",
            recentSessions: "Oxirgi Sessiyalar",
            moodTrends: "Kayfiyat Trendlari",
            zenTitle: "Nafas Oling",
            zenSubtitle: "Tahlillar yashirilgan. Hozirgi onga e'tibor qarating.",
            whyFeeling: "Nega bunday his qilyapsiz?",
            exitZen: "O'zimni yaxshi his qilyapman (Chiqish)",
            reasons: {
                tired: "Charchagan",
                anxious: "Xavotirda",
                overwhelmed: "Ortiqcha yuklangan",
                justBecause: "Shunchaki"
            },
            loadingState: "Yuklanmoqda...",
            saved: "Saqlandi",
            saveMood: "Kayfiyatni Saqlash",
            zenMapLeft: "Salbiy (Zen)",
            zenMapRight: "Ijobiy",
            aiLoading: "AI holatingizni tahlil qilmoqda...",
            aiPoweredBy: "AURA Strategik Ong"
        },
        focus: {
            minutes: 'Minut',
            done: 'Bajarildi'
        },
        interests: {
            title: "Qiziqishlar va Rivojlanish",
            subtitle: "Ufqingizni kengaytiring.",
            readOnly: 'Progress Bloklangan',
            readOnlyDesc: 'O\'tmishdagi jurnallarni o\'zgartirib bo\'lmaydi.',
            historyModalTitle: "Xobbi amaliyot jurnali",
            practiceLog: "Amaliyot jurnali",
            streak: "Kunlik seriya",
            newHobby: "+ Yangi xobbi",
            aiRecommendation: "AI Tavsiyasi: Kulolchilik",
            aiReason: "Sizning \"Dizayn\" qiziqishingizga asoslanib, sizga taktil ijodkorlik yoqishi mumkin.",
            tryThis: "Buni sinab ko'ring",
            hoursSpent: "sarflangan soat",
            nextLevel: "Keyingi: Daraja",
            discoverNew: "Yangi ehtirosni kashf eting",
            level: "Daraja",
            addHobbyTitle: "Yangi xobbi qo'shish",
            hobbyName: "Nomi",
            category: "Kategoriya",
            loading: "Xobbilar yuklanmoqda...",
            categories: {
                general: "Umumiy",
                art: "San'at",
                physical: "Jismoniy",
                mind: "Aql",
                music: "Musiqa"
            },
            placeholderName: "Masalan: Kulolchilik, Shaxmat, Pianino...",
            positive: "Ijobiy",
            negative: "Salbiy",
            type: "Turi",
            trackingMode: "Kuzatuv rejimi",
            trackingFrequency: "Chastota (+1)",
            trackingFrequencyDesc: "Har bir hodisani hisoblaydi (masalan, chekilgan sigaretalar).",
            trackingBinary: "Bir marta (Ha/Yo'q)",
            trackingBinaryDesc: "Kuniga bir marta qayd etiladi (masalan, kech uyg'onish).",
            newHobbyCardTitle: "Yangi xobbi",
            newHobbyCardDesc: "Ijobiy o'sish uchun",
            positiveInterests: "Ijobiy qiziqishlar",
            negativeHabits: "Nazorat qilinadigan odatlar",
            dailyActivities: "Kundalik faoliyatlar",
            aiRecStatus: "AI Tavsiya holati",
            statCount: "SONI",
            statDuration: "DAVOMIYLIGI",
            loyaltyXP: "SADOQAT XP",
            done: "Bajarildi",
            logCount: "LOG (+1)",
            log: "LOG",
            status: "Holat",
            times: "marta",
            totalHours: "h JAMI",
            totalControl: "h NAZORAT",
            logDurationQuestion: "Necha daqiqa mashq qildingiz?",
            aiRecTitleCorrection: "AURA Tuzatish",
            aiRecTitleGrowth: "AURA O'sishi",
            aiRecDone: "Bajarildi",
            aiRecTask: "Vazifa",
            aiRecAddTask: "Vazifa",
            noActivities: "Bugun hech qanday faoliyat qayd etilmadi.",
            selectHobby: "Faoliyatni qayd etish uchun yuqoridan xobbini tanlang.",
            notDone: "Bajarilmadi",
            todayLabel: "Bugun",
            dailyStats: "KUNDALIK STATISTIKA"
        },
        liveness_section: {
            title: "HAYOT SIGNALI",
            subtitle: "Avlodlar g'amxo'rligining raqamli ko'prigi.",
            desc: "Yaqinlaringiz uchun passiv monitoring. Agar belgilangan vaqtda faollik bo'lmasa, oila a'zolari ogohlantiriladi. Keksalar xavfsizligi uchun ideal.",
            cta: "Signalni sozlash",
            silent_mode: 'Tinch rejim',
            silent_mode_desc: 'Uyqu vaqtida to\'xtatish',
            activity_log: 'Signal tarixi',
            panic_alert: 'XAVF BILDIRISHNOMASI',
            panic_confirm: 'Zudlik bilan xabar yuborilsinmi?',
            countdown_prefix: 'Keyingi tekshiruv:',
            checkInPrompt: 'Azamat ota, ahvolingiz yaxshimi? Iltimos, tasdiqlang.',
            familyAlert: (hours: number) => `Ogohlantirish: Otangiz ${hours} soatdan beri aloqaga chiqmadi!`
        },
    },
    ru: {
        common: {
            refresh: 'Обновить',
            save: 'Сохранить',
            cancel: 'Отмена',
            back: 'Назад',
            viewHistory: 'История',
            history: 'История',
            today: 'Сегодня',
            yesterday: 'Вчера',
            done: 'Готово',
            user: 'Пользователь'
        },
        nav: {
            hero: 'Главная',
            problem: 'Проблема',
            solution: 'Решение',
            butterfly: 'Бабочка',
            platforms: 'Платформы',
            family: 'Семья'
        },
        sidebar: {
            dashboard: 'Главная',
            family: 'Семья',
            finance: 'Финансы',
            tasks: 'Задачи',
            health: 'Здоровье',
            food: 'Питание',
            mind: 'Разум',
            interests: 'Интересы',
            liveness: 'Пульс Жизни',
            settings: 'Настройки',
            archived: 'Архивировано'
        },
        home: {
            deepWork: 'СЕССИЯ ФОКУСА',
            endSession: 'Завершить',
            rainOn: 'Дождь',
            ambientOff: 'Без звука',
            voiceCommand: 'Голосовая команда',
            listening: 'Слушаю...',
            analyzing: 'Анализ системы...',
            viewHistory: 'История',
            simStress: 'Сим Стресс',
            simCalm: 'Сим Умиротворение',
            enterZen: 'Войти в Дзен',
            chronos: 'Хронос',
            atmosphere: 'Атмосфера',
            clearSky: 'Ясное небо',
            wealthPulse: 'Пульс Богатства',
            familyHub: 'Семейный центр',
            approval: '1 одобрение',
            kidsTask: "Задача ребенка выполнена",
            waiting: 'Ожидание подтверждения родителей',
            vitality: 'Жизненность',
            geneticRisk: '⚠️ Генетический риск',
            nutrition: 'Питание',
            hobbies: 'Хобби',
            streak: 'Дней подряд',
            dailyInsights: 'Ежедневные инсайты ИИ',
            batteryStatus: {
                ready: 'Готов к действию',
                good: 'Чувствую себя хорошо',
                tired: 'Немного устал',
                rest: 'Нужен отдых'
            },
            thisMonth: 'в этом месяце',
            need_more_data: 'Недостаточно данных для анализа. Пожалуйста, заполните модули.',
            analysis_error: 'Ошибка при анализе системы. Пожалуйста, проверьте состояние сервисов.',
            system_ready: 'Система AURA AI готова',
            modules: {
                finance: "Финансы",
                health: "Здоровье",
                family: "Семья",
                mind: "Разум",
                food: "Питание"
            }
        },
        butterfly: {
            title: 'Эффект Бабочки',
            subtitle: 'Как ваш ежедневный выбор влияет на экосистему вашей жизни',
            analyzing: 'Анализ корреляций по 8 модулям...',
            lifeHarmony: 'Гармония Жизни',
            keyInsights: 'Ключевые Инсайты',
            noCorrelations: 'Значимых корреляций пока не обнаружено',
            keepLogging: 'Продолжайте вводить данные в модули, чтобы разблокировать инсайты',
            confident: 'уверенности',
            fixThis: 'Исправить',
            states: {
                harmonic: 'Гармоничный Поток',
                fragmented: 'Фрагментировано',
                disconnected: 'Разобщено'
            },
            descriptions: {
                harmonic: 'Ваши жизненные модули работают в прекрасной синергии',
                fragmented: 'Некоторые области требуют внимания для восстановления баланса',
                disconnected: 'Критично: Несколько областей требуют немедленного внимания'
            },
            insights: {
                sleepProductivityNegative: (sleep, productivity) => `Плохой сон (${sleep}) → Низкая продуктивность (${productivity} выполненных задач)`,
                sleepProductivityPositive: (sleep, productivity) => `Отличный сон (${sleep}) → Высокая продуктивность (${productivity} выполненных задач)`,
                financeMindNegative: (stress, mood) => `Финансовый стресс (${stress}) → Низкое настроение (${mood}/100)`,
                foodHealthNegative: (calories, energy) => `Недоедание (${calories} от нормы калорий) → Низкая энергия (${energy}% заряда тела)`,
                foodHealthPositive: (protein, energy) => `Отличное питание (${protein} от нормы белка) → Высокая энергия (${energy}% заряда тела)`,
                focusInterestsPositive: (focus, streak) => `Глубокая работа (${focus} мин сегодня) → Сильная привычка к обучению (${streak}-дневная серия)`,
                familyMindPositive: (members, mood) => `Активный семейный центр (${members} участников) → Положительное настроение (${mood}/100)`
            },
            actions: {
                sleep: "Улучшите качество сна сегодня вечером, чтобы повысить концентрацию завтра",
                finance: "Пересмотрите бюджет и создайте план резервного фонда",
                food: "Добавьте богатый белком перекус, чтобы восстановить энергию"
            }
        },
        settings: {
            title: 'Настройки',
            lang: 'Язык / Language',
            notifs: 'Уведомления',
            dailyBrief: 'Ежедневная сводка (08:00)',
            focusAlerts: 'Напоминания фокуса',
            familyUpdates: 'Семейные обновления',
            system: 'Система',
            export: 'Экспорт данных',
            reset: "Сброс аккаунта",
            currentLocale: "Текущий язык:",
            freePlan: "БЕСПЛАТНО",
            justNow: "Только что",
            dailyBriefDesc: "Утренняя сводка в 08:00",
            focusAlertsDesc: "Напоминания о начале сеансов фокуса",
            familyUpdatesDesc: "Когда члены семьи выполняют задачи",
            exportSuccess: "✅ Данные успешно экспортированы!",
            resetScheduled: "⚠️ Сброс аккаунта запланирован",
            logType: "ТИП",
            logDevice: "УСТРОЙСТВО",
            logTime: "ВРЕМЯ",
            logLogin: "ВХОД",
            logWebDashboard: "Веб-панель",
            profile: "Участник с",
            securityLog: "Журнал безопасности",
            logout: "Выйти",
            yesterday: 'Вчера',
            today: 'Сегодня',
            selectDate: 'Выбрать дату'
        },
        family: {
            title: 'Семейный центр',
            subtitle: 'Цифровой мост между поколениями.',
            readOnly: 'Семейная история архивирована',
            readOnlyDesc: 'Прошлые действия заблокированы.',
            liveHub: 'Живой центр',
            genealogy: 'Генеалогия',
            smartParenting: 'Консоль родителей',
            requests: 'Запросы',
            approve: 'Принять',
            deny: 'Отклонить',
            approved: 'Одобрено',
            reward: 'Награда',
            overallMood: 'Общее настроение',
            activeQuests: 'Активные квесты',
            familyXP: 'Семейный XP',
            gen1: 'Поколение 1 (Корни)',
            gen2: 'Поколение 2 (Хранители)',
            gen3: 'Поколение 3 (Будущее)',
            backToHub: 'Назад в Семейный центр',
            geneticProfile: 'Генетический профиль',
            safetyMonitor: 'Монитор безопасности',
            emergencyCall: 'ЭКСТРЕННЫЙ ВЫЗОВ',
            parentalControls: 'Родительский контроль',
            activityLog: 'История активности',
            task: 'Задача',
            date: 'Дата',
            xp: 'XP'
        },
        finance: {
            title: 'Финансы',
            subtitle: 'Управляйте своим богатством.',
            readOnly: 'Финансовые записи архивированы',
            readOnlyDesc: 'Записи за прошлые дни нельзя изменить.',
            totalBalance: 'Общий Баланс',
            monthlyBudget: 'Месячный Бюджет',
            savingsGoal: 'Цель сбережений',
            recentTransactions: 'Последние транзакции',
            addTransaction: 'Добавить транзакцию',
            dailyAnalysis: 'Ежедневный анализ',
            dailyAnalysisText: 'Высокие расходы на "Еду" сегодня совпадают с вашим уровнем стресса. Рекомендация: Готовьте дома завтра.',
            spendBreakdown: 'Распределение расходов',
            viewAll: 'Смотреть все',
            investment: 'Инвестиции',
            credit: 'Кредит',
            debt: 'Долг',
            confirmPaymentsInstruction: 'Пожалуйста, подтвердите следующие платежи:',
            centralBankRate: 'КУРС ЦЕНТРОБАНКА',
            realTimeCurrency: 'Курсы валют в реальном времени',
            liabilities: 'ОБЯЗАТЕЛЬСТВА',
            assets: 'АКТИВЫ',
            initialAmount: 'Начальная сумма',
            byCategory: 'по категориям',
            debtsPlusCredits: 'Долги + Кредиты',
            returnPlusDeposits: 'Возвраты долгов + Депозиты',
            addDebt: '+ Добавить долг',
            waitingForData: 'Ожидание данных...',
            vsLastMonth: 'по ср. с прошлым месяцем',
            used: 'Использовано',
            left: 'Осталось',
            archivedDays: 'Архивированные дни',
            dayClosed: 'День закрыт',
            spent: 'Потрачено',
            days: 'дн',
            weeks: 'нед',
            months: 'мес',
            years: 'лет',
            enterGoal: 'Введите вашу финансовую цель',
            deadline: 'Срок',
            achieved: 'Достигнуто',
            noFunds: 'Нет средств',
            limit: 'Лимит',
            target: 'Цель',
            current: 'Текущий',
            perMonth: 'В месяц',
            incomeInsufficient: 'Недостаточно дохода',
            iOwe: 'Я должен',
            owedToMe: 'Мне должны',
            personName: 'Лицо (От/Кому)',
            fullNamePlaceholder: 'Имя Фамилия',
            amount: 'Сумма',
            currency: 'Валюта',
            dateTaken: 'Дата взятия',
            dateGiven: 'Дата выдачи',
            returnDate: 'Срок возврата',
            addCredit: 'Добавить кредит',
            addDeposit: 'Добавить депозит',
            creditName: 'Название кредита',
            creditNamePlaceholder: 'Напр: Ипотека, iPhone',
            depositName: 'Название депозита',
            depositNamePlaceholder: 'Напр: Подушка безопасности, Машина',
            totalAmount: 'Общая сумма',
            currentAmount: 'Текущая сумма',
            incomeHistoryEmpty: 'История доходов пуста.',
            incomeHistoryEmptyDesc: 'Добавьте первую транзакцию дохода, чтобы начать отслеживать прогресс в достижении ваших целей.',
            expenseHistoryEmpty: 'История расходов пуста.',
            expenseHistoryEmptyDesc: 'Установите месячный бюджет, чтобы контролировать расходы и видеть здесь анализ в реальном времени.',
            incomePlan: 'План доходов',
            expenseControl: 'Контроль расходов',
            voiceFeedback: {
                listening: 'Слушаю...',
                processing: 'ИИ обрабатывает команду...',
                done: '✅ Транзакция добавлена!'
            },
            dailyFlow: 'Дневной поток',
            advancedStats: 'Расширенная статистика',
            incomeBudget: 'Цель дохода',
            expenseBudget: 'Лимит расходов',
            targetIncome: 'Целевой доход',
            limitExpense: 'Лимит расходов',
            ultimateGoalTitle: 'ГЛАВНАЯ ФИНАНСОВАЯ ЦЕЛЬ',
            currentStatus: 'ТЕКУЩИЙ СТАТУС',
            timeLeft: 'Осталось времени (AI):',
            remainingTime: 'Осталось времени (AI)',
            deadlineExpired: 'СРОК ИСТЕК',
            paymentSuccess: 'Платеж выполнен успешно!',
            depositsEmpty: 'Нет доступных вкладов',
            creditsEmpty: 'Нет доступных кредитов',
            debtsEmpty: 'Нет доступных долгов',
            confirm: 'Подтвердить',
            confirmPayment: 'Подтвердить платеж',
            todayPayments: 'Сегодняшние платежи',
            monthlyPayment: 'Ежемесячный платеж',
            paymentDay: 'День платежа (Число)',
            interestRate: 'Годовая ставка (%)',
            termMonths: 'Срок (Месяцев)',
            calculationMethod: 'Метод расчета',
            annuity: 'Аннуитет (Равные)',
            differential: 'Дифференцированный (Убывающий)',
            add: 'Добавить',
            yearlyProfit: 'Годовая доходность (%)',
            depositDeadline: 'Срок депозита',
            daysInMonth: '1-31',
            monthlyProfitChoice: 'Ежемесячное получение прибыли',
            expectedMonthlyProfit: 'Ожидаемая ежемесячная прибыль',
            startDate: 'Дата начала',
            fillAllFields: 'Пожалуйста, заполните все поля',
            depositOpened: 'Депозит открыт',
            investmentTransfer: 'Инвестиции (Перевод)',
            noDeadline: 'Без срока',
            extendDeadline: "Продлить срок",
            fromCurrentBalance: "С текущего баланса",
            noExpenseRecord: "Нет записей о расходах",
            markAsIncome: "Отметить как доход",
            addFunds: "Добавить средства",
            editGoalTitle: "Редактировать финансовую цель",
            editBudgetTitle: "План месячного бюджета",
            budgetSaved: "Бюджеты успешно обновлены!",
            incomeGrowthMessage: "Наблюдается рост! Вы приближаетесь к цели по доходам. Так держать! 🚀",
            expenseLimitMessage: "Предупреждение о расходах! Вы достигли своего месячного лимита! ⚠️",
            incomeAlmostTarget: "Почти у цели! {val}% от плана доходов достигнуто.",
            expenseAlmostLimit: "Внимание! Вы достигли {val}% от лимита расходов.",
            setNewReturnDate: "Установить новую дату возврата",
            datePlaceholder: 'ГГГГ-ММ-ДД или Месяц Год',
            creditPayment: 'Платеж по кредиту',
            depositProfit: 'Прибыль от депозита',
            probability: 'Вероятность',
            aiWealthRoadmap: 'AI ДОРОЖНАЯ КАРТА БОГАТСТВА',
            analysisForGoal: 'Анализ для достижения цели',
            professionalPotentialDescription: (role: string) => `Ваш опыт как ${role} является главным фактором достижения финансовых целей.`,
            professionalPotential: 'ПРОФЕССИОНАЛЬНЫЙ ПОТЕНЦИАЛ',
            professionalPotentialDesc: 'Ваш опыт - главный драйвер для достижения финансовых целей.',
            recommendations: 'РЕКОМЕНДАЦИИ',
            increaseInvestments: 'Увеличьте инвестиции на 15%',
            getCertification: 'Получите профессиональный сертификат',
            additionalIncomeChannel: 'Дополнительный канал дохода',
            viewFullAnalysis: 'ПОСМОТРЕТЬ ПОЛНЫЙ АНАЛИЗ',
            qrScanner: "QR Сканер",
            qrScannerTitle: "QR Сканер Чеков",
            qrScannerDesc: "Направьте камеру на QR-код или загрузите изображение чека.",
            qrScannerAction: "Сканировать Сейчас",
            analyzing: "Анализируем...",
            portfolio: "Финансовый Портфель",
            recentActivity: 'Недавняя активность',
            noTransactions: 'Пока нет транзакций',
            aiRoadmapTitle: 'AI ДОРОЖНАЯ КАРТА БОГАТСТВА',
            filesAnalysis: 'Анализ для достижения цели',
            detailedList: 'ПОДРОБНЫЙ СПИСОК',
            monthlyAnalysisTitle: 'ЕЖЕМЕСЯЧНЫЙ АНАЛИЗ (РЕЗЮМЕ)',
            monthlyIncomeTitle: 'ЕЖЕМЕСЯЧНЫЙ ДОХОД',
            weeklyExpenseStats: 'ЕЖЕНЕДЕЛЬНАЯ СТАТИСТИКА РАСХОДОВ',
            iOweLabel: 'Я ДОЛЖЕН',
            owedToMeLabel: 'МНЕ ДОЛЖНЫ',
            repaid: 'ВОЗВРАЩЕНО',
            repay: 'Вернуть',
            extend: 'Продлить',
            dayLabel: 'ДАТА',
            remaining: 'Остаток',
            payNow: 'ОПЛАТИТЬ СЕЙЧАС',
            prepay: 'Внести досрочно',
            collecting: 'Накапливается',
            totalCollected: 'Всего накоплено',
            monthlyPlan: 'Месячный план',
            topUp: 'Пополнить',
            noData: 'Данных пока нет',
            aiPredictionTitle: 'AI ЕЖЕМЕСЯЧНЫЙ ПРОГНОЗ',
            predictionPart1: 'Ожидается, что вы закончите этот месяц с',
            predictionPart2: 'прибылью',
            predictionTrend: (percent: number) => `Ваши расходы снизились на ${percent}% по сравнению с прошлой неделей.`,
            predictionGoalAdvice: (goal: string, months: number) => `Если вы продолжите в том же духе, вы достигнете цели ${goal} на ${months} месяца раньше срока.`,
            predictionDisclaimerText: 'На основе ваших текущих привычек расходов и регулярного дохода.',
            weeklyLabel: 'Еженедельно',
            monthlyLabel: 'Ежемесячно',
            customLabel: 'Период',
            analysisSummary: 'Сводка анализа системы',
            exportExcel: 'Скачать в Excel',
            incomeTitle: 'Доход',
            expenseTitle: 'Расход',
            principalAmount: "Основной долг",
            interestAmount: "Проценты (Foiz)",
            repaymentSplit: "Разделение платежа",
            realMoney: "Реальные деньги (Чистые)",
            transTitle: "Название",
            transType: "Тип",
            transCategory: "Категория",
            depositActionTitle: "Управление Депозитом",
            actionAdd: "Пополнить",
            actionWithdraw: "Снять",
            actionProfit: "Прибыль",
            sourceBalance: "С баланса (-)",
            sourceOutside: "Новый доход (+)",
            financialStatus: "Финансовый статус",
            statusStart: "⚪ Начало",
            statusPositive: "✅ Позитивный",
            statusDanger: "⚠️ Критический",
            statusDescStart: "Недостаточно данных для анализа. Добавьте первый доход или расход.",
            statusDescPositive: (percent: string) => `Вы сохраняете ${percent}% от своего дохода. Отличный результат!`,
            statusDescDanger: "Внимание! Ваши расходы превышают доходы. Немедленно сократите минимум 2 лишних расхода.",
            recStart: "Добавьте первую транзакцию (Доход или Расход)",
            recSafety: "Создайте подушку безопасности равную 3 месяцам расходов",
            recDeposit: "Откройте сберегательный счет и начните копить",
            recDebt: "Погасите долги быстрее методом 'Снежный ком'",
            recBudget: "Установите план доходов (Бюджет)",
            statusOk: "Пока все хорошо!",
            predictionMsgExcellent: "Отличный результат! Вы сохраняете большую часть дохода. Подумайте об инвестициях.",
            predictionMsgGood: "Хороший показатель. Ваш план накоплений стабилен. Так держать.",
            predictionMsgOk: "Вы в плюсе, но небольшая оптимизация расходов была бы полезна.",
            predictionMsgBad: "Внимание! Ваши расходы превышают доходы. Пересмотрите бюджет.",
            fromLabel: "От",
            toLabel: "До"
        },
        categories: {
            Salary: "Зарплата",
            Freelance: "Фриланс",
            Investment: "Инвестиции",
            Gift: "Подарок",
            OtherIncome: "Другой доход",
            Food: "Еда",
            Transport: "Транспорт",
            Shopping: "Покупки",
            Bills: "Счета",
            Health: "Здоровье",
            Education: "Образование",
            Leisure: "Досуг",
            Other: "Другое",
            creditIn: "Кредит (Доход)",
            depositIn: "Депозит (Доход)",
            savings: "Сбережения/Перевод",
            general: "Общее",
            music: "Музыка",
            mind: "Осознанность"
        },
        tasks: {
            title: 'Фокус и Задачи',
            subtitle: 'Планируйте свой день.',
            newTask: 'Новая задача',
            taskName: 'Название задачи',
            startTime: 'Время начала',
            endTime: 'Время окончания',
            priority: 'Приоритет',
            low: 'Низкий',
            medium: 'Средний',
            high: 'Высокий',
            createTask: 'Создать задачу',
            calendar: 'Календарь',
            upcomingTasks: 'Будущие планы',
            overdue: 'Просрочено',
            future: 'Будущее',
            stats: {
                completedToday: 'Выполнено сегодня',
                pending: 'Ожидает',
                efficiency: 'Эффективность'
            },
            sections: {
                today: 'Сегодня',
                upcoming: 'Предстоящие',
                completed: 'Выполнено',
                overdue: 'Просрочено',
                future: 'Будущее'
            },
            aiSuggestion: {
                title: 'Предложение ИИ',
                suggestion: 'Задача "Проверить месячный бюджет" просрочена.',
                add: 'Добавить +'
            },
            actions: {
                startFocus: 'Начать фокус',
                moveToToday: 'Перенести на сегодня',
                subtask: 'Подзадача',
                move: 'Переместить',
                focus: 'Фокус',
                edit: 'Изменить',
                delete: 'Удалить',
                promote: 'Сделать основной'
            },
            completedArchive: 'Архив выполненных задач',
            readOnly: 'Задачи архивированы',
            readOnlyDesc: 'Прошлые задачи доступны только для чтения.',
            noTasks: 'На сегодня задач нет. Хорошего дня!',
            allClear: 'На данный момент все чисто!'
        },
        health: {
            history: 'История',
            readOnly: 'Данные здоровья заблокированы',
            readOnlyDesc: 'Исторические биометрические данные нельзя изменить.',
            title: 'Здоровье и Жизненность',
            subtitle: 'Ваше тело - это двигатель.',
            bodyBattery: {
                title: 'Заряд Тела',
                fullyCharged: 'Вы полностью заряжены! Отличное время для интенсивных задач или тренировки.',
                recharge: 'Подумайте о перерыве, чтобы восстановить силы.',
                sleepRestoration: 'Восстановление сном',
                activeDrain: 'Активный расход',
                stressTax: 'Стрессовая нагрузка',
                hydrationEfficiency: 'Эффективность гидратации'
            },
            vitals: {
                title: 'Сердечный ритм',
                stressTitle: 'Уровень стресса',
                resting: 'В покое',
                heartRateUnit: 'уд/мин',
                normalRange: 'В норме',
                avgLevel: 'Ср. уровень',
                low: 'Низкий',
                relaxedState: 'Расслабленное состояние'
            },
            sleep: {
                score: '/ 100',
                quality: 'Восстанавливающий сон',
                unit: 'Балл'
            },
            hydration: {
                title: 'Гидратация',
                goal: 'Цель',
                unit: 'мл'
            },
            activity: {
                title: 'Активность',
                stepsToday: 'шагов сегодня',
                kcal: 'ккал',
                dist: 'дист'
            },
            trends: {
                title: 'Тренды здоровья (Последние 7 дней)',
                stepsHistory: 'История шагов',
                sleepQuality: 'Качество сна'
            },
            days: {
                mon: 'Пн',
                tue: 'Вт',
                wed: 'Ср',
                thu: 'Чт',
                fri: 'Пт',
                sat: 'Суб',
                sun: 'Вск'
            },
            biometrics: {
                title: 'Биометрические данные',
                weight: 'Вес',
                height: 'Рост',
                goal: 'Цель',
                lose: 'Похудение',
                gain: 'Набор веса',
                maintain: 'Поддержание веса',
                unitCm: 'см',
                unitKg: 'кг',
                aiRecTitle: 'Рекомендация ИИ',
                aiRecLose: 'Предлагается ускорение метаболизма. ИИ скорректирует цели по калориям.',
                aiRecMaintain: 'Стабильный прогресс. Сохраняйте ритм.',
                goalLabel: 'Выберите вашу цель по здоровью'
            },
            aiAdvisor: {
                title: 'ИИ Консультант по здоровью',
                analyzing: 'ИИ анализирует показатели...',
                hydrationLow: 'Уровень воды низкий. Выпейте 2 стакана воды для повышения эффективности.',
                stressHigh: 'Уровень стресса высокий. Рекомендуем 10-минутную сессию дыхательной медитации.',
                sleepLow: 'Низкое восстановление. Сегодня отдайте приоритет отдыху и избегайте тяжелых нагрузок.',
                allGood: 'Все системы в норме. Ваше восстановление идеально соответствует уровню активности!'
            },
            loading: "Загрузка данных здоровья...",
            simulate: "Симуляция 21:00",
            batteryStatus: {
                ready: "Готов к действию",
                good: "Чувствую себя хорошо",
                tired: "Немного устал",
                rest: "Время отдохнуть"
            },
            voiceAlertSteps: "шагов записано!",
            voiceAlertSleep: "часов сна записано!",
            voiceAlertWater: "мл воды добавлено!"
        },
        food: {
            title: "Еда ИИ",
            subtitle: "Питайте свое тело разумно.",
            readOnly: 'Дневной журнал архивирован',
            readOnlyDesc: 'Прошлые приемы пищи нельзя изменить.',
            calories: "Калории",
            macros: "Макросы",
            protein: "Белки",
            carbs: "Углеводы",
            fats: "Жиры",
            mealLogs: "История Еды",
            scanMeal: "Сканировать",
            dailyLog: "Ежедневный журнал",
            historyModalTitle: "История питания (последние 7 дней)",
            cameraPrompt: "Наведите камеру на еду",
            analyzing: "ИИ анализирует...",
            instantAdviceTitle: "Мгновенный совет",
            targetAdvice: "Отличное потребление белка сегодня! Попробуйте добавить больше клетчатки (овощей) к ужину.",
            scanError: "Не удалось определить еду. Пожалуйста, попробуйте еще раз.",
            aiDetected: "ИИ определил",
            eatQuestion: "Вы это съели?",
            yes: "Да",
            no: "Нет",
            streak: "ДНЕЙ ПОДРЯД",
            loading: "Загрузка...",
            alertArchived: "Вы не можете добавлять/удалять записи за архивные дни.",
            mealQuick: "Быстрая запись",
            mealSnack: "Перекус",
            mealBreakfast: "Завтрак",
            mealLunch: "Обед",
            mealDinner: "Ужин",
            kcal: "ккал",
            unitG: "г"
        },
        mind: {
            title: "Умственное святилище",
            subtitle: "Ясность ума и фокус.",
            readOnly: 'Контекст разума заблокирован',
            readOnlyDesc: 'Прошлые ментальные состояния архивированы.',
            weeklyFocus: "Недельный фокус",
            focusingOn: "Фокус на:",
            focus: "Фокус",
            break: "Перерыв",
            moodSphere: "Сфера настроения",
            moodSphereDesc: "Потяните для настройки (<30 = Дзен)",
            resonanceBreathing: "Резонансное дыхание",
            startSession: "Начать сеанс",
            stopSession: "Остановить",
            inhale: "Вдох",
            exhale: "Выдох",
            hold: "Задержка",
            ready: "Готово",
            aiSummaryTitle: "Ежедневная сводка ИИ",
            aiSummaryText: "Ваше настроение сегодня стабильно. Эффективность фокуса выросла на 15% по сравнению со вчерашним днем.",
            historyModalTitle: "Журнал настроения (История)",
            recentSessions: "Недавние сеансы фокуса",
            moodTrends: "Тренды настроения",
            zenTitle: "Дышите",
            zenSubtitle: "Аналитика и графики скрыты. Сосредоточьтесь на настоящем.",
            whyFeeling: "Почему вы так себя чувствуете?",
            exitZen: "Мне уже лучше (Выйти из Дзен)",
            reasons: {
                tired: "Усталость",
                anxious: "Тревога",
                overwhelmed: "Перегруз",
                justBecause: "Просто так"
            },
            loadingState: "Загрузка...",
            saved: "Сохранено",
            saveMood: "Сохранить настроение",
            zenMapLeft: "Негатив (Дзен)",
            zenMapRight: "Позитив",
            aiLoading: "ИИ анализирует...",
            aiPoweredBy: "AURA Стратегический Разум"
        },
        focus: {
            minutes: 'Минут',
            done: 'Выполнено'
        },
        interests: {
            title: "Интересы и Рост",
            subtitle: "Расширяйте свои горизонты.",
            readOnly: 'Прогресс заблокирован',
            readOnlyDesc: 'Прошлые записи нельзя изменить.',
            historyModalTitle: "Журнал практики хобби",
            practiceLog: "Журнал практики",
            streak: "Дней подряд",
            newHobby: "+ Новое хобби",
            aiRecommendation: "Рекомендация ИИ: Гончарство",
            aiReason: "Учитывая ваш интерес к «Дизайну», вам может понравиться тактильное творчество.",
            tryThis: "Попробовать",
            hoursSpent: "часов потрачено",
            nextLevel: "Далее: Уровень",
            discoverNew: "Открыть новую страсть",
            level: "Ур.",
            addHobbyTitle: "Добавить новое хобби",
            hobbyName: "Название",
            category: "Категория",
            loading: "Загрузка увлечений...",
            categories: {
                general: "Общее",
                art: "Искусство",
                physical: "Физическое",
                mind: "Умственное",
                music: "Музыка"
            },
            placeholderName: "напр. Шахматы, Пианино...",
            positive: "Позитивное",
            negative: "Негативное",
            type: "Тип",
            trackingMode: "Режим отслеживания",
            trackingFrequency: "Частота (+1)",
            trackingFrequencyDesc: "Считает каждое событие (напр. сигареты).",
            trackingBinary: "Один раз (Да/Нет)",
            trackingBinaryDesc: "Записывается один раз в день (напр. встал поздно).",
            newHobbyCardTitle: "Новое Хобби",
            newHobbyCardDesc: "Для развития",
            positiveInterests: "Позитивные интересы",
            negativeHabits: "Контролируемые привычки",
            dailyActivities: "Активность за сегодня",
            aiRecStatus: "Статус ИИ рекомендаций",
            statCount: "СЧЕТ",
            statDuration: "ДЛИТЕЛЬНОСТЬ",
            loyaltyXP: "ОПЫТ ЛОЯЛЬНОСТИ",
            done: "Готово",
            logCount: "ЗАПИСЬ (+1)",
            log: "ЗАПИСЬ",
            status: "Статус",
            times: "раз",
            totalHours: "ч ВСЕГО",
            totalControl: "ч КОНТРОЛЬ",
            logDurationQuestion: "Сколько минут вы занимались?",
            aiRecTitleCorrection: "AURA Коррекция",
            aiRecTitleGrowth: "AURA Рост",
            aiRecDone: "Выполнено",
            aiRecTask: "Задача",
            aiRecAddTask: "Задача",
            noActivities: "Сегодня активности не записано.",
            selectHobby: "Выберите хобби выше, чтобы записать активность.",
            notDone: "Не выполнено",
            todayLabel: "Сегодня",
            dailyStats: "ЕЖЕДНЕВНАЯ СТАТИСТИКА"
        },
        liveness_section: {
            title: "ПУЛЬС ЖИЗНИ",
            subtitle: "Цифровой мост заботы о близких.",
            desc: "Пассивный мониторинг ваших близких. Если активность не обнаружена в заданное окно, семья получит уведомление. Идеально для безопасности пожилых людей.",
            cta: "Настроить Пульс",
            silent_mode: 'Тихий режим',
            silent_mode_desc: 'Пауза во время сна',
            activity_log: 'История пульса',
            panic_alert: 'ТРЕВОЖНАЯ КНОПКА',
            panic_confirm: 'Отправить сигнал тревоги сейчас?',
            countdown_prefix: 'До проверки:',
            checkInPrompt: 'Азамат ота, вы в порядке? Пожалуйста, подтвердите.',
            familyAlert: (hours: number) => `Внимание: Ваш отец не выходил на связь ${hours} часов!`
        },
    },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationStructure;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('en');

    // Attempt to load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('aura-lang') as Language;
        if (saved && ['en', 'uz', 'ru'].includes(saved)) {
            setLanguage(saved);
        }
    }, []);

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('aura-lang', lang);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t: translations[language] }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
