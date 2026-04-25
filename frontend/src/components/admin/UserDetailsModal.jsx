import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { 
  CaretDown, 
  CaretUp, 
  User, 
  Buildings, 
  Briefcase, 
  MapPin, 
  FileText, 
  Info,
  ArrowSquareOut
} from "@phosphor-icons/react";
import { Dialog, Button, DetailField, Badge } from "../ui";
import StatusChip from "../shared/StatusChip";
import UserAvatar from "../shared/UserAvatar";

const UserDetailsModal = ({ open, user, onX, onDownloadPDF }) => {
  const [showMore, setShowMore] = useState(false);
  
  // Reset expansion state whenever the modal opens or the target user changes
  useEffect(() => {
    if (open) {
      setShowMore(false);
    }
  }, [open, user?._id]);

  if (!open || !user) return null;

  const isAdmin = user.role === "admin";
  const displayName = isAdmin ? "Admin" : (user.companyName || user.username || "User Profile");
  const isCompany = user.role === "company";
  const profile = isCompany ? user.companyProfile : user.vendorProfile;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8002/api";
  const backendUrl = API_BASE_URL.replace("/api", "");

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-4 opacity-70">
      <Icon size={14} weight="bold" />
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</h4>
    </div>
  );

  const DocumentLink = ({ label, value }) => {
    if (!value || value === "no-file-uploaded") return null;
    
    const fileUrl = `${backendUrl}/${value}`;
    const handleShowFile = () => {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    };

    return (
      <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
        <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={handleShowFile}
          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-foreground text-background px-3 py-1.5 rounded-lg hover:opacity-80 transition-all cursor-pointer shadow-sm"
        >
          View <ArrowSquareOut size={12} weight="bold" />
        </button>
      </div>
    );
  };

  const DescriptionContent = () => {
    const desc = profile?.description || profile?.bio;
    if (!desc) return null;
    return (
      <div className="mt-6">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          {isCompany ? "Description" : "Professional Bio"}
        </p>
        <div className="text-xs font-medium leading-relaxed text-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
          {desc}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} className="sm:max-w-2xl">
      <Dialog.Header className="border-b-0 px-8 pt-10 pb-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <UserAvatar user={user} name={displayName} size="xl" className="border-2 border-background shadow-md" />
          <div className="space-y-1.5 w-full text-center">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase text-center w-full">
              {displayName}
            </Dialog.Title>
            <div className="flex items-center justify-center gap-2">
               <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">{user.role}</Badge>
               <StatusChip status={user.status} size="small" />
            </div>
            <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center w-full mt-2">
              User Profile Analysis
            </Dialog.Description>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-10 pb-10 bg-card space-y-8">
        {/* Account Details */}
        <section>
          <SectionHeader icon={User} title="Account Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
            <DetailField label="Full Name" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
              {user.fullName || "—"}
            </DetailField>
            <DetailField label="Email Address" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
              {user.email || "—"}
            </DetailField>
            <DetailField label="Phone Number" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
              {user.phone || "—"}
            </DetailField>
            <DetailField label="Username" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
              {user.username || "—"}
            </DetailField>
          </div>
        </section>

        {/* Profile Details (Company or Vendor) */}
        {!isAdmin && profile && (
          <section className="pt-8 border-t border-border/50">
            <SectionHeader icon={isCompany ? Buildings : Briefcase} title={isCompany ? "Business Profile" : "Professional Profile"} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
              {isCompany ? (
                <>
                  <DetailField label="Company Name" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                    {profile.companyName || "—"}
                  </DetailField>
                  <DetailField label="Industry" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                    {profile.industry || "—"}
                  </DetailField>
                  <DetailField label="Registration No." labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                    {profile.registrationNumber || "—"}
                  </DetailField>
                  <DetailField label="Tax ID / NTN" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                    {profile.ntn || "—"}
                  </DetailField>
                </>
              ) : (
                <>
                  <DetailField label="Vendor Type" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                    {profile.vendorType || "—"}
                  </DetailField>
                  <DetailField label="Category" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                    {profile.category || "—"}
                  </DetailField>
                  <DetailField label="Experience" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                    {profile.yearsOfExperience ? `${profile.yearsOfExperience} Years` : "—"}
                  </DetailField>
                  <DetailField label="National ID / CNIC" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                    {profile.cnicNumber || "—"}
                  </DetailField>
                </>
              )}

              {showMore && (
                <>
                  {isCompany ? (
                    <>
                      <DetailField label="Company Size" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                        {profile.companySize || "—"}
                      </DetailField>
                      <DetailField label="Year Established" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                        {profile.yearEstablished || "—"}
                      </DetailField>
                      <DetailField label="Website" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                        {profile.website || "—"}
                      </DetailField>
                    </>
                  ) : (
                    <>
                      <DetailField label="Skills" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                        {Array.isArray(profile.skills) ? profile.skills.join(", ") : (profile.skills || "—")}
                      </DetailField>
                      <DetailField label="Portfolio URL" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                        {profile.portfolioURL || "—"}
                      </DetailField>
                    </>
                  )}
                  <DetailField label="Member Since" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                    {dayjs(user.createdAt).format("MMM DD, YYYY")}
                  </DetailField>
                </>
              )}
            </div>

            {/* Description is part of the Profile section, below the details grid in collapsed mode */}
            {!showMore && <DescriptionContent />}

            {showMore && (
              <div className="mt-10 animate-in fade-in slide-in-from-top-2 duration-300 space-y-10">
                <div className="space-y-6">
                  <SectionHeader icon={MapPin} title="Address Details" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    <DetailField label="Street Address" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                      {profile.streetAddress || "—"}
                    </DetailField>
                    <DetailField label="City" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                      {profile.city || "—"}
                    </DetailField>
                    <DetailField label="Province / State" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                      {profile.provinceName || "—"}
                    </DetailField>
                    <DetailField label="Country" labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" valueClassName="text-sm font-bold text-foreground">
                      {profile.countryName || "—"}
                    </DetailField>
                  </div>
                </div>

                <div className="space-y-6">
                  <SectionHeader icon={FileText} title="Documents" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isCompany ? (
                      <>
                        <DocumentLink label="Reg. Certificate" value={profile.registrationCertificate} />
                        <DocumentLink label="NTN Certificate" value={profile.ntnCertificate} />
                        <DocumentLink label="Other Document" value={profile.supportingDocument} />
                      </>
                    ) : (
                      <>
                        <DocumentLink label="CNIC Front" value={profile.cnicFront} />
                        <DocumentLink label="CNIC Back" value={profile.cnicBack} />
                        <DocumentLink label="Business License" value={profile.businessLicense} />
                        <DocumentLink label="Portfolio Docs" value={profile.portfolioSamples} />
                      </>
                    )}
                  </div>
                </div>

                {/* Description at the absolute bottom in expanded mode */}
                <DescriptionContent />
              </div>
            )}

            <div className="flex justify-center mt-8">
              <button 
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all duration-200 group border border-border/40 px-4 py-2 rounded-full hover:bg-muted/50"
              >
                {showMore ? "Show Less" : "Show More"}
                {showMore ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
              </button>
            </div>
          </section>
        )}

        {/* Status Alert Box */}
        {user.status === 'deactivated' && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20">
            <Info size={20} weight="bold" className="text-warning shrink-0" />
            <p className="text-xs font-medium text-warning/80 leading-relaxed">
              Account restricted. User can appeal for reactivation through their portal.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
          <Button 
            variant="secondary" 
            onClick={onX} 
            className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl"
          >
            Close
          </Button>
          <Button 
            onClick={() => onDownloadPDF(user)} 
            className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl"
          >
            Export Profile
          </Button>
        </div>
      </Dialog.Body>
    </Dialog>
  );
};

export default UserDetailsModal;
