// client/src/hooks/useMetrics.js
import useSWR from 'swr';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// Safe fetcher wrapper
const fetcher = async (url) => {
    // SWR keys might be complex, handle them
    if (url === '/api/stats') {
        const res = await api.getStats();
        return res.data;
    }
    if (url === '/api/user/orders') {
        const res = await api.getMyOrders();
        return res.data.orders;
    }
    if (url.startsWith('/api/users/') && url.endsWith('/stats')) {
        const res = await api.getUserStats(url.split('/')[3]);
        return res.data.stats;
    }
    return null;
};

// Hook for Today's Stats (Global)
export function useStats() {
    const { data, error, isLoading, mutate } = useSWR('/api/stats', fetcher, {
        refreshInterval: 30000, // Background refresh every 30s
        dedupingInterval: 5000,
        fallbackData: { tea: 0, coffee: 0, juice: 0 }
    });

    return {
        stats: data,
        loading: isLoading,
        error,
        mutate // Explicit re-fetch function
    };
}

// Hook for Current User's Orders (Today)
export function useMyOrders() {
    const { currentUser } = useAuth();

    // Only fetch if user is logged in
    const key = currentUser ? '/api/user/orders' : null;

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        dedupingInterval: 2000,
        revalidateOnFocus: true // Update when user comes back to tab
    });

    return {
        myOrders: data || [],
        loading: isLoading,
        error,
        mutate
    };
}

// Hook for User Profile Stats
export function useUserStats(userId) {
    const key = userId ? `/api/users/${userId}/stats` : null;

    const { data, error, isLoading } = useSWR(key, fetcher, {
        revalidateOnFocus: false, // Don't constantly revalidate stats on profile
        dedupingInterval: 60000 // Cache for 1 minute
    });

    return {
        orderStats: data || { totalOrders: 0, typeCounts: { tea: 0, coffee: 0, juice: 0 }, favoriteBeverage: null },
        loading: isLoading,
        error
    };
}
