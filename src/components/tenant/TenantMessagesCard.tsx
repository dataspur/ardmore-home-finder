import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Mail, MailOpen, ChevronRight, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TenantMessage {
  id: string;
  message_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  admin_messages: {
    id: string;
    subject: string;
    body: string;
    created_at: string;
  };
}

interface MessageReply {
  id: string;
  body: string;
  created_at: string;
  tenant_id: string;
}

export default function TenantMessagesCard() {
  const [selectedMessage, setSelectedMessage] = useState<TenantMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["tenant-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_recipients")
        .select(`
          id,
          message_id,
          is_read,
          read_at,
          created_at,
          admin_messages (
            id,
            subject,
            body,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TenantMessage[];
    },
  });

  // Fetch replies for the selected message
  const { data: replies } = useQuery({
    queryKey: ["message-replies", selectedMessage?.message_id],
    queryFn: async () => {
      if (!selectedMessage?.message_id) return [];
      const { data, error } = await supabase
        .from("message_replies")
        .select("*")
        .eq("message_id", selectedMessage.message_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as MessageReply[];
    },
    enabled: !!selectedMessage?.message_id,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('tenant-new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_recipients'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tenant-messages"] });
          queryClient.invalidateQueries({ queryKey: ["unread-message-count"] });
          toast({
            title: "New Message",
            description: "You have a new message from management.",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  const markAsReadMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const { error } = await supabase
        .from("message_recipients")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", recipientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-messages"] });
      queryClient.invalidateQueries({ queryKey: ["unread-message-count"] });
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ messageId, body }: { messageId: string; body: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Not authenticated");

      const { error } = await supabase.functions.invoke("send-tenant-reply", {
        body: { message_id: messageId, body },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-replies"] });
      setReplyText("");
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent to management.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Reply",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOpenMessage = (message: TenantMessage) => {
    setSelectedMessage(message);
    setReplyText("");
    if (!message.is_read) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleSendReply = () => {
    if (!selectedMessage || !replyText.trim()) return;
    sendReplyMutation.mutate({
      messageId: selectedMessage.message_id,
      body: replyText.trim(),
    });
  };

  const unreadCount = messages?.filter(m => !m.is_read).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Messages from Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading messages...</p>
        </CardContent>
      </Card>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Messages from Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No messages yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Messages from Management
            </span>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {messages.slice(0, 5).map((message) => (
            <Button
              key={message.id}
              variant="ghost"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={() => handleOpenMessage(message)}
            >
              <div className="flex items-center gap-3 w-full">
                {message.is_read ? (
                  <MailOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className={`truncate ${!message.is_read ? "font-semibold" : ""}`}>
                    {message.admin_messages?.subject || "No subject"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.admin_messages?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              {/* Original message */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {format(new Date(selectedMessage.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
                <div className="border-l-4 border-primary pl-4 py-2 bg-muted/50 rounded-r-lg">
                  <p className="whitespace-pre-wrap">{selectedMessage.admin_messages?.body}</p>
                </div>
              </div>

              {/* Replies thread */}
              {replies && replies.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Replies</p>
                  {replies.map((reply) => (
                    <div key={reply.id} className="border-l-4 border-secondary pl-4 py-2 bg-secondary/30 rounded-r-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        You replied on {format(new Date(reply.created_at), "MMM d 'at' h:mm a")}
                      </p>
                      <p className="whitespace-pre-wrap text-sm">{reply.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              <div className="space-y-2 pt-2 border-t">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sendReplyMutation.isPending}
                  className="w-full"
                >
                  {sendReplyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
