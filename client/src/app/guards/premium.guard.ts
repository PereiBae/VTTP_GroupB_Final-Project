import {inject, Injectable} from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class PremiumGuard implements CanActivate {

  private authService = inject(AuthService)
  private router = inject(Router)
  private snackBar = inject(MatSnackBar);

  canActivate(): boolean {
    if (this.authService.isPremiumUser()) {
      return true;
    } else {
      // Show message to user explaining why they were redirected
      this.snackBar.open(
        'This feature requires a premium subscription.',
        'UPGRADE',
        {
          duration: 5000,
          verticalPosition: 'top',
          panelClass: 'premium-notification'
        }
      ).onAction().subscribe(() => {
        this.router.navigate(['/upgrade']);
      });

      // Redirect to upgrade page
      this.router.navigate(['/upgrade']);
      return false;
    }
  }
}
