import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

interface ChargesBreakdownCardProps {
  rentAmountCents: number;
  lateFeeCents: number;
  totalDueCents: number;
}

const formatCentsToDollars = (cents: number): string => {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

export function ChargesBreakdownCard({
  rentAmountCents,
  lateFeeCents,
  totalDueCents,
}: ChargesBreakdownCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Charges
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-foreground">Monthly Rent</span>
            <span className="text-sm font-medium">
              {formatCentsToDollars(rentAmountCents)}
            </span>
          </div>
          
          {lateFeeCents > 0 && (
            <div className="flex justify-between items-center py-2 text-destructive">
              <span className="text-sm">Late Fee</span>
              <span className="text-sm font-medium">
                {formatCentsToDollars(lateFeeCents)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Previous Balance</span>
            <span className="text-sm font-medium text-muted-foreground">$0.00</span>
          </div>
          
          <div className="border-t pt-3 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold">Total Due</span>
              <span className="text-lg font-bold text-primary">
                {formatCentsToDollars(totalDueCents)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
