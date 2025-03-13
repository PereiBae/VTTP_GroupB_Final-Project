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

  constructor() {
    // Initialize premium status from token
    this.updatePremiumStatus();
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
    const isPremium = this.isPremiumUser();
    this.premiumStatusSubject.next(isPremium);
  }

  // This method should be called after successful login
  setToken(token: string): void {
    localStorage.setItem('jwt', token);
    this.updatePremiumStatus();
  }

  // Clear token and update premium status on logout
  clearToken(): void {
    localStorage.removeItem('jwt');
    this.updatePremiumStatus();
  }

}
