// Professional NoticeBoard Component - Sticky Note Design
import { forwardRef, useImperativeHandle, useState } from "react";
import { useNotices } from "../hooks/useNotices";
import { api } from "../utils/api";
import toast from "react-hot-toast";

// Sticky note colors for different types
const STICKY_CONFIG = {
  general: {
    bg: 'bg-yellow-100 dark:bg-yellow-200',
    shadow: 'shadow-yellow-200/50',
    pin: 'bg-red-500',
    label: 'General',
    rotate: 'rotate-[-1deg]'
  },
  important: {
    bg: 'bg-blue-100 dark:bg-blue-200',
    shadow: 'shadow-blue-200/50',
    pin: 'bg-blue-600',
    label: 'Important',
    rotate: 'rotate-[1deg]'
  },
  urgent: {
    bg: 'bg-pink-100 dark:bg-pink-200',
    shadow: 'shadow-pink-200/50',
    pin: 'bg-pink-600',
    label: '🔥 Urgent',
    rotate: 'rotate-[-2deg]'
  },
  holiday: {
    bg: 'bg-green-100 dark:bg-green-200',
    shadow: 'shadow-green-200/50',
    pin: 'bg-green-600',
    label: '🎉 Holiday',
    rotate: 'rotate-[2deg]'
  }
};

const NoticeBoard = forwardRef(({ userRole }, ref) => {
  const { notices, loading, error, hasMore, refresh, loadMore } = useNotices(10);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', message: '', type: 'general' });

  useImperativeHandle(ref, () => ({ refresh }));

  const getStickyStyle = (type, index) => {
    const config = STICKY_CONFIG[type] || STICKY_CONFIG.general;
    // Alternate rotation for variety
    const rotations = ['rotate-[-1deg]', 'rotate-[1deg]', 'rotate-[-2deg]', 'rotate-[2deg]', 'rotate-0'];
    return { ...config, rotate: rotations[index % rotations.length] };
  };

  const handleEdit = (notice) => {
    setEditingId(notice.id);
    setEditForm({ title: notice.title, message: notice.message, type: notice.type });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', message: '', type: 'general' });
  };

  const handleUpdate = async (id) => {
    const toastId = toast.loading("Updating announcement...");
    try {
      await api.updateNotice(id, editForm);
      toast.success("Announcement updated successfully", { id: toastId });
      setEditingId(null);
      refresh();
    } catch (error) {
      toast.error(error || "Failed to update announcement", { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    const toastId = toast.loading("Deleting announcement...");
    try {
      await api.deleteNotice(id);
      toast.success("Announcement deleted successfully", { id: toastId });
      refresh();
    } catch (error) {
      toast.error(error || "Failed to delete announcement", { id: toastId });
    }
  };

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Cork Board Header */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-4 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📌</span>
          <h3 className="text-lg font-bold text-amber-100">Office Announcements</h3>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-sm text-amber-200 hover:text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Cork Board Background */}
      <div
        className="p-6 min-h-[400px]"
        style={{
          background: 'linear-gradient(135deg, #c4a574 0%, #a68a5b 50%, #8b7355 100%)',
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(139, 115, 85, 0.3) 0%, transparent 20%),
            radial-gradient(circle at 80% 70%, rgba(139, 115, 85, 0.3) 0%, transparent 20%),
            radial-gradient(circle at 50% 50%, rgba(139, 115, 85, 0.2) 0%, transparent 30%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"),
            linear-gradient(135deg, #c4a574 0%, #a68a5b 50%, #8b7355 100%)
          `
        }}
      >
        {loading && notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-800 mb-4"></div>
            <p className="text-amber-900 font-medium">Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white/80 rounded-lg p-6 text-center shadow-lg">
              <p className="text-red-600 font-medium mb-2">Failed to load announcements</p>
              <button onClick={refresh} className="text-sm text-amber-700 hover:underline font-medium">Try again</button>
            </div>
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-yellow-100 rounded-lg p-8 text-center shadow-lg transform rotate-[-2deg]">
              <span className="text-4xl mb-4 block">📝</span>
              <p className="text-amber-800 font-medium">No announcements yet</p>
              <p className="text-amber-600 text-sm mt-1">Check back later!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Sticky Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notices.map((notice, index) => {
                const stickyStyle = getStickyStyle(notice.type, index);
                const isEditing = editingId === notice.id;

                return (
                  <div
                    key={notice.id}
                    className={`relative ${stickyStyle.rotate} hover:rotate-0 transition-transform duration-300 group`}
                  >
                    {/* Pushpin */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                      <div className={`w-6 h-6 ${stickyStyle.pin} rounded-full shadow-lg flex items-center justify-center`}>
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                      </div>
                      <div className="w-1 h-3 bg-gray-400 mx-auto -mt-1 rounded-b-sm shadow-sm"></div>
                    </div>

                    {/* Sticky Note */}
                    <div className={`${stickyStyle.bg} p-5 pt-6 rounded shadow-lg ${stickyStyle.shadow} min-h-[180px] flex flex-col relative overflow-hidden group-hover:shadow-xl transition-shadow`}>
                      {/* Folded corner effect */}
                      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-black/10 to-transparent"></div>

                      {isEditing ? (
                        // Edit Mode
                        <div className="space-y-3 relative z-10">
                          <input
                            className="w-full px-3 py-2 bg-white/70 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="Title"
                            maxLength={100}
                          />
                          <textarea
                            className="w-full px-3 py-2 bg-white/70 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm resize-none"
                            rows="3"
                            value={editForm.message}
                            onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                            placeholder="Message"
                            maxLength={1000}
                          />
                          <div className="flex gap-2 flex-wrap">
                            {Object.entries(STICKY_CONFIG).map(([key, config]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setEditForm({ ...editForm, type: key })}
                                className={`px-2 py-1 rounded text-xs font-medium transition ${editForm.type === key
                                    ? `${config.bg} ring-2 ring-gray-400`
                                    : 'bg-white/50 hover:bg-white/70'
                                  }`}
                              >
                                {config.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleUpdate(notice.id)}
                              className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded text-xs transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded text-xs transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          {/* Admin Controls */}
                          {userRole === 'admin' && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                onClick={() => handleEdit(notice)}
                                className="p-1.5 bg-white/80 hover:bg-white rounded-full shadow transition-all"
                                title="Edit"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(notice.id)}
                                className="p-1.5 bg-white/80 hover:bg-red-100 rounded-full shadow transition-all"
                                title="Delete"
                              >
                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}

                          {/* Type Badge */}
                          <span className="inline-block px-2 py-0.5 bg-white/50 rounded text-xs font-semibold text-gray-700 mb-2 w-fit">
                            {stickyStyle.label}
                          </span>

                          {/* Title */}
                          <h4 className="text-base font-bold text-gray-800 mb-2 leading-tight font-handwriting">
                            {notice.title}
                          </h4>

                          {/* Message */}
                          <p className="text-gray-700 text-sm leading-relaxed flex-1 line-clamp-4">
                            {notice.message}
                          </p>

                          {/* Footer */}
                          <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              {notice.authorName || notice.author?.split('@')[0]}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(notice.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium rounded-lg shadow-lg transition-all disabled:opacity-50 transform hover:scale-105"
                >
                  {loading ? 'Loading...' : '📋 Load More Notes'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

NoticeBoard.displayName = 'NoticeBoard';
export default NoticeBoard;