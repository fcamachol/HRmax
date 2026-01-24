import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User, Employee } from "@shared/schema";

type PortalUser = Omit<User, "password"> & {
  employee?: Omit<Employee, "createdAt" | "updatedAt"> | null;
};

interface PortalAuthContextType {
  user: PortalUser | null;
  employee: Omit<Employee, "createdAt" | "updatedAt"> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [employee, setEmployee] = useState<Omit<Employee, "createdAt" | "updatedAt"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/portal/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEmployee(data.employee || null);
      } else {
        setUser(null);
        setEmployee(null);
      }
    } catch {
      setUser(null);
      setEmployee(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await fetch("/api/portal/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al iniciar sesión");
    }

    setUser(data.user);
    setEmployee(data.employee || null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/portal/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setEmployee(null);
    }
  }, []);

  return (
    <PortalAuthContext.Provider
      value={{
        user,
        employee,
        isLoading,
        isAuthenticated: !!user && user.tipoUsuario === "empleado",
        login,
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
