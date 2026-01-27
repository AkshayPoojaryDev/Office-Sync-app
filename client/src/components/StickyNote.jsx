// client/src/components/StickyNote.jsx
import React from 'react';
import PollOption from './PollOption';

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
    const rotations = ['rotate-[-1deg]', 'rotate-[1deg]', 'rotate-[-2deg]', 'rotate-[2deg]', 'rotate-0'];
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
            className={`relative ${rotateClass} hover:rotate-0 transition-transform duration-300 group ${isPoll ? 'md:col-span-2 lg:col-span-1' : ''}`}
        >
            {/* Pushpin */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                <div className={`w-6 h-6 ${config.pin} rounded-full shadow-lg flex items-center justify-center`}>
                    <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                </div>
                <div className="w-1 h-3 bg-gray-400 mx-auto -mt-1 rounded-b-sm shadow-sm"></div>
            </div>

            {/* Sticky Note */}
            <div className={`${config.bg} p-5 pt-6 rounded shadow-lg ${config.shadow} min-h-[180px] flex flex-col relative overflow-hidden group-hover:shadow-xl transition-shadow`}>
                {/* Folded corner effect */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-black/10 to-transparent"></div>

                {/* Admin Controls */}
                {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                            onClick={handleEditClick}
                            className="p-1.5 bg-white/80 hover:bg-white rounded-full shadow transition-all"
                            title="Edit"
                        >
                            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onDelete(notice.id)}
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
                    {config.label}
                </span>

                {/* Title */}
                <h4 className="text-base font-bold text-gray-800 mb-2 leading-tight">
                    {notice.title}
                </h4>

                {/* Message or Poll */}
                {isPoll ? (
                    <div className="flex-1 space-y-2">
                        <p className="text-gray-700 text-sm mb-3">{notice.message}</p>

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

                        <p className="text-xs text-gray-500 text-center mt-2">
                            {voted
                                ? `${totalVotes} vote${totalVotes !== 1 ? 's' : ''} • Click your choice to change`
                                : 'Click to vote'}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-700 text-sm leading-relaxed flex-1 line-clamp-4">
                        {notice.message}
                    </p>
                )}

                {/* Footer */}
                <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                        {notice.authorName || notice.author?.split('@')[0]}
                    </span>
                    <span className="text-xs text-gray-500">
                        {new Date(notice.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StickyNote;
