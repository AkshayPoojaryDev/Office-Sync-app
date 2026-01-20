// client/src/components/CountdownTimer.jsx
// Real-time countdown to 10:30 AM order cutoff
import { useState, useEffect } from 'react';

function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [isOrdersClosed, setIsOrdersClosed] = useState(false);
    const [urgency, setUrgency] = useState('normal'); // normal, warning, critical

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const cutoff = new Date();
            cutoff.setHours(10, 30, 0, 0);

            // If it's past 10:30 AM, orders are closed
            if (now >= cutoff) {
                setIsOrdersClosed(true);
                return { hours: 0, minutes: 0, seconds: 0 };
            }

            const diff = cutoff - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Set urgency level
            const totalMinutes = hours * 60 + minutes;
            if (totalMinutes <= 10) {
                setUrgency('critical');
            } else if (totalMinutes <= 30) {
                setUrgency('warning');
            } else {
                setUrgency('normal');
            }

            return { hours, minutes, seconds };
        };

        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        // Update every second
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatNumber = (num) => String(num).padStart(2, '0');

    const getContainerClasses = () => {
        if (isOrdersClosed) {
            return 'bg-gray-100 border-gray-300 text-gray-600';
        }
        switch (urgency) {
            case 'critical':
                return 'bg-red-50 border-red-200 text-red-700 animate-pulse';
            case 'warning':
                return 'bg-amber-50 border-amber-200 text-amber-700';
            default:
                return 'bg-emerald-50 border-emerald-200 text-emerald-700';
        }
    };

    const getIconColor = () => {
        if (isOrdersClosed) return 'text-gray-400';
        switch (urgency) {
            case 'critical': return 'text-red-500';
            case 'warning': return 'text-amber-500';
            default: return 'text-emerald-500';
        }
    };

    return (
        <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${getContainerClasses()}`}>
            {/* Clock Icon */}
            <svg className={`w-5 h-5 ${getIconColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>

            {isOrdersClosed ? (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Orders Closed</span>
                    <span className="text-xs opacity-75">until tomorrow 10:30 AM</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium opacity-75">Orders close in</span>
                    <div className="flex items-center gap-1 font-mono text-sm font-bold">
                        <span className="bg-white/50 px-1.5 py-0.5 rounded">{formatNumber(timeLeft.hours)}</span>
                        <span className="opacity-50">:</span>
                        <span className="bg-white/50 px-1.5 py-0.5 rounded">{formatNumber(timeLeft.minutes)}</span>
                        <span className="opacity-50">:</span>
                        <span className="bg-white/50 px-1.5 py-0.5 rounded">{formatNumber(timeLeft.seconds)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CountdownTimer;
