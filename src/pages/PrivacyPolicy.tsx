import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | Precision Capital";
  }, []);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-slate">
              <p className="text-muted-foreground mb-8">
                <strong>Last Updated:</strong> January 8, 2026
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Precision Capital ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website precisioncapital.homes and use our services.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Personal Information</h3>
              <p className="text-muted-foreground mb-4">
                We may collect personal information that you voluntarily provide when you:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Submit a contact form or inquiry</li>
                <li>Apply for a rental property</li>
                <li>Create a resident portal account</li>
                <li>Make a rent payment through our platform</li>
                <li>Communicate with us via email or phone</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                This information may include your name, email address, phone number, mailing address, and payment information.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Automatically Collected Information</h3>
              <p className="text-muted-foreground mb-4">
                When you visit our website, we may automatically collect certain information about your device, including your IP address, browser type, operating system, and browsing behavior.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Process rental applications and manage tenant relationships</li>
                <li>Process rent payments and maintain payment records</li>
                <li>Respond to inquiries and provide customer support</li>
                <li>Send important updates about your tenancy or property</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Payment Processing</h2>
              <p className="text-muted-foreground mb-4">
                We use Stripe, a third-party payment processor, to process rent payments. When you make a payment, your payment information is transmitted directly to Stripe and is subject to Stripe's privacy policy. We do not store your complete credit card information on our servers.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Service providers who assist in our operations (e.g., payment processing, email services)</li>
                <li>Legal authorities when required by law or to protect our rights</li>
                <li>Business partners in the event of a merger, acquisition, or sale of assets</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Cookies</h2>
              <p className="text-muted-foreground mb-4">
                Our website may use cookies and similar tracking technologies to enhance your browsing experience. You can set your browser to refuse cookies, but some features of our website may not function properly.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">8. Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt out of marketing communications</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                To exercise these rights, please contact us using the information below.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground mb-4">
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;
