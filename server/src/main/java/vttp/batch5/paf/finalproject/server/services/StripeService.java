package vttp.batch5.paf.finalproject.server.services;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Price;
import com.stripe.model.Product;
import com.stripe.model.checkout.Session;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PriceCreateParams;
import com.stripe.param.ProductCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class StripeService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @Value("${app.url}")
    private String appUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    public Session createCheckoutSession(String email, String planId) throws StripeException {
        // First, create or retrieve customer
        CustomerCreateParams customerParams = CustomerCreateParams.builder()
                .setEmail(email)
                .build();
        Customer customer = Customer.create(customerParams);

        // Get the price ID based on the plan
        String priceId = getPriceIdForPlan(planId);

        // Create checkout session
        SessionCreateParams params = SessionCreateParams.builder()
                .setCustomer(customer.getId())
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setSuccessUrl(appUrl + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(appUrl + "/payment/cancel")
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPrice(priceId)
                                .setQuantity(1L)
                                .build())
                .build();

        return Session.create(params);
    }


    private String getPriceIdForPlan(String planId) throws StripeException {
        // In a real application, you would look up prices from your database
        // For this example, we'll create products and prices on-demand

        // Map plan IDs to price IDs
        if ("premium_monthly".equals(planId)) {
            return createOrGetPrice("Premium Monthly", "premium_monthly", 999, "month");
        } else if ("premium_annual".equals(planId)) {
            return createOrGetPrice("Premium Annual", "premium_annual", 9999, "year");
        } else {
            throw new IllegalArgumentException("Invalid plan ID: " + planId);
        }
    }

    private String createOrGetPrice(String productName, String productId, long unitAmount, String interval) throws StripeException {
        // Check if product exists, create if not
        Map<String, Object> productParams = new HashMap<>();
        productParams.put("name", productName);
        productParams.put("id", productId);

        Product product;
        try {
            product = Product.retrieve(productId);
        } catch (StripeException e) {
            product = Product.create(productParams);
        }

        // Create a price for the product
        PriceCreateParams priceParams = PriceCreateParams.builder()
                .setCurrency("usd")
                .setProduct(product.getId())
                .setUnitAmount(unitAmount)
                .setRecurring(
                        PriceCreateParams.Recurring.builder()
                                .setInterval(PriceCreateParams.Recurring.Interval.valueOf(interval))
                                .build()
                )
                .build();

        Price price = Price.create(priceParams);
        return price.getId();
    }

    public String createPaymentIntent(long amount, String currency) throws StripeException {
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency(currency)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);
        return paymentIntent.getClientSecret();
    }

    public boolean verifyWebhookSignature(String payload, String sigHeader) {
        // In a production environment, implement proper Stripe webhook signature verification
        // This is a simplified version
        return true;
    }

}
