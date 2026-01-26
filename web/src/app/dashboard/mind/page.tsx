"use client";
import { Suspense, useEffect } from 'react';
import MindDashboardContent from './MindContent';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationContext';

export default function MindDashboardPage() {
    const { t } = useLanguage();
    const { clearNotification } = useNotifications();

    useEffect(() => {
        clearNotification('mind');
    }, []);
    return (
        <Suspense fallback={<div className="text-white">{t.mind.loadingState}</div>}>
            <MindDashboardContent />
        </Suspense>
    );
}
