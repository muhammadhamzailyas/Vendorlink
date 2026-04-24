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
import { Button, Input } from "../../components/ui";
import { signInWithGoogle, isFirebaseConfigured, signInFirebase } from "../../lib/firebase";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email?.trim() || !formData.password?.trim()) {
      toastUtil.validationError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const firebaseUser = await signInFirebase(formData.email, formData.password);
      const idToken = await firebaseUser.getIdToken(true);
      const response = await authService.firebaseLogin(idToken);
      const backendUser = response.data?.user || response.user;

      if (!backendUser) {
        throw new Error("Failed to sync user profile");
      }

      // We only store the user in context. Token is handled by Firebase SDK + API Interceptor.
      setUser(backendUser);
      
      toastUtil.success("Login successful");

      if (backendUser.role === "unassigned") {
        navigate("/signup", { replace: true });
        return;
      }

      // Check for selected plan from pricing section
      let selectedPlan = null;
      try {
        const storedPlan = localStorage.getItem("selectedPlan");
        if (storedPlan) {
          selectedPlan = JSON.parse(storedPlan);
          localStorage.removeItem("selectedPlan");
        }
      } catch {
        console.error("Error reading selected plan");
      }

      if (backendUser.role === "admin" || !selectedPlan || selectedPlan.isFree) {
        const roleRoutes = {
          admin: "/admin",
          company: "/company",
          vendor: "/vendor",
        };
        navigate(roleRoutes[backendUser.role] || "/", { replace: true });
      } else {
        navigate("/payment", { replace: true });
      }
    } catch (err) {
      console.error("Login Error:", err);
      toastUtil.handleApiError(err, {
        unauthorized: "Invalid username or password",
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

  const handleOAuthLogin = async (provider) => {
    if (provider !== "google") return;

    if (!isFirebaseConfigured()) {
      toastUtil.error("Firebase is not configured.");
      return;
    }

    setGoogleLoading(true);
    try {
      const { user } = await signInWithGoogle();
      const idToken = await user.getIdToken(true);
      const loginRes = await authService.firebaseLogin(idToken);
      const backendUser = loginRes.data?.user || loginRes.user;

      if (backendUser) {
        setUser(backendUser);
        if (backendUser.role === "unassigned") {
          navigate("/signup", { replace: true });
        } else {
          const roleRoutes = { admin: "/admin", company: "/company", vendor: "/vendor" };
          navigate(roleRoutes[backendUser.role] || "/", { replace: true });
        }
      }
    } catch (err) {
      console.error("Google login error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        toastUtil.handleApiError(err, {
          default: "Google login failed.",
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue your journey"
      onGoogleLogin={() => handleOAuthLogin("google")}
      googleDisabled={loading || googleLoading}
      googleLoading={googleLoading}
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
          disabled={loading || googleLoading}
          autoComplete="email"
        />

        <div className="relative">
          <Input
            className="pr-11"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading || googleLoading}
            autoComplete="current-password"
          />
          <Button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 p-0 text-muted-foreground hover:bg-transparent"
          >
            {showPassword ? <VisibilityOff size={20} /> : <Visibility size={20} />}
          </Button>
        </div>

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
          disabled={loading || googleLoading || !formData.email || !formData.password}
          loading={loading}
          size="lg"
          className="w-full shadow-soft font-normal"
        >
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;



