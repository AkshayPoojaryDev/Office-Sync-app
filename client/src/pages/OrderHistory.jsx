// client/src/pages/OrderHistory.jsx - PROFESSIONAL DESIGN
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function OrderHistory() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.getUserOrders(currentUser.uid);
            setOrders(response.data.orders || []);
        } catch (error) {
            toast.error("Failed to load order history");
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(order => order.type === filter);

    const stats = {
        total: orders.length,
        tea: orders.filter(o => o.type === 'tea').length,
        coffee: orders.filter(o => o.type === 'coffee').length,
        juice: orders.filter(o => o.type === 'juice').length
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Time', 'Type', 'Email'];
        const rows = filteredOrders.map(order => [
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
                <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
                <p className="mt-1 text-sm text-gray-600">View and export your beverage orders</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-medium text-gray-600 mb-1">Tea Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.tea}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-medium text-gray-600 mb-1">Coffee Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.coffee}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-medium text-gray-600 mb-1">Juice Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.juice}</p>
                </div>
            </div>

            {/* Filters and Export */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            onClick={() => setFilter('tea')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'tea'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                        >
                            Tea ({stats.tea})
                        </button>
                        <button
                            onClick={() => setFilter('coffee')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'coffee'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                        >
                            Coffee ({stats.coffee})
                        </button>
                        <button
                            onClick={() => setFilter('juice')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'juice'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                }`}
                        >
                            Juice ({stats.juice})
                        </button>
                    </div>
                    <button
                        onClick={exportToCSV}
                        disabled={filteredOrders.length === 0}
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
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-gray-600">No orders found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order, index) => (
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

                {/* Pagination info */}
                {!loading && filteredOrders.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-600">
                            Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
