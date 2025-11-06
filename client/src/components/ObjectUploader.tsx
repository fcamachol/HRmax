import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { uploadURL: string }) => void;
  buttonClassName?: string;
  children: React.ReactNode;
  inputId?: string; // Allow custom id or auto-generate
}

/**
 * A simple file upload component that uploads files to Replit Object Storage
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  inputId,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const autoId = useId();
  const fileInputId = inputId || `file-upload-${autoId}`;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      toast({
        title: "Archivo muy grande",
        description: `El archivo debe ser menor a ${(maxFileSize / 1024 / 1024).toFixed(2)}MB`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await onGetUploadParameters();
      
      const response = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      onComplete?.({ uploadURL: url.split('?')[0] });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error al subir",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        id={fileInputId}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,application/pdf"
        disabled={isUploading}
      />
      <label htmlFor={fileInputId}>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(fileInputId)?.click();
          }}
          className={buttonClassName}
          disabled={isUploading}
          data-testid="button-upload-document"
        >
          {isUploading ? "Subiendo..." : children}
        </Button>
      </label>
    </div>
  );
}
