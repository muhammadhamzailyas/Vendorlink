import React from "react";
import { Eye as Visibility, EyeSlash as VisibilityOff } from "@phosphor-icons/react";
import { Input } from "../../ui";
import { cn } from "@/lib/cn";

const PasswordInputField = ({ placeholder, value, onChange, showPassword, onToggle, error, ...props }) => {
  return (
    <div className="relative w-full">
      <Input
        className="h-12 rounded-xl pr-11 font-medium"
        placeholder={placeholder}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "absolute right-3 p-0 text-muted-foreground hover:text-foreground transition-colors",
          error ? "top-[22px]" : "top-1/2 -translate-y-1/2"
        )}
      >
        {showPassword ? <VisibilityOff size={20} /> : <Visibility size={20} />}
      </button>
    </div>
  );
};

export default PasswordInputField;
