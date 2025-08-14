import { Request, Response } from "express";
import { db } from "../database";
import logger from "../logger";
import {
  ErrorResponse,
  LoginRequest,
  SignupRequest,
  SignupResponse,
  UserResponse,
} from "../types";

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
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
export const login = async (
  req: Request<{}, UserResponse | ErrorResponse, LoginRequest>,
  res: Response<UserResponse | ErrorResponse>
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await db.authenticateUser(email, password);

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.json(user);
  } catch (error) {
    logger.error(`Login error: ${(error as Error).message}`);
    res.status(500).json({ error: "Internal error" });
  }
};

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: User registration
 *     description: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Invalid request or email already exists
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
export const signup = async (
  req: Request<{}, SignupResponse | ErrorResponse, SignupRequest>,
  res: Response<SignupResponse | ErrorResponse>
): Promise<void> => {
  try {
    const {
      fullName,
      email,
      password,
      address,
      city,
      state,
      zipCode,
      birthday,
    } = req.body;

    if (!fullName || !email || !password) {
      res
        .status(400)
        .json({ error: "Full name, email, and password are required" });
      return;
    }

    // Check if email already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: "You already have an account" });
      return;
    }

    // Create new user
    const user = await db.createUser({
      fullName,
      email,
      password,
      address,
      city,
      state,
      zipCode,
      birthday,
    });

    res.json({ id: user.id });
  } catch (error) {
    logger.error(`Signup error: ${(error as Error).message}`);
    res.status(500).json({ error: "Internal error" });
  }
};
