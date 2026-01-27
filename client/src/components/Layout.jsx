// client/src/components/Layout.jsx - FUN & POP DESIGN
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { auth } from "../firebase";
import { useState } from "react";
import { useDarkMode } from "../hooks/useDarkMode";

export default function Layout({ children }) {
  const { currentUser, isAdmin, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const navigation = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'History',
      path: '/order-history',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  if (isAdmin) {
    navigation.push({
      name: 'Admin',
      path: '/admin',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    });
  }

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300/30 dark:bg-purple-900/20 rounded-full mix-blend-multiply blur-3xl animate-float opacity-70"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-300/30 dark:bg-indigo-900/20 rounded-full mix-blend-multiply blur-3xl animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-pink-300/30 dark:bg-pink-900/20 rounded-full mix-blend-multiply blur-3xl animate-float opacity-70" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Sidebar for Desktop */}
      <aside className={`hidden md:fixed md:inset-y-4 md:left-4 md:flex md:w-24 lg:w-64 md:flex-col glass-panel rounded-3xl z-50 transition-all duration-300`}>
        <div className="flex flex-col flex-grow pt-8 pb-8 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-center lg:justify-start lg:px-8 mb-10 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <span className="text-2xl">⚡</span>
            </div>
            <span className="hidden lg:block ml-4 text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 font-fun tracking-wide">
              Sync
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-center lg:justify-start px-3 py-3.5 text-sm font-medium rounded-2xl transition-all duration-300 ${isActive(item.path)
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
              >
                <span className={`lg:mr-3 transition-transform duration-300 ${isActive(item.path) ? 'animate-bounce-subtle' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="hidden lg:block">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Dark Mode & User */}
          <div className="px-4 mt-auto space-y-4">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
            >
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-amber-400' : 'bg-amber-100 text-amber-500'}`}>
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </div>
              <span className="hidden lg:block font-medium">Theme</span>
            </button>

            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold shadow-md">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {currentUser?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {userRole === 'admin' ? 'BOSS 😎' : 'Team Member'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden lg:block p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between h-20 px-4 glass-panel border-b-0 rounded-b-3xl mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">⚡</span>
          </div>
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 font-fun">
            Sync
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-600 bg-white dark:bg-slate-800 rounded-xl shadow-sm"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-64 bg-white dark:bg-slate-900 shadow-2xl rounded-r-3xl overflow-hidden">

            <div className="p-6 flex items-center justify-between">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-fun">Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-4 text-base font-bold rounded-2xl transition-all ${isActive(item.path)
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <span className="mr-4">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="p-6 bg-gray-50 dark:bg-slate-800 mb-0">
              <button onClick={handleLogout} className="flex items-center text-red-500 font-bold">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="md:pl-28 lg:pl-72 flex flex-col flex-1 transition-all duration-300">
        <main className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}