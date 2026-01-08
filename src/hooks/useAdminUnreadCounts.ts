import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdminUnreadCounts = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription for new replies
  useEffect(() => {
    const channel = supabase
      .channel('admin-unread-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_replies'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-unread-counts"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'form_submissions'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-unread-counts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["admin-unread-counts"],
    queryFn: async () => {
      // Get pending form submissions count
      const { count: pendingSubmissions } = await supabase
        .from("form_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get unread tenant replies count
      const { count: unreadReplies } = await supabase
        .from("message_replies")
        .select("*", { count: "exact", head: true })
        .eq("is_read_by_admin", false);

      return {
        pendingSubmissions: pendingSubmissions || 0,
        unreadReplies: unreadReplies || 0,
        total: (pendingSubmissions || 0) + (unreadReplies || 0),
      };
    },
  });
};
