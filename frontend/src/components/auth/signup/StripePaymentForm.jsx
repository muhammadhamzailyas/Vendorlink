import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "../../ui";
import { Lock } from "@phosphor-icons/react";
import toastUtil from "../../../lib/toast";

const StripePaymentForm = ({ onPaymentSuccess, onBack, planName, planPrice }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      console.error("Payment confirmation error:", error);
      toastUtil.error(error.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      toastUtil.success("Payment authorized successfully!");
      onPaymentSuccess(paymentIntent.id);
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-muted/50 border border-border/50 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Summary</h3>
              <span className="px-2 py-0.5 bg-foreground text-background text-[9px] font-bold rounded uppercase tracking-tighter">
                One-time activation
              </span>
          </div>
          <div className="flex justify-between items-baseline">
              <span className="text-foreground text-sm font-medium">Professional Profile Activation</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-black tracking-tighter text-foreground">${planPrice}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">USD</span>
              </div>
          </div>
      </div>

      <div className="space-y-4">
        <div className="payment-element-wrapper">
            <PaymentElement options={{ 
              layout: 'tabs', // Changed to tabs with defaultCollapsed: false to strictly show Card fields
              paymentMethodOrder: ['card'],
              business: { name: 'VendorLink' },
              fields: {
                billingDetails: {
                  address: {
                    country: 'never', // Hide country to keep it clean, as we already have address
                  }
                }
              }
            }} />
        </div>

        <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground bg-foreground/5 p-4 rounded-xl border border-foreground/10">
            <Lock size={14} weight="bold" className="shrink-0 text-foreground/40" />
            <span className="font-bold uppercase tracking-tight leading-tight">
                Secure 256-bit encryption. Payment processed by Stripe.
            </span>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onBack} 
          disabled={isProcessing} 
          size="lg"
          className="flex-1 font-normal"
        >
          Back
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          loading={isProcessing} 
          disabled={!stripe || isProcessing}
          size="lg"
          className="flex-1 font-normal shadow-soft"
        >
          {isProcessing ? "Processing..." : "Complete Payment"}
        </Button>
      </div>
    </form>
  );
};

export default StripePaymentForm;
