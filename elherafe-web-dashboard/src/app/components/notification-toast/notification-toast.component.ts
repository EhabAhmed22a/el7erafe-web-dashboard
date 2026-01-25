import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationService, ToastMessage } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [NgForOf, NgIf, AsyncPipe, NgClass],
  template: `
    <div class="fixed top-4 left-1/2 z-[9999] flex w-full max-w-sm -translate-x-1/2 flex-col gap-3 px-3">
      <div *ngFor="let message of service.messages$ | async" class="rounded-lg border px-4 py-3 shadow-lg"
        [ngClass]="message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'">
        <div class="flex items-start justify-between gap-4">
          <p class="text-sm font-medium">{{ message.text }}</p>
          <button type="button" class="text-xs text-current/60 hover:text-current" (click)="service.dismiss(message.id)">×</button>
        </div>
      </div>
    </div>
  `
})
export class NotificationToastComponent {
  constructor(public service: NotificationService) {}
}
