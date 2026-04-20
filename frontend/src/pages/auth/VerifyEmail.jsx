import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toastUtil from "../../lib/toast";
import { authService } from "../../services/api";
import { Button } from "../../components/ui";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("invalid");
      setMessage("Missing verification token.");
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus("success");
        setMessage("Your email has been verified successfully. You can now log in.");
        toastUtil.success("Email verified successfully.");
      } catch (error) {
        toastUtil.handleApiError(error, {
          default: "Unable to verify your email. Please try again.",
        });
        setStatus("error");
        setMessage("Verification failed. Please request a new verification email.");
      }
    };

    verify();
  }, [searchParams]);

  const renderButtons = () => {
    if (status === "success") {
      return (
        <Button asChild>
          <Link to="/signup" state={{ resumeStep: 2, isVerified: true }}>Continue Registration</Link>
        </Button>
      );
    }

    if (status === "error" || status === "invalid") {
      return (
        <div className="flex flex-col gap-3 mt-6">
          <Button asChild>
            <Link to="/signup">Return to signup</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-xl w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10 shadow-sm text-center">
        <h1 className="text-3xl font-bold mb-4">Email Verification</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
        {renderButtons()}
      </div>
    </div>
  );
};

export default VerifyEmail;
