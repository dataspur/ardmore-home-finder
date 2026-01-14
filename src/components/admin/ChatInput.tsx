import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, images?: File[]) => void;
  disabled?: boolean;
  showImageUpload?: boolean;
}

export function ChatInput({ onSend, disabled, showImageUpload = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if ((input.trim() || selectedImages.length > 0) && !disabled) {
      onSend(input.trim(), selectedImages.length > 0 ? selectedImages : undefined);
      setInput("");
      setSelectedImages([]);
      setImagePreviews([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    
    if (imageFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...imageFiles]);
      
      // Generate previews
      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t bg-background">
      {/* Image previews */}
      {imagePreviews.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 pb-0">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="h-16 w-16 object-cover rounded-lg border"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2 p-4">
        {showImageUpload && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="shrink-0"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
          </>
        )}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={showImageUpload 
            ? "Add a message or just upload the images..."
            : "Ask me anything... (e.g., 'Add a new tenant', 'Add photos to 123 Main St')"
          }
          className="min-h-[44px] max-h-32 resize-none"
          disabled={disabled}
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || (!input.trim() && selectedImages.length === 0)}
          size="icon"
          className="shrink-0"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
