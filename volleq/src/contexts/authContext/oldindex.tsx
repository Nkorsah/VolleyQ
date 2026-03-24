// src/contexts/authContext/index.tsx
import React, { useContext, useState, useEffect, ReactNode } from "react";
import { auth } from "../../firebase/firebase-service";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth"; // type only import for ts


// Define the shape of the context
interface AuthContextType {
  currentUser: User | null;
  userLoggedIn: boolean;
  loading: boolean;
}

// Create the context with undefined initial value
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Custom hook for consuming the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}

// Props type for the provider
interface AuthProviderProps {
  children: ReactNode;
}

// The provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe; // clean up listener
  }, []);

  async function initializeUser(user: User | null) {
    if (user) {
      setCurrentUser({ ...user }); // same spread as original
      setUserLoggedIn(true);
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
    }
    setLoading(false);
  }

  const value: AuthContextType = {
    currentUser,
    userLoggedIn,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}