import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { ChevronDown, Search, LayoutGrid } from "lucide-react";

export function ClienteSelector() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { selectedCliente, navigateToCliente, isAgencyView, canChangeCliente, isClientUser } = useCliente();

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes/activos"],
    enabled: canChangeCliente,
  });

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nombreComercial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cliente.razonSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cliente.rfc?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCliente = (cliente: Cliente) => {
    navigateToCliente(cliente.id);
    setOpen(false);
    setSearchQuery("");
  };

  const handleAgencyView = () => {
    // Navigate to agency dashboard (client-agnostic view)
    setLocation("/agency");
    setOpen(false);
    setSearchQuery("");
  };

  if (isClientUser && selectedCliente) {
    return (
      <div className="w-full px-2 h-8 flex items-center">
        <span className="font-medium truncate text-sm" data-testid="text-selected-cliente">
          {selectedCliente.nombreComercial}
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between px-2 h-8 hover-elevate"
          data-testid="button-cliente-selector"
        >
          <span className="font-medium truncate text-sm" data-testid="text-selected-cliente">
            {selectedCliente ? selectedCliente.nombreComercial : "Centro de Control"}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50 ml-1" />
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
            size="sm"
            className="w-full justify-start gap-2 text-primary hover-elevate"
            onClick={handleAgencyView}
            data-testid="button-control-center"
          >
            <LayoutGrid className="h-4 w-4" />
            Centro de Control
          </Button>
        </div>

        <ScrollArea className="max-h-[300px]">
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
}

function ClienteItem({ cliente, isSelected, onSelect }: ClienteItemProps) {
  return (
    <button
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover-elevate ${
        isSelected ? "bg-accent" : ""
      }`}
      onClick={() => onSelect(cliente)}
      data-testid={`button-select-cliente-${cliente.id}`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{cliente.nombreComercial}</p>
        <p className="text-xs text-muted-foreground truncate">{cliente.razonSocial}</p>
      </div>
    </button>
  );
}
