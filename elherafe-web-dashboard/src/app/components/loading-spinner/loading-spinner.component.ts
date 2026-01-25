import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="w-full flex flex-col items-center justify-center py-8" role="status" [attr.aria-live]="ariaLive">
      <div class="h-10 w-10 rounded-full border-4 border-blue-200 border-t-[#3775FA] animate-spin"></div>
      <p class="mt-3 text-sm text-gray-500" *ngIf="message">{{ message }}</p>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() message = 'جاري التحميل...';
  @Input() ariaLive: 'polite' | 'assertive' = 'polite';
}
