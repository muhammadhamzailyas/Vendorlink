import React, { useState, useEffect } from "react";
import { Info, CreditCard } from "@phosphor-icons/react";
import { Button, Loader } from "../../ui";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "./StripePaymentForm";
import { onboardingService } from "../../../services/api";
import toastUtil from "../../../lib/toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const SignupStep4 = ({ onSubmit, onBack, loading: parentLoading }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  
  useEffect(() => {
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
  }, []);

  const onPaymentSuccess = (stripePaymentId) => {
    onSubmit(stripePaymentId);
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader className="h-10 w-10" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing secure payment gateway...</p>
          </div>
      );
  }

  if (clientSecret) {
    return (
      <div className="space-y-6">
        <Elements 
          stripe={stripePromise} 
          options={{ 
            clientSecret, 
            appearance: { 
              theme: 'stripe',
              variables: {
                fontFamily: 'Inter, system-ui, sans-serif',
                colorBackground: '#ffffff',
                colorText: '#000000',
                colorPrimary: '#0570de',
                colorDanger: '#ef4444',
                colorSuccess: '#30b130',
                colorWarning: '#e69e2c',
                colorTextSecondary: '#4d4d4d',
                colorTextPlaceholder: '#757575',
                buttonColorBackground: '#0570de',
                buttonColorText: '#ffffff',
                accessibleColorOnColorPrimary: '#ffffff',
                accessibleColorOnColorBackground: '#000000',
                accessibleColorOnColorSuccess: '#fff',
                accessibleColorOnColorDanger: '#000000',
                accessibleColorOnColorWarning: '#000000',
                iconColor: '#4d4d4d',
                iconHoverColor: '#000000',
                iconCardErrorColor: '#ef4444',
                iconCheckmarkColor: '#0570de',
                borderRadius: '12px',
                spacingGridRow: '16px',
              },
              rules: {
                '.Input': {
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  backgroundColor: '#f8fafc', 
                  transition: 'all 0.2s ease',
                  boxShadow: 'none',
                },
                '.Input:focus': {
                  border: '1px solid #0570de',
                  boxShadow: '0 0 0 3px rgba(5, 112, 222, 0.2), 0 1px 1px 0 rgba(0, 0, 0, 0.08)',
                  backgroundColor: '#ffffff',
                },
                '.Label': {
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                  color: '#4d4d4d',
                }
              }
            } 
          }}
        >
          <StripePaymentForm 
            planPrice="30"
            onPaymentSuccess={onPaymentSuccess}
            onBack={onBack}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="h-16 w-16 bg-error/10 text-error rounded-full flex items-center justify-center">
            <CreditCard size={32} weight="duotone" />
        </div>
        <div className="space-y-2">
            <h3 className="text-lg font-bold">Payment Setup Failed</h3>
            <p className="text-sm text-muted-foreground max-w-xs">{initError || "We couldn't connect to our payment provider. Please try again or check your connection."}</p>
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
        <Button variant="ghost" size="sm" onClick={onBack}>Go Back</Button>
    </div>
  );
};

export default SignupStep4;
