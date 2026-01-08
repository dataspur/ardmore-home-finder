import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import logo from "@/assets/logo.svg";

export default function TenantPaymentSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/resident-portal");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader className="space-y-4 pb-2">
          <img src={logo} alt="Precision Capital" className="h-12 mx-auto" />
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="flex justify-center">
            <CheckCircle className="h-24 w-24 text-green-500 animate-[scale-in_0.5s_ease-out]" />
          </div>

          <div className="space-y-3 animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground">
              Payment Complete
            </h1>
            <p className="text-muted-foreground">
              A receipt has been sent to your email.
            </p>
          </div>

          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted-foreground">
              Redirecting to portal in {countdown} seconds...
            </p>

            <Button
              onClick={() => navigate("/resident-portal")}
              className="w-full"
              size="lg"
            >
              Return to Resident Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
