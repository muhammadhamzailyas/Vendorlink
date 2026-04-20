import React from "react";
import { ClipboardText, Users, ShieldCheck } from "@phosphor-icons/react";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Post Your Task",
      description: "Describe your project, set a deadline and budget, and publish it to verified vendors.",
      icon: <ClipboardText className="w-6 h-6" />,
    },
    {
      number: "02",
      title: "Review Proposals",
      description: "Receive vendor proposals, compare them side by side, and use AI ranking to pick the best fit.",
      icon: <Users className="w-6 h-6" />,
    },
    {
      number: "03",
      title: "Contract & Collaborate",
      description: "Generate a digital contract, track progress in real time, and pay securely through the platform.",
      icon: <ShieldCheck className="w-6 h-6" />,
    },
  ];

  return (
    <section
      id="how-it-works-section"
      className="py-20 sm:py-32 px-4 bg-[var(--muted)] rounded-t-[40px] sm:rounded-t-[80px] -mt-10 relative z-10"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <h3 className="text-[var(--foreground)] text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-6 uppercase">
            How It Works
          </h3>
          <p className="text-[var(--muted-foreground)] text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Streamlining collaboration from first post to final payment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group bg-[var(--card)] p-8 sm:p-10 rounded-3xl border border-[var(--border)] shadow-soft transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2.5rem] bg-[var(--muted)] flex items-center justify-center mb-8 shadow-inner border border-[var(--border)]">
                  <div className="text-[var(--foreground)]">
                    {React.cloneElement(step.icon, { size: 32, strokeWidth: 2.5 })}
                  </div>
                </div>

                <h4 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] mb-4 uppercase tracking-tight">
                  {step.title}
                </h4>
                <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
