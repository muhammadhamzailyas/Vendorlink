import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle as CheckCircle, Layout as DashboardIcon } from "@phosphor-icons/react";
import { Button, Loader } from "../../components/ui";

const Payment = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = getUserData();

    if (!userData || !userData.id) {
      navigate("/login");
      return;
    }

    setUser(userData);

    // Admin users don't need payment - redirect directly to dashboard
    if (userData.role === "admin") {
      navigate("/admin", { replace: true });
    }
    setLoading(false);
  }, [navigate]);

  const handleGoToDashboard = () => {
    if (!user) return;

    const roleRoutes = {
      admin: "/admin",
      company: "/company",
      vendor: "/vendor",
    };

    navigate(roleRoutes[user.role] || "/company");
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm sm:p-12">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 rounded-full border border-border bg-muted flex items-center justify-center">
              <CheckCircle size={50} className="text-foreground" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 text-foreground">
            Under Progress
          </h1>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            Payment integration is currently under development. You can access
            your dashboard and start using VendorLink with the free plan.
          </p>

          <Button
            variant="secondary"
            onClick={handleGoToDashboard}
            icon={<DashboardIcon size={20} />}
            className="w-full rounded-xl px-6 py-2"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Payment;



