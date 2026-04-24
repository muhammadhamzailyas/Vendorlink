import React, { useState } from "react";
import { Link } from "react-router-dom";
import { List, X as X } from "@phosphor-icons/react";
import { Button, Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui";
import logoLight from "../../assets/Vendorlink Secondary Logo Light.png";

const navItems = [
  { id: "how-it-works-section", label: "How it Works" },
  { id: "features-section", label: "Features" },
  { id: "about-section", label: "About Us" },
];

const Navbar = ({ scrollToSection }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (id) => {
    scrollToSection(id);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <header className="fixed top-5 left-0 right-0 z-50 flex justify-center">
      <div className="flex items-center justify-between rounded-3xl px-4 sm:px-6 py-3 shadow-2xl bg-[var(--card)]/80 backdrop-blur-md border border-[var(--border)] w-[92%] md:w-[80%] lg:w-[50%]">
        <button 
          onClick={() => handleNavClick("hero-section")} 
          className="flex items-center cursor-pointer"
        >
          <img
            src={logoLight}
            alt="VendorLink"
            className="h-5 w-auto"
          />
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => handleNavClick(item.id)}
              className="h-auto p-0 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all active:scale-95 bg-transparent hover:bg-transparent"
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all active:scale-95"
          >
            Sign In
          </Link>
          <Button asChild size="sm" className="rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 shadow-soft transition-all duration-300 hover:scale-105 active:scale-95">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="md:hidden p-2 text-[var(--foreground)] hover:bg-[var(--muted)]"
          onClick={() => setMobileOpen(true)}
          aria-label="Toggle menu"
        >
          <List />
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-[var(--card)] border-r border-[var(--border)]">
          <SheetTitle className="sr-only">Navigation List</SheetTitle>
          <SheetDescription className="sr-only">Access site navigation links and account options.</SheetDescription>
          <div className="flex items-center justify-between p-8 border-b border-[var(--border)] bg-[var(--muted)]">
            <button 
              onClick={() => handleNavClick("hero-section")} 
              className="flex items-center cursor-pointer"
            >
              <img
                src={logoLight}
                alt="VendorLink"
                className="h-6 w-auto"
              />
            </button>
          </div>
          <nav className="flex flex-col p-8 space-y-4">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => handleNavClick(item.id)}
                className="justify-start h-auto p-0 text-[13px] font-bold uppercase tracking-widest text-left text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all active:scale-95 bg-transparent hover:bg-transparent"
              >
                {item.label}
              </Button>
            ))}
            <div className="pt-10 flex flex-col gap-4">
              <Button asChild variant="secondary" className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-soft">
                <Link to="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
              </Button>
              <Button asChild className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs bg-[var(--foreground)] text-[var(--background)] shadow-soft">
                <Link to="/signup" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Navbar;