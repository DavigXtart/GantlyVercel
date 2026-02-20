import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { ChatMessage } from '../models';

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private apiUrl = environment.apiUrl;
  private stompClient: Client | null = null;
  private messages$ = new BehaviorSubject<ChatMessage[]>([]);
  private connected$ = new BehaviorSubject<boolean>(false);

  messages = this.messages$.asObservable();
  isConnected = this.connected$.asObservable();

  constructor(private http: HttpClient) {}

  connect(): void {
    const token = localStorage.getItem('token');
    if (!token || this.stompClient?.connected) return;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiBaseUrl}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected$.next(true);
        this.stompClient?.subscribe('/user/queue/messages', (message) => {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          this.messages$.next([...this.messages$.value, chatMessage]);
        });
      },
      onDisconnect: () => this.connected$.next(false),
      onStompError: () => this.connected$.next(false)
    });

    this.stompClient.activate();
  }

  disconnect(): void {
    this.stompClient?.deactivate();
    this.stompClient = null;
    this.connected$.next(false);
  }

  sendMessage(receiverId: number, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/chat/send`, { receiverId, content });
  }

  getHistory(otherUserId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/history/${otherUserId}`);
  }

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/chat/conversations`);
  }

  clearMessages(): void {
    this.messages$.next([]);
  }

  addLocalMessage(msg: ChatMessage): void {
    this.messages$.next([...this.messages$.value, msg]);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
