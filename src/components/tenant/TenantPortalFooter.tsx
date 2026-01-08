import { Phone, Mail, Clock, Shield, Lock } from "lucide-react";

export function TenantPortalFooter() {
  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Contact Us</h3>
            <div className="space-y-2">
              <a 
                href="tel:+15803990001" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                (580) 399-0001
              </a>
              <a 
                href="mailto:management@precisioncapital.homes" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                management@precisioncapital.homes
              </a>
            </div>
          </div>

          {/* Office Hours */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Office Hours</h3>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5" />
              <div>
                <p>Monday - Friday: 9am - 5pm</p>
                <p>Saturday: 10am - 2pm</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>

          {/* Security Badges */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Secure Payments</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Stripe Secured</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Precision Capital. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
