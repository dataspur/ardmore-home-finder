import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Building2, Users, DollarSign, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Tenant {
  id: string;
  name: string;
  email: string;
  access_token: string;
}

interface Lease {
  id: string;
  property_address: string;
  unit_number: string | null;
  rent_amount_cents: number;
  due_date: string;
  status: string;
  tenant: Tenant;
}

interface PropertySummary {
  property_address: string;
  tenants: Lease[];
  totalTenants: number;
  totalRentCents: number;
  unitNumbers: string[];
}

export default function Properties() {
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data: leases, error } = await supabase
        .from("leases")
        .select(`
          id,
          property_address,
          unit_number,
          rent_amount_cents,
          due_date,
          status,
          tenant:tenants(id, name, email, access_token)
        `)
        .eq("status", "active");

      if (error) throw error;

      // Group leases by property_address
      const propertyMap = new Map<string, Lease[]>();
      
      leases?.forEach((lease) => {
        const address = lease.property_address;
        if (!propertyMap.has(address)) {
          propertyMap.set(address, []);
        }
        propertyMap.get(address)!.push(lease as unknown as Lease);
      });

      // Convert to PropertySummary array
      const propertySummaries: PropertySummary[] = Array.from(propertyMap.entries()).map(
        ([address, leases]) => ({
          property_address: address,
          tenants: leases,
          totalTenants: leases.length,
          totalRentCents: leases.reduce((sum, l) => sum + l.rent_amount_cents, 0),
          unitNumbers: leases
            .map((l) => l.unit_number)
            .filter((u): u is string => u !== null),
        })
      );

      // Sort by property address
      propertySummaries.sort((a, b) => a.property_address.localeCompare(b.property_address));
      
      setProperties(propertySummaries);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const copyPaymentLink = (accessToken: string) => {
    const link = `${window.location.origin}/pay/${accessToken}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Payment link copied to clipboard",
    });
  };

  const toggleProperty = (address: string) => {
    setExpandedProperty(expandedProperty === address ? null : address);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Properties</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Properties</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No properties yet. Properties will appear here automatically when you add tenants with lease addresses.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Properties</h1>
      
      <div className="space-y-4">
        {properties.map((property) => (
          <Collapsible
            key={property.property_address}
            open={expandedProperty === property.property_address}
            onOpenChange={() => toggleProperty(property.property_address)}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{property.property_address}</CardTitle>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {property.totalTenants} tenant{property.totalTenants !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(property.totalRentCents)}/mo
                          </span>
                        </div>
                      </div>
                    </div>
                    {expandedProperty === property.property_address ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Rent</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {property.tenants.map((lease) => (
                        <TableRow key={lease.id}>
                          <TableCell className="font-medium">{lease.tenant.name}</TableCell>
                          <TableCell>{lease.tenant.email}</TableCell>
                          <TableCell>{lease.unit_number || "—"}</TableCell>
                          <TableCell>{formatCurrency(lease.rent_amount_cents)}</TableCell>
                          <TableCell>{lease.due_date}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyPaymentLink(lease.tenant.access_token);
                              }}
                              title="Copy payment link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
