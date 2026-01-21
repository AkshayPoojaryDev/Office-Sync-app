// Professional Dashboard - Complete Implementation
// This file is intentionally large due to comprehensive redesign
// See DESIGN_NOTES.md for design rationale

import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import NoticeBoard from "../components/NoticeBoard";
import CountdownTimer from "../components/CountdownTimer";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";

function Dashboard() {
  const { currentUser, isAdmin } = useAuth();
  const [stats, setStats] = useState({ tea: 0, coffee: 0, juice: 0 });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const noticeBoardRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: "", message: "", type: "general" });
  const [submitting, setSubmitting] = useState(false);
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const res = await api.getMyOrders();
      setMyOrders(res.data.orders);
    } catch (err) {
      console.error("Failed to fetch user orders", err);
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

  // Helper to check if user entered an order in current slot
  const hasOrderedInCurrentSlot = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Slot Logic (Sync with Server)
    const morningEnd = 10 * 60 + 30; // 10:30
    const eveningStart = 15 * 60;    // 15:00
    const eveningEnd = 17 * 60 + 30; // 17:30

    let currentSlot = null;
    if (currentMinutes <= morningEnd) currentSlot = 'morning';
    else if (currentMinutes >= eveningStart && currentMinutes <= eveningEnd) currentSlot = 'evening';

    if (!currentSlot) return false; // Not in a slot at all

    // Check orders
    return myOrders.some(order => {
      const orderDate = new Date(order.timestamp);
      const orderMinutes = orderDate.getHours() * 60 + orderDate.getMinutes();

      if (currentSlot === 'morning') return orderMinutes <= morningEnd;
      if (currentSlot === 'evening') return orderMinutes >= eveningStart && orderMinutes <= eveningEnd;
      return false;
    });
  };

  const isOrderDisabled = hasOrderedInCurrentSlot();

  const handleOrder = async (type) => {
    if (loading) return;
    if (isOrderDisabled) {
      toast.error("You have already placed an order for this slot.");
      return;
    }

    setLoading(true);
    const previousStats = { ...stats };
    setStats(prev => ({ ...prev, [type]: prev[type] + 1 }));
    const toastId = toast.loading(`Placing ${type} order...`);

    try {
      await api.placeOrder({ userId: currentUser.uid, email: currentUser.email, type });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} order placed successfully`, { id: toastId });
      fetchStats();
      fetchMyOrders(); // Refresh orders to disable button
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

    // Validate poll options if in poll mode
    if (isPollMode) {
      const validOptions = pollOptions.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        toast.error("Please add at least 2 poll options");
        return;
      }
    }

    setSubmitting(true);
    const toastId = toast.loading(isPollMode ? "Creating poll..." : "Publishing announcement...");
    try {
      const noticeData = {
        title: newNotice.title,
        message: newNotice.message,
        type: isPollMode ? 'poll' : newNotice.type
      };

      // Add poll options if in poll mode
      if (isPollMode) {
        noticeData.pollOptions = pollOptions.filter(opt => opt.trim() !== '');
      }

      await api.createNotice(noticeData);
      toast.success(isPollMode ? "Poll created successfully! 📊" : "Announcement published successfully", { id: toastId });
      setShowForm(false);
      setNewNotice({ title: "", message: "", type: "general" });
      setIsPollMode(false);
      setPollOptions(['', '']);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Welcome back, {currentUser?.email?.split('@')[0]}</p>
          </div>
          <CountdownTimer />
        </div>
      </div>

      {/* Beverage Orders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {beverages.map((bev) => (
          <div
            key={bev.type}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:scale-[1.02] hover:border-gray-300 transition-all duration-300 ease-out group"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total {bev.label}</p>
                <p className="text-4xl font-bold text-gray-900 transition-transform group-hover:scale-105">{statsLoading ? '...' : bev.count}</p>
              </div>
              <div className={`w-14 h-14 rounded-full bg-linear-to-br ${bev.color} flex items-center justify-center text-2xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                {bev.icon}
              </div>
            </div>
            <button
              onClick={() => handleOrder(bev.type)}
              disabled={loading || statsLoading || isOrderDisabled}
              className={`w-full text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:translate-y-[-2px] active:translate-y-0 disabled:transform-none ${bev.type === 'tea' ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200' :
                bev.type === 'coffee' ? 'bg-amber-600 hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-200' :
                  'bg-orange-600 hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-200'
                }`}
            >
              {isOrderDisabled ? 'Already Ordered' : `Order ${bev.label}`}
            </button>
          </div>
        ))}
      </div>

      {/* Announcements Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          {isAdmin && (
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
        {showForm && isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isPollMode ? '📊 Create Poll' : 'Create Announcement'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsPollMode(!isPollMode);
                  if (!isPollMode) setPollOptions(['', '']);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isPollMode
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  }`}
              >
                📊 {isPollMode ? 'Switch to Announcement' : 'Create Poll'}
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-4">
              {/* Type selector - only show when not in poll mode */}
              {!isPollMode && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {noticeTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewNotice({ ...newNotice, type: type.value })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${newNotice.type === type.value
                        ? `bg-${type.color}-100 text-${type.color}-700 border-2 border-${type.color}-500`
                        : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100 dark:bg-slate-700 dark:text-gray-300'
                        }`}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {isPollMode ? 'Poll Question' : 'Title'}
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#486581] focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder={isPollMode ? "What would you like to ask?" : "Enter announcement title"}
                  value={newNotice.title}
                  onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {isPollMode ? 'Description (optional)' : 'Message'}
                </label>
                <textarea
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#486581] focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder={isPollMode ? "Add more context for the poll..." : "Write the announcement details..."}
                  rows={isPollMode ? 2 : 4}
                  value={newNotice.message}
                  onChange={e => setNewNotice({ ...newNotice, message: e.target.value })}
                  maxLength={1000}
                  required={!isPollMode}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{newNotice.message.length}/1000 characters</p>
              </div>

              {/* Poll Options */}
              {isPollMode && (
                <div className="space-y-3 p-4 border-2 border-purple-200 dark:border-purple-800 rounded-xl bg-purple-50/50 dark:bg-purple-900/10">
                  <label className="block text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <span>📊</span>
                    Poll Options
                  </label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        className="flex-1 px-4 py-2 border-2 border-purple-200 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white bg-white"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[index] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        maxLength={100}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border-2 border-transparent hover:border-red-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium px-2 py-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Option
                    </button>
                  )}
                  <p className="text-xs text-purple-500 dark:text-purple-400">Add 2-6 options for your poll</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setIsPollMode(false);
                    setPollOptions(['', '']);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-colors disabled:opacity-50 ${isPollMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-[#486581] hover:bg-[#334e68] text-white'
                    }`}
                >
                  {submitting ? (isPollMode ? 'Creating Poll...' : 'Publishing...') : (isPollMode ? '📊 Create Poll' : 'Publish')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <NoticeBoard ref={noticeBoardRef} />
    </Layout>
  );
}

export default Dashboard;