import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {RegistrationService} from '../../services/registration.service';

@Component({
  selector: 'app-registration',
  standalone: false,
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent implements OnInit{

  private fb = inject(FormBuilder)
  private router = inject(Router)
  private registrationSvc = inject(RegistrationService)

  protected form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      email: this.fb.control<string>('', [Validators.required, Validators.email]),
      password: this.fb.control('', [Validators.required]),
      confirmPassword: this.fb.control<string>('', [Validators.required])
    });
  }

  register(): void {
    if (this.form.value.password !== this.form.value.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const email: string = this.form.value.email;
    const password: string = this.form.value.password;

    this.registrationSvc.register(email, password).subscribe({
      next: (res) => {
        alert(res.message || 'Registration successful');
        this.router.navigate(['/']);
      },
      error: (err) => {
        alert('Registration failed: ' + (err.error || err.statusText));
      }
    });
  }

}
