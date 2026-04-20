import React from "react";
import { Eye as Visibility, EyeSlash as VisibilityOff } from "@phosphor-icons/react";
import { Input } from "../../ui";

const PasswordInputField = ({ placeholder, value, onChange, showPassword, onToggle }) => {
  return (
    <div className="relative">
      <Input
        className="h-12 rounded-xl border-0 bg-[var(--muted)] px-4 pr-11 font-medium"
        placeholder={placeholder}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        {showPassword ? <VisibilityOff size={20} /> : <Visibility size={20} />}
      </button>
    </div>
  );
};

export default PasswordInputField;
