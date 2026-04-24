import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SignOut } from "@phosphor-icons/react";
import { authService } from "@/services/api";
import { PageTransition, Button, Card } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";

const Settings = () => {
  const navigate = useNavigate();
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
            <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-bold text-foreground truncate">{user.email || "-"}</p>
                </Card.Content>
            </Card>
            <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Role</p>
                    <p className="text-sm font-bold capitalize text-foreground">{user.role || "-"}</p>
                </Card.Content>
            </Card>
            <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                    <StatusChip status={user.status || "incomplete"} />
                </Card.Content>
            </Card>
            <Card className="bg-muted/30 border-none shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Selected Plan</p>
                    <p className="text-sm font-bold uppercase text-foreground">{user.selectedPlan || "free"}</p>
                </Card.Content>
            </Card>
          </FormFieldGrid>
        </FormSection>
      </div>
    </PageTransition>
  );
};

export default Settings;



