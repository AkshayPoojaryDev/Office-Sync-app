// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

// 1. Create the Context (The "Radio Station")
const AuthContext = createContext();

// 2. Custom Hook (The "Radio Receiver")
// This makes it easy to use the context in other files just by calling useAuth()
export function useAuth() {
  return useContext(AuthContext);
}

// 3. The Provider (The "Broadcasting Tower")
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect runs ONCE when the app starts
  useEffect(() => {
    // onAuthStateChanged is a Firebase listener. 
    // It automatically detects if a user is logged in (even if they refresh the page).
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // Set the user if found, or null if not
      setLoading(false);    // We are done checking, now we can render the app
    });

    // Cleanup: Unsubscribe from the listener when the component unmounts
    return unsubscribe;
  }, []);

  const value = {
    currentUser
  };

  // Only render the children (the App) after we know if the user is logged in or not
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}