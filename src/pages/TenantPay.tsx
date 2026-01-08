import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2, CreditCard, MessageSquare, Mail } from "lucide-react";
import logo from "@/assets/logo.svg";

import { TenantPortalHeader } from "@/components/tenant/TenantPortalHeader";
import { AccountSummaryCard } from "@/components/tenant/AccountSummaryCard";
import { PropertyDetailsCard } from "@/components/tenant/PropertyDetailsCard";
import { ChargesBreakdownCard } from "@/components/tenant/ChargesBreakdownCard";
import { PaymentHistoryCard } from "@/components/tenant/PaymentHistoryCard";
import { ReportIssueDialog } from "@/components/tenant/ReportIssueDialog";
import { TenantPortalFooter } from "@/components/tenant/TenantPortalFooter";
import { AutopayCard } from "@/components/tenant/AutopayCard";

interface LeaseDetails {
  tenant_name: string;
  tenant_email: string;
  property_address: string;
  rent_amount_cents: number;
  late_fee_cents: number;
  total_due_cents: number;
  due_date: string;
  days_until_due: number;
  is_past_due: boolean;
  lease_id: string;
  tenant_id: string;
  lease_start_date?: string;
  autopay_enabled?: boolean;
  last_payment?: {
    amount_cents: number;
    paid_at: string;
    status: string;
  };
}

interface Payment {
  id: string;
  amount_cents: number;
  status: string;
  paid_at: string;
  stripe_session_id?: string;
}

const formatCentsToDollars = (cents: number): string => {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

export default function TenantPay() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const [leaseDetails, setLeaseDetails] = useState<LeaseDetails | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingAutopay, setLoadingAutopay] = useState(false);
  const { toast } = useToast();

  // Check for autopay success/cancel from URL params
  useEffect(() => {
    const autopayStatus = searchParams.get("autopay");
    if (autopayStatus === "success") {
      toast({
        title: "Autopay Activated!",
        description: "Your automatic payments have been set up successfully.",
      });
      // Remove the query params from URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (autopayStatus === "cancelled") {
      toast({
        variant: "destructive",
        title: "Autopay Setup Cancelled",
        description: "You can set up autopay anytime from your portal.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("No access token provided");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch lease details and payment history in parallel
        const [leaseResponse, historyResponse] = await Promise.all([
          supabase.rpc("get_lease_details", { lookup_token: token }),
          supabase.rpc("get_tenant_payment_history", { lookup_token: token }),
        ]);

        if (leaseResponse.error) {
          console.error("Lease RPC Error:", leaseResponse.error);
          setError("Unable to retrieve lease information");
          return;
        }

        if (!leaseResponse.data) {
          setError("Invalid or expired access link");
          return;
        }

        setLeaseDetails(leaseResponse.data as unknown as LeaseDetails);
        setPaymentHistory((historyResponse.data as unknown as Payment[]) || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  const handleSetupAutopay = async () => {
    if (!leaseDetails) return;

    setLoadingAutopay(true);

    try {
      const { data, error } = await supabase.functions.invoke("setup-autopay", {
        body: {
          lease_id: leaseDetails.lease_id,
          return_url: window.location.href.split("?")[0], // Remove any existing params
        },
      });

      if (error || !data?.url) {
        throw new Error("Failed to initialize autopay setup");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Autopay setup error:", err);
      toast({
        variant: "destructive",
        title: "Autopay Setup Failed",
        description: "Unable to set up autopay. Please try again.",
      });
      setLoadingAutopay(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-gradient-hero text-white py-6">
          <div className="max-w-4xl mx-auto px-4">
            <Skeleton className="h-10 w-48 bg-white/20" />
          </div>
        </div>
        <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-40 mt-6" />
          <Skeleton className="h-14 mt-6" />
          <Skeleton className="h-48 mt-6" />
        </div>
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
              <h2 className="text-xl font-semibold">Access Denied</h2>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Please contact management if you believe this is an error.
            </p>
            <a
              href="mailto:management@precisioncapital.homes"
              className="inline-block text-sm font-medium text-primary hover:underline"
            >
              management@precisioncapital.homes
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success State - Full Portal
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TenantPortalHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Account Summary & Property Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <AccountSummaryCard
            totalDueCents={leaseDetails!.total_due_cents}
            dueDate={leaseDetails!.due_date}
            daysUntilDue={leaseDetails!.days_until_due}
            isPastDue={leaseDetails!.is_past_due}
            lastPaymentDate={leaseDetails!.last_payment?.paid_at}
          />
          <PropertyDetailsCard
            tenantName={leaseDetails!.tenant_name}
            tenantEmail={leaseDetails!.tenant_email}
            propertyAddress={leaseDetails!.property_address}
            leaseStartDate={leaseDetails!.lease_start_date}
          />
        </div>

        {/* Charges Breakdown */}
        <div className="mt-6">
          <ChargesBreakdownCard
            rentAmountCents={leaseDetails!.rent_amount_cents}
            lateFeeCents={leaseDetails!.late_fee_cents}
            totalDueCents={leaseDetails!.total_due_cents}
          />
        </div>

        {/* Autopay Card */}
        <div className="mt-6">
          <AutopayCard
            autopayEnabled={leaseDetails!.autopay_enabled || false}
            isLoading={loadingAutopay}
            onSetupAutopay={handleSetupAutopay}
            rentAmountFormatted={formatCentsToDollars(leaseDetails!.rent_amount_cents)}
            dueDate={leaseDetails!.due_date}
          />
        </div>

        {/* Pay Now Button */}
        <div className="mt-6">
          <Button
            size="xl"
            className="w-full h-14 text-lg font-semibold shadow-elevated"
            onClick={handlePayment}
            disabled={loadingPayment}
          >
            {loadingPayment ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay Now — {formatCentsToDollars(leaseDetails!.total_due_cents)}
              </>
            )}
          </Button>
        </div>

        {/* Payment History */}
        <div className="mt-6">
          <PaymentHistoryCard payments={paymentHistory} />
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <ReportIssueDialog
            tenantId={leaseDetails!.tenant_id}
            propertyAddress={leaseDetails!.property_address}
          >
            <Button variant="outline" className="w-full h-12">
              <MessageSquare className="mr-2 h-4 w-4" />
              Report an Issue
            </Button>
          </ReportIssueDialog>

          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() =>
              (window.location.href = "mailto:management@precisioncapital.homes")
            }
          >
            <Mail className="mr-2 h-4 w-4" />
            Contact Management
          </Button>
        </div>
      </main>

      <TenantPortalFooter />
    </div>
  );
}
