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

const JOIN_REFRESH_MS = 5 * 60 * 1000;
const HEARTBEAT_MS = 25 * 1000;

export class ChatWebSocketClient {
  private socket: WebSocket | null = null;
  private state: ChatConnectionState = 'idle';
  private messageHandlers = new Set<MessageHandler>();
  private stateHandlers = new Set<StateHandler>();
  private reconnectTimer: number | null = null;
  private joinRefreshTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private visibilityHandler: (() => void) | null = null;
  private joinedRooms = new Set<string>();
  private userId = '';

  connect(userId: string): void {
    this.userId = userId;
    this.bindVisibilityRefresh();

    if (this.socket?.readyState === WebSocket.OPEN) {
      if (this.state !== 'connected') this.setState('connected');
      return;
    }
    if (this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      try {
        this.socket.close();
      } catch {
        // ignore stale socket close errors
      }
      this.socket = null;
    }

    const baseUrl = getCurrentEnv().chat.websocketUrl.replace(/\/$/, '');
    const url = `${baseUrl}?userId=${encodeURIComponent(userId)}`;
    this.setState('connecting');

    try {
      this.socket = new WebSocket(url);
    } catch {
      this.setState('error');
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.setState('connected');
      this.rejoinAllRooms();
      this.broadcastOnlinePresence();
      this.startJoinRefresh();
      this.startHeartbeat();
    };

    this.socket.onclose = () => {
      this.stopJoinRefresh();
      this.stopHeartbeat();
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
    this.stopJoinRefresh();
    this.stopHeartbeat();
    this.unbindVisibilityRefresh();
    this.joinedRooms.clear();
    this.socket?.close();
    this.socket = null;
    this.setState('idle');
  }

  joinRoom(roomId: string): void {
    const normalized = String(roomId || '').trim();
    if (!normalized) return;
    this.joinedRooms.add(normalized);
    this.flushJoinRoom(normalized);
  }

  editChatMessage(
    roomId: string,
    messageId: string,
    options: { deletedAt?: string; newText?: string } = {},
  ): void {
    const payload: Record<string, unknown> = {
      action: 'editChatMessage',
      roomId,
      id: messageId,
    };
    // Solo incluir deletedAt al eliminar. Si se manda siempre, el BE marca el mensaje como deleted.
    if (options.deletedAt) {
      payload.deletedAt = options.deletedAt;
    }
    if (options.newText !== undefined) {
      payload.newText = options.newText;
    }
    this.send(payload);
  }

  reactChatMessage(roomId: string, messageId: string, emoji: string): void {
    this.send({
      action: 'reactChatMessage',
      roomId,
      id: messageId,
      emoji,
    });
  }

  sendChatMessage(
    roomId: string,
    textOrPayload: string | SendChatMessageInput,
    type = 'message-text',
  ): string {
    const normalizedRoom = String(roomId || '').trim();
    if (normalizedRoom) {
      this.joinRoom(normalizedRoom);
    }
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
        ...(textOrPayload.replyToId ? { replyToId: textOrPayload.replyToId } : {}),
        ...(textOrPayload.reply ? { reply: textOrPayload.reply } : {}),
      };
    this.send({
      action: 'sendChatMessage',
      roomId,
      message,
    });
    return clientMessageId;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  ensureConnected(): void {
    if (!this.userId) throw new Error('Usuario no identificado');
    if (!this.isConnected()) {
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
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Chat no conectado');
    }
    this.socket.send(JSON.stringify(payload));
  }

  private flushJoinRoom(roomId: string): void {
    if (!this.isConnected() || !this.userId) return;
    try {
      this.send({
        action: 'joinRoom',
        roomId,
        userId: this.userId,
      });
      this.sendStatusConnection(roomId);
    } catch {
      // join will retry on reconnect / heartbeat
    }
  }

  private sendStatusConnection(roomId?: string): void {
    if (!this.isConnected() || !this.userId) return;
    try {
      this.send({
        action: 'statusConnection',
        userId: this.userId,
        status: 'online',
        ...(roomId ? { roomId } : {}),
      });
    } catch {
      // presence will retry on reconnect / join refresh
    }
  }

  private broadcastOnlinePresence(): void {
    this.sendStatusConnection();
    this.joinedRooms.forEach((roomId) => this.sendStatusConnection(roomId));
  }

  private rejoinAllRooms(): void {
    this.joinedRooms.forEach((roomId) => this.flushJoinRoom(roomId));
  }

  private startJoinRefresh(): void {
    this.stopJoinRefresh();
    if (typeof window === 'undefined') return;
    this.joinRefreshTimer = window.setInterval(() => {
      this.rejoinAllRooms();
      this.broadcastOnlinePresence();
    }, JOIN_REFRESH_MS);
  }

  private stopJoinRefresh(): void {
    if (this.joinRefreshTimer) {
      window.clearInterval(this.joinRefreshTimer);
      this.joinRefreshTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    if (typeof window === 'undefined') return;
    this.heartbeatTimer = window.setInterval(() => {
      if (!this.userId) return;
      if (!this.isConnected()) {
        this.connect(this.userId);
        return;
      }
      try {
        this.socket?.send(JSON.stringify({ action: 'ping' }));
      } catch {
        this.connect(this.userId);
      }
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private bindVisibilityRefresh(): void {
    if (typeof document === 'undefined' || this.visibilityHandler) return;
    this.visibilityHandler = () => {
      if (document.visibilityState !== 'visible' || !this.userId) return;
      if (!this.isConnected()) {
        this.connect(this.userId);
        return;
      }
      this.rejoinAllRooms();
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private unbindVisibilityRefresh(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
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
