import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Checkbox, Input, Label, Tabs, ErrorBanner } from "../../ui";
import PhoneInputField from "./PhoneInputField";
import PasswordInputField from "../PasswordInputField";
import { isValidPhoneNumber } from "react-phone-number-input";
import { validatePassword } from "@/lib/utils";

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
        // Validate the full international number (including country code)
        // Strip non-digit characters from data.phone (it might contain spaces/dashes from PhoneInputField)
        const strippedPhone = data.phone.replace(/\D/g, "");
        const fullPhone = `${data.countryCode}${strippedPhone}`;
        if (!isValidPhoneNumber(fullPhone)) {
            errs.phone = "Invalid format";
        }
    }

    // Password validation
    if (!isOAuth && data.password) {
        const passResult = validatePassword(data.password);
        if (passResult !== true) {
            errs.password = passResult;
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
              error={errors.fullName}
            />
        </div>
        
        <div className="space-y-1">
            <PhoneInputField 
              countryCode={data.countryCode}
              isoCode={data.isoCode}
              phone={data.phone}
              onChange={onChange}
            />
            <ErrorBanner error={errors.phone} />
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
          error={errors.email}
        />
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
        <Link to="/terms" target="_blank" className="text-foreground hover:opacity-80 underline underline-offset-4">
          Terms of Service
        </Link>
        {" "}and{" "}
        <Link to="/privacy" target="_blank" className="text-foreground hover:opacity-80 underline underline-offset-4">
          Privacy Policy
        </Link>
      </Label>
    </div>

    <Button
      type="submit"
      variant="primary"
      disabled={isSubmitDisabled}
      loading={loading}
      className="w-full h-12 rounded-xl shadow-soft font-semibold text-base"
    >
      {loading ? "Saving..." : "Save & Continue"}
    </Button>
  </form>
  );
};

export default SignupStep1;

