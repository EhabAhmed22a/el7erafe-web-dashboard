import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return headers;
  }

  getServices(pageNumber: number = 1, pageSize: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<any>(`${this.apiUrl}/api/services`, {
      headers: this.getHeaders(),
      params
    });
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
