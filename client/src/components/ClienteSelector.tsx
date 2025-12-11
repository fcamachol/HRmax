import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCliente } from "@/contexts/ClienteContext";
import type { Cliente } from "@shared/schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, Search, RefreshCw, Pin, Building2 } from "lucide-react";

export function ClienteSelector() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedCliente, setSelectedCliente, recentClientes, isAgencyView, setIsAgencyView } = useCliente();

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes/activos"],
  });

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nombreComercial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cliente.razonSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cliente.rfc?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsAgencyView(false);
    setOpen(false);
    setSearchQuery("");
  };

  const handleAgencyView = () => {
    setSelectedCliente(null);
    setIsAgencyView(true);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto hover-elevate"
          data-testid="button-cliente-selector"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {selectedCliente ? getInitials(selectedCliente.nombreComercial) : <Building2 className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="text-left min-w-0">
              <p className="font-medium truncate text-sm" data-testid="text-selected-cliente">
                {selectedCliente ? selectedCliente.nombreComercial : "Vista Agencia"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedCliente?.rfc || "Todos los clientes"}
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-cliente"
            />
          </div>
        </div>

        <div className="p-2 border-b">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-primary hover-elevate"
            onClick={handleAgencyView}
            data-testid="button-agency-view"
          >
            <RefreshCw className="h-4 w-4" />
            Cambiar a Vista Agencia
          </Button>
        </div>

        <ScrollArea className="max-h-[300px]">
          {recentClientes.length > 0 && !searchQuery && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recientes
              </p>
              {recentClientes.map((cliente) => (
                <ClienteItem
                  key={`recent-${cliente.id}`}
                  cliente={cliente}
                  isSelected={selectedCliente?.id === cliente.id}
                  onSelect={handleSelectCliente}
                  getInitials={getInitials}
                />
              ))}
            </div>
          )}

          <div className="p-2">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {searchQuery ? "Resultados" : "Todos los Clientes"}
            </p>
            {isLoading ? (
              <p className="px-2 py-4 text-sm text-muted-foreground text-center">
                Cargando...
              </p>
            ) : filteredClientes.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground text-center">
                No se encontraron clientes
              </p>
            ) : (
              filteredClientes.map((cliente) => (
                <ClienteItem
                  key={cliente.id}
                  cliente={cliente}
                  isSelected={selectedCliente?.id === cliente.id}
                  onSelect={handleSelectCliente}
                  getInitials={getInitials}
                  showPin
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface ClienteItemProps {
  cliente: Cliente;
  isSelected: boolean;
  onSelect: (cliente: Cliente) => void;
  getInitials: (name: string) => string;
  showPin?: boolean;
}

function ClienteItem({ cliente, isSelected, onSelect, getInitials, showPin }: ClienteItemProps) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left hover-elevate ${
        isSelected ? "bg-accent" : ""
      }`}
      onClick={() => onSelect(cliente)}
      data-testid={`button-select-cliente-${cliente.id}`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          {getInitials(cliente.nombreComercial)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{cliente.nombreComercial}</p>
        <p className="text-xs text-muted-foreground truncate">{cliente.razonSocial}</p>
      </div>
      {showPin && (
        <Pin className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      )}
    </button>
  );
}
