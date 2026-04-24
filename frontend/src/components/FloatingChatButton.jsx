import React from "react";
import { ChatCircleText } from "@phosphor-icons/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Button } from "@/components/ui";

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  if (!user || user.role === "admin") return null;

  // Don't show on chat page itself
  if (location.pathname.includes("/messages")) return null;

  const chatPath = `/${user.role}/messages`;

  return (
    <div className="fixed bottom-6 right-6 z-40 lg:bottom-8 lg:right-8">
      <Button
        onClick={() => navigate(chatPath)}
        className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
        size="xs"
      >
        <ChatCircleText className="h-6 w-6 text-foreground" />
      </Button>
    </div>
  );
};

export default FloatingChatButton;



