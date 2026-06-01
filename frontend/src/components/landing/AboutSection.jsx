import React from "react";
import { motion } from "framer-motion";
import { Users, Target, ShieldCheck } from "@phosphor-icons/react";

const AboutSection = () => {
  const values = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community First",
      description: "We build bridges between talented vendors and ambitious companies to create lasting partnerships.",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Data Driven",
      description: "Our AI-powered insights ensure that decisions are based on performance, not just promises.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Absolute Trust",
      description: "Security and transparency are at the core of every contract and transaction on our platform.",
    },
  ];

  return (
    <section
      id="about-section"
      className="py-24 sm:py-32 px-4 bg-background"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 sm:gap-24 items-center">
          <div className="max-w-2xl mx-auto text-center lg:text-left">
            <h3
              className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-foreground mb-8 uppercase tracking-tight"
            >
              Outsourcing made <br />
              <span className="text-muted-foreground">smarter and safer.</span>
            </h3>
            <p
              className="text-base sm:text-lg text-muted-foreground mb-8 font-medium leading-relaxed"
            >
              Vendorlink was founded with a simple goal: to eliminate the friction and 
              uncertainty often associated with finding and managing external partners. 
              We believe that every business deserves access to verified talent, and 
              every vendor deserves a platform that rewards excellence.
            </p>
            <p
              className="text-base sm:text-lg text-muted-foreground font-medium leading-relaxed"
            >
              By combining cutting-edge AI with secure, automated workflows, we've 
              created an ecosystem where collaboration is seamless and growth is 
              inevitable.
            </p>
          </div>

          <div className="bg-card rounded-[3rem] p-8 sm:p-12 border border-border shadow-soft relative max-w-2xl mx-auto w-full">
            <h4 className="text-xs font-bold text-muted-foreground mb-10 uppercase tracking-widest">What we stand for</h4>
            <div className="space-y-10 sm:space-y-12">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-6 items-start"
                >
                  <div className="w-14 h-14 rounded-xl bg-foreground text-background shadow-lg flex items-center justify-center shrink-0 border border-border transition-transform hover:scale-110">
                    {React.cloneElement(value.icon, { size: 24, strokeWidth: 2.5 })}
                  </div>
                  <div>
                    <h5 className="text-lg font-extrabold text-foreground mb-2 uppercase tracking-tight">{value.title}</h5>
                    <p className="text-muted-foreground text-[15px] font-medium leading-relaxed">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;




