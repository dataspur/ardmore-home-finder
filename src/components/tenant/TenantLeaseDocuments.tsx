import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaseDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_at: string;
  notes: string | null;
}

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

interface TenantLeaseDocumentsProps {
  onNoDocuments?: () => void;
}

export function TenantLeaseDocuments({ onNoDocuments }: TenantLeaseDocumentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<LeaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      // First get tenant_id for current user
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (tenantError || !tenant) {
        setLoading(false);
        return;
      }

      const { data: docs, error: docsError } = await supabase
        .from("lease_documents")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("uploaded_at", { ascending: false });

      if (docsError) throw docsError;

      setDocuments(docs || []);
      
      if ((!docs || docs.length === 0) && onNoDocuments) {
        onNoDocuments();
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: LeaseDocument) => {
    setDownloading(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from("lease-documents")
        .createSignedUrl(doc.file_path, 60);

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Download failed",
        description: "Unable to download the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Lease Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Lease Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No documents have been uploaded yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You can request a copy using the form below.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Your Lease Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{doc.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded {formatDate(doc.uploaded_at)} • {formatFileSize(doc.file_size_bytes)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(doc)}
                disabled={downloading === doc.id}
              >
                {downloading === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
