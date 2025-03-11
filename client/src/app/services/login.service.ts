import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {LoginResponse} from '../models/login-response';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private http = inject(HttpClient)

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`/api/auth/login`, { email, password });
  }

}
