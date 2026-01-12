import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Building2, Users, DollarSign, Copy, ChevronDown, ChevronUp, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

interface ManagedProperty {
  id: string;
  address: string;
  total_units: number;
  notes: string | null;
}

interface PropertySummary {
  id?: string;
  property_address: string;
  tenants: Lease[];
  totalTenants: number;
  totalRentCents: number;
  totalUnits: number;
  unitNumbers: string[];
  notes?: string;
  isManuallyCreated: boolean;
}

export default function Properties() {
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<ManagedProperty | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<PropertySummary | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formAddress, setFormAddress] = useState("");
  const [formTotalUnits, setFormTotalUnits] = useState("1");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      // Fetch managed properties
      const { data: managedProps, error: managedError } = await supabase
        .from("managed_properties")
        .select("*");

      if (managedError) throw managedError;

      // Fetch active leases
      const { data: leases, error: leasesError } = await supabase
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

      if (leasesError) throw leasesError;

      // Group leases by property_address
      const leaseMap = new Map<string, Lease[]>();
      leases?.forEach((lease) => {
        const address = lease.property_address;
        if (!leaseMap.has(address)) {
          leaseMap.set(address, []);
        }
        leaseMap.get(address)!.push(lease as unknown as Lease);
      });

      // Create property summaries - start with managed properties
      const summaryMap = new Map<string, PropertySummary>();

      managedProps?.forEach((mp) => {
        const leaseData = leaseMap.get(mp.address) || [];
        summaryMap.set(mp.address, {
          id: mp.id,
          property_address: mp.address,
          tenants: leaseData,
          totalTenants: leaseData.length,
          totalRentCents: leaseData.reduce((sum, l) => sum + l.rent_amount_cents, 0),
          totalUnits: mp.total_units,
          unitNumbers: leaseData.map((l) => l.unit_number).filter((u): u is string => u !== null),
          notes: mp.notes || undefined,
          isManuallyCreated: true,
        });
      });

      // Add lease-derived properties that aren't in managed_properties
      leaseMap.forEach((leaseData, address) => {
        if (!summaryMap.has(address)) {
          summaryMap.set(address, {
            property_address: address,
            tenants: leaseData,
            totalTenants: leaseData.length,
            totalRentCents: leaseData.reduce((sum, l) => sum + l.rent_amount_cents, 0),
            totalUnits: leaseData.length,
            unitNumbers: leaseData.map((l) => l.unit_number).filter((u): u is string => u !== null),
            isManuallyCreated: false,
          });
        }
      });

      // Convert to array and sort
      const propertySummaries = Array.from(summaryMap.values());
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

  const openAddDialog = () => {
    setEditingProperty(null);
    setFormAddress("");
    setFormTotalUnits("1");
    setFormNotes("");
    setDialogOpen(true);
  };

  const openEditDialog = (property: PropertySummary) => {
    setEditingProperty({
      id: property.id!,
      address: property.property_address,
      total_units: property.totalUnits,
      notes: property.notes || null,
    });
    setFormAddress(property.property_address);
    setFormTotalUnits(property.totalUnits.toString());
    setFormNotes(property.notes || "");
    setDialogOpen(true);
  };

  const openDeleteDialog = (property: PropertySummary) => {
    setPropertyToDelete(property);
    setDeleteDialogOpen(true);
  };

  const handleSaveProperty = async () => {
    if (!formAddress.trim()) {
      toast({
        title: "Error",
        description: "Property address is required",
        variant: "destructive",
      });
      return;
    }

    const totalUnits = parseInt(formTotalUnits);
    if (isNaN(totalUnits) || totalUnits < 1) {
      toast({
        title: "Error",
        description: "Total units must be at least 1",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingProperty) {
        // Update existing
        const { error } = await supabase
          .from("managed_properties")
          .update({
            address: formAddress.trim(),
            total_units: totalUnits,
            notes: formNotes.trim() || null,
          })
          .eq("id", editingProperty.id);

        if (error) throw error;

        toast({
          title: "Property updated",
          description: "Property has been updated successfully",
        });
      } else {
        // Insert new
        const { error } = await supabase
          .from("managed_properties")
          .insert({
            address: formAddress.trim(),
            total_units: totalUnits,
            notes: formNotes.trim() || null,
          });

        if (error) throw error;

        toast({
          title: "Property added",
          description: "New property has been added successfully",
        });
      }

      setDialogOpen(false);
      fetchProperties();
    } catch (error: any) {
      console.error("Error saving property:", error);
      toast({
        title: "Error",
        description: error.message?.includes("duplicate") 
          ? "A property with this address already exists" 
          : "Failed to save property",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete?.id) return;

    try {
      const { error } = await supabase
        .from("managed_properties")
        .delete()
        .eq("id", propertyToDelete.id);

      if (error) throw error;

      toast({
        title: "Property deleted",
        description: "Property has been removed from your portfolio",
      });

      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
      fetchProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
    }
  };

  const getOccupancyText = (property: PropertySummary) => {
    if (property.isManuallyCreated) {
      return `${property.totalTenants} of ${property.totalUnits} units occupied`;
    }
    return `${property.totalTenants} tenant${property.totalTenants !== 1 ? "s" : ""}`;
  };

  const getOccupancyBadge = (property: PropertySummary) => {
    if (!property.isManuallyCreated) return null;
    
    const occupancyRate = property.totalTenants / property.totalUnits;
    if (occupancyRate >= 1) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Fully Occupied</span>;
    } else if (occupancyRate > 0) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Vacancies</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Vacant</span>;
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No properties yet. Add a property to get started, or properties will appear automatically when you add tenants.
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{property.property_address}</CardTitle>
                            {getOccupancyBadge(property)}
                            {property.notes && (
                              <span title="Has notes">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {getOccupancyText(property)}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(property.totalRentCents)}/mo
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {property.isManuallyCreated && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(property);
                              }}
                              title="Edit property"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(property);
                              }}
                              title="Delete property"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {expandedProperty === property.property_address ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {property.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{property.notes}</p>
                      </div>
                    )}
                    {property.tenants.length > 0 ? (
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
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No tenants assigned to this property yet.
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Add/Edit Property Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? "Edit Property" : "Add New Property"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address">Property Address *</Label>
              <Input
                id="address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="123 Main Street, City, ST 12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalUnits">Total Units *</Label>
              <Input
                id="totalUnits"
                type="number"
                min="1"
                value={formTotalUnits}
                onChange={(e) => setFormTotalUnits(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Any additional information about this property..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProperty} disabled={saving}>
              {saving ? "Saving..." : editingProperty ? "Save Changes" : "Add Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{propertyToDelete?.property_address}" from your managed properties.
              <br /><br />
              <strong>Note:</strong> Any existing tenant leases at this address will NOT be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProperty} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
