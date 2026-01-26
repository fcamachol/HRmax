import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Employee } from "@shared/schema";

type PortalEmployee = Omit<Employee, "createdAt" | "updatedAt" | "portalPassword">;

interface LoginResult {
  success: boolean;
  requiresPasswordSetup?: boolean;
  employeeId?: string;
  employeeName?: string;
  employee?: PortalEmployee;
}

interface ClientInfo {
  clienteId: string;
  nombreComercial: string;
}

interface PortalAuthContextType {
  employee: PortalEmployee | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  clienteId: string;
  clientInfo: ClientInfo | null;
  clientError: string | null;
  login: (rfc: string, password?: string) => Promise<LoginResult>;
  setupPassword: (rfc: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

interface PortalAuthProviderProps {
  children: ReactNode;
  clienteId: string;
}

export function PortalAuthProvider({ children, clienteId }: PortalAuthProviderProps) {
  const [employee, setEmployee] = useState<PortalEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  // Fetch client info on mount
  useEffect(() => {
    async function fetchClientInfo() {
      try {
        const response = await fetch(`/api/portal/${clienteId}/info`);
        if (response.ok) {
          const data = await response.json();
          setClientInfo(data);
          setClientError(null);
        } else {
          const data = await response.json();
          setClientError(data.message || "Portal no encontrado");
          setClientInfo(null);
        }
      } catch {
        setClientError("Error al cargar información del portal");
        setClientInfo(null);
      }
    }
    fetchClientInfo();
  }, [clienteId]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/portal/${clienteId}/auth/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setEmployee(data.employee || null);
      } else {
        setEmployee(null);
      }
    } catch {
      setEmployee(null);
    } finally {
      setIsLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (rfc: string, password?: string): Promise<LoginResult> => {
    const response = await fetch(`/api/portal/${clienteId}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ rfc, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al iniciar sesión");
    }

    // Check if password setup is required (first login)
    if (data.requiresPasswordSetup) {
      return {
        success: false,
        requiresPasswordSetup: true,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
      };
    }

    setEmployee(data.employee || null);
    return { success: true, employee: data.employee };
  }, [clienteId]);

  const setupPassword = useCallback(async (rfc: string, password: string) => {
    const response = await fetch(`/api/portal/${clienteId}/auth/setup-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ rfc, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al configurar contraseña");
    }
  }, [clienteId]);

  const logout = useCallback(async () => {
    try {
      await fetch(`/api/portal/${clienteId}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setEmployee(null);
    }
  }, [clienteId]);

  return (
    <PortalAuthContext.Provider
      value={{
        employee,
        isLoading,
        isAuthenticated: !!employee,
        clienteId,
        clientInfo,
        clientError,
        login,
        setupPassword,
        logout,
        refreshUser,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);
  if (context === undefined) {
    throw new Error("usePortalAuth must be used within a PortalAuthProvider");
  }
  return context;
}
