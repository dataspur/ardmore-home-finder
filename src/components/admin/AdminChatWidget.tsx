import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, X, Minimize2, Maximize2 } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/imageCompression";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[]; // For displaying uploaded images in chat
}

interface PendingUpload {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
}

export function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant for the Control Tower. I can help you manage tenants, properties, listings, leases, and payments. You can also say things like 'Add photos to listing at 123 Main St' to upload images. What would you like to do?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const uploadImagesToStorage = async (files: File[], propertyId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      try {
        // Compress the image first
        const compressionResult = await compressImage(file);
        const compressedFile = compressionResult.file;
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `${propertyId}/${timestamp}-${randomId}.${extension}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filename, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filename);
        
        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }
    
    return uploadedUrls;
  };

  const sendMessage = useCallback(async (userMessage: string, images?: File[]) => {
    // If we have a pending upload and images, handle the upload
    if (pendingUpload && images && images.length > 0) {
      setIsLoading(true);
      
      // Show user message with image count
      const newUserMessage: Message = { 
        role: "user", 
        content: userMessage || `Uploading ${images.length} image(s)...`,
        images: images.map(f => URL.createObjectURL(f))
      };
      setMessages((prev) => [...prev, newUserMessage]);
      
      try {
        // Upload images to storage
        const uploadedUrls = await uploadImagesToStorage(images, pendingUpload.propertyId);
        
        // Call the AI to save the images
        const { data, error } = await supabase.functions.invoke("admin-assistant", {
          body: {
            messages: [
              { role: "user", content: `Save these uploaded images to property ${pendingUpload.propertyId}: ${JSON.stringify(uploadedUrls)}` }
            ],
          },
        });

        if (error) throw error;

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ Successfully uploaded ${uploadedUrls.length} image(s) to "${pendingUpload.propertyTitle}"!\n\nThe images have been added to the property gallery. You can view them in the Listings section.`,
          },
        ]);
        
        setPendingUpload(null);
      } catch (error) {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        
        toast({
          title: "Upload Error",
          description: errorMessage,
          variant: "destructive",
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Upload failed: ${errorMessage}. Please try again.`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Regular message flow
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-assistant", {
        body: {
          messages: [...messages, newUserMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Check if the response includes an image upload request
      let responseContent = data.content || "I apologize, but I couldn't process that request. Please try again.";
      
      // Parse the response to check for upload action
      if (responseContent.includes('"action":"request_image_upload"') || 
          responseContent.includes('Ready to add images')) {
        // Try to extract property info from the response
        try {
          const match = responseContent.match(/"property":\s*({[^}]+})/);
          if (match) {
            const propertyInfo = JSON.parse(match[1].replace(/'/g, '"'));
            setPendingUpload({
              propertyId: propertyInfo.id,
              propertyTitle: propertyInfo.title,
              propertyAddress: propertyInfo.address,
            });
          }
        } catch {
          // If we can't parse, try a different approach - look for property mentioned
          const addressMatch = responseContent.match(/at ([^.]+)\./);
          if (addressMatch) {
            // The AI should have set up the context
          }
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: responseContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Check if AI is ready for image upload
      if (responseContent.toLowerCase().includes('please select and upload') || 
          responseContent.toLowerCase().includes('ready to add images')) {
        // Extract property info from response if present
        const propertyMatch = responseContent.match(/id['":\s]+([a-f0-9-]+)/i);
        const titleMatch = responseContent.match(/["']([^"']+)["']\s+at\s+/);
        const addressMatch = responseContent.match(/at\s+([^.]+)/);
        
        if (propertyMatch) {
          setPendingUpload({
            propertyId: propertyMatch[1],
            propertyTitle: titleMatch?.[1] || 'Property',
            propertyAddress: addressMatch?.[1] || '',
          });
        }
      }
      
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I encountered an error: ${errorMessage}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast, pendingUpload]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col shadow-2xl transition-all duration-200",
        isMinimized ? "h-14 w-80" : "h-[600px] w-[420px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">AI Assistant</span>
          {pendingUpload && (
            <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded">
              📷 Upload Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Pending upload indicator */}
          {pendingUpload && (
            <div className="bg-muted px-4 py-2 text-sm border-b">
              <div className="flex items-center justify-between">
                <span>
                  📷 Ready to upload to: <strong>{pendingUpload.propertyTitle}</strong>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setPendingUpload(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="divide-y">
              {messages.map((message, index) => (
                <div key={index}>
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                  />
                  {/* Show image thumbnails if present */}
                  {message.images && message.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 pb-3">
                      {message.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Uploaded ${i + 1}`}
                          className="h-12 w-12 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <ChatMessage role="assistant" content="" isLoading />
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <ChatInput 
            onSend={sendMessage} 
            disabled={isLoading}
            showImageUpload={!!pendingUpload}
          />
        </>
      )}
    </Card>
  );
}
