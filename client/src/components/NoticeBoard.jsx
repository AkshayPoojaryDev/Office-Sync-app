// client/src/components/NoticeBoard.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  
  // Fetch notices when component loads
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notices');
      setNotices(res.data);
    } catch (error) {
      console.error("Error fetching notices");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">📢 Office Notices</h3>
        <button 
          onClick={fetchNotices} 
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {notices.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">No new notices.</p>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start">
                <h4 className="text-md font-bold text-gray-800">{notice.title}</h4>
                <span className="text-xs text-gray-400">
                  {new Date(notice.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-600 mt-2 text-sm">{notice.message}</p>
              <p className="text-xs text-blue-500 mt-3 font-semibold">
                — Posted by {notice.author}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}