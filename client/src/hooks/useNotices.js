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

            if (reset) {
                setNotices(response.data);
                offsetRef.current = initialLimit;
            } else {
                setNotices(prev => [...prev, ...response.data]);
                offsetRef.current += initialLimit;
            }

            setHasMore(response.data.length === initialLimit);
        } catch (err) {
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

    return {
        notices,
        loading,
        error,
        hasMore,
        refresh,
        loadMore,
    };
}
