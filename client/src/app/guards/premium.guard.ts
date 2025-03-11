import {inject, Injectable} from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PremiumGuard implements CanActivate {

  private authService = inject(AuthService)
  private router = inject(Router)

  canActivate(): boolean {
    if (this.authService.isPremiumUser()) {
      return true;
    } else {
      // Redirect non-premium users to an upgrade page or show a notification.
      this.router.navigate(['/upgrade']);
      return false;
    }
  }
}
