import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Terms = () => {
  useEffect(() => {
    document.title = "Terms of Service | Precision Capital";
  }, []);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-slate">
              <p className="text-muted-foreground mb-8">
                <strong>Last Updated:</strong> January 8, 2026
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using the Precision Capital website (precisioncapital.homes), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Description of Services</h2>
              <p className="text-muted-foreground mb-4">
                Precision Capital provides real estate services including property rentals, home sales, and property management in the Ardmore, Oklahoma area. Our website offers:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Property listings and information</li>
                <li>Resident portal for current tenants</li>
                <li>Online rent payment processing</li>
                <li>Contact and inquiry forms</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground mb-4">
                To access certain features of our website, such as the Resident Portal, you may be required to create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Payment Terms</h2>
              <p className="text-muted-foreground mb-4">
                Rent payments made through our website are processed by Stripe. By making a payment, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Stripe's terms of service and privacy policy</li>
                <li>Pay any applicable processing fees as disclosed</li>
                <li>Ensure sufficient funds are available for payment</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                Payment processing times may vary. Online payments do not replace your lease obligations regarding payment due dates.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Property Information</h2>
              <p className="text-muted-foreground mb-4">
                While we strive to provide accurate property information, listings on our website are for informational purposes only. Availability, pricing, and property details are subject to change without notice. Please contact us directly to verify current information.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Prohibited Conduct</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Use the website for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the website</li>
                <li>Submit false or misleading information</li>
                <li>Reproduce or distribute content without permission</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                All content on this website, including text, images, logos, and design, is the property of Precision Capital and is protected by copyright and trademark laws. You may not use, reproduce, or distribute our content without written permission.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground mb-4">
                THE WEBSITE AND SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE WEBSITE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                TO THE FULLEST EXTENT PERMITTED BY LAW, PRECISION CAPITAL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE WEBSITE OR SERVICES.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">10. Indemnification</h2>
              <p className="text-muted-foreground mb-4">
                You agree to indemnify and hold harmless Precision Capital and its owners, employees, and agents from any claims, damages, or expenses arising from your use of the website or violation of these terms.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">11. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These Terms of Service shall be governed by and construed in accordance with the laws of the State of Oklahoma, without regard to its conflict of law provisions. Any disputes arising under these terms shall be resolved in the courts of Carter County, Oklahoma.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">12. Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website after changes are posted constitutes acceptance of the modified terms.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">13. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-secondary rounded-lg p-6 text-muted-foreground">
                <p className="font-semibold text-foreground">Precision Capital</p>
                <p>Ardmore, Oklahoma</p>
                <p>Email: management@precisioncapital.homes</p>
                <p>Phone: (580) 399-0001</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
