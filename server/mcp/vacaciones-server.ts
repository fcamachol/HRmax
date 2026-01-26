#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const HRMAX_API_URL = process.env.HRMAX_API_URL || "http://localhost:5000";
const HRMAX_API_KEY = process.env.HRMAX_API_KEY;

if (!HRMAX_API_KEY) {
  console.error("Error: HRMAX_API_KEY environment variable is required");
  process.exit(1);
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${HRMAX_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": HRMAX_API_KEY!,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API request failed: ${response.status}`);
  }

  return response.json();
}

const server = new McpServer({
  name: "hrmax-vacaciones",
  version: "1.0.0",
});

// Tool: Check vacation balance for an employee
server.tool(
  "check_vacation_balance",
  "Check remaining vacation days for an employee. Returns available days, used days, and pending days.",
  {
    empleadoId: z.string().describe("Employee UUID"),
    year: z.number().optional().describe("Year to check (defaults to current year)"),
  },
  async ({ empleadoId, year }) => {
    try {
      const yearParam = year ? `?year=${year}` : "";
      const balance = await apiRequest(`/api/vacaciones/balance/${empleadoId}${yearParam}`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              empleadoId,
              year: year || new Date().getFullYear(),
              disponibles: balance.disponibles,
              usados: balance.usados,
              pendientes: balance.pendientes,
              diasLegales: balance.diasLegales,
              empleadoNombre: balance.empleadoNombre,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error checking vacation balance: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: List pending vacation approvals
server.tool(
  "list_pending_approvals",
  "List all vacation requests pending approval. Returns a list of pending solicitudes with employee details.",
  {},
  async () => {
    try {
      const pending = await apiRequest("/api/vacaciones/pending-approvals");

      const formatted = pending.map((s: any) => ({
        id: s.id,
        empleadoNombre: s.empleadoNombre || s.empleado?.nombre,
        empleadoId: s.empleadoId,
        fechaInicio: s.fechaInicio,
        fechaFin: s.fechaFin,
        diasSolicitados: s.diasSolicitados,
        motivo: s.motivo,
        fechaSolicitud: s.fechaSolicitud,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              count: formatted.length,
              solicitudes: formatted,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing pending approvals: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Approve a vacation request
server.tool(
  "approve_vacation_request",
  "Approve a vacation request. Changes the status from 'pendiente' to 'aprobada'.",
  {
    solicitudId: z.string().describe("Vacation request UUID"),
    comentarios: z.string().optional().describe("Optional approver comments"),
  },
  async ({ solicitudId, comentarios }) => {
    try {
      const updateData: Record<string, any> = {
        estatus: "aprobada",
        fechaRespuesta: new Date().toISOString(),
      };

      if (comentarios) {
        updateData.comentariosAprobador = comentarios;
      }

      const result = await apiRequest(`/api/vacaciones/${solicitudId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              message: "Solicitud aprobada exitosamente",
              solicitud: {
                id: result.id,
                estatus: result.estatus,
                fechaInicio: result.fechaInicio,
                fechaFin: result.fechaFin,
                diasSolicitados: result.diasSolicitados,
                comentariosAprobador: result.comentariosAprobador,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error approving vacation request: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("HRmax Vacaciones MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
