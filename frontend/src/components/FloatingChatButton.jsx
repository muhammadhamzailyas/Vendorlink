import React, { useEffect, useState } from "react";
import { ChatCircleText } from "@phosphor-icons/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Button } from "@/components/ui";
import { contractAPI } from "../services/api";

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [hasInvolvement, setHasInvolvement] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkInvolvement = async () => {
      if (!user || user.role === "admin") {
        setLoading(false);
        return;
      }

      try {
        let response;
        if (user.role === "company") {
          response = await contractAPI.getCompanyContracts();
        } else if (user.role === "vendor") {
          response = await contractAPI.getVendorContracts();
        }

        if (response?.data?.data && response.data.data.length > 0) {
          setHasInvolvement(true);
        } else {
          setHasInvolvement(false);
        }
      } catch (error) {
        console.error("Error checking involvement:", error);
        setHasInvolvement(false);
      } finally {
        setLoading(false);
      }
    };

    checkInvolvement();
  }, [user]);

  if (!user || user.role === "admin" || loading || !hasInvolvement) return null;

  // Don't show on chat page itself
  if (location.pathname.includes("/messages")) return null;

  const chatPath = `/${user.role}/messages`;

  return (
    <div className="fixed bottom-6 right-6 z-40 lg:bottom-8 lg:right-8">
      <Button
        onClick={() => navigate(chatPath)}
        variant="secondary"
        className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 bg-white border-border"
        size="xs"
      >
        <ChatCircleText className="h-6 w-6 text-slate-900" />
      </Button>
    </div>
  );
};

export default FloatingChatButton;



