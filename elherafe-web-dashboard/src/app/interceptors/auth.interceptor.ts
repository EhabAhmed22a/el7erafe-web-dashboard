import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('authToken');
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  const authReq = token && !req.headers.has('Authorization')
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem('authToken');
        notificationService.error('انتهت صلاحية الجلسة، الرجاء إعادة تسجيل الدخول');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
