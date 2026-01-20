import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Contact = () => {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    document.title = "Contact Us | Precision Capital";
    setHasMounted(true);
  }, []);
  
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { ref, isVisible } = useScrollAnimation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send email notification
      const { error: emailError } = await supabase.functions.invoke("send-notification", {
        body: {
          form_type: "contact",
          name: formData.name,
          email: formData.email,
          message: formData.message,
        },
      });

      if (emailError) {
        console.error("Email notification failed:", emailError);
      }

      setIsSubmitted(true);
      toast({
        title: "Message Sent!",
        description: "Thank you! We'll be in touch shortly.",
      });
      setFormData({ name: "", email: "", message: "" });
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-heading text-h1-mobile md:text-h1 mb-4 hero-text-shadow">Get in Touch</h1>
            <p className="font-body text-body-lg text-primary-foreground/80 max-w-2xl mx-auto">
              We're here to help with rentals, sales, or resident support.
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div 
              ref={ref}
              className={`grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto transition-all duration-700 ${hasMounted || isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              {/* Contact Form */}
              <div className="bg-card rounded-2xl p-8 shadow-card">
                <h2 className="font-heading text-h3 text-foreground mb-6">Contact Form</h2>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <p className="font-body text-body-lg text-primary font-medium">Thank you! We'll be in touch shortly.</p>
                    <Button
                      variant="outline"
                      className="mt-4 min-h-[44px]"
                      onClick={() => setIsSubmitted(false)}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block font-body text-label text-foreground mb-2">
                        Full Name
                      </label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        required
                        className="min-h-[44px] font-body"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block font-body text-label text-foreground mb-2">
                        Email
                      </label>
                      <Input 
                        id="email" 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        required
                        className="min-h-[44px] font-body"
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block font-body text-label text-foreground mb-2">
                        Message
                      </label>
                      <Textarea 
                        id="message" 
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="How can we help you?"
                        rows={4}
                        required
                        className="font-body"
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full min-h-[44px]" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </div>

              {/* Contact Details */}
              <div>
                <h2 className="font-heading text-h3 text-foreground mb-6">Contact Details</h2>
                <div className="space-y-6">
                  <a 
                    href="tel:+15803990001"
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-foreground">Phone</p>
                      <p className="font-body text-muted-foreground group-hover:text-primary transition-colors">(580) 399-0001</p>
                    </div>
                  </a>
                  <a 
                    href="mailto:management@precisioncapital.homes"
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-foreground">Email</p>
                      <p className="font-body text-muted-foreground group-hover:text-primary transition-colors">management@precisioncapital.homes</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-foreground">Office Hours</p>
                      <p className="font-body text-muted-foreground">Mon–Fri, 9am–5pm</p>
                    </div>
                  </div>
                </div>

                {/* Quick Contact Buttons */}
                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Quick Contact</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href="tel:+15803990001" className="flex-1">
                      <Button variant="outline" className="w-full min-h-[44px]">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Us
                      </Button>
                    </a>
                    <a href="sms:+15803990001" className="flex-1">
                      <Button variant="outline" className="w-full min-h-[44px]">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Text Us
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
