import type { Request, Response, NextFunction } from "express";
import { checkUserPermission } from "./permissions";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      username: string;
      tipoUsuario?: string;
      clienteId?: string | null;
      isSuperAdmin?: boolean;
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
    } else if (scope === "cliente" && req.user.clienteId) {
      scopeId = req.user.clienteId;
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

export function mockAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const userId = req.header("X-User-Id") || "mock-user-id";
  const username = req.header("X-Username") || "mock-admin";
  const tipoUsuario = req.header("X-User-Type") || "maxtalent";
  const clienteId = req.header("X-Cliente-Id") || null;
  const isSuperAdmin = req.header("X-Is-Super-Admin") === "true";

  req.user = {
    id: userId,
    username,
    tipoUsuario,
    clienteId,
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
