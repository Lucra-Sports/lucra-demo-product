import { PrismaClient } from "@prisma/client";
import { getPrisma } from "../database";

interface WebhookConfig {
  subscriptions: string[];
  webhookUrl: string;
  name?: string;
  description?: string;
  active: boolean;
  headers?: string;
  expirationDate?: string;
}

interface WebhookConfigPayload {
  apiKey: string;
  object: WebhookConfig;
}

interface LucraWebhookPayload {
  id: string;
  event:
    | "RecreationalGameCreated"
    | "RecreationalGameJoined"
    | "RecreationalGameCanceled"
    | "RecreationalGameCompleted";
  createdByUserId: string;
  winnerGroupId?: string;
  gameId: string;
  type: "RECREATIONAL_GAME";
  subtype: "GROUP_VS_GROUP" | "FREE_FOR_ALL";
  buyInAmount: number;
  joinedByUserId?: string;
  groups: Array<{
    groupId: string;
    name: string;
    users: Array<{
      userId: string;
      reward: {
        type: "CASH" | "TENANT_REWARD";
        value: string;
        metadata?: string;
      };
    }>;
  }>;
}

export class LucraService {
  private static instance: LucraService;
  private apiUrl: string;
  private apiKey: string;
  private prisma: PrismaClient;

  private constructor() {
    this.apiUrl = process.env.LUCRA_API_URL || "";
    this.apiKey = process.env.LUCRA_API_KEY || "";
    this.prisma = getPrisma();

    if (!this.apiUrl || !this.apiKey) {
      throw new Error(
        "LUCRA_API_URL and LUCRA_API_KEY environment variables are required"
      );
    }
  }

  public static getInstance(): LucraService {
    if (!LucraService.instance) {
      LucraService.instance = new LucraService();
    }
    return LucraService.instance;
  }

  async createWebhookConfig(config: WebhookConfig): Promise<any> {
    const payload: WebhookConfigPayload = {
      apiKey: this.apiKey,
      object: config,
    };

    const response = await fetch(`${this.apiUrl}/api/rest/webhook/configs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create webhook config: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async handleMatchupWebhook(payload: LucraWebhookPayload): Promise<void> {
    try {
      // Store the webhook payload in the lucra_webhooks table
      await this.prisma.lucraWebhook.create({
        data: {
          payload: JSON.stringify(payload),
        },
      });

      // Extract all lucra user IDs from the payload
      const usersWithGroups = payload.groups.flatMap((group) =>
        group.users.map((user) => ({ groupId: group.groupId, ...user }))
      );
      const lucraUserIds = usersWithGroups.map((user) => user.userId);

      // Find corresponding internal user IDs via user_bindings
      const userBindings = await this.prisma.userBinding.findMany({
        where: {
          type: "lucra",
          externalId: {
            in: lucraUserIds,
          },
        },
        select: {
          userId: true,
          externalId: true,
        },
      });

      // Create a map for quick lookup
      const lucraToInternalUserMap = new Map(
        userBindings.map((binding) => [binding.externalId, binding.userId])
      );

      // Create lucra_matchup records for each user in each group
      const matchupRecords = usersWithGroups.map((user) => {
        const userId = lucraToInternalUserMap.get(user.userId);
        if (!userId) {
          throw new Error(
            `Missing user bindings for Lucra user ${user.userId}`
          );
        }
        return {
          matchupId: payload.id,
          groupId: user.groupId,
          userId,
        };
      });

      // Delete existing records for this matchup to ensure Lucra is source of truth
      await this.prisma.lucraMatchup.deleteMany({
        where: {
          matchupId: payload.id,
        },
      });

      // Insert all matchup records
      if (matchupRecords.length > 0) {
        await this.prisma.lucraMatchup.createMany({
          data: matchupRecords,
        });
      }
    } catch (error) {
      throw new Error(
        `Failed to process webhook payload: ${(error as Error).message}`
      );
    }
  }
}
