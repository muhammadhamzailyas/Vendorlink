import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-16 px-4 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.2em]">
            © Vendorlink 2026. All rights reserved.
          </div>
          
          <nav className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-all">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-all">
              Terms of Services
            </Link>
            <a href="mailto:support.vendorlink@gmail.com" className="hover:text-foreground transition-all">
              Contact Us
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



