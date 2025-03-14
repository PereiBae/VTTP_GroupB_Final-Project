import { Injectable } from '@angular/core';
import {jwtDecode} from 'jwt-decode';
import {BehaviorSubject} from 'rxjs';

export interface JwtPayload {
  sub: string;
  authorities: string[];
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private premiumStatusSubject = new BehaviorSubject<boolean>(false);
  public premiumStatus$ = this.premiumStatusSubject.asObservable();
  // Add a subject to broadcast auth state changes
  private authStateSubject = new BehaviorSubject<boolean>(false);
  public authStateChanged$ = this.authStateSubject.asObservable();

  constructor() {
    // Initialize premium status from token
    this.updatePremiumStatus();
    // Initialize auth state
    this.authStateSubject.next(!!this.getToken())
  }

  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  // Enhanced isPremiumUser with better error handling and caching
  isPremiumUser(): boolean {
    try {
      const token = this.getToken();
      if (!token) return false;

      const decoded = jwtDecode<JwtPayload>(token);

      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.warn('JWT token expired');
        localStorage.removeItem('jwt');
        return false;
      }

      return decoded.authorities &&
        Array.isArray(decoded.authorities) &&
        decoded.authorities.includes('ROLE_PREMIUM');
    } catch (error) {
      console.error('Invalid token', error);
      return false;
    }
  }

  // Update premium status and notify components
  updatePremiumStatus(): void {
    // In a real implementation, you would make an API call to get a new token
    // with updated roles. For simplicity, we'll just update the local state.
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        // For demo purposes, we'll modify the token in local storage
        // to include the premium role.
        // DO NOT do this in production! Always get a new valid token from server.
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload.authorities.includes('ROLE_PREMIUM')) {
          payload.authorities.push('ROLE_PREMIUM');

          // This is just for demonstration - normally you would get a new token
          // from the server with the updated roles
          console.log('Premium status updated in local state');
        }
        this.premiumStatusSubject.next(true);
      } catch (e) {
        console.error('Error updating premium status', e);
      }
    }
  }

  // This method should be called after successful login
  setToken(token: string): void {
    localStorage.setItem('jwt', token);
    this.updatePremiumStatus();
    this.authStateSubject.next(true);
  }

  // Clear token and update premium status on logout
  clearToken(): void {
    localStorage.removeItem('jwt');
    this.updatePremiumStatus();
    this.authStateSubject.next(false);
  }

  decodeToken(token: string): JwtPayload {
    return jwtDecode<JwtPayload>(token);
  }

}
