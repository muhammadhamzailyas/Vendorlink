import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { notificationAPI } from "../services/api";
import wsClient from "../services/wsClient";
import { showToast } from "../lib/toast";
import { getUserData } from "../lib/localStorage";

const NotificationContext = createContext(null);

const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

const useNotifications = useNotification;

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const pollRef = useRef(null);

  const checkAuth = useCallback(() => {
    const user = getUserData();
    // Only fetch if authenticated and has a role
    return !!(user && user.id && user.role && user.status === "approved");
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!checkAuth()) return;

    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data?.count ?? 0);
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) return;
      console.debug("Fetch unread count failed", error);
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
        setNotifications((prev) => [...prev, ...(data.notifications || [])]);
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
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // WebSocket listener for real-time notifications
  useEffect(() => {
    const handler = (data) => {
      if (data.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCount((c) => c + 1);
        showToast("info", data.notification.title || "New notification");
      }
    };
    wsClient.on("notification", handler);
    return () => wsClient.off("notification", handler);
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    if (!checkAuth()) {
      setInitialized(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications(1).catch(() => {});
    fetchUnreadCount().catch(() => {});

    pollRef.current = setInterval(() => {
      if (checkAuth()) {
        fetchUnreadCount().catch(() => {});
      }
    }, 30000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNotifications, fetchUnreadCount, checkAuth]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        initialized,
        pagination,
        fetchNotifications,
        fetchUnreadCount,
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



