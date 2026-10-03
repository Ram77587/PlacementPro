"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, authApi } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem("placementpro_token");
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }
      setToken(storedToken);
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem("placementpro_user", JSON.stringify(userData));
    } catch {
      localStorage.removeItem("placementpro_token");
      localStorage.removeItem("placementpro_user");
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("placementpro_token", newToken);
    localStorage.setItem("placementpro_user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("placementpro_token");
    localStorage.removeItem("placementpro_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
