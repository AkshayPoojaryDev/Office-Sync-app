// client/src/hooks/useNotices.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

/**
 * Custom hook for managing notices
 * Handles fetching, pagination, and state management
 * Optimized with proper cleanup and memoization
 */
export function useNotices(initialLimit = 5) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const offsetRef = useRef(0); // Use ref to avoid dependency issues

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

            setHasMore(data.length === initialLimit);
        } catch (err) {
            console.error("Fetch notices failed:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [initialLimit]);

    const refresh = useCallback(() => {
        offsetRef.current = 0;
        fetchNotices(true);
    }, [fetchNotices]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchNotices(false);
        }
    }, [loading, hasMore, fetchNotices]);

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
        updateNotice, // Exported for optimistic updates
        setNotices // Exported if needed for other manipulations
    };
}
