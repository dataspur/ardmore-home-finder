import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessageCount = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('unread-count-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_recipients'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-message-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["unread-message-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("message_recipients")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      
      if (error) throw error;
      return count || 0;
    },
  });
};
