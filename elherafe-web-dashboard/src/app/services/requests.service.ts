import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RejectTechnicianPayload {
  id: string;
  rejectionReason: string;
  is_front_rejected: boolean;
  is_back_rejected: boolean;
  is_criminal_rejected: boolean;
}

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

  getTechnicianRequests(status: number | null = 1, pageNumber: number = 1, pageSize: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (status !== null && status !== undefined) {
      params = params.set('technicianStatus', status.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/api/admin/technician-requests`, {
      headers: this.getHeaders(),
      params
    });
  }

  approveTechnician(userId: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.patch<any>(`${this.apiUrl}/api/admin/technicians/approve`, {}, {
      headers: this.getHeaders(),
      params
    });
  }

  rejectTechnician(payload: RejectTechnicianPayload): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/api/admin/technician/reject`, payload, {
      headers: this.getHeaders()
    });
  }

  getRejectionReasons(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/admin/rejection-reason`, {
      headers: this.getHeaders()
    });
  }
}
