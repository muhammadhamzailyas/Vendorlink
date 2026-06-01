import React, { useState } from "react";
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "../../ui";
import { Lock } from "@phosphor-icons/react";
import toastUtil from "../../../lib/toast";

const StripePaymentForm = ({ onPaymentSuccess, onBack, planPrice, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
            card: elements.getElement(CardNumberElement),
        },
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

  const elementOptions = {
    style: {
      base: {
        fontSize: '14px',
        color: '#e5e7eb',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#f87171',
      },
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-muted/50 border border-border/50 p-5 rounded-xl">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Summary</h3>
              <span className="px-2 py-0.5 bg-foreground text-background text-[9px] font-bold rounded uppercase tracking-tighter">
                One-time Activation
              </span>
          </div>
          <div className="flex justify-between items-baseline mb-2">
              <span className="text-foreground text-sm font-medium">Professional Profile Access</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-black tracking-tighter text-foreground">${planPrice}</span>
              </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium italic border-t border-border/50 pt-3">
            Note: Payment will only be deducted once your account has been reviewed and approved by our admin team.
          </p>
      </div>

      <div className="space-y-4">
        {/* Separated Card Elements */}
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="mb-1.5 block text-[13px] font-bold tracking-tight text-foreground/80 uppercase">Card Number</label>
                <div className="w-full rounded-xl border border-input-border bg-input-bg px-4 py-[15px]">
                    <CardNumberElement options={{ ...elementOptions, showIcon: true, iconStyle: 'solid' }} />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="mb-1.5 block text-[13px] font-bold tracking-tight text-foreground/80 uppercase">Expiration</label>
                    <div className="w-full rounded-xl border border-input-border bg-input-bg px-4 py-[15px]">
                        <CardExpiryElement options={elementOptions} />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="mb-1.5 block text-[13px] font-bold tracking-tight text-foreground/80 uppercase">CVC</label>
                    <div className="w-full rounded-xl border border-input-border bg-input-bg px-4 py-[15px]">
                        <CardCvcElement options={elementOptions} />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-center gap-2.5 text-[10px] text-muted-foreground bg-foreground/5 p-4 rounded-xl border border-foreground/10">
            <Lock size={14} weight="bold" className="shrink-0 text-foreground/40" />
            <span className="font-bold tracking-tight leading-tight">
                Powered by Stripe
            </span>
        </div>
      </div>

      <div className="grid-cols-2 grid gap-4 pt-4">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onBack} 
          disabled={isProcessing} 
          size="lg"
          className="w-full flex-1 font-semibold"
        >
          Back
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          loading={isProcessing} 
          disabled={!stripe || isProcessing}
          size="lg"
          className="w-full flex-1 font-semibold shadow-soft"
        >
          {isProcessing ? "Processing..." : "Complete Payment"}
        </Button></div>
    </form>
  );
};

export default StripePaymentForm;

