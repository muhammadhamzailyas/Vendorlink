import React, { useState } from "react";
import { Link } from "react-router-dom";
import toastUtil from "../../lib/toast";
import { Button, Input } from "../../components/ui";
import AuthLayout from "../../components/auth/AuthLayout";
import { sendPasswordReset } from "../../lib/firebase";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toastUtil.validationError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccess(true);
      toastUtil.success("Password reset link sent");
    } catch (error) {
      console.error("Forgot password error:", error);
      toastUtil.error("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={success ? "Check your inbox" : "Forgot Password?"}
      subtitle={
        success
          ? "We sent a reset link to your email address."
          : "Enter your email and we'll send you a reset link."
      }
      hideOAuth
      footerText="Remember your password?"
      footerLinkText="Sign In"
      footerLinkTo="/login"
    >
      {success ? (
        <Button asChild className="h-12 w-full rounded-xl text-base font-bold" aria-label="Back to login">
          <Link to="/login">Back to Login</Link>
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            placeholder="Enter your email"
            aria-label="Email input for password reset"
            className="h-12 rounded-xl border-0 bg-[var(--muted)] px-4"
          />

          <Button
            type="submit"
            disabled={loading || !email}
            loading={loading}
            className="h-12 w-full rounded-xl text-base font-bold"
            aria-label="Send password reset link"
          >
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;



