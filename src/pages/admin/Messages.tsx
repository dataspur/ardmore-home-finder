import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Wrench, FileText, Mail, Check, Clock, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type FormSubmission = Database["public"]["Tables"]["form_submissions"]["Row"];
type FormType = Database["public"]["Enums"]["form_type"];
type SubmissionStatus = Database["public"]["Enums"]["submission_status"];

const formTypeIcons: Record<FormType, React.ReactNode> = {
  maintenance: <Wrench className="h-4 w-4 text-orange-500" />,
  lease: <FileText className="h-4 w-4 text-blue-500" />,
  contact: <Mail className="h-4 w-4 text-green-500" />,
};

const formTypeLabels: Record<FormType, string> = {
  maintenance: "Maintenance",
  lease: "Lease Request",
  contact: "Contact",
};

const statusConfig: Record<SubmissionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "destructive" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "outline" },
};

export default function Messages() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<FormSubmission | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["form_submissions", filterType, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("form_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("form_type", filterType as FormType);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus as SubmissionStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SubmissionStatus }) => {
      const { error } = await supabase
        .from("form_submissions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form_submissions"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to update status" });
    },
  });

  const getMessagePreview = (data: unknown): { name: string; email: string; subject: string } => {
    const d = data as Record<string, unknown>;
    return {
      name: (d.name as string) || (d.fullName as string) || "Unknown",
      email: (d.email as string) || "No email",
      subject: (d.issue as string) || (d.message as string) || (d.requestType as string) || "No subject",
    };
  };

  const pendingCount = messages?.filter(m => m.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          View and manage form submissions from the website
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="lease">Lease</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {pendingCount > 0 && (
          <Badge variant="destructive" className="ml-auto">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Messages Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading messages...
                </TableCell>
              </TableRow>
            ) : messages?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              messages?.map((message) => {
                const preview = getMessagePreview(message.data);
                const statusInfo = statusConfig[message.status];
                return (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formTypeIcons[message.form_type]}
                        <span className="text-sm">{formTypeLabels[message.form_type]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{preview.name}</p>
                        <p className="text-sm text-muted-foreground">{preview.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="truncate max-w-[200px]">{preview.subject}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(message.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedMessage(message)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {message.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateStatusMutation.mutate({ id: message.id, status: "completed" })}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && formTypeIcons[selectedMessage.form_type]}
              {selectedMessage && formTypeLabels[selectedMessage.form_type]} Details
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedMessage.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </span>
                <Select
                  value={selectedMessage.status}
                  onValueChange={(value) => {
                    updateStatusMutation.mutate({ id: selectedMessage.id, status: value as SubmissionStatus });
                    setSelectedMessage({ ...selectedMessage, status: value as SubmissionStatus });
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                {Object.entries(selectedMessage.data as Record<string, unknown>).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-sm">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
