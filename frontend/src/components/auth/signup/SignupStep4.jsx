import React, { useState } from "react";
import { Info } from "@phosphor-icons/react";
import { Button } from "../../ui";
import PlanCard from "./PlanCard";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "./StripePaymentForm";
import { onboardingService } from "../../../services/api";
import toastUtil from "../../../lib/toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PLANS = [
  {
    id: "free",
    name: "Standard",
    price: "0",
    description: "Perfect for getting started",
    features: ["Standard Profile Visibility", "Up to 5 Proposals/month", "Community Support"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "20",
    description: "For professionals who want to grow",
    features: ["Priority Profile Visibility", "Unlimited Proposals", "Direct Support", "Analytics Dashboard"],
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "50",
    description: "For large teams and agencies",
    features: ["Top-tier Visibility", "Account Manager", "Custom API Access", "Bulk Task Management"],
  },
];

const SignupStep4 = ({ plan, onPlanChange, onSubmit, onBack, loading: parentLoading }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  
  const selectedPlan = PLANS.find(p => p.id === plan);

  const handleContinue = async () => {
    if (plan === "free") {
      onSubmit(); // Proceed to review
      return;
    }

    setLoading(true);
    try {
      const res = await onboardingService.createPaymentIntent(plan);
      setClientSecret(res.data.clientSecret);
      setShowPayment(true);
    } catch (error) {
      toastUtil.handleApiError(error, { defaultMessage: "Failed to initialize payment" });
    } finally {
      setLoading(false);
    }
  };

  const onPaymentSuccess = (stripePaymentId) => {
    // Pass the payment ID back to parent
    onSubmit(stripePaymentId);
  };

  if (showPayment && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
        <StripePaymentForm 
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
          onPaymentSuccess={onPaymentSuccess}
          onBack={() => setShowPayment(false)}
        />
      </Elements>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--muted)] border border-[var(--ring)]/20 p-4 rounded-xl flex items-start gap-3">
          <Info className="h-5 w-5 text-[var(--foreground)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--foreground)] font-medium leading-relaxed">
              Note: Payment will NOT be deducted until your account is verified by our team. You can choose a plan now to set up your profile.
          </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <PlanCard 
            key={p.id}
            plan={p}
            isSelected={plan === p.id}
            onSelect={onPlanChange}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} disabled={loading || parentLoading} className="h-12 w-1/3 rounded-xl font-normal">Back</Button>
        <Button 
            variant="primary" 
            onClick={handleContinue} 
            loading={loading || parentLoading}
            disabled={!plan || loading || parentLoading}
            className="h-12 w-2/3 rounded-xl text-base uppercase tracking-widest font-normal"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};

export default SignupStep4;
