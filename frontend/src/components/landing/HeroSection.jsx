import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/Vendorlink Logo.png";
import { Button } from "../ui";

const HeroSection = () => {
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

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <Button
          asChild
          size="lg"
          className="h-16 rounded-xl font-semibold uppercase tracking-widest text-sm bg-foreground text-background shadow-soft transition-all duration-300 hover:scale-105 active:scale-95 border-none"
        >
          <Link to="/signup?role=company">Initiate Project</Link>
        </Button>
        <Button
          asChild
          variant="secondary"
          size="lg"
          className="h-16 rounded-xl font-semibold uppercase tracking-widest text-sm shadow-soft transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Link to="/signup?role=vendor">Register Expertise</Link>
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
