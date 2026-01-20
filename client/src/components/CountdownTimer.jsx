// client/src/components/CountdownTimer.jsx
// Real-time countdown for order windows (morning & evening slots)
import { useState, useEffect } from 'react';

function CountdownTimer() {
    const [timeInfo, setTimeInfo] = useState({
        timeLeft: { hours: 0, minutes: 0, seconds: 0 },
        currentSlot: null, // 'morning', 'evening', or null
        nextSlot: null,    // 'morning', 'evening', or null
        isOpen: false,
        urgency: 'normal'
    });

    useEffect(() => {
        const calculateTimeInfo = () => {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const currentSeconds = now.getSeconds();

            // Time slots in minutes from midnight
            const morningEnd = 10 * 60 + 30;      // 10:30 AM = 630 min
            const eveningStart = 15 * 60;          // 3:00 PM = 900 min
            const eveningEnd = 17 * 60 + 30;       // 5:30 PM = 1050 min

            let isOpen = false;
            let currentSlot = null;
            let nextSlot = null;
            let targetMinutes = 0;
            let urgency = 'normal';

            if (currentMinutes <= morningEnd) {
                // Morning slot is open
                isOpen = true;
                currentSlot = 'morning';
                targetMinutes = morningEnd;
            } else if (currentMinutes >= eveningStart && currentMinutes <= eveningEnd) {
                // Evening slot is open
                isOpen = true;
                currentSlot = 'evening';
                targetMinutes = eveningEnd;
            } else if (currentMinutes > morningEnd && currentMinutes < eveningStart) {
                // Between slots - show countdown to evening
                isOpen = false;
                nextSlot = 'evening';
                targetMinutes = eveningStart;
            } else {
                // After evening slot - show next morning
                isOpen = false;
                nextSlot = 'morning';
                targetMinutes = 24 * 60 + morningEnd; // Next day
            }

            // Calculate time difference
            let diffMinutes = targetMinutes - currentMinutes;
            if (diffMinutes < 0) diffMinutes += 24 * 60;

            const totalSeconds = diffMinutes * 60 - currentSeconds;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            // Set urgency for open slots
            if (isOpen) {
                if (diffMinutes <= 10) urgency = 'critical';
                else if (diffMinutes <= 30) urgency = 'warning';
            }

            return {
                timeLeft: { hours, minutes, seconds },
                currentSlot,
                nextSlot,
                isOpen,
                urgency
            };
        };

        setTimeInfo(calculateTimeInfo());
        const timer = setInterval(() => setTimeInfo(calculateTimeInfo()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatNumber = (num) => String(Math.max(0, num)).padStart(2, '0');

    const getContainerClasses = () => {
        if (!timeInfo.isOpen) return 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300';
        switch (timeInfo.urgency) {
            case 'critical': return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 animate-pulse';
            case 'warning': return 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
            default: return 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300';
        }
    };

    const getIconColor = () => {
        if (!timeInfo.isOpen) return 'text-gray-400';
        switch (timeInfo.urgency) {
            case 'critical': return 'text-red-500';
            case 'warning': return 'text-amber-500';
            default: return 'text-emerald-500';
        }
    };

    const { hours, minutes, seconds } = timeInfo.timeLeft;

    return (
        <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${getContainerClasses()}`}>
            <svg className={`w-5 h-5 ${getIconColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>

            {timeInfo.isOpen ? (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium opacity-75">
                        {timeInfo.currentSlot === 'morning' ? 'Morning' : 'Evening'} orders close in
                    </span>
                    <div className="flex items-center gap-1 font-mono text-sm font-bold">
                        <span className="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">{formatNumber(hours)}</span>
                        <span className="opacity-50">:</span>
                        <span className="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">{formatNumber(minutes)}</span>
                        <span className="opacity-50">:</span>
                        <span className="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">{formatNumber(seconds)}</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Orders Closed</span>
                    <span className="text-xs opacity-75">
                        {timeInfo.nextSlot === 'evening' ? '• Opens at 3:00 PM' : '• Opens tomorrow 10:30 AM'}
                    </span>
                </div>
            )}
        </div>
    );
}

export default CountdownTimer;
