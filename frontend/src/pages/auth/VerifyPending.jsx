import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowsClockwise, Phone, Envelope, CheckCircle } from "@phosphor-icons/react";
import { Button, InputOTP, Label } from "../../components/ui";
import toastUtil from "../../lib/toast";
import { auth, setupRecaptcha, signInWithPhoneNumber } from "../../lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import AuthLayout from "../../components/auth/AuthLayout";

// CHANGE THIS TO YOUR ACTUAL TEST NUMBER IF NEEDED
const TEST_PHONE_NUMBER = "+923193669430"; // Test number for Firebase SMS flow

const VerifyPending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Data from state or storage
  const email = location.state?.email || sessionStorage.getItem("vendorlink_verify_email") || "";
  const userPhone = location.state?.phone || sessionStorage.getItem("vendorlink_verify_phone") || "";
  
  // Final target number (Use test override if provided)
  const targetPhone = TEST_PHONE_NUMBER || userPhone;

  // States
  const [mode, setMode] = useState("email"); // 'email' or 'phone'
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);
  
  // Phone Specific
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
    if (location.state?.email) {
        sessionStorage.setItem("vendorlink_verify_email", location.state.email);
    }
    if (location.state?.phone) {
        sessionStorage.setItem("vendorlink_verify_phone", location.state.phone);
    }
  }, [email, navigate, location.state]);

  // Global Timer
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Initialize invisible reCAPTCHA
  useEffect(() => {
    if (!recaptchaRef.current) {
        recaptchaRef.current = setupRecaptcha("recaptcha-container");
    }
    return () => {
        if (recaptchaRef.current) {
            try { recaptchaRef.current.clear(); } catch (e) { void e; /* empty */ }
            recaptchaRef.current = null;
        }
    };
  }, []);

  const handleResendEmail = async () => {
      setResending(true);
      try {
          if (auth.currentUser) {
              await sendEmailVerification(auth.currentUser);
              toastUtil.success("Verification link resent!");
              setTimer(60);
          } else {
              toastUtil.error("Session expired. Please restart signup.");
          }
      } catch {
          toastUtil.error("Too many requests. Please wait.");
      } finally {
          setResending(false);
      }
  };

  const handlePhoneSend = useCallback(async () => {
    if (loading) return;
    
    // Use test number for the actual Firebase call to bypass real SMS delivery if set
    const phoneToUse = TEST_PHONE_NUMBER || targetPhone;

    if (!phoneToUse) {
        toastUtil.error("Phone number missing. Please restart signup.");
        return;
    }

    setLoading(true);
    try {
      console.log(`[Verify] Sending SMS (via Firebase) to: ${phoneToUse}`);
      
      const appVerifier = recaptchaRef.current;
      if (!appVerifier) throw new Error("reCAPTCHA not initialized");

      const result = await signInWithPhoneNumber(auth, phoneToUse, appVerifier);
      setConfirmationResult(result);
      toastUtil.success("Verification code sent!");
      setTimer(60);
    } catch (error) {
      console.error("SMS Error:", error);
      toastUtil.error("Failed to send verification code. Please check your number or try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, targetPhone]);

  const handlePhoneVerify = async () => {
    if (!confirmationResult || code.length !== 6) return;
    setLoading(true);
    try {
      await confirmationResult.confirm(code);
      toastUtil.success("Phone verified successfully!");
      sessionStorage.removeItem("vendorlink_verify_email");
      sessionStorage.removeItem("vendorlink_verify_phone");
      navigate("/signup", { state: { resumeStep: 2, isVerified: true } });
    } catch (error) {
      console.error("OTP Error:", error);
      toastUtil.error("Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Automated Flow logic
  useEffect(() => {
    let pollingInterval;
    
    if (mode === "email") {
        pollingInterval = setInterval(async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    await user.reload();
                    if (user.emailVerified) {
                        clearInterval(pollingInterval);
                        toastUtil.success("Email verified!");
                        setMode("phone");
                    }
                } catch (error) {
                    console.error("Auto-check failed:", error);
                }
            }
        }, 3000);
    } else if (mode === "phone") {
        // Automatically trigger SMS on entry
        setTimeout(handlePhoneSend, 800);
    }

    return () => {
        if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [mode, handlePhoneSend]);

  const getSubtitle = () => {
    if (mode === "email") {
        return `We've sent a verification link to ${email}`;
    }
    return `Enter the 6-digit code sent to ${targetPhone}`;
  };

  return (
    <AuthLayout
      title={mode === "email" ? "Check your email" : "Verify your phone"}
      subtitle={getSubtitle()}
      hideGoogle
      footerText="Problems?"
      footerLinkText="Go back to signup"
      footerLinkTo="/signup"
    >
      <div id="recaptcha-container"></div>

      <div className="space-y-8">
        <div className="flex justify-center">
            <div className="h-20 w-20 bg-[var(--muted)] text-[var(--foreground)] rounded-full flex items-center justify-center">
                {mode === "email" ? <Envelope size={40} className="opacity-80" /> : <Phone size={40} className="opacity-80" />}
            </div>
        </div>

        {mode === "email" ? (
            <div className="space-y-6">
                <div className="bg-[var(--muted)] border border-[var(--border)]/50 p-5 rounded-2xl flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--foreground)] font-medium leading-relaxed">
                        We are waiting for you to click the link in your email. This page will update automatically.
                    </p>
                </div>
                
                <p className="text-center text-[10px] text-[var(--muted-foreground)] uppercase tracking-[0.2em] font-bold animate-pulse">
                    Monitoring for verification...
                </p>
            </div>
        ) : (
            <div className="space-y-8">
                {!confirmationResult && loading ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <p className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-widest animate-pulse">Requesting SMS...</p>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handlePhoneVerify(); }} className="space-y-8">
                        <div className="space-y-4 flex flex-col items-center">
                            <Label htmlFor="code" className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-black">
                                SMS Verification Code
                            </Label>
                            <InputOTP
                                value={code}
                                onChange={setCode}
                                length={6}
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            disabled={code.length !== 6 || loading || !confirmationResult}
                            className="w-full h-14 rounded-2xl text-base font-normal shadow-soft active:scale-[0.98] transition-transform"
                        >
                            Finalize Verification
                        </Button>
                    </form>
                )}
            </div>
        )}

        <div className="flex flex-col items-center gap-4 pt-4 border-t border-[var(--border)]/40">
          {mode === "email" ? (
            <div className="flex items-center gap-2">
                <p className="text-sm text-[var(--muted-foreground)] font-medium">Didn't receive it?</p>
                <button
                onClick={handleResendEmail}
                disabled={resending || timer > 0 || loading}
                className="text-sm font-bold text-[var(--foreground)] hover:text-[var(--foreground)]-dark transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                {resending ? <ArrowsClockwise size={14} className="animate-spin" /> : null}
                {timer > 0 ? `Resend in ${timer}s` : "Resend Link"}
                </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
                <p className="text-sm text-[var(--muted-foreground)] font-medium">Problems with the code?</p>
                <button
                  onClick={() => { 
                    setConfirmationResult(null); 
                    setCode(""); 
                    setTimer(0);
                    handlePhoneSend(); 
                  }}
                  disabled={loading || timer > 0}
                  className="text-sm font-bold text-[var(--foreground)] hover:text-[var(--foreground)]-dark transition disabled:opacity-50 cursor-pointer"
                >
                  {timer > 0 ? `Resend available in ${timer}s` : "Resend SMS"}
                </button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyPending;
