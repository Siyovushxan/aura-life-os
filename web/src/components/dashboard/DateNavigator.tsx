import React, { useState } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isToday, isYesterday } from 'date-fns';
import { uz } from 'date-fns/locale';
import CalendarModal from '../CalendarModal';

interface DateNavigatorProps {
    selectedDate: string; // YYYY-MM-DD
    onDateChange: (date: string) => void;
    className?: string;
}

export function DateNavigator({ selectedDate, onDateChange, className = '' }: DateNavigatorProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const date = new Date(selectedDate);

    const handlePrevDay = () => {
        onDateChange(format(subDays(date, 1), 'yyyy-MM-dd'));
    };

    const handleNextDay = () => {
        onDateChange(format(addDays(date, 1), 'yyyy-MM-dd'));
    };

    const isTodayDate = isToday(date);
    const isYesterdayDate = isYesterday(date);

    let displayDate = format(date, 'd MMMM, EEEE', { locale: uz });
    if (isTodayDate) displayDate = 'Bugun';
    else if (isYesterdayDate) displayDate = 'Kecha';

    return (
        <>
            <div className={`flex items-center gap-2 ${className}`}>
                {/* Yesterday Button (only if today is selected) */}
                {isTodayDate && (
                    <button
                        onClick={handlePrevDay}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Kecha
                    </button>
                )}

                {/* Date Selector */}
                <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-1">
                    <button
                        onClick={handlePrevDay}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[120px] justify-center"
                    >
                        <CalendarIcon className="w-4 h-4 text-primary-500" />
                        {displayDate}
                    </button>

                    <button
                        onClick={handleNextDay}
                        disabled={isTodayDate} // Future dates disabled for now? Let's keep it flexible or consistent with logic
                        className={`p-1.5 rounded-lg transition-colors ${isTodayDate
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Today Button (only if not today) */}
                {!isTodayDate && (
                    <button
                        onClick={() => onDateChange(format(new Date(), 'yyyy-MM-dd'))}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                    >
                        Bugun
                    </button>
                )}
            </div>

            <CalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                    onDateChange(date);
                    setIsCalendarOpen(false);
                }}
            />
        </>
    );
}
