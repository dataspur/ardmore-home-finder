import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, Loader2, BanknoteIcon } from "lucide-react";

interface AutopayCardProps {
  autopayEnabled: boolean;
  isLoading: boolean;
  onSetupAutopay: () => void;
  rentAmountFormatted: string;
  dueDate: string;
}

export function AutopayCard({
  autopayEnabled,
  isLoading,
  onSetupAutopay,
  rentAmountFormatted,
  dueDate,
}: AutopayCardProps) {
  if (autopayEnabled) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Autopay
            </CardTitle>
            <Badge variant="default" className="bg-primary">
              <Check className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Your bank account will be automatically charged{" "}
            <span className="font-medium text-foreground">{rentAmountFormatted}</span>{" "}
            on the {new Date(dueDate).getDate()}
            {getOrdinalSuffix(new Date(dueDate).getDate())} of each month.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
          Set Up Autopay
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <p className="text-sm text-muted-foreground">
          Never miss a payment. Link your bank account for automatic monthly rent payments via ACH.
        </p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-primary" />
            Lower processing fees than cards
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-primary" />
            Automatic payments on your due date
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-primary" />
            Email confirmation after each payment
          </li>
        </ul>
        <Button
          variant="outline"
          className="w-full"
          onClick={onSetupAutopay}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Set Up Autopay
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
