import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Calendar,
  Thermometer,
  Wind,
  PawPrint,
  DollarSign,
  Home,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PropertyImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface PropertyDetails {
  id: string;
  title: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  price_display: string;
  price_cents: number;
  property_type: string;
  property_subtype: string | null;
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  lot_size_sqft: number | null;
  year_built: number | null;
  garage_spaces: number | null;
  heating_type: string | null;
  cooling_type: string | null;
  pet_policy: string | null;
  deposit_cents: number | null;
  hoa_fee_cents: number | null;
  available_date: string | null;
  virtual_tour_url: string | null;
  badge: string | null;
  image_url: string | null;
}

interface PropertyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string | null;
  fallbackImage: string;
  onApplyOrInquire?: (propertyInfo: string) => void;
  actionLabel?: string;
}

export default function PropertyDetailDialog({
  open,
  onOpenChange,
  propertyId,
  fallbackImage,
  onApplyOrInquire,
  actionLabel = "Apply Now",
}: PropertyDetailDialogProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property-detail", propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      return data as PropertyDetails;
    },
    enabled: !!propertyId && open,
  });

  const { data: images = [] } = useQuery({
    queryKey: ["property-images", propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", propertyId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PropertyImage[];
    },
    enabled: !!propertyId && open,
  });

  // Build the full list of images for the lightbox
  const allImages = useMemo(() => {
    if (images.length > 0) {
      return images.map((img) => img.image_url);
    }
    // If no images from property_images table, use image_url or fallback
    return [property?.image_url || fallbackImage];
  }, [images, property?.image_url, fallbackImage]);

  const primaryImage = useMemo(() => {
    const primary = images.find((img) => img.is_primary);
    return primary?.image_url || property?.image_url || fallbackImage;
  }, [images, property?.image_url, fallbackImage]);

  const fullAddress = useMemo(() => {
    if (!property) return "";
    const parts = [property.address];
    if (property.city) parts.push(property.city);
    if (property.state) parts.push(property.state);
    if (property.zip_code) parts.push(property.zip_code);
    return parts.join(", ");
  }, [property]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Lightbox navigation
  const goToPrevious = useCallback(() => {
    setLightboxIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, goToPrevious, goToNext]);

  // Close lightbox when dialog closes
  useEffect(() => {
    if (!open) {
      setLightboxOpen(false);
    }
  }, [open]);

  if (!property && !isLoading) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <ScrollArea className="max-h-[90vh]">
            <div className="relative">
              {/* Image Gallery */}
              <div 
                className="relative h-64 md:h-80 overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(0)}
              >
                <img
                  src={primaryImage}
                  alt={property?.title || "Property"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Click to view gallery
                  </span>
                </div>
                {property?.badge && (
                  <Badge
                    className={`absolute top-4 left-4 ${
                      property.badge === "Featured"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {property.badge}
                  </Badge>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto bg-muted/50">
                  {images.map((img, index) => (
                    <img
                      key={img.id}
                      src={img.image_url}
                      alt={`Property image ${index + 1}`}
                      className="w-20 h-14 object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => openLightbox(index)}
                    />
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl md:text-3xl font-heading">
                    {property?.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-muted-foreground mt-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-body">{fullAddress}</span>
                  </div>
                </DialogHeader>

                {/* Price */}
                <div className="mb-6">
                  <p className="text-3xl font-heading text-primary font-bold">
                    {property?.price_display}
                  </p>
                  {property?.property_type === "rental" && (
                    <p className="text-sm text-muted-foreground">per month</p>
                  )}
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {property?.bedrooms !== null && property?.bedrooms !== undefined && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Bed className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">{property.bedrooms}</p>
                        <p className="text-xs text-muted-foreground">Bedrooms</p>
                      </div>
                    </div>
                  )}
                  {property?.bathrooms !== null && property?.bathrooms !== undefined && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Bath className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">{property.bathrooms}</p>
                        <p className="text-xs text-muted-foreground">Bathrooms</p>
                      </div>
                    </div>
                  )}
                  {property?.size_sqft !== null && property?.size_sqft !== undefined && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Square className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">{property.size_sqft.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Sq Ft</p>
                      </div>
                    </div>
                  )}
                  {property?.garage_spaces !== null && property?.garage_spaces !== undefined && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Car className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">{property.garage_spaces}</p>
                        <p className="text-xs text-muted-foreground">Garage</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Description */}
                {property?.description && (
                  <div className="mb-6">
                    <h3 className="font-heading text-lg font-semibold mb-2">Description</h3>
                    <p className="font-body text-muted-foreground whitespace-pre-wrap">
                      {property.description}
                    </p>
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Property Details */}
                  <div>
                    <h3 className="font-heading text-lg font-semibold mb-3">Property Details</h3>
                    <div className="space-y-2">
                      {property?.property_subtype && (
                        <div className="flex items-center gap-2 text-sm">
                          <Home className="w-4 h-4 text-muted-foreground" />
                          <span>Type: {property.property_subtype}</span>
                        </div>
                      )}
                      {property?.year_built && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Built in {property.year_built}</span>
                        </div>
                      )}
                      {property?.lot_size_sqft && (
                        <div className="flex items-center gap-2 text-sm">
                          <Square className="w-4 h-4 text-muted-foreground" />
                          <span>Lot: {property.lot_size_sqft.toLocaleString()} sq ft</span>
                        </div>
                      )}
                      {property?.heating_type && (
                        <div className="flex items-center gap-2 text-sm">
                          <Thermometer className="w-4 h-4 text-muted-foreground" />
                          <span>Heating: {property.heating_type}</span>
                        </div>
                      )}
                      {property?.cooling_type && (
                        <div className="flex items-center gap-2 text-sm">
                          <Wind className="w-4 h-4 text-muted-foreground" />
                          <span>Cooling: {property.cooling_type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rental/Sale Specific */}
                  <div>
                    <h3 className="font-heading text-lg font-semibold mb-3">
                      {property?.property_type === "rental" ? "Rental Info" : "Sale Info"}
                    </h3>
                    <div className="space-y-2">
                      {property?.deposit_cents !== null && property?.deposit_cents !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>Deposit: {formatCurrency(property.deposit_cents)}</span>
                        </div>
                      )}
                      {property?.hoa_fee_cents !== null && property?.hoa_fee_cents !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>HOA Fee: {formatCurrency(property.hoa_fee_cents)}/mo</span>
                        </div>
                      )}
                      {property?.pet_policy && (
                        <div className="flex items-center gap-2 text-sm">
                          <PawPrint className="w-4 h-4 text-muted-foreground" />
                          <span>Pets: {property.pet_policy}</span>
                        </div>
                      )}
                      {property?.available_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Available: {formatDate(property.available_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Virtual Tour */}
                {property?.virtual_tour_url && (
                  <div className="mb-6">
                    <a
                      href={property.virtual_tour_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Take a Virtual Tour
                    </a>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex gap-4">
                  <Button
                    className="flex-1 min-h-[44px]"
                    onClick={() => {
                      if (onApplyOrInquire && property) {
                        // Pass property title with full address for context
                        const propertyInfo = fullAddress 
                          ? `${property.title} - ${fullAddress}`
                          : property.title;
                        onApplyOrInquire(propertyInfo);
                      }
                    }}
                  >
                    {actionLabel}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-[44px]"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 text-white/80 font-medium">
            {lightboxIndex + 1} / {allImages.length}
          </div>

          {/* Main Image Container */}
          <div 
            className="flex-1 flex items-center justify-center w-full px-16 py-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
            )}

            {/* Current Image */}
            <img
              src={allImages[lightboxIndex]}
              alt={`Property image ${lightboxIndex + 1}`}
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />

            {/* Next Button */}
            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div 
              className="flex gap-2 p-4 overflow-x-auto max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-16 h-12 object-cover rounded cursor-pointer transition-all ${
                    index === lightboxIndex 
                      ? "ring-2 ring-white opacity-100" 
                      : "opacity-60 hover:opacity-100"
                  }`}
                  onClick={() => setLightboxIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
