// client/src/hooks/useNotices.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Custom hook for managing notices
 * Handles fetching, pagination, and state management
 */
export function useNotices(initialLimit = 5) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    const fetchNotices = useCallback(async (reset = false) => {
        try {
            setLoading(true);
            setError(null);

            const currentOffset = reset ? 0 : offset;
            const response = await api.getNotices({
                limit: initialLimit,
                offset: currentOffset
            });

            if (reset) {
                setNotices(response.data);
                setOffset(initialLimit);
            } else {
                setNotices(prev => [...prev, ...response.data]);
                setOffset(prev => prev + initialLimit);
            }

            // If we got fewer items than requested, we've reached the end
            setHasMore(response.data.length === initialLimit);
        } catch (err) {
            setError(err);
            console.error('Error fetching notices:', err);
        } finally {
            setLoading(false);
        }
    }, [offset, initialLimit]);

    const refresh = useCallback(() => {
        setOffset(0);
        fetchNotices(true);
    }, [fetchNotices]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchNotices(false);
        }
    }, [loading, hasMore, fetchNotices]);

    useEffect(() => {
        fetchNotices(true);
    }, []);

    return {
        notices,
        loading,
        error,
        hasMore,
        refresh,
        loadMore,
    };
}
