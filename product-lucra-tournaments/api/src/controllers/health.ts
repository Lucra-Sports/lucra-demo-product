import { Request, Response } from "express";
import { checkDatabaseConnection } from "../database";

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check the health status of the API and database connection
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: API is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/HealthResponse'
 *                 - type: object
 *                   properties:
 *                     status:
 *                       example: "unhealthy"
 *                     database:
 *                       example: "disconnected"
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const dbHealthy = await checkDatabaseConnection();
    if (dbHealthy) {
      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "unhealthy",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "error",
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};
