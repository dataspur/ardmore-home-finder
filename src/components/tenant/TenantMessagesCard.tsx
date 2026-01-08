import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Mail, MailOpen, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function TenantMessagesCard() {
  const [selectedMessage, setSelectedMessage] = useState<TenantMessage | null>(null);
  const queryClient = useQueryClient();

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
    },
  });

  const handleOpenMessage = (message: TenantMessage) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsReadMutation.mutate(message.id);
    }
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.admin_messages?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {format(new Date(selectedMessage.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
              <div className="border-l-4 border-primary pl-4 py-2 bg-muted/50 rounded-r-lg">
                <p className="whitespace-pre-wrap">{selectedMessage.admin_messages?.body}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
