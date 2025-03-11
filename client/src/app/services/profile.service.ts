import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UserProfile} from '../models/user-profile';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private http = inject(HttpClient)

  getProfile():Observable<UserProfile>{
    return this.http.get<UserProfile>('api/profile')
  }

  // Update user profile
  updateProfile(profile: UserProfile): Observable<UserProfile> {
    return this.http.post<UserProfile>('/api/profile', profile);
  }

}
