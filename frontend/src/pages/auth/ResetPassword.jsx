import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toastUtil from "../../lib/toast";
import { Button, Input } from "../../components/ui";
import AuthLayout from "../../components/auth/AuthLayout";
import { authService } from "../../services/api";
import { Key, Eye, EyeSlash } from "@phosphor-icons/react";

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

    if (password.length < 8) {
      toastUtil.validationError("Password must be at least 8 characters");
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
          <div className="relative">
            <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                placeholder="New Password"
                className="pr-10"
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              placeholder="Confirm New Password"
          />

          <Button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              loading={loading}
              size="lg"
              className="w-full shadow-soft font-normal"
          >
              {loading ? "Resetting..." : "Reset Password"}
          </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
