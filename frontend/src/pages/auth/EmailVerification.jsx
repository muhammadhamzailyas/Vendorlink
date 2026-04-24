import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Envelope, CheckCircle } from "@phosphor-icons/react";
import { Button } from "../../components/ui";
import toastUtil from "../../lib/toast";
import { auth } from "../../lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import AuthLayout from "../../components/auth/AuthLayout";

const EmailVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || sessionStorage.getItem("vendorlink_verify_email") || "";
  
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
    if (location.state?.email) sessionStorage.setItem("vendorlink_verify_email", location.state.email);
  }, [email, navigate, location.state]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Automated transitions for email verification
  useEffect(() => {
    const interval = setInterval(async () => {
        const user = auth.currentUser;
        if (user) {
            await user.reload();
            if (user.emailVerified) {
                clearInterval(interval);
                toastUtil.success("Email verified!");
                // Clear session storage and navigate back to signup to continue
                sessionStorage.removeItem("vendorlink_verify_email");
                navigate("/signup", { state: { resumeStep: 2, isVerified: true } });
            }
        }
    }, 3000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleResendEmail = async () => {
      setLoading(true);
      try {
          if (auth.currentUser) {
              await sendEmailVerification(auth.currentUser);
              toastUtil.success("Verification link resent!");
              setTimer(60);
          }
      } catch (error) {
          toastUtil.error("Too many requests. Please try again later.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We've sent a verification link to ${email}`}
      hideGoogle
      footerText="Problems?"
      footerLinkText="Go back to signup"
      footerLinkTo="/signup"
    >
      <div className="space-y-8">
        <div className="flex justify-center">
            <div className="h-20 w-20 bg-[var(--muted)] text-[var(--foreground)] rounded-full flex items-center justify-center">
                <Envelope size={40} />
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-[var(--muted)] border border-[var(--border)]/50 p-5 rounded-2xl flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--foreground)] font-medium leading-relaxed">
                    We are waiting for you to click the link in your email. This page will update automatically once verified.
                </p>
            </div>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4 border-t border-[var(--border)]/40">
            <div className="flex items-center gap-2">
                <p className="text-sm text-[var(--muted-foreground)] font-medium">Didn't receive it?</p>
                <button
                  onClick={handleResendEmail}
                  disabled={loading || timer > 0}
                  className="text-sm font-bold text-[var(--foreground)] disabled:opacity-50 cursor-pointer"
                >
                  {timer > 0 ? `Resend in ${timer}s` : "Resend Now"}
                </button>
            </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default EmailVerification;
