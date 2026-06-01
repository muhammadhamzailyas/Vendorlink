import React, { useMemo } from "react";
import { User as UserIcon } from "@phosphor-icons/react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import { cn } from "@/lib/cn";

const API_ORIGIN = (() => {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8002/api";
  return base.replace(/\/api\/?$/, "");
})();

const POSSIBLE_AVATAR_KEYS = [
  "profileImage",
  "profilePic",
  "avatar",
  "avatarUrl",
  "photo",
  "photoURL",
  "image",
  "picture",
];

const getAvatarSource = (user = {}) => {
  for (const key of POSSIBLE_AVATAR_KEYS) {
    const value = user?.[key];
    if (typeof value !== "string" || !value.trim()) continue;

    if (/^(https?:)?\/\//.test(value) || value.startsWith("data:")) {
      return value;
    }

    if (value.startsWith("/")) {
      return `${API_ORIGIN}${value}`;
    }

    return `${API_ORIGIN}/${value}`;
  }

  return "";
};

const sizeClassMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-14 w-14",
};

const UserAvatar = ({ user, name, size = "md", className = "" }) => {
  const avatarSrc = useMemo(() => getAvatarSource(user), [user]);
  const fallbackName = name || user?.companyName || user?.fullName || user?.email || "U";
  const initials = fallbackName.charAt(0).toUpperCase();
  const sizeClass = sizeClassMap[size] || sizeClassMap.md;

  return (
    <Avatar className={cn(sizeClass, "rounded-xl border border-border/50 shadow-soft", className)}>
      {avatarSrc && (
        <AvatarImage 
          src={avatarSrc} 
          alt={fallbackName} 
          className="object-cover"
        />
      )}
      <AvatarFallback className="rounded-xl bg-muted text-foreground font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;




