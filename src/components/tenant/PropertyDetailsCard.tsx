import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, Mail, CalendarDays } from "lucide-react";

interface PropertyDetailsCardProps {
  tenantName: string;
  tenantEmail: string;
  propertyAddress: string;
  leaseStartDate?: string;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function PropertyDetailsCard({
  tenantName,
  tenantEmail,
  propertyAddress,
  leaseStartDate,
}: PropertyDetailsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Property Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="text-sm font-medium">{propertyAddress}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Resident</p>
            <p className="text-sm font-medium">{tenantName}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{tenantEmail}</p>
          </div>
        </div>

        {leaseStartDate && (
          <div className="flex items-start gap-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Lease Start</p>
              <p className="text-sm font-medium">{formatDate(leaseStartDate)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
