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
  ArrowSquareOut,
  CheckCircle,
  XCircle
} from "@phosphor-icons/react";
import { Dialog, Button, DetailField, Badge, Textarea, Label } from "../ui";
import StatusChip from "../shared/StatusChip";
import UserAvatar from "../shared/UserAvatar";
import { formatCategory } from "../../lib/status";

const provinceMap = {
  "pb": "Punjab",
  "sd": "Sindh",
  "kp": "Khyber Pakhtunkhwa",
  "ba": "Balochistan",
  "is": "Islamabad Capital Territory",
  "aj": "Azad Jammu & Kashmir",
  "gb": "Gilgit-Baltistan"
};

const formatProvince = (code) => {
  if (!code) return "";
  const normalized = code.toLowerCase().trim();
  return provinceMap[normalized] || code;
};

const UserDetailsModal = ({ 
  open, 
  user, 
  onX, 
  onDownloadPDF,
  onApprove,
  onReject,
  actionLoading = false
}) => {
  const [showMore, setShowMore] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  useEffect(() => {
    if (open) {
      setShowMore(false);
      setConfirmApproveOpen(false);
      setConfirmRejectOpen(false);
      setRejectionReason("");
    }
  }, [open, user?._id]);

  if (!open || !user) return null;

  const isAdmin = user.role === "admin";
  const displayName = isAdmin ? "Admin" : (user.companyName || user.fullName || user.email || "User Profile");
  const isCompany = user.role === "company";
  const profile = isCompany ? user.companyProfile : user.vendorProfile;
  const isPending = user.status === "pending";

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8002/api";
  const backendRoot = API_BASE_URL.replace("/api", "");

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-4 opacity-70">
      <Icon size={14} weight="bold" />
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</h4>
    </div>
  );

  const DocumentLink = ({ label, value }) => {
    if (!value || value === "no-file-uploaded" || value === "") return null;
    const processedPath = value.startsWith('uploads/') ? value.replace('uploads/', 'documents/') : value;
    const fileUrl = `${backendRoot}/${processedPath}`;
    
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors w-full">
        <div className="flex items-center gap-3">
            <FileText size={18} weight="duotone" className="text-muted-foreground" />
            <span className="text-[11px] font-bold uppercase tracking-tight text-foreground">{label}</span>
        </div>
        <button
          type="button"
          onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-80 transition-all cursor-pointer shadow-sm"
        >
          View Document <ArrowSquareOut size={12} weight="bold" />
        </button>
      </div>
    );
  };

  const ConditionalField = ({ label, value, ...props }) => {
    if (!value || value === "—" || (Array.isArray(value) && value.length === 0)) return null;
    return (
      <DetailField 
        label={label} 
        labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 justify-center sm:justify-start" 
        valueClassName="text-sm font-bold text-foreground"
        {...props}
      >
        {value}
      </DetailField>
    );
  };

  return (
    <>
      <Dialog open={open} onX={onX} className="sm:max-w-2xl">
        <Dialog.Header onX={onX} className="border-b-0 px-8 pt-10 pb-6 text-center">
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
          <section>
            <SectionHeader icon={User} title="Account Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-center sm:text-left">
              <ConditionalField label="Full Name" value={user.fullName} />
              <ConditionalField label="Email Address" value={user.email} />
              <ConditionalField label="Phone Number" value={user.phone} />
            </div>
          </section>

          {!isAdmin && profile && (
            <>
              <section className="pt-8 border-t border-border/50">
                <SectionHeader icon={isCompany ? Buildings : Briefcase} title={isCompany ? "Business Profile" : "Professional Profile"} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-center sm:text-left">
                  {isCompany ? (
                    <>
                      <ConditionalField label="Company Name" value={profile.companyName} />
                      <ConditionalField label="Industry" value={profile.industry} />
                      <ConditionalField label="Registration No." value={profile.registrationNumber} />
                      <ConditionalField label="Tax ID / NTN" value={profile.ntn} />
                    </>
                  ) : (
                    <>
                      <ConditionalField label="Vendor Type" value={profile.vendorType} />
                      <ConditionalField label="Category" value={formatCategory(profile.category)} />
                      <ConditionalField label="Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} Years` : null} />
                      <ConditionalField label="National ID / CNIC" value={profile.cnicNumber} />
                      <ConditionalField label="Business Name" value={profile.businessName} />
                    </>
                  )}

                  {showMore && (
                    <>
                      {isCompany ? (
                        <>
                          <ConditionalField label="Company Size" value={profile.companySize} />
                          <ConditionalField label="Year Established" value={profile.yearEstablished} />
                          <ConditionalField label="Website" value={profile.website} />
                        </>
                      ) : (
                        <>
                          <ConditionalField label="Skills" value={Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills} />
                          <ConditionalField label="Portfolio URL" value={profile.portfolioURL} />
                        </>
                      )}
                      <ConditionalField label="Member Since" value={dayjs(user.createdAt).format("MMM DD, YYYY")} />
                    </>
                  )}
                  
                  {profile.description || profile.bio ? (
                    <DetailField label={isCompany ? "Description" : "Professional Bio"} colSpan={2} labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 justify-center sm:justify-start" valueClassName="text-sm font-medium leading-relaxed text-foreground">
                      {profile.description || profile.bio}
                    </DetailField>
                  ) : null}
                </div>
              </section>

              <section className="pt-8 border-t border-border/50">
                <SectionHeader icon={MapPin} title="Address Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-center sm:text-left">
                  <ConditionalField label="Street Address" value={profile.streetAddress} />
                  <ConditionalField label="City" value={profile.city} />
                  <ConditionalField label="Province / State" value={formatProvince(profile.province)} />
                  <ConditionalField label="Postal / Zip Code" value={profile.zipCode} />
                  <ConditionalField label="Country" value={profile.country} />
                </div>
              </section>

              {showMore && (
                <div className="mt-10 animate-in fade-in slide-in-from-top-2 duration-300 space-y-10 border-t border-border/50 pt-8">
                  <div className="space-y-6">
                    <SectionHeader icon={FileText} title="Documents" />
                    <div className="flex flex-col gap-3">
                      {isCompany ? (
                        <>
                          <DocumentLink label="Registration Certificate" value={profile.registrationCertificateURL} />
                          <DocumentLink label="NTN Certificate" value={profile.ntnCertificateURL} />
                          <DocumentLink label="Other Document" value={profile.supportingDocumentURL} />
                        </>
                      ) : (
                        <>
                          <DocumentLink label="CNIC Front" value={profile.cnicFrontURL} />
                          <DocumentLink label="CNIC Back" value={profile.cnicBackURL} />
                          <DocumentLink label="Business License" value={profile.businessLicenseURL} />
                          <DocumentLink label="Portfolio Samples" value={profile.portfolioSamplesURL} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-8 border-t border-border/30 pt-6">
                <button 
                  onClick={() => setShowMore(!showMore)} 
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all duration-200 group border border-border/40 px-4 py-2 rounded-full hover:bg-muted/50 cursor-pointer"
                >
                  {showMore ? "Show Less" : "Show More"}
                  {showMore ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
                </button>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
            {isPending && onApprove && onReject ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmRejectOpen(true)} 
                  className="w-full font-black uppercase tracking-widest text-[10px] h-12 rounded-xl text-foreground hover:bg-muted transition-all"
                >
                  Reject Profile
                </Button>
                <Button 
                  onClick={() => setConfirmApproveOpen(true)} 
                  className="w-full font-black uppercase tracking-widest text-[10px] h-12 rounded-xl bg-foreground text-background hover:opacity-90 shadow-md transition-all"
                >
                  Approve Profile
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={onX} className="w-full font-semibold uppercase tracking-tight text-[11px] h-12 rounded-xl">Close</Button>
                <Button onClick={() => onDownloadPDF(user)} className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl bg-foreground text-background hover:opacity-90 shadow-md">Export Profile</Button>
              </>
            )}
          </div>
        </Dialog.Body>
      </Dialog>

      <Dialog open={confirmApproveOpen} onX={() => setConfirmApproveOpen(false)} className="max-w-md">
        <Dialog.Header onX={() => setConfirmApproveOpen(false)} className="border-b-0 pt-10 pb-4 text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="p-3 rounded-full bg-success/10 text-success"><CheckCircle size={32} weight="bold" /></div>
                <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">Approve Profile</Dialog.Title>
                <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-8">Confirm verification for {displayName}?</Dialog.Description>
            </div>
        </Dialog.Header>
        <Dialog.Body className="px-10 pb-10">
            <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" onClick={() => setConfirmApproveOpen(false)} className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl">Cancel</Button>
                <Button onClick={() => { onApprove(user._id); setConfirmApproveOpen(false); }} loading={actionLoading} className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl bg-foreground text-background shadow-md">Confirm</Button>
            </div>
        </Dialog.Body>
      </Dialog>

      <Dialog open={confirmRejectOpen} onX={() => setConfirmRejectOpen(false)} className="max-w-md">
        <Dialog.Header onX={() => setConfirmRejectOpen(false)} className="border-b-0 pt-10 pb-4 text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="p-3 rounded-full bg-danger/10 text-danger"><XCircle size={32} weight="bold" /></div>
                <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">Reject Profile</Dialog.Title>
                <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-8">User will be notified to update their information.</Dialog.Description>
            </div>
        </Dialog.Header>
        <Dialog.Body className="px-10 pb-10 space-y-6">
            <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Reason for Rejection</Label>
                <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Provide details to help the user..." className="min-h-[100px] rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="secondary" onClick={() => setConfirmRejectOpen(false)} className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl">Cancel</Button>
                <Button variant="danger" onClick={() => { if (!rejectionReason.trim()) return; onReject(user._id, rejectionReason.trim()); setConfirmRejectOpen(false); }} loading={actionLoading} disabled={!rejectionReason.trim()} className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl shadow-md">Confirm</Button>
            </div>
        </Dialog.Body>
      </Dialog>
    </>
  );
};

export default UserDetailsModal;

