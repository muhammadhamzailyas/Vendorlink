import React, { useState, useEffect } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { Card, PageTransition, Button } from "@/components/ui";

const TermsOfService = () => {
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
              Terms of <span className="text-[var(--muted-foreground)]">Service</span>
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
              
              {/* 01. Acceptance */}
              <section className="space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    01. Acceptance
                </div>
                <p className="text-base leading-relaxed font-medium opacity-90">
                    By accessing or using Vendorlink, you agree to these Terms. If you do not agree, do not use the Platform. These Terms and the Privacy Policy form the complete agreement.
                </p>
              </section>

              {/* 02. Eligibility */}
              <section className="space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    02. Eligibility
                </div>
                <div className="space-y-4 text-base leading-relaxed font-medium opacity-90">
                    <p>You must meet the following requirements to use our Platform:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            "Be at least 18 years old",
                            "Have legal capacity to contract",
                            "Provide accurate registration data",
                            "Complete account verification"
                        ].map((req, i) => (
                            <li key={i} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]/50">
                                <div className="h-1.5 w-1.5 rounded-full bg-[var(--foreground)]" />
                                <span className="text-sm font-bold uppercase tracking-tight">{req}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="italic pt-2">We reserve the right to refuse access at our sole discretion.</p>
                </div>
              </section>

              {/* 03. Accounts */}
              <section className="space-y-8">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    03. Accounts
                </div>
                
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--muted-foreground)]">3.1 Registration</h3>
                            <p className="text-sm font-bold leading-relaxed">You are responsible for your account and all activity under it. Maintain strong credentials.</p>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--muted-foreground)]">3.2 Verification</h3>
                            <p className="text-sm font-bold leading-relaxed">False information may result in immediate suspension or termination of access.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-black uppercase tracking-tight">3.3 Account Types</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { title: "Company", desc: "Post tasks, hire vendors, manage projects." },
                                { title: "Vendor", desc: "Submit proposals, deliver work, get paid." },
                                { title: "Admin", desc: "Global system and user management." },
                            ].map((role, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-[var(--muted)] border border-[var(--border)]">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-2">{role.title}</h4>
                                    <p className="text-xs font-bold leading-relaxed">{role.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </section>

              {/* 04. Platform Services */}
              <section className="space-y-8">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    04. Platform Services
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {[
                        { title: "4.1 Tasks & Proposals", desc: "Companies post tasks; Vendors submit proposals. AI tools assist but do not make decisions." },
                        { title: "4.2 Contracts", desc: "Generated contracts through the platform are legally binding between Companies and Vendors." },
                        { title: "4.3 Deliverables", desc: "Vendors must meet milestones; Companies must review submissions and deliverables promptly." },
                        { title: "4.4 Payments", desc: "Secure processing. Vendorlink facilitates but is not a party to the financial transaction." },
                    ].map((item, i) => (
                        <div key={i} className="space-y-2">
                            <h4 className="text-sm font-black uppercase tracking-tight">{item.title}</h4>
                            <p className="text-sm font-medium opacity-80 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="p-4 rounded-2xl bg-[var(--muted)]/30 border border-[var(--border)]/50 flex items-center gap-3">
                    <span className="text-sm font-black text-[var(--muted-foreground)]">4.5</span>
                    <p className="text-xs font-bold uppercase tracking-tight">Communication: Messaging may be monitored for compliance and dispute resolution.</p>
                </div>
              </section>

              {/* 05. User Obligations */}
              <section className="space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    05. User Obligations
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        "Provide accurate information",
                        "Use the Platform lawfully",
                        "Respect intellectual property",
                        "Avoid fraud or misuse",
                        "Not bypass Platform payments",
                        "No malicious content"
                    ].map((text, i) => (
                        <div key={i} className="flex gap-4 items-center p-3 rounded-xl border border-[var(--border)]/30">
                            <span className="text-xl font-black text-[var(--muted)]">/</span>
                            <span className="text-xs font-bold uppercase tracking-tight">{text}</span>
                        </div>
                    ))}
                </div>
              </section>

              {/* 06. Fees & 07. IP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <section className="space-y-4">
                    <div className="inline-block px-3 py-1 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                        06. Fees
                    </div>
                    <p className="text-sm leading-relaxed font-bold opacity-80">
                        Vendorlink may charge service fees. All fees are non-refundable unless explicitly stated otherwise in writing.
                    </p>
                </section>
                <section className="space-y-4">
                    <div className="inline-block px-3 py-1 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                        07. Intellectual Property
                    </div>
                    <p className="text-sm leading-relaxed font-bold opacity-80">
                        We own the platform technology; you retain ownership of your content but grant us a license for Platform operations.
                    </p>
                </section>
              </div>

              {/* 10. Liability & 11. Disclaimer */}
              <section className="space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                    Liability & Disclaimer
                </div>
                <div className="p-8 rounded-[2rem] bg-[var(--foreground)] text-[var(--background)] space-y-6">
                    <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-70">10. Liability</h4>
                        <p className="text-sm font-bold leading-relaxed">
                            Vendorlink is not liable for indirect damages, user disputes, or platform interruptions. Total liability is limited to fees paid in the past 3 months.
                        </p>
                    </div>
                    <div className="h-px bg-[var(--background)]/20" />
                    <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-70">11. Disclaimer</h4>
                        <p className="text-sm font-bold leading-relaxed italic">
                            The Platform is provided “as is” without warranties of any kind, express or implied.
                        </p>
                    </div>
                </div>
              </section>

              {/* 12-14 Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { num: "12", title: "Governing Law", desc: "Governed by the laws of Pakistan." },
                    { num: "13", title: "Changes", desc: "We may update Terms with notice. Continued use means acceptance." },
                    { num: "14", title: "Entire Agreement", desc: "These Terms and Privacy Policy form the complete agreement." },
                ].map((item, i) => (
                    <div key={i} className="space-y-3">
                        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Section {item.num}</div>
                        <h5 className="font-black uppercase tracking-tight text-xs">{item.title}</h5>
                        <p className="text-xs font-bold opacity-70 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
              </div>

              {/* 15. Contact */}
              <div className="pt-10 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">15. Contact Information</p>
                    <div className="flex flex-col gap-6">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">Legal Inquiries</span>
                            <a href="mailto:legal@vendorlink.com" className="block text-xl font-black hover:opacity-70 transition-opacity uppercase tracking-tight leading-none">legal@vendorlink.com</a>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">Customer Support</span>
                            <a href="mailto:support@vendorlink.com" className="block text-xl font-black hover:opacity-70 transition-opacity uppercase tracking-tight leading-none">support@vendorlink.com</a>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">Official Website</span>
                            <a href="http://www.vendorlink.com" target="_blank" rel="noreferrer" className="block text-xl font-black hover:opacity-70 transition-opacity leading-none">www.vendorlink.com</a>
                        </div>
                    </div>
                </div>
                <div className="text-right shrink-0 pb-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Vendorlink Legal © 2026</p>
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

export default TermsOfService;
