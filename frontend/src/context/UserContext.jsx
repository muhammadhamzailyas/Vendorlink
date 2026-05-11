import React, { createContext, useContext, useState, useEffect } from "react";
import { getToken, removeToken } from "../lib/auth";
import { authService } from "../services/api";
import wsClient from "../services/wsClient";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch current user profile using the stored JWT
        const res = await authService.getMe();
        setUser(res.data);
      } catch (err) {
        console.error("Auth init failed:", err);
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (user && user.status === "approved") {
      wsClient.connect(user);
    } else {
      wsClient.disconnect();
    }
  }, [user]);

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      setUser(res.data);
    } catch (err) {
      console.error("Failed to refresh user:", err);
      setUser(null);
    }
  };

  const logout = () => {
    removeToken();
    wsClient.disconnect();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
