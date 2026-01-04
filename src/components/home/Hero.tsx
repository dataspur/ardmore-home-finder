import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-home.jpg";
import droneVideo from "@/assets/drone-video.mp4";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={heroImage}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={droneVideo} type="video/mp4" />
      </video>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-hero" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Quality Living in Ardmore
          </h1>
          <p 
            className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto opacity-0 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            Proudly offering well-maintained homes and rentals in Southern Oklahoma.
          </p>
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            <Link to="/rentals">
              <Button variant="hero" size="lg">
                View Rentals
              </Button>
            </Link>
            <Link to="/for-sale">
              <Button variant="heroOutline" size="lg">
                View Homes for Sale
              </Button>
            </Link>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
