"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  error: string | null;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // Check authentication status function
  const checkAuthStatus = async () => {
    try {
      console.log("Checking auth status...");
      setIsLoading(true);
      
      const response = await fetch(`${apiUrl}/user/me`, {
        credentials: "include", // Critical for sending cookies in cross-origin requests
        cache: "no-store", // Prevent caching of auth state
      });

      console.log("Auth status response:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Auth data:", data);
        setUser(data.user);
      } else {
        // Only clear user if we get an explicit 401
        if (response.status === 401) {
          console.log("Unauthorized, clearing user");
          setUser(null);
        }
        // For other errors, keep existing user state
      }
    } catch (error) {
      console.error("Failed to check auth status:", error);
      // Don't clear user state on network errors
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth on initial load
  useEffect(() => {
    checkAuthStatus();
  }, [apiUrl]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        credentials: "include", // Critical for receiving cookies in cross-origin requests
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return false;
      }

      setUser(data.user);
      return true;
    } catch (error) {
      setError("An unexpected error occurred");
      return false;
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<boolean> => {
    setError(null);
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("confirm_password", confirmPassword);

      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        credentials: "include", // Critical for receiving cookies in cross-origin requests
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        return false;
      }

      setUser(data.user);
      return true;
    } catch (error) {
      setError("An unexpected error occurred");
      return false;
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiUrl}/auth/logout`, {
        credentials: "include", // Critical for sending cookies in cross-origin requests
      });

      if (response.ok) {
        setUser(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Logout failed:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        error,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}