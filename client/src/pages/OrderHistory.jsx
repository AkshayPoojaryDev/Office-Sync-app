// client/src/pages/OrderHistory.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { TableRowSkeleton } from "../components/LoadingSkeleton";

export default function OrderHistory() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'tea', 'coffee'

    useEffect(() => {
        fetchOrders();
    }, [currentUser]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.getUserOrders(currentUser.uid);

            if (response.data.success) {
                // Sort by date descending
                const sorted = response.data.orders.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                setOrders(sorted);
            }
        } catch (error) {
            console.error("Failed to fetch order history:", error);
            toast.error("Failed to load order history");
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(order => order.type === filter);

    const exportToCSV = () => {
        if (orders.length === 0) {
            toast.error("No orders to export");
            return;
        }

        const headers = ['Date', 'Type', 'Time'];
        const rows = orders.map(order => [
            order.date,
            order.type.charAt(0).toUpperCase() + order.type.slice(1),
            new Date(order.timestamp).toLocaleTimeString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.success("Order history exported successfully!");
    };

    const stats = {
        total: orders.length,
        tea: orders.filter(o => o.type === 'tea').length,
        coffee: orders.filter(o => o.type === 'coffee').length
    };

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">My Order History</h1>
                <p className="text-gray-600">View all your beverage orders</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-500 font-semibold">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500 font-semibold">Tea Orders</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.tea}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
                    <p className="text-sm text-gray-500 font-semibold">Coffee Orders</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.coffee}</p>
                </div>
            </div>

            {/* Filters and Export */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Filter:</span>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === 'all'
                                    ? 'bg-gray-800 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All ({orders.length})
                        </button>
                        <button
                            onClick={() => setFilter('tea')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === 'tea'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Tea ({stats.tea})
                        </button>
                        <button
                            onClick={() => setFilter('coffee')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === 'coffee'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Coffee ({stats.coffee})
                        </button>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition"
                    >
                        📊 Export CSV
                    </button>
                </div>
            </div>

            {/* Order History Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <>
                                <TableRowSkeleton />
                                <TableRowSkeleton />
                                <TableRowSkeleton />
                            </>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                    {filter === 'all' ? 'No orders yet' : `No ${filter} orders found`}
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(order.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(order.timestamp).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${order.type === 'tea'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.type === 'tea' ? '🍵 Tea' : '☕ Coffee'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            ✓ Completed
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
}
