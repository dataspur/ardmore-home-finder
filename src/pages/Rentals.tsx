import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { calculateDistance, formatDistance } from "@/lib/distance";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Loader2, X } from "lucide-react";
import rental1Img from "@/assets/rental-1.png";
import rental2Img from "@/assets/rental-2.png";
import rental3Img from "@/assets/rental-3.png";

// Fallback images for properties without image_url
const fallbackImages = [rental1Img, rental2Img, rental3Img];

interface Property {
  id: string;
  title: string;
  price_display: string;
  size_sqft: number | null;
  badge: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string;
}

const PropertyCard = ({ 
  listing, 
  index,
  userLocation,
  fallbackImage
}: { 
  listing: Property; 
  index: number;
  userLocation: { latitude: number; longitude: number } | null;
  fallbackImage: string;
}) => {
  const { ref, isVisible } = useScrollAnimation();

  const distance = useMemo(() => {
    if (!userLocation || !listing.latitude || !listing.longitude) return null;
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      listing.latitude,
      listing.longitude
    );
  }, [userLocation, listing.latitude, listing.longitude]);

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
        {distance !== null && (
          <Badge 
            className="absolute top-4 right-4 z-10 bg-background/90 text-foreground backdrop-blur-sm"
          >
            <MapPin className="w-3 h-3 mr-1" />
            {formatDistance(distance)}
          </Badge>
        )}
        <img 
          src={listing.image_url || fallbackImage} 
          alt={listing.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className="p-6">
        <h3 className="font-heading text-h3 text-foreground mb-2">{listing.title}</h3>
        <p className="font-heading text-price text-primary mb-1">{listing.price_display}</p>
        <p className="font-body text-muted-foreground mb-6">{listing.size_sqft ? `${listing.size_sqft.toLocaleString()} sq ft` : ""}</p>
        <Link to="/resident-portal">
          <Button className="w-full min-h-[44px]">Apply Now</Button>
        </Link>
      </div>
    </div>
  );
};

const Rentals = () => {
  const { location, loading: locationLoading, error: locationError, permissionDenied, requestLocation, clearLocation } = useGeolocation();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["rental-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, price_display, size_sqft, badge, image_url, latitude, longitude, address")
        .eq("property_type", "rental")
        .eq("is_active", true);

      if (error) throw error;
      return data as Property[];
    },
  });

  // Sort properties by distance if location is available
  const sortedProperties = useMemo(() => {
    if (!location || properties.length === 0) return properties;

    return [...properties].sort((a, b) => {
      if (!a.latitude || !a.longitude) return 1;
      if (!b.latitude || !b.longitude) return -1;

      const distA = calculateDistance(location.latitude, location.longitude, a.latitude, a.longitude);
      const distB = calculateDistance(location.latitude, location.longitude, b.latitude, b.longitude);
      return distA - distB;
    });
  }, [properties, location]);

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

        {/* Location Controls */}
        <section className="py-6 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {!location ? (
                <Button
                  variant="outline"
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="min-h-[44px]"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Show properties near me
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-body text-sm">Sorted by distance</span>
                  <button
                    onClick={clearLocation}
                    className="ml-2 p-1 hover:bg-background rounded-full transition-colors"
                    aria-label="Clear location"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {locationError && !permissionDenied && (
                <p className="text-sm text-destructive">{locationError}</p>
              )}
              {permissionDenied && (
                <p className="text-sm text-muted-foreground">
                  Enable location in your browser to see distances
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Card Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedProperties.map((listing, index) => (
                  <PropertyCard 
                    key={listing.id} 
                    listing={listing} 
                    index={index}
                    userLocation={location}
                    fallbackImage={fallbackImages[index % fallbackImages.length]}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Rentals;
