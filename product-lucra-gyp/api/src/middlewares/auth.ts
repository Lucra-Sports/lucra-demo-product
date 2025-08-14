import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import logger from "../logger";
import { AuthenticatedRequest } from "../types";

// Extend Request interface to include userId
export interface ExtendedRequest extends Request, AuthenticatedRequest {}

export function getUserId(req: Request): string | undefined {
  return req.header("rng-user-id");
}

export async function requireUser(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userIdNumber = parseInt(userId, 10);
    if (isNaN(userIdNumber)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const user = await db.findUserById(userIdNumber);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.userId = userId;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${(error as Error).message}`);
    res.status(500).json({ error: "Internal error" });
  }
}
