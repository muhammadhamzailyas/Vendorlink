import { loadStripe } from "@stripe/stripe-js";

// Use the public key from env or a placeholder if not set
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

export default stripePromise;