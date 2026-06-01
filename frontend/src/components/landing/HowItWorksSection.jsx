import React from "react";
import { 
  ClipboardText, 
  Users, 
  ShieldCheck, 
  MagnifyingGlass, 
  PaperPlaneTilt, 
  Bank 
} from "@phosphor-icons/react";

const HowItWorksSection = () => {
  const companySteps = [
    {
      number: "01",
      title: "Define & Post",
      description: "Create detailed tasks with budgets and deadlines to attract verified vendors.",
      icon: <ClipboardText className="w-6 h-6" />,
    },
    {
      number: "02",
      title: "AI Selection",
      description: "Review proposals side-by-side with AI-driven rankings to find your best fit.",
      icon: <Users className="w-6 h-6" />,
    },
    {
      number: "03",
      title: "Manage & Pay",
      description: "Sign digital contracts, track progress, and release payments securely.",
      icon: <ShieldCheck className="w-6 h-6" />,
    },
  ];

  const vendorSteps = [
    {
      number: "01",
      title: "Find Projects",
      description: "Browse high-quality tasks from verified companies matching your expertise.",
      icon: <MagnifyingGlass className="w-6 h-6" />,
    },
    {
      number: "02",
      title: "Submit Bids",
      description: "Send professional proposals and showcase your skills to win more work.",
      icon: <PaperPlaneTilt className="w-6 h-6" />,
    },
    {
      number: "03",
      title: "Work & Earn",
      description: "Deliver quality work through our portal and receive guaranteed payments.",
      icon: <Bank className="w-6 h-6" />,
    },
  ];

  return (
    <section
      id="how-it-works-section"
      className="py-20 sm:py-32 px-4 bg-muted rounded-t-[40px] sm:rounded-t-[80px] -mt-10 relative z-10"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <h3 className="text-foreground text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-6 uppercase">
            How It Works
          </h3>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Streamlining collaboration for both companies and vendors.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Companies Column */}
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-border" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">For Companies</h4>
              <div className="h-px flex-1 bg-border" />
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {companySteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-6 group bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-soft transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.01] hover:border-ring/30"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl bg-muted flex items-center justify-center shadow-inner border border-border group-hover:scale-110 group-hover:bg-accent transition-all duration-500">
                    <div className="text-foreground">
                      {React.cloneElement(step.icon, { size: 28, strokeWidth: 2.5 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground opacity-30 mb-1 block">{step.number}</span>
                    <h4 className="text-lg sm:text-xl font-extrabold text-foreground mb-2 uppercase tracking-tight">
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendors Column */}
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-border" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">For Vendors</h4>
              <div className="h-px flex-1 bg-border" />
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {vendorSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-6 group bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-soft transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.01] hover:border-ring/30"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl bg-muted flex items-center justify-center shadow-inner border border-border group-hover:scale-110 group-hover:bg-accent transition-all duration-500">
                    <div className="text-foreground">
                      {React.cloneElement(step.icon, { size: 28, strokeWidth: 2.5 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground opacity-30 mb-1 block">{step.number}</span>
                    <h4 className="text-lg sm:text-xl font-extrabold text-foreground mb-2 uppercase tracking-tight">
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;




