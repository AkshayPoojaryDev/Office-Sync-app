// Professional Dashboard - Complete Implementation
// This file is intentionally large due to comprehensive redesign
// See DESIGN_NOTES.md for design rationale

import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import NoticeBoard from "../components/NoticeBoard";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";

function Dashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ tea: 0, coffee: 0, juice: 0 });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const noticeBoardRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: "", message: "", type: "general" });
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    fetchStats();
    checkRole();
  }, []);

  const checkRole = async () => {
    try {
      await api.getAdminStats();
      setUserRole('admin');
    } catch {
      setUserRole('user');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.getStats();
      setStats(res.data);
    } catch (err) {
      toast.error("Failed to load today's counts");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleOrder = async (type) => {
    if (loading) return;
    setLoading(true);
    const previousStats = { ...stats };
    setStats(prev => ({ ...prev, [type]: prev[type] + 1 }));
    const toastId = toast.loading(`Placing ${type} order...`);

    try {
      await api.placeOrder({ userId: currentUser.uid, email: currentUser.email, type });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} order placed successfully`, { id: toastId });
      fetchStats();
    } catch (error) {
      setStats(previousStats);
      toast.error(error || "Order failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!newNotice.title?.trim() || !newNotice.message?.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading("Publishing announcement...");
    try {
      await api.createNotice({ title: newNotice.title, message: newNotice.message, type: newNotice.type });
      toast.success("Announcement published successfully", { id: toastId });
      setShowForm(false);
      setNewNotice({ title: "", message: "", type: "general" });
      if (noticeBoardRef.current?.refresh) noticeBoardRef.current.refresh();
    } catch (error) {
      toast.error(error || "Failed to post announcement", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const beverages = [
    { type: 'tea', label: 'Tea', count: stats.tea, color: 'from-blue-500 to-indigo-600', icon: '🫖', accentColor: 'blue' },
    { type: 'coffee', label: 'Coffee', count: stats.coffee, color: 'from-amber-500 to-orange-600', icon: '☕', accentColor: 'amber' },
    { type: 'juice', label: 'Juice', count: stats.juice, color: 'from-orange-500 to-red-500', icon: '🧃', accentColor: 'orange' }
  ];

  const noticeTypes = [
    { value: 'general', label: 'General', icon: 'ℹ️', color: 'gray' },
    { value: 'important', label: 'Important', icon: '⭐', color: 'blue' },
    { value: 'urgent', label: 'Urgent', icon: '⚠️', color: 'red' },
    { value: 'holiday', label: 'Holiday', icon: '🎉', color: 'green' }
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back, {currentUser?.email?.split('@')[0]}</p>
      </div>

      {/* Beverage Orders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {beverages.map((bev) => (
          <div key={bev.type} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total {bev.label}</p>
                <p className="text-4xl font-bold text-gray-900">{statsLoading ? '...' : bev.count}</p>
              </div>
              <div className={`w-14 h-14 rounded-full bg-linear-to-br ${bev.color} flex items-center justify-center text-2xl`}>
                {bev.icon}
              </div>
            </div>
            <button
              onClick={() => handleOrder(bev.type)}
              disabled={loading || statsLoading}
              className={`w-full text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${bev.type === 'tea' ? 'bg-blue-600 hover:bg-blue-700' :
                  bev.type === 'coffee' ? 'bg-amber-600 hover:bg-amber-700' :
                    'bg-orange-600 hover:bg-orange-700'
                }`}
            >
              Order {bev.label}
            </button>
          </div>
        ))}
      </div>

      {/* Announcements Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          {userRole === 'admin' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center px-4 py-2 bg-[#486581] hover:bg-[#334e68] text-white font-medium rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? 'Cancel' : 'New Announcement'}
            </button>
          )}
        </div>

        {/* Admin Form */}
        {showForm && userRole === 'admin' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Announcement</h3>
            <form onSubmit={handlePostNotice} className="space-y-4">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {noticeTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setNewNotice({ ...newNotice, type: type.value })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${newNotice.type === type.value
                      ? `bg-${type.color}-100 text-${type.color}-700 border-2 border-${type.color}-500`
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                      }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#486581] focus:border-transparent"
                  placeholder="Enter announcement title"
                  value={newNotice.title}
                  onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#486581] focus:border-transparent"
                  placeholder="Write the announcement details..."
                  rows="4"
                  value={newNotice.message}
                  onChange={e => setNewNotice({ ...newNotice, message: e.target.value })}
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{newNotice.message.length}/1000 characters</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-[#486581] hover:bg-[#334e68] text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                  {submitting ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <NoticeBoard ref={noticeBoardRef} userRole={userRole} />
    </Layout>
  );
}

export default Dashboard;