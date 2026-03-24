// src/contexts/authContext/index.tsx
import React, { useContext, ReactNode } from "react";
import { useMergedUser } from "../../hooks/useMergedUser";
import type { AppUser } from "../../types/AppUser";

// -----------------
// Context type
// -----------------
interface AuthContextType {
  currentUser: AppUser | null;  // merged user
  userLoggedIn: boolean;
  loading: boolean;
}

// -----------------
// Create context
// -----------------
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// -----------------
// Custom hook
// -----------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}

// -----------------
// Provider props
// -----------------
interface AuthProviderProps {
  children: ReactNode;
}

// -----------------
// AuthProvider
// -----------------
export function AuthProvider({ children }: AuthProviderProps) {
  const { user: mergedUser, loading } = useMergedUser(); // use merged user hook

  const value: AuthContextType = {
    currentUser: mergedUser,
    userLoggedIn: !!mergedUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* wait until merged user is ready */}
    </AuthContext.Provider>
  );
}