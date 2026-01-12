import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, RefreshCw, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AUTH_TIMEOUT_MS = 8000;

export default function AdminRoute({ children }: AdminRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    const { data } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });
    return data === true;
  };

  const initializeAuth = useCallback(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let resolved = false;

    // Timeout protection - prevents infinite spinner
    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setHasError(true);
        setIsLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    // Set up auth state listener FIRST (non-blocking)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthorized(false);
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            setIsLoading(false);
          }
        }
      }
    );

    // THEN check for existing session using non-blocking .then()
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (resolved) return Promise.resolve(undefined);
        
        if (!session?.user) {
          resolved = true;
          clearTimeout(timeoutId);
          setIsAuthorized(false);
          setIsLoading(false);
          return Promise.resolve(undefined);
        }

        return checkAdminRole(session.user.id);
      })
      .then((isAdmin) => {
        if (resolved || isAdmin === undefined) return;
        
        resolved = true;
        clearTimeout(timeoutId);
        setIsAuthorized(isAdmin);
        
        if (!isAdmin) {
          toast({
            variant: "destructive",
            title: "Unauthorized Access",
            description: "You do not have permission to access this page.",
          });
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Admin auth error:", error);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [toast]);

  useEffect(() => {
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    initializeAuth();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin-login';
  };

  // Error state with retry options
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">Connection Issue</h2>
          <p className="text-muted-foreground mb-6">
            We're having trouble verifying your admin session. This may be a temporary network issue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/admin-login'}>
              <LogIn className="w-4 h-4 mr-2" />
              Go to Login
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
}
