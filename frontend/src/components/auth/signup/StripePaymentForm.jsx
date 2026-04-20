import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "../../ui";
import { Lock, WarningCircle } from "@phosphor-icons/react";
import toastUtil from "../../../lib/toast";

const StripePaymentForm = ({ onPaymentSuccess, onBack, planName, planPrice }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsConnected] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsConnected(true);

    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toastUtil.error(error.message || "Payment failed");
      setIsConnected(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      toastUtil.success("Payment authorized successfully!");
      onPaymentSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-[var(--muted)] border border-[var(--ring)]/10 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Order Summary</h3>
              <span className="px-2.5 py-1 bg-[var(--foreground)] text-[var(--foreground)] text-[10px] font-black rounded-lg uppercase">{planName}</span>
          </div>
          <div className="flex justify-between items-baseline">
              <span className="text-[var(--muted-foreground)] text-sm">Monthly Subscription</span>
              <span className="text-2xl font-black">${planPrice}<span className="text-xs font-medium text-[var(--muted-foreground)]">/mo</span></span>
          </div>
      </div>

      <div className="space-y-4">
        <div className="p-1">
            {/* Real Stripe Element */}
            <PaymentElement options={{ layout: 'tabs' }} />
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)] bg-[var(--muted)]/30 p-3 rounded-xl border border-[var(--border)]/50">
            <Lock size={12} className="shrink-0" />
            <span>Secure encryption active. No amount will be charged until your account is verified.</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onBack} 
          disabled={isProcessing} 
          className="h-12 w-1/3 rounded-xl"
        >
          Back
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          loading={isProcessing} 
          disabled={!stripe || isProcessing}
          className="h-12 w-2/3 rounded-xl text-base font-bold uppercase tracking-widest"
        >
          {isProcessing ? "Processing..." : "Secure & Continue"}
        </Button>
      </div>
    </form>
  );
};

export default StripePaymentForm;
