import * as React from "react";
import { cn } from "@/lib/cn";

const InputOTP = React.forwardRef(({ className, length = 6, value, onChange, disabled, ...props }, ref) => {
  const inputRefs = React.useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    // Only allow numbers
    if (val && !/^\d+$/.test(val)) return;

    const currentValues = value ? value.split("") : Array(length).fill("");
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
    inputRefs.current[nextIndex].focus();
  };

  return (
    <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
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
          className={cn(
            "flex h-12 w-10 md:h-14 md:w-12 items-center justify-center rounded-xl border border-[var(--input-border)] bg-[var(--muted)] text-center text-xl font-bold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--input-focus)] disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      ))}
    </div>
  );
});

InputOTP.displayName = "InputOTP";

export { InputOTP };
