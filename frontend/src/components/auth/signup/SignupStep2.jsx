import React from "react";
import { Button, Input, Textarea } from "../../ui";
import AddressFields from "./AddressFields";
import CompanyBusinessFields from "./CompanyBusinessFields";
import VendorBusinessFields from "./VendorBusinessFields";
import SkillsTagInput from "./SkillsTagInput";
import MagnifyingGlassableSelect from "./SearchableSelect";

const RAW_VENDOR_CATEGORIES = [
  { value: "Web Development", label: "Web & Software Development" },
  { value: "Mobile Development", label: "Mobile App Development" },
  { value: "AI & Data Science", label: "AI, Machine Learning & Data Science" },
  { value: "Graphic Design", label: "Graphics, Design & Branding" },
  { value: "Digital Marketing", label: "Digital Marketing, SEO & Social Media" },
  { value: "Writing & Translation", label: "Writing, Content & Translation" },
  { value: "Video & Animation", label: "Video, Animation & Motion Graphics" },
  { value: "Music & Audio", label: "Music, Audio & Voice-over" },
  { value: "Business & Consulting", label: "Business, Consulting & Strategy" },
  { value: "Sales & Support", label: "Sales, CRM & Customer Support" },
  { value: "Accounting & Finance", label: "Accounting, Tax & Finance" },
  { value: "Legal", label: "Legal, Contract & Compliance" },
  { value: "Architecture", label: "Architecture & Interior Design" },
  { value: "Engineering", label: "Engineering & Manufacturing" },
];

const VENDOR_CATEGORY_OPTIONS = [
  ...RAW_VENDOR_CATEGORIES.sort((a, b) => a.label.localeCompare(b.label)),
  { value: "Other", label: "Other / General Services" },
];

const SignupStep2 = ({
  data,
  errors = {},
  onChange,
  isCompany,
  onSubmit,
  onBack,
  loading,
  isSubmitDisabled,
}) => (
  <div className="space-y-6">
    <div className="space-y-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">
        {isCompany ? "Business Information" : "Professional Information"}
        </p>
        
        {isCompany ? (
        <CompanyBusinessFields data={data} errors={errors} onChange={onChange} />
        ) : (
        <>
            <VendorBusinessFields data={data} errors={errors} onChange={onChange} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MagnifyingGlassableSelect
                value={data.category}
                placeholder="Service Category"
                searchPlaceholder="Search category..."
                options={VENDOR_CATEGORY_OPTIONS}
                error={errors.category}
                onChange={(val) => onChange({ category: val })}
                />
                <Input
                placeholder="Years of Experience"
                type="number"
                numericOnly
                value={data.yearsOfExperience}
                error={errors.yearsOfExperience}
                onChange={(e) => onChange({ yearsOfExperience: e.target.value })}
                />
            </div>

            <SkillsTagInput 
                skills={data.skills}
                skillsInput={data.skillsInput}
                onChange={(val) => onChange({ skillsInput: val })}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const val = data.skillsInput.trim();
                        if (val && !data.skills.includes(val)) {
                            onChange({ skills: [...data.skills, val], skillsInput: '' });
                        }
                    }
                }}
                onBlur={() => {
                    const val = data.skillsInput.trim();
                    if (val && !data.skills.includes(val)) {
                        onChange({ skills: [...data.skills, val], skillsInput: '' });
                    }
                }}
                onRemove={(skill) => onChange({ skills: data.skills.filter(s => s !== skill) })}
            />

            <Input
                placeholder="Portfolio URL (Optional)"
                value={data.portfolioURL}
                onChange={(e) => onChange({ portfolioURL: e.target.value })}
            />

            <Textarea
                className="min-h-24"
                placeholder="Brief Bio / Professional Summary..."
                value={data.bio}
                error={errors.bio}
                onChange={(e) => onChange({ bio: e.target.value })}
            />
        </>
        )}
    </div>

    <AddressFields data={data} errors={errors} onChange={onChange} />

    <div className="flex gap-4 pt-4 border-t border-border/50">
      <Button variant="secondary" onClick={onBack} disabled={loading} size="lg" className="flex-1 font-normal">Back</Button>
      <Button variant="primary" onClick={onSubmit} loading={loading} disabled={loading || isSubmitDisabled} size="lg" className="flex-1 shadow-soft font-normal">
        {loading ? "Saving..." : "Continue"}
      </Button>
    </div>
  </div>
);

export default SignupStep2;
