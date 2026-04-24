import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Checkbox, Input, Label, Tabs } from "../../ui";
import PhoneInputField from "./PhoneInputField";
import PasswordInputField from "./PasswordInputField";
import { isValidPhoneNumber } from "react-phone-number-input";

const SignupStep1 = ({ 
  data, 
  onChange, 
  showPassword, 
  onTogglePassword, 
  showConfirmPassword, 
  onToggleConfirmPassword, 
  onSubmit, 
  loading 
}) => {
  const isOAuth = !!data.authProvider && data.authProvider !== "local";
  
  const errors = useMemo(() => {
    const errs = {};
    
    // Name validation
    if (data.fullName && data.fullName.trim().length < 3) {
      errs.fullName = "Name is too short (min 3 characters)";
    }

    // Email validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = "Invalid email format";
    }

    // Phone validation - Universal for all countries using libphonenumber metadata
    if (data.phone) {
        // Strip hyphens and spaces added by PhoneInputField for validation
        const rawPhone = data.phone.replace(/\D/g, "");
        if (!isValidPhoneNumber(rawPhone, data.isoCode)) {
            errs.phone = "Invalid format";
        }
    }

    // Password validation
    if (!isOAuth && data.password) {
        const pass = data.password;
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasNumber = /[0-9]/.test(pass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

        if (pass.length < 8) {
            errs.password = "Min 8 characters required";
        } else if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            errs.password = "Must include uppercase, lowercase, number & special char";
        }
    }

    if (!isOAuth && data.confirmPassword && data.password && data.password !== data.confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
    }

    return errs;
  }, [data, isOAuth]);

  const isSubmitDisabled =
    loading ||
    Object.keys(errors).length > 0 ||
    !data.role ||
    !data.fullName?.trim() ||
    !data.email?.trim() ||
    !data.phone?.trim() ||
    (!isOAuth && (!data.password?.trim() || !data.confirmPassword?.trim())) ||
    !data.agreeToTerms;

  const roleOptions = [
    { label: "Company", value: "company" },
    { label: "Vendor", value: "vendor" },
  ];

  const ErrorMsg = ({ children }) => (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2 text-[11px] font-bold tracking-tight text-error animate-in fade-in slide-in-from-top-1 border border-error/20">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,16,0v40A8,8,0,0,1,144,176ZM128,80a12,12,0,1,1-12,12A12,12,0,0,1,128,80Z"></path>
      </svg>
      <span className="leading-none">{children}</span>
    </div>
  );

  return (
  <form
    className="space-y-5"
    autoComplete="off"
    onSubmit={(e) => {
      e.preventDefault();
      if (!isSubmitDisabled) onSubmit();
    }}
  >
    <div>
      <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        Account Type
      </Label>
      <Tabs
        value={data.role}
        onChange={(val) => onChange({ role: val })}
        tabs={roleOptions}
        className="h-12"
      />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1">
            <Input
              placeholder="Full Name"
              type="text"
              value={data.fullName}
              autoComplete="new-password"
              onChange={(e) => onChange({ fullName: e.target.value })}
            />
            {errors.fullName && <ErrorMsg>{errors.fullName}</ErrorMsg>}
        </div>
        
        <div className="space-y-1">
            <PhoneInputField 
              countryCode={data.countryCode}
              isoCode={data.isoCode}
              phone={data.phone}
              onChange={onChange}
            />
            {errors.phone && <ErrorMsg>{errors.phone}</ErrorMsg>}
        </div>
    </div>

    <div className="space-y-1">
        <Input
          placeholder="Email Address"
          type="email"
          value={data.email}
          autoComplete="new-password"
          onChange={(e) => onChange({ email: e.target.value })}
          disabled={isOAuth}
        />
        {errors.email && <ErrorMsg>{errors.email}</ErrorMsg>}
    </div>

    {!isOAuth && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
              <PasswordInputField 
                placeholder="Password"
                value={data.password}
                autoComplete="new-password"
                onChange={(val) => onChange({ password: val })}
                showPassword={showPassword}
                onToggle={onTogglePassword}
                error={errors.password}
              />
          </div>
          <div className="space-y-1">
              <PasswordInputField 
                placeholder="Confirm Password"
                value={data.confirmPassword}
                autoComplete="new-password"
                onChange={(val) => onChange({ confirmPassword: val })}
                showPassword={showConfirmPassword}
                onToggle={onToggleConfirmPassword}
                error={errors.confirmPassword}
              />
          </div>
      </div>
    )}

    <div className="flex items-start gap-3 text-sm text-foreground pt-1">
      <Checkbox
        id="terms"
        checked={data.agreeToTerms}
        onCheckedChange={(checked) => onChange({ agreeToTerms: !!checked })}
        className="mt-1"
      />
      <Label htmlFor="terms" className="leading-relaxed text-sm text-foreground cursor-pointer select-none">
        I agree to the{" "}
        <Link to="/terms" className="text-foreground hover:opacity-80 underline underline-offset-4">
          Terms of Service
        </Link>
        {" "}and{" "}
        <Link to="/privacy" className="text-foreground hover:opacity-80 underline underline-offset-4">
          Privacy Policy
        </Link>
      </Label>
    </div>

    <Button
      type="submit"
      variant="primary"
      disabled={isSubmitDisabled}
      loading={loading}
      className="w-full h-12 rounded-xl shadow-soft font-normal text-base"
    >
      Save & Continue
    </Button>
  </form>
  );
};

export default SignupStep1;
