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
} from "@phosphor-icons/react";
import { 
  Button, 
  Card, 
  Input, 
  Switch, 
  PageTransition,
  Skeleton,
  Separator
} from "@/components/ui";
import toastUtil from "@/lib/toast";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "VendorLink",
    contactEmail: "admin@vendorlink.com",
    maintenanceMode: false,
    enableRegistration: true,
    requireApproval: true,
    emailNotifications: true,
    systemAlerts: true,
    backupFrequency: "daily",
  });

  useEffect(() => {
    // Simulate loading settings from API
    const timer = setTimeout(() => {
      setLoading(false);
    }, 8000);
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

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] uppercase">Platform Settings</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Global configuration and system preferences.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <FormSection
            title="General Configuration"
            description="Basic platform identity and contact details."
          >
            <FormFieldGrid>
              <Input 
                label="Site Name" 
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
              />
              <Input 
                label="Admin Contact Email" 
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
              />
            </FormFieldGrid>
          </FormSection>

          <FormSection
            title="Access & Security"
            description="Control user entry and platform availability."
          >
            <div className="space-y-4">
              <Card className="bg-[var(--muted)]/30 border-none shadow-none">
                <Card.Content className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                    <p className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)]">Maintenance Mode</p>
                    <p className="text-xs text-[var(--muted-foreground)] font-medium">Disable public access to the platform</p>
                    </div>
                    <Switch 
                    checked={settings.maintenanceMode} 
                    onCheckedChange={(val) => setSettings({...settings, maintenanceMode: val})}
                    />
                </Card.Content>
              </Card>

              <Card className="bg-[var(--muted)]/30 border-none shadow-none">
                <Card.Content className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                    <p className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)]">New Registrations</p>
                    <p className="text-xs text-[var(--muted-foreground)] font-medium">Allow new users to create accounts</p>
                    </div>
                    <Switch 
                    checked={settings.enableRegistration} 
                    onCheckedChange={(val) => setSettings({...settings, enableRegistration: val})}
                    />
                </Card.Content>
              </Card>

              <Card className="bg-[var(--muted)]/30 border-none shadow-none">
                <Card.Content className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                    <p className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)]">Require Admin Approval</p>
                    <p className="text-xs text-[var(--muted-foreground)] font-medium">Manually verify all new accounts</p>
                    </div>
                    <Switch 
                    checked={settings.requireApproval} 
                    onCheckedChange={(val) => setSettings({...settings, requireApproval: val})}
                    />
                </Card.Content>
              </Card>
            </div>
          </FormSection>

          <FormSection
            title="System & Notifications"
            description="Manage automated alerts and background tasks."
            footer={(
              <FormActionRow>
                <Button type="submit" loading={saving} className="font-bold uppercase tracking-tight">
                  <FloppyDisk className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </FormActionRow>
            )}
          >
            <div className="space-y-4">
              <Card className="bg-[var(--muted)]/30 border-none shadow-none">
                <Card.Content className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-[var(--muted-foreground)]">
                        <Envelope className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)]">Email Notifications</p>
                    </div>
                    <Switch 
                    checked={settings.emailNotifications} 
                    onCheckedChange={(val) => setSettings({...settings, emailNotifications: val})}
                    />
                </Card.Content>
              </Card>

              <Card className="bg-[var(--muted)]/30 border-none shadow-none">
                <Card.Content className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-[var(--muted-foreground)]">
                        <Bell className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)]">System Alerts</p>
                    </div>
                    <Switch 
                    checked={settings.systemAlerts} 
                    onCheckedChange={(val) => setSettings({...settings, systemAlerts: val})}
                    />
                </Card.Content>
              </Card>
            </div>
          </FormSection>
        </form>
      </div>
    </PageTransition>
  );
};

export default AdminSettings;
