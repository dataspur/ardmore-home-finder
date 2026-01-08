import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PropertyInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyTitle: string;
}

const PropertyInquiryDialog = ({ open, onOpenChange, propertyTitle }: PropertyInquiryDialogProps) => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-notification", {
        body: {
          form_type: "contact",
          name: formData.name,
          email: formData.email,
          message: `Property Inquiry: ${propertyTitle}\n\nPhone: ${formData.phone}\n\n${formData.message}`,
        },
      });

      if (error) {
        console.error("Email notification failed:", error);
      }

      toast({
        title: "Inquiry Sent!",
        description: "We'll be in touch about this property soon.",
      });
      setFormData({ name: "", email: "", phone: "", message: "" });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Inquiry form error:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inquire About This Property</DialogTitle>
          <DialogDescription>{propertyTitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inquiry-name" className="block text-sm font-medium text-foreground mb-1">
              Full Name
            </label>
            <Input
              id="inquiry-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label htmlFor="inquiry-email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <Input
              id="inquiry-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label htmlFor="inquiry-phone" className="block text-sm font-medium text-foreground mb-1">
              Phone
            </label>
            <Input
              id="inquiry-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label htmlFor="inquiry-message" className="block text-sm font-medium text-foreground mb-1">
              Message (Optional)
            </label>
            <Textarea
              id="inquiry-message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Any questions about this property?"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Inquiry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyInquiryDialog;
