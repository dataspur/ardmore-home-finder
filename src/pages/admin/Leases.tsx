import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Loader2 } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  access_token: string | null;
}

interface Lease {
  id: string;
  property_address: string;
  rent_amount_cents: number;
  due_date: string;
  status: string | null;
  tenant_id: string;
  tenants: Tenant | null;
}

const formatCurrency = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function Leases() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tenant_id: "",
    property_address: "",
    rent_amount: "",
    due_date: "",
  });
  const { toast } = useToast();

  const fetchData = async () => {
    const [leasesRes, tenantsRes] = await Promise.all([
      supabase
        .from("leases")
        .select("*, tenants(id, name, access_token)")
        .order("created_at", { ascending: false }),
      supabase.from("tenants").select("id, name, access_token"),
    ]);

    if (leasesRes.error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load leases" });
    } else {
      setLeases((leasesRes.data as unknown as Lease[]) || []);
    }

    if (!tenantsRes.error) {
      setTenants(tenantsRes.data || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const rentCents = Math.round(parseFloat(formData.rent_amount) * 100);

    const { error } = await supabase.from("leases").insert({
      tenant_id: formData.tenant_id,
      property_address: formData.property_address,
      rent_amount_cents: rentCents,
      due_date: formData.due_date,
      status: "active",
    });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create lease" });
    } else {
      toast({ title: "Success", description: "Lease created" });
      setDialogOpen(false);
      setFormData({ tenant_id: "", property_address: "", rent_amount: "", due_date: "" });
      fetchData();
    }

    setIsSubmitting(false);
  };

  const copyPaymentLink = (tenant: Tenant | null) => {
    if (!tenant?.access_token) {
      toast({ variant: "destructive", title: "Error", description: "No access token for this tenant" });
      return;
    }

    const url = `${window.location.origin}/pay/${tenant.access_token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied", description: "Payment link copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leases</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Lease
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lease</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant</Label>
                <Select
                  value={formData.tenant_id}
                  onValueChange={(v) => setFormData({ ...formData, tenant_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="property">Property Address</Label>
                <Input
                  id="property"
                  value={formData.property_address}
                  onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent">Rent Amount ($)</Label>
                <Input
                  id="rent"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1500.00"
                  value={formData.rent_amount}
                  onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Lease
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leases</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : leases.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No leases yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell className="font-medium">{lease.property_address}</TableCell>
                    <TableCell>{lease.tenants?.name || "-"}</TableCell>
                    <TableCell>{formatCurrency(lease.rent_amount_cents)}</TableCell>
                    <TableCell>{new Date(lease.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={lease.status === "active" ? "default" : "secondary"}>
                        {lease.status || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPaymentLink(lease.tenants)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Link
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
