import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {LoginResponse} from '../models/login-response';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private http = inject(HttpClient)

  login(email: string, password: string): Observable<LoginResponse> {
    // Add explicit headers to ensure proper JSON parsing
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    return this.http.post<LoginResponse>(`/api/auth/login`, { email, password },{headers});
  }

}
