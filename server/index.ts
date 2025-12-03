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

// Health check for Replit Autoscale - responds at root path
// This intercepts GET / requests that have no Accept header or accept JSON
// Regular browser requests will fall through to the static file handler
app.use((req, res, next) => {
  // Only intercept root path GET requests for health checks
  if (req.method === 'GET' && req.path === '/') {
    const acceptHeader = req.headers.accept || '';
    // Health checks typically don't send Accept header or accept anything
    // Browsers send Accept: text/html,...
    if (!acceptHeader || acceptHeader === '*/*' || acceptHeader.includes('application/json')) {
      // Check if this looks like a health check (no cookies, no referer, etc.)
      if (!req.headers.referer && !req.headers.cookie) {
        return res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
      }
    }
  }
  next();
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
// Only runs in development mode to avoid issues in production
async function runBackgroundInitialization() {
  // Skip seeds in production - they should be run via separate migration scripts
  if (process.env.NODE_ENV === 'production') {
    log("Skipping background initialization in production mode");
    return;
  }
  
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
