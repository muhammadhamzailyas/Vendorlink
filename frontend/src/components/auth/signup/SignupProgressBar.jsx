import React from "react";
import { cn } from "@/lib/cn";
import { Check } from "@phosphor-icons/react";

const SignupProgressBar = ({ step }) => {
  const steps = [
    { id: 1, label: "Account" },
    { id: 2, label: "Details" },
    { id: 3, label: "Docs" },
    { id: 4, label: "Payment" },
    { id: 5, label: "Review" },
  ];

  const totalSteps = steps.length;
  const activeStepIndex = step - 1;

  return (
    <div className="mb-12 relative w-full px-5">
      {/* 
          The connecting line container. 
          First circle center is at 20px (w-10/2). 
          Last circle center is at TotalWidth - 20px.
          We use left-10 (px-5 + center offset) to span exactly center-to-center.
      */}
      <div className="absolute top-5 left-10 right-10 h-0.5 pointer-events-none">
        {/* Background Gray Line */}
        <div className="absolute inset-0 bg-border" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute left-0 h-full bg-foreground transition-all duration-500 ease-in-out" 
          style={{ 
            width: `${(activeStepIndex / (totalSteps - 1)) * 100}%` 
          }}
        />
      </div>

      <div className="flex justify-between relative z-10">
        {steps.map((s, index) => {
          const isCompleted = s.id < step;
          const isActive = s.id === step;
          
          return (
            <div key={s.id} className="flex flex-col items-center">
              {/* Node */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 border-2",
                  isCompleted 
                    ? "bg-foreground border-foreground text-background shadow-sm" 
                    : isActive 
                      ? "bg-card border-foreground text-foreground ring-4 ring-foreground/10 shadow-md scale-110" 
                      : "bg-card border-border text-muted-foreground"
                )}
              >
                {isCompleted ? <Check size={16} weight="bold" /> : (index + 1)}
              </div>

              {/* Short Label below */}
              <span 
                className={cn(
                  "mt-3 text-[9px] font-extrabold uppercase tracking-widest transition-colors duration-300 text-center",
                  isActive ? "text-foreground" : "text-muted-foreground"
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



