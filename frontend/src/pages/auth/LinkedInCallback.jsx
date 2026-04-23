import React, { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/api";
import toastUtil from "../../lib/toast";

import { Loader } from "../../components/ui";

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
  }, [location, navigate]);

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

  return <Loader />;
};

export default LinkedInCallback;
