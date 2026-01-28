// client/src/hooks/useNotices.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

/**
 * useNotices Hook
 * 
 * Manages the fetching, pagination, and local state of dashboard notices.
 * 
 * Features:
 * - Infinite scrolling support (loadMore)
 * - Pull-to-refresh style reloading (refresh)
 * - Local optimistic updates (updateNotice)
 * - Prevents race conditions with refs
 * 
 * @param {number} initialLimit - Number of notices to fetch per page
 */
export function useNotices(initialLimit = 5) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    // Use ref for offset to maintain value across closure captures without triggering re-renders
    const offsetRef = useRef(0);

    /**
     * Core fetching logic.
     * @param {boolean} reset - If true, clears list and starts from offset 0.
     */
    const fetchNotices = useCallback(async (reset = false) => {
        try {
            setLoading(true);
            setError(null);

            const currentOffset = reset ? 0 : offsetRef.current;
            const response = await api.getNotices({
                limit: initialLimit,
                offset: currentOffset
            });

            // Defensive check: Ensure data is an array
            const data = response.data;
            if (!Array.isArray(data)) {
                console.error("API Error: Expected array of notices, received:", data);
                throw new Error("Invalid data format received from server");
            }

            if (reset) {
                setNotices(data);
                offsetRef.current = initialLimit;
            } else {
                setNotices(prev => [...prev, ...data]);
                offsetRef.current += initialLimit;
            }

            // If we received fewer items than the limit, we've reached the end
            setHasMore(data.length === initialLimit);
        } catch (err) {
            console.error("Fetch notices failed:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [initialLimit]);

    /**
     * Public method to reset and reload the list
     */
    const refresh = useCallback(() => {
        offsetRef.current = 0;
        fetchNotices(true);
    }, [fetchNotices]);

    /**
     * Public method to load the next page of notices
     */
    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchNotices(false);
        }
    }, [loading, hasMore, fetchNotices]);

    // Initial load on mount
    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            if (isMounted) {
                await fetchNotices(true);
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, [fetchNotices]);

    // Optimistic update helper
    const updateNotice = useCallback((id, updater) => {
        setNotices(prev => prev.map(n => n.id === id ? (typeof updater === 'function' ? updater(n) : updater) : n));
    }, []);

    return {
        notices,
        loading,
        error,
        hasMore,
        refresh,
        loadMore,
        updateNotice, // Exported for optimistic updates (e.g., voting)
        setNotices // Exported for direct state manipulation if needed
    };
}
