// Professional NoticeBoard Component - Sticky Note Design with Polls
import { forwardRef, useImperativeHandle, useState } from "react";
import { useNotices } from "../hooks/useNotices";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import StickyNote from "./StickyNote";

// Configuration for different sticky note types (colors, shadows, labels)
const STICKY_CONFIG = {
  general: {
    bg: 'bg-yellow-100 dark:bg-yellow-200',
    shadow: 'shadow-yellow-200/50',
    pin: 'bg-red-500',
    label: 'General',
  },
  important: {
    bg: 'bg-blue-100 dark:bg-blue-200',
    shadow: 'shadow-blue-200/50',
    pin: 'bg-blue-600',
    label: 'Important',
  },
  urgent: {
    bg: 'bg-pink-100 dark:bg-pink-200',
    shadow: 'shadow-pink-200/50',
    pin: 'bg-pink-600',
    label: '🔥 Urgent',
  },
  holiday: {
    bg: 'bg-green-100 dark:bg-green-200',
    shadow: 'shadow-green-200/50',
    pin: 'bg-green-600',
    label: '🎉 Holiday',
  },
  poll: {
    bg: 'bg-purple-100 dark:bg-purple-200',
    shadow: 'shadow-purple-200/50',
    pin: 'bg-purple-600',
    label: '📊 Poll',
  }
};


const NoticeBoard = forwardRef((props, ref) => {
  // Use custom hook to fetch notices
  const { notices, loading, error, hasMore, refresh, loadMore, updateNotice } = useNotices(10);
  const { currentUser, isAdmin } = useAuth();

  // Local state for editing functionality
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', message: '', type: 'general' });
  const [votingId, setVotingId] = useState(null);

  // Expose refresh method to parent components
  useImperativeHandle(ref, () => ({ refresh }));

  // Handle entering edit mode
  const handleEdit = (notice) => {
    setEditingId(notice.id);
    setEditForm({ title: notice.title, message: notice.message, type: notice.type });
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', message: '', type: 'general' });
  };

  // Submit updated notice to API
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

  // Delete notice
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

  // Handle user voting on polls
  const handleVote = async (noticeId, optionIndex) => {
    setVotingId(noticeId);
    const isRemoving = optionIndex === null;
    const toastId = toast.loading(isRemoving ? "Removing your vote..." : "Recording your vote...");
    try {
      await api.voteOnPoll(noticeId, optionIndex);
      toast.success(isRemoving ? "Vote removed! 🗳️" : "Vote recorded! 🗳️", { id: toastId });
      refresh();
    } catch (error) {
      toast.error(error || "Failed to vote", { id: toastId });
    } finally {
      setVotingId(null);
    }
  };

  // Helper to get which option the current user voted for
  const getUserVoteIndex = (notice) => {
    if (notice.votes && notice.votes[currentUser?.uid] !== undefined) {
      return notice.votes[currentUser.uid];
    }
    if (notice.voters?.includes(currentUser?.uid)) {
      return -1;
    }
    return null;
  };

  // Helper to check if user has voted
  const hasUserVoted = (notice) => {
    return getUserVoteIndex(notice) !== null;
  };

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Board Header */}
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
                const isEditing = editingId === notice.id;

                if (isEditing) {
                  return (
                    <div key={notice.id} className="relative z-10 p-5 pt-6 bg-white rounded shadow-xl md:col-span-2 lg:col-span-1">
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-700">Edit Announcement</h4>
                        <input
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="Title"
                          maxLength={100}
                        />
                        <textarea
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm resize-none"
                          rows="3"
                          value={editForm.message}
                          onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                          placeholder="Message"
                          maxLength={1000}
                        />
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(STICKY_CONFIG).filter(([key]) => key !== 'poll').map(([key, config]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, type: key })}
                              className={`px-2 py-1 rounded text-xs font-medium transition ${editForm.type === key
                                ? `${config.bg} ring-2 ring-gray-400`
                                : 'bg-gray-100 hover:bg-gray-200'
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
                    </div>
                  )
                }

                return (
                  <StickyNote
                    key={notice.id}
                    notice={notice}
                    index={index}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onVote={handleVote}
                    votingId={votingId}
                    currentUser={currentUser}
                    setIsEditing={setEditingId}
                    setEditForm={setEditForm}
                  />
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
