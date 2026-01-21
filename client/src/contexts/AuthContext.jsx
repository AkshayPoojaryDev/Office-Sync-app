// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "../utils/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // Cache role in context
  const [loading, setLoading] = useState(true);

  // Fetch user role - cached at context level so it only runs once
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch role when user changes
  useEffect(() => {
    if (currentUser) {
      fetchUserRole();
    } else {
      setUserRole(null);
    }
  }, [currentUser, fetchUserRole]);

  const value = {
    currentUser,
    userRole,
    isAdmin: userRole === 'admin',
    refreshRole: fetchUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}