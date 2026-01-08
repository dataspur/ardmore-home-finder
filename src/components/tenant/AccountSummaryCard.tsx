import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface AccountSummaryCardProps {
  totalDueCents: number;
  dueDate: string;
  daysUntilDue: number;
  isPastDue: boolean;
  lastPaymentDate?: string;
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

export function AccountSummaryCard({
  totalDueCents,
  dueDate,
  daysUntilDue,
  isPastDue,
  lastPaymentDate,
}: AccountSummaryCardProps) {
  const getStatusConfig = () => {
    if (isPastDue) {
      return {
        label: "Past Due",
        variant: "destructive" as const,
        icon: XCircle,
        bgColor: "bg-destructive/10",
        borderColor: "border-destructive/30",
      };
    }
    if (daysUntilDue <= 7) {
      return {
        label: "Due Soon",
        variant: "secondary" as const,
        icon: AlertTriangle,
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
      };
    }
    return {
      label: "Current",
      variant: "default" as const,
      icon: CheckCircle,
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <Card className={`${status.bgColor} ${status.borderColor} border-2`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Account Summary
          </CardTitle>
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Amount Due</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCentsToDollars(totalDueCents)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="text-sm font-medium">{formatDate(dueDate)}</p>
            </div>
          </div>
          {lastPaymentDate && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Payment</p>
                <p className="text-sm font-medium">{formatDate(lastPaymentDate)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
