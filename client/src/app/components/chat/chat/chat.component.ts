import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {ChatMessage, ChatService} from '../../../services/chat.service';
import {FormControl, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {

  messages: ChatMessage[] = [];
  messageInput = new FormControl('', [Validators.required]);
  isConnected = false;
  username = '';

  private messagesSubscription?: Subscription;
  private connectionSubscription?: Subscription;

  private chatService = inject(ChatService)

  ngOnInit() {
    this.username = this.chatService.getUsername();

    // Connect to WebSocket
    this.chatService.connect();

    // Subscribe to connection status
    this.connectionSubscription = this.chatService.connected$.subscribe(
      connected => {
        this.isConnected = connected;
      }
    );

    // Subscribe to messages
    this.messagesSubscription = this.chatService.messages$.subscribe(
      messages => {
        this.messages = messages;
        // Scroll to bottom on new message
        setTimeout(() => this.scrollToBottom(), 100);
      }
    );
  }

  ngOnDestroy() {
    // Disconnect from WebSocket
    this.chatService.disconnect();

    // Clean up subscriptions
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }

    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
  }

  sendMessage(): void {
    if (this.messageInput.valid && this.isConnected) {
      this.chatService.sendMessage(this.messageInput.value!);
      this.messageInput.reset();
    }
  }

  getMessageClass(message: ChatMessage): string {
    if (message.type === 'JOIN' || message.type === 'LEAVE') {
      return 'event-message';
    }

    return message.sender === this.username ? 'own-message' : 'other-message';
  }

  private scrollToBottom(): void {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

}
