import { useMemo } from "react";
import { getUserData } from "./localStorage";

export const useApprovalStatus = () => {
  const user = getUserData();

  return useMemo(() => {
  if (!user || user.role === "admin") {
  return {
  isApproved: true,
  isPending: false,
  isRejected: false,
  status: "approved",
  };
  }

  const status = user.status || "pending";
  return {
  isApproved: status === "approved",
  isPending: status === "pending",
  isRejected: status === "rejected",
  status,
  };
  }, [user]);
};




