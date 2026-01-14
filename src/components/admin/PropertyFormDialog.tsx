import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { MultiImageUpload, PropertyImage } from "./MultiImageUpload";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
type PropertyImageRow = Database["public"]["Tables"]["property_images"]["Row"];

const propertySchema = z.object({
  property_type: z.enum(["rental", "sale"]),
  property_subtype: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  price_cents: z.number().min(1, "Price is required"),
  price_display: z.string().min(1, "Price display is required"),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  size_sqft: z.number().nullable().optional(),
  lot_size_sqft: z.number().nullable().optional(),
  year_built: z.number().nullable().optional(),
  garage_spaces: z.number().nullable().optional(),
  heating_type: z.string().optional(),
  cooling_type: z.string().optional(),
  hoa_fee_cents: z.number().nullable().optional(),
  pet_policy: z.string().optional(),
  deposit_cents: z.number().nullable().optional(),
  available_date: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  virtual_tour_url: z.string().optional(),
  badge: z.string().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

type FormValues = z.infer<typeof propertySchema>;

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onSubmit: (data: PropertyInsert) => void;
  isSubmitting: boolean;
  defaultPropertyType: "rental" | "sale";
}

const PROPERTY_SUBTYPES = [
  "Single Family",
  "Condo",
  "Townhouse",
  "Apartment",
  "Duplex",
  "Multi-Family",
  "Land",
  "Mobile Home",
  "Other",
];

const HEATING_TYPES = ["Central", "Gas", "Electric", "Radiant", "None"];
const COOLING_TYPES = ["Central Air", "Window Unit", "Evaporative", "None"];
const PET_POLICIES = ["Pets Allowed", "Cats Only", "Dogs Only", "Small Pets Only", "No Pets"];
const BADGES = ["Available", "Featured", "Pending", "Under Contract", "Sold", "Rented"];

export function PropertyFormDialog({
  open,
  onOpenChange,
  property,
  onSubmit,
  isSubmitting,
  defaultPropertyType,
}: PropertyFormDialogProps) {
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      property_type: defaultPropertyType,
      is_active: true,
      is_featured: false,
      city: "Ardmore",
      state: "OK",
      badge: "Available",
    },
  });

  const propertyType = form.watch("property_type");

  // Fetch existing images when editing a property
  const fetchPropertyImages = useCallback(async (propertyId: string) => {
    const { data, error } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', propertyId)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Failed to fetch property images:', error);
      return;
    }

    const images: PropertyImage[] = (data || []).map((img: PropertyImageRow) => ({
      id: img.id,
      url: img.image_url,
      displayOrder: img.display_order,
      isPrimary: img.is_primary,
    }));
    
    setPropertyImages(images);
    setImagesLoaded(true);
  }, []);

  useEffect(() => {
    if (property) {
      form.reset({
        property_type: property.property_type as "rental" | "sale",
        property_subtype: property.property_subtype || undefined,
        title: property.title,
        address: property.address,
        city: property.city || undefined,
        state: property.state || undefined,
        zip_code: property.zip_code || undefined,
        price_cents: property.price_cents,
        price_display: property.price_display,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        size_sqft: property.size_sqft,
        lot_size_sqft: property.lot_size_sqft,
        year_built: property.year_built,
        garage_spaces: property.garage_spaces,
        heating_type: property.heating_type || undefined,
        cooling_type: property.cooling_type || undefined,
        hoa_fee_cents: property.hoa_fee_cents,
        pet_policy: property.pet_policy || undefined,
        deposit_cents: property.deposit_cents,
        available_date: property.available_date || undefined,
        description: property.description || undefined,
        image_url: property.image_url || undefined,
        virtual_tour_url: property.virtual_tour_url || undefined,
        badge: property.badge || undefined,
        is_active: property.is_active ?? true,
        is_featured: property.is_featured ?? false,
        latitude: property.latitude,
        longitude: property.longitude,
      });
      fetchPropertyImages(property.id);
    } else {
      form.reset({
        property_type: defaultPropertyType,
        is_active: true,
        is_featured: false,
        city: "Ardmore",
        state: "OK",
        badge: "Available",
      });
      setPropertyImages([]);
      setImagesLoaded(true);
    }
  }, [property, defaultPropertyType, form, fetchPropertyImages]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setPropertyImages([]);
      setImagesLoaded(false);
    }
  }, [open]);

  const handleFormSubmit = async (values: FormValues) => {
    // Get primary image URL for backward compatibility
    const primaryImage = propertyImages.find(img => img.isPrimary) || propertyImages[0];
    
    const propertyData: PropertyInsert = {
      property_type: values.property_type,
      title: values.title,
      address: values.address,
      price_cents: values.price_cents,
      price_display: values.price_display,
      property_subtype: values.property_subtype || null,
      city: values.city || null,
      state: values.state || null,
      zip_code: values.zip_code || null,
      bedrooms: values.bedrooms ?? null,
      bathrooms: values.bathrooms ?? null,
      size_sqft: values.size_sqft ?? null,
      lot_size_sqft: values.lot_size_sqft ?? null,
      year_built: values.year_built ?? null,
      garage_spaces: values.garage_spaces ?? null,
      heating_type: values.heating_type || null,
      cooling_type: values.cooling_type || null,
      hoa_fee_cents: values.hoa_fee_cents ?? null,
      pet_policy: values.pet_policy || null,
      deposit_cents: values.deposit_cents ?? null,
      available_date: values.available_date || null,
      description: values.description || null,
      image_url: primaryImage?.url || values.image_url || null,
      virtual_tour_url: values.virtual_tour_url || null,
      badge: values.badge || null,
      is_active: values.is_active ?? true,
      is_featured: values.is_featured ?? false,
      latitude: values.latitude ?? null,
      longitude: values.longitude ?? null,
    };
    
    // Pass images data along with property data
    (propertyData as any)._images = propertyImages;
    
    onSubmit(propertyData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {property ? "Edit Property" : "Add New Property"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="property_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rental">For Rent</SelectItem>
                            <SelectItem value="sale">For Sale</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="property_subtype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROPERTY_SUBTYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 3BR/2BA Ranch in Oak Hills" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Location
                </h3>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Ardmore" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="OK" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="73401" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="34.1745"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>Optional - for distance sorting</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="-97.1436"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Property Details
                </h3>
                
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beds</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="3"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baths</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="2"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="size_sqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sq Ft</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1500"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="garage_spaces"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Garage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="lot_size_sqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lot Size (sq ft)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="8000"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year_built"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year Built</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2005"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="heating_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heating</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select heating" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HEATING_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cooling_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cooling</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cooling" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COOLING_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Pricing
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price_cents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (in dollars) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1200"
                            {...field}
                            value={field.value ? field.value / 100 : ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) * 100 : 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          {propertyType === "rental" ? "Monthly rent amount" : "Sale price"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_display"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Display *</FormLabel>
                        <FormControl>
                          <Input placeholder="$1,200/mo or $215,000" {...field} />
                        </FormControl>
                        <FormDescription>How price appears on listing</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {propertyType === "sale" && (
                  <FormField
                    control={form.control}
                    name="hoa_fee_cents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HOA Fee ($/month)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="150"
                            {...field}
                            value={field.value ? field.value / 100 : ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) * 100 : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {propertyType === "rental" && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deposit_cents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Deposit ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1200"
                              {...field}
                              value={field.value ? field.value / 100 : ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) * 100 : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pet_policy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pet Policy</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select policy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PET_POLICIES.map((policy) => (
                                <SelectItem key={policy} value={policy}>
                                  {policy}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="available_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Media */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Media
                </h3>
                
                <div className="space-y-2">
                  <FormLabel>Property Images</FormLabel>
                  <MultiImageUpload
                    propertyId={property?.id}
                    images={propertyImages}
                    onChange={setPropertyImages}
                    maxImages={10}
                    disabled={isSubmitting}
                  />
                  <FormDescription>
                    Upload up to 10 images. Images are automatically compressed. Drag to reorder.
                  </FormDescription>
                </div>

                <FormField
                  control={form.control}
                  name="virtual_tour_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Virtual Tour URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/tour" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Description
                </h3>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the property features, neighborhood, and what makes it special..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Status */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Status & Visibility
                </h3>
                
                <FormField
                  control={form.control}
                  name="badge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Badge</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select badge" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BADGES.map((badge) => (
                            <SelectItem key={badge} value={badge}>
                              {badge}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-8">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <FormDescription>
                            Show this listing on the public site
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured</FormLabel>
                          <FormDescription>
                            Highlight this property
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : property ? "Update Property" : "Create Property"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
