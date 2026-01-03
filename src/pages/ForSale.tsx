import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Home, BedDouble, Bath, Square } from "lucide-react";

const forSaleListings = [
  {
    id: 1,
    title: "Charming Starter Home",
    address: "234 Pine Street, Ardmore",
    price: 175000,
    beds: 3,
    baths: 2,
    sqft: 1400,
  },
  {
    id: 2,
    title: "Updated Ranch Style",
    address: "567 Cedar Lane, Ardmore",
    price: 225000,
    beds: 3,
    baths: 2,
    sqft: 1750,
  },
  {
    id: 3,
    title: "Executive Family Home",
    address: "890 Birch Boulevard, Ardmore",
    price: 325000,
    beds: 4,
    baths: 3,
    sqft: 2400,
  },
];

const ForSale = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Header */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Homes for Sale</h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Discover your dream home in Ardmore, Oklahoma.
            </p>
          </div>
        </section>

        {/* Listings */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {forSaleListings.map((listing) => (
                <div 
                  key={listing.id} 
                  className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-48 bg-muted flex items-center justify-center">
                    <Home className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-1">{listing.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{listing.address}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <BedDouble size={16} /> {listing.beds} beds
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath size={16} /> {listing.baths} bath
                      </span>
                      <span className="flex items-center gap-1">
                        <Square size={16} /> {listing.sqft} sqft
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">${listing.price.toLocaleString()}</span>
                      <Button size="sm">View Details</Button>
                    </div>
                  </div>
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

export default ForSale;
