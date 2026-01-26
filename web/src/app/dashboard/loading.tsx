export default function DashboardLoading() {
    return (
        <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-aura-cyan border-t-transparent animate-spin"></div>
                <div className="text-aura-cyan text-sm font-bold tracking-widest animate-pulse">YUKLANMOQDA...</div>
            </div>
        </div>
    );
}
