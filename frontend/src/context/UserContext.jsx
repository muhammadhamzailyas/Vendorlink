import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { onIdTokenChanged } from "firebase/auth";
import { authService } from "../services/api";
import wsClient from "../services/wsClient";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get server-validated user data
          const response = await authService.sessionBootstrap();
          const { user: serverUser, needsOnboarding } = response.data;
          
          if (needsOnboarding) {
            const idToken = await firebaseUser.getIdToken();
            const syncRes = await authService.firebaseLogin(idToken);
            const syncedUser = syncRes.data?.user || syncRes.user;
            setUser(syncedUser);
          } else if (serverUser) {
            setUser(serverUser);
          }
        } catch (error) {
          if (error.response?.status !== 401) {
            console.error("User session sync error:", error);
          }
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
      const response = await authService.sessionBootstrap();
      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};
