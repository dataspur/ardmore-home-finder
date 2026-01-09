import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let isInitialized = false;

    const checkAdminRole = async (userId: string): Promise<boolean> => {
      const { data: hasAdminRole } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      return hasAdminRole === true;
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip processing during initialization - getSession handles that
        if (!isInitialized) return;
        
        // Only react to actual sign in/out events, not initial session
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const isAdmin = await checkAdminRole(session.user.id);
            setIsAuthorized(isAdmin);
            if (!isAdmin) {
              toast({
                variant: "destructive",
                title: "Unauthorized Access",
                description: "You do not have permission to access this page.",
              });
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthorized(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const isAdmin = await checkAdminRole(session.user.id);
        setIsAuthorized(isAdmin);
        if (!isAdmin) {
          toast({
            variant: "destructive",
            title: "Unauthorized Access",
            description: "You do not have permission to access this page.",
          });
        }
      } else {
        setIsAuthorized(false);
      }
      
      isInitialized = true;
      setIsLoading(false);
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
}
