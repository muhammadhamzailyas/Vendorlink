import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SignOut } from "@phosphor-icons/react";
import { authService } from "@/services/api";
import { PageTransition, Button, Switch } from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "@phosphor-icons/react";
import StatusChip from "@/components/shared/StatusChip";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";

const Settings = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const logout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <FormSection
          title="Account Summary"
          description="Review your account details and access essentials."
          footer={(
            <FormActionRow>
              <Button
                type="button"
                onClick={() => navigate("/login")}
                variant="secondary"
                className="font-bold uppercase tracking-tight"
              >
                Go to Login
              </Button>
              <Button
                type="button"
                onClick={logout}
                variant="destructive"
                className="font-bold uppercase tracking-tight"
              >
                <SignOut className="h-4 w-4 mr-2" />
                SignOut
              </Button>
            </FormActionRow>
          )}
        >
          <FormFieldGrid>
            <Card className="bg-[var(--muted)]/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Email</p>
                    <p className="text-sm font-bold text-[var(--foreground)] truncate">{user.email || "-"}</p>
                </Card.Content>
            </Card>
            <Card className="bg-[var(--muted)]/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Role</p>
                    <p className="text-sm font-bold capitalize text-[var(--foreground)]">{user.role || "-"}</p>
                </Card.Content>
            </Card>
            <Card className="bg-[var(--muted)]/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Status</p>
                    <StatusChip status={user.status || "incomplete"} />
                </Card.Content>
            </Card>
            <Card className="bg-[var(--muted)]/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Selected Plan</p>
                    <p className="text-sm font-bold uppercase text-[var(--foreground)]">{user.selectedPlan || "free"}</p>
                </Card.Content>
            </Card>
          </FormFieldGrid>
        </FormSection>

        <FormSection
          title="Appearance"
          description="Customize how the platform looks in your session."
        >
          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-2 text-[var(--foreground)]/80">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)]">Dark Mode</h3>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">Switch between light and dark themes</p>
              </div>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </FormSection>
      </div>
    </PageTransition>
  );
};

export default Settings;
