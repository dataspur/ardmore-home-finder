import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PropertyInquiryDialog from "@/components/PropertyInquiryDialog";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import sale1Img from "@/assets/sale-1.png";
import sale2Img from "@/assets/sale-2.png";
import sale3Img from "@/assets/sale-3.png";

const forSaleListings = [
  {
    id: 1,
    image: sale1Img,
    title: "3 Bed / 2 Bath – Forest Ln.",
    price: "$215,000",
    size: "1,700 sq ft",
    badge: "For Sale",
  },
  {
    id: 2,
    image: sale2Img,
    title: "2 Bed / 2 Bath – East Main",
    price: "$179,000",
    size: "1,300 sq ft",
    badge: "Featured",
  },
  {
    id: 3,
    image: sale3Img,
    title: "4 Bed / 3 Bath – Willow Way",
    price: "$249,000",
    size: "2,100 sq ft",
    badge: "For Sale",
  },
];

const PropertyCard = ({ 
  listing, 
  index, 
  onLearnMore 
}: { 
  listing: typeof forSaleListings[0]; 
  index: number;
  onLearnMore: (title: string) => void;
}) => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div 
      ref={ref}
      className={`bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-2 group ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="h-56 overflow-hidden relative">
        <Badge 
          className={`absolute top-4 left-4 z-10 ${listing.badge === "Featured" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}
        >
          {listing.badge}
        </Badge>
        <img 
          src={listing.image} 
          alt={listing.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className="p-6">
        <h3 className="font-heading text-h3 text-foreground mb-2">{listing.title}</h3>
        <p className="font-heading text-price text-primary mb-1">{listing.price}</p>
        <p className="font-body text-muted-foreground mb-6">{listing.size}</p>
        <Button 
          className="w-full min-h-[44px]" 
          variant="outline"
          onClick={() => onLearnMore(listing.title)}
        >
          Learn More
        </Button>
      </div>
    </div>
  );
};

const ForSale = () => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Homes for Sale | Precision Capital";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-heading text-h1-mobile md:text-h1 mb-4 hero-text-shadow">Homes for Sale</h1>
            <p className="font-body text-body-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Browse available properties in the Ardmore area.
            </p>
          </div>
        </section>

        {/* Card Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {forSaleListings.map((listing, index) => (
                <PropertyCard 
                  key={listing.id} 
                  listing={listing} 
                  index={index}
                  onLearnMore={setSelectedProperty}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <PropertyInquiryDialog
        open={!!selectedProperty}
        onOpenChange={(open) => !open && setSelectedProperty(null)}
        propertyTitle={selectedProperty || ""}
      />
    </div>
  );
};

export default ForSale;
