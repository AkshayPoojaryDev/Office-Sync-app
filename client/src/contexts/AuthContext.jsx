// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "../utils/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role - cached at context level
  const fetchUserRole = useCallback(async () => {
    if (!currentUser) {
      setUserRole(null);
      return;
    }
    try {
      const res = await api.getUserRole();
      setUserRole(res.data.role || 'user');
    } catch {
      setUserRole('user');
    }
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed:", user ? `User logged in: ${user.email}` : "No user");
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserRole();
    } else {
      setUserRole(null);
    }
  }, [currentUser, fetchUserRole]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentUser,
    userRole,
    isAdmin: userRole === 'admin',
    refreshRole: fetchUserRole
  }), [currentUser, userRole, fetchUserRole]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}