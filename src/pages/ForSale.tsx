import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import PropertyInquiryDialog from "@/components/PropertyInquiryDialog";
import sale1Img from "@/assets/sale-1.png";
import sale2Img from "@/assets/sale-2.png";
import sale3Img from "@/assets/sale-3.png";

const forSaleListings = [
  {
    id: 1,
    image: sale1Img,
    title: "3 Bed / 2 Bath – Forest Ln.",
    text: "$215,000 · 1,700 sq ft",
  },
  {
    id: 2,
    image: sale2Img,
    title: "2 Bed / 2 Bath – East Main",
    text: "$179,000 · 1,300 sq ft",
  },
  {
    id: 3,
    image: sale3Img,
    title: "4 Bed / 3 Bath – Willow Way",
    text: "$249,000 · 2,100 sq ft",
  },
];

const ForSale = () => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Homes for Sale | Precision Capital";
  }, []);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Homes for Sale</h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Browse available properties in the Ardmore area.
            </p>
          </div>
        </section>

        {/* Card Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {forSaleListings.map((listing) => (
                <div 
                  key={listing.id} 
                  className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={listing.image} 
                      alt={listing.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{listing.title}</h3>
                    <p className="text-muted-foreground mb-6">{listing.text}</p>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setSelectedProperty(listing.title)}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
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
