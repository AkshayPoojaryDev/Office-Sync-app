// Professional Dashboard - FUN & POP REDESIGN
// This file is intentionally large due to comprehensive redesign
// See DESIGN_NOTES.md for design rationale

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import Layout from "../components/Layout";
import NoticeBoard from "../components/NoticeBoard";
import CountdownTimer from "../components/CountdownTimer";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { useStats, useMyOrders } from "../hooks/useMetrics";

/**
 * Dashboard Component
 * The main hub for users to place orders, view stats, and see announcements.
 * Admins have additional controls to post notices and polls.
 */
function Dashboard() {
  const { currentUser, isAdmin } = useAuth();

  // Use SWR hooks for caching and real-time-like updates
  const { stats, loading: statsLoading, mutate: mutateStats } = useStats();
  const { myOrders, loading: ordersLoading, mutate: mutateOrders } = useMyOrders();

  // Local state for UI interactions
  const [loading, setLoading] = useState(false); // Only for order submission
  const noticeBoardRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: "", message: "", type: "general" });
  const [submitting, setSubmitting] = useState(false);
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Helper to check if user entered an order in current slot
  // Prevents double ordering within the same time window
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

    // Check if any of the user's recent orders fall into the current slot
    return myOrders.some(order => {
      const orderDate = new Date(order.timestamp);
      const orderMinutes = orderDate.getHours() * 60 + orderDate.getMinutes();

      if (currentSlot === 'morning') return orderMinutes <= morningEnd;
      if (currentSlot === 'evening') return orderMinutes >= eveningStart && orderMinutes <= eveningEnd;
      return false;
    });
  };

  const isOrderDisabled = hasOrderedInCurrentSlot();

  // Handle beverage order submission
  const handleOrder = async (type) => {
    if (loading) return;
    if (isOrderDisabled) {
      toast.error("You have already placed an order for this slot.");
      return;
    }

    setLoading(true);
    // Optimistic UI update logic could go here, but simple revalidate is safer for consistency
    const toastId = toast.loading(`Placing ${type} order...`);

    try {
      await api.placeOrder({ userId: currentUser.uid, email: currentUser.email, type });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} order placed successfully! 🎉`, { id: toastId });

      // Fun Confetti Explosion!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: type === 'tea' ? ['#2dd4bf', '#14b8a6'] : type === 'coffee' ? ['#f59e0b', '#d97706'] : ['#ec4899', '#db2777']
      });

      // Revalidate cache instantly to update global stats and user history
      mutateStats();
      mutateOrders();
    } catch (error) {
      toast.error(error || "Order failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Handle new notice or poll creation (Admin only)
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
        noticeData.allowMultiple = newNotice.allowMultiple;
      }

      await api.createNotice(noticeData);
      toast.success(isPollMode ? "Poll created successfully! 📊" : "Announcement published successfully", { id: toastId });

      // Reset form state
      setShowForm(false);
      setNewNotice({ title: "", message: "", type: "general" });
      setIsPollMode(false);
      setPollOptions(['', '']);

      // Refresh the notice board list
      if (noticeBoardRef.current?.refresh) noticeBoardRef.current.refresh();
    } catch (error) {
      toast.error(error || "Failed to post announcement", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Beverage configuration for UI mapping
  const beverages = [
    { type: 'tea', label: 'Tea', count: stats.tea, color: 'from-cyan-400 to-teal-500', shadow: 'shadow-teal-500/40', icon: '🫖', buttonBg: 'bg-teal-500' },
    { type: 'coffee', label: 'Coffee', count: stats.coffee, color: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/40', icon: '☕', buttonBg: 'bg-orange-500' },
    { type: 'juice', label: 'Juice', count: stats.juice, color: 'from-pink-400 to-rose-500', shadow: 'shadow-pink-500/40', icon: '🧃', buttonBg: 'bg-pink-500' }
  ];

  // Notice types configuration
  const noticeTypes = [
    { value: 'general', label: 'General', icon: 'ℹ️', color: 'gray' },
    { value: 'important', label: 'Important', icon: '⭐', color: 'blue' },
    { value: 'urgent', label: 'Urgent', icon: '⚠️', color: 'red' },
    { value: 'holiday', label: 'Holiday', icon: '🎉', color: 'green' }
  ];

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight font-fun">
              Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400">{currentUser?.email?.split('@')[0]}</span> 👋
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Ready for your daily fuel?</p>
          </div>
          <div className="glass-panel p-2 rounded-2xl">
            <CountdownTimer />
          </div>
        </div>
      </div>

      {/* Beverage Orders Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {beverages.map((bev, index) => (
          <div
            key={bev.type}
            className={`relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-xl ${bev.shadow} transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group animate-slide-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background Decoration */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${bev.color} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className={`w-20 h-20 mb-4 rounded-full bg-gradient-to-br ${bev.color} flex items-center justify-center text-4xl shadow-lg group-hover:rotate-12 transition-transform duration-300`}>
                {bev.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 font-fun">{bev.label}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium uppercase tracking-wider">Total Orders</p>

              <div className="text-5xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter">
                {statsLoading ? (
                  <div className="h-12 w-12 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                ) : (
                  <span className="animate-count-up block">{bev.count}</span>
                )}
              </div>

              <button
                onClick={() => handleOrder(bev.type)}
                disabled={loading || statsLoading || isOrderDisabled}
                className={`w-full text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${bev.buttonBg} hover:brightness-110 animate-jelly`}
              >
                {isOrderDisabled ? 'Ordered ✅' : `Order ${bev.label}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Announcements Section */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white font-fun flex items-center gap-3">
            <span className="text-3xl">📢</span> Notice Board
          </h2>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`inline-flex items-center px-5 py-2.5 font-bold rounded-xl transition-all duration-200 shadow-md ${showForm
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30'}`}
            >
              <svg className={`w-5 h-5 mr-2 transition-transform ${showForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? 'Cancel' : 'New Post'}
            </button>
          )}
        </div>

        {/* Admin Form: Create Announcement or Poll */}
        {showForm && isAdmin && (
          <div className="glass-panel p-6 mb-8 rounded-3xl animate-fade-in border-2 border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 font-fun">
                {isPollMode ? '📊 Create Poll' : '✍️ Create Announcement'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsPollMode(!isPollMode);
                  if (!isPollMode) setPollOptions(['', '']);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isPollMode
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-2 ring-purple-500'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  }`}
              >
                Switch to {isPollMode ? 'Announcement' : 'Poll'} 🔄
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-5">
              {/* Type selector - only show when not in poll mode */}
              {!isPollMode && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {noticeTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewNotice({ ...newNotice, type: type.value })}
                      className={`px-3 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${newNotice.type === type.value
                        ? `bg-${type.color}-100 text-${type.color}-700 ring-2 ring-${type.color}-500 shadow-md transform scale-105`
                        : 'bg-white dark:bg-slate-800 text-gray-600 border border-gray-200 dark:border-slate-600 hover:bg-gray-50'
                        }`}
                    >
                      <span>{type.icon}</span> {type.label}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {isPollMode ? 'Question' : 'Title'}
                </label>
                <input
                  className="w-full px-5 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 dark:bg-slate-800 dark:text-white transition-all font-medium"
                  placeholder={isPollMode ? "e.g. Where should we go for lunch?" : "Enter an eye-catching title..."}
                  value={newNotice.title}
                  onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {isPollMode ? 'Description (optional)' : 'Message'}
                </label>
                <textarea
                  className="w-full px-5 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 dark:bg-slate-800 dark:text-white transition-all font-medium"
                  placeholder={isPollMode ? "Add context..." : "Write your message here..."}
                  rows={isPollMode ? 2 : 4}
                  value={newNotice.message}
                  onChange={e => setNewNotice({ ...newNotice, message: e.target.value })}
                  maxLength={1000}
                  required={!isPollMode}
                />
              </div>

              {/* Poll Options */}
              {isPollMode && (
                <div className="space-y-3 p-5 border-2 border-purple-100 dark:border-purple-800 rounded-2xl bg-purple-50/50 dark:bg-purple-900/10">
                  <label className="block text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wide">
                    <span>📊</span>
                    Poll Options
                  </label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="flex items-center justify-center w-8 h-10 font-bold text-purple-300">{index + 1}</span>
                      <input
                        className="flex-1 px-4 py-2 border-2 border-purple-100 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-800 dark:text-white bg-white font-medium"
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
                          className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="ml-10 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold px-3 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Another Option
                    </button>
                  )}

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-purple-100 dark:border-purple-800 ml-2">
                    <input
                      type="checkbox"
                      id="allowMultiple"
                      checked={newNotice.allowMultiple || false}
                      onChange={(e) => setNewNotice({ ...newNotice, allowMultiple: e.target.checked })}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="allowMultiple" className="text-sm font-bold text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                      Allow multiple selections
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setIsPollMode(false);
                    setPollOptions(['', '']);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-6 py-3 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none ${isPollMode
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-purple-500/30'
                    : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-indigo-500/30'
                    }`}
                >
                  {submitting ? (isPollMode ? 'Creating...' : 'Publishing...') : (isPollMode ? '🚀 Launch Poll' : '🚀 Publish')}
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