import React from "react";
import { CheckCircle, User, Buildings, FileText, Briefcase, MapPin } from "@phosphor-icons/react";
import { Button, Card } from "../../ui";

const ReviewSection = ({ icon: Icon, title, children }) => (
  <div>
    <div className="flex items-center gap-2.5 mb-3">
      <Icon size={16} weight="bold" className="text-muted-foreground/80" />
      <h4 className="text-sm font-bold tracking-tight text-foreground">{title}</h4>
    </div>
    <Card className="p-2 bg-muted/20 border-border/30 shadow-sm">
      <dl className="divide-y divide-border/30">
        {children}
      </dl>
    </Card>
  </div>
);

const ReviewItem = ({ label, value }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8002/api";
  const backendUrl = API_BASE_URL.replace("/api", "");

  // Handle File objects (active session) and URL strings (resumed session)
  if (value instanceof File || (typeof value === 'string' && value.startsWith('uploads/'))) {
    const fileUrl = value instanceof File ? URL.createObjectURL(value) : `${backendUrl}/${value}`;
    
    const handleShowFile = () => {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    };

    return (
      <div className="flex justify-between items-center py-3 px-3 min-h-[44px]">
        <dt className="text-xs font-medium text-muted-foreground flex-shrink-0 pr-4">{label}</dt>
        <dd>
            <Button
              type="button"
              onClick={handleShowFile}
              className="text-[10px] font-semibold bg-muted hover:bg-border/50 text-foreground px-2 py-1 rounded-xl transition-colors cursor-pointer"
            >
              Show Document
            </Button>
        </dd>
      </div>
    );
  }

  // Handle all other data types
  let content = '—';
  if (Array.isArray(value)) {
    if (value.length > 0) content = value.join(', ');
  } else if (value != null && value !== '' && !Array.isArray(value)) {
    content = String(value);
  }

  return (
    <div className="flex justify-between items-center py-3 px-3 min-h-[44px]">
      <dt className="text-xs font-medium text-muted-foreground flex-shrink-0 pr-4">{label}</dt>
      <dd className="text-xs font-bold text-foreground text-right truncate pl-4" title={content}>{content}</dd>
    </div>
  );
};


const SignupStep5 = ({ data, onSubmit, onBack, loading }) => {
  const isCompany = data.step1.role === "company";
  const step2Data = data.step2 || {};
  const step3Data = data.step3 || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center space-y-2 pt-4 mb-4">
        <h3 className="text-2xl font-bold tracking-tight">Review & Submit</h3>
        <p className="text-sm text-muted-foreground font-medium max-w-sm">
          Please verify that all your information is correct before submitting for admin review.
        </p>
      </div>

      <div className="space-y-8 pb-4">
        <ReviewSection icon={User} title="Account Details">
          <ReviewItem label="Full Name" value={data.step1.fullName} />
          <ReviewItem label="Email Address" value={data.step1.email} />
          <ReviewItem label="Phone Number" value={`${data.step1.countryCode || ''} ${data.step1.phone || ''}`.trim()} />
          <ReviewItem label="Account Type" value={isCompany ? "Company" : "Vendor"} />
        </ReviewSection>

        <ReviewSection icon={isCompany ? Buildings : Briefcase} title={isCompany ? "Company Details" : "Vendor Details"}>
          {isCompany ? (
            <>
              <ReviewItem label="Company Name" value={step2Data.companyName} />
              <ReviewItem label="Company Size" value={step2Data.companySize} />
              <ReviewItem label="Industry" value={step2Data.industry} />
              <ReviewItem label="Business Type" value={step2Data.businessType} />
              <ReviewItem label="Year Established" value={step2Data.yearEstablished} />
              <ReviewItem label="Registration No." value={step2Data.registrationNumber} />
              <ReviewItem label="Tax ID / NTN" value={step2Data.ntn} />
              <ReviewItem label="Website" value={step2Data.website} />
              <ReviewItem label="Description" value={step2Data.description} />
            </>
          ) : (
            <>
              <ReviewItem label="Vendor Type" value={step2Data.vendorType} />
              <ReviewItem label="National ID / CNIC" value={step2Data.cnicNumber} />
              {step2Data.vendorType === "Registered Business" && (
                <>
                  <ReviewItem label="Business Name" value={step2Data.businessName} />
                  <ReviewItem label="Registration No." value={step2Data.registrationNumber} />
                  <ReviewItem label="Tax ID / NTN" value={step2Data.ntn} />
                </>
              )}
              <ReviewItem label="Service Category" value={step2Data.category} />
              <ReviewItem label="Years of Experience" value={step2Data.yearsOfExperience} />
              <ReviewItem label="Skills" value={step2Data.skills} />
              <ReviewItem label="Portfolio URL" value={step2Data.portfolioURL} />
              <ReviewItem label="Professional Bio" value={step2Data.bio} />
            </>
          )}
        </ReviewSection>

        <ReviewSection icon={MapPin} title="Address">
            <ReviewItem label="Street Address" value={step2Data.streetAddress} />
            <ReviewItem label="City" value={step2Data.city} />
            <ReviewItem label="Province / State" value={step2Data.provinceName} />
            <ReviewItem label="Postal / Zip Code" value={step2Data.zipCode} />
            <ReviewItem label="Country" value={step2Data.countryName} />
        </ReviewSection>
        
        <ReviewSection icon={FileText} title="Uploaded Documents">
          {isCompany ? (
            <>
              <ReviewItem label="Registration Certificate" value={step3Data.registrationCertificate} />
              <ReviewItem label="NTN Certificate" value={step3Data.ntnCertificate} />
              {step3Data.supportingDocument && <ReviewItem label="Supporting Document" value={step3Data.supportingDocument} />}
            </>
          ) : (
            <>
              <ReviewItem label="CNIC Front" value={step3Data.cnicFront} />
              <ReviewItem label="CNIC Back" value={step3Data.cnicBack} />
              {step3Data.businessLicense && <ReviewItem label="Business License" value={step3Data.businessLicense} />}
              {step3Data.portfolioSamples && <ReviewItem label="Portfolio Samples" value={step3Data.portfolioSamples} />}
            </>
          )}
        </ReviewSection>
      </div>

      <div className="pt-2">
        <div className="bg-muted border border-ring/10 p-4 rounded-xl flex items-start gap-3 mb-6">
            <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <p className="text-xs text-foreground font-medium leading-relaxed">
                Your account will be reviewed for authenticity within 24-48 hours.
            </p>
        </div>

        <div className="grid-cols-2 grid w-full gap-4 pt-4 border-t border-border/50">
          <Button 
            variant="secondary" 
            onClick={onBack} 
            disabled={loading}
            size="lg"
            className="w-full flex-1 font-semibold"
          >
            Back
          </Button>
          <Button 
            variant="primary" 
            onClick={onSubmit} 
            loading={loading} 
            disabled={loading}
            size="lg"
            className="w-full flex-1 font-semibold shadow-soft"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </Button></div>
      </div>
    </div>
  );
};

export default SignupStep5;

