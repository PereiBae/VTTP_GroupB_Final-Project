import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {LoginService} from '../../services/login.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  protected form!: FormGroup;
  private fb = inject(FormBuilder)
  private router = inject(Router)
  private loginSvc = inject(LoginService)

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    this.form = this.fb.group({
      email: this.fb.control<string>('', [Validators.required, Validators.email]),
      password: this.fb.control<string>('', [Validators.required])
    })
  }

  login() {
    const e:string = this.form.value.email;
    const p:string = this.form.value.password;
    this.loginSvc.login(e, p).subscribe({
      next: (response) => {
        // Save token (for example, in localStorage)
        localStorage.setItem('jwt', response.token);
        // Navigate to a protected page after login
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login failed', err);
      }
    });
  }

}
