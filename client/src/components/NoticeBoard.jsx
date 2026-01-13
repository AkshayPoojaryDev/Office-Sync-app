// Professional NoticeBoard Component
import { forwardRef, useImperativeHandle } from "react";
import { useNotices } from "../hooks/useNotices";

const TAG_CONFIG = {
  general: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: 'General' },
  important: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Important' },
  urgent: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Urgent' },
  holiday: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Holiday' }
};

const NoticeBoard = forwardRef((props, ref) => {
  const { notices, loading, error, hasMore, refresh, loadMore } = useNotices(10);

  useImperativeHandle(ref, () => ({ refresh }));

  const getTagStyle = (type) => TAG_CONFIG[type] || TAG_CONFIG.general;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Office Announcements</h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {loading && notices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#486581] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600 font-medium mb-2">Failed to load announcements</p>
            <button onClick={refresh} className="text-sm text-[#486581] hover:underline">Try again</button>
          </div>
        ) : notices.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-600">No announcements yet</p>
          </div>
        ) : (
          <>
            {notices.map((notice) => {
              const tagStyle = getTagStyle(notice.type);
              return (
                <div key={notice.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tagStyle.bg} ${tagStyle.text} border ${tagStyle.border}`}>
                        {tagStyle.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(notice.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{notice.title}</h4>
                  <p className="text-gray-600 leading-relaxed mb-3">{notice.message}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-6 h-6 rounded-full bg-[#486581] flex items-center justify-center text-white text-xs font-semibold mr-2">
                      {(notice.authorName || notice.author).charAt(0).toUpperCase()}
                    </div>
                    <span>{notice.authorName || notice.author}</span>
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <div className="p-4 text-center border-t border-gray-100">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
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