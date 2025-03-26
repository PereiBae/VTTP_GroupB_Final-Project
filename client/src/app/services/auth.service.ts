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

  // Observable to track premium subscription status changes
  private premiumStatusSubject = new BehaviorSubject<boolean>(false);
  public premiumStatus$ = this.premiumStatusSubject.asObservable();
  // Observable to broadcast authentication state changes throughout the app
  private authStateSubject = new BehaviorSubject<boolean>(false);
  public authStateChanged$ = this.authStateSubject.asObservable();

  constructor() {
    // Initialize premium status from token
    this.updatePremiumStatus();
    // Initialize auth state
    this.authStateSubject.next(!!this.getToken())
  }

  // Retrieves JWT token from browser's local storage
  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  // Determines if user has premium subscription by checking token authorities
  isPremiumUser(): boolean {
    try {
      const token = this.getToken();
      if (!token) return false;

      const decoded = jwtDecode<JwtPayload>(token);

      // Check if token is expired (convert seconds to milliseconds)
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.warn('JWT token expired');
        localStorage.removeItem('jwt');
        return false;
      }

      // Check if user has premium role in authorities array
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
    // In actual implementation, this would make an API call
    // Here I am just checking the existing token
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        // For demo purposes - in production, I will get a new token from server
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload.authorities.includes('ROLE_PREMIUM')) {
          payload.authorities.push('ROLE_PREMIUM');
          console.log('Premium status updated in local state');
        }
        this.premiumStatusSubject.next(true);
      } catch (e) {
        console.error('Error updating premium status', e);
      }
    }
  }

  // Stores JWT token in local storage after successful login
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

  // Decodes the JWT token to access its payload
  decodeToken(token: string): JwtPayload {
    return jwtDecode<JwtPayload>(token);
  }

}
