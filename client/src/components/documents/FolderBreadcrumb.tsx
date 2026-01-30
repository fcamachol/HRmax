import { cn } from "@/lib/utils";
import { ChevronRight, Home, Search } from "lucide-react";
import type { CarpetaEmpleado } from "./EmployeeDocumentManager";

interface FolderBreadcrumbProps {
  path: CarpetaEmpleado[];
  onNavigate: (folderId: string | null) => void;
  isSearching?: boolean;
  searchQuery?: string;
}

export function FolderBreadcrumb({
  path,
  onNavigate,
  isSearching,
  searchQuery,
}: FolderBreadcrumbProps) {
  if (isSearching && searchQuery) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Resultados de busqueda para:</span>
        <span className="font-medium">"{searchQuery}"</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      {/* Root / Home */}
      <button
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors",
          path.length === 0 ? "font-medium text-foreground" : "text-muted-foreground"
        )}
        onClick={() => onNavigate(null)}
      >
        <Home className="h-4 w-4" />
        <span>Documentos</span>
      </button>

      {/* Path segments */}
      {path.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <button
            className={cn(
              "px-2 py-1 rounded hover:bg-muted transition-colors",
              index === path.length - 1
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
            onClick={() => onNavigate(folder.id)}
          >
            {folder.nombre}
          </button>
        </div>
      ))}
    </nav>
  );
}
