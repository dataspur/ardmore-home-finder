import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import rental1Img from "@/assets/rental-1.png";
import rental2Img from "@/assets/rental-2.png";
import rental3Img from "@/assets/rental-3.png";

const rentalListings = [
  {
    id: 1,
    image: rental1Img,
    title: "3 Bed / 2 Bath – Maple St.",
    price: "$1,200/mo",
    size: "1,450 sq ft",
    badge: "Available",
  },
  {
    id: 2,
    image: rental2Img,
    title: "2 Bed / 1 Bath – 7th Ave.",
    price: "$925/mo",
    size: "980 sq ft",
    badge: "Featured",
  },
  {
    id: 3,
    image: rental3Img,
    title: "4 Bed / 3 Bath – Cedar Dr.",
    price: "$1,600/mo",
    size: "1,900 sq ft",
    badge: "Available",
  },
];

const PropertyCard = ({ listing, index }: { listing: typeof rentalListings[0]; index: number }) => {
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
        <Link to="/resident-portal">
          <Button className="w-full min-h-[44px]">Apply Now</Button>
        </Link>
      </div>
    </div>
  );
};

const Rentals = () => {
  useEffect(() => {
    document.title = "Available Rentals | Precision Capital";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-heading text-h1-mobile md:text-h1 mb-4 hero-text-shadow">Available Rentals</h1>
            <p className="font-body text-body-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Find your next home in Ardmore, Oklahoma.
            </p>
          </div>
        </section>

        {/* Card Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rentalListings.map((listing, index) => (
                <PropertyCard key={listing.id} listing={listing} index={index} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Rentals;
