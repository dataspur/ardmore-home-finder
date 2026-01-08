import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Send, Users, User, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ComposeMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ComposeMessageDialog({ open, onOpenChange }: ComposeMessageDialogProps) {
  const [recipientType, setRecipientType] = useState<"all" | "individual">("all");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenants } = useQuery({
    queryKey: ["tenants-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, email")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("send-admin-message", {
        body: {
          subject,
          body,
          is_mass_message: recipientType === "all",
          tenant_ids: recipientType === "individual" ? [selectedTenantId] : undefined,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Message Sent",
        description: `Successfully sent to ${data.recipients} tenant(s). ${data.emails_sent} email(s) delivered.`,
      });
      queryClient.invalidateQueries({ queryKey: ["sent-messages"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setRecipientType("all");
    setSelectedTenantId("");
    setSubject("");
    setBody("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in both subject and message body.",
      });
      return;
    }
    if (recipientType === "individual" && !selectedTenantId) {
      toast({
        variant: "destructive",
        title: "No tenant selected",
        description: "Please select a tenant to message.",
      });
      return;
    }
    sendMessageMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Compose Message
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Recipients</Label>
            <Select value={recipientType} onValueChange={(v) => setRecipientType(v as "all" | "individual")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Tenants
                  </div>
                </SelectItem>
                <SelectItem value="individual">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Individual Tenant
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType === "individual" && (
            <div className="space-y-2">
              <Label>Select Tenant</Label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendMessageMutation.isPending}>
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
