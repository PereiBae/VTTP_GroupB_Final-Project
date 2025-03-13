package vttp.batch5.paf.finalproject.server.controllers;

import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import vttp.batch5.paf.finalproject.server.services.MyUserDetailsService;
import vttp.batch5.paf.finalproject.server.services.StripeService;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private StripeService stripeService;

    @Autowired
    private MyUserDetailsService myUserDetailsService;

    @PostMapping("/create-checkout-session")
    public ResponseEntity<Map<String, String>> createCheckoutSession(
            @RequestBody Map<String, String> payload,
            Authentication authentication) {

        String planId = payload.get("planId");
        String email = authentication.getName();

        try {
            Session session = stripeService.createCheckoutSession(email, planId);
            Map<String, String> responseData = new HashMap<>();
            responseData.put("sessionId", session.getId());
            responseData.put("url", session.getUrl());
            return ResponseEntity.ok(responseData);
        } catch (StripeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/create-payment-intent")
    public ResponseEntity<Map<String, String>> createPaymentIntent(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        try {
            long amount = Long.parseLong(payload.get("amount").toString());
            String currency = payload.get("currency").toString();
            String clientSecret = stripeService.createPaymentIntent(amount, currency);

            return ResponseEntity.ok(Map.of("clientSecret", clientSecret));
        } catch (StripeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        if (stripeService.verifyWebhookSignature(payload, sigHeader)) {
            // Process the event
            // This would include updating the user's premium status
            // based on subscription events
            return ResponseEntity.ok("Webhook received");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }
    }

    @GetMapping("/session-status")
    public ResponseEntity<Map<String, Object>> getSessionStatus(
            @RequestParam String sessionId,
            Authentication authentication) {

        try {
            Session session = Session.retrieve(sessionId);
            String status = session.getStatus();

            // If the payment was successful, upgrade the user
            if ("complete".equals(status)) {
                myUserDetailsService.upgradeToPremium(authentication.getName());
                return ResponseEntity.ok(Map.of(
                        "status", status,
                        "isPremium", true
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "status", status,
                    "isPremium", false
            ));
        } catch (StripeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

}
