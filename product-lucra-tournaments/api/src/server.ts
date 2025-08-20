import express, { Application, NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import {
  // Bindings
  createOrUpdateBinding,
  createOrUpdateLucraUserBinding,
  // Lucra
  createWebhookConfig,
  deleteUserBinding,
  // Numbers
  generateRandomNumber,
  getLeaderboard,
  getLucraUserBinding,
  getNumbersHistory,
  getUserBindings,
  getUserStats,
  handleMatchupEvent,
  // Health
  healthCheck,
  // Auth
  login,
  signup,
  // User
  updateProfile,
} from "./controllers";
import { checkDatabaseConnection, disconnectPrisma } from "./database";
import logger from "./logger";
import { requireUser } from "./middlewares";
import { LucraService } from "./services/lucra-service";
import { downloadDatabaseFromS3 } from "./utils/s3-database";

const app: Application = express();
app.use(express.json());

// Initialize Prisma (async initialization moved to startup)

// Basic CORS support for local dev
app.use((req: Request, res: Response, next: NextFunction): void => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, rng-user-id"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Health check endpoints
 *   - name: Authentication
 *     description: User authentication endpoints
 *   - name: Users
 *     description: User management endpoints
 *   - name: Numbers
 *     description: Random number generation and statistics
 *   - name: Bindings
 *     description: External service binding management
 *   - name: Lucra
 *     description: Lucra API webhook configuration
 */

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "RNG API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  })
);

// Swagger JSON endpoint
app.get("/api-docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Health check endpoint
app.get("/health", healthCheck);

// Auth endpoints
app.post("/login", login);
app.post("/signup", signup);

// User endpoints (require authentication)
app.post("/update-profile", requireUser, updateProfile);

// Numbers endpoints (require authentication)
app.get("/rng", requireUser, generateRandomNumber);
app.get("/stats", requireUser, getUserStats);
app.get("/numbers", requireUser, getNumbersHistory);
app.get("/leaderboard", getLeaderboard);

// Bindings endpoints (require authentication)
app.put("/bindings", requireUser, createOrUpdateBinding);
app.get("/bindings", requireUser, getUserBindings);
app.delete("/bindings/:type", requireUser, deleteUserBinding);

// Lucra endpoints
app.post("/lucra/webhook", createWebhookConfig);
app.post("/lucra/matchup-event", handleMatchupEvent);
app.get("/lucra/user", requireUser, getLucraUserBinding);
app.put("/lucra/user", requireUser, createOrUpdateLucraUserBinding);

if (require.main === module) {
  (async (): Promise<void> => {
    try {
      // Download database from S3 first
      await downloadDatabaseFromS3();

      // Check database connection
      const dbHealthy = await checkDatabaseConnection();
      if (!dbHealthy) {
        logger.error("❌ Database connection failed on startup");
        process.exit(1);
      }

      // Initialize Lucra service (validates environment variables)
      try {
        LucraService.getInstance();
        logger.success("✅ Lucra service initialized");
      } catch (error) {
        logger.warn(
          `⚠️  Lucra service initialization failed: ${(error as Error).message}`
        );
        logger.warn("⚠️  Lucra webhook endpoints will not be available");
      }

      const PORT = process.env.PORT || 4000;

      app.listen(PORT, () => {
        logger.success(`🚀 API server listening on port ${PORT}`);
        logger.success("✅ Using Prisma ORM with SQLite");
        logger.info(
          `📚 API Documentation available at: http://localhost:${PORT}/api-docs`
        );
        logger.info(
          `📄 Swagger JSON available at: http://localhost:${PORT}/api-docs.json`
        );

        if (process.env.NODE_ENV === "development") {
          logger.info("🎨 Run 'npm run db:studio' to open Prisma Studio");
        }
      });
    } catch (error) {
      logger.error(`❌ Failed to start server: ${(error as Error).message}`);
      process.exit(1);
    }
  })();

  const shutdown = async (): Promise<void> => {
    logger.info("🛑 Shutting down server...");
    await disconnectPrisma();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

export default app;
