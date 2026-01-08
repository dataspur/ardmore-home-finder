import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import logo from "@/assets/logo.svg";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4 pb-2">
          <img src={logo} alt="Precision Capital" className="h-12 mx-auto" />
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="flex justify-center">
            <CheckCircle className="h-20 w-20 text-green-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Payment Processing
            </h1>
            <p className="text-muted-foreground">
              You will receive a confirmation email shortly.
            </p>
          </div>

          <Button asChild className="w-full">
            <Link to="/">Return to Portal</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
