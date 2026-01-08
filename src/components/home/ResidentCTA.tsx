import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const ResidentCTA = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div 
          ref={ref}
          className={`max-w-4xl mx-auto bg-card rounded-3xl p-10 md:p-14 shadow-card text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-heading text-h2-mobile md:text-h2 text-foreground mb-4">
            Already living with Precision Capital?
          </h2>
          <p className="font-body text-muted-foreground mb-8 max-w-xl mx-auto">
            Pay rent, request maintenance, or view your lease online through our convenient resident portal.
          </p>
          <Link to="/resident-portal">
            <Button variant="default" size="lg">
              Access Resident Portal
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ResidentCTA;
