// client/src/pages/Profile.jsx
// Enhanced User Profile Page with order statistics and improved UI
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import Layout from "../components/Layout";
import { useUserStats } from "../hooks/useMetrics";

export default function Profile() {
    const { currentUser, isAdmin } = useAuth();
    const [userRole, setUserRole] = useState(isAdmin ? 'admin' : 'user');
    const { orderStats, loading } = useUserStats(currentUser?.uid);

    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
    const email = currentUser?.email || '';

    // Update local role state if context updates
    useEffect(() => {
        setUserRole(isAdmin ? 'admin' : 'user');
    }, [isAdmin]);

    const formattedStats = {
        total: orderStats.totalOrders,
        tea: orderStats.typeCounts?.tea || 0,
        coffee: orderStats.typeCounts?.coffee || 0,
        juice: orderStats.typeCounts?.juice || 0,
        favorite: orderStats.favoriteBeverage === 'None' ? null : orderStats.favoriteBeverage?.toLowerCase()
    };

    const getFavoriteIcon = () => {
        switch (formattedStats.favorite) {
            case 'tea': return '🫖';
            case 'coffee': return '☕';
            case 'juice': return '🧃';
            default: return '🍹';
        }
    };

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Your account information and order statistics</p>
            </div>

            <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Profile Card */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* Profile Header with Avatar */}
                        <div className="relative bg-gradient-to-br from-[#243b53] to-[#102a43] px-6 py-10">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                            <div className="relative flex items-center gap-5">
                                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold shadow-xl ring-4 ring-white/30 transform hover:scale-105 transition-transform">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${userRole === 'admin'
                                            ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                                            : 'bg-blue-400/20 text-blue-200 border border-blue-400/30'
                                            }`}>
                                            {userRole === 'admin' ? '👑 Admin' : '👤 Employee'}
                                        </span>
                                    </div>
                                    <p className="text-blue-100/80 text-sm mt-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="p-6 space-y-5">
                            {/* Display Name Field */}
                            <div className="group">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Display Name
                                </label>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500 transition-colors">
                                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-gray-900 dark:text-white font-medium">{displayName}</span>
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="group">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Email Address
                                </label>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500 transition-colors">
                                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-gray-900 dark:text-white font-medium">{email}</span>
                                </div>
                            </div>

                            {/* Role Field */}
                            <div className="group">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Account Role
                                </label>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500 transition-colors">
                                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className="text-gray-900 dark:text-white font-medium capitalize">{userRole}</span>
                                    {userRole === 'admin' && (
                                        <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 font-medium">Full Access</span>
                                    )}
                                </div>
                            </div>

                            {/* Account Status */}
                            <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                                        <span>Account active</span>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        Member since {new Date().getFullYear()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Statistics Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Order Statistics
                        </h3>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-12 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Orders</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{formattedStats.total}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">🫖 Tea</span>
                                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{formattedStats.tea}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">☕ Coffee</span>
                                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{formattedStats.coffee}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <span className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">🧃 Juice</span>
                                    <span className="text-lg font-bold text-orange-700 dark:text-orange-300">{formattedStats.juice}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Favorite Beverage Card */}
                    {!loading && formattedStats.favorite && (
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
                            <p className="text-purple-100 text-xs font-medium uppercase tracking-wider mb-2">Your Favorite</p>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">{getFavoriteIcon()}</span>
                                <div>
                                    <p className="text-xl font-bold capitalize">{formattedStats.favorite}</p>
                                    <p className="text-purple-200 text-sm">
                                        {formattedStats[formattedStats.favorite]} orders total
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link to="/order-history" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">View Order History</span>
                            </Link>
                            <Link to="/dashboard" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Go to Dashboard</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
