import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('[ServicesService] No authToken found in localStorage');
    } else {
      console.log('[ServicesService] Using authToken:', token);
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    console.log('[ServicesService] Request headers:', headers);
    return headers;
  }

  getServices(pageNumber: number = 1, pageSize: number = 5): Observable<any> {
    const url = `${this.apiUrl}/api/services/?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    const headers = this.getHeaders();
    console.log('[ServicesService] GET', url, headers);
    return this.http.get<any>(url, { headers });
  }


  addService(service: any, isFormData: boolean = false): Observable<any> {
    const headers = isFormData
      ? new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })
      : this.getHeaders();
    return this.http.post<any>(`${this.apiUrl}/api/admin/services`, service, { headers });
  }

  updateService(id: string, service: any, isFormData: boolean = false): Observable<any> {
    const headers = isFormData
      ? new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })
      : this.getHeaders();
    return this.http.put<any>(`${this.apiUrl}/api/admin/services?Id=${id}`, service, { headers });
  }

  deleteService(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/admin/services?Id=${id}`, {
      headers: this.getHeaders()
    });
  }
}
