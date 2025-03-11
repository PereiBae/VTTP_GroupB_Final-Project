import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UserProfile} from '../models/user-profile';
import {Observable} from 'rxjs';
import {BaseService} from './base.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService extends BaseService{

  constructor(http: HttpClient) {
    super(http);
  }

  getProfile():Observable<UserProfile>{
    return this.http.get<UserProfile>('api/profile',{headers: this.getAuthHeaders()});
  }

  // Update user profile
  updateProfile(profile: UserProfile): Observable<UserProfile> {
    return this.http.post<UserProfile>('/api/profile', profile, {headers: this.getAuthHeaders()});
  }

}
