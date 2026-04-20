import { getFirebaseIdToken } from "../lib/firebase";

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.connectionListeners = new Set();
    this.errorListeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.userId = null;
    this.userRole = null;
    this.isConnecting = false;
  }

  async connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;
    
    this.isConnecting = true;
    try {
      const token = await getFirebaseIdToken();
      if (!token) {
        this.isConnecting = false;
        return;
      }

      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        this.userId = user.id || user._id;
        this.userRole = user.role;
      } catch {
        // ignore
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = import.meta.env.VITE_WS_URL || `${protocol}//localhost:8002`;
      const url = `${host}?token=${encodeURIComponent(token)}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this._startHeartbeat();
        this.connectionListeners.forEach((fn) => fn(true));
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") return;
          const handlers = this.listeners.get(data.type);
          if (handlers) {
            handlers.forEach((fn) => fn(data));
          }
        } catch {
          // ignore non-JSON
        }
      };

      this.ws.onclose = () => {
        this._stopHeartbeat();
        this.connectionListeners.forEach((fn) => fn(false));
        this._scheduleReconnect();
        this.isConnecting = false;
      };

      this.ws.onerror = () => {
        this.errorListeners.forEach((fn) => fn());
        this.isConnecting = false;
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.isConnecting = false;
      this._scheduleReconnect();
    }
  }

  disconnect() {
    this._stopHeartbeat();
    clearTimeout(this.reconnectTimer);
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type, data = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);
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
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getUserId() {
    return this.userId;
  }

  getUserRole() {
    return this.userRole;
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send("ping");
    }, 30000);
  }

  _stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
}

const wsClient = new WebSocketClient();
export default wsClient;
