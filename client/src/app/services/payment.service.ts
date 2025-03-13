import { Injectable } from '@angular/core';
import {BaseService} from './base.service';
import {HttpClient} from '@angular/common/http';
import {AuthService} from './auth.service';
import {Observable} from 'rxjs';

declare var Stripe: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService extends BaseService{

  private stripe: any;
  private publishableKey = 'pk_test_51R2497KxNqsVEF5JuRz0iYujsn7vrPjgcs7E45qaMS51GFryFQEtPaoDGqsSWP8ueA3mYS50vUEEKkulm7DhSCH9006WQ9QYG1';

  constructor(
    http: HttpClient,
    private authService: AuthService
  ) {
    super(http);
    this.loadStripe();
  }

  private loadStripe() {
    if (!window.document.getElementById('stripe-script')) {
      const script = window.document.createElement('script');
      script.id = 'stripe-script';
      script.type = 'text/javascript';
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        this.stripe = Stripe(this.publishableKey);
      };
      window.document.body.appendChild(script);
    } else {
      this.stripe = Stripe(this.publishableKey);
    }
  }

  createCheckoutSession(planId: string): Observable<{sessionId: string, url: string}> {
    return this.http.post<{sessionId: string, url: string}>(
      '/api/payment/create-checkout-session',
      { planId },
      { headers: this.getAuthHeaders() }
    );
  }

  createPaymentIntent(amount: number, currency: string = 'usd'): Observable<{clientSecret: string}> {
    return this.http.post<{clientSecret: string}>(
      '/api/payment/create-payment-intent',
      { amount, currency },
      { headers: this.getAuthHeaders() }
    );
  }

  redirectToCheckout(sessionId: string) {
    if (!this.stripe) {
      setTimeout(() => this.redirectToCheckout(sessionId), 100);
      return;
    }
    this.stripe.redirectToCheckout({ sessionId });
  }

  getSessionStatus(sessionId: string): Observable<{status: string, isPremium: boolean}> {
    return this.http.get<{status: string, isPremium: boolean}>(
      `/api/payment/session-status?sessionId=${sessionId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  async processCardPayment(clientSecret: string, cardElement: any) {
    return await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'User Name' // In a real app, collect this from the user
        }
      }
    });
  }

}
