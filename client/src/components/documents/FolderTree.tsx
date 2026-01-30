import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
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
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Briefcase,
  User,
  FileText,
  Receipt,
  GraduationCap,
  ClipboardCheck,
  AlertTriangle,
  Trash2,
  MoveRight,
  Eye,
  EyeOff,
} from "lucide-react";
import type { CarpetaEmpleado } from "./EmployeeDocumentManager";

interface FolderTreeProps {
  folders: CarpetaEmpleado[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderDelete?: (folderId: string) => void;
  onMoveDocuments?: (targetFolderId: string | null) => void;
  hasSelectedDocuments?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  user: User,
  "file-text": FileText,
  receipt: Receipt,
  "graduation-cap": GraduationCap,
  "clipboard-check": ClipboardCheck,
  "alert-triangle": AlertTriangle,
};

function FolderIcon({
  icono,
  isOpen,
  className,
}: {
  icono: string | null;
  isOpen: boolean;
  className?: string;
}) {
  if (icono && iconMap[icono]) {
    const Icon = iconMap[icono];
    return <Icon className={className} />;
  }
  return isOpen ? (
    <FolderOpen className={className} />
  ) : (
    <Folder className={className} />
  );
}

interface FolderItemProps {
  folder: CarpetaEmpleado;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  childFolders: CarpetaEmpleado[];
  allFolders: CarpetaEmpleado[];
  onSelect: () => void;
  onToggleExpand: () => void;
  onDelete?: () => void;
  onMoveDocuments?: () => void;
  hasSelectedDocuments?: boolean;
}

function FolderItem({
  folder,
  level,
  isSelected,
  isExpanded,
  childFolders,
  allFolders,
  onSelect,
  onToggleExpand,
  onDelete,
  onMoveDocuments,
  hasSelectedDocuments,
}: FolderItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const hasChildren = childFolders.length > 0;

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group transition-colors",
              isSelected
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={onSelect}
          >
            {hasChildren ? (
              <button
                className="p-0.5 hover:bg-muted-foreground/20 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              </button>
            ) : (
              <span className="w-4.5" />
            )}
            <FolderIcon
              icono={folder.icono}
              isOpen={isSelected || isExpanded}
              className={cn(
                "h-4 w-4",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="flex-1 truncate text-sm font-medium">{folder.nombre}</span>
            {!folder.visibleParaEmpleado && (
              <span title="No visible para empleado">
                <EyeOff className="h-3 w-3 opacity-50" />
              </span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {hasSelectedDocuments && onMoveDocuments && (
            <>
              <ContextMenuItem onClick={onMoveDocuments}>
                <MoveRight className="h-4 w-4 mr-2" />
                Mover documentos aqui
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem disabled>
            {folder.visibleParaEmpleado ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Visible en portal
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Solo HR
              </>
            )}
          </ContextMenuItem>
          {folder.tipo === "custom" && onDelete && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar carpeta
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded &&
        childFolders.map((child) => (
          <FolderItemRecursive
            key={child.id}
            folder={child}
            level={level + 1}
            allFolders={allFolders}
            currentFolderId={isSelected ? folder.id : null}
            onFolderSelect={onSelect}
            onDelete={onDelete}
            onMoveDocuments={onMoveDocuments}
            hasSelectedDocuments={hasSelectedDocuments}
          />
        ))}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar carpeta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara la carpeta "{folder.nombre}" y todos los documentos dentro de
              ella se moveran a la raiz. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete?.();
                setShowDeleteDialog(false);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function FolderItemRecursive({
  folder,
  level,
  allFolders,
  currentFolderId,
  onFolderSelect,
  onDelete,
  onMoveDocuments,
  hasSelectedDocuments,
}: {
  folder: CarpetaEmpleado;
  level: number;
  allFolders: CarpetaEmpleado[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onDelete?: (folderId: string) => void;
  onMoveDocuments?: (targetFolderId: string | null) => void;
  hasSelectedDocuments?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = currentFolderId === folder.id;
  const childFolders = allFolders.filter((f) => f.parentId === folder.id);

  return (
    <FolderItem
      folder={folder}
      level={level}
      isSelected={isSelected}
      isExpanded={isExpanded}
      childFolders={childFolders}
      allFolders={allFolders}
      onSelect={() => onFolderSelect(folder.id)}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
      onDelete={onDelete ? () => onDelete(folder.id) : undefined}
      onMoveDocuments={onMoveDocuments ? () => onMoveDocuments(folder.id) : undefined}
      hasSelectedDocuments={hasSelectedDocuments}
    />
  );
}

export function FolderTree({
  folders,
  currentFolderId,
  onFolderSelect,
  onFolderDelete,
  onMoveDocuments,
  hasSelectedDocuments,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const rootFolders = folders.filter((f) => !f.parentId).sort((a, b) => a.orden - b.orden);

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  return (
    <div className="py-2">
      {/* Root folder */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors mx-2",
              currentFolderId === null
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onFolderSelect(null)}
          >
            <Folder className="h-4 w-4" />
            <span className="text-sm font-medium">Todos los documentos</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {hasSelectedDocuments && onMoveDocuments && (
            <ContextMenuItem onClick={() => onMoveDocuments(null)}>
              <MoveRight className="h-4 w-4 mr-2" />
              Mover a raiz
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <div className="px-2 py-1">
        <div className="h-px bg-border" />
      </div>

      {/* Folder tree */}
      <div className="px-2">
        {rootFolders.map((folder) => {
          const childFolders = folders.filter((f) => f.parentId === folder.id);
          const isExpanded = expandedFolders.has(folder.id);

          return (
            <FolderItem
              key={folder.id}
              folder={folder}
              level={0}
              isSelected={currentFolderId === folder.id}
              isExpanded={isExpanded}
              childFolders={childFolders}
              allFolders={folders}
              onSelect={() => onFolderSelect(folder.id)}
              onToggleExpand={() => toggleExpand(folder.id)}
              onDelete={onFolderDelete ? () => onFolderDelete(folder.id) : undefined}
              onMoveDocuments={onMoveDocuments ? () => onMoveDocuments(folder.id) : undefined}
              hasSelectedDocuments={hasSelectedDocuments}
            />
          );
        })}
      </div>
    </div>
  );
}
