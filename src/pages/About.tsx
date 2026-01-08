import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, Phone, Building } from "lucide-react";
import bradyNormanImg from "@/assets/brady-norman.png";

const whyChooseUs = [
  "Locally owned and operated",
  "Responsive maintenance and support",
  "Quality homes with character",
  "A deep commitment to community",
];

const About = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">A Family Business You Can Trust</h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Serving the Ardmore community with quality homes and personal service.
            </p>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                At Precision Capital, we believe everyone deserves a safe, clean, and affordable home. As a family-owned real estate company, we treat every tenant and buyer with respect and personal care. Our goal is to make housing better in Ardmore, one property at a time.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-8">Why Choose Us?</h2>
              <ul className="space-y-4">
                {whyChooseUs.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-lg text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Founder Bio */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-10 text-center">Meet the Founder</h2>
              
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Photo */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <img 
                    src={bradyNormanImg} 
                    alt="Brady Norman, Founder of Precision Capital" 
                    className="w-64 h-80 object-cover rounded-lg shadow-lg"
                  />
                </div>

                {/* Bio Content */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Brady Norman</h3>
                    <p className="text-primary font-medium">Real Estate Developer & Agent</p>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    Brady Norman has seamlessly transitioned from being one of the nation's most decorated young team ropers to becoming a respected real estate developer and agent in Oklahoma. Based in Ardmore, Brady now applies the same discipline, precision, and competitive drive that made him a champion in the rodeo arena to building and developing properties throughout the region.
                  </p>

                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">Real Estate Development & Investment</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Brady is the founder and principal of Precision Capital, a real estate development and investment firm specializing in property acquisition, renovation, development, and sales. His company focuses on the "Land. Build. Flip. Hold." model, actively managing approximately 10 homes per project cycle. Through Precision Capital, Brady has successfully repositioned numerous properties in the Ardmore and surrounding Oklahoma markets, creating value through strategic renovations and market-informed development decisions.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">Real Estate Sales</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      As a licensed real estate agent with Claudia & Carolyn Realty Group, Brady leverages his deep roots in the Ardmore community to serve buyers and sellers with integrity and market expertise. His intimate knowledge of the local real estate landscape—combined with his business acumen—enables him to guide clients through transactions with confidence and efficiency.
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-lg font-semibold text-foreground mb-3">Contact</h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <a 
                        href="tel:+15804652714" 
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Mobile: (580) 465-2714</span>
                      </a>
                      <a 
                        href="tel:+15802236842" 
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Building className="w-4 h-4" />
                        <span>Office: (580) 223-6842</span>
                      </a>
                    </div>
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

export default About;
