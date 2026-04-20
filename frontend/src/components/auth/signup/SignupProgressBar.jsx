import React from "react";
import { cn } from "@/lib/cn";
import { Check } from "@phosphor-icons/react";

const SignupProgressBar = ({ step }) => {
  const steps = [
    { id: 1, label: "Account" },
    { id: 2, label: "Details" },
    { id: 3, label: "Docs" },
    { id: 4, label: "Plan" },
    { id: 5, label: "Review" },
  ];

  const totalSteps = steps.length;
  const activeStepIndex = step - 1;

  return (
    <div className="mb-12 relative w-full px-2">
      {/* Connecting Lines Container */}
      <div className="absolute top-5 left-8 right-8 h-0.5 bg-[var(--border)] -z-0" />
      
      {/* Active Connecting Line */}
      <div 
        className="absolute top-5 left-8 h-0.5 bg-[var(--foreground)] transition-all duration-500 ease-in-out -z-0" 
        style={{ 
          width: activeStepIndex > 0 
            ? `${(activeStepIndex) / (totalSteps - 1) * 100}%` 
            : '0%' 
        }}
      />

      <div className="flex justify-between relative z-10">
        {steps.map((s, index) => {
          const isCompleted = s.id < step;
          const isActive = s.id === step;
          
          return (
            <div key={s.id} className="flex flex-col items-center">
              {/* Node */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2",
                  isCompleted 
                    ? "bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] shadow-sm" 
                    : isActive 
                      ? "bg-[var(--card)] border-[var(--foreground)] text-[var(--foreground)] ring-4 ring-[var(--foreground)]/10 shadow-md scale-110" 
                      : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)]"
                )}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : (index + 1)}
              </div>

              {/* Short Label below */}
              <span 
                className={cn(
                  "mt-3 text-[9px] font-extrabold uppercase tracking-widest transition-colors duration-300 text-center",
                  isActive ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SignupProgressBar;
