import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowsClockwise, Phone, Envelope, CheckCircle } from "@phosphor-icons/react";
import { Button, InputOTP, Label } from "../../components/ui";
import toastUtil from "../../lib/toast";
import { auth, setupRecaptcha, signInWithPhoneNumber } from "../../lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import AuthLayout from "../../components/auth/AuthLayout";

// Test numbers for Firebase SMS flow (Add yours here)
const TEST_PHONE_NUMBERS = [+923111111111]; 

const VerifyPending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || sessionStorage.getItem("vendorlink_verify_email") || "";
  const userPhone = location.state?.phone || sessionStorage.getItem("vendorlink_verify_phone") || "";
  
  const [mode, setMode] = useState("email"); 
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  
  const [confirmationResults, setConfirmationResults] = useState([]);
  const recaptchaRef = useRef(null);
  const hasTriggeredRef = useRef(false);
  const isSendingRef = useRef(false);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
    if (location.state?.email) sessionStorage.setItem("vendorlink_verify_email", location.state.email);
    if (location.state?.phone) sessionStorage.setItem("vendorlink_verify_phone", location.state.phone);
  }, [email, navigate, location.state]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Initialize reCAPTCHA - ensure container is "visible" to reCAPTCHA logic
  useEffect(() => {
    if (!recaptchaRef.current) {
        let container = document.getElementById("recaptcha-global-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "recaptcha-global-container";
            // Use opacity/positioning instead of display:none
            container.style.position = "fixed";
            container.style.bottom = "0";
            container.style.right = "0";
            container.style.opacity = "0";
            container.style.pointerEvents = "none";
            container.style.zIndex = "-1";
            document.body.appendChild(container);
        }
        recaptchaRef.current = setupRecaptcha("recaptcha-global-container");
    }
  }, []);

  const handlePhoneSend = useCallback(async (isManual = false) => {
    if (isSendingRef.current || !userPhone) {
      if (!userPhone && isManual) toastUtil.error("Phone number is missing.");
      return;
    }
    
    isSendingRef.current = true;
    setLoading(true);
    
    try {
      const appVerifier = recaptchaRef.current;
      if (!appVerifier) throw new Error("reCAPTCHA not initialized. Please refresh.");

      console.log(`[Verify] Sending SMS to: ${userPhone}`);
      const result = await signInWithPhoneNumber(auth, userPhone, appVerifier);
      
      setConfirmationResults([result]);
      
      if (isManual) {
          setResendCount(prev => {
              const next = prev + 1;
              if (next > 1) setTimer(60);
              return next;
          });
      }
      
      // Special toast for test numbers as requested
      if (TEST_PHONE_NUMBERS.includes(userPhone)) {
        toastUtil.success("Write the code");
      } else {
        toastUtil.success(`Verification code sent!`);
      }
    } catch (error) {
      console.error("SMS Error:", error);
      toastUtil.error(error.message || "Failed to send code.");
    } finally {
      setLoading(false);
      isSendingRef.current = false;
    }
  }, [userPhone]); // Stable callback to avoid loop

  const handlePhoneVerify = async () => {
    if (confirmationResults.length === 0 || code.length !== 6 || loading) return;
    setLoading(true);
    
    try {
        await confirmationResults[0].confirm(code);
        toastUtil.success("Phone verified successfully!");
        sessionStorage.removeItem("vendorlink_verify_email");
        sessionStorage.removeItem("vendorlink_verify_phone");
        navigate("/signup", { state: { resumeStep: 2, isVerified: true } });
    } catch (error) {
        console.warn("OTP verification failed:", error);
        toastUtil.error("Invalid verification code.");
    } finally {
        setLoading(false);
    }
  };

  // Automated transitions
  useEffect(() => {
    if (mode === "email") {
        const interval = setInterval(async () => {
            const user = auth.currentUser;
            if (user) {
                await user.reload();
                if (user.emailVerified) {
                    clearInterval(interval);
                    toastUtil.success("Email verified!");
                    setMode("phone");
                }
            }
        }, 3000);
        return () => clearInterval(interval);
    } 
    
    if (mode === "phone" && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        const trigger = setTimeout(() => handlePhoneSend(false), 2000);
        return () => clearTimeout(trigger);
    }
  }, [mode, handlePhoneSend]);

  const handleResendEmail = async () => {
      setResending(true);
      try {
          if (auth.currentUser) {
              await sendEmailVerification(auth.currentUser);
              toastUtil.success("Verification link resent!");
              setTimer(60);
          }
      } catch {
          toastUtil.error("Too many requests.");
      } finally {
          setResending(false);
      }
  };

  return (
    <AuthLayout
      title={mode === "email" ? "Check your email" : "Verify your phone"}
      subtitle={mode === "email" ? `Verify ${email}` : `Code sent to your phone`}
      hideGoogle
      footerText="Problems?"
      footerLinkText="Go back to signup"
      footerLinkTo="/signup"
    >
      <div className="space-y-8">
        <div className="flex justify-center">
            <div className="h-20 w-20 bg-[var(--muted)] text-[var(--foreground)] rounded-full flex items-center justify-center">
                {mode === "email" ? <Envelope size={40} /> : <Phone size={40} />}
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
            </div>
        ) : (
            <div className="space-y-8">
                {confirmationResults.length === 0 && loading ? (
                    <div className="flex flex-col items-center gap-4 py-4 text-center">
                        <p className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-widest animate-pulse">
                            Sending verification code...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handlePhoneVerify(); }} className="space-y-8">
                        <div className="space-y-4 flex flex-col items-center">
                            <Label className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-black">
                                SMS Verification Code
                            </Label>
                            <InputOTP value={code} onChange={setCode} length={6} disabled={loading} />
                        </div>
                        <Button type="submit" variant="primary" loading={loading} disabled={code.length !== 6 || loading || confirmationResults.length === 0} className="w-full h-14 rounded-2xl">
                            Finalize Verification
                        </Button>
                    </form>
                )}
            </div>
        )}

        <div className="flex flex-col items-center gap-4 pt-4 border-t border-[var(--border)]/40">
            <div className="flex items-center gap-2">
                <p className="text-sm text-[var(--muted-foreground)] font-medium">Didn't receive it?</p>
                <button
                  onClick={() => mode === "email" ? handleResendEmail() : handlePhoneSend(true)}
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

export default VerifyPending;
