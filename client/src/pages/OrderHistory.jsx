// client/src/pages/OrderHistory.jsx - PROFESSIONAL DESIGN
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { useUserStats } from "../hooks/useMetrics";

/**
 * OrderHistory Page
 * Displays a paginated list of the user's past orders with filtering options.
 * Allows exporting order history to CSV.
 */
export default function OrderHistory() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Use cached stats for the summary cards
    const { orderStats: stats } = useUserStats(currentUser?.uid);

    // Pagination state
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;

    useEffect(() => {
        fetchOrders(true); // Initial fetch when component mounts
    }, []);

    // Better to use useEffect for filter changes to trigger refetch
    useEffect(() => {
        fetchOrders(true);
    }, [filter]);

    /**
     * Fetches orders from the API
     * @param {boolean} reset - If true, clears existing orders and starts from offset 0
     */
    const fetchOrders = async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
                setOffset(0);
            }

            const currentOffset = reset ? 0 : offset;

            const response = await api.getUserOrders(currentUser.uid, {
                limit: LIMIT,
                offset: currentOffset,
                type: filter === 'all' ? undefined : filter // Pass filter only if not 'all'
            });

            if (reset) {
                setOrders(response.data.orders || []);
            } else {
                setOrders(prev => [...prev, ...response.data.orders]);
            }

            const pagination = response.data.pagination;
            setHasMore(pagination.hasMore);
            setOffset(currentOffset + LIMIT);
        } catch (error) {
            toast.error("Failed to load order history");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilter) => {
        if (newFilter === filter) return;
        setFilter(newFilter);
    };

    /**
     * Generates and downloads a CSV file of the current orders
     */
    const exportToCSV = () => {
        const headers = ['Date', 'Time', 'Type', 'Email'];
        const rows = orders.map(order => [
            new Date(order.timestamp).toLocaleDateString(),
            new Date(order.timestamp).toLocaleTimeString(),
            order.type,
            order.email
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Order history exported successfully");
    };

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order History</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">View and export your beverage orders</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tea Orders</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.typeCounts?.tea || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Coffee Orders</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.typeCounts?.coffee || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Juice Orders</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.typeCounts?.juice || 0}</p>
                </div>
            </div>

            {/* Filters and Export Controls */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleFilterChange('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => handleFilterChange('tea')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'tea'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30'
                                }`}
                        >
                            Tea
                        </button>
                        <button
                            onClick={() => handleFilterChange('coffee')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'coffee'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30'
                                }`}
                        >
                            Coffee
                        </button>
                        <button
                            onClick={() => handleFilterChange('juice')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'juice'
                                ? 'bg-orange-600 text-white'
                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30'
                                }`}
                        >
                            Juice
                        </button>
                    </div>
                    <button
                        onClick={exportToCSV}
                        disabled={orders.length === 0}
                        className="inline-flex items-center px-4 py-2 bg-[#486581] hover:bg-[#334e68] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                            <span className="ml-3 text-gray-600">Loading orders...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-gray-600">No orders found</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {new Date(order.timestamp).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(order.timestamp).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${order.type === 'tea'
                                                ? 'bg-blue-100 text-blue-700'
                                                : order.type === 'coffee'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {order.type === 'tea' ? '🫖 Tea' : order.type === 'coffee' ? '☕ Coffee' : '🧃 Juice'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {order.email}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination info and Load More */}
                {!loading && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {orders.length} orders
                        </p>

                        {hasMore && (
                            <button
                                onClick={() => fetchOrders(false)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                            >
                                Load More Orders
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
