import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Storefront,
  FloppyDisk,
  SealCheck,
  User,
  FileText,
  UploadSimple,
  CheckCircle,
  MapPin,
  Phone,
  Envelope,
  IdentificationCard,
  Briefcase,
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
import { useUser } from "@/context/UserContext";
import { usePageMeta } from "@/hooks/usePageMeta";

const getDefaultValues = (userType, user) => ({
  companyName: user?.fullName || "",
  fullName: user?.fullName || "",
  email: user?.email || "",
  [userType === "vendor" ? "category" : "industry"]: "",
  skills: "",
  phone: user?.phone || "",
  location: "",
  description: "",
  profileImage: user?.profileImage || "",
  streetAddress: "",
  city: "",
  province: "",
  zipCode: "",
});

const buildSchema = (userType) =>
  z.object({
    companyName: z.string().trim().min(3, "Display name must be at least 3 characters"),
    fullName: z.string().trim().min(3, "Full name must be at least 3 characters"),
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

  const config = useMemo(() =>
    userType === "vendor"
      ? { title: "Vendor Profile", typeField: "Professional Category", typeKey: "category" }
      : { title: "Company Profile", typeField: "Business Industry", typeKey: "industry" }
  , [userType]);

  usePageMeta(config.title, "Manage your professional identity, contact information, and verification status.");

  const [profileMeta, setProfileMeta] = useState({
    role: userType,
    status: contextUser?.status || "pending",
  });
  const [initialData, setInitialData] = useState(() => getDefaultValues(userType, contextUser));
  const [documents, setDocuments] = useState({});
  const [newFiles, setNewFiles] = useState({});
  const formSchema = useMemo(() => buildSchema(userType), [userType]);

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => getDefaultValues(userType, contextUser), [userType, contextUser]),
    mode: "onChange"
  });

  const formData = watch();
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialData) || Object.keys(newFiles).length > 0,
    [formData, initialData, newFiles]
  );

  const hydrateForm = useCallback((payload, fallbackUser) => {
    const userDataFromApi = payload.user || fallbackUser || {};
    const companyData = payload.company || payload.details || {};
    const vendorData = payload.vendor || payload.details || {};

    const roleProfile = userType === "vendor" ? vendorData : companyData;
    const resolvedName =
      userType === "vendor"
        ? roleProfile.fullName || userDataFromApi.fullName || ""
        : roleProfile.companyName || userDataFromApi.companyName || userDataFromApi.fullName || "";

    const nextForm = {
      companyName: resolvedName,
      fullName: userDataFromApi.fullName || "",
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
      await api.put("/auth/me", {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        profileImage: data.profileImage || "",
      });

      const payload = new FormData();
      const details = {
          ...data,
          fullName: userType === "vendor" ? data.companyName : data.fullName,
          bio: userType === "vendor" ? data.description : undefined,
          skills: data.skills.split(",").map(s => s.trim()).filter(Boolean)
      };
      payload.append("details", JSON.stringify(details));
      
      Object.keys(newFiles).forEach(key => {
          if (newFiles[key]) payload.append(key, newFiles[key]);
      });

      try {
        await api.put("/onboarding/step2/business", payload);
      } catch (err) {
        console.warn("Could not update extended business profile fields.");
      }

      await refreshUser();
      toastUtil.success("Profile updated successfully");
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toastUtil.handleApiError(error, { default: "Failed to update profile" });
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <Card className="overflow-hidden border-border shadow-soft bg-card">
              <Card.Header className="flex flex-col items-center text-center space-y-4 pb-6 pt-8 bg-muted/30 border-b border-border/50">
                <UserAvatar
                  user={formData}
                  name={formData.companyName || formData.fullName || "Profile"}
                  size="xl"
                  className="h-40 w-40 text-6xl border-4 border-background shadow-xl ring-1 ring-border/50"
                />
                <div className="space-y-2">
                  <Card.Title className="text-xl font-black uppercase tracking-tight text-foreground">{formData.companyName || "Professional Profile"}</Card.Title>
                  <Card.Description className="text-[11px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 py-1 px-3 rounded-full inline-block">
                    {formData[config.typeKey] || config.typeField}
                  </Card.Description>
                  {contextUser?.status === "approved" && (
                    <div className="pt-2">
                      <Badge variant="success" className="w-fit font-black uppercase tracking-widest text-[10px] py-1.5 px-4 h-9 shadow-sm shadow-success/10 border-success/30 bg-success/10 text-success">
                        <SealCheck size={14} weight="bold" className="mr-1.5" />
                        Verified Account
                      </Badge>
                    </div>
                  )}
                </div>
              </Card.Header>

              <Card.Content className="p-6 space-y-6">
                <input type="hidden" {...register("profileImage")} />

                <div className="flex flex-col items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full max-w-[200px] font-bold uppercase tracking-widest text-[10px] h-10"
                    onClick={triggerProfileImageInput}
                  >
                    Update Photo
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
                      variant="ghost"
                      className="w-full max-w-[200px] font-bold uppercase tracking-widest text-[10px] h-10 text-error hover:bg-error/5"
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between group">
                    <span className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <IdentificationCard size={16} weight="duotone" className="text-primary/60" />
                      Legal Name
                    </span>
                    <span className="font-bold text-sm text-foreground uppercase tracking-tight">{formData.fullName || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between group">
                    <span className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Briefcase size={16} weight="duotone" className="text-primary/60" />
                      Account Role
                    </span>
                    <span className="font-bold text-sm capitalize text-foreground uppercase tracking-tight">{profileMeta.role || userType}</span>
                  </div>
                  <div className="flex items-center justify-between group">
                    <span className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <SealCheck size={16} weight="duotone" className="text-primary/60" />
                      Status
                    </span>
                    <StatusChip status={profileMeta.status || "pending"} className="font-black" />
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card className="border-border shadow-soft bg-card overflow-hidden">
                <Card.Header className="bg-muted/30 border-b border-border/50 py-4">
                    <Card.Title className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <FileText size={16} weight="duotone" className="text-primary/60" />
                        Compliance Assets
                    </Card.Title>
                </Card.Header>
                <Card.Content className="p-4 space-y-3">
                    {Object.entries(documents).map(([key, path]) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30 transition-colors hover:bg-muted/40 group">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-background rounded-lg border border-border/50 text-muted-foreground group-hover:text-foreground transition-colors">
                                  <FileText size={14} weight="bold" />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-tight text-foreground truncate max-w-[140px]">
                                    {key.replace(/([A-Z])/g, ' $1')}
                                </span>
                            </div>
                            {path ? (
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter bg-success/10 text-success border-success/30 px-2 py-0.5">
                                    Verified
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter bg-error/10 text-error border-error/30 px-2 py-0.5">
                                    Required
                                </Badge>
                            )}
                        </div>
                    ))}
                    {Object.keys(documents).length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">No documents required</p>
                      </div>
                    )}
                </Card.Content>
            </Card>
          </aside>

          {/* Main Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit(handleSave)} noValidate className="space-y-10">
              <div className="grid grid-cols-1 gap-10">
                <FormSection
                  title="Business Identity"
                  description="Core identification details used across the platform."
                  icon={<IdentificationCard size={20} weight="duotone" />}
                >
                  <FormFieldGrid>
                    <Input 
                      label="Display Name / Company" 
                      placeholder="e.g. Acme Corp"
                      icon={<Storefront size={18} />}
                      error={errors.companyName?.message} 
                      {...register("companyName")} 
                    />
                    <Input 
                      label="Full Legal Name" 
                      placeholder="Your full name"
                      icon={<User size={18} />}
                      error={errors.fullName?.message} 
                      {...register("fullName")} 
                    />
                    <Input 
                      label="Official Email Address" 
                      type="email" 
                      placeholder="name@company.com"
                      icon={<Envelope size={18} />}
                      error={errors.email?.message} 
                      {...register("email")} 
                    />
                    <Input 
                      label={config.typeField} 
                      placeholder="e.g. Software Development"
                      icon={<Briefcase size={18} />}
                      error={errors[config.typeKey]?.message} 
                      {...register(config.typeKey)} 
                    />
                    <Input 
                      label="Contact Number" 
                      placeholder="+1 234 567 890"
                      icon={<Phone size={18} />}
                      error={errors.phone?.message} 
                      {...register("phone")} 
                    />
                    <Input 
                      label="Primary Location" 
                      placeholder="e.g. New York, USA"
                      icon={<MapPin size={18} />}
                      error={errors.location?.message} 
                      {...register("location")} 
                    />
                  </FormFieldGrid>
                </FormSection>

                <FormSection
                  title="Professional Summary"
                  description="A detailed overview of your capabilities and background."
                  icon={<FileText size={20} weight="duotone" />}
                >
                  <div className="space-y-6">
                    <Textarea
                      label={userType === "vendor" ? "Professional Biography" : "Corporate Overview"}
                      placeholder="Provide a compelling description of your business or professional background..."
                      rows={6}
                      className="resize-none"
                      error={errors.description?.message}
                      {...register("description")}
                    />
                    {userType === "vendor" && (
                      <Input 
                        label="Core Competencies & Skills" 
                        placeholder="e.g. React, Node.js, Project Management (comma separated)"
                        error={errors.skills?.message} 
                        {...register("skills")} 
                      />
                    )}
                  </div>
                </FormSection>

                <FormSection
                  title="Registered Address"
                  description="Legal registered office or primary business residence."
                  icon={<MapPin size={20} weight="duotone" />}
                >
                  <FormFieldGrid>
                    <Input label="Street Address" placeholder="123 Business Way" error={errors.streetAddress?.message} {...register("streetAddress")} />
                    <Input label="City" placeholder="City" error={errors.city?.message} {...register("city")} />
                    <Input label="Province / State" placeholder="Province" error={errors.province?.message} {...register("province")} />
                    <Input label="Zip Code" placeholder="ZIP" error={errors.zipCode?.message} {...register("zipCode")} />
                  </FormFieldGrid>
                </FormSection>

                <FormSection
                  title="Verification Assets"
                  description="Maintain valid compliance documents to keep your account verified."
                  icon={<SealCheck size={20} weight="duotone" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userType === "company" ? (
                      <>
                        <DocUpload key="reg" label="Registration Certificate" current={documents.registrationCertificate} onFile={(f) => handleFileChange('registrationCertificate', f)} />
                        <DocUpload key="ntn" label="NTN Certificate" current={documents.ntnCertificate} onFile={(f) => handleFileChange('ntnCertificate', f)} />
                        <DocUpload key="supp" label="Additional Supporting Document" current={documents.supportingDocument} onFile={(f) => handleFileChange('supportingDocument', f)} />
                      </>
                    ) : (
                      <>
                        <DocUpload key="cf" label="CNIC / ID Front" current={documents.cnicFront} onFile={(f) => handleFileChange('cnicFront', f)} />
                        <DocUpload key="cb" label="CNIC / ID Back" current={documents.cnicBack} onFile={(f) => handleFileChange('cnicBack', f)} />
                        <DocUpload key="bl" label="Business License / Permit" current={documents.businessLicense} onFile={(f) => handleFileChange('businessLicense', f)} />
                        <DocUpload key="ps" label="Work Portfolio / Samples" current={documents.portfolioSamples} onFile={(f) => handleFileChange('portfolioSamples', f)} />
                      </>
                    )}
                  </div>
                </FormSection>

                {hasUnsavedChanges && (
                  <FormActionRow className="sticky bottom-6 bg-background/95 backdrop-blur-sm border border-border p-6 rounded-2xl shadow-2xl z-20 flex items-center justify-between ring-1 ring-black/5">
                    <div className="hidden sm:block space-y-1">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                          <FloppyDisk size={14} weight="bold" />
                          Unsaved Modifications
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">Review your changes carefully before saving.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            reset(initialData);
                            setNewFiles({});
                          }}
                          className="flex-1 sm:flex-none font-bold uppercase tracking-widest text-[10px] h-12 px-6"
                        >
                          Discard
                        </Button>
                        <Button
                          type="submit"
                          loading={isSubmitting}
                          className="flex-1 sm:flex-none font-black uppercase tracking-widest text-[10px] px-10 h-12 rounded-xl shadow-lg bg-foreground text-background hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          Commit Changes
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
        <div className="p-5 rounded-2xl bg-muted/20 border border-border/50 space-y-4 hover:border-border transition-colors group/doc">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover/doc:text-foreground transition-colors">{label}</span>
                {current && !fileName && (
                  <div className="flex items-center gap-1.5 text-success">
                    <span className="text-[8px] font-black uppercase tracking-tighter">Existing</span>
                    <CheckCircle size={18} weight="fill" />
                  </div>
                )}
            </div>
            <div 
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-border/50 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group/btn"
            >
                <UploadSimple size={24} weight="bold" className="text-muted-foreground group-hover/btn:text-primary mb-3 transition-colors" />
                <span className="text-[10px] font-extrabold text-muted-foreground group-hover/btn:text-foreground text-center uppercase tracking-widest">
                    {fileName || (current ? "Replace Document" : "Select File")}
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
