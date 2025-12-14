import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RequestsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getTechnicianRequests(status: number = 1): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/admin/technician-requests?technicianStatus=${status}`, {
      headers: this.getHeaders()
    });
  }

  approveTechnician(userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/admin/technicians/approve?userId=${userId}`, {}, {
      headers: this.getHeaders()
    });
  }

  rejectTechnician(userId: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/admin/technician/reject`, {
      userId,
      reason
    }, {
      headers: this.getHeaders()
    });
  }
}
