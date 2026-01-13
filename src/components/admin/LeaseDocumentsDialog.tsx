import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, Download, Loader2 } from "lucide-react";

interface LeaseDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_at: string | null;
  notes: string | null;
}

interface LeaseDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: { id: string; name: string } | null;
  leaseId?: string;
}

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Unknown date";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function LeaseDocumentsDialog({
  open,
  onOpenChange,
  tenant,
  leaseId,
}: LeaseDocumentsDialogProps) {
  const [documents, setDocuments] = useState<LeaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<LeaseDocument | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!tenant) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from("lease_documents")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("uploaded_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load documents" });
    } else {
      setDocuments(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (open && tenant) {
      fetchDocuments();
    }
  }, [open, tenant]);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Only PDF and DOC files are allowed" });
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "File size must be under 10MB" });
      return false;
    }
    return true;
  };

  const uploadDocument = async (file: File) => {
    if (!tenant || !validateFile(file)) return;

    setIsUploading(true);
    const filePath = `${tenant.id}/${crypto.randomUUID()}-${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("lease-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("lease_documents").insert({
        tenant_id: tenant.id,
        lease_id: leaseId || null,
        file_name: file.name,
        file_path: filePath,
        file_size_bytes: file.size,
        mime_type: file.type,
      });

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Document uploaded" });
      fetchDocuments();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadDocument(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadDocument(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDownload = async (doc: LeaseDocument) => {
    const { data, error } = await supabase.storage
      .from("lease-documents")
      .createSignedUrl(doc.file_path, 60);

    if (error || !data?.signedUrl) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate download link" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("lease-documents")
        .remove([documentToDelete.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("lease_documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Document deleted" });
      fetchDocuments();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Delete failed", description: error.message });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const openDeleteDialog = (doc: LeaseDocument) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Lease Documents - {tenant?.name}</DialogTitle>
          </DialogHeader>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileSelect}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Drop PDF/DOC here or click to upload</p>
                <p className="text-xs text-muted-foreground">Max file size: 10MB</p>
              </div>
            )}
          </div>

          {/* Documents List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Documents</h4>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No documents uploaded yet
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size_bytes)} • {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(doc)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{documentToDelete?.file_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
