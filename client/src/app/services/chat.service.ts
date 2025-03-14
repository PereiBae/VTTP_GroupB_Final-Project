import {Injectable} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';
import {Client} from '@stomp/stompjs';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id?: string;
  sender: string;
  content: string;
  timestamp?: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE';
}

export interface ChatMessage {
  id?: string;
  sender: string;
  content: string;
  timestamp?: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE';
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private client: Client | null = null;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$: Observable<boolean> = this.connectedSubject.asObservable();

  private username: string = '';
  // Configurable WebSocket URL - can be set from environment
  private wsUrl = 'http://localhost:8080/ws';

  constructor(private authService: AuthService) {
    this.initializeUsername();
  }

  private initializeUsername(): void {
    try {
      const token = this.authService.getToken();
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          this.username = payload.sub || 'Anonymous';
        } else {
          this.username = 'Anonymous';
        }
      } else {
        this.username = 'Anonymous';
      }
    } catch (error) {
      console.error('Error getting username:', error);
      this.username = 'Anonymous';
    }
  }

  connect(): void {
    if (this.client) {
      this.disconnect();
    }

    console.log('Connecting to WebSocket at:', this.wsUrl);

    try {
      // Create SockJS instance
      const socket = new SockJS(this.wsUrl);

      // Create STOMP client
      this.client = new Client({
        webSocketFactory: () => socket,
        debug: (msg) => console.log('STOMP: ' + msg),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });

      // Handle connection
      this.client.onConnect = () => {
        console.log('Connected to WebSocket');
        this.connectedSubject.next(true);

        // Subscribe to public channel
        this.client?.subscribe('/topic/public', (message) => {
          try {
            const newMessage: ChatMessage = JSON.parse(message.body);
            const currentMessages = this.messagesSubject.getValue();
            this.messagesSubject.next([...currentMessages, newMessage]);
          } catch (e) {
            console.error('Error parsing message:', e);
          }
        });

        // Send join message
        this.sendJoinMessage();
      };

      // Handle errors and disconnection
      this.client.onStompError = (frame) => {
        console.error('STOMP Error:', frame);
        this.connectedSubject.next(false);
      };

      this.client.onWebSocketError = (event) => {
        console.error('WebSocket Error:', event);
      };

      this.client.onDisconnect = () => {
        console.log('Disconnected from WebSocket');
        this.connectedSubject.next(false);
      };

      // Activate the connection
      this.client.activate();
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }

  disconnect(): void {
    if (this.client) {
      if (this.client.connected) {
        this.sendLeaveMessage();
      }

      try {
        this.client.deactivate();
      } catch (error) {
        console.error('Error disconnecting:', error);
      } finally {
        this.connectedSubject.next(false);
      }
    }
  }

  sendMessage(content: string): void {
    if (!this.client || !this.client.connected) {
      console.warn('Not connected to WebSocket');
      return;
    }

    if (!content.trim()) {
      console.warn('Cannot send empty message');
      return;
    }

    const chatMessage: ChatMessage = {
      sender: this.username,
      content: content,
      type: 'CHAT',
      timestamp: new Date().toISOString()
    };

    try {
      this.client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(chatMessage)
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private sendJoinMessage(): void {
    if (!this.client || !this.client.connected) return;

    const joinMessage: ChatMessage = {
      sender: this.username,
      content: 'has joined the chat!',
      type: 'JOIN',
      timestamp: new Date().toISOString()
    };

    try {
      this.client.publish({
        destination: '/app/chat.addUser',
        body: JSON.stringify(joinMessage)
      });
    } catch (error) {
      console.error('Error sending join message:', error);
    }
  }

  private sendLeaveMessage(): void {
    if (!this.client || !this.client.connected) return;

    const leaveMessage: ChatMessage = {
      sender: this.username,
      content: 'has left the chat!',
      type: 'LEAVE',
      timestamp: new Date().toISOString()
    };

    try {
      this.client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(leaveMessage)
      });
    } catch (error) {
      console.error('Error sending leave message:', error);
    }
  }

  getUsername(): string {
    return this.username;
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

}
