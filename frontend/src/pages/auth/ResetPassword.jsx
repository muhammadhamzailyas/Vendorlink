import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toastUtil from "../../lib/toast";
import { Button, Input } from "../../components/ui";
import AuthLayout from "../../components/auth/AuthLayout";
import PasswordInputField from "../../components/auth/PasswordInputField";
import { authService } from "../../services/api";
import { Key } from "@phosphor-icons/react";

import { validatePassword } from "@/lib/utils";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toastUtil.error("Invalid or missing reset token");
      return;
    }

    const passResult = validatePassword(password);
    if (passResult !== true) {
      toastUtil.validationError(passResult);
      return;
    }

    if (password !== confirmPassword) {
      toastUtil.validationError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      toastUtil.success("Password reset successful! You can now log in.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Reset password error:", error);
      toastUtil.handleApiError(error, {
        default: "Failed to reset password. The link may be expired."
      });
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your new password below to regain access to your account."
      hideGoogle
      headerIcon={(
        <div className="h-20 w-20 bg-muted text-foreground rounded-full flex items-center justify-center">
            <Key size={40} />
        </div>
      )}
      footerText="Back to"
      footerLinkText="Login"
      footerLinkTo="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <PasswordInputField 
            placeholder="New Password"
            value={password}
            autoComplete="new-password"
            onChange={(val) => setPassword(val)}
            showPassword={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            disabled={loading}
          />

          <PasswordInputField 
            placeholder="Confirm New Password"
            value={confirmPassword}
            autoComplete="new-password"
            onChange={(val) => setConfirmPassword(val)}
            showPassword={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            disabled={loading}
          />

          <Button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              loading={loading}
              size="lg"
              className="w-full shadow-soft font-semibold"
          >
              {loading ? "Resetting..." : "Reset Password"}
          </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
