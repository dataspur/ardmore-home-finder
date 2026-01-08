import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle, Clock, XCircle } from "lucide-react";

interface Payment {
  id: string;
  amount_cents: number;
  status: string;
  paid_at: string;
  stripe_session_id?: string;
}

interface PaymentHistoryCardProps {
  payments: Payment[];
}

const formatCentsToDollars = (cents: number): string => {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        variant: "default" as const,
        icon: CheckCircle,
      };
    case "pending":
      return {
        label: "Pending",
        variant: "secondary" as const,
        icon: Clock,
      };
    case "failed":
      return {
        label: "Failed",
        variant: "destructive" as const,
        icon: XCircle,
      };
    default:
      return {
        label: status,
        variant: "outline" as const,
        icon: Clock,
      };
  }
};

export function PaymentHistoryCard({ payments }: PaymentHistoryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Payment History
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No payment history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const statusConfig = getStatusConfig(payment.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {formatDate(payment.paid_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.stripe_session_id 
                          ? `Ref: ${payment.stripe_session_id.slice(-8)}`
                          : "Manual payment"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatCentsToDollars(payment.amount_cents)}
                    </span>
                    <Badge variant={statusConfig.variant} className="gap-1 text-xs">
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
