import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye as Visibility,
  EyeSlash as VisibilityOff,
} from "@phosphor-icons/react";
import toastUtil from "../../lib/toast";
import { authService } from "../../services/api";
import { useUser } from "../../context/UserContext";
import AuthLayout from "../../components/auth/AuthLayout";
import PasswordInputField from "../../components/auth/PasswordInputField";
import { Button, Input } from "../../components/ui";
import { setToken, loginWithGoogle } from "../../lib/auth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  // Redirect if already logged in and profile is fetched
  useEffect(() => {
    if (user && user.id && user.role && user.role !== "unassigned") {
      const roleRoutes = {
        admin: "/admin",
        company: "/company",
        vendor: "/vendor",
      };
      navigate(roleRoutes[user.role] || "/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email?.trim() || !formData.password?.trim()) {
      toastUtil.validationError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(formData.email, formData.password);
      const { token, user: backendUser } = res.data;

      if (!backendUser) {
        throw new Error("Failed to load user profile");
      }

      setToken(token);
      setUser(backendUser);
      
      toastUtil.success("Login successful");

      if (backendUser.role === "unassigned") {
        toastUtil.error("Your account setup is incomplete. Redirecting to onboarding...");
        navigate("/signup", { replace: true });
        return; 
      }

      const roleRoutes = { admin: "/admin", company: "/company", vendor: "/vendor" };
      navigate(roleRoutes[backendUser.role] || "/", { replace: true });

    } catch (err) {
      console.error("Login Error:", err);
      toastUtil.handleApiError(err, {
        unauthorized: "Invalid email or password",
        default: "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOAuthLogin = (provider) => {
    if (provider !== "google") return;
    loginWithGoogle();
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue your journey"
      onGoogleLogin={() => handleOAuthLogin("google")}
      googleDisabled={loading}
      footerText="Don't have an account?"
      footerLinkText="Create Account"
      footerLinkTo="/signup"
      extraFooterLink={{ to: "/", text: "Learn more" }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          autoComplete="email"
        />

        <PasswordInputField 
          placeholder="Password"
          name="password"
          value={formData.password}
          autoComplete="current-password"
          onChange={(val) => setFormData({ ...formData, password: val })}
          showPassword={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          disabled={loading}
        />

        <div className="flex justify-end pt-2">
          <Link
            to="/forgot-password"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={loading || !formData.email || !formData.password}
          loading={loading}
          size="lg"
          className="w-full shadow-soft font-semibold"
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
