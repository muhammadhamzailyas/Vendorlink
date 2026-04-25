import React from "react";
import { XCircle, ShieldWarning } from "@phosphor-icons/react";
import { useUser } from "../context/UserContext";
import { Alert, AlertTitle, AlertDescription } from "./ui";

const ApprovalStatusBanner = () => {
  const { user } = useUser();

  if (!user || user.role === "admin") {
    return null;
  }

  if (user.status === "approved" && user.profileCompleted) {
    return null;
  }

  if (user.status === "approved" && !user.profileCompleted) {
    return (
      <Alert variant="warning" className="mb-6">
        <ShieldWarning className="h-4 w-4" />
        <AlertTitle>Incomplete Profile</AlertTitle>
        <AlertDescription>
          Some required information or documents are missing from your profile. Please visit your <a href={`/${user.role}/profile`} className="font-bold underline">Profile</a> or <a href={`/${user.role}/settings`} className="font-bold underline">Settings</a> to complete your setup.
        </AlertDescription>
      </Alert>
    );
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



