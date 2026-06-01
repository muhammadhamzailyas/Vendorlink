import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toastUtil from "../../lib/toast";
import { Button, Input } from "../../components/ui";
import AuthLayout from "../../components/auth/AuthLayout";
import { authService } from "../../services/api";
import { LockKey } from "@phosphor-icons/react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toastUtil.validationError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toastUtil.success("Password reset link sent! Check your inbox.");
      // Redirect to login after a short delay
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("Forgot password error:", error);
      toastUtil.handleApiError(error, {
        default: "Failed to send reset link. Please try again."
      });
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="No problem. Enter your email and we'll send you a reset link."
      hideGoogle
      headerIcon={(
        <div className="h-20 w-20 bg-muted text-foreground rounded-full flex items-center justify-center">
            <LockKey size={40} />
        </div>
      )}
      footerText="Remember your password?"
      footerLinkText="Sign In"
      footerLinkTo="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              placeholder="Enter your email"
              aria-label="Email input for password reset"
          />

          <Button
              type="submit"
              disabled={loading || !email}
              loading={loading}
              size="lg"
              className="w-full shadow-soft font-semibold"
              aria-label="Send password reset link"
          >
              {loading ? "Sending..." : "Send Reset Link"}
          </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
