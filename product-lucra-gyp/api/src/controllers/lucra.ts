import { Request, Response } from "express";
import { LucraService } from "../services/lucra-service";
import { BindingService } from "../services/binding-service";
import logger from "../logger";
import { ExtendedRequest } from "../middlewares";

/**
 * @swagger
 * /lucra/webhook:
 *   post:
 *     summary: Create Lucra webhook configuration
 *     description: Configure webhook subscriptions for Lucra API events
 *     tags: [Lucra]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscriptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["FtpMatchupCreated"]
 *               webhookUrl:
 *                 type: string
 *                 example: "https://test.com/lucra-game-matchups"
 *               name:
 *                 type: string
 *                 example: "Free to Play Game Matchups Created"
 *               description:
 *                 type: string
 *                 example: "Sync Game Matchups"
 *               active:
 *                 type: boolean
 *                 example: true
 *               headers:
 *                 type: string
 *                 example: "{\"x-sample-header\": \"sample-value\"}"
 *               expirationDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2030-12-31T00:00:00+00:00"
 *     responses:
 *       200:
 *         description: Webhook configuration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
export const createWebhookConfig = async (req: Request, res: Response) => {
  try {
    const lucraService = LucraService.getInstance();
    const result = await lucraService.createWebhookConfig(req.body);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "Failed to create webhook configuration",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * @swagger
 * /lucra/matchup-event:
 *   post:
 *     summary: Handle Lucra matchup webhook events
 *     description: Process webhook events from Lucra for recreational game matchups
 *     tags: [Lucra]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "17aa9ba8..."
 *               event:
 *                 type: string
 *                 enum: ["RecreationalGameCreated", "RecreationalGameJoined", "RecreationalGameCanceled", "RecreationalGameCompleted"]
 *                 example: "RecreationalGameCreated"
 *               createdByUserId:
 *                 type: string
 *                 example: "user123"
 *               winnerGroupId:
 *                 type: string
 *                 example: "group456"
 *               gameId:
 *                 type: string
 *                 example: "game789"
 *               type:
 *                 type: string
 *                 enum: ["RECREATIONAL_GAME"]
 *                 example: "RECREATIONAL_GAME"
 *               subtype:
 *                 type: string
 *                 enum: ["GROUP_VS_GROUP", "FREE_FOR_ALL"]
 *                 example: "GROUP_VS_GROUP"
 *               buyInAmount:
 *                 type: number
 *                 example: 7
 *               joinedByUserId:
 *                 type: string
 *                 example: "user456"
 *               groups:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     groupId:
 *                       type: string
 *                       example: "group123"
 *                     name:
 *                       type: string
 *                       example: "Team 1"
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: "user789"
 *                           reward:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 enum: ["CASH", "TENANT_REWARD"]
 *                                 example: "CASH"
 *                               value:
 *                                 type: string
 *                                 example: "15"
 *                               metadata:
 *                                 type: string
 *                                 example: "..."
 *     responses:
 *       200:
 *         description: Matchup event processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Matchup event processed successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid webhook payload or missing user bindings
 *       500:
 *         description: Internal server error
 */
export const handleMatchupEvent = async (req: Request, res: Response) => {
  try {
    const lucraService = LucraService.getInstance();
    await lucraService.handleMatchupWebhook(req.body);
    
    res.json({
      message: "Matchup event processed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const statusCode = (error as Error).message.includes('Missing user bindings') ? 400 : 500;
    res.status(statusCode).json({
      error: "Failed to process matchup event",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * @swagger
 * /lucra/user:
 *   get:
 *     summary: Get Lucra user binding
 *     description: Get the Lucra user binding for the authenticated user
 *     tags: [Lucra]
 *     security:
 *       - UserAuth: []
 *     responses:
 *       200:
 *         description: Lucra user binding retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 userId:
 *                   type: integer
 *                   example: 123
 *                 externalId:
 *                   type: string
 *                   example: "lucra_user_456"
 *                 type:
 *                   type: string
 *                   example: "lucra"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lucra user binding not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Create or update Lucra user binding
 *     description: Create or update the Lucra user binding for the authenticated user
 *     tags: [Lucra]
 *     security:
 *       - UserAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               externalId:
 *                 type: string
 *                 description: The Lucra user ID
 *                 example: "lucra_user_456"
 *             required:
 *               - externalId
 *     responses:
 *       200:
 *         description: Lucra user binding created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 userId:
 *                   type: integer
 *                   example: 123
 *                 externalId:
 *                   type: string
 *                   example: "lucra_user_456"
 *                 type:
 *                   type: string
 *                   example: "lucra"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getLucraUserBinding = async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = parseInt(req.userId!, 10);
    
    const bindingService = BindingService.getInstance();
    const binding = await bindingService.getUserBinding(userId, 'lucra');
    
    if (!binding) {
      res.status(404).json({
        error: "Lucra user binding not found",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json(binding);
  } catch (error) {
    logger.error(`Get Lucra user binding error: ${(error as Error).message}`);
    res.status(500).json({
      error: "Failed to get Lucra user binding",
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};

export const createOrUpdateLucraUserBinding = async (req: ExtendedRequest, res: Response) => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { externalId } = req.body;

    const bindingService = BindingService.getInstance();
    const binding = await bindingService.createOrUpdateBinding({
      userId,
      externalId,
      type: 'lucra',
    });

    res.json(binding);
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Create/update Lucra user binding error: ${errorMessage}`);

    if (errorMessage === "External ID and type are required") {
      res.status(400).json({
        error: "External ID is required",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (errorMessage === "External ID and type must be strings") {
      res.status(400).json({
        error: "External ID must be a string",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (errorMessage === "Binding already exists for this user and type") {
      res.status(409).json({
        error: "Lucra user binding already exists",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      error: "Failed to create or update Lucra user binding",
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
};