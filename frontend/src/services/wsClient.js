import { io } from "socket.io-client";
import { getAuthToken } from "../lib/auth";

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connectionListeners = new Set();
    this.errorListeners = new Set();
    this.userId = null;
    this.userRole = null;
    this.isConnecting = false;
    this.currentUser = null;
  }

  async connect(user) {
    if (this.isConnecting || this.socket?.connected) return;
    
    if (user) {
      this.currentUser = user;
    }
    
    this.isConnecting = true;
    try {
      const token = getAuthToken();
      if (!token) {
        this.isConnecting = false;
        return;
      }

      if (this.currentUser) {
        this.userId = this.currentUser.id || this.currentUser._id;
        this.userRole = this.currentUser.role;
      }

      const protocol = window.location.protocol === "https:" ? "https:" : "http:";
      
      // Try to derive Host URL from API URL if not explicitly provided
      let defaultHost = `${protocol}//localhost:8002`;
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      if (apiBaseUrl) {
        try {
          const apiUrl = new URL(apiBaseUrl);
          defaultHost = `${apiUrl.protocol}//${apiUrl.host}`;
        } catch (e) {
          console.warn("Could not parse VITE_API_BASE_URL for Socket.io host", e);
        }
      }

      const host = import.meta.env.VITE_WS_URL || defaultHost;

      this.socket = io(host, {
        query: { token },
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on("connect", () => {
        console.log("[Socket.io] Connected to server");
        this.connectionListeners.forEach((fn) => fn(true));
        this.isConnecting = false;
      });

      this.socket.on("disconnect", (reason) => {
        console.log("[Socket.io] Disconnected:", reason);
        this.connectionListeners.forEach((fn) => fn(false));
        this.isConnecting = false;
      });

      this.socket.on("connect_error", (error) => {
        console.error("[Socket.io] Connection error:", error);
        this.errorListeners.forEach((fn) => fn(error));
        this.isConnecting = false;
      });

      // Catch-all for events to support existing .on() API
      // Since Socket.io doesn't have a native catch-all in the same way, 
      // we'll explicitly listen for common types or the generic "message" type
      // Our backend sends specific types, so we handle them here:
      const commonEventTypes = [
        "connected",
        "new-message",
        "messages-history",
        "messages-read",
        "user-typing",
        "user-stop-typing",
        "notification",
        "error"
      ];

      commonEventTypes.forEach(type => {
        this.socket.on(type, (data) => {
          const handlers = this.listeners.get(type);
          if (handlers) {
            handlers.forEach((fn) => fn(data));
          }
        });
      });

      // Also listen to generic "message" if sent
      this.socket.on("message", (data) => {
        const type = data.type;
        if (type) {
          const handlers = this.listeners.get(type);
          if (handlers) {
            handlers.forEach((fn) => fn(data));
          }
        }
      });

    } catch (error) {
      console.error("Socket.io initialization error:", error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  send(type, data = {}) {
    if (this.socket?.connected) {
      this.socket.emit(type, data);
    }
  }

  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);
    
    // If it's a new type not in our pre-defined list, register it on the socket
    if (this.socket && !["connect", "disconnect", "connect_error"].includes(type)) {
      this.socket.off(type); // Avoid duplicate listeners
      this.socket.on(type, (data) => {
        const handlers = this.listeners.get(type);
        if (handlers) {
          handlers.forEach((fn) => fn(data));
        }
      });
    }
  }

  off(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }

  onConnection(handler) {
    this.connectionListeners.add(handler);
    return () => this.connectionListeners.delete(handler);
  }

  onError(handler) {
    this.errorListeners.add(handler);
    return () => this.errorListeners.delete(handler);
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getUserId() {
    return this.userId;
  }

  getUserRole() {
    return this.userRole;
  }
}

const wsClient = new WebSocketClient();
export default wsClient;
