import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "../../ui";
import { Lock } from "@phosphor-icons/react";
import toastUtil from "../../../lib/toast";

const StripePaymentForm = ({ onPaymentSuccess, onBack, planName, planPrice }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsConnected] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsConnected(true);

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
      <div className="bg-muted border border-ring/10 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-normal uppercase tracking-widest text-muted-foreground">Order Summary</h3>
              <span className="px-2.5 py-1 bg-foreground text-background text-[10px] font-normal rounded-lg uppercase tracking-tight">
                {planName}
              </span>
          </div>
          <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground text-sm font-normal">Monthly Subscription</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-normal text-foreground">${planPrice}</span>
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </div>
          </div>
      </div>

      <div className="space-y-4">
        <div className="p-1">
            <PaymentElement options={{ 
              layout: 'tabs',
              appearance: {
                theme: 'none',
                variables: {
                  fontFamily: 'inherit',
                  colorBackground: 'var(--input-bg)',
                  colorText: 'var(--foreground)',
                  colorDanger: 'var(--error)',
                  borderRadius: '12px',
                  spacingGridRow: '16px',
                },
                rules: {
                  '.Input': {
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-xs)',
                  },
                  '.Input:focus': {
                    border: '1px solid var(--foreground)',
                  }
                }
              }
            }} />
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
            <Lock size={12} className="shrink-0" />
            <span className="font-normal uppercase tracking-tight">Secure encryption active. No amount will be charged until your account is verified.</span>
        </div>
      </div>

      <div className="flex gap-4 pt-2 border-t border-border/50">
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



