import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';

interface PlanFeature {
  title: string;
  description: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: number;
  period: string;
  features: PlanFeature[];
  buttonText: string;
  recommended?: boolean;
}

@Component({
  selector: 'app-upgrade',
  standalone: false,
  templateUrl: './upgrade.component.html',
  styleUrl: './upgrade.component.css'
})
export class UpgradeComponent implements OnInit{

  plans: Plan[] = [];
  selectedPlan: Plan | null = null;
  isPremium = false;

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  ngOnInit() {
    this.isPremium = this.authService.isPremiumUser();
    this.initializePlans();
  }

  initializePlans() {
    // Features available to all users
    const coreFeatures: PlanFeature[] = [
      { title: 'Workout Tracking', description: 'Log and track your workouts', included: true },
      { title: 'Diary Entries', description: 'Record your fitness journey', included: true },
      { title: 'Workout Templates', description: 'Create and use workout templates', included: true },
      { title: 'Exercise Library', description: 'Access to exercise database', included: true },
      { title: 'Spotify Integration', description: 'Add music to your workouts', included: true },
      { title: 'Community Features', description: 'Connect with other users', included: true },
    ];

    const standardFeatures: PlanFeature[] = [
      ...coreFeatures,
      { title: 'Nutrition Tracking', description: 'Log and track your nutrition', included: false },
      { title: 'Advanced Statistics', description: 'View detailed progress graphs', included: false },
    ];

    const premiumFeatures: PlanFeature[] = [
      ...coreFeatures,
      { title: 'Nutrition Tracking', description: 'Log and track your nutrition', included: true },
      { title: 'Advanced Statistics', description: 'View detailed progress graphs', included: true },
    ];

    this.plans = [
      {
        name: 'Standard',
        price: 0,
        period: 'Free forever',
        features: standardFeatures,
        buttonText: 'Current Plan'
      },
      {
        name: 'Premium',
        price: 9.99,
        period: 'per month',
        features: premiumFeatures,
        buttonText: 'Upgrade Now',
        recommended: true
      },
      {
        name: 'Premium Annual',
        price: 99.99,
        period: 'per year',
        features: premiumFeatures,
        buttonText: 'Upgrade & Save'
      }
    ];
  }

  selectPlan(plan: Plan) {
    this.selectedPlan = plan;
  }

  upgradeToSelectedPlan() {
    if (!this.selectedPlan || this.selectedPlan.name === 'Standard') {
      return;
    }

    // This will be replaced with Stripe implementation in Phase 4
    this.snackBar.open(
      'Payment processing integration coming soon! Check back in Phase 4.',
      'OK',
      { duration: 5000 }
    );

    // Mock upgrade - in real implementation, this would be called after successful payment
    this.mockUpgradeUser();
  }

  // Mock function - will be replaced with actual implementation
  private mockUpgradeUser() {
    // In the real implementation, this would:
    // 1. Call an API to update user's premium status
    // 2. Get a new JWT token with updated roles
    // 3. Store the token and update the auth service

    this.snackBar.open(
      'For development: Pretending upgrade was successful!',
      'OK',
      { duration: 3000 }
    );

    // Redirect to dashboard
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 3000);
  }

}
