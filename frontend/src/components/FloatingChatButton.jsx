import React from "react";
import { ChatCircleText } from "@phosphor-icons/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useNotifications } from "../context/NotificationContext";
import { Button } from "@/components/ui";

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { unreadChatCount } = useNotifications();

  // Don't show on chat page itself
  if (location.pathname.includes("/messages") || location.pathname.includes("/chat")) return null;

  const chatPath = `/${user.role}/messages`;

  return (
    <div className="fixed bottom-6 right-6 z-40 lg:bottom-8 lg:right-8">
      <Button
        onClick={() => navigate(chatPath)}
        variant="secondary"
        className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 bg-white border-border relative"
        size="icon"
      >
        <ChatCircleText className="h-6 w-6 text-slate-900" />
        {unreadChatCount > 0 && (
          <div className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
        )}
      </Button>
    </div>
  );
};

export default FloatingChatButton;



