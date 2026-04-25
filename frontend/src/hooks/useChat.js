import { useState, useEffect, useCallback, useRef } from "react";
import { chatAPI } from "../services/api";
import wsClient from "../services/wsClient";

export const useChat = (taskId, otherUserId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(wsClient.isConnected());
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Load messages via REST
  useEffect(() => {
    if (!taskId) {
      setMessages([]);
      setLoading(false);
      return;
    };
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await chatAPI.getTaskMessages(taskId);
        if (!cancelled) {
          // The backend returns { success: true, data: messages.reverse(), ... }
          setMessages(Array.isArray(res.data?.data) ? res.data.data : []);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [taskId]);

  // WebSocket listeners
  useEffect(() => {
    const onNewMessage = (data) => {
      if (data.message?.taskId === taskId || data.taskId === taskId) {
        const msg = data.message || data;
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const onTyping = (data) => {
      if (data.userId === otherUserId && data.taskId === taskId) {
        setOtherUserTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
      }
    };

    const onStopTyping = (data) => {
      if (data.userId === otherUserId && data.taskId === taskId) {
        setOtherUserTyping(false);
      }
    };

    const onConnection = (connected) => {
      setIsConnected(connected);
      setConnectionError(!connected);
    };

    wsClient.on("new-message", onNewMessage);
    wsClient.on("message-sent", onNewMessage);
    wsClient.on("user-typing", onTyping);
    wsClient.on("user-stop-typing", onStopTyping);
    const unsub = wsClient.onConnection(onConnection);

    return () => {
      wsClient.off("new-message", onNewMessage);
      wsClient.off("message-sent", onNewMessage);
      wsClient.off("user-typing", onTyping);
      wsClient.off("user-stop-typing", onStopTyping);
      unsub();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [taskId, otherUserId]);

  const sendMessage = useCallback(async (text) => {
    if (!taskId || !otherUserId || !text.trim()) return;
    try {
      const res = await chatAPI.sendMessage({
        receiverId: otherUserId,
        message: text.trim(),
        taskId,
      });
      // The backend now returns { success: true, data: newMessage }
      const msg = res.data?.data;
      if (msg) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, [taskId, otherUserId]);

  const sendTyping = useCallback(() => {
    wsClient.send("typing", { taskId, receiverId: otherUserId });
  }, [taskId, otherUserId]);

  const markAsRead = useCallback(async () => {
    wsClient.send("mark-read", { taskId, senderId: otherUserId });
  }, [taskId, otherUserId]);

  const reconnect = useCallback(() => {
    wsClient.disconnect();
    wsClient.connect();
  }, []);

  return {
    messages,
    isConnected,
    otherUserTyping,
    loading,
    connectionError,
    sendMessage,
    sendTyping,
    markAsRead,
    reconnect,
  };
};


