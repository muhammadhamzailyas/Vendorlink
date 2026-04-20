import React, { useState, useEffect } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { Card, PageTransition, Button } from "@/components/ui";

const PrivacyPolicy = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
      setShowScrollTop(isAtBottom);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--background)] py-20 px-4 sm:px-6 relative">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--foreground)] uppercase leading-none">
              Privacy <span className="text-[var(--muted-foreground)]">Policy</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-[var(--border)]" />
                <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.2em]">
                    Effective Date: April 20, 2025
                </p>
                <div className="h-px w-12 bg-[var(--border)]" />
            </div>
          </div>

          <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-2xl rounded-[2.5rem]">
            <div className="p-8 md:p-16 space-y-16 text-[var(--foreground)]">
              
              {/* 01. Introduction */}
              <section className="space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    01. Introduction
                </div>
                <div className="space-y-4 text-base leading-relaxed font-medium opacity-90">
                    <p>
                        Vendorlink (“we”, “our”, or “us”) operates the Vendorlink platform (the “Platform”), a web-based system for vendor management and collaboration.
                    </p>
                    <p>
                        We are committed to protecting the privacy of all users, including Companies, Vendors, and Administrators. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information.
                    </p>
                    <p className="font-bold italic">
                        By using Vendorlink, you agree to this Privacy Policy.
                    </p>
                </div>
              </section>

              {/* 02. Information We Collect */}
              <section className="space-y-8">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    02. Information We Collect
                </div>
                
                <div className="space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-lg font-black uppercase tracking-tight">2.1 Information You Provide</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: "Account Info", desc: "Name, email, password, role" },
                                { label: "Business Details", desc: "Registration, documents, licenses" },
                                { label: "Vendor Profiles", desc: "Skills, services, portfolios, pricing" },
                                { label: "Project Data", desc: "Tasks, proposals, deliverables" },
                                { label: "Contracts", desc: "Agreements and milestone records" },
                                { label: "Payments", desc: "Processed via secure providers" },
                            ].map((item, i) => (
                                <li key={i} className="flex flex-col p-4 rounded-2xl bg-[var(--muted)]/50 border border-[var(--border)]/50">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-1">{item.label}</span>
                                    <span className="text-sm font-bold">{item.desc}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="p-4 rounded-2xl bg-[var(--muted)]/30 border border-[var(--border)]/50 flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-[var(--foreground)]" />
                            <p className="text-xs font-bold uppercase tracking-tight">Communications: Messages exchanged on the Platform</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-black uppercase tracking-tight">2.2 Automatically Collected</h3>
                        <div className="p-6 rounded-2xl bg-[var(--muted)]/30 border border-[var(--border)] border-dashed">
                            <ul className="space-y-2 text-sm font-bold opacity-80">
                                <li>• IP address, browser, OS</li>
                                <li>• Usage behavior and session activity</li>
                                <li>• Device identifiers</li>
                                <li>• Cookies for authentication, preferences, and analytics</li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-black uppercase tracking-tight">2.3 Third-Party Sources</h3>
                        <p className="text-sm leading-relaxed font-medium opacity-80">
                            We may receive data from payment processors or verification services.
                        </p>
                    </div>
                </div>
              </section>

              {/* 03. How We Use Information */}
              <section className="space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    03. How We Use Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        "Create and manage accounts",
                        "Operate Platform features",
                        "Communicate updates",
                        "Ensure security and prevent fraud",
                        "Improve performance",
                        "Comply with legal obligations"
                    ].map((text, i) => (
                        <div key={i} className="flex gap-4 items-center p-2">
                            <span className="text-2xl font-black text-[var(--muted)]">/</span>
                            <span className="text-sm font-bold uppercase tracking-tight">{text}</span>
                        </div>
                    ))}
                </div>
              </section>

              {/* 04. Data Sharing */}
              <section className="space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    04. Data Sharing
                </div>
                <p className="text-base leading-relaxed font-medium opacity-90 italic">We do not sell your data. We may share it with:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: "Other Users", desc: "For project collaboration" },
                        { title: "Administrators", desc: "For verification and support" },
                        { title: "Service Providers", desc: "Hosting, payments, analytics" },
                        { title: "Legal Authorities", desc: "When required by law" },
                        { title: "Business Transfers", desc: "In mergers or acquisitions" },
                    ].map((item, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-[var(--muted)] border border-[var(--border)]">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-2">{item.title}</h4>
                            <p className="text-xs font-bold leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
              </section>

              {/* 05. Data Security */}
              <section className="space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    05. Data Security
                </div>
                <div className="p-8 rounded-[2rem] bg-[var(--foreground)] text-[var(--background)]">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold">
                        <li>• HTTPS/TLS encryption</li>
                        <li>• Secure payment processing</li>
                        <li>• Role-based access control (RBAC)</li>
                        <li>• Data isolation between users</li>
                    </ul>
                    <p className="mt-6 text-xs opacity-70 italic">No system is completely secure; users should maintain strong passwords.</p>
                </div>
              </section>

              {/* 06-11 Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {[
                    { num: "06", title: "Data Retention", desc: "We retain data while your account is active and as required for legal compliance, financial records, and fraud prevention." },
                    { num: "07", title: "Your Rights", desc: "You may access, correct, or delete your data, request portability, or object to processing. Contact: privacy@vendorlink.com" },
                    { num: "08", title: "Cookies", desc: "Used for authentication and analytics. Disabling them may affect Platform functionality." },
                    { num: "09", title: "Children’s Privacy", desc: "Vendorlink is not intended for users under 18. We do not knowingly collect data from minors." },
                    { num: "10", title: "International Users", desc: "Data may be processed in Pakistan or other jurisdictions." },
                    { num: "11", title: "Policy Updates", desc: "We may update this policy. Continued use constitutes acceptance of changes." },
                ].map((item, i) => (
                    <section key={i} className="space-y-4">
                        <div className="inline-block px-3 py-1 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                            {item.num}. {item.title}
                        </div>
                        <p className="text-sm leading-relaxed font-bold opacity-80">{item.desc}</p>
                    </section>
                ))}
              </div>

              {/* 12. Contact */}
              <div className="pt-10 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">12. Contact Information</p>
                    <div className="flex flex-col space-y-1">
                        <a href="mailto:privacy@vendorlink.com" className="text-lg font-black hover:opacity-70 transition-opacity">privacy@vendorlink.com</a>
                        <a href="http://www.vendorlink.com" target="_blank" rel="noreferrer" className="text-sm font-bold underline decoration-[var(--border)] underline-offset-4">www.vendorlink.com</a>
                        <p className="text-sm font-bold opacity-60">Vendorlink, Pakistan</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)]">© Vendorlink 2026</p>
                </div>
              </div>

            </div>
          </Card>
        </div>

        {/* Action Button: Scroll to Top */}
        <div className={`fixed bottom-8 right-8 transition-all duration-500 transform ${showScrollTop ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
            <Button 
                onClick={scrollToTop}
                variant="primary"
                className="h-14 w-14 rounded-full shadow-2xl bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center p-0 border-none hover:scale-110 active:scale-95"
            >
                <ArrowUp size={24} strokeWidth={3} />
            </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default PrivacyPolicy;
