// client/src/components/PollOption.jsx
import React from 'react';

const PollOption = ({ option, index, notice, voted, totalVotes, isUserSelection, isWinning, onVote, votingId, isMultiSelect }) => {
    const getVotePercentage = (votes, total) => {
        if (total === 0) return 0;
        return Math.round((votes / total) * 100);
    };

    const percentage = getVotePercentage(option.votes, totalVotes);

    return (
        <button
            onClick={() => {
                if (votingId === notice.id) return;
                if (isUserSelection) {
                    onVote(notice.id, null); // Remove vote
                } else {
                    onVote(notice.id, index); // New vote or change vote
                }
            }}
            disabled={votingId === notice.id}
            style={{ border: isUserSelection ? '2px solid #7c3aed' : '2px solid #9ca3af' }}
            className={`w-full relative overflow-hidden rounded-lg transition-all bg-white ${isUserSelection
                ? 'cursor-pointer hover:border-purple-600'
                : 'cursor-pointer hover:border-purple-500 hover:shadow-md'
                }`}
        >
            {/* Progress bar background */}
            {voted && (
                <div
                    className={`absolute inset-0 ${isUserSelection ? 'bg-purple-200' : isWinning ? 'bg-purple-100' : 'bg-gray-100'} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                ></div>
            )}

            <div className="relative flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isUserSelection
                        ? 'border-purple-600 bg-purple-100'
                        : 'border-gray-400'
                        }`}>
                        {isUserSelection && (
                            <span className="text-purple-600 text-xs font-bold leading-none">✓</span>
                        )}
                    </div>
                    <span className={`text-sm font-medium ${isUserSelection ? 'text-purple-800' : 'text-gray-800'}`}>
                        {option.text}
                    </span>
                </div>
                {voted && (
                    <span className={`text-xs font-bold ${isUserSelection ? 'text-purple-700' : isWinning ? 'text-purple-600' : 'text-gray-500'}`}>
                        {percentage}%
                    </span>
                )}
            </div>
        </button>
    );
};

export default PollOption;
