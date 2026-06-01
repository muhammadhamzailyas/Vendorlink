import React from "react";
import { Button, Input, Textarea } from "../../ui";
import AddressFields from "./AddressFields";
import CompanyBusinessFields from "./CompanyBusinessFields";
import VendorBusinessFields from "./VendorBusinessFields";
import SkillsTagInput from "./SkillsTagInput";
import SearchableSelect from "./SearchableSelect";

const VENDOR_CATEGORY_OPTIONS = [
  { value: "3D Modeling & Rendering", label: "3D Modeling & Rendering" },
  { value: "AI & Machine Learning", label: "AI & Machine Learning" },
  { value: "Android App Development", label: "Android App Development" },
  { value: "Architecture & Interior Design", label: "Architecture & Interior Design" },
  { value: "Backend Development", label: "Backend Development" },
  { value: "Big Data & Analytics", label: "Big Data & Analytics" },
  { value: "Blockchain & Cryptocurrency", label: "Blockchain & Cryptocurrency" },
  { value: "Business Consulting", label: "Business Consulting" },
  { value: "CAD & Engineering", label: "CAD & Engineering" },
  { value: "Computer Vision", label: "Computer Vision" },
  { value: "Content Marketing", label: "Content Marketing" },
  { value: "Content Writing", label: "Content Writing" },
  { value: "Copywriting", label: "Copywriting" },
  { value: "Customer & Tech Support", label: "Customer & Tech Support" },
  { value: "Cybersecurity & Security Audit", label: "Cybersecurity & Security Audit" },
  { value: "Data Engineering", label: "Data Engineering" },
  { value: "Data Entry", label: "Data Entry" },
  { value: "Data Science & Analytics", label: "Data Science & Analytics" },
  { value: "Desktop Software Development", label: "Desktop Software Development" },
  { value: "DevOps & Cloud Computing", label: "DevOps & Cloud Computing" },
  { value: "Digital Marketing & SEO", label: "Digital Marketing & SEO" },
  { value: "E-commerce Development", label: "E-commerce Development" },
  { value: "Editing & Proofreading", label: "Editing & Proofreading" },
  { value: "Email Marketing", label: "Email Marketing" },
  { value: "Financial & Accounting", label: "Financial & Accounting" },
  { value: "Frontend Development", label: "Frontend Development" },
  { value: "Full-Stack Development", label: "Full-Stack Development" },
  { value: "Game Development", label: "Game Development" },
  { value: "Ghostwriting", label: "Ghostwriting" },
  { value: "Graphics & Brand Design", label: "Graphics & Brand Design" },
  { value: "HR & Recruitment", label: "HR & Recruitment" },
  { value: "Illustration", label: "Illustration" },
  { value: "iOS App Development", label: "iOS App Development" },
  { value: "IT Support & Troubleshooting", label: "IT Support & Troubleshooting" },
  { value: "Lead Generation", label: "Lead Generation" },
  { value: "Legal Services", label: "Legal Services" },
  { value: "Logo & Branding", label: "Logo & Branding" },
  { value: "Market Research", label: "Market Research" },
  { value: "Mobile App Development", label: "Mobile App Development" },
  { value: "Motion Graphics & Animation", label: "Motion Graphics & Animation" },
  { value: "Network Administration", label: "Network Administration" },
  { value: "NLP & Chatbots", label: "NLP & Chatbots" },
  { value: "Product Design", label: "Product Design" },
  { value: "Project Management", label: "Project Management" },
  { value: "SEO & SEM", label: "SEO & SEM" },
  { value: "Social Media Marketing", label: "Social Media Marketing" },
  { value: "Technical Writing", label: "Technical Writing" },
  { value: "Translation & Localization", label: "Translation & Localization" },
  { value: "UI/UX Design", label: "UI/UX Design" },
  { value: "Video Editing", label: "Video Editing" },
  { value: "Virtual Assistant", label: "Virtual Assistant" },
  { value: "Web Development", label: "Web Development" },
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
                <SearchableSelect
                value={data.category}
                placeholder="Service category"
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
                        const val = (e.overrideValue || data.skillsInput).trim();
                        if (val && !data.skills.some(s => s.toLowerCase() === val.toLowerCase())) {
                            onChange({ skills: [...data.skills, val], skillsInput: '' });
                        }
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

    <div className="grid-cols-2 grid gap-4 pt-4 border-t border-border/50">
      <Button variant="secondary" onClick={onBack} disabled={loading} size="lg" className="w-full flex-1 font-semibold">Back</Button>
      <Button variant="primary" onClick={onSubmit} loading={loading} disabled={loading || isSubmitDisabled} size="lg" className="w-full flex-1 shadow-soft font-semibold">
        {loading ? "Saving..." : "Continue"}
      </Button></div>
  </div>
);

export default SignupStep2;
