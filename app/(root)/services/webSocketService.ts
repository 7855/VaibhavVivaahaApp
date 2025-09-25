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

export class WebSocketService {
  private static instance: WebSocketService;
  public socket: WebSocket | null = null;
  private userId: string | undefined;
  private listeners: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private reconnectDelay = 3000;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private init(userId: string): void {
    if (!userId) throw new Error('User ID is required');

    this.userId = userId;
    this.userId = atob(this.userId)
    const url = `ws://172.20.10.2:9100/ws/user-status?userId=${this.userId}`;
    this.socket = new WebSocket(url);
    console.log("socket connection ==============>",this.socket);
    

    this.socket.onopen = () => {
      console.log(`🟢 WebSocket connected for user ${this.userId}`);
      this.reconnectAttempts = 0;
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
      console.log(`🔴 WebSocket closed (${event.code})`);
      if (this.userId) userApi.lastSeen(this.userId).catch(console.error);
      this.reconnect(userId);
    };

    this.socket.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
      this.reconnect(userId);
    };
  }

  private reconnect(userId: string): void {
    if (this.reconnectAttempts < 5) {
      setTimeout(() => {
        console.log('🔁 Reconnecting WebSocket...');
        this.reconnectAttempts++;
        this.init(userId);
      }, this.reconnectDelay);
    }
  }

  private send(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  public connect(userId: string): void {
    this.init(userId);
  }

  public disconnect(): void {
    if (!this.socket) return;
    
    console.log('WebSocketService: Initiating disconnect...');
    
    // Close the socket
    this.socket.close();
    
    // Wait for close event
    const timeout = setTimeout(() => {
      console.log('WebSocketService: Force disconnecting after timeout');
      this.socket = null;
    }, 3000);
    
    // Set up close handler
    this.socket.onclose = () => {
      clearTimeout(timeout);
      console.log('WebSocketService: Successfully disconnected');
      this.socket = null;
    };
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

  public addListener(type: string, callback: (data: any) => void): void {
    this.listeners.set(type, callback);
  }

  public removeListener(type: string): void {
    this.listeners.delete(type);
  }

  public clearListeners(): void {
    console.log('WebSocketService: Clearing all listeners');
    this.listeners.clear();
  }

  public async waitForClose(timeout: number = 2000): Promise<void> {
    if (!this.socket) return;
    
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve();
      }, timeout);
      
      if(this.socket){
        this.socket.onclose = () => {
          clearTimeout(timer);
          resolve();
        };
      }
    });
  }
}

export const webSocketService = WebSocketService.getInstance();

// Export the class as default
export default WebSocketService;
