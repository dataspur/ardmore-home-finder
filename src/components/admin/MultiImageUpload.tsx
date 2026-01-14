import { useState, useCallback, useRef } from "react";
import { Upload, X, GripVertical, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage, formatFileSize, isValidImageType, isValidFileSize } from "@/lib/imageCompression";
import { cn } from "@/lib/utils";

export interface PropertyImage {
  id?: string;
  url: string;
  displayOrder: number;
  isPrimary: boolean;
  isUploading?: boolean;
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    savings: number;
  };
}

interface MultiImageUploadProps {
  propertyId?: string;
  images: PropertyImage[];
  onChange: (images: PropertyImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function MultiImageUpload({
  propertyId,
  images,
  onChange,
  maxImages = 10,
  disabled = false,
}: MultiImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = useCallback(async (file: File): Promise<PropertyImage | null> => {
    // Validate file
    if (!isValidImageType(file)) {
      toast.error(`Invalid file type: ${file.name}. Please use JPEG, PNG, WebP, or GIF.`);
      return null;
    }

    if (!isValidFileSize(file, 10)) {
      toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
      return null;
    }

    try {
      // Compress the image
      const { file: compressedFile, originalSize, compressedSize, savings } = await compressImage(file);

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const extension = compressedFile.type === 'image/jpeg' ? 'jpg' : 'png';
      const fileName = `${propertyId || 'new'}-${timestamp}-${randomId}.${extension}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, compressedFile, {
          contentType: compressedFile.type,
          cacheControl: '3600',
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);

      if (savings > 0) {
        toast.success(`Uploaded ${file.name} (${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)}, ${savings}% saved)`);
      } else {
        toast.success(`Uploaded ${file.name}`);
      }

      return {
        url: urlData.publicUrl,
        displayOrder: images.length,
        isPrimary: images.length === 0,
        compressionInfo: { originalSize, compressedSize, savings },
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${file.name}`);
      return null;
    }
  }, [propertyId, images.length]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more image(s) can be added. Maximum is ${maxImages}.`);
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);
    
    // Add placeholders for uploading images
    const placeholders: PropertyImage[] = filesToUpload.map((file, index) => ({
      url: URL.createObjectURL(file),
      displayOrder: images.length + index,
      isPrimary: images.length === 0 && index === 0,
      isUploading: true,
    }));

    onChange([...images, ...placeholders]);

    // Upload each file
    const uploadPromises = filesToUpload.map(async (file, index) => {
      const result = await uploadImage(file);
      return { index: images.length + index, result };
    });

    const results = await Promise.all(uploadPromises);

    // Update images with uploaded URLs
    const updatedImages = [...images];
    results.forEach(({ index, result }) => {
      if (result) {
        updatedImages[index] = result;
      } else {
        // Mark for removal if upload failed
        updatedImages[index] = { ...updatedImages[index], url: '', isUploading: false };
      }
    });

    // Filter out failed uploads and update order
    const finalImages = updatedImages
      .filter(img => img.url !== '')
      .map((img, idx) => ({
        ...img,
        displayOrder: idx,
        isPrimary: idx === 0,
        isUploading: false,
      }));

    onChange(finalImages);
  }, [images, maxImages, onChange, uploadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const removeImage = useCallback(async (index: number) => {
    const imageToRemove = images[index];
    
    // Try to delete from storage if it's a Supabase URL
    if (imageToRemove.url.includes('property-images')) {
      try {
        const urlParts = imageToRemove.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage.from('property-images').remove([fileName]);
      } catch (error) {
        console.error('Failed to delete image from storage:', error);
      }
    }

    const newImages = images
      .filter((_, i) => i !== index)
      .map((img, idx) => ({
        ...img,
        displayOrder: idx,
        isPrimary: idx === 0,
      }));
    
    onChange(newImages);
  }, [images, onChange]);

  // Drag and drop reordering
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    // Update order and primary status
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      displayOrder: idx,
      isPrimary: idx === 0,
    }));

    onChange(reorderedImages);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
          images.length >= maxImages && "hidden"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Drop images here or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPEG, PNG, WebP or GIF • Max 10MB • Up to {maxImages} images
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Images are automatically compressed for faster loading
        </p>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.url + index}
              draggable={!image.isUploading && !disabled}
              onDragStart={(e) => handleImageDragStart(e, index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
              className={cn(
                "relative group aspect-square rounded-lg overflow-hidden border bg-muted",
                draggedIndex === index && "opacity-50",
                !image.isUploading && !disabled && "cursor-grab active:cursor-grabbing"
              )}
            >
              {image.isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <img
                    src={image.url}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary badge */}
                  {image.isPrimary && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                      Primary
                    </div>
                  )}

                  {/* Drag handle */}
                  <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-background/80 rounded p-1">
                      <GripVertical className="h-4 w-4 text-foreground" />
                    </div>
                  </div>

                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Compression info */}
                  {image.compressionInfo && image.compressionInfo.savings > 0 && (
                    <div className="absolute bottom-1 left-1 bg-background/80 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {image.compressionInfo.savings}% smaller
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Add more button */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors",
                "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add more</span>
            </button>
          )}
        </div>
      )}

      {/* Image count */}
      {images.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {images.length} of {maxImages} images • Drag to reorder • First image is the primary listing photo
        </p>
      )}
    </div>
  );
}
