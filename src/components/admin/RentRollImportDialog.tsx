import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileSpreadsheet, Loader2, Check, AlertCircle, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";

interface RentRollImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ColumnMapping {
  name: string;
  email: string;
  property_address: string;
  unit_number: string;
  rent_amount: string;
  due_date: string;
}

interface ParsedRow {
  name?: string;
  email?: string;
  property_address?: string;
  unit_number?: string;
  rent_amount?: number;
  due_date?: string;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  existingTenantId?: string;
  forceImport: boolean;
}

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

const REQUIRED_FIELDS: (keyof ColumnMapping)[] = ["name", "email", "property_address", "rent_amount"];
const OPTIONAL_FIELDS: (keyof ColumnMapping)[] = ["unit_number", "due_date"];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  name: "Tenant Name",
  email: "Email Address",
  property_address: "Property Address",
  unit_number: "Unit Number",
  rent_amount: "Rent Amount",
  due_date: "Due Date",
};

export function RentRollImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: RentRollImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: "",
    email: "",
    property_address: "",
    unit_number: "",
    rent_amount: "",
    due_date: "",
  });
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; updated: number; failed: number }>({ 
    success: 0, 
    updated: 0, 
    failed: 0 
  });
  const [overrideAll, setOverrideAll] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setRawData([]);
    setColumnMapping({
      name: "",
      email: "",
      property_address: "",
      unit_number: "",
      rent_amount: "",
      due_date: "",
    });
    setParsedData([]);
    setIsImporting(false);
    setImportResults({ success: 0, updated: 0, failed: 0 });
    setOverrideAll(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileUpload = useCallback((uploadedFile: File) => {
    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });
        
        if (jsonData.length === 0) {
          toast({ variant: "destructive", title: "Error", description: "No data found in the file" });
          return;
        }

        const extractedHeaders = Object.keys(jsonData[0]);
        setHeaders(extractedHeaders);
        setRawData(jsonData);
        
        // Auto-map columns based on common names
        const autoMapping: ColumnMapping = { ...columnMapping };
        
        extractedHeaders.forEach((header) => {
          const lower = header.toLowerCase();
          if (lower.includes("name") && !lower.includes("unit")) autoMapping.name = header;
          if (lower.includes("email") || lower.includes("e-mail")) autoMapping.email = header;
          if (lower.includes("address") || lower.includes("property")) autoMapping.property_address = header;
          if (lower.includes("unit") || lower.includes("apt")) autoMapping.unit_number = header;
          if (lower.includes("rent") || lower.includes("amount") || lower.includes("rate")) autoMapping.rent_amount = header;
          if (lower.includes("due") || lower.includes("date")) autoMapping.due_date = header;
        });
        
        setColumnMapping(autoMapping);
        setStep("mapping");
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to parse file" });
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  }, [toast, columnMapping]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls") || droppedFile.name.endsWith(".csv"))) {
      handleFileUpload(droppedFile);
    } else {
      toast({ variant: "destructive", title: "Invalid file", description: "Please upload an Excel or CSV file" });
    }
  }, [handleFileUpload, toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  const validateAndPrepareData = async () => {
    // Fetch existing tenant emails for duplicate detection
    const { data: existingTenants, error } = await supabase
      .from("tenants")
      .select("id, email");
    
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to check for existing tenants" });
      return;
    }

    const existingEmailMap = new Map<string, string>();
    existingTenants?.forEach(tenant => {
      existingEmailMap.set(tenant.email.toLowerCase(), tenant.id);
    });

    const prepared: ParsedRow[] = rawData.map((row) => {
      const errors: string[] = [];
      
      const name = columnMapping.name ? String(row[columnMapping.name] || "").trim() : "";
      const email = columnMapping.email ? String(row[columnMapping.email] || "").trim() : "";
      const property_address = columnMapping.property_address ? String(row[columnMapping.property_address] || "").trim() : "";
      const unit_number = columnMapping.unit_number ? String(row[columnMapping.unit_number] || "").trim() : "";
      
      // Parse rent amount
      let rent_amount = 0;
      if (columnMapping.rent_amount) {
        const rentStr = String(row[columnMapping.rent_amount] || "").replace(/[$,]/g, "");
        rent_amount = parseFloat(rentStr);
        if (isNaN(rent_amount) || rent_amount <= 0) {
          errors.push("Invalid rent amount");
        }
      }
      
      // Parse due date
      let due_date = "";
      if (columnMapping.due_date && row[columnMapping.due_date]) {
        const dateVal = row[columnMapping.due_date];
        if (typeof dateVal === "number") {
          // Excel date serial number
          const date = XLSX.SSF.parse_date_code(dateVal);
          due_date = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
        } else {
          const parsed = new Date(dateVal);
          if (!isNaN(parsed.getTime())) {
            due_date = parsed.toISOString().split("T")[0];
          }
        }
      }
      
      // Default due date to first of next month if not provided
      if (!due_date) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        due_date = nextMonth.toISOString().split("T")[0];
      }
      
      // Validate required fields
      if (!name) errors.push("Name is required");
      if (!email) errors.push("Email is required");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format");
      if (!property_address) errors.push("Property address is required");
      if (!rent_amount || rent_amount <= 0) errors.push("Valid rent amount is required");

      // Check for duplicates
      const existingTenantId = email ? existingEmailMap.get(email.toLowerCase()) : undefined;
      const isDuplicate = !!existingTenantId;
      
      return {
        name,
        email,
        property_address,
        unit_number,
        rent_amount,
        due_date,
        isValid: errors.length === 0,
        errors,
        isDuplicate,
        existingTenantId,
        forceImport: false,
      };
    });
    
    setParsedData(prepared);
    setStep("preview");
  };

  const canProceedToPreview = () => {
    return REQUIRED_FIELDS.every((field) => columnMapping[field]);
  };

  const toggleForceImport = (index: number) => {
    setParsedData(prev => prev.map((row, i) => 
      i === index ? { ...row, forceImport: !row.forceImport } : row
    ));
  };

  const handleOverrideAll = (checked: boolean) => {
    setOverrideAll(checked);
    setParsedData(prev => prev.map(row => 
      row.isDuplicate && row.isValid ? { ...row, forceImport: checked } : row
    ));
  };

  const handleImport = async () => {
    setIsImporting(true);
    setStep("importing");
    
    // Get rows that are either new valid rows OR duplicates with forceImport enabled
    const rowsToProcess = parsedData.filter((row) => 
      row.isValid && (!row.isDuplicate || row.forceImport)
    );
    
    let successCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    
    for (const row of rowsToProcess) {
      try {
        if (row.isDuplicate && row.forceImport && row.existingTenantId) {
          // Update existing tenant's name if different
          await supabase
            .from("tenants")
            .update({ name: row.name! })
            .eq("id", row.existingTenantId);

          // Check for existing active lease
          const { data: existingLeases } = await supabase
            .from("leases")
            .select("id")
            .eq("tenant_id", row.existingTenantId)
            .eq("status", "active");

          if (existingLeases && existingLeases.length > 0) {
            // Update existing lease
            const { error: leaseError } = await supabase
              .from("leases")
              .update({
                property_address: row.property_address!,
                unit_number: row.unit_number || null,
                rent_amount_cents: Math.round(row.rent_amount! * 100),
                due_date: row.due_date!,
              })
              .eq("id", existingLeases[0].id);

            if (leaseError) {
              failedCount++;
              continue;
            }
          } else {
            // Create new lease for existing tenant
            const { error: leaseError } = await supabase
              .from("leases")
              .insert({
                tenant_id: row.existingTenantId,
                property_address: row.property_address!,
                unit_number: row.unit_number || null,
                rent_amount_cents: Math.round(row.rent_amount! * 100),
                due_date: row.due_date!,
                status: "active",
              });

            if (leaseError) {
              failedCount++;
              continue;
            }
          }
          updatedCount++;
        } else {
          // Create new tenant
          const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .insert({
              name: row.name!,
              email: row.email!,
            })
            .select()
            .single();
          
          if (tenantError) {
            failedCount++;
            continue;
          }
          
          // Create lease
          const { error: leaseError } = await supabase
            .from("leases")
            .insert({
              tenant_id: tenant.id,
              property_address: row.property_address!,
              unit_number: row.unit_number || null,
              rent_amount_cents: Math.round(row.rent_amount! * 100),
              due_date: row.due_date!,
              status: "active",
            });
          
          if (leaseError) {
            // Rollback tenant if lease fails
            await supabase.from("tenants").delete().eq("id", tenant.id);
            failedCount++;
            continue;
          }
          
          successCount++;
        }
      } catch (error) {
        failedCount++;
      }
    }
    
    setImportResults({ success: successCount, updated: updatedCount, failed: failedCount });
    setStep("complete");
    setIsImporting(false);
    
    if (successCount > 0 || updatedCount > 0) {
      onImportComplete();
    }
  };

  const validCount = parsedData.filter((r) => r.isValid && !r.isDuplicate).length;
  const invalidCount = parsedData.filter((r) => !r.isValid).length;
  const duplicateCount = parsedData.filter((r) => r.isValid && r.isDuplicate).length;
  const overrideCount = parsedData.filter((r) => r.isDuplicate && r.forceImport).length;
  const totalToImport = validCount + overrideCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Rent Roll
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload an Excel or CSV file with tenant and lease information"}
            {step === "mapping" && "Map your file columns to the required fields"}
            {step === "preview" && "Review the data before importing"}
            {step === "importing" && "Importing tenants and leases..."}
            {step === "complete" && "Import complete"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {["upload", "mapping", "preview", "complete"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : ["upload", "mapping", "preview", "importing", "complete"].indexOf(step) > i
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && <div className="w-8 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById("rent-roll-file")?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drop your rent roll file here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <p className="text-xs text-muted-foreground">Supports .xlsx, .xls, and .csv files</p>
            <input
              id="rent-roll-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}

        {/* Mapping Step */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium">File: {file?.name}</p>
              <p className="text-muted-foreground">{rawData.length} rows found</p>
            </div>
            
            <ScrollArea className="h-[300px]">
              <div className="grid gap-4 pr-4">
                {ALL_FIELDS.map((field) => (
                  <div key={field} className="grid grid-cols-2 gap-4 items-center">
                    <Label className="flex items-center gap-2">
                      {FIELD_LABELS[field]}
                      {REQUIRED_FIELDS.includes(field) && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>
                    <Select
                      value={columnMapping[field]}
                      onValueChange={(value) =>
                        setColumnMapping((prev) => ({ ...prev, [field]: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Skip --</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={validateAndPrepareData} disabled={!canProceedToPreview()}>
                Preview Data
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="bg-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  {validCount} new
                </Badge>
                {duplicateCount > 0 && (
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""}
                  </Badge>
                )}
                {overrideCount > 0 && (
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {overrideCount} will update
                  </Badge>
                )}
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {invalidCount} invalid
                  </Badge>
                )}
              </div>
              
              {duplicateCount > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="override-all"
                    checked={overrideAll}
                    onCheckedChange={(checked) => handleOverrideAll(checked as boolean)}
                  />
                  <Label htmlFor="override-all" className="text-sm cursor-pointer">
                    Override all duplicates
                  </Label>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, index) => (
                    <TableRow 
                      key={index} 
                      className={
                        !row.isValid 
                          ? "bg-destructive/10" 
                          : row.isDuplicate && row.forceImport 
                            ? "bg-blue-500/10"
                            : row.isDuplicate 
                              ? "bg-amber-500/10" 
                              : ""
                      }
                    >
                      <TableCell>
                        {!row.isValid ? (
                          <Badge variant="destructive" className="text-xs">
                            Invalid
                          </Badge>
                        ) : row.isDuplicate && row.forceImport ? (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/30 text-xs">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Update
                          </Badge>
                        ) : row.isDuplicate ? (
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-xs">
                            Duplicate
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.name || "-"}</TableCell>
                      <TableCell>{row.email || "-"}</TableCell>
                      <TableCell>{row.property_address || "-"}</TableCell>
                      <TableCell>{row.unit_number || "-"}</TableCell>
                      <TableCell>
                        {row.rent_amount ? `$${row.rent_amount.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell>{row.due_date || "-"}</TableCell>
                      <TableCell>
                        {row.isValid && row.isDuplicate && (
                          <Button
                            variant={row.forceImport ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => toggleForceImport(index)}
                            className="text-xs h-7"
                          >
                            {row.forceImport ? "Cancel" : "Override"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={totalToImport === 0}>
                Import {totalToImport} Tenant{totalToImport !== 1 ? "s" : ""}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Importing tenants and leases...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-medium mb-2">Import Complete</p>
            <div className="flex items-center gap-2 flex-wrap justify-center mb-6">
              {importResults.success > 0 && (
                <Badge variant="default" className="bg-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  {importResults.success} new imported
                </Badge>
              )}
              {importResults.updated > 0 && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {importResults.updated} updated
                </Badge>
              )}
              {importResults.failed > 0 && (
                <Badge variant="destructive">{importResults.failed} failed</Badge>
              )}
            </div>
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
