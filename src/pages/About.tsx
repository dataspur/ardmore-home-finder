import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, Phone, Building } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import bradyNormanImg from "@/assets/brady-norman.png";

const whyChooseUs = [
  "Locally owned and operated",
  "Responsive maintenance and support",
  "Quality homes with character",
  "A deep commitment to community",
];

const About = () => {
  useEffect(() => {
    document.title = "About Us | Precision Capital";
  }, []);

  const { ref: missionRef, isVisible: missionVisible } = useScrollAnimation();
  const { ref: whyRef, isVisible: whyVisible } = useScrollAnimation();
  const { ref: founderRef, isVisible: founderVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-heading text-h1-mobile md:text-h1 mb-4 hero-text-shadow">A Family Business You Can Trust</h1>
            <p className="font-body text-body-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Serving the Ardmore community with quality homes and personal service.
            </p>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div 
              ref={missionRef}
              className={`max-w-3xl mx-auto transition-all duration-700 ${missionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <h2 className="font-heading text-h2-mobile md:text-h2 text-foreground mb-6">Our Mission</h2>
              <p className="font-body text-body-lg text-muted-foreground leading-relaxed">
                At Precision Capital, we believe everyone deserves a safe, clean, and affordable home. As a family-owned real estate company, we treat every tenant and buyer with respect and personal care. Our goal is to make housing better in Ardmore, one property at a time.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div 
              ref={whyRef}
              className={`max-w-3xl mx-auto transition-all duration-700 ${whyVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <h2 className="font-heading text-h2-mobile md:text-h2 text-foreground mb-8">Why Choose Us?</h2>
              <ul className="space-y-4">
                {whyChooseUs.map((item, index) => (
                  <li 
                    key={item} 
                    className={`flex items-center gap-3 font-body text-body-lg text-muted-foreground transition-all duration-500 ${whyVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
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
            <div 
              ref={founderRef}
              className={`max-w-4xl mx-auto transition-all duration-700 ${founderVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <h2 className="font-heading text-h2-mobile md:text-h2 text-foreground mb-10 text-center">Meet the Founder</h2>
              
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Photo */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <img 
                    src={bradyNormanImg} 
                    alt="Brady Norman, Founder of Precision Capital" 
                    className="w-64 h-80 object-cover rounded-lg shadow-lg"
                    loading="lazy"
                  />
                </div>

                {/* Bio Content */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="font-heading text-h3 text-foreground">Brady Norman</h3>
                    <p className="font-body text-primary font-medium">Real Estate Developer & Agent</p>
                  </div>

                  <p className="font-body text-muted-foreground leading-relaxed">
                    Brady Norman has seamlessly transitioned from being one of the nation's most decorated young team ropers to becoming a respected real estate developer and agent in Oklahoma. Based in Ardmore, Brady now applies the same discipline, precision, and competitive drive that made him a champion in the rodeo arena to building and developing properties throughout the region.
                  </p>

                  <div>
                    <h4 className="font-heading text-lg font-semibold text-foreground mb-2">Real Estate Development & Investment</h4>
                    <p className="font-body text-muted-foreground leading-relaxed">
                      Brady is the founder and principal of Precision Capital, a real estate development and investment firm specializing in property acquisition, renovation, development, and sales. His company focuses on the "Land. Build. Flip. Hold." model, actively managing approximately 10 homes per project cycle. Through Precision Capital, Brady has successfully repositioned numerous properties in the Ardmore and surrounding Oklahoma markets, creating value through strategic renovations and market-informed development decisions.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-heading text-lg font-semibold text-foreground mb-2">Real Estate Sales</h4>
                    <p className="font-body text-muted-foreground leading-relaxed">
                      As a licensed real estate agent with Claudia & Carolyn Realty Group, Brady leverages his deep roots in the Ardmore community to serve buyers and sellers with integrity and market expertise. His intimate knowledge of the local real estate landscape—combined with his business acumen—enables him to guide clients through transactions with confidence and efficiency.
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-heading text-lg font-semibold text-foreground mb-3">Contact</h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <a 
                        href="tel:+15804652714" 
                        className="flex items-center gap-2 font-body text-muted-foreground hover:text-primary transition-colors min-h-[44px]"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Mobile: (580) 465-2714</span>
                      </a>
                      <a 
                        href="tel:+15802236842" 
                        className="flex items-center gap-2 font-body text-muted-foreground hover:text-primary transition-colors min-h-[44px]"
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
