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
  async createPaymentIntent(amount, currency = "usd", options = {}) {
    try {
      if (!stripe) {
        throw new Error("Stripe is not configured. Please check STRIPE_SECRET_KEY.");
      }

      const { metadata = {}, automatic_payment_methods, ...rest } = options;

      const params = {
        amount: Math.round(amount * 100),
        currency,
        metadata,
        ...rest,
      };

      // Default to automatic payment methods if nothing else provided
      params.automatic_payment_methods = automatic_payment_methods || { enabled: true };

      const paymentIntent = await stripe.paymentIntents.create(params);

      return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        status: paymentIntent.status,
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
      if (!stripe) return false;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status === "succeeded";
    } catch (error) {
      console.error("Stripe verification error:", error.message);
      return false;
    }
  }

  /**
   * Construct event from webhook payload
   */
  constructEvent(payload, sig, endpointSecret) {
    if (!stripe) throw new Error("Stripe not configured");
    return stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  }
}

module.exports = new StripeService();
