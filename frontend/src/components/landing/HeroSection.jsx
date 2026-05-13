import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/Vendorlink Logo.png";
import { Button } from "../ui";

const HeroSection = () => {
  const [textIndex, setTextIndex] = useState(0);
  
  const texts = useMemo(() => ["Initiate Project", "Register Expertise"], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <section
      id="hero-section"
      className="flex flex-col items-center justify-center text-center py-20 sm:py-28 px-4 pt-32 sm:pt-44 md:pt-52 bg-background relative overflow-hidden"
    >

      <div className="relative inline-flex items-center justify-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <img
          src={logo}
          alt="Vendorlink Logo"
          loading="eager"
          className="w-48 h-auto drop-shadow-2xl"
        />
      </div>

      <h1
        className="text-4xl sm:text-5xl md:text-8xl font-bold text-foreground mb-8 max-w-5xl mx-auto uppercase tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100"
      >
        Verified Vendors. <br />
        <span className="text-muted-foreground">Smarter Results.</span>
      </h1>

      <p
        className="text-base sm:text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
      >
        Trusted by businesses to automate contracts and track progress 
        within a secure, high-performance ecosystem.
      </p>

      <div className="mt-4 flex justify-center w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <Button
          asChild
          className="relative overflow-hidden w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] h-14 rounded-md font-bold uppercase tracking-widest text-sm bg-foreground text-background hover:opacity-90 shadow-soft transition-all duration-300 hover:scale-105 active:scale-95 border-none"
        >
          <Link to="/signup">
            <div className="flex items-center justify-center w-full h-full">
              <AnimatePresence mode="wait">
                <motion.span
                  key={textIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-background"
                >
                  {texts[textIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;



