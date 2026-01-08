import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReportIssueDialogProps {
  tenantId: string;
  propertyAddress: string;
  children: React.ReactNode;
}

export function ReportIssueDialog({
  tenantId,
  propertyAddress,
  children,
}: ReportIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!issueType || !description.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select an issue type and provide a description.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use edge function to submit without auth
      const { error } = await supabase.functions.invoke("send-notification", {
        body: {
          type: "issue_report",
          tenant_id: tenantId,
          property_address: propertyAddress,
          issue_type: issueType,
          description: description,
        },
      });

      if (error) throw error;

      toast({
        title: "Issue Reported",
        description: "Your issue has been submitted. We'll respond within 24-48 hours.",
      });

      setOpen(false);
      setIssueType("");
      setDescription("");
    } catch (err) {
      console.error("Submit error:", err);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Unable to submit your issue. Please try again or contact us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            Submit a maintenance request or billing inquiry. We typically respond within 24-48 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="issue-type">Issue Type</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger id="issue-type">
                <SelectValue placeholder="Select an issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance Request</SelectItem>
                <SelectItem value="billing">Billing Question</SelectItem>
                <SelectItem value="lease">Lease Inquiry</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Please describe your issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
