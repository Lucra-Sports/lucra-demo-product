import { Response } from "express";
import { db } from "../database";
import logger from "../logger";
import { ExtendedRequest } from "../middlewares";
import {
  UpdateProfileRequest,
  UserResponse,
  ErrorResponse,
} from "../types";

/**
 * @swagger
 * /update-profile:
 *   post:
 *     summary: Update user profile
 *     description: Update the profile information of the authenticated user
 *     tags: [Users]
 *     security:
 *       - UserAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request data or email already in use
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const updateProfile = async (
  req: ExtendedRequest,
  res: Response<UserResponse | ErrorResponse>
): Promise<void> => {
  try {
    const userId = parseInt(req.userId!, 10);
    const { fullName, email, address, city, state, zipCode, birthday } =
      req.body as UpdateProfileRequest;

    if (!fullName || !email) {
      res.status(400).json({ error: "Full name and email are required" });
      return;
    }

    // Check if email is being changed to an existing email
    if (email) {
      const existingUser = await db.findUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        res
          .status(400)
          .json({ error: "Email already in use by another account" });
        return;
      }
    }

    const updatedUser = await db.updateUser(userId, {
      fullName,
      address,
      city,
      state,
      zipCode,
      birthday,
    });

    res.json(updatedUser);
  } catch (error) {
    logger.error(`Update profile error: ${(error as Error).message}`);
    res.status(500).json({ error: "Internal error" });
  }
};
