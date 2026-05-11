import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { notificationAPI, chatAPI } from "../services/api";
import wsClient from "../services/wsClient";
import { showToast } from "../lib/toast";
import { useUser } from "./UserContext";

const NotificationContext = createContext(null);

const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

const useNotifications = useNotification;

const NotificationProvider = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const pollRef = useRef(null);

  const checkAuth = useCallback(() => {
    // Admins and approved users definitely get notifications
    if (!user || !(user.id || user._id) || !user.role) return false;
    
    // Admins always get notifications
    if (user.role === "admin") return true;
    
    // For other roles, they must be approved or pending
    return user.status === "approved" || user.status === "pending" || user.status === "rejected";
  }, [user]);

  const fetchUnreadCounts = useCallback(async () => {
    if (!checkAuth()) return;

    try {
       const [notifRes, chatRes] = await Promise.all([
        notificationAPI.getUnreadCount(),
        chatAPI.getUnreadCount()
      ]);
      setUnreadCount(notifRes.data?.count ?? 0);
      setUnreadChatCount(chatRes.data?.data?.unreadCount || 0);
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) return;
      console.debug("Fetch unread counts failed", error);
    }
  }, [checkAuth]);
  
  const fetchNotifications = useCallback(async (page = 1, filter = {}) => {
    if (!checkAuth()) return;

    setLoading(true);
    try {
      const res = await notificationAPI.getUserNotifications(page, 20, filter);
      const data = res.data;
      if (page === 1) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications((prev) => {
            const existingIds = new Set(prev.map(n => n._id));
            const uniqueNew = (data.notifications || []).filter(n => !existingIds.has(n._id));
            return [...prev, ...uniqueNew];
        });
      }
      setPagination({ page: data.page || page, totalPages: data.totalPages || 1, total: data.total || 0 });
      setInitialized(true);
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) return;
      console.debug("Fetch notifications failed", error);
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications((prev) => {
        const removed = prev.find((n) => n._id === id);
        if (removed && !removed.read) setUnreadCount((c) => Math.max(0, c - 1));
        return prev.filter((n) => n._id !== id);
      });
    } catch {
      // ignore
    }
  }, []);

  const deleteReadNotifications = useCallback(async () => {
    try {
      await notificationAPI.deleteReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch {
      // ignore
    }
  }, []);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages && !loading) {
      fetchNotifications(pagination.page + 1);
    }
  }, [pagination, loading, fetchNotifications]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications(1);
    fetchUnreadCounts();
  }, [fetchNotifications, fetchUnreadCounts]);

  // WebSocket listener for real-time notifications
  useEffect(() => {
    const notifHandler = (data) => {
      if (data.notification) {
        const newNotif = data.notification;
        setNotifications((prev) => {
          if (prev.some(n => n._id === newNotif._id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((c) => c + 1);
        
        // Use persistent success toast for new users
        if (newNotif.type === "new_user") {
          showToast("success", `ALERT: ${newNotif.title}`, { 
            description: newNotif.message,
            duration: 15000 
          });
        } else {
          showToast("info", newNotif.title || "New notification", {
            description: newNotif.message
          });
        }
      }
    };
    
    const chatHandler = () => {
        // When a message comes in via WS, refetch the chat count
        fetchUnreadCounts();
    };
    
    wsClient.on("notification", notifHandler);
    wsClient.on("new-message", chatHandler);

    return () => {
        wsClient.off("notification", notifHandler);
        wsClient.off("new-message", chatHandler);
    }
  }, [fetchUnreadCounts]);

  // Initial fetch + polling
  useEffect(() => {
    if (!checkAuth()) {
      setInitialized(false);
      setNotifications([]);
      setUnreadCount(0);
      setUnreadChatCount(0);
      return;
    }

    fetchNotifications(1).catch(() => {});
    fetchUnreadCounts().catch(() => {});

    pollRef.current = setInterval(() => {
      if (checkAuth()) {
        fetchUnreadCounts().catch(() => {});
      }
    }, 30000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNotifications, fetchUnreadCounts, checkAuth]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        unreadChatCount,
        loading,
        initialized,
        pagination,
        fetchNotifications,
        fetchUnreadCounts,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteReadNotifications,
        loadMore,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export { NotificationProvider, useNotification, useNotifications };
export default NotificationContext;



