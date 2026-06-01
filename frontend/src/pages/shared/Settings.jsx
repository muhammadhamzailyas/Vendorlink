import React, { useState } from "react";
import { SignOut, ShieldWarning, Key, ArrowsClockwise } from "@phosphor-icons/react";
import { useUser } from "@/context/UserContext";
import { authService } from "@/services/api";
import { PageTransition, Button, Card, Alert, AlertTitle, AlertDescription } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";
import toastUtil from "@/lib/toast";

const Settings = () => {
  const { user, logout } = useUser();
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
        await authService.forgotPassword(user.email);
        toastUtil.success("Password reset link sent to your email");
    } catch (error) {
        toastUtil.handleApiError(error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-10 pb-10">
        <FormSection
          title="Account Overview"
          description="Review your account status and membership details."
          footer={(
            <FormActionRow className="bg-muted/30 border-t border-border px-6 py-4">
              <Button
                type="button"
                onClick={logout}
                variant="destructive"
                className="w-full sm:w-auto font-semibold uppercase tracking-widest text-[11.5px] h-10 px-8 rounded-xl"
              >
                
                Logout Session
              </Button>
            </FormActionRow>
          )}
        >
          <FormFieldGrid>
            <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Email Identity</p>
                    <p className="text-sm font-bold text-foreground truncate">{user.email || "-"}</p>
                </Card.Content>
            </Card>
            <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Platform Role</p>
                    <p className="text-sm font-bold capitalize text-foreground">{user.role || "-"}</p>
                </Card.Content>
            </Card>
            <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Account Status</p>
                    <StatusChip status={user.status || "incomplete"} />
                </Card.Content>
            </Card>
            <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Current Tier</p>
                    <p className="text-sm font-bold uppercase text-foreground">{user.selectedPlan || "free"}</p>
                </Card.Content>
            </Card>
          </FormFieldGrid>
        </FormSection>

        <FormSection
          title="Security & Access"
          description="Manage your credentials and protect your account."
        >
          <div className="space-y-6">
            <Alert variant="warning" className="bg-warning/5 border-warning/20">
                <ShieldWarning className="h-5 w-5" />
                <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Security Advisory</AlertTitle>
                <AlertDescription className="text-xs font-medium leading-relaxed">
                    If you haven't updated your password since the last system migration, we strongly recommend initiating a password reset to ensure your account meets our new complexity requirements.
                </AlertDescription>
            </Alert>

            <Card className="border-border bg-card">
                <Card.Content className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-muted">
                            <Key size={24} weight="duotone" className="text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-bold uppercase tracking-tight text-foreground">Credential Reset</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Send reset instructions to {user.email}</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handlePasswordReset} 
                        loading={loading}
                        variant="outline" 
                        className="rounded-xl font-semibold uppercase tracking-tight text-[11.5px] h-10 px-6 border-border/60 hover:bg-muted"
                    >
                        
                        Reset Now
                    </Button>
                </Card.Content>
            </Card>
          </div>
        </FormSection>
      </div>
    </PageTransition>
  );
};

export default Settings;

