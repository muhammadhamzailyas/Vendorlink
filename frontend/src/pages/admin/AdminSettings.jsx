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
  WarningCircle
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
  Label
} from "@/components/ui";
import toastUtil from "@/lib/toast";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";
import { cn } from "@/lib/cn";

import { usePageMeta } from "@/hooks/usePageMeta";

const AdminSettings = () => {
  usePageMeta("Admin Settings", "Manage access preferences and account-level notifications");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  
  const [settings, setSettings] = useState({
    siteName: "VendorLink",
    contactEmail: "support.vendorlink@gmail.com",
    maintenanceMode: false,
    enableRegistration: true,
    requireApproval: true,
    emailNotifications: true,
    systemAlerts: true,
    backupFrequency: "daily",
    
    // Platform Fees & Payments
    commissionRate: 15,
    stripeLiveMode: false,
    minPayoutThreshold: 50,

    // Vendor Onboarding Rules
    autoApproveVendors: false,
    maxPendingAlert: 20,
    requireID: true,
    requireCompanyReg: true,
    requirePortfolio: false,

    // Contract & Task Policies
    contractExpiryDays: 30,
    allowReopenContracts: false,
    overdueThresholdDays: 3,

    // AI Ranking Settings
    enableAIRanking: true,
    weightRating: 40,
    weightResponseTime: 30,
    weightCompletionRate: 30,

    // Security & Sessions
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    require2FA: false,
  });

  useEffect(() => {
    // Simulate loading settings from API
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toastUtil.success("Settings saved successfully");
    } catch {
      toastUtil.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    toastUtil.info("Platform data reset initiated...");
    setConfirmResetOpen(false);
    // Real implementation would call API
  };

  const handleClearApplications = () => {
    toastUtil.success("Pending applications cleared");
  };

  const handleExportData = () => {
    toastUtil.success("Exporting all user data...");
  };

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-10">
        <form onSubmit={handleSave} className="space-y-10">
          <FormSection
            title="General Configuration"
            description="Basic platform identity and contact details."
          >
            <FormFieldGrid>
              <Input 
                label="Site Name" 
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="font-bold uppercase tracking-tight text-[11px]"
              />
              <Input 
                label="Admin Contact Email" 
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                className="font-bold uppercase tracking-tight text-[11px]"
              />
            </FormFieldGrid>
          </FormSection>

          <FormSection
            title="Access & Security"
            description="Control user entry and platform availability."
          >
            <div className="space-y-4">
              {[
                { id: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Disable public access to the platform' },
                { id: 'enableRegistration', label: 'New Registrations', desc: 'Allow new users to create accounts' },
                { id: 'requireApproval', label: 'Require Admin Approval', desc: 'Manually verify all new accounts' }
              ].map(item => (
                <Card key={item.id} className="bg-muted/30 border-none shadow-none">
                  <Card.Content className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold uppercase tracking-tight text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                      </div>
                      <Switch 
                        checked={settings[item.id]} 
                        onCheckedChange={(val) => setSettings({...settings, [item.id]: val})}
                      />
                  </Card.Content>
                </Card>
              ))}
            </div>
          </FormSection>

          <FormSection
            title="Platform Fees & Payments"
            description="Manage financial thresholds and processing modes."
          >
            <FormFieldGrid>
                <Input 
                    label="Commission Rate (%)" 
                    type="number"
                    value={settings.commissionRate}
                    onChange={(e) => setSettings({...settings, commissionRate: e.target.value})}
                    icon={<CurrencyDollar />}
                    className="font-bold uppercase tracking-tight text-[11px]"
                />
                <Input 
                    label="Min Payout ($)" 
                    type="number"
                    value={settings.minPayoutThreshold}
                    onChange={(e) => setSettings({...settings, minPayoutThreshold: e.target.value})}
                    icon={<CreditCard />}
                    className="font-bold uppercase tracking-tight text-[11px]"
                />
                <Card className="bg-muted/30 border-none shadow-none col-span-full">
                    <Card.Content className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg border border-border bg-card p-2 text-muted-foreground">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold uppercase tracking-tight text-foreground">Stripe Live Mode</p>
                                <p className="text-xs text-muted-foreground font-medium">Use production keys for payment processing</p>
                            </div>
                        </div>
                        <Switch 
                            checked={settings.stripeLiveMode} 
                            onCheckedChange={(val) => setSettings({...settings, stripeLiveMode: val})}
                        />
                    </Card.Content>
                </Card>
            </FormFieldGrid>
          </FormSection>

          <FormSection
            title="Vendor Onboarding Rules"
            description="Define the requirements for new service providers."
          >
            <div className="space-y-4">
                <Card className="bg-muted/30 border-none shadow-none">
                    <Card.Content className="flex items-center justify-between p-4">
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold uppercase tracking-tight text-foreground">Auto-Approve Vendors</p>
                            <p className="text-xs text-muted-foreground font-medium">Bypass manual verification for new vendors</p>
                        </div>
                        <Switch 
                            checked={settings.autoApproveVendors} 
                            onCheckedChange={(val) => setSettings({...settings, autoApproveVendors: val})}
                        />
                    </Card.Content>
                </Card>
                <FormFieldGrid>
                    <Input 
                        label="Max Pending Threshold" 
                        type="number"
                        value={settings.maxPendingAlert}
                        onChange={(e) => setSettings({...settings, maxPendingAlert: e.target.value})}
                        icon={<UserCheck />}
                        className="font-bold uppercase tracking-tight text-[11px]"
                    />
                </FormFieldGrid>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { id: 'requireID', label: 'ID Verification', icon: UserCheck },
                        { id: 'requireCompanyReg', label: 'Registration', icon: Buildings },
                        { id: 'requirePortfolio', label: 'Portfolio', icon: ClipboardText }
                    ].map(item => (
                        <Card key={item.id} className="bg-muted/30 border-none shadow-none">
                            <Card.Content className="p-4 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
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

          <FormSection
            title="Contract & Task Policies"
            description="Global rules for marketplace agreements."
          >
            <FormFieldGrid>
                <Input 
                    label="Default Expiry (Days)" 
                    type="number"
                    value={settings.contractExpiryDays}
                    onChange={(e) => setSettings({...settings, contractExpiryDays: e.target.value})}
                    icon={<Clock />}
                    className="font-bold uppercase tracking-tight text-[11px]"
                />
                <Input 
                    label="Overdue Alert (Days)" 
                    type="number"
                    value={settings.overdueThresholdDays}
                    onChange={(e) => setSettings({...settings, overdueThresholdDays: e.target.value})}
                    icon={<WarningCircle />}
                    className="font-bold uppercase tracking-tight text-[11px]"
                />
                <Card className="bg-muted/30 border-none shadow-none col-span-full">
                    <Card.Content className="flex items-center justify-between p-4">
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold uppercase tracking-tight text-foreground">Allow Re-opening Contracts</p>
                            <p className="text-xs text-muted-foreground font-medium">Clients can re-open completed contracts within 7 days</p>
                        </div>
                        <Switch 
                            checked={settings.allowReopenContracts} 
                            onCheckedChange={(val) => setSettings({...settings, allowReopenContracts: val})}
                        />
                    </Card.Content>
                </Card>
            </FormFieldGrid>
          </FormSection>

          <FormSection
            title="AI Ranking Settings"
            description="Configure algorithmic vendor positioning."
          >
            <div className="space-y-6">
                <Card className="bg-muted/30 border-none shadow-none">
                    <Card.Content className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <Robot size={24} weight="duotone" className="text-info" />
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold uppercase tracking-tight text-foreground">Enable AI Ranking</p>
                                <p className="text-xs text-muted-foreground font-medium">Automatically rank vendors based on performance</p>
                            </div>
                        </div>
                        <Switch 
                            checked={settings.enableAIRanking} 
                            onCheckedChange={(val) => setSettings({...settings, enableAIRanking: val})}
                        />
                    </Card.Content>
                </Card>
                <FormFieldGrid>
                    <Input 
                        label="Rating Weight (%)" 
                        type="number"
                        value={settings.weightRating}
                        onChange={(e) => setSettings({...settings, weightRating: e.target.value})}
                        className="font-bold uppercase tracking-tight text-[11px]"
                    />
                    <Input 
                        label="Response Weight (%)" 
                        type="number"
                        value={settings.weightResponseTime}
                        onChange={(e) => setSettings({...settings, weightResponseTime: e.target.value})}
                        className="font-bold uppercase tracking-tight text-[11px]"
                    />
                    <Input 
                        label="Completion Weight (%)" 
                        type="number"
                        value={settings.weightCompletionRate}
                        onChange={(e) => setSettings({...settings, weightCompletionRate: e.target.value})}
                        className="font-bold uppercase tracking-tight text-[11px]"
                    />
                </FormFieldGrid>
            </div>
          </FormSection>

          <FormSection
            title="Security & Sessions"
            description="Identity protection and session management."
          >
            <FormFieldGrid>
                <Input 
                    label="Session Timeout (Min)" 
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
                    icon={<Lock />}
                    className="font-bold uppercase tracking-tight text-[11px]"
                />
                <Input 
                    label="Max Login Attempts" 
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({...settings, maxLoginAttempts: e.target.value})}
                    icon={<ShieldWarning />}
                    className="font-bold uppercase tracking-tight text-[11px]"
                />
                <Card className="bg-muted/30 border-none shadow-none col-span-full">
                    <Card.Content className="flex items-center justify-between p-4">
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold uppercase tracking-tight text-foreground">Require 2FA</p>
                            <p className="text-xs text-muted-foreground font-medium">Force two-factor authentication for all users</p>
                        </div>
                        <Switch 
                            checked={settings.require2FA} 
                            onCheckedChange={(val) => setSettings({...settings, require2FA: val})}
                        />
                    </Card.Content>
                </Card>
            </FormFieldGrid>
          </FormSection>

          <FormSection
            title="System & Notifications"
            description="Manage automated alerts and background tasks."
          >
            <div className="space-y-4">
              <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-border bg-card p-2 text-muted-foreground">
                        <Envelope className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-tight text-foreground">Email Notifications</p>
                    </div>
                    <Switch 
                    checked={settings.emailNotifications} 
                    onCheckedChange={(val) => setSettings({...settings, emailNotifications: val})}
                    />
                </Card.Content>
              </Card>

              <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-border bg-card p-2 text-muted-foreground">
                        <Bell className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-tight text-foreground">System Alerts</p>
                    </div>
                    <Switch 
                    checked={settings.systemAlerts} 
                    onCheckedChange={(val) => setSettings({...settings, systemAlerts: val})}
                    />
                </Card.Content>
              </Card>
            </div>
          </FormSection>

          <FormSection
            title="Danger Zone"
            titleClassName="text-danger"
            description="Destructive actions that cannot be undone."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClearApplications}
                    className="border-danger/20 text-danger hover:bg-danger/5 font-bold uppercase tracking-tight text-[10px] h-12"
                >
                    <Trash className="h-4 w-4 mr-2" />
                    Clear Pending
                </Button>
                <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleExportData}
                    className="font-bold uppercase tracking-tight text-[10px] h-12"
                >
                    <DownloadSimple className="h-4 w-4 mr-2" />
                    Export Data
                </Button>
                <Button 
                    type="button" 
                    variant="danger"
                    onClick={() => setConfirmResetOpen(true)}
                    className="font-bold uppercase tracking-tight text-[10px] h-12 shadow-md shadow-danger/20"
                >
                    <ShieldWarning className="h-4 w-4 mr-2" />
                    Reset Platform
                </Button>
            </div>
          </FormSection>

          <div className="pt-10">
              <FormActionRow>
                <Button type="submit" loading={saving} className="font-bold uppercase tracking-tight h-12 px-10 shadow-lg">
                  <FloppyDisk className="h-5 w-5 mr-2" />
                  Save Global Configuration
                </Button>
              </FormActionRow>
          </div>
        </form>

        {/* Reset Confirmation Dialog */}
        <Dialog open={confirmResetOpen} onX={() => setConfirmResetOpen(false)} className="max-w-md">
            <Dialog.Header onX={() => setConfirmResetOpen(false)} className="border-b-0 pt-10 pb-4 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-3 rounded-full bg-danger/10 text-danger animate-pulse">
                        <Warning size={40} weight="bold" />
                    </div>
                    <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">Critical Action</Dialog.Title>
                    <Dialog.Description className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-8">
                        This will permanently erase all platform data including users, tasks, and contracts.
                    </Dialog.Description>
                </div>
            </Dialog.Header>
            <Dialog.Body className="px-10 pb-10">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="secondary" onClick={() => setConfirmResetOpen(false)} className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl">
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleResetData} className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl shadow-lg shadow-danger/20">
                        Confirm Reset
                    </Button>
                </div>
            </Dialog.Body>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default AdminSettings;



