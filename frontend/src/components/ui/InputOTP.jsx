import * as React from "react";
import { cn } from "@/lib/cn";

const InputOTP = React.forwardRef(({ className, length = 6, value = "", onChange, disabled, ...props }, ref) => {
  const inputRefs = React.useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    // Only allow numbers
    if (val && !/^\d+$/.test(val)) return;

    const currentValues = value ? value.split("") : Array(length).fill("");
    
    // Handle the case where value might be shorter than length
    while (currentValues.length < length) currentValues.push("");
    
    currentValues[index] = val.substring(val.length - 1);
    const updatedValue = currentValues.join("");
    onChange(updatedValue);

    // Move to next input if current is filled
    if (val && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, length);
    if (!/^\d+$/.test(pasteData)) return;
    onChange(pasteData);
    
    // Focus last input or next empty
    const nextIndex = Math.min(pasteData.length, length - 1);
    if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
    }
  };

  return (
    <div ref={ref} className={cn("flex items-center gap-3", className)} {...props}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          autoComplete="one-time-code"
          className={cn(
            "flex h-12 w-10 md:h-16 md:w-12 items-center justify-center rounded-2xl border-2 border-border bg-card text-center text-2xl font-black text-foreground shadow-sm transition-all outline-none",
            "focus:border-foreground focus:ring-4 focus:ring-foreground/5",
            "disabled:cursor-not-allowed disabled:opacity-50",
            value[index] ? "border-foreground" : "border-border"
          )}
        />
      ))}
    </div>
  );
});

InputOTP.displayName = "InputOTP";

export { InputOTP };



