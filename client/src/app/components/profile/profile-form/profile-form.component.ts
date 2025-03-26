import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ProfileService} from '../../../services/profile.service';
import {AuthService} from '../../../services/auth.service';
import {UserProfile} from '../../../models/user-profile';

@Component({
  selector: 'app-profile-form',
  standalone: false,
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.css'
})
export class ProfileFormComponent implements OnInit{

  profileForm!: FormGroup;
  loading = false;
  saving = false;
  userEmail = '';
  isPremium = false;

  private formBuilder = inject(FormBuilder)
  private profileService = inject(ProfileService)
  private authService = inject(AuthService)
  private snackBar = inject(MatSnackBar)

  ngOnInit(){
    this.createForm();
    this.loadProfile();
    this.isPremium = this.authService.isPremiumUser();
    this.userEmail = this.getEmailFromToken();
  }

  createForm(): void {
    this.profileForm = this.formBuilder.group({
      name: [''],
      age: [null, [Validators.min(13), Validators.max(120)]],
      height: [null, [Validators.min(0), Validators.max(300)]],
      weight: [null, [Validators.min(0), Validators.max(500)]],
      fitnessGoals: ['']
    });
  }

  loadProfile(): void {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          name: profile.name,
          age: profile.age,
          height: profile.height,
          weight: profile.weight,
          fitnessGoals: profile.fitnessGoals
        });
        this.loading = false;
      },
      error: (error) => {
        // If 404, it means profile doesn't exist yet, which is fine
        if (error.status !== 404) {
          console.error('Error loading profile', error);
          this.snackBar.open('Error loading profile', 'Close', { duration: 3000 });
        }
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.saving = true;
    const formValue = this.profileForm.value;

    // Create profile object
    const profile: UserProfile = {
      email: this.userEmail,
      name: formValue.name,
      age: formValue.age,
      height: formValue.height,
      weight: formValue.weight,
      fitnessGoals: formValue.fitnessGoals
    };

    this.profileService.updateProfile(profile).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating profile', error);
        this.saving = false;
        this.snackBar.open('Error updating profile', 'Close', { duration: 3000 });
      }
    });
  }

  getEmailFromToken(): string {
    // Get email from JWT token
    try {
      const token = this.authService.getToken();
      if (!token) return '';

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || '';
    } catch (error) {
      console.error('Error parsing token', error);
      return '';
    }
  }

}
