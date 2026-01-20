// client/src/pages/AdminDashboard.jsx - PROFESSIONAL ENTERPRISE ADMIN PANEL
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import Layout from "../components/Layout";

export default function AdminDashboard() {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const fetchAdminStats = async () => {
        try {
            setLoading(true);
            const response = await api.getAdminStats();

            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch admin stats:", error);
            toast.error("Failed to load admin statistics");
        } finally {
            setLoading(false);
        }
    };

    const totals = stats.reduce((acc, day) => ({
        tea: acc.tea + day.tea,
        coffee: acc.coffee + day.coffee,
        juice: acc.juice + day.juice,
        total: acc.total + day.total
    }), { tea: 0, coffee: 0, juice: 0, total: 0 });

    const maxOrders = Math.max(...stats.map(s => s.total), 1);

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Analytics and insights for the last 7 days</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.total}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 7 days</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tea Orders</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.tea}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{((totals.tea / totals.total) * 100 || 0).toFixed(1)}% of total</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🫖</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Coffee Orders</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.coffee}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{((totals.coffee / totals.total) * 100 || 0).toFixed(1)}% of total</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">☕</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Juice Orders</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.juice}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{((totals.juice / totals.total) * 100 || 0).toFixed(1)}% of total</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🧃</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Daily Trend Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Order Trend</h3>

                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.map((day, index) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-gray-700">
                                            {new Date(day.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                        <span className="text-gray-600 font-semibold">{day.total}</span>
                                    </div>
                                    <div className="flex gap-1 h-8">
                                        {day.tea > 0 && (
                                            <div
                                                className="bg-blue-500 rounded transition-all duration-300 hover:bg-blue-600"
                                                style={{ width: `${(day.tea / maxOrders) * 100}%` }}
                                                title={`${day.tea} tea`}
                                            />
                                        )}
                                        {day.coffee > 0 && (
                                            <div
                                                className="bg-amber-500 rounded transition-all duration-300 hover:bg-amber-600"
                                                style={{ width: `${(day.coffee / maxOrders) * 100}%` }}
                                                title={`${day.coffee} coffee`}
                                            />
                                        )}
                                        {day.juice > 0 && (
                                            <div
                                                className="bg-orange-500 rounded transition-all duration-300 hover:bg-orange-600"
                                                style={{ width: `${(day.juice / maxOrders) * 100}%` }}
                                                title={`${day.juice} juice`}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span className="text-xs text-gray-600">Tea</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-500 rounded"></div>
                            <span className="text-xs text-gray-600">Coffee</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded"></div>
                            <span className="text-xs text-gray-600">Juice</span>
                        </div>
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Distribution</h3>

                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            {/* Donut Chart Representation */}
                            <div className="relative w-56 h-56 mb-8">
                                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                                    {totals.total > 0 && (
                                        <>
                                            {/* Tea */}
                                            <circle
                                                cx="100"
                                                cy="100"
                                                r="70"
                                                fill="transparent"
                                                stroke="#3b82f6"
                                                strokeWidth="40"
                                                strokeDasharray={`${(totals.tea / totals.total) * 440} 440`}
                                            />
                                            {/* Coffee */}
                                            <circle
                                                cx="100"
                                                cy="100"
                                                r="70"
                                                fill="transparent"
                                                stroke="#f59e0b"
                                                strokeWidth="40"
                                                strokeDasharray={`${(totals.coffee / totals.total) * 440} 440`}
                                                strokeDashoffset={`-${(totals.tea / totals.total) * 440}`}
                                            />
                                            {/* Juice */}
                                            <circle
                                                cx="100"
                                                cy="100"
                                                r="70"
                                                fill="transparent"
                                                stroke="#f97316"
                                                strokeWidth="40"
                                                strokeDasharray={`${(totals.juice / totals.total) * 440} 440`}
                                                strokeDashoffset={`-${((totals.tea + totals.coffee) / totals.total) * 440}`}
                                            />
                                        </>
                                    )}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-4xl font-bold text-gray-900">{totals.total}</p>
                                        <p className="text-sm text-gray-600">Total</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="w-full space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                        <span className="text-sm text-gray-700 font-medium">Tea</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {totals.tea} ({((totals.tea / totals.total) * 100 || 0).toFixed(1)}%)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-amber-500 rounded"></div>
                                        <span className="text-sm text-gray-700 font-medium">Coffee</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {totals.coffee} ({((totals.coffee / totals.total) * 100 || 0).toFixed(1)}%)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                        <span className="text-sm text-gray-700 font-medium">Juice</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {totals.juice} ({((totals.juice / totals.total) * 100 || 0).toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Daily Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tea</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Coffee</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Juice</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : stats.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                stats.map((day, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {new Date(day.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{day.tea}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{day.coffee}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{day.juice}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{day.total}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
