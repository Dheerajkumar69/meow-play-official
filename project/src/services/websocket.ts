/**
 * Advanced WebSocket Service for Real-time Features
 */
import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
  userId?: string;
}

export interface RealTimeEvent {
  type: 'user_joined' | 'user_left' | 'song_changed' | 'playlist_updated' | 'message' | 'reaction' | 'sync_required';
  data: any;
  userId: string;
  timestamp: number;
  roomId?: string;
}

export interface CollaborativeSession {
  id: string;
  name: string;
  host: string;
  participants: string[];
  currentSong?: any;
  queue: any[];
  isActive: boolean;
  settings: {
    allowGuestControl: boolean;
    requireApproval: boolean;
    maxParticipants: number;
  };
  createdAt: string;
  updatedAt: string;
}

export class WebSocketService extends EventEmitter {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private isConnected = false;
  private userId: string | null = null;
  private currentRoom: string | null = null;

  private constructor() {
    super();
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
        const url = new URL(wsUrl);
        if (token) {
          url.searchParams.set('token', token);
        }
        url.searchParams.set('userId', userId);

        this.ws = new WebSocket(url.toString());
        this.userId = userId;

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.currentRoom = null;
  }

  /**
   * Send message to server
   */
  send(type: string, data: any): void {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      id: `msg-${Date.now()}-${Math.random()}`,
      userId: this.userId || undefined,
    };

    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  /**
   * Join a collaborative room
   */
  joinRoom(roomId: string): void {
    this.currentRoom = roomId;
    this.send('join_room', { roomId });
  }

  /**
   * Leave current room
   */
  leaveRoom(): void {
    if (this.currentRoom) {
      this.send('leave_room', { roomId: this.currentRoom });
      this.currentRoom = null;
    }
  }

  /**
   * Create a collaborative session
   */
  createSession(name: string, settings: CollaborativeSession['settings']): void {
    this.send('create_session', { name, settings });
  }

  /**
   * Join a collaborative session
   */
  joinSession(sessionId: string): void {
    this.send('join_session', { sessionId });
  }

  /**
   * Leave collaborative session
   */
  leaveSession(sessionId: string): void {
    this.send('leave_session', { sessionId });
  }

  /**
   * Sync playback state with room
   */
  syncPlayback(data: {
    songId: string;
    currentTime: number;
    isPlaying: boolean;
    timestamp: number;
  }): void {
    this.send('sync_playback', data);
  }

  /**
   * Add song to collaborative queue
   */
  addToCollaborativeQueue(songId: string, position?: number): void {
    this.send('add_to_queue', { songId, position });
  }

  /**
   * Vote to skip current song
   */
  voteSkip(): void {
    this.send('vote_skip', {});
  }

  /**
   * Send chat message
   */
  sendChatMessage(message: string, roomId?: string): void {
    this.send('chat_message', { 
      message, 
      roomId: roomId || this.currentRoom 
    });
  }

  /**
   * Send reaction/emoji
   */
  sendReaction(emoji: string, targetId?: string): void {
    this.send('reaction', { emoji, targetId });
  }

  /**
   * Request room participants list
   */
  getParticipants(): void {
    this.send('get_participants', { roomId: this.currentRoom });
  }

  /**
   * Transfer host privileges
   */
  transferHost(newHostId: string): void {
    this.send('transfer_host', { newHostId });
  }

  /**
   * Kick user from session
   */
  kickUser(userId: string): void {
    this.send('kick_user', { userId });
  }

  /**
   * Update session settings
   */
  updateSessionSettings(settings: Partial<CollaborativeSession['settings']>): void {
    this.send('update_settings', { settings });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    const { type, data } = message;

    switch (type) {
      case 'user_joined':
        this.emit('userJoined', data);
        break;
      
      case 'user_left':
        this.emit('userLeft', data);
        break;
      
      case 'song_changed':
        this.emit('songChanged', data);
        break;
      
      case 'playback_sync':
        this.emit('playbackSync', data);
        break;
      
      case 'queue_updated':
        this.emit('queueUpdated', data);
        break;
      
      case 'chat_message':
        this.emit('chatMessage', data);
        break;
      
      case 'reaction':
        this.emit('reaction', data);
        break;
      
      case 'vote_skip':
        this.emit('voteSkip', data);
        break;
      
      case 'session_created':
        this.emit('sessionCreated', data);
        break;
      
      case 'session_updated':
        this.emit('sessionUpdated', data);
        break;
      
      case 'participants_list':
        this.emit('participantsList', data);
        break;
      
      case 'host_transferred':
        this.emit('hostTransferred', data);
        break;
      
      case 'user_kicked':
        this.emit('userKicked', data);
        break;
      
      case 'error':
        this.emit('wsError', data);
        break;
      
      case 'pong':
        // Heartbeat response
        break;
      
      default:
        console.warn('Unknown WebSocket message type:', type);
        this.emit('unknownMessage', message);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send('ping', {});
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.userId) {
        this.connect(this.userId).catch(() => {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            this.emit('maxReconnectAttemptsReached');
          }
        });
      }
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
  }

  /**
   * Flush queued messages when connection is restored
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    currentRoom: string | null;
    queuedMessages: number;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      currentRoom: this.currentRoom,
      queuedMessages: this.messageQueue.length,
    };
  }

  /**
   * Set maximum reconnect attempts
   */
  setMaxReconnectAttempts(attempts: number): void {
    this.maxReconnectAttempts = attempts;
  }

  /**
   * Set reconnect delay
   */
  setReconnectDelay(delay: number): void {
    this.reconnectDelay = delay;
  }
}

export default WebSocketService;
