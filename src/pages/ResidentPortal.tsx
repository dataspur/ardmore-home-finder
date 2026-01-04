import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Wrench, FileText, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const NAVBAR_HEIGHT = 80;

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
    window.scrollTo({ top, behavior: "smooth" });
  }
};

const ResidentPortal = () => {
  const [maintenanceForm, setMaintenanceForm] = useState({ name: "", email: "", address: "", issue: "" });
  const [leaseForm, setLeaseForm] = useState({ name: "", email: "", address: "" });
  const [maintenanceSubmitted, setMaintenanceSubmitted] = useState(false);
  const [leaseSubmitted, setLeaseSubmitted] = useState(false);
  const { toast } = useToast();

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMaintenanceSubmitted(true);
    toast({
      title: "Request Submitted",
      description: "Your request has been received. Maintenance will follow up shortly.",
    });
    setMaintenanceForm({ name: "", email: "", address: "", issue: "" });
  };

  const handleLeaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeaseSubmitted(true);
    toast({
      title: "Request Submitted",
      description: "We'll email you a copy of your lease shortly.",
    });
    setLeaseForm({ name: "", email: "", address: "" });
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Precision Capital Resident Portal</h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Pay rent, request maintenance, or manage your lease online.
            </p>
          </div>
        </section>

        {/* Feature Columns */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Pay Rent */}
              <div className="bg-card rounded-2xl p-8 shadow-card text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Pay Rent Online</h3>
                <p className="text-muted-foreground mb-6">
                  Make a secure payment using our Stripe-powered portal. A small service fee applies.
                </p>
                <a href="https://buy.stripe.com/YOUR_CUSTOM_LINK" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full">Pay Rent</Button>
                </a>
              </div>

              {/* Maintenance */}
              <div className="bg-card rounded-2xl p-8 shadow-card text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Wrench className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Request Maintenance</h3>
                <p className="text-muted-foreground mb-6">
                  Let us know what needs attention and our team will be on it.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => scrollToSection("maintenance-form")}
                >
                  Submit Request
                </Button>
              </div>

              {/* Lease Copy */}
              <div className="bg-card rounded-2xl p-8 shadow-card text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Request Lease Copy</h3>
                <p className="text-muted-foreground mb-6">
                  Need a copy of your lease agreement? Request one below.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => scrollToSection("lease-form")}
                >
                  Request Lease
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Maintenance Request Form */}
        <section id="maintenance-form" className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-card rounded-2xl p-8 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Maintenance Request</h2>
              {maintenanceSubmitted ? (
                <div className="text-center py-8">
                  <p className="text-lg text-primary font-medium">Your request has been received. Maintenance will follow up shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleMaintenanceSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="maintenance-name" className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <Input 
                      id="maintenance-name" 
                      value={maintenanceForm.name}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, name: e.target.value })}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="maintenance-email" className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <Input 
                      id="maintenance-email" 
                      type="email"
                      value={maintenanceForm.email}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="maintenance-address" className="block text-sm font-medium text-foreground mb-2">
                      Property Address
                    </label>
                    <Input 
                      id="maintenance-address" 
                      value={maintenanceForm.address}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, address: e.target.value })}
                      placeholder="Your property address"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="maintenance-issue" className="block text-sm font-medium text-foreground mb-2">
                      Describe the issue
                    </label>
                    <Textarea 
                      id="maintenance-issue" 
                      value={maintenanceForm.issue}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issue: e.target.value })}
                      placeholder="Please describe the maintenance issue..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    Submit Request
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Lease Copy Request Form */}
        <section id="lease-form" className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-card rounded-2xl p-8 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Lease Copy Request</h2>
              {leaseSubmitted ? (
                <div className="text-center py-8">
                  <p className="text-lg text-primary font-medium">We'll email you a copy of your lease shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleLeaseSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="lease-name" className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <Input 
                      id="lease-name" 
                      value={leaseForm.name}
                      onChange={(e) => setLeaseForm({ ...leaseForm, name: e.target.value })}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lease-email" className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <Input 
                      id="lease-email" 
                      type="email"
                      value={leaseForm.email}
                      onChange={(e) => setLeaseForm({ ...leaseForm, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lease-address" className="block text-sm font-medium text-foreground mb-2">
                      Property Address
                    </label>
                    <Input 
                      id="lease-address" 
                      value={leaseForm.address}
                      onChange={(e) => setLeaseForm({ ...leaseForm, address: e.target.value })}
                      placeholder="Your property address"
                      required
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    Request Lease
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Need Help */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-foreground mb-6">Need Help?</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a href="tel:5805551234" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-5 h-5" />
                  (580) 555-1234
                </a>
                <a href="mailto:help@precisioncapitalrentals.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                  help@precisioncapitalrentals.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ResidentPortal;
