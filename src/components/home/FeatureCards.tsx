import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Key } from "lucide-react";

const features = [
  {
    icon: Key,
    title: "Looking to Rent?",
    description: "Explore available rental properties in Ardmore and surrounding areas.",
    button: { text: "View Rentals", href: "/rentals" },
  },
  {
    icon: Home,
    title: "Ready to Buy?",
    description: "Browse our homes for sale and find your forever home.",
    button: { text: "View Homes for Sale", href: "/for-sale" },
  },
];

const FeatureCards = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {feature.description}
              </p>
              <Link to={feature.button.href}>
                <Button variant="outline" size="default">
                  {feature.button.text}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
