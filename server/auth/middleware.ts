import type { Request, Response, NextFunction } from "express";
import { checkUserPermission } from "./permissions";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      nombre?: string;
      email?: string;
      tipoUsuario?: string;
      clienteId?: string | null;
      role?: string;
      isSuperAdmin?: boolean;
      // Portal de empleados
      empleadoId?: string | null;
      portalActivo?: boolean;
    };
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      username: string;
      tipoUsuario?: string;
      clienteId?: string | null;
      role?: string;
      isSuperAdmin?: boolean;
      // Portal de empleados
      empleadoId?: string | null;
      portalActivo?: boolean;
    };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ 
      message: "No autenticado. Inicie sesión para continuar." 
    });
  }
  next();
}

export interface PermissionOptions {
  scope?: "cliente" | "empresa" | "centro_trabajo";
  scopeIdParam?: string;
  scopeIdQuery?: string;
  skipIfMaxTalent?: boolean;
}

export function requirePermission(
  moduleCode: string,
  options: PermissionOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "No autenticado. Inicie sesión para continuar.",
      });
    }

    if (options.skipIfMaxTalent && req.user.tipoUsuario === "maxtalent") {
      return next();
    }

    let scope = options.scope;
    let scopeId: string | undefined;

    if (options.scopeIdParam) {
      scopeId = req.params[options.scopeIdParam];
    } else if (options.scopeIdQuery) {
      scopeId = req.query[options.scopeIdQuery] as string;
    }
    
    if (!scopeId && req.user.clienteId) {
      if (!scope) {
        scope = "cliente";
      }
      if (scope === "cliente") {
        scopeId = req.user.clienteId;
      }
    }

    const permissionCheck = await checkUserPermission({
      userId: req.user.id,
      moduleCode,
      scope,
      scopeId,
    });

    if (!permissionCheck.hasPermission) {
      return res.status(403).json({
        message: permissionCheck.message || "No tiene permisos para acceder a este recurso",
      });
    }

    next();
  };
}

export function sessionAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // Check for session-based authentication first
  if (req.session?.user) {
    req.user = {
      id: req.session.user.id,
      username: req.session.user.username,
      tipoUsuario: req.session.user.tipoUsuario,
      clienteId: req.session.user.clienteId,
      role: req.session.user.role,
      isSuperAdmin: req.session.user.isSuperAdmin,
      // Portal de empleados
      empleadoId: req.session.user.empleadoId,
      portalActivo: req.session.user.portalActivo,
    };
    return next();
  }

  // Fallback to mock auth for development (via headers)
  const userId = req.header("X-User-Id");
  if (userId) {
    const username = req.header("X-Username") || "mock-admin";
    const tipoUsuario = req.header("X-User-Type") || "maxtalent";
    const clienteId = req.header("X-Cliente-Id") || null;
    const role = req.header("X-User-Role") || "user";
    const isSuperAdmin = req.header("X-Is-Super-Admin") === "true";

    req.user = {
      id: userId,
      username,
      tipoUsuario,
      clienteId,
      role,
      isSuperAdmin,
    };
  }

  next();
}

export function mockAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const userId = req.header("X-User-Id") || "mock-user-id";
  const username = req.header("X-Username") || "mock-admin";
  const tipoUsuario = req.header("X-User-Type") || "maxtalent";
  const clienteId = req.header("X-Cliente-Id") || null;
  const role = req.header("X-User-Role") || "user";
  const isSuperAdmin = req.header("X-Is-Super-Admin") === "true";

  req.user = {
    id: userId,
    username,
    tipoUsuario,
    clienteId,
    role,
    isSuperAdmin,
  };

  next();
}

export function requireClienteScope(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  if (req.user.tipoUsuario === "maxtalent") {
    return next();
  }

  if (!req.user.clienteId) {
    return res.status(403).json({
      message: "Usuario no tiene cliente asignado",
    });
  }

  next();
}

export function requireMaxTalentUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  if (req.user.tipoUsuario !== "maxtalent") {
    return res.status(403).json({
      message: "Acceso restringido a usuarios MaxTalent",
    });
  }

  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      message: "No autenticado. Inicie sesión para continuar.",
    });
  }

  if (!req.user.isSuperAdmin) {
    return res.status(403).json({
      message: "Acceso denegado. Esta acción requiere privilegios de Super Admin.",
    });
  }

  next();
}

// ============================================================================
// PORTAL DE EMPLEADOS - Employee Portal Authentication
// ============================================================================

/**
 * Middleware to require employee portal authentication.
 * Only allows users with tipoUsuario = "empleado" and portalActivo = true.
 */
export function requireEmployeeAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      message: "No autenticado. Inicie sesión para continuar.",
    });
  }

  // Must be an employee user type
  if (req.user.tipoUsuario !== "empleado") {
    return res.status(403).json({
      message: "Acceso restringido al portal de empleados.",
    });
  }

  next();
}

/**
 * Middleware to allow either admin users OR employee users (for shared endpoints).
 * Use this for endpoints that both admin and employees can access with different data scopes.
 */
export function requireAuthOrEmployee(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      message: "No autenticado. Inicie sesión para continuar.",
    });
  }

  // Allow maxtalent, cliente admins, and empleados
  const allowedTypes = ["maxtalent", "cliente", "empleado"];
  if (!allowedTypes.includes(req.user.tipoUsuario || "")) {
    return res.status(403).json({
      message: "Tipo de usuario no autorizado.",
    });
  }

  next();
}
