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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Loader2, Copy, DollarSign, Trash2, FileText, CalendarIcon, Upload, Check, X, Search } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LeaseDocumentsDialog } from "@/components/admin/LeaseDocumentsDialog";
import { RentRollImportDialog } from "@/components/admin/RentRollImportDialog";

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
  isPaid?: boolean;
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
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [tenantToDeactivate, setTenantToDeactivate] = useState<TenantWithLease | null>(null);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedTenantForDocs, setSelectedTenantForDocs] = useState<{ id: string; name: string } | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const { toast } = useToast();

  // Filter tenants based on search and payment status
  const filteredTenants = tenantsWithLeases.filter((tenant) => {
    // Search filter - match name, email, or property address
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      tenant.name.toLowerCase().includes(searchLower) ||
      tenant.email.toLowerCase().includes(searchLower) ||
      (tenant.lease?.property_address?.toLowerCase().includes(searchLower) ?? false);

    // Payment status filter
    const matchesPaymentFilter =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && tenant.isPaid) ||
      (paymentFilter === "unpaid" && !tenant.isPaid && tenant.lease);

    return matchesSearch && matchesPaymentFilter;
  });

  // Count paid and unpaid tenants (only those with active leases)
  const tenantsWithActiveLeases = tenantsWithLeases.filter((t) => t.lease);
  const paidCount = tenantsWithActiveLeases.filter((t) => t.isPaid).length;
  const unpaidCount = tenantsWithActiveLeases.filter((t) => !t.isPaid).length;

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

    // Fetch payments for current month to determine paid status
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: payments } = await supabase
      .from("payments")
      .select("lease_id, status, created_at")
      .eq("status", "paid")
      .gte("created_at", startOfMonth.toISOString());

    // Create a Set of lease IDs that have been paid this month
    const paidLeaseIds = new Set(payments?.map((p) => p.lease_id) || []);

    // Join tenants with their leases and payment status
    const combined: TenantWithLease[] = (tenants || []).map((tenant) => {
      const lease = leases?.find((l) => l.tenant_id === tenant.id) || null;
      return {
        ...tenant,
        lease,
        isPaid: lease ? paidLeaseIds.has(lease.id) : false,
      };
    });

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
      // Parse rent amount for validation
      const rentCents = formData.rent_amount 
        ? Math.round(parseFloat(formData.rent_amount) * 100) 
        : 0;

      if (editingTenant) {
        // Update existing tenant (name and email)
        const { error: tenantError } = await supabase
          .from("tenants")
          .update({ name: formData.name, email: formData.email })
          .eq("id", editingTenant.id);

        if (tenantError) throw tenantError;

        // Update or create lease if lease fields are provided
        if (formData.property_address && formData.rent_amount && formData.due_date) {
          if (rentCents <= 0 || isNaN(rentCents)) {
            toast({ variant: "destructive", title: "Error", description: "Please enter a valid rent amount" });
            setIsSubmitting(false);
            return;
          }

          const leaseData = {
            property_address: formData.property_address,
            unit_number: formData.unit_number || null,
            rent_amount_cents: rentCents,
            due_date: format(formData.due_date, "yyyy-MM-dd"),
          };

          if (editingTenant.lease) {
            // Update existing lease
            const { error: leaseError } = await supabase
              .from("leases")
              .update(leaseData)
              .eq("id", editingTenant.lease.id);

            if (leaseError) throw leaseError;
          } else {
            // Create new lease for existing tenant
            const { error: leaseError } = await supabase
              .from("leases")
              .insert({
                ...leaseData,
                tenant_id: editingTenant.id,
                status: "active",
              });

            if (leaseError) throw leaseError;
          }
        }

        toast({ title: "Success", description: "Tenant updated" });
      } else {
        // Validate all required fields for new tenant
        if (!formData.name || !formData.email || !formData.property_address || 
            !formData.rent_amount || !formData.due_date) {
          toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields" });
          setIsSubmitting(false);
          return;
        }

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

  const handleDeactivate = async () => {
    if (!tenantToDeactivate?.lease) {
      setDeactivateDialogOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("leases")
        .update({ status: "inactive" })
        .eq("id", tenantToDeactivate.lease.id);

      if (error) throw error;

      toast({ title: "Success", description: "Tenant deactivated" });
      fetchTenantsWithLeases();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to deactivate" });
    } finally {
      setDeactivateDialogOpen(false);
      setTenantToDeactivate(null);
    }
  };

  const openDocumentsDialog = (tenant: TenantWithLease) => {
    setSelectedTenantForDocs({ id: tenant.id, name: tenant.name });
    setDocumentsDialogOpen(true);
  };

  const openDeactivateDialog = (tenant: TenantWithLease) => {
    setTenantToDeactivate(tenant);
    setDeactivateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Rent Roll
          </Button>
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

              {/* Lease Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Lease Details {editingTenant && "(optional)"}
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="property_address">Property Address {!editingTenant && "*"}</Label>
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
                    <Label htmlFor="rent_amount">Monthly Rent {!editingTenant && "*"}</Label>
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
                  <Label>Rent Due Date {!editingTenant && "*"}</Label>
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTenant ? "Update Tenant" : "Create Tenant"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Payment Filter Toggle */}
        <ToggleGroup
          type="single"
          value={paymentFilter}
          onValueChange={(value) => value && setPaymentFilter(value as "all" | "paid" | "unpaid")}
          className="justify-start"
        >
          <ToggleGroupItem value="all" aria-label="Show all tenants">
            All ({tenantsWithActiveLeases.length})
          </ToggleGroupItem>
          <ToggleGroupItem value="paid" aria-label="Show paid tenants">
            <Check className="h-4 w-4 mr-1" />
            Paid ({paidCount})
          </ToggleGroupItem>
          <ToggleGroupItem value="unpaid" aria-label="Show unpaid tenants">
            <X className="h-4 w-4 mr-1" />
            Unpaid ({unpaidCount})
          </ToggleGroupItem>
        </ToggleGroup>
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
          ) : filteredTenants.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {tenantsWithLeases.length === 0
                ? "No tenants yet"
                : "No tenants match your search or filter criteria"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.email}</TableCell>
                      <TableCell>{tenant.lease?.property_address || "-"}</TableCell>
                      <TableCell>
                        {tenant.lease ? (
                          tenant.isPaid ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )
                        ) : (
                          "-"
                        )}
                      </TableCell>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDocumentsDialog(tenant)}
                            title="Manage documents"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {tenant.lease && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeactivateDialog(tenant)}
                              title="Deactivate tenant"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {tenantToDeactivate?.name}'s lease. They will no longer be able 
              to make payments through the tenant portal.
              <br /><br />
              Payment history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lease Documents Dialog */}
      <LeaseDocumentsDialog
        open={documentsDialogOpen}
        onOpenChange={setDocumentsDialogOpen}
        tenant={selectedTenantForDocs}
        leaseId={selectedTenantForDocs ? tenantsWithLeases.find(t => t.id === selectedTenantForDocs.id)?.lease?.id : undefined}
      />

      {/* Rent Roll Import Dialog */}
      <RentRollImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={fetchTenantsWithLeases}
      />
    </div>
  );
}
