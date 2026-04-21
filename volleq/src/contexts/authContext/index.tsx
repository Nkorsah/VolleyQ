// src/contexts/authContext/index.tsx
import React, { useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../../firebase/firebase-service";

// -----------------
// Context type
// -----------------
interface AuthContextType {
  currentUser: FirebaseUser | null;
  userLoggedIn: boolean;
  loading: boolean;
}

// -----------------
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// -----------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}

// -----------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    currentUser,
    userLoggedIn: !!currentUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}