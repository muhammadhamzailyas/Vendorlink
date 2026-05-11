import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { Loader } from "./ui";
import { getToken } from "../lib/auth";
import { useUser } from "../context/UserContext";

const ProtectedRoutes = ({ role, children }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <Loader />;
  }

  // 1. Authentication Check (JWT based)
  if (!getToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Profile Sync Check
  if (!user || !user.id) {
    // If token exists but user profile not loaded yet, wait or redirect if failed
    return <Navigate to="/login" replace />;
  }

  // 3. Role Check
  if (role && user.role !== role) {
    const roleHome = {
      admin: "/admin",
      company: "/company",
      vendor: "/vendor",
      unassigned: "/signup"
    };
    return <Navigate to={roleHome[user.role] || "/login"} replace />;
  }

  // 4. Onboarding Check
  if (user.role !== "admin" && !user.profileCompleted) {
    if (location.pathname !== "/signup") {
      return <Navigate to="/signup" replace />;
    }
  }

  // 5. Approval Status Check
  if (role && role !== "admin") {
    if (user.status !== "approved") {
      const allowedPaths = [`/${role}`, `/${role}/settings`, `/${role}/profile` ];
      const isAllowed = allowedPaths.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`));
      
      if (!isAllowed) {
        return <Navigate to={`/${role}`} replace />;
      }
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoutes;
