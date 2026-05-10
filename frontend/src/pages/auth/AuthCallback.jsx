import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "../../lib/auth";
import { authService } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { Loader } from "../../components/ui";
import toastUtil from "../../lib/toast";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      toastUtil.error("Authentication failed: No token received");
      navigate("/login", { replace: true });
      return;
    }

    const finalizeLogin = async () => {
      try {
        setToken(token);
        const res = await authService.getMe();
        const user = res.data;

        setUser(user);
        toastUtil.success("Successfully logged in with Google");

        if (user.role === "unassigned") {
          navigate("/signup", { replace: true });
        } else {
          const roleRoutes = { admin: "/admin", company: "/company", vendor: "/vendor" };
          navigate(roleRoutes[user.role] || "/", { replace: true });
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        toastUtil.error("Failed to load user profile");
        navigate("/login", { replace: true });
      }
    };

    finalizeLogin();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader size={40} className="mx-auto mb-4 text-foreground" />
        <p className="text-muted-foreground uppercase tracking-widest text-xs">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
