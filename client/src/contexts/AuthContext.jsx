// client/src/contexts/AuthContext.jsx
// Core Authentication Context Provider
// Manages global user state, role-based access control, and Firebase integration.

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "../utils/api";

const AuthContext = createContext();

/**
 * Custom hook to access the authentication context.
 * Returns { currentUser, userRole, isAdmin, refreshRole }
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider Component
 * 
 * Wraps the application to provide authentication state.
 * Handles:
 * 1. Firebase Authentication state monitoring
 * 2. Fetching and syncing user roles from the backend
 * 3. Exposing 'isAdmin' convenience flag
 */
export function AuthProvider({ children }) {
  // State to hold the current authenticated user object from Firebase
  const [currentUser, setCurrentUser] = useState(null);

  // State to hold the role of the user (e.g., 'user', 'admin') fetched from API
  const [userRole, setUserRole] = useState(null);

  // State to manage the initial loading phase of auth initialization
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the user's role from the backend API.
   * Memoized with useCallback to prevent unnecessary re-creations.
   * Handles cases where the user is not logged in or the API fails.
   */
  const fetchUserRole = useCallback(async () => {
    if (!currentUser) {
      setUserRole(null);
      return;
    }
    try {
      const res = await api.getUserRole();
      setUserRole(res.data.role || 'user');
    } catch (error) {
      console.error("Failed to fetch user role:", error);
      // Default to 'user' role on error to prevent locking out valid users completely
      setUserRole('user');
    }
  }, [currentUser]);

  /**
   * Effect to listen for Firebase authentication state changes.
   * Runs once on mount.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed:", user ? `User logged in: ${user.email}` : "No user");
      setCurrentUser(user);
      // Set loading to false once the initial auth state is determined
      setLoading(false);
    });
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  /**
   * Effect to sync user role whenever the currentUser changes.
   */
  useEffect(() => {
    if (currentUser) {
      fetchUserRole();
    } else {
      setUserRole(null);
    }
  }, [currentUser, fetchUserRole]);

  // Memoize context value to optimize performance and prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentUser,
    userRole,
    // Convenience boolean for checking admin status
    isAdmin: userRole === 'admin',
    // Expose function to manually refresh role (useful after permission updates)
    refreshRole: fetchUserRole
  }), [currentUser, userRole, fetchUserRole]);

  return (
    <AuthContext.Provider value={value}>
      {/* Block rendering of children until initial auth check is complete */}
      {!loading && children}
    </AuthContext.Provider>
  );
}