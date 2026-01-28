// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "../utils/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// AuthProvider component: Manages authentication state and provides it to the app
export function AuthProvider({ children }) {
  // State to hold the current authenticated user (from Firebase)
  const [currentUser, setCurrentUser] = useState(null);
  // State to hold the role of the user (e.g., 'user', 'admin')
  const [userRole, setUserRole] = useState(null);
  // State to handle the initial loading status of the auth check
  const [loading, setLoading] = useState(true);

  // Function to fetch the user's role from the backend API
  // useCallback is used to memoize the function and prevent unnecessary re-creations
  const fetchUserRole = useCallback(async () => {
    if (!currentUser) {
      setUserRole(null);
      return;
    }
    try {
      // API call to get role
      const res = await api.getUserRole();
      setUserRole(res.data.role || 'user');
    } catch {
      // Default to 'user' role on error
      setUserRole('user');
    }
  }, [currentUser]);

  // Effect to listen for Firebase authentication state changes
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function to clean up the listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed:", user ? `User logged in: ${user.email}` : "No user");
      setCurrentUser(user);
      // Once we have the initial auth state, we can stop loading
      setLoading(false);
    });
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Effect to fetch the user role whenever the currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchUserRole();
    } else {
      setUserRole(null);
    }
  }, [currentUser, fetchUserRole]);

  // Memoize context value to prevent unnecessary re-renders of consuming components
  const value = useMemo(() => ({
    currentUser,
    userRole,
    isAdmin: userRole === 'admin', // Derived state for convenient admin check
    refreshRole: fetchUserRole // Expose function to manually refresh role
  }), [currentUser, userRole, fetchUserRole]);

  return (
    <AuthContext.Provider value={value}>
      {/* Only render children when initial auth status is determined */}
      {!loading && children}
    </AuthContext.Provider>
  );
}