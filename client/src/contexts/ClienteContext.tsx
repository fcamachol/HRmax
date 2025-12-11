import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Cliente } from "@shared/schema";

interface ClienteContextType {
  selectedCliente: Cliente | null;
  setSelectedCliente: (cliente: Cliente | null) => void;
  recentClientes: Cliente[];
  addToRecent: (cliente: Cliente) => void;
  isAgencyView: boolean;
  setIsAgencyView: (value: boolean) => void;
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

const STORAGE_KEY = "peopleops_selected_cliente";
const RECENT_KEY = "peopleops_recent_clientes";
const MAX_RECENT = 5;

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [selectedCliente, setSelectedClienteState] = useState<Cliente | null>(null);
  const [recentClientes, setRecentClientes] = useState<Cliente[]>([]);
  const [isAgencyView, setIsAgencyView] = useState(false);

  useEffect(() => {
    const savedCliente = localStorage.getItem(STORAGE_KEY);
    if (savedCliente) {
      try {
        setSelectedClienteState(JSON.parse(savedCliente));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const savedRecent = localStorage.getItem(RECENT_KEY);
    if (savedRecent) {
      try {
        setRecentClientes(JSON.parse(savedRecent));
      } catch {
        localStorage.removeItem(RECENT_KEY);
      }
    }
  }, []);

  const setSelectedCliente = (cliente: Cliente | null) => {
    setSelectedClienteState(cliente);
    if (cliente) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cliente));
      addToRecent(cliente);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const addToRecent = (cliente: Cliente) => {
    setRecentClientes((prev) => {
      const filtered = prev.filter((c) => c.id !== cliente.id);
      const updated = [cliente, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ClienteContext.Provider
      value={{
        selectedCliente,
        setSelectedCliente,
        recentClientes,
        addToRecent,
        isAgencyView,
        setIsAgencyView,
      }}
    >
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const context = useContext(ClienteContext);
  if (context === undefined) {
    throw new Error("useCliente must be used within a ClienteProvider");
  }
  return context;
}
