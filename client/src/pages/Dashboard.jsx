// client/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import NoticeBoard from "../components/NoticeBoard";
import { useAuth } from "../contexts/AuthContext";

function Dashboard() {
  const { currentUser } = useAuth();
  
  // State for Tea/Coffee Counts
  const [stats, setStats] = useState({ tea: 0, coffee: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // State for Posting Notices (Temporary Admin Form)
  const [showForm, setShowForm] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: "", message: "" });

  // --- TEA/COFFEE LOGIC ---

  // 1. Fetch current counts on load
  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/stats');
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats");
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 2. Handle Order Click
  const handleOrder = async (type) => {
    setLoading(true);
    setMessage("");
    
    try {
      // Call Backend API
      await axios.post('http://localhost:5000/api/order', {
        userId: currentUser.uid,
        email: currentUser.email,
        type: type // 'tea' or 'coffee'
      });

      // Success! Update UI
      setMessage(`✅ Success! One ${type} coming up.`);
      fetchStats(); // Refresh the numbers immediately
      
    } catch (error) {
      // Show error from backend (e.g. "Closed at 10:30")
      const errorMsg = error.response?.data?.message || "Order failed";
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // --- NOTICE BOARD LOGIC ---

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.message) return;

    try {
      await axios.post('http://localhost:5000/api/notices', {
        title: newNotice.title,
        message: newNotice.message,
        author: currentUser.email
      });
      
      alert("Notice Posted Successfully!");
      setShowForm(false);
      setNewNotice({ title: "", message: "" });
      
      // Ideally, we would tell the NoticeBoard component to refresh here,
      // but for now, a page reload is the simplest way to see the new data.
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("Failed to post notice");
    }
  };

  return (
    <Layout>
      {/* 1. STATUS MESSAGE (Success/Error for ordering) */}
      {message && (
        <div className={`p-4 mb-6 rounded-md shadow-sm font-medium ${
          message.includes('Success') 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* 2. TEA & COFFEE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Tea Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Tea</h3>
              <p className="text-4xl font-extrabold text-gray-800 mt-2">{stats.tea}</p>
            </div>
            <button 
              onClick={() => handleOrder('tea')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-medium"
            >
              + Order Tea
            </button>
          </div>
        </div>

        {/* Coffee Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500 hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Coffee</h3>
              <p className="text-4xl font-extrabold text-gray-800 mt-2">{stats.coffee}</p>
            </div>
            <button 
              onClick={() => handleOrder('coffee')}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-medium"
            >
              + Order Coffee
            </button>
          </div>
        </div>
      </div>

      {/* 3. NOTICE BOARD SECTION */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Company Announcements</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-md transition"
        >
          {showForm ? "Cancel" : "+ Post Announcement"}
        </button>
      </div>

      {/* Post Notice Form (Hidden by default) */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200 animate-fade-in">
          <h3 className="font-bold text-gray-700 mb-4">Create New Announcement</h3>
          <form onSubmit={handlePostNotice} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Title</label>
              <input 
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="e.g. Office Closed this Friday"
                value={newNotice.title}
                onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Message</label>
              <textarea 
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="Write the details here..."
                rows="3"
                value={newNotice.message}
                onChange={e => setNewNotice({...newNotice, message: e.target.value})}
                required
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition">
                Publish Notice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* The Reusable Notice Board Component */}
      <NoticeBoard />
      
    </Layout>
  );
}

export default Dashboard;