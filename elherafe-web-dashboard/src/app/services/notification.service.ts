import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  readonly messages$ = this.messagesSubject.asObservable();
  private counter = 0;

  success(text: string) {
    this.push('success', text);
  }

  error(text: string) {
    this.push('error', text);
  }

  dismiss(id: number) {
    const updated = this.messagesSubject.value.filter((msg) => msg.id !== id);
    this.messagesSubject.next(updated);
  }

  private push(type: ToastType, text: string) {
    const id = ++this.counter;
    const updated = [...this.messagesSubject.value, { id, text, type }];
    this.messagesSubject.next(updated);
    setTimeout(() => this.dismiss(id), 4000);
  }
}
