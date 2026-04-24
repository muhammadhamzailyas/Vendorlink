import React, { useState, useEffect } from "react";
import { XCircle, ShieldWarning, WarningCircle } from "@phosphor-icons/react";
import { getUserData } from "@/lib/localStorage";
import toastUtil from "@/lib/toast";
import { Alert, AlertTitle, AlertDescription } from "./ui";

const ApprovalStatusBanner = () => {
  const [user, setUser] = useState(getUserData());

  useEffect(() => {
    const handleStatusUpdate = (event) => {
      setUser(event.detail);
    };

    const handleApproval = (event) => {
      toastUtil.success("Account approved");
      setUser(event.detail);
    };

    window.addEventListener("userStatusUpdated", handleStatusUpdate);
    window.addEventListener("userApproved", handleApproval);

    return () => {
      window.removeEventListener("userStatusUpdated", handleStatusUpdate);
      window.removeEventListener("userApproved", handleApproval);
    };
  }, []);

  if (!user || user.role === "admin") {
    return null;
  }

  if (user.status === "approved") {
    return null;
  }

  if (user.status === "rejected") {
    return (
      <Alert variant="destructive" className="mb-6">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Account Rejected</AlertTitle>
        <AlertDescription>
          Your account has been rejected. Please contact the administrator for assistance.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning" className="mb-6">
      <ShieldWarning className="h-4 w-4" />
      <AlertTitle>Account Review In Progress</AlertTitle>
      <AlertDescription>
        You are logged in successfully. Your account is still under admin review, so some actions are temporarily disabled.
        You will get full access automatically once approved.
      </AlertDescription>
    </Alert>
  );
};

export default ApprovalStatusBanner;



