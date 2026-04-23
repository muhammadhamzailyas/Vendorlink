import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toastUtil from "../../lib/toast";
import { authService } from "../../services/api";
import { Button, Spinner } from "../../components/ui";
import AuthLayout from "../../components/auth/AuthLayout";
import { CheckCircle, XCircle, Info } from "@phosphor-icons/react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("We are verifying your email address. Please wait a moment.");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("invalid");
      setMessage("The verification link is missing a token. Please check your email again.");
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus("success");
        setMessage("Your email has been verified successfully. You can now complete your registration.");
        toastUtil.success("Email verified successfully.");
      } catch (error) {
        toastUtil.handleApiError(error, {
          default: "Unable to verify your email. Please try again.",
        });
        setStatus("error");
        setMessage("Verification failed. The link may have expired or already been used.");
      }
    };

    verify();
  }, [searchParams]);

  const getTitle = () => {
    if (status === "success") return "Email Verified";
    if (status === "error" || status === "invalid") return "Verification Failed";
    return "Verifying Email";
  };

  const getIcon = () => {
    if (status === "success") return <CheckCircle size={48} className="text-success" />;
    if (status === "error" || status === "invalid") return <XCircle size={48} className="text-danger" />;
    return <Spinner size={48} />;
  };

  return (
    <AuthLayout
      title={getTitle()}
      subtitle={message}
      hideGoogle
      footerText="Need help?"
      footerLinkText="Contact Support"
      footerLinkTo="/contact"
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--muted)]">
          {getIcon()}
        </div>

        {status === "success" && (
          <Button asChild className="w-full h-12 rounded-xl font-normal">
            <Link to="/signup" state={{ resumeStep: 2, isVerified: true }}>Continue Registration</Link>
          </Button>
        )}

        {(status === "error" || status === "invalid") && (
          <div className="flex flex-col gap-3 w-full">
            <Button asChild className="w-full h-12 rounded-xl font-normal">
              <Link to="/signup">Return to Signup</Link>
            </Button>
            <Button variant="secondary" asChild className="w-full h-12 rounded-xl font-normal">
              <Link to="/login">Go to Login</Link>
            </Button>
          </div>
        )}

        {status === "pending" && (
          <div className="py-2">
            <Spinner size={32} />
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
