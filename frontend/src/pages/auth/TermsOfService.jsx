import React from "react";
import { PageTransition } from "@/components/ui";

const TermsOfService = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground py-16 px-6 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-[800px] border border-border bg-card p-10 sm:p-16 shadow-soft rounded-sm">
          {/* Document Header */}
          <div className="border-b-2 border-foreground pb-8 mb-12">
            <h1 className="text-3xl font-serif font-bold uppercase tracking-tight text-foreground mb-2">
              Terms of Service
            </h1>
            <p className="text-sm font-medium text-muted-foreground italic">
              Effective Date: April 20, 2025
            </p>
          </div>

          <div className="space-y-10 text-[15px] leading-[1.6] font-serif text-justify text-foreground/90">
            
            {/* 1. Acceptance of Terms */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                1. ACCEPTANCE OF TERMS
              </h2>
              <p>
                By accessing or using the Vendorlink platform (the “Platform”), you agree to be bound by these Terms of Service (“Terms”). If you do not agree to these Terms, you must immediately cease all use of the Platform. These Terms, together with our Privacy Policy, constitute the entire agreement between you and Vendorlink.
              </p>
            </section>

            {/* 2. Eligibility */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                2. ELIGIBILITY
              </h2>
              <p>To use the Platform, you must meet the following criteria:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be at least 18 years of age.</li>
                <li>Have the legal capacity to enter into a binding contract.</li>
                <li>Provide accurate, current, and complete registration information.</li>
                <li>Successfully complete any required account verification processes.</li>
              </ul>
              <p className="italic">
                Vendorlink reserves the right to refuse service or terminate accounts at its sole discretion.
              </p>
            </section>

            {/* 3. Account Registration and Security */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                3. ACCOUNT REGISTRATION AND SECURITY
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-bold italic underline text-foreground/80">3.1 Account Responsibility</h3>
                  <p>
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold italic underline text-foreground/80">3.2 Account Verification</h3>
                  <p>
                    Users must provide valid documentation for verification. Providing false or misleading information is a violation of these Terms and may result in immediate account termination.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold italic underline text-foreground/80">3.3 User Roles</h3>
                  <p>
                    The Platform supports different roles (Company, Vendor, Administrator), each with specific permissions and responsibilities as defined within the Platform's interface.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Platform Services */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                4. PLATFORM SERVICES
              </h2>
              <div className="space-y-4">
                <p><strong className="text-foreground">4.1 Tasks and Proposals:</strong> Companies may post tasks, and Vendors may submit proposals. While our AI tools assist in ranking and matching, the final selection is the sole responsibility of the users.</p>
                <p><strong className="text-foreground">4.2 Contracts:</strong> Agreements generated through the Platform are legally binding contracts between the Company and the Vendor. Vendorlink is not a party to these contracts.</p>
                <p><strong className="text-foreground">4.3 Payments:</strong> All financial transactions are facilitated via secure third-party payment processors. Vendorlink is not liable for issues arising from payment processor failures.</p>
              </div>
            </section>

            {/* 5. User Obligations and Prohibited Conduct */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                5. USER OBLIGATIONS
              </h2>
              <p>Users agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Platform for any illegal or unauthorized purpose.</li>
                <li>Bypass Platform payment systems to avoid service fees.</li>
                <li>Post fraudulent, defamatory, or malicious content.</li>
                <li>Infringe upon the intellectual property rights of others.</li>
                <li>Interfere with the Platform's security or performance.</li>
              </ul>
            </section>

            {/* 6. Fees and Payments */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                6. FEES AND PAYMENTS
              </h2>
              <p>
                Vendorlink reserves the right to charge service fees for the use of certain Platform features. All fees are clearly disclosed and are non-refundable unless otherwise required by law.
              </p>
            </section>

            {/* 7. Intellectual Property */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                7. INTELLECTUAL PROPERTY
              </h2>
              <p>
                Vendorlink owns all rights, title, and interest in the Platform technology and branding. Users retain ownership of their uploaded content but grant Vendorlink a non-exclusive license to use such content for Platform operations.
              </p>
            </section>

            {/* 8. Limitation of Liability */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                8. LIMITATION OF LIABILITY
              </h2>
              <p className="uppercase font-bold text-xs text-foreground">
                To the maximum extent permitted by law, Vendorlink shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the Platform.
              </p>
            </section>

            {/* 9. Termination */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                9. TERMINATION
              </h2>
              <p>
                We may suspend or terminate your access to the Platform at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users or the Platform itself.
              </p>
            </section>

            {/* 10. Governing Law */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold border-b border-border pb-1 text-foreground">
                10. GOVERNING LAW
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Pakistan, without regard to its conflict of law provisions.
              </p>
            </section>

            {/* 11. Contact Information */}
            <section className="space-y-4 pt-8 border-t-2 border-foreground">
              <h2 className="text-lg font-bold uppercase text-foreground">
                11. Contact Information
              </h2>
              <div className="space-y-4 not-italic text-foreground/80">
                <div className="space-y-1">
                  <p className="font-bold text-xs uppercase text-muted-foreground">Legal Inquiries</p>
                  <p><a href="mailto:legal@vendorlink.com" className="underline hover:text-foreground">legal@vendorlink.com</a></p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-xs uppercase text-muted-foreground">Customer Support</p>
                  <p><a href="mailto:support.vendorlink@gmail.com" className="underline hover:text-foreground">support.vendorlink@gmail.com</a></p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-xs uppercase text-muted-foreground">Official Website</p>
                  <p><a href="http://www.vendorlink.com" className="underline hover:text-foreground">www.vendorlink.com</a></p>
                </div>
              </div>
            </section>

            <div className="pt-12 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
              End of Terms of Service
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default TermsOfService;
