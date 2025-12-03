import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { migrateLegalCaseStatuses } from "./migrations/migrate-legal-case-statuses";
import { migrateBajaTypes } from "./migrations/migrate-baja-types";
import { seedModulos } from "./seeds/modulos";
import { seedConceptosLegales } from "./seeds/conceptosLegales";
import { seedCatalogosBase } from "./seeds/catalogosBase";
import { mockAuthMiddleware } from "./auth/middleware";

const app = express();

// Health check endpoint - responds immediately for deployment health checks
// This MUST be before any middleware that might delay the response
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use(mockAuthMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Background initialization function for migrations and seeds
async function runBackgroundInitialization() {
  try {
    // Ejecutar migraciones automáticas
    await migrateLegalCaseStatuses();
    await migrateBajaTypes();
    
    // Seed módulos del sistema
    await seedModulos();
    
    // Seed conceptos legales con fórmulas
    await seedConceptosLegales();
    
    // Seed catálogos base (bancos, UMA/SMG)
    await seedCatalogosBase();
    
    log("Background initialization completed successfully");
  } catch (error) {
    console.error("Error during background initialization:", error);
  }
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Run migrations and seeds in the background AFTER server starts
    // This ensures health checks pass immediately while initialization runs
    runBackgroundInitialization();
  });
})();
