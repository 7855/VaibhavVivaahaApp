import userApi from '../api/userApi';

interface WebSocketMessage {
  type: string;
  data: {
    userId?: string;
    conversationId?: string;
    message?: string;
    timestamp?: string;
  };
}

const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || 'wss://bf66-3-110-153-18.ngrok-free.app';

export class WebSocketService {
  private static instance: WebSocketService;
  public socket: WebSocket | null = null;
  private userId: string | undefined;
  private rawUserId: string | undefined; // Keep original encoded userId for reconnect
  // 🔴 A SET of callbacks per type, not one. This used to be Map<string, callback>: the chat
  // list (a tab that never unmounts) and the open chat screen both listen to 'chat_message', so
  // each registration overwrote the other's — and whichever cleaned up last deleted the ONLY
  // entry. Net effect: a message arriving while you sat inside that very chat never appeared
  // (the push notification still did), and the list stopped updating too.
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private reconnectDelay = 3000;
  private maxReconnectDelay = 30000;
  private isReconnecting = false;
  private intentionallyClosed = false;
  // Heartbeat: without one a socket killed by a sleeping phone, a network switch or a server
  // restart keeps reporting OPEN forever and simply never delivers anything again.
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastPongAt = 0;
  private static readonly PING_EVERY_MS = 25000;
  private static readonly PONG_GRACE_MS = 60000;

  private constructor() { }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private init(userId: string): void {
    if (!userId) throw new Error('User ID is required');

    // Store the raw (encoded) userId for reconnect, decode only once
    this.rawUserId = userId;
    try {
      this.userId = atob(userId);
    } catch {
      // If atob fails, userId was already decoded
      this.userId = userId;
    }

    const url = `${WS_BASE_URL}/ws/user-status?userId=${this.userId}`;
    console.log(`🔌 WebSocket connecting to: ${url}`);

    // Clean up existing socket before creating new one
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      this.socket = null;
    }

    this.socket = new WebSocket(url);

    this.intentionallyClosed = false;

    this.socket.onopen = () => {
      console.log(`🟢 WebSocket connected for user ${this.userId}`);
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.startHeartbeat();
      // Anything that arrived while we were disconnected never reached a listener — let
      // screens refetch once instead of silently showing stale threads.
      this.emit('connected', {});
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.lastPongAt = Date.now(); // any traffic proves the socket is alive
        if (message.type === 'pong') return;
        this.emit(message.type, message.data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`🔴 WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
      this.stopHeartbeat();
      if (this.userId) {
        // Backend expects Base64-encoded userId
        if (this.rawUserId) {
          userApi.lastSeen(this.rawUserId).catch(() => { });
        }
      }
      // Only reconnect from onclose (NOT from onerror) to avoid double reconnect
      this.reconnect();
    };

    this.socket.onerror = (err) => {
      // Log but do NOT reconnect here — onclose will fire after onerror
      console.warn('⚠️ WebSocket error (will reconnect on close)');
    };
  }

  private emit(type: string, data: any): void {
    const set = this.listeners.get(type);
    if (!set || set.size === 0) return;
    // Copy first: a listener may unsubscribe itself (or another) while we iterate.
    Array.from(set).forEach((cb) => {
      try { cb(data); } catch (err) { console.error(`WS listener for "${type}" threw:`, err); }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPongAt = Date.now();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) return;
      if (Date.now() - this.lastPongAt > WebSocketService.PONG_GRACE_MS) {
        console.warn('💔 WebSocket heartbeat lost — forcing a reconnect');
        try { this.socket.close(); } catch { /* onclose drives the reconnect */ }
        return;
      }
      try { this.socket.send(JSON.stringify({ type: 'ping', data: {} })); } catch { /* ignore */ }
    }, WebSocketService.PING_EVERY_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
  }

  private reconnect(): void {
    // Guard: don't stack multiple reconnect timers
    if (this.isReconnecting || this.intentionallyClosed) return;
    if (!this.rawUserId) return;

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Never give up. The old cap of 5 attempts (~45s in total) meant a phone that slept a
    // minute, or a backend redeploy, left the app deaf to live messages until it was restarted.
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, this.maxReconnectDelay);
    console.log(`🔁 WebSocket reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.isReconnecting = false;
      // connect()/ensureConnected() may have already brought a socket up while this timer was
      // pending — tearing that one down just to open another would drop live messages.
      const state = this.socket?.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
      if (this.rawUserId && !this.intentionallyClosed) {
        this.init(this.rawUserId);
      }
    }, delay);
  }

  private send(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  public connect(userId: string): void {
    // Don't reconnect if already connected with same user
    if (this.socket?.readyState === WebSocket.OPEN && this.rawUserId === userId) {
      console.log('🟢 WebSocket already connected');
      return;
    }
    this.reconnectAttempts = 0;
    this.init(userId);
  }

  public disconnect(): void {
    if (!this.socket) return;

    console.log('WebSocketService: Disconnecting...');

    // Prevent reconnect after intentional disconnect
    this.intentionallyClosed = true;
    this.stopHeartbeat();
    this.rawUserId = undefined;
    this.userId = undefined;

    // Remove handlers to prevent reconnect triggers
    this.socket.onclose = null;
    this.socket.onerror = null;
    this.socket.onopen = null;
    this.socket.onmessage = null;

    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close();
    }
    this.socket = null;
    console.log('WebSocketService: Disconnected');
  }

  public sendChatMessage(conversationId: string, message: string): void {
    if (!this.userId) return;

    this.send({
      type: 'chat_message',
      data: {
        userId: this.userId,
        conversationId,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Public method aliases used by AuthContext
  public sendChatMessagePublic(conversationId: string, message: string): void {
    this.sendChatMessage(conversationId, message);
  }

  /** Call when the app returns to the foreground — reconnects if the socket is not OPEN. */
  public ensureConnected(): void {
    if (!this.rawUserId || this.intentionallyClosed) return;
    const state = this.socket?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.init(this.rawUserId);
  }

  public addChatListenerPublic(callback: (data: any) => void): () => void {
    return this.addListener('chat_message', callback);
  }

  public removeChatListenerPublic(callback?: (data: any) => void): void {
    this.removeListener('chat_message', callback);
  }

  /** Returns an unsubscribe function — prefer it over removeListener in effect cleanups. */
  public addListener(type: string, callback: (data: any) => void): () => void {
    let set = this.listeners.get(type);
    if (!set) { set = new Set(); this.listeners.set(type, set); }
    set.add(callback);
    return () => this.removeListener(type, callback);
  }

  /**
   * Removes ONE callback. Called without a callback it does nothing on purpose: the old
   * remove-everything-for-this-type behaviour is exactly what let one screen's cleanup
   * silence another screen.
   */
  public removeListener(type: string, callback?: (data: any) => void): void {
    if (!callback) return;
    this.listeners.get(type)?.delete(callback);
  }

  public clearListeners(): void {
    this.listeners.clear();
  }
}

export const webSocketService = WebSocketService.getInstance();
export default WebSocketService;
