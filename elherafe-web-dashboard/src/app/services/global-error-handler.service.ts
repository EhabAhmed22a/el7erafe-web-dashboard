import { ErrorHandler, Injectable } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private notificationService: NotificationService) {}

  handleError(error: any): void {
    // Log the error to console for debugging
    console.error('Global Error:', error);

    // Extract a user-friendly error message
    let errorMessage = 'حدث خطأ غير متوقع';

    if (error?.rejection) {
      // Handle promise rejections
      errorMessage = this.extractMessage(error.rejection);
    } else if (error?.error) {
      // Handle HTTP errors
      errorMessage = this.extractMessage(error.error);
    } else if (error?.message) {
      // Handle standard errors
      errorMessage = error.message;
    }

    // Show the error in the toast notification
    this.notificationService.error(errorMessage);
  }

  private extractMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return error.message;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    return 'حدث خطأ غير متوقع';
  }
}
