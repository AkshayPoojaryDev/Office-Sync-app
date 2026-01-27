// client/src/components/StickyNote.jsx
import React from 'react';
import PollOption from './PollOption';

const STICKY_CONFIG = {
    general: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        shadow: 'shadow-yellow-500/20',
        pin: 'bg-red-500',
        border: 'border-yellow-200 dark:border-yellow-700/50',
        label: 'General',
        badge: 'bg-yellow-200 text-yellow-800'
    },
    important: {
        bg: 'bg-sky-100 dark:bg-sky-900/30',
        shadow: 'shadow-sky-500/20',
        pin: 'bg-indigo-500',
        border: 'border-sky-200 dark:border-sky-700/50',
        label: 'Important',
        badge: 'bg-sky-200 text-sky-800'
    },
    urgent: {
        bg: 'bg-rose-100 dark:bg-rose-900/30',
        shadow: 'shadow-rose-500/20',
        pin: 'bg-rose-600',
        border: 'border-rose-200 dark:border-rose-700/50',
        label: 'Urgent',
        badge: 'bg-rose-200 text-rose-800'
    },
    holiday: {
        bg: 'bg-teal-50 dark:bg-teal-900/30',
        shadow: 'shadow-teal-500/20',
        pin: 'bg-emerald-500',
        border: 'border-teal-200 dark:border-teal-700/50',
        label: 'Holiday',
        badge: 'bg-teal-200 text-teal-800'
    },
    poll: {
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        shadow: 'shadow-violet-500/20',
        pin: 'bg-purple-600',
        border: 'border-violet-200 dark:border-violet-700/50',
        label: 'Poll',
        badge: 'bg-violet-200 text-violet-800'
    }
};

const StickyNote = ({
    notice,
    index,
    isAdmin,
    onEdit,
    onDelete,
    onVote,
    votingId, // Pass voting state
    currentUser,
    setIsEditing,
    setEditForm
}) => {
    const isPoll = notice.isPoll;

    // Determine style
    const config = notice.isPoll ? STICKY_CONFIG.poll : (STICKY_CONFIG[notice.type] || STICKY_CONFIG.general);
    const rotations = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2'];
    const rotateClass = rotations[index % rotations.length];

    // Vote calculations
    const totalVotes = notice.pollOptions?.reduce((sum, opt) => sum + opt.votes, 0) || 0;

    const getUserVoteIndex = (notice) => {
        // Multi-select: Check if it's an array
        if (notice.votes && Array.isArray(notice.votes[currentUser?.uid])) {
            return notice.votes[currentUser.uid]; // Returns array of indices
        }

        // Single-select: Number
        if (notice.votes && notice.votes[currentUser?.uid] !== undefined) {
            return notice.votes[currentUser.uid];
        }

        // Legacy
        if (notice.voters?.includes(currentUser?.uid)) {
            return -1;
        }
        return null;
    };

    const userVoteData = getUserVoteIndex(notice);
    const voted = userVoteData !== null;
    const isMultiSelect = !!notice.allowMultiple;

    const handleEditClick = () => {
        setIsEditing(notice.id);
        setEditForm({ title: notice.title, message: notice.message, type: notice.type });
    }

    return (
        <div
            className={`relative ${rotateClass} transition-transform duration-300 group hover:z-50 animate-swing cursor-pointer ${isPoll ? 'md:col-span-2 lg:col-span-1' : ''}`}
        >
            {/* Pushpin */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 hover:-translate-y-1 transition-transform">
                <div className={`w-8 h-8 ${config.pin} rounded-full shadow-lg flex items-center justify-center border-2 border-white/50 backdrop-blur-sm`}>
                    <div className="w-2.5 h-2.5 bg-white/70 rounded-full shadow-inner"></div>
                </div>
            </div>

            {/* Sticky Note */}
            <div className={`${config.bg} p-6 pt-8 rounded-3xl border-2 ${config.border} shadow-xl ${config.shadow} min-h-[220px] flex flex-col relative overflow-hidden backdrop-blur-sm transition-all hover:shadow-2xl`}>

                {/* Decoration blob */}
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>

                {/* Admin Controls */}
                {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90">
                        <button
                            onClick={handleEditClick}
                            className="p-2 bg-white/80 hover:bg-white rounded-full shadow-sm text-blue-500 hover:text-blue-600 transition-colors"
                            title="Edit"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                            onClick={() => onDelete(notice.id)}
                            className="p-2 bg-white/80 hover:bg-red-50 rounded-full shadow-sm text-red-500 hover:text-red-600 transition-colors"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                )}

                {/* Type Badge */}
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 w-fit ${config.badge}`}>
                    {config.label}
                </span>

                {/* Title */}
                <h4 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-2 leading-tight font-fun">
                    {notice.title}
                </h4>

                {/* Message or Poll */}
                {isPoll ? (
                    <div className="flex-1 space-y-3 mt-2">
                        {notice.message && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-4">{notice.message}</p>
                        )}

                        <div className="space-y-2">
                            {notice.pollOptions?.map((option, optIndex) => {
                                let isUserSelection = false;

                                if (isMultiSelect && Array.isArray(userVoteData)) {
                                    isUserSelection = userVoteData.includes(optIndex);
                                } else if (typeof userVoteData === 'number') {
                                    isUserSelection = userVoteData === optIndex;
                                }

                                return (
                                    <PollOption
                                        key={optIndex}
                                        option={option}
                                        index={optIndex}
                                        notice={notice}
                                        voted={voted}
                                        totalVotes={totalVotes}
                                        isUserSelection={isUserSelection}
                                        isWinning={voted && option.votes === Math.max(...notice.pollOptions.map(o => o.votes)) && option.votes > 0}
                                        onVote={onVote}
                                        votingId={votingId}
                                        isMultiSelect={isMultiSelect}
                                    />
                                );
                            })}
                        </div>

                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center font-bold mt-2 uppercase tracking-wide">
                            {voted
                                ? `${totalVotes} vote${totalVotes !== 1 ? 's' : ''}`
                                : 'Tap to vote'}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 line-clamp-4 font-medium">
                        {notice.message}
                    </p>
                )}

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                            {(notice.authorName || notice.author)?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                            {notice.authorName || notice.author?.split('@')[0]}
                        </span>
                    </div>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                        {new Date(notice.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StickyNote;
