import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import logo from "@/assets/logo.svg";
const Footer = forwardRef<HTMLElement>((_, ref) => {
  return <footer ref={ref} className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <img src={logo} alt="Precision Capital" className="h-10 w-auto mb-4 brightness-0 invert object-scale-down" />
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              A family-owned real estate company bringing quality homes to Ardmore, Oklahoma.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Properties Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Properties</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/rentals" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Rentals
                </Link>
              </li>
              <li>
                <Link to="/for-sale" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Homes for Sale
                </Link>
              </li>
              <li>
                <Link to="/resident-portal" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Resident Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-primary-foreground/70">
                <Phone size={18} />
                <a href="tel:+15803990001" className="hover:text-primary-foreground transition-colors">
                  (580) 399-0001
                </a>
              </li>
              <li className="flex items-center gap-3 text-primary-foreground/70">
                <Mail size={18} />
                <a href="mailto:management@precisioncapital.homes" className="hover:text-primary-foreground transition-colors">
                  management@precisioncapital.homes
                </a>
              </li>
              <li className="flex items-start gap-3 text-primary-foreground/70">
                <MapPin size={18} className="mt-1 flex-shrink-0" />
                <span>Ardmore, Oklahoma</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/50 text-sm">
              © {new Date().getFullYear()} Precision Capital. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>;
});
Footer.displayName = "Footer";
export default Footer;