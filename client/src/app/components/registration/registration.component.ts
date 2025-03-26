import {Component, inject, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
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
  hidePassword = true; // For password visibility toggle
  hideConfirmPassword = true; // For confirm password visibility toggle
  registrationError: string | null = null;

  ngOnInit() {
    // Initialize the registration form with validation
    this.form = this.fb.group({
      email: this.fb.control<string>('', [Validators.required, Validators.email]),
      password: this.fb.control('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: this.fb.control<string>('', [Validators.required])
    }, { validators: this.passwordMatchValidator() });
  }

  // Custom validator to check if password and confirm password fields match
  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password');
      const confirmPassword = control.get('confirmPassword');

      if (password && confirmPassword && password.value !== confirmPassword.value) {
        return { 'passwordMismatch': true };
      }
      return null;
    };
  }

  // Get password strength class for visual indicator
  getPasswordStrengthClass(password: string): string {
    if (!password) return 'none';

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = [hasLowerCase, hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length;

    if (password.length < 8) return 'weak';
    if (strength === 1) return 'weak';
    if (strength === 2) return 'medium';
    if (strength === 3) return 'strong';
    return 'very-strong';
  }

  // Provides text description of password strength
  getPasswordStrengthText(password: string): string {
    const strengthClass = this.getPasswordStrengthClass(password);
    switch (strengthClass) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      case 'very-strong': return 'Very Strong';
      default: return '';
    }
  }

  // Handle registration form submission
  register(): void {
    // Double-check passwords match before submission
    if (this.form.value.password !== this.form.value.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const email: string = this.form.value.email;
    const password: string = this.form.value.password;

    // Call registration service to create user account
    this.registrationSvc.register(email, password).subscribe({
      next: (res) => {
        alert(res.message || 'Registration successful');
        this.router.navigate(['/']); // Redirect to login page
      },
      error: (err) => {
        alert('Registration failed: ' + (err.error || err.statusText));
      }
    });
  }

}
