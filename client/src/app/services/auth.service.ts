import { Injectable } from '@angular/core';
import {jwtDecode} from 'jwt-decode';

export interface JwtPayload {
  sub: string;
  authorities: string[];
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  isPremiumUser(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.authorities && decoded.authorities.includes('ROLE_PREMIUM');
    } catch (error) {
      console.error('Invalid token', error);
      return false;
    }
  }

}
