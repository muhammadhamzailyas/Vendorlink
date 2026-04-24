import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { Dialog, Button } from "../../components/ui";

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

  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [pendingDraftStep, setPendingDraftStep] = useState(1);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

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

  const handleResume = useCallback(() => {
    if (pendingDraft) {
        setFormData(prev => ({
            ...prev,
            ...pendingDraft,
            step1: { ...prev.step1, ...pendingDraft.step1, password: "", confirmPassword: "" }
        }));
        setStep(pendingDraftStep || 2);
    }
    setShowResumeDialog(false);
    setIsFormDirty(true);
  }, [pendingDraft, pendingDraftStep]);

  const handleStartOver = useCallback(async () => {
    try {
        await onboardingService.resetProgress();
    } catch (e) {
        console.warn("Failed to reset backend progress");
    }
    localStorage.removeItem("vendorlink_signup_draft");
    setShowResumeDialog(false);
    setPendingDraft(null);
    
    // Reset local state to initial
    setFormData({
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
    setStep(1);
    setIsFormDirty(false);
  }, []);

  const handleLinkClick = useCallback((e, to) => {
    if (isFormDirty && step < TOTAL_STEPS) {
      e.preventDefault();
      setPendingNavigation(to);
      setShowLeaveDialog(true);
    }
  }, [isFormDirty, step]);

  const confirmLeave = useCallback(() => {
    setShowLeaveDialog(false);
    setIsFormDirty(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  }, [navigate, pendingNavigation]);

  // Handle BeforeUnload (Tab close/Refresh - Browser Generic Prompt)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty && step < TOTAL_STEPS) {
        e.preventDefault();
        e.returnValue = ""; 
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormDirty, step]);

  // Resume Detection
  useEffect(() => {
    const loadDraft = async () => {
      const savedDraft = localStorage.getItem("vendorlink_signup_draft");
      const { auth } = await import("../../lib/firebase");
      // Wait for auth initialization
      await new Promise(r => setTimeout(r, 100));
      const user = auth.currentUser;
      const stateResume = location.state?.resumeStep;
      const stateVerified = location.state?.isVerified;

      let backendData = null;
      if (user) {
          try {
              const res = await onboardingService.getMyOnboarding();
              if (res.data?.user) backendData = res.data;
          } catch (e) { console.warn("Backend load failed"); }
      }

      if (backendData) {
          const { user: bUser, details: bDetails } = backendData;
          
          // Only show resume dialog if they are actually past step 1
          if (bUser.onboardingStep > 1) {
              const merged = {
                  step1: { ...INITIAL_STEP1, role: bUser.role || "company", fullName: bUser.fullName || "", email: bUser.email || "", phone: bUser.phone || "", emailVerified: bUser.emailVerified },
                  step2: { ...formData.step2, ...bDetails },
                  step3: { ...formData.step3, registrationCertificate: bDetails?.registrationCertificateURL || null, ntnCertificate: bDetails?.ntnCertificateURL || null, supportingDocument: bDetails?.supportingDocumentURL || null, cnicFront: bDetails?.cnicFrontURL || null, cnicBack: bDetails?.cnicBackURL || null, businessLicense: bDetails?.businessLicenseURL || null, portfolioSamples: bDetails?.portfolioSamplesURL || null },
                  step4: { plan: bUser.selectedPlan || "free" }
              };
              if (stateResume && stateVerified) {
                  setFormData(prev => ({ ...prev, ...merged }));
                  setStep(stateResume);
                  return;
              }
              setPendingDraft(merged);
              setPendingDraftStep(bUser.onboardingStep || 1);
              setShowResumeDialog(true);
              return;
          }
      }

      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Only show if local draft is past step 1
          if (parsed.lastStep > 1) {
              if (stateResume && stateVerified) {
                  setFormData(prev => ({ ...prev, ...parsed, step1: { ...prev.step1, ...parsed.step1, emailVerified: true, password: "", confirmPassword: "" } }));
                  setStep(stateResume);
                  return;
              }
              setPendingDraft(parsed);
              setPendingDraftStep(parsed.lastStep || 1);
              setShowResumeDialog(true);
              return;
          }
        } catch (e) { console.warn("Local load failed"); }
      } else if (user && user.emailVerified && step === 1) {
          setStep(2);
      }
    };
    loadDraft();
  }, [location.state]);

  // Local Save
  useEffect(() => {
    if (step > 1 || isFormDirty) {
        const draft = { ...formData };
        delete draft.step1.password;
        delete draft.step1.confirmPassword;
        const step3Safe = {};
        Object.keys(draft.step3).forEach(k => {
            if (draft.step3[k] instanceof File) step3Safe[k] = { name: draft.step3[k].name };
            else step3Safe[k] = draft.step3[k];
        });
        draft.step3 = step3Safe;
        draft.lastStep = step;
        localStorage.setItem("vendorlink_signup_draft", JSON.stringify(draft));
    }
  }, [formData, step, isFormDirty]);

  const saveToBackend = async (targetStep) => {
      try {
          const { auth } = await import("../../lib/firebase");
          if (auth.currentUser?.emailVerified) {
              const payload = new FormData();
              payload.append("account", JSON.stringify(formData.step1));
              payload.append("details", JSON.stringify(formData.step2));
              payload.append("step", targetStep);
              Object.keys(formData.step3).forEach(k => { if (formData.step3[k] instanceof File) payload.append(k, formData.step3[k]); });
              await onboardingService.saveProgress(payload);
          }
      } catch (e) { console.warn("Backend save failed"); }
  };

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
        if (step2.companyName && step2.companyName.trim().length < 3) errs.companyName = "Company name too short";
        if (step2.registrationNumber && step2.registrationNumber.length < 5) errs.registrationNumber = "Invalid registration number";
    } else {
        if (step2.cnicNumber && step2.cnicNumber.replace(/\D/g, "").length < 13) errs.cnicNumber = "Full 13-digit CNIC required";
        if (step2.bio && step2.bio.trim().length < 20) errs.bio = "Bio must be at least 20 characters";
    }
    return errs;
  }, [formData.step2, formData.step1.role]);

  const nextStep = async () => {
    if (step === 1 && Object.keys(step1Errors).length > 0) return;
    if (step === 2 && Object.keys(step2Errors).length > 0) return;
    const next = Math.min(TOTAL_STEPS, step + 1);
    await saveToBackend(next);
    setStep(next);
  };

  const prevStep = () => setStep((prev) => Math.max(1, prev - 1));

  const handleStep1Back = () => {
    setFormData(prev => ({ ...prev, step1: { ...INITIAL_STEP1 } }));
    prevStep();
  };

  const handleStep1Submit = async () => {
    const { step1 } = formData;
    if (Object.keys(step1Errors).length > 0) return;
    if (!step1.fullName || !step1.email || !step1.phone || !step1.agreeToTerms) {
      toastUtil.validationError("Required fields missing");
      return;
    }
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
    if (step1.authProvider === "google") { nextStep(); return; }

    setLoading(true);
    try {
      const { auth, createFirebaseUser, signInFirebase } = await import("../../lib/firebase");
      let fUser = auth.currentUser;
      if (!fUser || fUser.email !== step1.email) {
        try { fUser = await createFirebaseUser(step1.email, step1.password); }
        catch (e) {
          if (e.code === "auth/email-already-in-use") fUser = await signInFirebase(step1.email, step1.password);
          else throw e;
        }
      }
      if (!fUser) throw new Error("Auth failed");
      if (!fUser.emailVerified) {
        const { sendEmailVerification } = await import("firebase/auth");
        await sendEmailVerification(fUser);
        toastUtil.info("Verify your email to continue.");
        navigate("/verify-email", { state: { email: fUser.email } });
        return;
      }
      toastUtil.success("Verified!");
      setFormData(prev => ({ ...prev, step1: { ...prev.step1, emailVerified: true } }));
      nextStep();
    } catch (error) {
      toastUtil.error("Signup failed.");
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
      const user = auth.currentUser;
      if (!user) throw new Error("No user");
      const payload = new FormData();
      Object.keys(formData.step3).forEach(k => { if (formData.step3[k] instanceof File) payload.append(k, formData.step3[k]); });
      payload.append("account", JSON.stringify(formData.step1));
      payload.append("details", JSON.stringify(formData.step2));
      payload.append("plan", formData.step4.plan);
      if (formData.step4.stripePaymentId) payload.append("stripePaymentId", formData.step4.stripePaymentId);
      await onboardingService.submitFinal(payload);
      toastUtil.success("Complete!");
      setIsFormDirty(false);
      localStorage.removeItem("vendorlink_signup_draft");
      navigate("/login");
    } catch (e) { toastUtil.error("Failed"); } finally { setLoading(false); }
  };

  const handleGoogleSignup = async () => {
    if (!isFirebaseConfigured()) return;
    setGoogleLoading(true);
    try {
      const { user } = await signInWithGoogle();
      const loginRes = await authService.firebaseLogin(await user.getIdToken(true));
      const existing = loginRes.data?.user;
      if (existing?.role && existing.role !== "unassigned") { navigate("/login"); return; }
      setFormData(prev => ({ ...prev, step1: { ...prev.step1, email: user.email, fullName: user.displayName, emailVerified: true, authProvider: "google" } }));
    } catch (e) { toastUtil.error("Google failed"); } finally { setGoogleLoading(false); }
  };

  useEffect(() => {
    setStepVisible(false);
    const id = requestAnimationFrame(() => setStepVisible(true));
    return () => cancelAnimationFrame(id);
  }, [step]);

  const renderStep = () => {
    const { step1, step2, step3, step4 } = formData;

    const isS1Disabled = loading || Object.keys(step1Errors).length > 0 || !step1.fullName || !step1.email || !step1.phone || (step1.authProvider === "local" && (!step1.password || !step1.confirmPassword)) || !step1.agreeToTerms;

    const isS2Disabled = loading || Object.keys(step2Errors).length > 0 || (step1.role === "company" 
        ? (!step2.companyName || !step2.businessType || !step2.industry || !step2.city) 
        : (!step2.cnicNumber || !step2.category || !step2.bio || !step2.city));

    const isS3Disabled = loading || (step1.role === "company" 
        ? (!step3.registrationCertificate || !step3.ntnCertificate) 
        : (!step3.cnicFront || !step3.cnicBack));

    switch (step) {
      case 1: return <SignupStep1 data={step1} onChange={handleStep1Change} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} showConfirmPassword={showConfirmPassword} onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)} onSubmit={handleStep1Submit} loading={loading} />;
      case 2: return <SignupStep2 data={step2} errors={step2Errors} onChange={(f) => { setIsFormDirty(true); setFormData(p => ({ ...p, step2: { ...p.step2, ...f } })); }} isCompany={step1.role === "company"} onSubmit={nextStep} onBack={handleStep1Back} loading={loading} isSubmitDisabled={isS2Disabled} />;
      case 3: return <SignupStep3 data={step3} onFileChange={(k, f) => { setIsFormDirty(true); setFormData(p => ({ ...p, step3: { ...p.step3, [k]: f } })); }} onRemoveFile={(k) => { setIsFormDirty(true); setFormData(p => ({ ...p, step3: { ...p.step3, [k]: null } })); }} isCompany={step1.role === "company"} onSubmit={nextStep} onBack={prevStep} loading={loading} isSubmitDisabled={isS3Disabled} />;
      case 4: return <SignupStep4 plan={step4.plan} onPlanChange={(p) => { setIsFormDirty(true); setFormData(prevData => ({ ...prevData, step4: { ...prevData.step4, plan: p } })); }} onSubmit={(pid) => { if (pid) setFormData(p => ({ ...p, step4: { ...p.step4, stripePaymentId: pid } })); nextStep(); }} onBack={prevStep} loading={loading} />;
      case 5: return <SignupStep5 data={formData} onSubmit={handleFinalSubmit} onBack={prevStep} loading={loading} />;
      default: return null;
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Sign up in a few steps to begin your journey." onGoogleLogin={handleGoogleSignup} googleDisabled={loading || googleLoading} googleLoading={googleLoading} footerText="Already have an account?" footerLinkText="Login" footerLinkTo="/login" extraFooterLink={{ to: "/", text: "Learn more" }} onLinkClick={handleLinkClick} maxWidth="max-w-2xl" >
      <div className="mb-8"> <SignupProgressBar step={step} /> </div>
      <div key={step} className={cn("transition-all duration-300", stepVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}> {renderStep()} </div>
      <Dialog open={showResumeDialog} persistent>
        <Dialog.Header>
          <Dialog.Title>Resume Registration?</Dialog.Title>
          <Dialog.Description>
            You have an incomplete registration. Continue?
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer className="gap-4 sm:gap-4">
          <Button variant="secondary" onClick={handleStartOver} className="flex-1 font-normal">Start Over</Button>
          <Button variant="primary" onClick={handleResume} className="flex-1 font-normal shadow-soft">Continue</Button>
        </Dialog.Footer>
      </Dialog>
      <Dialog open={showLeaveDialog} persistent>
        <Dialog.Header>
          <Dialog.Title>Leave Signup?</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to leave? Your signup is not complete.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer className="gap-4 sm:gap-4">
          <Button variant="secondary" onClick={() => setShowLeaveDialog(false)} className="flex-1 font-normal">Stay</Button>
          <Button variant="primary" onClick={confirmLeave} className="flex-1 font-normal shadow-soft">Leave anyway</Button>
        </Dialog.Footer>
      </Dialog>
    </AuthLayout>
  );
};

export default Signup;
