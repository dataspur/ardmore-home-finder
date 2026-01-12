import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Wrench, FileText, Phone, Mail, LogOut, Loader2, Bell } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import TenantMessagesCard from "@/components/tenant/TenantMessagesCard";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { TenantLeaseDocuments } from "@/components/tenant/TenantLeaseDocuments";

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
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const [leaseSubmitting, setLeaseSubmitting] = useState(false);
  const [maintenanceSubmitted, setMaintenanceSubmitted] = useState(false);
  const [leaseSubmitted, setLeaseSubmitted] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: unreadCount } = useUnreadMessageCount();

  const handlePayRent = async () => {
    if (!user) return;
    
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_tenant_lease_by_user', {
        lookup_user_id: user.id
      });

      if (error) throw error;

      const leaseData = data as { access_token: string; lease_id: string; property_address: string; tenant_id: string } | null;

      if (!leaseData || !leaseData.access_token) {
        toast({
          title: "No Active Lease Found",
          description: "We couldn't find an active lease linked to your account. Please contact management.",
          variant: "destructive",
        });
        return;
      }

      // Redirect to the enterprise tenant portal
      navigate(`/pay/${leaseData.access_token}`);
    } catch (error: any) {
      console.error("Payment lookup error:", error);
      toast({
        title: "Error",
        description: "Failed to load payment portal. Please try again or contact management.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setMaintenanceSubmitting(true);

    try {
      // Save to database
      const { error: dbError } = await supabase.from("form_submissions").insert({
        form_type: "maintenance",
        user_id: user.id,
        data: {
          name: maintenanceForm.name,
          email: maintenanceForm.email,
          address: maintenanceForm.address,
          issue: maintenanceForm.issue,
        },
      });

      if (dbError) throw dbError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke("send-notification", {
        body: {
          form_type: "maintenance",
          name: maintenanceForm.name,
          email: maintenanceForm.email,
          address: maintenanceForm.address,
          issue: maintenanceForm.issue,
        },
      });

      if (emailError) {
        console.error("Email notification failed:", emailError);
      }

      setMaintenanceSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "Your maintenance request has been received. Our team will follow up shortly.",
      });
      setMaintenanceForm({ name: "", email: "", address: "", issue: "" });
    } catch (error: any) {
      console.error("Maintenance submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMaintenanceSubmitting(false);
    }
  };

  const handleLeaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLeaseSubmitting(true);

    try {
      // Save to database
      const { error: dbError } = await supabase.from("form_submissions").insert({
        form_type: "lease",
        user_id: user.id,
        data: {
          name: leaseForm.name,
          email: leaseForm.email,
          address: leaseForm.address,
        },
      });

      if (dbError) throw dbError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke("send-notification", {
        body: {
          form_type: "lease",
          name: leaseForm.name,
          email: leaseForm.email,
          address: leaseForm.address,
        },
      });

      if (emailError) {
        console.error("Email notification failed:", emailError);
      }

      setLeaseSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "We'll email you a copy of your lease shortly.",
      });
      setLeaseForm({ name: "", email: "", address: "" });
    } catch (error: any) {
      console.error("Lease submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLeaseSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Precision Capital Resident Portal</h1>
                <p className="text-lg text-primary-foreground/80 max-w-2xl">
                  Pay rent, request maintenance, or manage your lease online.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount && unreadCount > 0 && (
                  <div className="flex items-center gap-2 bg-primary-foreground/20 px-4 py-2 rounded-lg">
                    <Bell className="w-5 h-5" />
                    <span className="font-medium">{unreadCount} new message{unreadCount > 1 ? 's' : ''}</span>
                  </div>
                )}
                <Button
                  variant="secondary"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Messages from Management */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <TenantMessagesCard />
            </div>
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
                <Button className="w-full" onClick={handlePayRent} disabled={paymentLoading}>
                  {paymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Pay Rent"
                  )}
                </Button>
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

              {/* Lease Documents */}
              <div className="bg-card rounded-2xl p-8 shadow-card text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Your Lease Documents</h3>
                <p className="text-muted-foreground mb-6">
                  Access your lease agreements and documents instantly.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => scrollToSection("lease-documents")}
                >
                  View Documents
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
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setMaintenanceSubmitted(false)}
                  >
                    Submit Another Request
                  </Button>
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
                  <Button type="submit" size="lg" className="w-full" disabled={maintenanceSubmitting}>
                    {maintenanceSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Lease Documents Section */}
        <section id="lease-documents" className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <TenantLeaseDocuments />
              
              {/* Fallback Request Form */}
              <div className="mt-8 bg-card rounded-2xl p-8 shadow-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Don't see your document?</h3>
                <p className="text-muted-foreground mb-6">
                  Request a copy and we'll send it to your email.
                </p>
                {leaseSubmitted ? (
                  <div className="text-center py-4">
                    <p className="text-primary font-medium">We'll email you a copy of your lease shortly.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setLeaseSubmitted(false)}
                    >
                      Submit Another Request
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleLeaseSubmit} className="space-y-4">
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
                    <Button type="submit" className="w-full" disabled={leaseSubmitting}>
                      {leaseSubmitting ? "Submitting..." : "Request Lease Copy"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Need Help */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-foreground mb-6">Need Help?</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a href="tel:5803990001" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-5 h-5" />
                  (580) 399-0001
                </a>
                <a href="mailto:management@precisioncapital.homes" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                  management@precisioncapital.homes
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
