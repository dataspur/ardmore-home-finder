import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import WelcomeSection from "@/components/home/WelcomeSection";
import FeatureCards from "@/components/home/FeatureCards";
import ResidentCTA from "@/components/home/ResidentCTA";
import Footer from "@/components/layout/Footer";

const Index = () => {
  useEffect(() => {
    document.title = "Precision Capital | Quality Homes & Rentals in Ardmore, OK";
  }, []);

  return (
    <div className="min-h-screen animate-fade-in">
      <Navbar />
      <main>
        <Hero />
        <WelcomeSection />
        <FeatureCards />
        <ResidentCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
