import React from "react";
import { Button } from "../../ui";
import FileUploadField from "./FileUploadField";

const SignupStep3 = ({ data, onFileChange, onRemoveFile, isCompany, onSubmit, onBack, loading }) => {
  const isFormValid = isCompany 
    ? (data.registrationCertificate && data.ntnCertificate)
    : (data.cnicFront && data.cnicBack);

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground mb-2">Verification Documents (Max 5MB each)</p>
      
      {isCompany ? (
        <div className="grid grid-cols-1 gap-4">
          <FileUploadField 
            label="Business Registration Certificate *" 
            id="registrationCertificate"
            file={data.registrationCertificate}
            onFileChange={(file) => onFileChange("registrationCertificate", file)}
            onRemove={() => onRemoveFile("registrationCertificate")}
          />
          <FileUploadField 
            label="NTN Certificate *" 
            id="ntnCertificate"
            file={data.ntnCertificate}
            onFileChange={(file) => onFileChange("ntnCertificate", file)}
            onRemove={() => onRemoveFile("ntnCertificate")}
          />
          <FileUploadField 
            label="Supporting Document (Optional)" 
            id="supportingDocument"
            file={data.supportingDocument}
            onFileChange={(file) => onFileChange("supportingDocument", file)}
            onRemove={() => onRemoveFile("supportingDocument")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUploadField 
              label="CNIC Front *" 
              id="cnicFront"
              file={data.cnicFront}
              onFileChange={(file) => onFileChange("cnicFront", file)}
              onRemove={() => onRemoveFile("cnicFront")}
            />
            <FileUploadField 
              label="CNIC Back *" 
              id="cnicBack"
              file={data.cnicBack}
              onFileChange={(file) => onFileChange("cnicBack", file)}
              onRemove={() => onRemoveFile("cnicBack")}
            />
          </div>
          <FileUploadField 
            label="Business License (if applicable)" 
            id="businessLicense"
            file={data.businessLicense}
            onFileChange={(file) => onFileChange("businessLicense", file)}
            onRemove={() => onRemoveFile("businessLicense")}
          />
          <FileUploadField 
            label="Portfolio Samples (Optional)" 
            id="portfolioSamples"
            file={data.portfolioSamples}
            onFileChange={(file) => onFileChange("portfolioSamples", file)}
            onRemove={() => onRemoveFile("portfolioSamples")}
          />
        </div>
      )}

      <div className="grid-cols-2 grid gap-4 pt-4 border-t border-border/50">
        <Button variant="secondary" onClick={onBack} disabled={loading} size="lg" className="w-full flex-1 font-semibold">Back</Button>
        <Button 
            variant="primary" 
            onClick={onSubmit} 
            loading={loading} 
            disabled={!isFormValid || loading}
            size="lg"
            className="w-full flex-1 font-semibold shadow-soft"
        >
          {loading ? "Saving..." : "Continue"}
        </Button></div>
    </div>
  );
};

export default SignupStep3;



