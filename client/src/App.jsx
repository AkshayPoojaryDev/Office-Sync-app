// client/src/App.jsx
import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastProvider from "./components/Toast";

// Lazy load pages for performance optimization
// This ensures that code for these pages is only loaded when the user navigates to them
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Profile = lazy(() => import("./pages/Profile"));

// Loading Fallback Component
// Displayed while lazy-loaded components are being fetched
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

// Security Component: Redirects to login if no user is found
// Uses the AuthContext to check authentication status
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/" />;
}

// Public Route: Redirects to dashboard if user is already logged in
// Prevents authenticated users from accessing the login page
function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/dashboard" /> : children;
}

function App() {
  // DEBUG: Check for config presence
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.error("CRITICAL: VITE_FIREBASE_API_KEY is missing! Auth will not persist.");
  }

  return (
    // ErrorBoundary catches errors in the component tree
    <ErrorBoundary>
      <Router>
        {/* AuthProvider makes authentication state available throughout the app */}
        <AuthProvider>
          {/* ToastProvider enables global toast notifications */}
          <ToastProvider />
          {/* Suspense shows the fallback loader while lazy components load */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Login Route - Accessible only if not logged in */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* Protected Routes - Accessible only if logged in */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/order-history"
                element={
                  <PrivateRoute>
                    <OrderHistory />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;