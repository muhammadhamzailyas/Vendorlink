import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Envelope } from "@phosphor-icons/react";
import { Button, Input, Label } from "../../components/ui";
import toastUtil from "../../lib/toast";
import { authService } from "../../services/api";
import AuthLayout from "../../components/auth/AuthLayout";
import { setToken } from "../../lib/auth";
import { useUser } from "../../context/UserContext";

const EmailVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useUser();
  const email = location.state?.email || sessionStorage.getItem("vendorlink_verify_email") || "";
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
    if (location.state?.email) sessionStorage.setItem("vendorlink_verify_email", location.state.email);
  }, [email, navigate, location.state]);

  const handleInputChange = (index, value) => {
    const val = value.replace(/\D/g, "");
    if (!val && value !== "") return; // Only allow digits

    const newCode = [...code];
    // Handle paste
    if (val.length > 1) {
        const pastedCode = val.slice(0, 6).split("");
        for (let i = 0; i < pastedCode.length; i++) {
            if (index + i < 6) newCode[index + i] = pastedCode[i];
        }
        setCode(newCode);
        const lastIdx = Math.min(index + pastedCode.length, 5);
        inputRefs.current[lastIdx]?.focus();
        return;
    }

    newCode[index] = val;
    setCode(newCode);

    // Auto-focus next
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
        toastUtil.error("Please enter the full 6-digit code.");
        return;
    }

    setVerifying(true);
    try {
      const res = await authService.verifyEmail(email, fullCode);
      toastUtil.success("Email verified successfully!");
      
      // Log the user in automatically with the token returned from verification
      if (res.data.token && res.data.user) {
        setToken(res.data.token);
        setUser(res.data.user);
      }
      
      sessionStorage.removeItem("vendorlink_verify_email");
      // Navigate to signup with a specific state to indicate we should be on Step 2
      navigate("/signup", { replace: true, state: { fromVerification: true } });
    } catch (err) {
      console.error("Verification error:", err);
      toastUtil.handleApiError(err, { default: "Invalid or expired verification code." });
    } finally {
      setVerifying(false);
    }
  };

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
          await authService.resendVerificationCode(email);
          toastUtil.success("A new verification code has been sent to your email!");
          setTimer(60);
      } catch (error) {
          console.error("Resend error:", error);
          toastUtil.handleApiError(error, { default: "Failed to resend. Please try again later." });
      } finally {
          setLoading(false);
      }
  };

  const isCodeComplete = code.every(digit => digit !== "");

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={`We've sent a 6-digit code to ${email}`}
      hideGoogle
      footerText="Problems?"
      footerLinkText="Go back to signup"
      footerLinkTo="/signup"
    >
      <div className="space-y-8">
        <div className="flex justify-center">
            <div className="h-20 w-20 bg-muted text-foreground rounded-full flex items-center justify-center border border-border/50">
                <Envelope size={40} weight="duotone" />
            </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-8">
            <div className="space-y-4">
                <Label htmlFor="code-0" className="text-center block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Verification Code
                </Label>
                <div className="flex justify-between gap-2 sm:gap-3">
                    {code.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={(el) => (inputRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleInputChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-muted/50 border-2 border-transparent focus:border-foreground focus:bg-background rounded-xl transition-all outline-none"
                            autoFocus={idx === 0}
                            required
                        />
                    ))}
                </div>
            </div>

            <Button
                type="submit"
                loading={verifying}
                disabled={!isCodeComplete || verifying}
                className="w-full h-12 rounded-xl font-bold shadow-soft text-base"
            >
                Verify Account
            </Button>
        </form>

        <div className="flex flex-col items-center gap-4 pt-4 border-t border-border/40">
            <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground font-medium">Didn't receive it?</p>
                <button
                  onClick={handleResendEmail}
                  disabled={loading || timer > 0 || !email}
                  className="text-sm font-bold text-foreground hover:opacity-80 disabled:opacity-50 cursor-pointer transition-opacity"
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
