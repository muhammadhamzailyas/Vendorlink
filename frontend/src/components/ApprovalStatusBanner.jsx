import React from "react";
import { XCircle, ShieldWarning } from "@phosphor-icons/react";
import { useUser } from "../context/UserContext";
import { Alert, AlertTitle, AlertDescription } from "./ui";

const ApprovalStatusBanner = () => {
  const { user } = useUser();

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



