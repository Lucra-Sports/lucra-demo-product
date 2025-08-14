import { Response } from "express";
import { db } from "../database";
import logger from "../logger";
import { ExtendedRequest } from "../middlewares";
import {
  CreateBindingRequest,
  BindingCreatedResponse,
  ErrorResponse,
} from "../types";

/**
 * @swagger
 * /bindings:
 *   put:
 *     summary: Create or update user binding
 *     description: Create a new binding or update an existing one for the authenticated user
 *     tags: [Bindings]
 *     security:
 *       - UserAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBindingRequest'
 *     responses:
 *       200:
 *         description: Binding created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBinding'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Binding already exists for this user and type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get user bindings
 *     description: Get all bindings for the authenticated user
 *     tags: [Bindings]
 *     security:
 *       - UserAuth: []
 *     responses:
 *       200:
 *         description: User bindings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserBinding'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /bindings/{type}:
 *   delete:
 *     summary: Delete user binding
 *     description: Delete a specific binding for the authenticated user by type
 *     tags: [Bindings]
 *     security:
 *       - UserAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: The binding type to delete
 *         example: oauth_provider
 *     responses:
 *       200:
 *         description: Binding deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Binding deleted successfully"
 *       400:
 *         description: Invalid request - type is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User or binding not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const createOrUpdateBinding = async (
  req: ExtendedRequest,
  res: Response<BindingCreatedResponse | ErrorResponse>
): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { externalId, type } = req.body as CreateBindingRequest;

    if (!externalId || !type) {
      res.status(400).json({ error: "External ID and type are required" });
      return;
    }

    if (typeof externalId !== "string" || typeof type !== "string") {
      res.status(400).json({ error: "External ID and type must be strings" });
      return;
    }

    // Create or update the binding
    const binding = await db.upsertUserBinding({
      userId,
      externalId: externalId.trim(),
      type: type.trim().toLowerCase(),
    });

    res.json(binding);
  } catch (error) {
    logger.error(`Create binding error: ${(error as Error).message}`);

    // Handle unique constraint errors
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      res
        .status(409)
        .json({ error: "Binding already exists for this user and type" });
      return;
    }

    res.status(500).json({ error: "Internal error" });
  }
};

export const getUserBindings = async (
  req: ExtendedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);

    const bindings = await db.getUserBindings(userId);
    res.json(bindings);
  } catch (error) {
    logger.error(`Get bindings error: ${(error as Error).message}`);
    res.status(500).json({ error: "Internal error" });
  }
};

export const deleteUserBinding = async (
  req: ExtendedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { type } = req.params;

    if (!type) {
      res.status(400).json({ error: "Type is required" });
      return;
    }

    // Check if binding exists
    const existingBinding = await db.findUserBinding(
      userId,
      type.toLowerCase()
    );
    if (!existingBinding) {
      res.status(404).json({ error: "Binding not found" });
      return;
    }

    await db.deleteUserBinding(userId, type.toLowerCase());
    res.json({ message: "Binding deleted successfully" });
  } catch (error) {
    logger.error(`Delete binding error: ${(error as Error).message}`);
    res.status(500).json({ error: "Internal error" });
  }
};
