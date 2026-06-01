import React from "react";
import { PageTransition } from "@/components/ui";

const PrivacyPolicy = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground py-16 px-6 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-[800px] border border-border bg-card p-10 sm:p-16 shadow-soft rounded-sm">
          {/* Document Header */}
          <div className="border-b-2 border-foreground pb-8 mb-12">
            <h1 className="text-3xl font-serif font-bold uppercase tracking-tight text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm font-medium text-muted-foreground italic">
              Effective Date: April 20, 2025
            </p>
          </div>

          <div className="space-y-10 text-[15px] leading-[1.6] font-serif text-justify text-foreground/90">
            
            {/* 1. Introduction */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                1. INTRODUCTION
              </h2>
              <div className="space-y-4">
                <p>
                  Vendorlink (“we”, “our”, or “us”) operates the Vendorlink platform (the “Platform”), a web-based system for vendor management and collaboration.
                </p>
                <p>
                  We are committed to protecting the privacy of all users, including Companies, Vendors, and Administrators. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information.
                </p>
                <p className="font-bold text-foreground">
                  BY USING VENDORLINK, YOU AGREE TO THIS PRIVACY POLICY.
                </p>
              </div>
            </section>

            {/* 2. Information We Collect */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                2. INFORMATION WE COLLECT
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-bold italic underline text-foreground/80">2.1 Information You Provide</h3>
                  <p>When you register and use the Platform, we collect various types of information, including but not limited to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-foreground">Account Information:</strong> Name, email address, password, and account role.</li>
                    <li><strong className="text-foreground">Business Details:</strong> Registration documents, tax information, and business licenses.</li>
                    <li><strong className="text-foreground">Vendor Profiles:</strong> Skills, service descriptions, portfolio samples, and pricing details.</li>
                    <li><strong className="text-foreground">Project Data:</strong> Task descriptions, proposals, and project deliverables.</li>
                    <li><strong className="text-foreground">Financial Information:</strong> Payment details processed via our secure third-party providers.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold italic underline text-foreground/80">2.2 Automatically Collected Information</h3>
                  <p>When you access the Platform, our systems may automatically collect data such as:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>IP address, browser type, and operating system.</li>
                    <li>Usage patterns, session durations, and interaction data.</li>
                    <li>Device identifiers and cookie data for authentication and analytics.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold italic underline text-foreground/80">2.3 Third-Party Sources</h3>
                  <p>We may receive information about you from third-party services, such as payment processors or identity verification services.</p>
                </div>
              </div>
            </section>

            {/* 3. How We Use Information */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                3. HOW WE USE INFORMATION
              </h2>
              <p>The information we collect is used for the following purposes:</p>
              <ul className="list-decimal pl-6 space-y-2">
                <li>To provide and maintain the Platform's core functionalities.</li>
                <li>To facilitate communication between Companies and Vendors.</li>
                <li>To verify user identity and ensure platform security.</li>
                <li>To process payments and maintain financial records.</li>
                <li>To comply with legal obligations and prevent fraudulent activity.</li>
                <li>To analyze platform usage and improve user experience.</li>
              </ul>
            </section>

            {/* 4. Data Sharing and Disclosure */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                4. DATA SHARING AND DISCLOSURE
              </h2>
              <p>We do not sell your personal data. We may share information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Other Users:</strong> Information necessary for project collaboration and hiring.</li>
                <li><strong className="text-foreground">Service Providers:</strong> Third parties that provide hosting, payment processing, and analytics.</li>
                <li><strong className="text-foreground">Legal Authorities:</strong> When required by law or to protect our legal rights.</li>
                <li><strong className="text-foreground">Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets.</li>
              </ul>
            </section>

            {/* 5. Data Security */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                5. DATA SECURITY
              </h2>
              <p>
                We implement industry-standard security measures, including HTTPS/TLS encryption and role-based access control, to protect your data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* 6. Data Retention */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                6. DATA RETENTION
              </h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide you with services, comply with our legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            {/* 7. Your Rights */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                7. YOUR RIGHTS
              </h2>
              <p>
                Users have the right to access, correct, or delete their personal information. You may also object to processing or request data portability. To exercise these rights, please contact us at the email provided below.
              </p>
            </section>

            {/* 8. International Data Transfers */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                8. INTERNATIONAL DATA TRANSFERS
              </h2>
              <p>
                Your information may be transferred to and maintained on computers located outside of your state, province, or country, where data protection laws may differ.
              </p>
            </section>

            {/* 9. Contact Information */}
            <section className="space-y-4 pt-8 border-t-2 border-foreground">
              <h2 className="text-lg font-bold uppercase text-foreground">
                9. Contact Information
              </h2>
              <div className="space-y-1 not-italic text-foreground/80">
                <p>For any questions regarding this Privacy Policy, please contact:</p>
                <p className="font-bold text-foreground">Vendorlink Legal Department</p>
                <p>Email: <a href="mailto:privacy@vendorlink.com" className="underline hover:text-foreground">privacy@vendorlink.com</a></p>
                <p>Website: <a href="http://www.vendorlink.com" className="underline hover:text-foreground">www.vendorlink.com</a></p>
                <p>Address: Vendorlink HQ, Pakistan</p>
              </div>
            </section>

            <div className="pt-12 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
              End of Privacy Policy
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default PrivacyPolicy;
