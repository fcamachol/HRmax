import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Trash2, FolderInput, ChevronDown, Folder } from "lucide-react";
import type { CarpetaEmpleado } from "./EmployeeDocumentManager";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  folders: CarpetaEmpleado[];
  onMoveToFolder: (folderId: string | null) => void;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
  folders,
  onMoveToFolder,
}: BulkActionBarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-primary/5 border-b">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
        />
        <span className="text-sm font-medium">
          {selectedCount} documento{selectedCount !== 1 ? "s" : ""} seleccionado{selectedCount !== 1 ? "s" : ""}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* Move to folder dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderInput className="h-4 w-4 mr-2" />
              Mover a
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onMoveToFolder(null)}>
              <Folder className="h-4 w-4 mr-2" />
              Raiz (sin carpeta)
            </DropdownMenuItem>
            {folders.length > 0 && <DropdownMenuSeparator />}
            {folders.map((folder) => (
              <DropdownMenuItem
                key={folder.id}
                onClick={() => onMoveToFolder(folder.id)}
              >
                <Folder className="h-4 w-4 mr-2" />
                {folder.nombre}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete button */}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
      </div>
    </div>
  );
}
