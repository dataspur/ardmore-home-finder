import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Home, Building, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import { PropertyFormDialog } from "@/components/admin/PropertyFormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];

export default function Listings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"rental" | "sale">("rental");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const { data: properties, isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Property[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (property: PropertyInsert) => {
      const { data, error } = await supabase
        .from("properties")
        .insert(property)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      toast.success("Property created successfully");
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create property: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Property> }) => {
      const { data, error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      toast.success("Property updated successfully");
      setDialogOpen(false);
      setEditingProperty(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update property: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      toast.success("Property deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete property: ${error.message}`);
    },
  });

  const handleSubmit = (data: PropertyInsert) => {
    if (editingProperty) {
      updateMutation.mutate({ id: editingProperty.id, updates: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setDialogOpen(true);
  };

  const handleOpenNew = () => {
    setEditingProperty(null);
    setDialogOpen(true);
  };

  const rentals = properties?.filter((p) => p.property_type === "rental") || [];
  const sales = properties?.filter((p) => p.property_type === "sale") || [];

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <Card className="overflow-hidden">
      <div className="relative h-48 bg-muted">
        {property.image_url ? (
          <img
            src={property.image_url}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {property.badge && (
            <Badge variant={property.badge === "Available" ? "default" : "secondary"}>
              {property.badge}
            </Badge>
          )}
          {property.is_featured && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
        <div className="absolute top-2 right-2">
          {property.is_active ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <Eye className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
              <EyeOff className="h-3 w-3 mr-1" />
              Hidden
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{property.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{property.address}</p>
            {property.city && (
              <p className="text-sm text-muted-foreground">
                {property.city}, {property.state} {property.zip_code}
              </p>
            )}
          </div>
          <p className="font-bold text-lg text-primary ml-2">{property.price_display}</p>
        </div>
        
        <div className="flex gap-4 text-sm text-muted-foreground mb-3">
          {property.bedrooms !== null && (
            <span>{property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}</span>
          )}
          {property.bathrooms !== null && (
            <span>{property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}</span>
          )}
          {property.size_sqft !== null && <span>{property.size_sqft.toLocaleString()} sqft</span>}
        </div>

        {property.property_subtype && (
          <p className="text-xs text-muted-foreground mb-3">
            <Building className="h-3 w-3 inline mr-1" />
            {property.property_subtype}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(property)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Property</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{property.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(property.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Property Listings</h1>
          <p className="text-muted-foreground">Manage rental and for-sale properties</p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "rental" | "sale")}>
        <TabsList>
          <TabsTrigger value="rental">For Rent ({rentals.length})</TabsTrigger>
          <TabsTrigger value="sale">For Sale ({sales.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="rental" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-80 animate-pulse bg-muted" />
              ))}
            </div>
          ) : rentals.length === 0 ? (
            <Card className="p-12 text-center">
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Rental Properties</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first rental listing.</p>
              <Button onClick={handleOpenNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rental Property
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rentals.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sale" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-80 animate-pulse bg-muted" />
              ))}
            </div>
          ) : sales.length === 0 ? (
            <Card className="p-12 text-center">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Properties For Sale</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first sale listing.</p>
              <Button onClick={handleOpenNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sale Property
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sales.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PropertyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={editingProperty}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        defaultPropertyType={activeTab}
      />
    </div>
  );
}
