// client/src/components/Layout.jsx
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function Layout({ children }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-6 text-2xl font-bold text-blue-600">
          OfficeSync
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {/* Navigation Links */}
          <a href="/dashboard" className="block px-4 py-2 text-gray-700 bg-gray-100 rounded-md font-medium">
            Dashboard
          </a>
          <a href="#" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-md transition">
            Pantry Orders
          </a>
          <a href="#" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-md transition">
            Notice Board
          </a>
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="bg-white shadow-sm z-10 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Overview</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {currentUser?.email}
            </span>
            <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}