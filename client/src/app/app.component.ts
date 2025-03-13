import {Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{

  isLoggedIn: boolean = false;
  isPremium: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.updateLoginStatus()
  }

  updateLoginStatus() {
    this.isLoggedIn = !!this.authService.getToken();
    this.isPremium = this.authService.isPremiumUser();
  }

  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('spotify_token');
    this.isLoggedIn = false;
    this.isPremium = false;
    this.router.navigate(['/']);
  }

}
