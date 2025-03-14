import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {AuthService} from './auth.service';
import {Stomp} from '@stomp/stompjs';

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

  private stompClient: any;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$: Observable<boolean> = this.connectedSubject.asObservable();

  private username: string = '';

  private authService = inject(AuthService)

  connect(): void {
    const socket = new WebSocket('http://localhost:8080/ws');
    this.stompClient = Stomp.over(socket);

    // Attempt to get user's email as username
    try {
      const token = this.authService.getToken();
      if (token) {
        const decoded = this.authService.decodeToken(token);
        this.username = decoded.sub || 'Anonymous';
      } else {
        this.username = 'Anonymous';
      }
    } catch (error) {
      console.error('Error getting username:', error);
      this.username = 'Anonymous';
    }

    this.stompClient.connect({}, () => {
      this.connectedSubject.next(true);

      // Subscribe to public topic
      this.stompClient.subscribe('/topic/public', (message: any) => {
        const newMessage: ChatMessage = JSON.parse(message.body);
        const currentMessages = this.messagesSubject.getValue();
        this.messagesSubject.next([...currentMessages, newMessage]);
      });

      // Send join message
      this.sendJoinMessage();
    }, (error: any) => {
      console.error('Connection error:', error);
      this.connectedSubject.next(false);
    });
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.sendLeaveMessage();

      this.stompClient.disconnect(() => {
        this.connectedSubject.next(false);
      });
    }
  }

  sendMessage(content: string): void {
    if (this.stompClient && this.connectedSubject.getValue()) {
      const chatMessage: ChatMessage = {
        sender: this.username,
        content: content,
        type: 'CHAT'
      };

      this.stompClient.send(
        '/app/chat.sendMessage',
        {},
        JSON.stringify(chatMessage)
      );
    } else {
      console.warn('Not connected to WebSocket');
    }
  }

  private sendJoinMessage(): void {
    const joinMessage: ChatMessage = {
      sender: this.username,
      content: 'has joined the chat!',
      type: 'JOIN'
    };

    this.stompClient.send(
      '/app/chat.addUser',
      {},
      JSON.stringify(joinMessage)
    );
  }

  private sendLeaveMessage(): void {
    const leaveMessage: ChatMessage = {
      sender: this.username,
      content: 'has left the chat!',
      type: 'LEAVE'
    };

    this.stompClient.send(
      '/app/chat.sendMessage',
      {},
      JSON.stringify(leaveMessage)
    );
  }

  getUsername(): string {
    return this.username;
  }

}
