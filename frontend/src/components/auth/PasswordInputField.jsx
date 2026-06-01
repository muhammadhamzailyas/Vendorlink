import React from "react";
import { Eye as Visibility, EyeSlash as VisibilityOff } from "@phosphor-icons/react";
import { Input, Button } from "../ui";

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
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        className="absolute right-1 top-0 h-12 w-10 p-0 text-muted-foreground hover:bg-transparent"
      >
        {showPassword ? <VisibilityOff size={20} /> : <Visibility size={20} />}
      </Button>
    </div>
  );
};

export default PasswordInputField;

