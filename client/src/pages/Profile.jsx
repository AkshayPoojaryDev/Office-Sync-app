// client/src/pages/Profile.jsx
// User Profile Page - Display user information
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";

export default function Profile() {
    const { currentUser } = useAuth();

    // Extract display name from email or use provided display name
    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
    const email = currentUser?.email || '';

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                <p className="mt-1 text-sm text-gray-600">Your account information</p>
            </div>

            {/* Profile Card */}
            <div className="max-w-2xl">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Profile Header with Avatar */}
                    <div className="bg-gradient-to-br from-[#243b53] to-[#102a43] px-6 py-8">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white/30">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                                <p className="text-blue-100 text-sm mt-1">{email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-6 space-y-6">
                        {/* Name Field */}
                        <div className="group">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Display Name
                            </label>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-gray-900 font-medium">{displayName}</span>
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="group">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-900 font-medium">{email}</span>
                            </div>
                        </div>

                        {/* Account Status */}
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span>Account active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
