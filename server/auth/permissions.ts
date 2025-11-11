import { db } from "../db";
import { usuariosPermisos, modulos, empresas, centrosTrabajo } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface PermissionCheck {
  userId: string;
  moduleCode: string;
  scope?: "cliente" | "empresa" | "centro_trabajo";
  scopeId?: string;
}

export interface PermissionResult {
  hasPermission: boolean;
  permissionLevel?: "cliente" | "empresa" | "centro_trabajo";
  scopeId?: string;
  message?: string;
}

export async function checkUserPermission(
  check: PermissionCheck
): Promise<PermissionResult> {
  const { userId, moduleCode, scope, scopeId } = check;

  const [module] = await db
    .select()
    .from(modulos)
    .where(and(eq(modulos.codigo, moduleCode), eq(modulos.activo, true)));

  if (!module) {
    return {
      hasPermission: false,
      message: `Módulo '${moduleCode}' no existe o está inactivo`,
    };
  }

  if (!scope || !scopeId) {
    return await checkModulePermission(userId, module.id);
  }

  if (scope === "cliente") {
    return await checkClientePermission(userId, module.id, scopeId);
  } else if (scope === "empresa") {
    return await checkEmpresaPermission(userId, module.id, scopeId);
  } else if (scope === "centro_trabajo") {
    return await checkCentroTrabajoPermission(userId, module.id, scopeId);
  }

  return {
    hasPermission: false,
    message: "Scope inválido",
  };
}

async function checkModulePermission(
  userId: string,
  moduleId: string
): Promise<PermissionResult> {
  const [permission] = await db
    .select()
    .from(usuariosPermisos)
    .where(
      and(
        eq(usuariosPermisos.usuarioId, userId),
        eq(usuariosPermisos.moduloId, moduleId),
        eq(usuariosPermisos.scopeTipo, "modulo")
      )
    );

  if (permission) {
    return {
      hasPermission: true,
      permissionLevel: undefined,
      scopeId: undefined,
      message: "Permiso a nivel módulo (acceso global)",
    };
  }

  return {
    hasPermission: false,
    message: "Usuario no tiene permiso a nivel módulo",
  };
}

async function checkClientePermission(
  userId: string,
  moduleId: string,
  clienteId: string
): Promise<PermissionResult> {
  const [permission] = await db
    .select()
    .from(usuariosPermisos)
    .where(
      and(
        eq(usuariosPermisos.usuarioId, userId),
        eq(usuariosPermisos.moduloId, moduleId),
        eq(usuariosPermisos.scopeTipo, "cliente"),
        eq(usuariosPermisos.clienteId, clienteId)
      )
    );

  if (permission) {
    return {
      hasPermission: true,
      permissionLevel: "cliente",
      scopeId: clienteId,
    };
  }

  const moduleResult = await checkModulePermission(userId, moduleId);
  if (moduleResult.hasPermission) {
    return moduleResult;
  }

  return {
    hasPermission: false,
    message: "Usuario no tiene permiso a nivel cliente ni módulo",
  };
}

async function checkEmpresaPermission(
  userId: string,
  moduleId: string,
  empresaId: string
): Promise<PermissionResult> {
  const [empresa] = await db
    .select()
    .from(empresas)
    .where(eq(empresas.id, empresaId));

  if (!empresa) {
    return {
      hasPermission: false,
      message: "Empresa no encontrada",
    };
  }

  const [empresaPermission] = await db
    .select()
    .from(usuariosPermisos)
    .where(
      and(
        eq(usuariosPermisos.usuarioId, userId),
        eq(usuariosPermisos.moduloId, moduleId),
        eq(usuariosPermisos.scopeTipo, "empresa"),
        eq(usuariosPermisos.empresaId, empresaId)
      )
    );

  if (empresaPermission) {
    return {
      hasPermission: true,
      permissionLevel: "empresa",
      scopeId: empresaId,
    };
  }

  if (empresa.clienteId) {
    const clienteResult = await checkClientePermission(
      userId,
      moduleId,
      empresa.clienteId
    );
    if (clienteResult.hasPermission) {
      return {
        hasPermission: true,
        permissionLevel: "cliente",
        scopeId: empresa.clienteId,
        message: "Permiso heredado de nivel cliente",
      };
    }
  }

  const moduleResult = await checkModulePermission(userId, moduleId);
  if (moduleResult.hasPermission) {
    return moduleResult;
  }

  return {
    hasPermission: false,
    message: "Usuario no tiene permiso a nivel empresa, cliente ni módulo",
  };
}

async function checkCentroTrabajoPermission(
  userId: string,
  moduleId: string,
  centroTrabajoId: string
): Promise<PermissionResult> {
  const [centro] = await db
    .select()
    .from(centrosTrabajo)
    .where(eq(centrosTrabajo.id, centroTrabajoId));

  if (!centro) {
    return {
      hasPermission: false,
      message: "Centro de trabajo no encontrado",
    };
  }

  const [centroPermission] = await db
    .select()
    .from(usuariosPermisos)
    .where(
      and(
        eq(usuariosPermisos.usuarioId, userId),
        eq(usuariosPermisos.moduloId, moduleId),
        eq(usuariosPermisos.scopeTipo, "centro_trabajo"),
        eq(usuariosPermisos.centroTrabajoId, centroTrabajoId)
      )
    );

  if (centroPermission) {
    return {
      hasPermission: true,
      permissionLevel: "centro_trabajo",
      scopeId: centroTrabajoId,
    };
  }

  const empresaResult = await checkEmpresaPermission(
    userId,
    moduleId,
    centro.empresaId
  );
  if (empresaResult.hasPermission) {
    return {
      hasPermission: true,
      permissionLevel: empresaResult.permissionLevel,
      scopeId: empresaResult.scopeId,
      message: `Permiso heredado de nivel ${empresaResult.permissionLevel}`,
    };
  }

  const moduleResult = await checkModulePermission(userId, moduleId);
  if (moduleResult.hasPermission) {
    return moduleResult;
  }

  return {
    hasPermission: false,
    message:
      "Usuario no tiene permiso a nivel centro de trabajo, empresa, cliente ni módulo",
  };
}

export async function getUserPermissions(userId: string) {
  const permissions = await db
    .select({
      id: usuariosPermisos.id,
      moduleCode: modulos.codigo,
      moduleName: modulos.nombre,
      moduleIcon: modulos.icono,
      scopeTipo: usuariosPermisos.scopeTipo,
      clienteId: usuariosPermisos.clienteId,
      empresaId: usuariosPermisos.empresaId,
      centroTrabajoId: usuariosPermisos.centroTrabajoId,
    })
    .from(usuariosPermisos)
    .leftJoin(modulos, eq(usuariosPermisos.moduloId, modulos.id))
    .where(eq(usuariosPermisos.usuarioId, userId));

  return permissions;
}

export async function getAllUserModules(userId: string): Promise<string[]> {
  const permissions = await db
    .select({
      codigo: modulos.codigo,
    })
    .from(usuariosPermisos)
    .leftJoin(modulos, eq(usuariosPermisos.moduloId, modulos.id))
    .where(eq(usuariosPermisos.usuarioId, userId));

  const uniqueCodes = Array.from(
    new Set(permissions.map((p) => p.codigo).filter(Boolean) as string[])
  );
  return uniqueCodes;
}
