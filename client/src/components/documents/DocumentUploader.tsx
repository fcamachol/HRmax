import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, Loader2, Image, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empleadoId: string;
  carpetaId: string | null;
  carpetaNombre?: string;
  onUploadComplete: () => void;
}

const categorias = [
  { value: "contrato", label: "Contrato" },
  { value: "identificacion", label: "Identificacion" },
  { value: "comprobante_domicilio", label: "Comprobante de domicilio" },
  { value: "recibo_nomina", label: "Recibo de nomina" },
  { value: "constancia", label: "Constancia" },
  { value: "evaluacion", label: "Evaluacion" },
  { value: "capacitacion", label: "Capacitacion" },
  { value: "acta_administrativa", label: "Acta administrativa" },
  { value: "otro", label: "Otro" },
];

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) {
    return <Image className="h-8 w-8 text-green-500" />;
  }
  if (file.type === "application/pdf") {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  return <File className="h-8 w-8 text-muted-foreground" />;
}

export function DocumentUploader({
  open,
  onOpenChange,
  empleadoId,
  carpetaId,
  carpetaNombre,
  onUploadComplete,
}: DocumentUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const [categoria, setCategoria] = useState("otro");
  const [visibleParaEmpleado, setVisibleParaEmpleado] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetForm = () => {
    setSelectedFile(null);
    setDocumentName("");
    setDescription("");
    setCategoria("otro");
    setVisibleParaEmpleado(true);
    setUploadProgress(0);
  };

  const handleFileSelect = (file: File) => {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    // Use filename without extension as default document name
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setDocumentName(nameWithoutExt);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim()) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Step 1: Get upload URL
      const urlRes = await fetch(`/api/employees/${empleadoId}/documentos/upload-url`, {
        credentials: "include",
      });

      if (!urlRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL } = await urlRes.json();
      setUploadProgress(30);

      // Step 2: Upload file to signed URL
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      setUploadProgress(70);

      // Step 3: Create document record
      const docRes = await fetch(`/api/employees/${empleadoId}/documentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nombre: documentName.trim(),
          descripcion: description.trim() || null,
          categoria,
          archivoUrl: uploadURL.split("?")[0], // Remove query params
          archivoNombre: selectedFile.name,
          archivoTipo: selectedFile.type,
          archivoTamano: selectedFile.size,
          visibleParaEmpleado,
          carpetaId,
        }),
      });

      if (!docRes.ok) {
        const error = await docRes.json();
        throw new Error(error.message || "Failed to create document record");
      }

      setUploadProgress(100);

      // Success
      resetForm();
      onUploadComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Error al subir",
        description: error.message || "No se pudo subir el documento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isUploading) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
          {carpetaNombre && (
            <p className="text-sm text-muted-foreground">
              Se guardara en: {carpetaNombre}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File drop zone */}
          {!selectedFile ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Arrastra un archivo aqui o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, imagenes o documentos (max 10MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {getFileIcon(selectedFile)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Document name */}
          <div className="space-y-2">
            <Label htmlFor="doc-name">Nombre del documento *</Label>
            <Input
              id="doc-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Ej: Contrato laboral 2024"
              disabled={isUploading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="doc-desc">Descripcion (opcional)</Label>
            <Textarea
              id="doc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripcion o notas adicionales..."
              rows={2}
              disabled={isUploading}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Visible para el empleado</Label>
              <p className="text-xs text-muted-foreground">
                El empleado podra ver este documento en su portal
              </p>
            </div>
            <Switch
              checked={visibleParaEmpleado}
              onCheckedChange={setVisibleParaEmpleado}
              disabled={isUploading}
            />
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Subiendo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !documentName.trim() || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir documento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
