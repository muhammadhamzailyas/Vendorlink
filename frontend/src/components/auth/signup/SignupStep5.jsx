import React from "react";
import { CheckCircle, User, Buildings, Briefcase, CreditCard, ShieldCheck } from "@phosphor-icons/react";
import { Button, Card, ScrollArea } from "../../ui";

// eslint-disable-next-line no-unused-vars
const ReviewSection = ({ icon: Icon, title, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]/60 px-1">
      <Icon size={14} />
      <span>{title}</span>
    </div>
    <Card className="p-4 bg-[var(--muted)]/30 border-[var(--border)]/50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
        {children}
      </div>
    </Card>
  </div>
);

const ReviewItem = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[10px] text-[var(--muted-foreground)] font-medium">{label}</p>
    <p className="text-sm font-bold text-[var(--foreground)] truncate">{value || "—"}</p>
  </div>
);

const SignupStep5 = ({ data, onSubmit, onBack, loading }) => {
  const isCompany = data.step1.role === "company";

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--foreground)] mb-2">
          <ShieldCheck size={24} />
        </div>
        <h3 className="text-xl font-bold tracking-tight">Review & Submit</h3>
        <p className="text-xs text-[var(--muted-foreground)] font-medium max-w-sm">
          Please verify your information before submitting for review.
        </p>
      </div>

      <ScrollArea className="h-[450px] pr-4">
        <div className="space-y-6 pb-4">
          {/* Account Section */}
          <ReviewSection icon={User} title="Account Details">
            <ReviewItem label="Full Name" value={data.step1.fullName} />
            <ReviewItem label="Email Address" value={data.step1.email} />
            <ReviewItem label="Phone" value={`${data.step1.countryCode} ${data.step1.phone}`} />
            <ReviewItem label="Account Type" value={isCompany ? "Company" : "Vendor"} />
          </ReviewSection>

          {/* Business Section */}
          <ReviewSection icon={Buildings} title={isCompany ? "Business Info" : "Personal / Business Info"}>
            {isCompany ? (
              <>
                <ReviewItem label="Company Name" value={data.step2.companyName} />
                <ReviewItem label="Industry" value={data.step2.industry} />
                <ReviewItem label="Business Type" value={data.step2.businessType} />
                <ReviewItem label="Year Established" value={data.step2.yearEstablished} />
              </>
            ) : (
              <>
                <ReviewItem label="Vendor Type" value={data.step2.vendorType} />
                <ReviewItem label="National ID / CNIC" value={data.step2.cnicNumber} />
                {data.step2.vendorType === "Registered Business" && (
                  <ReviewItem label="Business Name" value={data.step2.businessName} />
                )}
                <ReviewItem label="Service Category" value={data.step2.category} />
                <ReviewItem label="Experience" value={`${data.step2.yearsOfExperience} Years`} />
                <ReviewItem label="Skills" value={data.step2.skills?.join(", ")} />
              </>
            )}
            <ReviewItem label="Country" value={data.step2.countryName} />
            <ReviewItem label="City" value={data.step2.city} />
          </ReviewSection>

          {/* Payment Section */}
          <ReviewSection icon={CreditCard} title="Subscription Plan">
            <ReviewItem label="Selected Plan" value={data.step4.plan?.toUpperCase()} />
            <ReviewItem label="Billing" value="Monthly (Starts after verification)" />
          </ReviewSection>
        </div>
      </ScrollArea>

      <div className="pt-2">
        <div className="bg-[var(--muted)] border border-[var(--ring)]/10 p-4 rounded-xl flex items-start gap-3 mb-6">
            <CheckCircle className="h-5 w-5 text-[var(--foreground)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">
                By submitting, you agree to our Terms and that your account will be reviewed for authenticity within 24-48 hours.
            </p>
        </div>

        <div className="flex w-full gap-4 pt-4 border-t border-[var(--border)]/50">
          <Button 
            variant="secondary" 
            onClick={onBack} 
            disabled={loading}
            size="lg"
            className="flex-1 font-normal"
          >
            Back
          </Button>
          <Button 
            variant="primary" 
            onClick={onSubmit} 
            loading={loading} 
            disabled={loading}
            size="lg"
            className="flex-1 font-normal shadow-soft"
          >
            Submit Application
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignupStep5;
