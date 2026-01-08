import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.svg";

const navLinks = [
  { text: "Rentals", href: "/rentals" },
  { text: "Homes for Sale", href: "/for-sale" },
  { text: "About Us", href: "/about" },
  { text: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="Precision Capital" 
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button 
                  variant="nav" 
                  className={`text-nav relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full ${location.pathname === link.href ? "text-primary after:w-full" : ""}`}
                >
                  {link.text}
                </Button>
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Link to="/resident-portal">
              <Button variant="default" size="default">
                Resident Login
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                >
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start min-h-[44px] font-heading font-semibold text-nav ${location.pathname === link.href ? "text-primary bg-primary/5" : ""}`}
                  >
                    {link.text}
                  </Button>
                </Link>
              ))}
              <Link to="/resident-portal" onClick={() => setIsOpen(false)}>
                <Button variant="default" className="w-full mt-2 min-h-[44px]">
                  Resident Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
