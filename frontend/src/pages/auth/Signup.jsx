import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation, useBlocker } from "react-router-dom";
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
import { Dialog, Button } from "../../components/ui";
import { useUser } from "../../context/UserContext";

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
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [stepVisible, setStepVisible] = useState(false);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Robust Navigation Guard for SPA
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isFormDirty && 
      step < TOTAL_STEPS && 
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowLeaveDialog(true);
    }
  }, [blocker.state]);

  const confirmLeave = useCallback(() => {
    setIsFormDirty(false);
    setShowLeaveDialog(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
    } else if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  }, [blocker, navigate, pendingNavigation]);

  const cancelLeave = useCallback(() => {
    setShowLeaveDialog(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    setPendingNavigation(null);
  }, [blocker]);

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
      stripePaymentId: null,
    }
  });

  const handleLinkClick = useCallback((e, to) => {
    if (isFormDirty && step < TOTAL_STEPS) {
      e.preventDefault();
      setPendingNavigation(to);
      setShowLeaveDialog(true);
    }
  }, [isFormDirty, step]);

  // Handle BeforeUnload (Tab close/Refresh)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty && step < TOTAL_STEPS) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave?"; 
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormDirty, step]);

  // Handle immediate verification redirect
  useEffect(() => {
    const stateResume = location.state?.resumeStep;
    const stateVerified = location.state?.isVerified;

    if (stateResume === 2 && stateVerified) {
        setStep(2);
        setFormData(prev => ({ ...prev, step1: { ...prev.step1, emailVerified: true } }));
    }
  }, [location.state]);

  const step1Errors = useMemo(() => {
    const errs = {};
    const { step1 } = formData;
    if (step1.fullName && step1.fullName.trim().length < 3) errs.fullName = "Name is too short (min 3 characters)";
    if (step1.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email)) errs.email = "Invalid email format";
    if (step1.phone) {
        const raw = step1.phone.replace(/\D/g, "");
        if (raw.length < 8) errs.phone = "Invalid phone format";
    }
    if (step1.authProvider === "local" && step1.password) {
        if (step1.password.length < 8) errs.password = "Min 8 characters required";
        else if (!/[A-Z]/.test(step1.password) || !/[a-z]/.test(step1.password) || !/[0-9]/.test(step1.password)) errs.password = "Complexity required";
    }
    if (step1.authProvider === "local" && step1.confirmPassword && step1.password !== step1.confirmPassword) errs.confirmPassword = "Passwords mismatch";
    return errs;
  }, [formData.step1]);

  const step2Errors = useMemo(() => {
    const errs = {};
    const { step2, step1 } = formData;
    
    if (step1.role === "company") {
        if (!step2.companyName || step2.companyName.trim().length < 3) errs.companyName = "Company name too short";
        if (!step2.businessType) errs.businessType = "Business type is required";
        if (!step2.industry) errs.industry = "Industry is required";
        if (!step2.registrationNumber || step2.registrationNumber.length < 5) errs.registrationNumber = "Valid registration number required";
        if (!step2.description || step2.description.trim().length < 20) errs.description = "Description too short (min 20 chars)";
        if (!step2.yearEstablished) errs.yearEstablished = "Year is required";
        if (!step2.companySize) errs.companySize = "Company size is required";
    } else {
        if (!step2.cnicNumber || step2.cnicNumber.replace(/\D/g, "").length < 13) errs.cnicNumber = "Full 13-digit CNIC required";
        if (!step2.category) errs.category = "Category is required";
        if (!step2.yearsOfExperience) errs.yearsOfExperience = "Experience is required";
        if (!step2.bio || step2.bio.trim().length < 20) errs.bio = "Bio must be at least 20 characters";
        if (step2.vendorType === "Registered Business" && (!step2.businessName || step2.businessName.trim().length < 3)) {
            errs.businessName = "Business name too short";
        }
    }

    if (!step2.streetAddress || step2.streetAddress.trim().length < 5) errs.streetAddress = "Full street address required";
    if (!step2.country) errs.country = "Country is required";
    if (!step2.province) errs.province = "Province/State is required";
    if (!step2.city) errs.city = "City is required";
    if (!step2.zipCode || step2.zipCode.length < 4) errs.zipCode = "Valid Zip code required";

    return errs;
  }, [formData.step2, formData.step1.role]);

  const nextStep = () => {
    if (step === 1 && Object.keys(step1Errors).length > 0) return;
    if (step === 2 && Object.keys(step2Errors).length > 0) return;
    setStep(Math.min(TOTAL_STEPS, step + 1));
  };

  const prevStep = () => setStep((prev) => Math.max(1, prev - 1));

  const handleStep1Submit = async () => {
    const { step1 } = formData;
    if (Object.keys(step1Errors).length > 0) return;
    
    // 1. Mandatory field validation
    if (!step1.fullName || !step1.email || !step1.phone || !step1.agreeToTerms) {
      toastUtil.validationError("Required fields missing");
      return;
    }

    // 2. Local-only password validation
    if (step1.authProvider !== "google") {
        if (!step1.password || step1.password.length < 8) {
            toastUtil.validationError("Password too short");
            return;
        }
        if (step1.password !== step1.confirmPassword) {
            toastUtil.validationError("Passwords mismatch");
            return;
        }
    }
    
    setLoading(true);
    try {
      const { createFirebaseUser, signInFirebase, auth } = await import("../../lib/firebase");
      let fUser = auth.currentUser;
      
      // 3. Only create/sign-in if not already authenticated via Google
      if (!fUser || fUser.email !== step1.email) {
          try { 
            fUser = await createFirebaseUser(step1.email, step1.password); 
          } catch (e) {
            if (e.code === "auth/email-already-in-use") {
              fUser = await signInFirebase(step1.email, step1.password);
            } else throw e;
          }
      }

      if (!fUser) throw new Error("Authentication failed");
      
      // 4. Verification Check
      await fUser.reload();
      const isVerified = fUser.emailVerified;

      if (!isVerified) {
        const { sendEmailVerification } = await import("firebase/auth");
        await sendEmailVerification(fUser);
        toastUtil.info("Please verify your email address to continue.");
        navigate("/verify-email", { state: { email: fUser.email } });
        return;
      }

      toastUtil.success("Email verified!");
      setFormData(prev => ({ ...prev, step1: { ...prev.step1, emailVerified: true } }));
      nextStep();
    } catch (error) {
      console.error("Step 1 Submit Error:", error);
      toastUtil.error(error.message || "Signup failed.");
    } finally { setLoading(false); }
  };

  const handleStep1Change = (fields) => {
    setIsFormDirty(true);
    setFormData(prev => {
        const newData = { ...prev, step1: { ...prev.step1, ...fields } };
        if (fields.email !== undefined && fields.email !== prev.step1.email) newData.step1.emailVerified = false;
        return newData;
    });
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const { auth } = await import("../../lib/firebase");
      const fUser = auth.currentUser;
      if (!fUser) throw new Error("Authentication session expired. Please restart signup.");

      const idToken = await fUser.getIdToken();
      
      // Perform one-time backend sync and registration
      const payload = new FormData();
      payload.append("idToken", idToken);
      payload.append("account", JSON.stringify(formData.step1));
      payload.append("details", JSON.stringify(formData.step2));
      payload.append("stripePaymentId", formData.step4.stripePaymentId || "");
      
      Object.keys(formData.step3).forEach(k => { 
        if (formData.step3[k] instanceof File) payload.append(k, formData.step3[k]); 
      });

      await onboardingService.submitFinal(payload);
      
      toastUtil.success("Registration complete! Pending admin review.");
      setIsFormDirty(false);
      navigate("/login");
    } catch (e) { 
      toastUtil.error(e.response?.data?.message || "Registration failed."); 
    } finally { setLoading(false); }
  };

  const handleGoogleSignup = async () => {
    if (!isFirebaseConfigured()) return;
    setGoogleLoading(true);
    try {
      const { signInWithGoogle } = await import("../../lib/firebase");
      const { user: gUser } = await signInWithGoogle();
      
      setFormData(prev => ({ 
        ...prev, 
        step1: { 
          ...prev.step1, 
          email: gUser.email || prev.step1.email, 
          fullName: gUser.displayName || prev.step1.fullName, 
          emailVerified: false, // ALWAYS force verification check on submit
          authProvider: "google" 
        } 
      }));
      
      toastUtil.info("Account linked. Please complete your profile and verify your email.");
    } catch (e) { 
        console.error("Google Signup Error:", e);
        toastUtil.error("Google login failed"); 
    } finally { setGoogleLoading(false); }
  };

  useEffect(() => {
    setStepVisible(false);
    const id = requestAnimationFrame(() => setStepVisible(true));
    return () => cancelAnimationFrame(id);
  }, [step]);

  const renderStep = () => {
    const { step1, step2, step3, step4 } = formData;
    const isS1Disabled = loading || Object.keys(step1Errors).length > 0 || !step1.fullName || !step1.email || !step1.phone || (step1.authProvider === "local" && (!step1.password || !step1.confirmPassword)) || !step1.agreeToTerms;
    const isS2Disabled = loading || Object.keys(step2Errors).length > 0;
    const isS3Disabled = loading || (step1.role === "company" ? (!step3.registrationCertificate || !step3.ntnCertificate) : (!step3.cnicFront || !step3.cnicBack));

    switch (step) {
      case 1: return <SignupStep1 data={step1} onChange={handleStep1Change} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} showConfirmPassword={showConfirmPassword} onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)} onSubmit={handleStep1Submit} loading={loading} />;
      case 2: return <SignupStep2 data={step2} errors={step2Errors} onChange={(f) => { setIsFormDirty(true); setFormData(p => ({ ...p, step2: { ...p.step2, ...f } })); }} isCompany={step1.role === "company"} onSubmit={nextStep} onBack={prevStep} loading={loading} isSubmitDisabled={isS2Disabled} />;
      case 3: return <SignupStep3 data={step3} onFileChange={(k, f) => { setIsFormDirty(true); setFormData(p => ({ ...p, step3: { ...p.step3, [k]: f } })); }} onRemoveFile={(k) => { setIsFormDirty(true); setFormData(p => ({ ...p, step3: { ...p.step3, [k]: null } })); }} isCompany={step1.role === "company"} onSubmit={nextStep} onBack={prevStep} loading={loading} isSubmitDisabled={isS3Disabled} />;
      case 4: return <SignupStep4 stripePaymentId={step4.stripePaymentId} onSubmit={(pid) => { if (pid) setFormData(p => ({ ...p, step4: { ...p.step4, stripePaymentId: pid } })); nextStep(); }} onBack={prevStep} loading={loading} />;
      case 5: return <SignupStep5 data={formData} onSubmit={handleFinalSubmit} onBack={prevStep} loading={loading} />;
      default: return null;
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Sign up in a few steps to begin your journey." onGoogleLogin={handleGoogleSignup} googleDisabled={loading || googleLoading} googleLoading={googleLoading} hideGoogle={step > 1} footerText="Already have an account?" footerLinkText="Login" footerLinkTo="/login" extraFooterLink={{ to: "/", text: "Learn more" }} onLinkClick={handleLinkClick} maxWidth="max-w-2xl" >
      <div className="mb-8"> <SignupProgressBar step={step} /> </div>
      <div className={cn("transition-all duration-300", stepVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}> {renderStep()} </div>
      
      <Dialog open={showLeaveDialog} persistent>
        <Dialog.Header>
          <Dialog.Title>Leave Signup?</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to leave? Your signup is not complete.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer className="gap-4 sm:gap-4">
          <Button variant="secondary" onClick={cancelLeave} className="flex-1 font-normal">Stay</Button>
          <Button variant="primary" onClick={confirmLeave} className="flex-1 font-normal shadow-soft">Leave anyway</Button>
        </Dialog.Footer>
      </Dialog>
    </AuthLayout>
  );
};

export default Signup;
