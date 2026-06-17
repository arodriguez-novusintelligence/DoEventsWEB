import { getCurrentEnv } from '../api/client';
import type { SendChatMessageInput } from '../api/chatService';
import { emitNotificationsUpdated } from '../lib/notificationsEvents';

export type ChatConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ChatWsMessage {
  action?: string;
  event?: string;
  channel?: string;
  roomId?: string;
  clientMessageId?: string;
  message?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  title?: string;
  body?: string;
}

type MessageHandler = (data: ChatWsMessage) => void;
type StateHandler = (state: ChatConnectionState) => void;

export class ChatWebSocketClient {
  private socket: WebSocket | null = null;
  private state: ChatConnectionState = 'idle';
  private messageHandlers = new Set<MessageHandler>();
  private stateHandlers = new Set<StateHandler>();
  private reconnectTimer: number | null = null;
  private userId = '';

  connect(userId: string): void {
    this.userId = userId;
    if (this.socket && (this.state === 'connected' || this.state === 'connecting')) return;

    const baseUrl = getCurrentEnv().chat.websocketUrl.replace(/\/$/, '');
    const url = `${baseUrl}?userId=${encodeURIComponent(userId)}`;
    this.setState('connecting');

    try {
      this.socket = new WebSocket(url);
    } catch {
      this.setState('error');
      return;
    }

    this.socket.onopen = () => {
      this.setState('connected');
    };

    this.socket.onclose = () => {
      this.setState('disconnected');
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.setState('error');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as ChatWsMessage;
        if (data.channel === 'notification' || data.action === 'inapp_notification' || data.action === 'InApp') {
          emitNotificationsUpdated();
        }
        this.messageHandlers.forEach((handler) => handler(data));
      } catch {
        // ignore malformed payloads
      }
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.setState('idle');
  }

  joinRoom(roomId: string): void {
    this.send({
      action: 'joinRoom',
      roomId,
      userId: this.userId,
    });
  }

  editChatMessage(
    roomId: string,
    messageId: string,
    options: { deletedAt?: string; newText?: string } = {},
  ): void {
    this.send({
      action: 'editChatMessage',
      roomId,
      id: messageId,
      deletedAt: options.deletedAt || new Date().toISOString(),
      ...(options.newText !== undefined ? { newText: options.newText } : {}),
    });
  }

  sendChatMessage(
    roomId: string,
    textOrPayload: string | SendChatMessageInput,
    type = 'message-text',
  ): string {
    const clientMessageId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const message = typeof textOrPayload === 'string'
      ? { text: textOrPayload, sender: this.userId, clientMessageId, type }
      : {
        text: textOrPayload.text || '',
        sender: this.userId,
        clientMessageId,
        type: textOrPayload.type || type,
        ...(textOrPayload.asset ? { asset: textOrPayload.asset } : {}),
        ...(textOrPayload.media ? { media: textOrPayload.media } : {}),
        ...(textOrPayload.location ? { location: textOrPayload.location } : {}),
        ...(textOrPayload.sharedEvent ? { sharedEvent: textOrPayload.sharedEvent } : {}),
      };
    this.send({
      action: 'sendChatMessage',
      roomId,
      message,
    });
    return clientMessageId;
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }

  ensureConnected(): void {
    if (!this.userId) throw new Error('Usuario no identificado');
    if (this.state !== 'connected') {
      this.connect(this.userId);
      throw new Error('Chat reconectando. Intenta de nuevo en unos segundos.');
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStateChange(handler: StateHandler): () => void {
    this.stateHandlers.add(handler);
    handler(this.state);
    return () => this.stateHandlers.delete(handler);
  }

  getState(): ChatConnectionState {
    return this.state;
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.socket || this.state !== 'connected') {
      throw new Error('Chat no conectado');
    }
    this.socket.send(JSON.stringify(payload));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.userId) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.userId);
    }, 3000);
  }

  private setState(state: ChatConnectionState): void {
    this.state = state;
    this.stateHandlers.forEach((handler) => handler(state));
  }
}

export const chatWebSocketClient = new ChatWebSocketClient();
