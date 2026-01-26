"use client";
import { useState, useEffect } from 'react';
import NavSidebar from '@/components/dashboard/NavSidebar';
import { FocusOverlay } from '@/components/dashboard/FocusOverlay';
import ProtectedRoute from '@/components/ProtectedRoute';
import CommandPalette from '@/components/CommandPalette';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    // Global Cmd+K / Ctrl+K listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsCommandOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-aura-cyan/30">

            {/* Command Palette (Cmd+K) */}
            <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-aura-purple/10 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-aura-cyan/10 rounded-full blur-[150px] animate-pulse delay-1000"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
            </div>

            <NavSidebar />
            <FocusOverlay />

            {/* Main Content Shell */}
            <main id="dashboard-main" className="pl-72 h-screen overflow-y-auto relative z-10">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <ProtectedRoute>
                        {children}
                    </ProtectedRoute>
                </div>
            </main>
        </div>
    );
}
