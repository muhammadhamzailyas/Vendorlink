import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Storefront,
  FloppyDisk,
  SealCheck,
  User,
  FileText,
  UploadSimple,
  CheckCircle,
} from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toastUtil from "@/lib/toast";
import api from "@/services/api";
import UserAvatar from "@/components/shared/UserAvatar";
import StatusChip from "@/components/shared/StatusChip";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";
import { Button, Card, Input, PageTransition, Textarea, Badge } from "@/components/ui";
import { useUser } from "../context/UserContext";

const getDefaultValues = (userType) => ({
  companyName: "",
  username: "",
  email: "",
  [userType === "vendor" ? "category" : "industry"]: "",
  skills: "",
  phone: "",
  location: "",
  description: "",
  profileImage: "",
  // Address info
  streetAddress: "",
  city: "",
  province: "",
  zipCode: "",
});

const buildSchema = (userType) =>
  z.object({
    companyName: z.string().trim().min(3, "Display name must be at least 3 characters"),
    username: z.string().trim().min(3, "Username must be at least 3 characters"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    [userType === "vendor" ? "category" : "industry"]: z.string().trim().min(2, "Please specify your field"),
    skills: z.string().trim(),
    phone: z.string().trim().min(7, "Enter a valid phone number"),
    location: z.string().trim().min(2, "Location is required"),
    description: z.string().trim().min(20, "Description should be at least 20 characters for professional clarity"),
    profileImage: z.string(),
    streetAddress: z.string().trim().min(5, "Full street address required"),
    city: z.string().trim().min(2, "City is required"),
    province: z.string().trim().min(2, "Province/State is required"),
    zipCode: z.string().trim().min(4, "Valid Zip code required"),
  });

const UserProfile = ({ userType: propUserType }) => {
  const { user: contextUser, refreshUser } = useUser();
  const userType = propUserType || contextUser?.role || "company";

  const [profileMeta, setProfileMeta] = useState({
    role: userType,
    status: "pending",
  });
  const [initialData, setInitialData] = useState(() => getDefaultValues(userType));
  const [documents, setDocuments] = useState({});
  const [newFiles, setNewFiles] = useState({});
  const formSchema = useMemo(() => buildSchema(userType), [userType]);

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(userType),
    mode: "onChange"
  });

  const formData = watch();
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialData) || Object.keys(newFiles).length > 0,
    [formData, initialData, newFiles]
  );

  const hydrateForm = useCallback((payload, fallbackUser) => {
    const userDataFromApi = payload.user || fallbackUser;
    const companyData = payload.company || payload.details || {};
    const vendorData = payload.vendor || payload.details || {};

    const roleProfile = userType === "vendor" ? vendorData : companyData;
    const resolvedName =
      userType === "vendor"
        ? roleProfile.fullName || userDataFromApi.fullName || userDataFromApi.username || ""
        : roleProfile.companyName || userDataFromApi.companyName || userDataFromApi.username || "";

    const nextForm = {
      companyName: resolvedName,
      username: userDataFromApi.username || "",
      email: userDataFromApi.email || "",
      [userType === "vendor" ? "category" : "industry"]:
        roleProfile[userType === "vendor" ? "category" : "industry"] || "",
      skills: Array.isArray(roleProfile.skills) ? roleProfile.skills.join(", ") : "",
      phone: roleProfile.phone || userDataFromApi.phone || "",
      location: roleProfile.location || roleProfile.city || "",
      description: roleProfile.description || roleProfile.bio || "",
      profileImage: userDataFromApi.profileImage || "",
      streetAddress: roleProfile.streetAddress || "",
      city: roleProfile.city || "",
      province: roleProfile.province || "",
      zipCode: roleProfile.zipCode || "",
    };

    setProfileMeta({
      role: userDataFromApi.role || userType,
      status: userDataFromApi.status || "pending",
    });

    const docPaths = {};
    if (userType === "company") {
        docPaths.registrationCertificate = roleProfile.registrationCertificateURL;
        docPaths.ntnCertificate = roleProfile.ntnCertificateURL;
        docPaths.supportingDocument = roleProfile.supportingDocumentURL;
    } else {
        docPaths.cnicFront = roleProfile.cnicFrontURL;
        docPaths.cnicBack = roleProfile.cnicBackURL;
        docPaths.businessLicense = roleProfile.businessLicenseURL;
        docPaths.portfolioSamples = roleProfile.portfolioSamplesURL;
    }
    setDocuments(docPaths);
    setNewFiles({});

    reset(nextForm);
    setInitialData(nextForm);
  }, [reset, userType]);

  const fetchProfile = useCallback(async () => {
    try {
      const onboardingRes = await api.get("/onboarding/me");
      hydrateForm(onboardingRes.data || {}, contextUser);
    } catch (error) {
      console.error("Error fetching profile:", error);
      hydrateForm({ user: contextUser }, contextUser);
    }
  }, [hydrateForm, contextUser]);

  useEffect(() => {
    if (contextUser) {
      fetchProfile();
    }
  }, [fetchProfile, contextUser]);

  const fileInputRef = useRef(null);
  const triggerProfileImageInput = () => fileInputRef.current?.click();

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toastUtil.validationError("Please choose an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toastUtil.validationError("Profile image must be 2MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setValue("profileImage", String(reader.result || ""), {
        shouldDirty: true,
        shouldTouch: true,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setValue("profileImage", "", {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleFileChange = (key, file) => {
    setNewFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleSave = async (data) => {
    try {
      // 1) Save user-level profile fields.
      await api.put("/auth/me", {
        username: data.username,
        email: data.email,
        fullName: userType === "vendor" ? data.companyName : data.fullName,
        phone: data.phone,
        profileImage: data.profileImage || "",
      });

      // 2) Save role-specific business/profile fields.
      const payload = new FormData();
      const details = {
          ...data,
          fullName: userType === "vendor" ? data.companyName : undefined,
          bio: userType === "vendor" ? data.description : undefined,
          skills: data.skills.split(",").map(s => s.trim()).filter(Boolean)
      };
      payload.append("details", JSON.stringify(details));
      
      Object.keys(newFiles).forEach(key => {
          if (newFiles[key]) payload.append(key, newFiles[key]);
      });

      await api.put("/onboarding/step2/business", payload);

      await refreshUser();
      toastUtil.success("Profile updated successfully");
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toastUtil.handleApiError(error, { default: "Failed to update profile" });
    }
  };

  const config =
    userType === "vendor"
      ? { title: "Vendor Profile", typeField: "Category", typeKey: "category", icon: User }
      : { title: "Company Profile", typeField: "Industry", typeKey: "industry", icon: Storefront };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
             <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">{config.title}</h2>
             <p className="text-sm text-muted-foreground">Manage your identity, professional details, and verification documents.</p>
           </div>
           {contextUser?.status === "approved" && (
             <Badge variant="success" className="w-fit font-black uppercase tracking-widest text-[10px] py-1.5 px-4 h-9 shadow-sm shadow-success/10 border-success/30 bg-success/10 text-success">
               <SealCheck size={14} weight="bold" className="mr-1.5" />
               Verified Account
             </Badge>
           )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-4 space-y-6">
            <Card className="overflow-hidden bg-card border-border shadow-sm">
              <Card.Header className="flex flex-col items-center text-center space-y-4 pb-2 border-b-0">
                <UserAvatar
                  user={formData}
                  name={formData.companyName || formData.username || "Profile"}
                  size="xl"
                  className="h-32 w-32 text-5xl border-4 border-background shadow-soft"
                />
                <div className="space-y-1">
                  <Card.Title className="text-lg font-bold uppercase tracking-tight text-foreground">{formData.companyName || "Unnamed"}</Card.Title>
                  <Card.Description className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{formData[config.typeKey] || config.typeField}</Card.Description>
                </div>
              </Card.Header>

              <Card.Content className="space-y-6">
                <input type="hidden" {...register("profileImage")} />

                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    className="font-bold uppercase tracking-tight text-[10px]"
                    onClick={triggerProfileImageInput}
                  >
                    {formData.profileImage ? "Change Photo" : "Add Photo"}
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                  {formData.profileImage && (
                    <Button
                      type="button"
                      onClick={handleRemoveProfileImage}
                      variant="danger"
                      size="xs"
                      className="font-bold uppercase tracking-tight text-[10px]"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-5">
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <SealCheck className="h-3.5 w-3.5" />
                        Username
                      </span>
                      <span className="font-bold text-foreground uppercase tracking-tight">{formData.username || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</span>
                      <span className="font-bold capitalize text-foreground uppercase tracking-tight">{profileMeta.role || userType}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
                      <StatusChip status={profileMeta.status || "pending"} />
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Document Status Section */}
            <Card className="bg-card border-border shadow-sm">
                <Card.Header className="pb-3">
                    <Card.Title className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Verification Documents</Card.Title>
                </Card.Header>
                <Card.Content className="space-y-3">
                    {Object.entries(documents).map(([key, path]) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                            <div className="flex items-center gap-2">
                                <FileText size={16} weight="duotone" className="text-muted-foreground" />
                                <span className="text-[10px] font-bold uppercase tracking-tight text-foreground truncate max-w-[120px]">
                                    {key.replace(/([A-Z])/g, ' $1')}
                                </span>
                            </div>
                            {path ? (
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter bg-success/5 text-success border-success/20">
                                    Uploaded
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter bg-error/5 text-error border-error/20">
                                    Missing
                                </Badge>
                            )}
                        </div>
                    ))}
                    <p className="text-[9px] text-muted-foreground text-center font-medium uppercase tracking-widest pt-2">Update documents in the details section</p>
                </Card.Content>
            </Card>
          </aside>

          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit(handleSave)} noValidate>
              <div className="space-y-8">
                <FormSection
                  title="Business Identity"
                  description="Public information about your company or services."
                >
                  <FormFieldGrid>
                    <Input label="Display Name" error={errors.companyName?.message} {...register("companyName")} />
                    <Input label="Username" error={errors.username?.message} {...register("username")} />
                    <Input label="Email Address" type="email" error={errors.email?.message} {...register("email")} />
                    <Input label={config.typeField} error={errors[config.typeKey]?.message} {...register(config.typeKey)} />
                    <Input label="Phone Number" error={errors.phone?.message} {...register("phone")} />
                    <Input label="City/Location" error={errors.location?.message} {...register("location")} />
                  </FormFieldGrid>
                </FormSection>

                <FormSection
                  title="About & Background"
                  description="Detailed description for potential partners and administrators."
                >
                  <div className="space-y-6">
                    <Textarea
                      label={userType === "vendor" ? "Professional Bio" : "Company Description"}
                      rows={5}
                      error={errors.description?.message}
                      {...register("description")}
                    />
                    {userType === "vendor" && (
                      <Input label="Key Skills (comma separated)" error={errors.skills?.message} {...register("skills")} />
                    )}
                  </div>
                </FormSection>

                <FormSection
                  title="Address & Localization"
                  description="Where your business is legally registered."
                >
                  <FormFieldGrid>
                    <Input label="Street Address" error={errors.streetAddress?.message} {...register("streetAddress")} />
                    <Input label="City" error={errors.city?.message} {...register("city")} />
                    <Input label="Province / State" error={errors.province?.message} {...register("province")} />
                    <Input label="Zip Code" error={errors.zipCode?.message} {...register("zipCode")} />
                  </FormFieldGrid>
                </FormSection>

                <FormSection
                  title="Verification Documents"
                  description="Upload missing or updated documents for verification."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userType === "company" ? (
                      <>
                        <DocUpload key="reg" label="Registration Certificate" current={documents.registrationCertificate} onFile={(f) => handleFileChange('registrationCertificate', f)} />
                        <DocUpload key="ntn" label="NTN Certificate" current={documents.ntnCertificate} onFile={(f) => handleFileChange('ntnCertificate', f)} />
                        <DocUpload key="supp" label="Supporting Document" current={documents.supportingDocument} onFile={(f) => handleFileChange('supportingDocument', f)} />
                      </>
                    ) : (
                      <>
                        <DocUpload key="cf" label="CNIC Front" current={documents.cnicFront} onFile={(f) => handleFileChange('cnicFront', f)} />
                        <DocUpload key="cb" label="CNIC Back" current={documents.cnicBack} onFile={(f) => handleFileChange('cnicBack', f)} />
                        <DocUpload key="bl" label="Business License" current={documents.businessLicense} onFile={(f) => handleFileChange('businessLicense', f)} />
                        <DocUpload key="ps" label="Portfolio Samples" current={documents.portfolioSamples} onFile={(f) => handleFileChange('portfolioSamples', f)} />
                      </>
                    )}
                  </div>
                </FormSection>

                {hasUnsavedChanges && (
                  <FormActionRow className="sticky bottom-8 bg-background/80 backdrop-blur-md border border-border p-6 rounded-2xl shadow-2xl z-10">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                        <div className="flex-1 text-center sm:text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground">You have unsaved changes</p>
                            <p className="text-xs text-muted-foreground font-medium">Please review before updating your profile.</p>
                        </div>
                        <Button
                        type="submit"
                        loading={isSubmitting}
                        disabled={isSubmitting || !isValid}
                        className="w-full sm:w-auto font-black uppercase tracking-widest text-xs px-10 h-12 rounded-xl shadow-soft bg-foreground text-background hover:opacity-90 transition-all"
                        >
                        <FloppyDisk className="h-4 w-4 mr-2" />
                        Update Profile
                        </Button>
                    </div>
                  </FormActionRow>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

const DocUpload = ({ label, current, onFile }) => {
    const inputRef = useRef(null);
    const [fileName, setFileName] = useState("");

    return (
        <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                {current && !fileName && <CheckCircle size={16} weight="fill" className="text-success" />}
            </div>
            <div 
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border/50 rounded-xl hover:border-foreground/20 hover:bg-muted/30 transition-all cursor-pointer group"
            >
                <UploadSimple size={20} weight="bold" className="text-muted-foreground group-hover:text-foreground mb-2" />
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground text-center">
                    {fileName || (current ? "Click to Update" : "Upload Document")}
                </span>
                <input 
                    type="file" 
                    ref={inputRef}
                    className="hidden" 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setFileName(file.name);
                            onFile(file);
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default UserProfile;
