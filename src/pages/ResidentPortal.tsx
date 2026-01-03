import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, CreditCard, Wrench, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const features = [
  {
    icon: CreditCard,
    title: "Pay Rent Online",
    description: "Securely pay your rent from anywhere, anytime.",
  },
  {
    icon: Wrench,
    title: "Maintenance Requests",
    description: "Submit and track maintenance requests easily.",
  },
  {
    icon: FileText,
    title: "View Documents",
    description: "Access your lease and important documents.",
  },
];

const ResidentPortal = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Portal Coming Soon",
      description: "The resident portal is currently under development.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Header */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Resident Portal</h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Manage your rental experience online.
            </p>
          </div>
        </section>

        {/* Portal Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Features */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Portal Features</h2>
                <div className="space-y-6">
                  {features.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Login Form */}
              <div className="bg-card rounded-2xl p-8 shadow-card">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <LogIn className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Resident Login</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                      Password
                    </label>
                    <Input 
                      id="password" 
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    Sign In
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Need help? Contact us at (580) 555-1234
                  </p>
                </form>
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
