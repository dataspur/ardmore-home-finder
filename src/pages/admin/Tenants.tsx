import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Loader2, Copy, DollarSign } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  email: string;
  access_token: string | null;
  created_at: string | null;
}

interface Lease {
  id: string;
  tenant_id: string;
  property_address: string;
  unit_number: string | null;
  rent_amount_cents: number;
  due_date: string;
  status: string | null;
}

interface TenantWithLease extends Tenant {
  lease?: Lease | null;
}

interface FormData {
  name: string;
  email: string;
  property_address: string;
  unit_number: string;
  rent_amount: string;
  due_date: Date | undefined;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  property_address: "",
  unit_number: "",
  rent_amount: "",
  due_date: undefined,
};

export default function Tenants() {
  const [tenantsWithLeases, setTenantsWithLeases] = useState<TenantWithLease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantWithLease | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { toast } = useToast();

  const fetchTenantsWithLeases = async () => {
    // Fetch tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (tenantsError) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load tenants" });
      setIsLoading(false);
      return;
    }

    // Fetch all active leases
    const { data: leases, error: leasesError } = await supabase
      .from("leases")
      .select("*")
      .eq("status", "active");

    if (leasesError) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load leases" });
      setIsLoading(false);
      return;
    }

    // Join tenants with their leases
    const combined: TenantWithLease[] = (tenants || []).map((tenant) => ({
      ...tenant,
      lease: leases?.find((lease) => lease.tenant_id === tenant.id) || null,
    }));

    setTenantsWithLeases(combined);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTenantsWithLeases();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTenant) {
        // Update existing tenant (name and email only)
        const { error } = await supabase
          .from("tenants")
          .update({ name: formData.name, email: formData.email })
          .eq("id", editingTenant.id);

        if (error) throw error;
        toast({ title: "Success", description: "Tenant updated" });
      } else {
        // Validate all required fields for new tenant
        if (!formData.name || !formData.email || !formData.property_address || 
            !formData.rent_amount || !formData.due_date) {
          toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields" });
          setIsSubmitting(false);
          return;
        }

        const rentCents = Math.round(parseFloat(formData.rent_amount) * 100);
        if (isNaN(rentCents) || rentCents <= 0) {
          toast({ variant: "destructive", title: "Error", description: "Please enter a valid rent amount" });
          setIsSubmitting(false);
          return;
        }

        // Create tenant first
        const { data: newTenant, error: tenantError } = await supabase
          .from("tenants")
          .insert({ name: formData.name, email: formData.email })
          .select()
          .single();

        if (tenantError) throw tenantError;

        // Create lease for the tenant
        const { error: leaseError } = await supabase.from("leases").insert({
          tenant_id: newTenant.id,
          property_address: formData.property_address,
          unit_number: formData.unit_number || null,
          rent_amount_cents: rentCents,
          due_date: format(formData.due_date, "yyyy-MM-dd"),
          status: "active",
        });

        if (leaseError) throw leaseError;
        
        toast({ title: "Success", description: "Tenant and lease created" });
      }

      setDialogOpen(false);
      setEditingTenant(null);
      setFormData(initialFormData);
      fetchTenantsWithLeases();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (tenant: TenantWithLease) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      email: tenant.email,
      property_address: tenant.lease?.property_address || "",
      unit_number: tenant.lease?.unit_number || "",
      rent_amount: tenant.lease ? (tenant.lease.rent_amount_cents / 100).toFixed(2) : "",
      due_date: tenant.lease ? new Date(tenant.lease.due_date) : undefined,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingTenant(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const copyPaymentLink = (accessToken: string | null) => {
    if (!accessToken) {
      toast({ variant: "destructive", title: "Error", description: "No access token available" });
      return;
    }
    const url = `${window.location.origin}/tenant-pay?token=${accessToken}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Payment link copied to clipboard" });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTenant ? "Edit Tenant" : "Add New Tenant"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tenant Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Tenant Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Lease Details Section - Only show for new tenants */}
              {!editingTenant && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Lease Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="property_address">Property Address *</Label>
                    <Input
                      id="property_address"
                      value={formData.property_address}
                      onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                      placeholder="123 Main Street"
                      required={!editingTenant}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit_number">Unit Number</Label>
                      <Input
                        id="unit_number"
                        value={formData.unit_number}
                        onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                        placeholder="Apt 2B"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rent_amount">Monthly Rent *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="rent_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.rent_amount}
                          onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                          placeholder="1500.00"
                          className="pl-9"
                          required={!editingTenant}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Rent Due Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.due_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.due_date ? format(formData.due_date, "PPP") : "Select due date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.due_date}
                          onSelect={(date) => setFormData({ ...formData, due_date: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTenant ? "Update Tenant" : "Create Tenant"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : tenantsWithLeases.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No tenants yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantsWithLeases.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.email}</TableCell>
                      <TableCell>{tenant.lease?.property_address || "-"}</TableCell>
                      <TableCell>{tenant.lease?.unit_number || "-"}</TableCell>
                      <TableCell>
                        {tenant.lease ? formatCurrency(tenant.lease.rent_amount_cents) : "-"}
                      </TableCell>
                      <TableCell>
                        {tenant.lease?.due_date
                          ? new Date(tenant.lease.due_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(tenant)}
                            title="Edit tenant"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyPaymentLink(tenant.access_token)}
                            title="Copy payment link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
