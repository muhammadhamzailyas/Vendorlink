import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lightning, FileText, Lock, ChartBar } from "@phosphor-icons/react";

const features = [
  {
    icon: Lightning,
    title: "AI Vendor Ranking",
    description: "Our proprietary AI evaluates performance history and reliability to find your top match.",
    layoutClass: "md:col-span-2",
  },
  {
    icon: FileText,
    title: "Smart Contracts",
    description: "Generate legally-vetted, customizable digital contracts in under 60 seconds.",
    layoutClass: "md:col-span-2",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "Enterprise-grade encryption for all financial transactions and full audit trails.",
    layoutClass: "md:col-span-2 lg:col-span-3",
  },
  {
    icon: ChartBar,
    title: "Progress Tracking",
    description: "Real-time milestone monitoring with automated weekly performance reporting.",
    layoutClass: "md:col-span-2 lg:col-span-1",
  },
];

const FeaturesSection = () => {
  return (
    <section
      id="features-section"
      className="py-24 px-4 bg-muted rounded-b-[40px] sm:rounded-b-[80px] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20 sm:mb-28">
          <h3
            className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-foreground mb-6 uppercase tracking-tight"
          >
            Smarter tools for <br className="hidden sm:block" /> <span className="text-muted-foreground">better results.</span>
          </h3>
          <p
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium"
          >
            Everything you need to manage your outsourcing workflow from initial 
            proposal to final payment, all in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className={feature.layoutClass}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  to="/signup"
                  className="group p-8 sm:p-10 bg-card rounded-[2.5rem] border border-border shadow-soft hover:shadow-2xl transition-all duration-500 flex flex-col items-start relative overflow-hidden h-full"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-10 bg-muted text-foreground shadow-inner border border-border transition-all duration-500 group-hover:scale-110`}>
                    <Icon size={28} strokeWidth={2.5} />
                  </div>

                  <h4 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4 uppercase tracking-tighter transition-colors">
                    {feature.title}
                  </h4>

                  <p className="text-muted-foreground leading-relaxed text-base font-medium mb-10">
                    {feature.description}
                  </p>

                  <div className="mt-auto flex items-center text-[11px] text-foreground font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                    Get started <span className="ml-2 font-sans">→</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;




