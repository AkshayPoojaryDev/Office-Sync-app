// client/src/hooks/useMetrics.js
// Custom hooks for fetching application metrics using SWR.
// Includes hooks for global order stats, user-specific orders, and profile stats.

import useSWR from 'swr';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Universal Fetcher Function for SWR
 * Handles different API endpoints based on the key provided by SWR.
 * 
 * @param {string} url - The key/url passed from useSWR
 */
const fetcher = async (url) => {
    // Global Stats Endpoint
    if (url === '/api/stats') {
        const res = await api.getStats();
        return res.data;
    }
    // Current User Orders Endpoint
    if (url === '/api/user/orders') {
        const res = await api.getMyOrders();
        return res.data.orders;
    }
    // User Profile Stats Endpoint (Dynamic ID)
    if (url.startsWith('/api/users/') && url.endsWith('/stats')) {
        const res = await api.getUserStats(url.split('/')[3]);
        return res.data.stats;
    }
    return null;
};

/**
 * Hook to fetch Global Order Statistics (Today's counts).
 * Used in the Dashboard for the main beverage counters.
 * 
 * Features:
 * - Background refresh every 30 seconds to keep counts live.
 */
export function useStats() {
    const { data, error, isLoading, mutate } = useSWR('/api/stats', fetcher, {
        refreshInterval: 30000, // Background refresh every 30s
        dedupingInterval: 5000,
        fallbackData: { tea: 0, coffee: 0, juice: 0 } // Optimistic initial UI
    });

    return {
        stats: data,
        loading: isLoading,
        error,
        mutate // Explicit re-fetch function for after orders are placed
    };
}

/**
 * Hook to fetch the Current User's Orders for today.
 * Used to enforce order limits and show previous orders.
 */
export function useMyOrders() {
    const { currentUser } = useAuth();

    // Conditional fetching: Key is null if user not logged in
    const key = currentUser ? '/api/user/orders' : null;

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        dedupingInterval: 2000,
        revalidateOnFocus: true // Update when user focuses window to ensure limit compliance
    });

    return {
        myOrders: data || [],
        loading: isLoading,
        error,
        mutate
    };
}

/**
 * Hook to fetch aggregated stats for a specific user profile.
 * Used on the Profile page to show personal consumption history.
 * 
 * @param {string} userId - The UID of the user to fetch stats for
 */
export function useUserStats(userId) {
    const key = userId ? `/api/users/${userId}/stats` : null;

    const { data, error, isLoading } = useSWR(key, fetcher, {
        revalidateOnFocus: false, // Don't constantly revalidate stats on profile as they change infrequently
        dedupingInterval: 60000 // Cache for 1 minute
    });

    return {
        orderStats: data || { totalOrders: 0, typeCounts: { tea: 0, coffee: 0, juice: 0 }, favoriteBeverage: null },
        loading: isLoading,
        error
    };
}
