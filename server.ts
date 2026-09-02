import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

import {
  expressSaftHandler,
  expressOnboardingHandler,
  expressUploadHandler,
  expressCashMovementHandler,
  expressCloseShiftHandler,
  expressSendAuditEmailHandler,
  expressSendShiftReportZEmailHandler,
  productExpressHandlers,
} from "./src/api";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API routes FIRST
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      emailConfigured: !!process.env.RESEND_API_KEY,
      supervisorEmail: process.env.SUPERVISOR_EMAIL || "miguelworscoi@gmail.com",
    });
  });

  app.get("/api/saft", expressSaftHandler);
  app.get("/api/products", productExpressHandlers.getProducts);
  app.post("/api/products", productExpressHandlers.createProduct);
  app.post("/api/onboarding", expressOnboardingHandler);
  app.post("/api/upload/product-image", expressUploadHandler);
  app.post("/api/cash-movements", expressCashMovementHandler);
  app.post("/api/shift-close", expressCloseShiftHandler);
  app.post("/api/email/audit-report", expressSendAuditEmailHandler);
  app.post("/api/email/shift-report-z", expressSendShiftReportZEmailHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
