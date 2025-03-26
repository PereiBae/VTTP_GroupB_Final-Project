import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {LoginService} from '../../services/login.service';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  protected form!: FormGroup;
  loginError: string | null = null;
  hidePassword = true; // Controls password visibility toggle

  private fb = inject(FormBuilder)
  private router = inject(Router)
  private loginSvc = inject(LoginService)
  private authService = inject(AuthService)

  ngOnInit() {
    this.createForm();
  }

  // Initialize login form with validation
  createForm() {
    this.form = this.fb.group({
      email: this.fb.control<string>('', [Validators.required, Validators.email]),
      password: this.fb.control<string>('', [Validators.required])
    })
  }

  // Handle login form submission
  login() {
    const e:string = this.form.value.email;
    const p:string = this.form.value.password;
    this.loginSvc.login(e, p).subscribe({
      next: (response) => {
        console.log('Login response:', response);

        if (!response) {
          this.loginError = "Server returned empty response";
          return;
        }

        if (!response.token) {
          console.error('Token missing from response:', response);
          this.loginError = "Authentication error: Invalid server response";
          return;
        }

        console.log('Token received:', response.token);
        // Store token through auth service
        this.authService.setToken(response.token);
        console.log('Token stored in localStorage:', localStorage.getItem('jwt'));
        // Navigate to dashboard after successful login
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login failed', err);
        if (err.status === 401) {
          this.loginError = 'Invalid email or password';
        } else {
          this.loginError = 'Login failed. Please try again later.';
        }
      }
    });
  }

}
