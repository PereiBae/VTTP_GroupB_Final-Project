import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
  @ViewChild('chatMessages') private messagesContainer!: ElementRef;

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
        if (connected) {
          this.messageInput.enable();
        } else {
          this.messageInput.disable();
        }
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
    try {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom', err);
    }
  }

}
