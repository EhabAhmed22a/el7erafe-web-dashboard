import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get headers with fresh token each time
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getUsers(pageNumber: number = 1, pageSize: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<any>(`${this.apiUrl}/api/clients`, {
      headers: this.getHeaders(),
      params
    });
  }

  getUserById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/clients/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/clients/${id}`, userData, { 
      headers: this.getHeaders() 
    });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/admin/clients?id=${id}`, { 
      headers: this.getHeaders() 
    });
  }

  blockOrUnblockUser(
  id: string,
  payload: {
    isBlocked: boolean;
    suspendTo?: string;
    suspensionReason?: string;
  }
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/api/admin/clients/${id}/status`,
      payload,
      { headers: this.getHeaders() }
    );
  }
}