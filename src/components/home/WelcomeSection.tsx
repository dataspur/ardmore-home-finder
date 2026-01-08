import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const WelcomeSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`max-w-3xl mx-auto text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="font-heading text-h2-mobile md:text-h2 text-foreground mb-6">
            Welcome to Precision Capital
          </h2>
          <p className="font-body text-body-lg text-muted-foreground leading-relaxed">
            We're a family-owned real estate company serving Ardmore, OK. Whether you're looking to rent or buy, we provide clean, affordable, and well-managed homes for families and individuals.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
