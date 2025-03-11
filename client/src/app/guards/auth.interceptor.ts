import {inject, Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import { AuthService } from '../services/auth.service';
import {Router} from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private authService = inject(AuthService);
  private router = inject(Router);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token from the service
    const token = this.authService.getToken();

    // Log for debugging
    console.log('AuthInterceptor: Request URL:', request.url);
    console.log('AuthInterceptor: Token present:', !!token);

    // Skip adding token for auth endpoints
    if (request.url.includes('/api/auth/')) {
      return next.handle(request);
    }

    // If token exists, clone the request and add the authorization header
    if (token) {
      const authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('AuthInterceptor: Adding Authorization header');

      // Handle the response with error handling
      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            console.error('Authentication error:', error.status, error.message);
            // Optional: Redirect to login page on auth errors
            // this.router.navigate(['/login']);
          }
          return throwError(() => error);
        })
      );
    }

    // Otherwise, send the original request
    return next.handle(request);
  }

}
