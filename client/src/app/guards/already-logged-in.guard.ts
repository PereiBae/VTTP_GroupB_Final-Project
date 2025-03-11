import {inject, Injectable} from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AlreadyLoggedInGuard implements CanActivate {

  private router = inject(Router)

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = localStorage.getItem('jwt');
    if (token) {
      // If token exists, redirect to dashboard
      this.router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }
}
