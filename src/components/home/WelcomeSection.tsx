const WelcomeSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Welcome to Precision Capital
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We're a family-owned real estate company serving Ardmore, OK. Whether you're looking to rent or buy, we provide clean, affordable, and well-managed homes for families and individuals.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
