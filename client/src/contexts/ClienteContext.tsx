import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import type { Cliente } from "@shared/schema";
import { useAuth } from "./AuthContext";

interface ClienteContextType {
  selectedCliente: Cliente | null;
  clienteId: string | null;
  isLoading: boolean;
  recentClientes: Cliente[];
  addToRecent: (cliente: Cliente) => void;
  isAgencyView: boolean;
  isClientUser: boolean;
  canChangeCliente: boolean;
  navigateToCliente: (clienteId: string) => void;
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

const LAST_CLIENTE_KEY = "peopleops_last_cliente_id";
const RECENT_KEY = "peopleops_recent_clientes";
const MAX_RECENT = 5;

export function ClienteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [recentClientes, setRecentClientes] = useState<Cliente[]>([]);

  // Extract clienteId from URL (first segment after /)
  // Skip if it's a reserved route like "agency", "portal", "super-admin", etc.
  const firstSegment = location.split("/")[1] || null;
  const reservedRoutes = ["agency", "portal", "super-admin", "login", "onboarding"];
  const isAgencyView = firstSegment === "agency";
  const clienteIdFromUrl = firstSegment && !reservedRoutes.includes(firstSegment) ? firstSegment : null;

  const isClientUser = user?.tipoUsuario === "cliente" && !!user?.clienteId;
  const canChangeCliente = !isClientUser;

  // Fetch cliente data based on URL clienteId
  const { data: selectedCliente, isLoading } = useQuery<Cliente>({
    queryKey: ["/api/clientes", clienteIdFromUrl],
    queryFn: async () => {
      if (!clienteIdFromUrl) throw new Error("No clienteId");
      const res = await fetch(`/api/clientes/${clienteIdFromUrl}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cliente");
      return res.json();
    },
    enabled: !!clienteIdFromUrl,
  });

  const addToRecent = useCallback((cliente: Cliente) => {
    setRecentClientes((prev) => {
      const filtered = prev.filter((c) => c.id !== cliente.id);
      const updated = [cliente, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Save last used cliente for MaxTalent users
  useEffect(() => {
    if (selectedCliente && !isClientUser) {
      localStorage.setItem(LAST_CLIENTE_KEY, selectedCliente.id);
      addToRecent(selectedCliente);
    }
  }, [selectedCliente, isClientUser, addToRecent]);

  // Load recent clientes from localStorage
  useEffect(() => {
    const savedRecent = localStorage.getItem(RECENT_KEY);
    if (savedRecent) {
      try {
        setRecentClientes(JSON.parse(savedRecent));
      } catch {
        localStorage.removeItem(RECENT_KEY);
      }
    }
  }, []);

  // Navigate to a different cliente (for MaxTalent users)
  const navigateToCliente = useCallback((newClienteId: string) => {
    if (isClientUser) return; // Client users can't switch

    // Replace the clienteId in the current path
    const pathParts = location.split("/");
    pathParts[1] = newClienteId;
    setLocation(pathParts.join("/") || `/${newClienteId}`);
  }, [isClientUser, location, setLocation]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    selectedCliente: selectedCliente || null,
    clienteId: clienteIdFromUrl,
    isLoading,
    recentClientes,
    addToRecent,
    isAgencyView,
    isClientUser,
    canChangeCliente,
    navigateToCliente,
  }), [
    selectedCliente,
    clienteIdFromUrl,
    isLoading,
    recentClientes,
    addToRecent,
    isAgencyView,
    isClientUser,
    canChangeCliente,
    navigateToCliente,
  ]);

  return (
    <ClienteContext.Provider value={contextValue}>
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
