import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const rentalListings = [
  {
    id: 1,
    image: "/images/rental-1.jpg",
    title: "3 Bed / 2 Bath – Maple St.",
    text: "$1,200/mo · 1,450 sq ft",
  },
  {
    id: 2,
    image: "/images/rental-2.jpg",
    title: "2 Bed / 1 Bath – 7th Ave.",
    text: "$925/mo · 980 sq ft",
  },
  {
    id: 3,
    image: "/images/rental-3.jpg",
    title: "4 Bed / 3 Bath – Cedar Dr.",
    text: "$1,600/mo · 1,900 sq ft",
  },
];

const Rentals = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Available Rentals</h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Find your next home in Ardmore, Oklahoma.
            </p>
          </div>
        </section>

        {/* Card Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rentalListings.map((listing) => (
                <div 
                  key={listing.id} 
                  className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-48 bg-muted flex items-center justify-center">
                    <Home className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{listing.title}</h3>
                    <p className="text-muted-foreground mb-6">{listing.text}</p>
                    <Link to="/resident-portal">
                      <Button className="w-full">Apply Now</Button>
                    </Link>
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

export default Rentals;
