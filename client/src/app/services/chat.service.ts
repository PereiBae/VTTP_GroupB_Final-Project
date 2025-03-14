import {inject, Injectable} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
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

  constructor(private authService: AuthService) {
    this,this.initializeUsername()
  }

  private initializeUsername(): void {
    try {
      const token = this.authService.getToken();
      if (token) {
        // Get username from JWT token
        const decoded = this.decodeToken(token);
        this.username = decoded.sub || 'Anonymous';
      } else {
        this.username = 'Anonymous';
      }
    } catch (error) {
      console.error('Error getting username:', error);
      this.username = 'Anonymous';
    }
  }

  private decodeToken(token: string): any {
    try {
      // Simple JWT token decoding
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding token:', e);
      return { sub: 'Anonymous' };
    }
  }

  connect(): void {
    if (this.client) {
      this.disconnect();
    }

    // Create a new STOMP client
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      debug: (msg) => {
        console.log('STOMP: ' + msg);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    // Set up connection event handlers
    this.client.onConnect = (frame) => {
      console.log('Connected to WebSocket:', frame);
      this.connectedSubject.next(true);

      // Subscribe to the public channel
      this.client?.subscribe('/topic/public', (message: IMessage) => {
        const newMessage: ChatMessage = JSON.parse(message.body);
        const currentMessages = this.messagesSubject.getValue();
        this.messagesSubject.next([...currentMessages, newMessage]);
      });

      // Send join message
      this.sendJoinMessage();
    };

    this.client.onDisconnect = () => {
      console.log('Disconnected from WebSocket');
      this.connectedSubject.next(false);
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
      this.connectedSubject.next(false);
    };

    // Activate the client (establish the connection)
    try {
      this.client.activate();
    } catch (error) {
      console.error('Error activating STOMP client:', error);
    }
  }

  disconnect(): void {
    if (this.client) {
      if (this.client.connected) {
        // Send leave message before disconnecting
        this.sendLeaveMessage();
      }

      try {
        this.client.deactivate();
        this.connectedSubject.next(false);
      } catch (error) {
        console.error('Error disconnecting:', error);
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
    if (!this.client || !this.client.connected) {
      return;
    }

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
    if (!this.client || !this.client.connected) {
      return;
    }

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

  // Clear message history (e.g., when switching chat rooms)
  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  // Check if currently connected
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  // For testing purposes
  addTestMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.getValue();
    this.messagesSubject.next([...currentMessages, message]);
  }

}
