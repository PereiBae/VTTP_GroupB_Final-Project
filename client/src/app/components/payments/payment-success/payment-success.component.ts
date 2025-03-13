import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../../../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {PaymentService} from '../../../services/payment.service';

@Component({
  selector: 'app-payment-success',
  standalone: false,
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent implements OnInit{

  loading = true;
  success = false;
  errorMessage = '';

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];

      if (!sessionId) {
        this.loading = false;
        this.success = false;
        this.errorMessage = 'Invalid session ID';
        return;
      }

      this.verifyPayment(sessionId);
    });
  }

  verifyPayment(sessionId: string) {
    this.paymentService.getSessionStatus(sessionId).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = response.isPremium;

        if (this.success) {
          // Refresh the JWT token to include premium role
          this.refreshToken();
        } else {
          this.errorMessage = 'Payment was processed but premium status update failed.';
        }
      },
      error: (error) => {
        this.loading = false;
        this.success = false;
        this.errorMessage = error.error?.message || 'An error occurred while verifying payment';
      }
    });
  }

  refreshToken() {
    // Call your auth service to get a new token with updated roles
    // For now, we'll just update the auth service
    this.authService.updatePremiumStatus();
  }

}
