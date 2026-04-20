import React, { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/api";
import toastUtil from "../../lib/toast";

const LinkedInCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const code = new URLSearchParams(location.search).get("code");
    if (code) {
      handleLinkedInLogin(code);
    } else {
      toastUtil.error("LinkedIn login failed: No code received");
      navigate("/login");
    }
  }, [location, navigate, handleLinkedInLogin]);

  const handleLinkedInLogin = useCallback(async (code) => {
    try {
      const res = await authService.linkedinLogin(code);
      const data = res.data;
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toastUtil.success("LinkedIn login successful");

      if (data.user.status === "incomplete") {
        navigate("/signup");
      } else {
        const roleRoutes = { admin: "/admin", company: "/company", vendor: "/vendor" };
        navigate(roleRoutes[data.user.role] || "/", { replace: true });
      }
    } catch (err) {
      toastUtil.handleApiError(err);
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--ring)] border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-[var(--muted-foreground)]">Verifying LinkedIn Account...</p>
      </div>
    </div>
  );
};

export default LinkedInCallback;
