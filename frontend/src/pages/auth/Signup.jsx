import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toastUtil from "../../lib/toast";
import { authService, onboardingService } from "../../services/api";
import AuthLayout from "../../components/auth/AuthLayout";
import { cn } from "../../lib/cn";
import {
  signInWithGoogle,
  isFirebaseConfigured,
} from "../../lib/firebase";
import SignupStep1 from "../../components/auth/signup/SignupStep1";
import SignupStep2 from "../../components/auth/signup/SignupStep2";
import SignupStep3 from "../../components/auth/signup/SignupStep3";
import SignupStep4 from "../../components/auth/signup/SignupStep4";
import SignupStep5 from "../../components/auth/signup/SignupStep5";
import SignupProgressBar from "../../components/auth/signup/SignupProgressBar";

const TOTAL_STEPS = 5;

const INITIAL_STEP1 = {
  role: "company",
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  countryCode: "+92",
  isoCode: "PK",
  phone: "",
  agreeToTerms: false,
  authProvider: "local",
  emailVerified: false,
};

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [stepVisible, setStepVisible] = useState(false);

  const [formData, setFormData] = useState({
    step1: { ...INITIAL_STEP1 },
    step2: {
      companyName: "",
      businessType: "",
      industry: "",
      registrationNumber: "",
      ntn: "",
      yearEstablished: "",
      website: "",
      companySize: "",
      description: "",
      vendorType: "Individual",
      cnicNumber: "",
      businessName: "",
      category: "",
      skills: [],
      skillsInput: "",
      yearsOfExperience: "",
      portfolioURL: "",
      bio: "",
      city: "",
      province: "",
      country: "PK",
      countryName: "Pakistan",
      streetAddress: "",
      zipCode: "",
    },
    step3: {
      registrationCertificate: null,
      ntnCertificate: null,
      supportingDocument: null,
      cnicFront: null,
      cnicBack: null,
      businessLicense: null,
      portfolioSamples: null,
    },
    step4: {
      plan: "free",
    }
  });

  // Resume detection: ONLY if coming from verification page with explicit state
  useEffect(() => {
    const resumeOnboarding = async () => {
      const { auth } = await import("../../lib/firebase");
      const user = auth.currentUser;
      const stateResume = location.state?.resumeStep;
      const stateVerified = location.state?.isVerified;

      // Only auto-forward if returning from verification page
      if (stateResume && stateVerified && user) {
          setStep(stateResume);
          return;
      }
      
      // We removed "Priority 2" (automatic detection on mount).
      // This ensures that on refresh or close/open, the user starts at Step 1 with empty fields.
    };
    
    // Clear any residual draft data on mount
    localStorage.removeItem("vendorlink_signup_draft");
    sessionStorage.removeItem("vendorlink_signup_draft");

    resumeOnboarding();
  }, [location.state]);

  const nextStep = () => setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  const prevStep = () => setStep((prev) => Math.max(1, prev - 1));

  const handleStep1Back = () => {
    setFormData(prev => ({ ...prev, step1: { ...INITIAL_STEP1 } }));
    prevStep();
  };

  useEffect(() => {
    setStepVisible(false);
    const id = requestAnimationFrame(() => setStepVisible(true));
    return () => cancelAnimationFrame(id);
  }, [step]);

  const handleStep1Submit = async () => {
    const { step1 } = formData;
    const isGoogle = step1.authProvider === "google";

    if (!step1.fullName || !step1.email || !step1.phone || !step1.agreeToTerms) {
      toastUtil.validationError("Please complete all required fields");
      return;
    }

    if (!isGoogle) {
        if (!step1.password || step1.password.length < 8) {
            toastUtil.validationError("Password must be at least 8 characters");
            return;
        }
        if (step1.password !== step1.confirmPassword) {
            toastUtil.validationError("Passwords do not match");
            return;
        }
    }
    
    if (isGoogle) {
      nextStep();
      return;
    }

    setLoading(true);
    try {
      const { auth, createFirebaseUser, signInFirebase } = await import("../../lib/firebase");
      let firebaseUser = auth.currentUser;
      let isExistingUser = false;

      // 1. If not logged in, or logged in as a different person, try to create or sign in
      if (!firebaseUser || firebaseUser.email !== step1.email) {
        try {
          // Attempt A: Create new
          firebaseUser = await createFirebaseUser(step1.email, step1.password);
        } catch (error) {
          console.debug("[Signup] Create attempt failed:", error.code);
          
          if (error.code === "auth/email-already-in-use") {
            try {
              // Attempt B: Seamless login
              firebaseUser = await signInFirebase(step1.email, step1.password);
              isExistingUser = true;
            } catch (loginError) {
              console.error("[Signup] Seamless login failed error code:", loginError.code);
              
              if (loginError.code === "auth/wrong-password" || loginError.code === "auth/invalid-credential") {
                throw new Error("EMAIL_EXISTS_WRONG_PASSWORD");
              } else if (loginError.code === "auth/account-exists-with-different-credential") {
                throw new Error("EMAIL_EXISTS_DIFFERENT_METHOD");
              } else {
                throw loginError;
              }
            }
          } else {
            throw error;
          }
        }
      } else {
        // Already logged in as this email, just continue
        isExistingUser = true;
      }

      if (!firebaseUser) throw new Error("Authentication failed");

      const idToken = await firebaseUser.getIdToken(true);

      // Step 2: Provision/Sync Mongo profile record
      const loginRes = await authService.firebaseLogin(idToken);
      const backendUser = loginRes.data?.user || loginRes.user;

      // Merge backend data with what the user just typed in the form
      const syncedUser = {
        ...backendUser,
        fullName: step1.fullName,
        role: step1.role,
        phone: `${step1.countryCode}${step1.phone}`
      };

      localStorage.setItem("user", JSON.stringify(syncedUser));

      // Verification Enforcement: If email/password signup and not verified, redirect
      if (!firebaseUser.emailVerified) {
        toastUtil.info("Account created. Please verify your email to continue.");
        navigate("/verify-pending", { 
          state: { 
            email: firebaseUser.email, 
            phone: `${step1.countryCode}${step1.phone}` 
          } 
        });
        return;
      }

      if (isExistingUser) {
        toastUtil.success("Welcome back! Resuming your application.");
        if (backendUser?.role && backendUser.role !== "unassigned") {
            navigate("/login");
            return;
        }
      } else {
        toastUtil.success("Account created! Continue onboarding.");
      }

      setFormData(prev => ({
        ...prev,
        step1: { ...prev.step1, emailVerified: true },
      }));
      
      nextStep();
    } catch (error) {
      console.error("Step 1 Submission Error:", error);
      let msg = "Signup failed. Please try again.";
      
      if (error.message === "EMAIL_EXISTS_WRONG_PASSWORD") {
        msg = "This email is already registered. Please check your password or use Google if you signed up with that.";
      } else if (error.message === "EMAIL_EXISTS_DIFFERENT_METHOD") {
        msg = "This email was registered using a different method (like Google). Please click 'Continue with Google' above.";
      } else if (error.code === "auth/invalid-email") {
        msg = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        msg = "Password is too weak (min 6 characters).";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Too many failed attempts. Please try again later or reset your password.";
      }
      
      toastUtil.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Change = (fields) => {
    setFormData(prev => {
        const newData = { ...prev, step1: { ...prev.step1, ...fields } };
        // Reset verification if email or phone changes
        if (fields.email !== undefined && fields.email !== prev.step1.email) {
            newData.step1.emailVerified = false;
        }
        if (fields.phone !== undefined && fields.phone !== prev.step1.phone) {
            newData.step1.emailVerified = false;
        }
        return newData;
    });
  };

  const handleStep2Submit = () => {
    const { step2, step1 } = formData;
    const isCompany = step1.role === "company";
    
    if (isCompany) {
      if (!step2.companyName || !step2.businessType || !step2.industry || !step2.city) {
        toastUtil.validationError("Please provide essential company details");
        return;
      }
    } else {
      if (!step2.cnicNumber || !step2.category || !step2.bio || !step2.city) {
        toastUtil.validationError("Please provide essential professional details");
        return;
      }
    }
    nextStep();
  };

  const handleStep3Submit = () => {
    const { step3, step1 } = formData;
    const isCompany = step1.role === "company";
    if (isCompany) {
      if (!step3.registrationCertificate || !step3.ntnCertificate) {
        toastUtil.validationError("Certificates are required");
        return;
      }
    } else {
      if (!step3.cnicFront || !step3.cnicBack) {
        toastUtil.validationError("CNIC Front and Back are required");
        return;
      }
    }
    nextStep();
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const { auth } = await import("../../lib/firebase");
      const user = auth.currentUser;
      
      if (!user) {
          toastUtil.error("Authentication session lost. Please restart.");
          return;
      }

      // Step 1: Prepare Multipart Data
      const formDataPayload = new FormData();
      
      // Append files from step3
      Object.keys(formData.step3).forEach((key) => {
          const file = formData.step3[key];
          if (file) {
              formDataPayload.append(key, file);
          }
      });

      // Append metadata as stringified JSON (Multer will parse this in req.body)
      formDataPayload.append("account", JSON.stringify(formData.step1));
      formDataPayload.append("details", JSON.stringify(formData.step2));
      formDataPayload.append("plan", formData.step4.plan);
      
      if (formData.step4.stripePaymentId) {
        formDataPayload.append("stripePaymentId", formData.step4.stripePaymentId);
      }

      // Step 2: Send to Backend
      await onboardingService.submitFinal(formDataPayload);
      
      toastUtil.success("Registration complete! Your application is under review.");
      
      // Update local storage with partial info for session sync
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentUser,
          role: formData.step1.role,
          status: "pending",
          profileCompleted: true,
        })
      );
      
      navigate("/login");
    } catch (error) {
      console.error("Submission error:", error);
      toastUtil.handleApiError(error, { defaultMessage: "Submission failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!isFirebaseConfigured()) {
      toastUtil.error("Firebase is not configured.");
      return;
    }

    setGoogleLoading(true);

    const focusHandler = () => {
      setTimeout(() => {
        setGoogleLoading(false);
        window.removeEventListener("focus", focusHandler);
      }, 300);
    };
    window.addEventListener("focus", focusHandler);

    try {
      const { user } = await signInWithGoogle();
      const idToken = await user.getIdToken(true);
      const loginRes = await authService.firebaseLogin(idToken);
      const existingUser = loginRes.data?.user;
      localStorage.setItem("user", JSON.stringify(existingUser || {}));
      window.removeEventListener("focus", focusHandler);

      if (existingUser?.role && existingUser.role !== "unassigned") {
        navigate("/login");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        step1: {
          ...prev.step1,
          email: user.email || prev.step1.email,
          fullName: user.displayName || prev.step1.fullName,
          emailVerified: true,
          authProvider: "google",
        },
      }));
      toastUtil.info("Account connected. Please select your role to continue.");
    } catch (error) {
      window.removeEventListener("focus", focusHandler);
      console.error("Google signup error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
          toastUtil.handleApiError(error, {
            default: "Google signup failed. Please try again.",
          });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <SignupStep1
            data={formData.step1}
            onChange={handleStep1Change}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            showConfirmPassword={showConfirmPassword}
            onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
            onSubmit={handleStep1Submit}
            loading={loading}
          />
        );
      case 2:
        return (
          <SignupStep2
            data={formData.step2}
            onChange={(fields) => setFormData(prev => ({ ...prev, step2: { ...prev.step2, ...fields } }))}
            isCompany={formData.step1.role === "company"}
            onSubmit={handleStep2Submit}
            onBack={handleStep1Back}
            loading={loading}
          />
        );
      case 3:
        return (
          <SignupStep3
            data={formData.step3}
            onFileChange={(field, file) => setFormData(prev => ({ ...prev, step3: { ...prev.step3, [field]: file } }))}
            onRemoveFile={(field) => setFormData(prev => ({ ...prev, step3: { ...prev.step3, [field]: null } }))}
            isCompany={formData.step1.role === "company"}
            onSubmit={handleStep3Submit}
            onBack={prevStep}
            loading={loading}
          />
        );
      case 4:
        return (
          <SignupStep4
            plan={formData.step4.plan}
            onPlanChange={(plan) => setFormData(prev => ({ ...prev, step4: { ...prev.step4, plan } }))}
            onSubmit={(paymentId) => {
                if (paymentId) {
                    setFormData(prev => ({ ...prev, step4: { ...prev.step4, stripePaymentId: paymentId } }));
                }
                nextStep();
            }}
            onBack={prevStep}
            loading={loading}
          />
        );
      case 5:
        return (
          <SignupStep5
            data={formData}
            onSubmit={handleFinalSubmit}
            onBack={prevStep}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle={`Complete your registration in ${TOTAL_STEPS} simple steps`}
      onGoogleLogin={handleGoogleSignup}
      googleDisabled={loading || googleLoading}
      googleLoading={googleLoading}
      footerText="Already have an account?"
      footerLinkText="Login"
      footerLinkTo="/login"
      extraFooterLink={{ to: "/", text: "Learn more" }}
      maxWidth="max-w-2xl"
    >
      <div className="mb-8">
        <SignupProgressBar step={step} />
      </div>
      <div key={step} className={cn("transition-all duration-300 ease-out", stepVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}>
        {renderStep()}
      </div>
    </AuthLayout>
  );
};

export default Signup;
