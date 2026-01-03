import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Heart, Shield, Users } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Family Values",
    description: "We treat every resident like family, providing personalized attention and care.",
  },
  {
    icon: Shield,
    title: "Quality Homes",
    description: "Every property is well-maintained and move-in ready for your comfort.",
  },
  {
    icon: Users,
    title: "Community Focus",
    description: "We're committed to strengthening the Ardmore community through quality housing.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Header */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Learn more about Precision Capital and our mission.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Precision Capital is a family-owned real estate company proudly serving Ardmore, Oklahoma and the surrounding communities. Founded on the principles of integrity, quality, and community service, we've dedicated ourselves to providing well-maintained, affordable housing options for families and individuals.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're looking for your first rental, a family home to purchase, or investment opportunities, our team is here to guide you every step of the way. We believe everyone deserves a quality place to call home.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {values.map((value) => (
                <div key={value.title} className="bg-card rounded-2xl p-8 text-center shadow-card">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
