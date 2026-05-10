import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Envelope, CheckCircle, Warning } from "@phosphor-icons/react";
import { Button, Loader } from "../../components/ui";
import toastUtil from "../../lib/toast";
import { authService } from "../../services/api";
import AuthLayout from "../../components/auth/AuthLayout";
import axios from "axios";

const EmailVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const email = location.state?.email || sessionStorage.getItem("vendorlink_verify_email") || "";
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(!!token);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!token && !email) {
      navigate("/signup");
    }
    if (location.state?.email) sessionStorage.setItem("vendorlink_verify_email", location.state.email);
  }, [email, token, navigate, location.state]);

  // Handle Token verification (from email link)
  useEffect(() => {
    if (token) {
      const verifyToken = async () => {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';
          await axios.get(`${API_BASE}/auth/verify-email?token=${token}`);
          toastUtil.success("Email verified successfully! You can now log in.");
          sessionStorage.removeItem("vendorlink_verify_email");
          navigate("/login", { replace: true });
        } catch (err) {
          console.error("Verification error:", err);
          toastUtil.error("Invalid or expired verification token.");
          setVerifying(false);
        }
      };
      verifyToken();
    }
  }, [token, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResendEmail = async () => {
      if (!email) return;
      setLoading(true);
      try {
          // Re-use forgotPassword logic as a proxy for resending verification 
          // or just inform user to try logging in to trigger verification if implemented
          await authService.forgotPassword(email);
          toastUtil.success("Verification link resent!");
          setTimer(60);
      } catch (error) {
          toastUtil.error("Failed to resend. Please try again later.");
      } finally {
          setLoading(false);
      }
  };

  if (verifying) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <Loader size={40} className="mx-auto mb-4 text-foreground" />
            <p className="text-muted-foreground uppercase tracking-widest text-xs">Verifying your email...</p>
          </div>
        </div>
    );
  }

  return (
    <AuthLayout
      title={token ? "Verification Failed" : "Check your email"}
      subtitle={token ? "The link may be expired" : `We've sent a verification link to ${email}`}
      hideGoogle
      footerText="Problems?"
      footerLinkText="Go back to signup"
      footerLinkTo="/signup"
    >
      <div className="space-y-8">
        <div className="flex justify-center">
            <div className="h-20 w-20 bg-muted text-foreground rounded-full flex items-center justify-center">
                {token ? <Warning size={40} className="text-destructive" /> : <Envelope size={40} />}
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-muted border border-border/50 p-5 rounded-2xl flex items-center justify-center gap-3">
                <CheckCircle className="h-5 w-5 text-success shrink-0" />
                <p className="text-sm text-foreground font-medium leading-relaxed">
                    {token 
                      ? "The verification link is invalid or has expired. Please request a new one." 
                      : "Please click the link in the email we sent you to verify your account and begin onboarding."}
                </p>
            </div>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4 border-t border-border/40">
            <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground font-medium">Didn't receive it?</p>
                <button
                  onClick={handleResendEmail}
                  disabled={loading || timer > 0 || !email}
                  className="text-sm font-bold text-foreground disabled:opacity-50 cursor-pointer"
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
