import React, { useEffect, useState } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { Skeleton, Loader } from "./ui";
import { auth } from "../lib/firebase";
import { getUserData } from "../lib/localStorage";

const ProtectedRoutes = ({ role, children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Small delay to allow Firebase Auth to stabilize
    const timeout = setTimeout(() => setIsInitializing(false), 200);
    return () => clearTimeout(timeout);
  }, []);

  if (isInitializing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // 1. Authentication Check
  if (!auth.currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Profile Sync Check
  const user = getUserData();
  
  if (!user || !user.id) {
    // If authenticated via Firebase but profile not in local storage yet, 
    // something went wrong or sync is pending.
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

  // 4. Approval Status Check
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
