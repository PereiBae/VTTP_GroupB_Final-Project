import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  private router = inject(Router)

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = localStorage.getItem('jwt');
    if (!token) {
      console.log(`>>> No Token found`);
      this.router.navigate(['/']);
      return false;
    }
    console.log(localStorage.getItem('jwt'));
    return true;
  }
}
