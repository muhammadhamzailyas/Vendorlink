import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Storefront,
  FloppyDisk,
  SealCheck,
  User,
} from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toastUtil from "@/lib/toast";
import api from "@/services/api";
import UserAvatar from "@/components/shared/UserAvatar";
import StatusChip from "@/components/shared/StatusChip";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";
import { Button, Card, Input, PageTransition, Textarea } from "@/components/ui";

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
  });

const UserProfile = ({ userType = "company" }) => {
  const [profileMeta, setProfileMeta] = useState({
    role: userType,
    status: "pending",
  });
  const [initialData, setInitialData] = useState(() => getDefaultValues(userType));
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
    () => JSON.stringify(formData) !== JSON.stringify(initialData),
    [formData, initialData]
  );

  const getCurrentUser = () => JSON.parse(localStorage.getItem("user") || "{}");
  const getCurrentUserId = () => {
    const localUser = getCurrentUser();
    return localUser._id || localUser.id || "";
  };

  const hydrateForm = useCallback((payload, fallbackUser) => {
    const userDataFromApi = payload.user || fallbackUser;
    const companyData = payload.company || {};
    const vendorData = payload.vendor || {};

    const roleProfile = userType === "vendor" ? vendorData : companyData;
    const resolvedName =
      userType === "vendor"
        ? roleProfile.fullName || userDataFromApi.username || ""
        : roleProfile.companyName || userDataFromApi.companyName || userDataFromApi.username || "";

    const nextForm = {
      companyName: resolvedName,
      username: userDataFromApi.username || "",
      email: userDataFromApi.email || "",
      [userType === "vendor" ? "category" : "industry"]:
        roleProfile[userType === "vendor" ? "category" : "industry"] || "",
      skills: Array.isArray(roleProfile.skills) ? roleProfile.skills.join(", ") : "",
      phone: roleProfile.phone || "",
      location: roleProfile.location || "",
      description: roleProfile.description || roleProfile.bio || "",
      profileImage:
        userDataFromApi.profileImage ||
        roleProfile.profileImage ||
        roleProfile.profilePic ||
        roleProfile.avatar ||
        roleProfile.avatarUrl ||
        "",
    };

    setProfileMeta({
      role: userDataFromApi.role || userType,
      status: userDataFromApi.status || "pending",
    });
    reset(nextForm);
    setInitialData(nextForm);
  }, [reset, userType]);

  const fetchProfile = useCallback(async () => {
    try {
      const localUser = getCurrentUser();
      const onboardingRes = await api.get("/onboarding/me");
      hydrateForm(onboardingRes.data || {}, localUser);
    } catch (error) {
      console.error("Error fetching profile:", error);
      const userData = getCurrentUser();
      hydrateForm({ user: userData }, userData);
    }
  }, [hydrateForm]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const handleSave = async (data) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error("User ID not found in local storage");
      }

      // 1) Save user-level profile fields.
      const userUpdateRes = await api.put("/auth/me", {
        username: data.username,
        email: data.email,
        profileImage: data.profileImage || "",
      });

      // 2) Save role-specific business/profile fields.
      const rolePayload =
        userType === "vendor"
          ? {
              fullName: data.companyName,
              category: data.category,
              skills: data.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean),
              bio: data.description,
              phone: data.phone,
              location: data.location,
            }
          : {
              companyName: data.companyName,
              industry: data.industry,
              description: data.description,
              phone: data.phone,
              location: data.location,
            };

      await api.put("/onboarding/step2/business", rolePayload);

      const localUser = getCurrentUser();
      const backendUser = userUpdateRes?.data?.user || {};
      const mergedUser = {
        ...localUser,
        ...backendUser,
        companyName: data.companyName,
        phone: data.phone,
        location: data.location,
        description: data.description,
        profileImage: data.profileImage || "",
        _id: localUser._id || localUser.id,
        id: localUser.id || localUser._id,
      };

      localStorage.setItem("user", JSON.stringify(mergedUser));
      window.dispatchEvent(new CustomEvent("userStatusUpdated", { detail: mergedUser }));

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
        <div>
           <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">{config.title}</h2>
           <p className="text-sm text-muted-foreground">Review and update your public and contact information.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <Card className="overflow-hidden bg-card border-border">
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

                <div className="rounded-2xl border border-border bg-muted p-5">
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
          </aside>

          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit(handleSave)} noValidate>
              <FormSection
                title="Profile Details"
                description="Keep your business and contact information up to date."
                footer={hasUnsavedChanges ? (
                  <FormActionRow className="bg-muted/30 border-t border-border px-6 py-4">
                    <Button
                      type="submit"
                      loading={isSubmitting}
                      disabled={isSubmitting || !isValid}
                      className="w-full sm:w-auto font-black uppercase tracking-widest text-xs px-8 h-12 rounded-xl shadow-soft"
                    >
                      <FloppyDisk className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </FormActionRow>
                ) : null}
              >
                <div className="space-y-6">
                  <FormFieldGrid>
                    <Input
                      label="Display Name"
                      error={errors.companyName?.message}
                      {...register("companyName")}
                    />

                    <Input
                      label="Username"
                      error={errors.username?.message}
                      {...register("username")}
                    />

                    <Input
                      label="Email"
                      type="email"
                      error={errors.email?.message}
                      {...register("email")}
                    />

                    <Input
                      label={config.typeField}
                      error={errors[config.typeKey]?.message}
                      {...register(config.typeKey)}
                    />

                    <Input
                      label="Phone"
                      error={errors.phone?.message}
                      {...register("phone")}
                    />

                    <Input
                      label="Location"
                      error={errors.location?.message}
                      {...register("location")}
                    />
                  </FormFieldGrid>

                  <Textarea
                    label={userType === "vendor" ? "Bio" : "Description"}
                    rows={4}
                    error={errors.description?.message}
                    {...register("description")}
                  />

                  {userType === "vendor" && (
                    <Input
                      label="Skills (comma separated)"
                      error={errors.skills?.message}
                      {...register("skills")}
                    />
                  )}
                </div>
              </FormSection>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default UserProfile;
