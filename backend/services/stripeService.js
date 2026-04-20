const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

class StripeService {
  /**
   * Create a PaymentIntent for a specific amount and currency
   */
  async createPaymentIntent(amount, currency = "usd", metadata = {}) {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe secret key not configured");
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
