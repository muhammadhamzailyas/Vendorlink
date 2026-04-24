let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn("WARNING: STRIPE_SECRET_KEY is missing. Stripe functionality will be disabled.");
}

class StripeService {
  /**
   * Create a PaymentIntent for a specific amount and currency
   */
  async createPaymentIntent(amount, currency = "usd", metadata = {}) {
    try {
      if (!stripe) {
        throw new Error("Stripe is not configured. Please check STRIPE_SECRET_KEY.");
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
      };
    } catch (error) {
      console.error("Stripe error:", error.message);
      throw error;
    }
  }

  /**
   * Confirm a payment was successful (usually called via webhook)
   */
  async verifyPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status === "succeeded";
    } catch (error) {
      console.error("Stripe verification error:", error.message);
      return false;
    }
  }
}

module.exports = new StripeService();
