import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RegistrationResponse} from '../models/registration-response';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  private http = inject(HttpClient)

  register(email: string, password: string): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>('api/auth/register', {email, password})
  }

}
