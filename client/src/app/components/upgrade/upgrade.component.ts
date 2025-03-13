import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {PaymentService} from '../../services/payment.service';

interface PlanFeature {
  title: string;
  description: string;
  included: boolean;
}

interface Plan {
  id: string;
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
  isProcessing = false;
  paymentError: string | null = null;

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.isPremium = this.authService.isPremiumUser();
    this.initializePlans();

    // Check for successful payment
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];
      if (sessionId) {
        this.checkPaymentStatus(sessionId);
      }
    });
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
        id: 'standard',
        name: 'Standard',
        price: 0,
        period: 'Free forever',
        features: standardFeatures,
        buttonText: 'Current Plan'
      },
      {
        id: 'premium_monthly',
        name: 'Premium',
        price: 9.99,
        period: 'per month',
        features: premiumFeatures,
        buttonText: 'Upgrade Now',
        recommended: true
      },
      {
        id: 'premium_annual',
        name: 'Premium Annual',
        price: 99.99,
        period: 'per year',
        features: premiumFeatures,
        buttonText: 'Upgrade & Save'
      }
    ];
  }

  selectPlan(plan: Plan) {
    if (plan.id === 'standard') {
      return;
    }
    this.selectedPlan = plan;
  }

  upgradeToSelectedPlan() {
    if (!this.selectedPlan || this.selectedPlan.id === 'standard') {
      return;
    }

    this.isProcessing = true;
    this.paymentError = null;

    this.paymentService.createCheckoutSession(this.selectedPlan.id).subscribe({
      next: (response) => {
        this.isProcessing = false;
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      },
      error: (error) => {
        this.isProcessing = false;
        this.paymentError = error.error?.message || 'An error occurred during payment processing';
        if (this.paymentError != null) {
          this.snackBar.open(this.paymentError, 'Close', {duration: 5000});
        }
      }
    });
  }

  checkPaymentStatus(sessionId: string) {
    this.isProcessing = true;

    this.paymentService.getSessionStatus(sessionId).subscribe({
      next: (response) => {
        this.isProcessing = false;

        if (response.isPremium) {
          // Update auth token to reflect premium status
          this.updateAuthStatus();

          this.snackBar.open('Payment successful! You are now a premium member.', 'Close', {
            duration: 5000
          });

          // Clear the URL parameters
          this.router.navigate(['/upgrade'], { replaceUrl: true });
        } else {
          this.snackBar.open('Payment is being processed. Please try again later.', 'Close', {
            duration: 5000
          });
        }
      },
      error: (error) => {
        this.isProcessing = false;
        this.paymentError = error.error?.message || 'An error occurred while checking payment status';
        if (this.paymentError != null) {
          this.snackBar.open(this.paymentError, 'Close', {duration: 5000});
        }
      }
    });
  }

  updateAuthStatus() {
    // Call login method to refresh the JWT token
    // This should trigger a backend call to get a new token with updated roles
    // For simplicity, we'll just update the local premium status
    this.isPremium = true;
  }

}
