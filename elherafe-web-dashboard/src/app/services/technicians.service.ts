  
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TechniciansService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getTechnicians(pageNumber: number = 1, pageSize: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<any>(`${this.apiUrl}/api/technicians`, {
      headers: this.getHeaders(),
      params
    });
  }

  getTechnicianById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/admin/technicians/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateTechnician(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/admin/technicians/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteTechnician(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/admin/technicians?id=${id}`, {
      headers: this.getHeaders()
    });
  }

  blockOrUnblockTechnician(
    id: string,
    payload: {
      isBlocked: boolean;
      suspendTo?: string;
      suspensionReason?: string;
    }
  ): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/api/admin/technicians/status/${id}`, payload, {
      headers: this.getHeaders()
    });
  }
}