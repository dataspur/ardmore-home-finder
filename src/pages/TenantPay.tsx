import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Building2, Calendar, DollarSign, User, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

interface LeaseDetails {
  tenant_name: string;
  property_address: string;
  rent_amount_cents: number;
  due_date: string;
  lease_id: string;
  tenant_id: string;
}

const formatCentsToDollars = (cents: number): string => {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function TenantPay() {
  const { token } = useParams<{ token: string }>();
  const [leaseDetails, setLeaseDetails] = useState<LeaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeaseDetails = async () => {
      if (!token) {
        setError("No access token provided");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc("get_lease_details", {
          lookup_token: token,
        });

        if (rpcError) {
          console.error("RPC Error:", rpcError);
          setError("Unable to retrieve lease information");
          return;
        }

        if (!data) {
          setError("Invalid or expired access link");
          return;
        }

        setLeaseDetails(data as unknown as LeaseDetails);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaseDetails();
  }, [token]);

  const handlePayment = async () => {
    if (!leaseDetails) return;

    setLoadingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          lease_id: leaseDetails.lease_id,
          return_url: window.location.href,
        },
      });

      if (error || !data?.url) {
        throw new Error("Failed to initialize payment");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("Payment error:", err);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "Payment initialization failed. Please try again.",
      });
      setLoadingPayment(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <Skeleton className="h-12 w-48 mx-auto" />
            <Skeleton className="h-6 w-32 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader className="text-center space-y-4">
            <img src={logo} alt="Precision Capital" className="h-12 mx-auto" />
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle className="text-xl">Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Please contact management if you believe this is an error.
            </p>
            <p className="text-sm font-medium">
              <a href="mailto:management@precisioncapital.homes" className="text-primary hover:underline">
                management@precisioncapital.homes
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success State
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-4 pb-2">
          <img src={logo} alt="Precision Capital" className="h-12 mx-auto" />
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Rent Payment Portal
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Secure payment processing
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tenant Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Tenant</p>
              <p className="font-medium">{leaseDetails?.tenant_name}</p>
            </div>
          </div>

          {/* Property Info */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Property</p>
              <p className="font-medium">{leaseDetails?.property_address}</p>
            </div>
          </div>

          {/* Amount Due */}
          <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <DollarSign className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-primary">
                {leaseDetails && formatCentsToDollars(leaseDetails.rent_amount_cents)}
              </p>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">
                {leaseDetails && formatDate(leaseDetails.due_date)}
              </p>
            </div>
          </div>

          {/* Pay Button */}
          <Button 
            className="w-full h-12 text-lg font-semibold" 
            onClick={handlePayment}
            disabled={loadingPayment}
          >
            {loadingPayment ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay Rent Now"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Payments are processed securely via Stripe
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
