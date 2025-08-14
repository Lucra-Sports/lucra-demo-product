import { db } from "../database";
import logger from "../logger";

export interface CreateBindingInput {
  userId: number;
  externalId: string;
  type: string;
}

export class BindingService {
  private static instance: BindingService;

  private constructor() {}

  public static getInstance(): BindingService {
    if (!BindingService.instance) {
      BindingService.instance = new BindingService();
    }
    return BindingService.instance;
  }

  async createOrUpdateBinding(input: CreateBindingInput) {
    const { userId, externalId, type } = input;

    // Validate inputs
    if (!externalId || !type) {
      throw new Error("External ID and type are required");
    }

    if (typeof externalId !== "string" || typeof type !== "string") {
      throw new Error("External ID and type must be strings");
    }

    try {
      const binding = await db.upsertUserBinding({
        userId,
        externalId: externalId.trim(),
        type: type.trim().toLowerCase(),
      });

      return binding;
    } catch (error) {
      logger.error(`Create binding error: ${(error as Error).message}`);
      
      // Handle unique constraint errors
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        throw new Error("Binding already exists for this user and type");
      }

      throw new Error("Failed to create or update binding");
    }
  }

  async getUserBindings(userId: number) {
    try {
      const bindings = await db.getUserBindings(userId);
      return bindings;
    } catch (error) {
      logger.error(`Get bindings error: ${(error as Error).message}`);
      throw new Error("Failed to get user bindings");
    }
  }

  async getUserBinding(userId: number, type: string) {
    try {
      const binding = await db.findUserBinding(userId, type.toLowerCase());
      return binding;
    } catch (error) {
      logger.error(`Get binding error: ${(error as Error).message}`);
      throw new Error("Failed to get user binding");
    }
  }

  async deleteUserBinding(userId: number, type: string) {
    if (!type) {
      throw new Error("Type is required");
    }

    try {
      // Check if binding exists
      const existingBinding = await db.findUserBinding(userId, type.toLowerCase());
      if (!existingBinding) {
        throw new Error("Binding not found");
      }

      await db.deleteUserBinding(userId, type.toLowerCase());
      return { message: "Binding deleted successfully" };
    } catch (error) {
      logger.error(`Delete binding error: ${(error as Error).message}`);
      
      if ((error as Error).message === "Binding not found") {
        throw error; // Re-throw specific error
      }
      
      throw new Error("Failed to delete binding");
    }
  }
}