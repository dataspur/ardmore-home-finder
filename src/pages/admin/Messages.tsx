import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Wrench, FileText, Mail, Check, Eye, Send, Users, Reply, Loader2, MessageCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ComposeMessageDialog from "@/components/admin/ComposeMessageDialog";
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

interface SentMessage {
  id: string;
  subject: string;
  body: string;
  is_mass_message: boolean;
  created_at: string;
  recipient_count: number;
}

interface MessageReply {
  id: string;
  body: string;
  created_at: string;
  tenant_id: string;
  is_read_by_admin: boolean;
  tenants?: { name: string; email: string };
}

export default function Messages() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<FormSubmission | null>(null);
  const [selectedSentMessage, setSelectedSentMessage] = useState<SentMessage | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
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

  const { data: sentMessages, isLoading: sentLoading } = useQuery({
    queryKey: ["sent-messages"],
    queryFn: async () => {
      const { data: adminMessages, error } = await supabase
        .from("admin_messages")
        .select(`
          id,
          subject,
          body,
          is_mass_message,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get recipient counts for each message
      const messagesWithCounts = await Promise.all(
        (adminMessages || []).map(async (msg) => {
          const { count } = await supabase
            .from("message_recipients")
            .select("*", { count: "exact", head: true })
            .eq("message_id", msg.id);
          return { ...msg, recipient_count: count || 0 };
        })
      );

      return messagesWithCounts;
    },
  });

  // Fetch replies for selected sent message
  const { data: messageReplies } = useQuery({
    queryKey: ["message-replies", selectedSentMessage?.id],
    queryFn: async () => {
      if (!selectedSentMessage?.id) return [];
      const { data, error } = await supabase
        .from("message_replies")
        .select(`
          id,
          body,
          created_at,
          tenant_id,
          is_read_by_admin,
          tenants (name, email)
        `)
        .eq("message_id", selectedSentMessage.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as unknown as MessageReply[];
    },
    enabled: !!selectedSentMessage?.id,
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
      queryClient.invalidateQueries({ queryKey: ["admin-unread-counts"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to update status" });
    },
  });

  const replyToSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, reply }: { submissionId: string; reply: string }) => {
      const { error } = await supabase.functions.invoke("reply-to-submission", {
        body: { submission_id: submissionId, reply },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form_submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-unread-counts"] });
      setReplyText("");
      setSelectedMessage(null);
      toast({ title: "Reply sent successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Failed to send reply", description: error.message });
    },
  });

  const markRepliesAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("message_replies")
        .update({ is_read_by_admin: true })
        .eq("message_id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-replies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-unread-counts"] });
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

  const handleViewSentMessage = (msg: SentMessage) => {
    setSelectedSentMessage(msg);
    // Mark replies as read when viewing
    markRepliesAsReadMutation.mutate(msg.id);
  };

  const pendingCount = messages?.filter(m => m.status === "pending").length || 0;
  const unreadRepliesCount = messageReplies?.filter(r => !r.is_read_by_admin).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            View submissions and send messages to tenants
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <Send className="h-4 w-4 mr-2" />
          Compose Message
        </Button>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            Inbox
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
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
                              onClick={() => {
                                setSelectedMessage(message);
                                setReplyText("");
                              }}
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
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[150px]">Recipients</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[100px]">Replies</TableHead>
                  <TableHead className="w-[80px]">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading sent messages...
                    </TableCell>
                  </TableRow>
                ) : sentMessages?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No sent messages yet
                    </TableCell>
                  </TableRow>
                ) : (
                  sentMessages?.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>
                        <p className="font-medium">{msg.subject}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {msg.is_mass_message ? (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              All ({msg.recipient_count})
                            </Badge>
                          ) : (
                            <Badge variant="outline">{msg.recipient_count} tenant</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(msg.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewSentMessage(msg)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Message Detail Dialog with Reply */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
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

              {/* Admin reply section */}
              {(selectedMessage as any).admin_reply ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Your Reply</p>
                  <div className="border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Sent on {format(new Date((selectedMessage as any).admin_reply_at), "MMM d 'at' h:mm a")}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{(selectedMessage as any).admin_reply}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Reply via Email</p>
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={() => replyToSubmissionMutation.mutate({ 
                      submissionId: selectedMessage.id, 
                      reply: replyText 
                    })}
                    disabled={!replyText.trim() || replyToSubmissionMutation.isPending}
                    className="w-full"
                  >
                    {replyToSubmissionMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Reply className="h-4 w-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sent Message Detail Dialog with Replies */}
      <Dialog open={!!selectedSentMessage} onOpenChange={() => setSelectedSentMessage(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSentMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedSentMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{format(new Date(selectedSentMessage.created_at), "MMMM d, yyyy 'at' h:mm a")}</span>
                <Badge variant={selectedSentMessage.is_mass_message ? "secondary" : "outline"}>
                  {selectedSentMessage.is_mass_message ? "Mass message" : "Individual"}
                </Badge>
              </div>
              <div className="border-l-4 border-primary pl-4 py-2 bg-muted/50 rounded-r-lg">
                <p className="whitespace-pre-wrap">{selectedSentMessage.body}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Sent to {selectedSentMessage.recipient_count} recipient(s)
              </p>

              {/* Tenant replies */}
              {messageReplies && messageReplies.length > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Tenant Replies ({messageReplies.length})
                  </p>
                  {messageReplies.map((reply) => (
                    <div key={reply.id} className="border-l-4 border-secondary pl-4 py-2 bg-secondary/30 rounded-r-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium">
                          {reply.tenants?.name || "Unknown"} ({reply.tenants?.email})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(reply.created_at), "MMM d 'at' h:mm a")}
                        </p>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{reply.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ComposeMessageDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}
