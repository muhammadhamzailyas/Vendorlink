import React, { useState, useEffect } from "react";
import { Info, CreditCard, CheckCircle } from "@phosphor-icons/react";
import { Button, Loader } from "../../ui";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "./StripePaymentForm";
import { onboardingService } from "../../../services/api";
import toastUtil from "../../../lib/toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const SignupStep4 = ({ onSubmit, onBack, loading: parentLoading, stripePaymentId }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(!stripePaymentId); // Don't show loader if already paid
  const [initError, setInitError] = useState(null);
  
  useEffect(() => {
    // If a payment has already been made, don't initialize a new one.
    if (stripePaymentId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const initializePayment = async () => {
      try {
        setLoading(true);
        setInitError(null);
        const res = await onboardingService.createPaymentIntent();
        if (mounted) {
            setClientSecret(res.data.clientSecret);
        }
      } catch (error) {
        console.error("Payment initialization error:", error);
        if (mounted) {
            setInitError(error.response?.data?.message || error.message || "Failed to initialize payment");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializePayment();
    return () => { mounted = false; };
  }, [stripePaymentId]);

  const onPaymentSuccess = (newPaymentId) => {
    onSubmit(newPaymentId);
  };

  // If payment is already done, show a success view.
  if (stripePaymentId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-3 py-8">
          <div className="h-16 w-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-2">
              <CheckCircle size={32} weight="duotone" />
          </div>
          <h3 className="text-lg font-bold">Payment Already Completed</h3>
          <p className="text-sm text-muted-foreground max-w-xs">You have already submitted your payment information. You can proceed to the final step.</p>
        </div>
        <div className="grid-cols-2 grid w-full gap-4 pt-4 border-t border-border/50">
          <Button variant="secondary" onClick={onBack} disabled={parentLoading} size="lg" className="w-full flex-1 font-semibold">Back</Button>
          <Button variant="primary" onClick={() => onSubmit()} loading={parentLoading} disabled={parentLoading} size="lg" className="w-full flex-1 font-semibold shadow-soft">
            {parentLoading ? "Continuing..." : "Continue"}
          </Button></div>
      </div>
    );
  }

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader className="h-10 w-10" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing secure payment gateway...</p>
          </div>
      );
  }

  if (initError) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="h-16 w-16 bg-error/10 text-error rounded-full flex items-center justify-center">
                <CreditCard size={32} weight="duotone" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-bold">Payment Setup Failed</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{initError}</p>
            </div>
            <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
            <Button variant="ghost" size="sm" onClick={onBack}>Go Back</Button>
        </div>
      );
  }
  
  if (clientSecret) {
    return (
      <div className="space-y-6">
        <Elements 
          stripe={stripePromise} 
          options={{ clientSecret }}
        >
          <StripePaymentForm 
            clientSecret={clientSecret}
            planPrice="30"
            onPaymentSuccess={onPaymentSuccess}
            onBack={onBack}
          />
        </Elements>
      </div>
    );
  }

  return null; // Should not be reached if logic is correct
};

export default SignupStep4;
