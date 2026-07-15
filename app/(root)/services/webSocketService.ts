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
  private listeners: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isReconnecting = false;

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

    this.socket.onopen = () => {
      console.log(`🟢 WebSocket connected for user ${this.userId}`);
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        const listener = this.listeners.get(message.type);
        if (listener) {
          listener(message.data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`🔴 WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
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

  private reconnect(): void {
    // Guard: don't stack multiple reconnect timers
    if (this.isReconnecting) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`🛑 WebSocket: max reconnect attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }
    if (!this.rawUserId) return;

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = this.reconnectDelay * this.reconnectAttempts; // Exponential backoff
    console.log(`🔁 WebSocket reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.isReconnecting = false;
      if (this.rawUserId) {
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
    this.rawUserId = undefined;
    this.userId = undefined;
    this.reconnectAttempts = this.maxReconnectAttempts; // Block reconnect

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

  public addChatListenerPublic(callback: (data: any) => void): void {
    this.addListener('chat_message', callback);
  }

  public removeChatListenerPublic(): void {
    this.removeListener('chat_message');
  }

  public addListener(type: string, callback: (data: any) => void): void {
    this.listeners.set(type, callback);
  }

  public removeListener(type: string): void {
    this.listeners.delete(type);
  }

  public clearListeners(): void {
    this.listeners.clear();
  }
}

export const webSocketService = WebSocketService.getInstance();
export default WebSocketService;
