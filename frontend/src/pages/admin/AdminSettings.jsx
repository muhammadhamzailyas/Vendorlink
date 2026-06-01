import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Gear as Settings, 
  Database, 
  Bell, 
  Envelope,
  ArrowsClockwise,
  FloppyDisk,
  Lock,
  Sliders,
  CreditCard,
  UserCheck,
  ClipboardText,
  Robot,
  ShieldWarning,
  Trash,
  DownloadSimple,
  Warning,
  CurrencyDollar,
  Clock,
  Buildings,
  WarningCircle,
  FileText,
  IdentificationCard,
  ChartLineUp,
  HardDrives,
  Prohibit,
  UserPlus
} from "@phosphor-icons/react";
import { 
  Button, 
  Card, 
  Input, 
  Switch, 
  PageTransition,
  Skeleton,
  Separator,
  Dialog,
  Label,
  RadixSelect,
  RadixSelectTrigger,
  RadixSelectValue,
  RadixSelectContent,
  RadixSelectItem
} from "@/components/ui";
import toastUtil from "@/lib/toast";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";
import { cn } from "@/lib/cn";
import { usePageMeta } from "@/hooks/usePageMeta";

const AdminSettings = () => {
  usePageMeta("Admin Settings", "Manage platform-wide financial, verification, and AI configurations");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    // Financial & Commission Controls
    serviceFeePercentage: 10,
    minWithdrawalLimit: 50,
    maxWithdrawalLimit: 5000,
    taxRate: 5,

    // Onboarding & Verification
    registrationMode: "manual", // auto-approve, manual
    requireCNIC: true,
    requireNTN: true,
    requireBusinessLicense: true,
    kycSensitivity: "standard", // low, standard, high

    // AI Ranking Configuration
    matchingSensitivity: 75,
    aiModel: "gemini-2.0-flash",
    systemPrompt: "Analyze vendor proposals strictly against task requirements...",

    // Platform Limits
    maxActiveTasksPerCompany: 10,
    maxDailyProposalsPerVendor: 5,
    maxFileUploadSizeMB: 10,

    // Security & System
    maintenanceMode: false,
    sessionExpiryHours: 24,
    enforceStrongPasswords: true,

    // Communications
    systemAlertBanner: "",
    supportEmail: "support.vendorlink@gmail.com",
    notificationFrequency: "immediate", // immediate, daily-digest
  });

  useEffect(() => {
    // Simulate loading settings from API
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      toastUtil.success("Global configuration updated successfully");
    } catch {
      toastUtil.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-10">
        <form onSubmit={handleSave} className="space-y-10">
          
          {/* Financial & Commission Controls */}
          <FormSection
            title="Financial & Commission"
            description="Manage platform service fees and withdrawal thresholds."
          >
            <FormFieldGrid>
              <Input 
                label="Service Fee (%)" 
                type="number"
                value={settings.serviceFeePercentage}
                onChange={(e) => setSettings({...settings, serviceFeePercentage: e.target.value})}
                icon={<CurrencyDollar />}
                className="font-bold uppercase tracking-tight text-[11px]"
              />
              <Input 
                label="Tax Rate (%)" 
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({...settings, taxRate: e.target.value})}
                icon={<FileText />}
                className="font-bold uppercase tracking-tight text-[11px]"
              />
              <Input 
                label="Min Withdrawal ($)" 
                type="number"
                value={settings.minWithdrawalLimit}
                onChange={(e) => setSettings({...settings, minWithdrawalLimit: e.target.value})}
                icon={<CreditCard />}
                className="font-bold uppercase tracking-tight text-[11px]"
              />
              <Input 
                label="Max Withdrawal ($)" 
                type="number"
                value={settings.maxWithdrawalLimit}
                onChange={(e) => setSettings({...settings, maxWithdrawalLimit: e.target.value})}
                icon={<CreditCard />}
                className="font-bold uppercase tracking-tight text-[11px]"
              />
            </FormFieldGrid>
          </FormSection>

          {/* Onboarding & Verification */}
          <FormSection
            title="Onboarding & Verification"
            description="Configure how new users are vetted and approved."
          >
            <div className="space-y-6">
              <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold uppercase tracking-tight text-foreground">Registration Mode</p>
                      <p className="text-xs text-muted-foreground font-medium">Switch between immediate access and manual admin vetting</p>
                    </div>
                    <div className="flex bg-background/50 p-1 rounded-xl border border-border">
                        <button 
                            type="button"
                            onClick={() => setSettings({...settings, registrationMode: "auto"})}
                            className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", settings.registrationMode === "auto" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            Auto
                        </button>
                        <button 
                            type="button"
                            onClick={() => setSettings({...settings, registrationMode: "manual"})}
                            className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", settings.registrationMode === "manual" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            Manual
                        </button>
                    </div>
                </Card.Content>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                      { id: 'requireCNIC', label: 'Require CNIC/ID', icon: IdentificationCard },
                      { id: 'requireNTN', label: 'Require NTN/Tax', icon: FileText },
                      { id: 'requireBusinessLicense', label: 'Require License', icon: Buildings }
                  ].map(item => (
                      <Card key={item.id} className="bg-muted/30 border-none shadow-none">
                          <Card.Content className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <item.icon size={16} className="text-muted-foreground" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                              </div>
                              <Switch 
                                  checked={settings[item.id]} 
                                  onCheckedChange={(val) => setSettings({...settings, [item.id]: val})}
                              />
                          </Card.Content>
                      </Card>
                  ))}
              </div>
            </div>
          </FormSection>

          {/* AI Ranking Configuration */}
          <FormSection
            title="AI Ranking Engine"
            description="Fine-tune the intelligence behind vendor matching."
          >
            <div className="space-y-6">
                <FormFieldGrid>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Model Engine</Label>
                        <RadixSelect value={settings.aiModel} onValueChange={(val) => setSettings({...settings, aiModel: val})}>
                            <RadixSelectTrigger className="h-12 bg-muted/30 border-none !normal-case !tracking-normal">
                                <RadixSelectValue placeholder="Select Model" />
                            </RadixSelectTrigger>
                            <RadixSelectContent>
                                <RadixSelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</RadixSelectItem>
                                <RadixSelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</RadixSelectItem>
                                <RadixSelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</RadixSelectItem>
                            </RadixSelectContent>
                        </RadixSelect>
                    </div>
                    <Input 
                        label="Matching Sensitivity (%)" 
                        type="number"
                        value={settings.matchingSensitivity}
                        onChange={(e) => setSettings({...settings, matchingSensitivity: e.target.value})}
                        icon={<ChartLineUp />}
                        className="font-bold uppercase tracking-tight text-[11px]"
                    />
                </FormFieldGrid>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Global AI System Prompt</Label>
                    <textarea 
                        value={settings.systemPrompt}
                        onChange={(e) => setSettings({...settings, systemPrompt: e.target.value})}
                        className="w-full min-h-[100px] rounded-xl border-none bg-muted/30 p-4 text-sm font-medium text-foreground focus:ring-2 focus:ring-ring/20 outline-none transition-all"
                    />
                </div>
            </div>
          </FormSection>

          {/* Platform Limits */}
          <FormSection
            title="Platform Capacity"
            description="Control usage volume and system resource limits."
          >
            <FormFieldGrid>
              <Input 
                label="Max Active Tasks / Company" 
                type="number"
                value={settings.maxActiveTasksPerCompany}
                onChange={(e) => setSettings({...settings, maxActiveTasksPerCompany: e.target.value})}
                icon={<Buildings />}
                className="font-bold uppercase tracking-tight text-[11px]"
              />
              <Input 
                label="Max Daily Proposals / Vendor" 
                type="number"
                value={settings.maxDailyProposalsPerVendor}
                onChange={(e) => setSettings({...settings, maxDailyProposalsPerVendor: e.target.value})}
                icon={<ClipboardText />}
                className="font-bold uppercase tracking-tight text-[11px]"
              />
              <Input 
                label="Max File Upload (MB)" 
                type="number"
                value={settings.maxFileUploadSizeMB}
                onChange={(e) => setSettings({...settings, maxFileUploadSizeMB: e.target.value})}
                icon={<HardDrives />}
                className="font-bold uppercase tracking-tight text-[11px]"
              />
            </FormFieldGrid>
          </FormSection>

          {/* Security & System */}
          <FormSection
            title="Security & Governance"
            description="Enforce account protection and system-level access."
          >
            <div className="space-y-4">
                <Card className="bg-muted/30 border-none shadow-none">
                    <Card.Content className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg border border-border bg-card p-2 text-warning">
                                <Prohibit className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold uppercase tracking-tight text-foreground">Maintenance Mode</p>
                                <p className="text-xs text-muted-foreground font-medium">Put platform in read-only mode for maintenance</p>
                            </div>
                        </div>
                        <Switch 
                            checked={settings.maintenanceMode} 
                            onCheckedChange={(val) => setSettings({...settings, maintenanceMode: val})}
                        />
                    </Card.Content>
                </Card>
                <FormFieldGrid>
                    <Input 
                        label="Session Expiry (Hours)" 
                        type="number"
                        value={settings.sessionExpiryHours}
                        onChange={(e) => setSettings({...settings, sessionExpiryHours: e.target.value})}
                        icon={<Clock />}
                        className="font-bold uppercase tracking-tight text-[11px]"
                    />
                    <Card className="bg-muted/30 border-none shadow-none">
                        <Card.Content className="flex items-center justify-between p-4 h-full">
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold uppercase tracking-tight text-foreground">Strong Passwords</p>
                                <p className="text-xs text-muted-foreground font-medium">Enforce complexity rules</p>
                            </div>
                            <Switch 
                                checked={settings.enforceStrongPasswords} 
                                onCheckedChange={(val) => setSettings({...settings, enforceStrongPasswords: val})}
                            />
                        </Card.Content>
                    </Card>
                </FormFieldGrid>
            </div>
          </FormSection>

          {/* Communications */}
          <FormSection
            title="Communications"
            description="Manage global alerts and support contact points."
          >
            <div className="space-y-6">
                <Input 
                    label="Platform Alert Banner" 
                    placeholder="Enter message to show to all users (leave empty to hide)"
                    value={settings.systemAlertBanner}
                    onChange={(e) => setSettings({...settings, systemAlertBanner: e.target.value})}
                    icon={<Bell />}
                    className="font-bold uppercase tracking-tight text-[11px]"
                />
                <FormFieldGrid>
                    <Input 
                        label="Support Contact Email" 
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                        icon={<Envelope />}
                        className="font-bold uppercase tracking-tight text-[11px]"
                    />
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Frequency</Label>
                        <RadixSelect value={settings.notificationFrequency} onValueChange={(val) => setSettings({...settings, notificationFrequency: val})}>
                            <RadixSelectTrigger className="h-12 bg-muted/30 border-none !normal-case !tracking-normal">
                                <RadixSelectValue placeholder="Select Frequency" />
                            </RadixSelectTrigger>
                            <RadixSelectContent>
                                <RadixSelectItem value="immediate">Immediate Alerts</RadixSelectItem>
                                <RadixSelectItem value="hourly">Hourly Summary</RadixSelectItem>
                                <RadixSelectItem value="daily-digest">Daily Digest</RadixSelectItem>
                            </RadixSelectContent>
                        </RadixSelect>
                    </div>
                </FormFieldGrid>
            </div>
          </FormSection>

          <div className="pt-10">
              <FormActionRow>
                <Button type="submit" loading={saving} className="font-semibold uppercase tracking-tight text-[13px] h-12 px-10 shadow-lg">
                  Save Platform Configuration
                </Button>
              </FormActionRow>
          </div>
        </form>
      </div>
    </PageTransition>
  );
};

export default AdminSettings;
